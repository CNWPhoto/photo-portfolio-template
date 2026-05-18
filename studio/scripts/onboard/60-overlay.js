// 60-overlay.js — overlay the client's real content onto the donor clone.
//
// Run via sanity exec inside the swapped env (the runbook / package.json
// script wraps this):
//   cp studio/.env.<slug>-backup studio/.env
//   cd studio && npx sanity exec scripts/onboard/60-overlay.js \
//     --with-user-token -- --slug=kelly-mac-studios --palette=forest-sage
//   (restore dev .env after)
//
// Universal patches only — the brand-identity + media bulk that's
// painful by hand. Section-level prose stays as donor defaults for the
// editor to polish in Studio (matches "auto-draft, human edits").
//
// Tolerant: any content.json value still "TODO"/"TODO_*"/null/empty is
// SKIPPED, so a partially-filled content.json patches what's ready and
// leaves the rest. Re-runnable.

import {getCliClient} from 'sanity/cli'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

// NOTE: this script runs via `sanity exec` (esbuild-register / CJS), which
// cannot import the ESM ../onboard/lib.js the way the plain-`node` scripts
// (10–50, 70, 80) do. So the few helpers it needs are inlined here. Keep
// PALETTES in sync with lib.js by hand (rarely changes).
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const SLUG_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
function assertSlug(s) {
  if (!s || !SLUG_RE.test(s)) throw new Error(`Invalid slug "${s}"`)
  return s
}
function getArg(name, {required = false, fallback} = {}) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  const val = hit ? hit.split('=').slice(1).join('=') : fallback
  if (required && !val) throw new Error(`Missing required --${name}=<value>`)
  return val
}
const stagingDir = (s) => path.join(REPO_ROOT, '.staging', s)
const PALETTES = {
  'classic-cream': 1, 'warm-studio': 1, 'dark-editorial': 1,
  'cool-minimal': 1, 'forest-sage': 1,
}

const slug = assertSlug(getArg('slug', {required: true}))
const palette = getArg('palette', {fallback: ''})
if (palette && !PALETTES[palette]) {
  throw new Error(`Unknown --palette "${palette}". Known: ${Object.keys(PALETTES).join(', ')}`)
}

const STAGE = stagingDir(slug)
const CONTENT = JSON.parse(fs.readFileSync(path.join(STAGE, 'content.json'), 'utf8'))
const ALT = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(STAGE, 'manifest/asset-alt.json'), 'utf8')) }
  catch { return {} }
})()

const client = getCliClient()

// Sanity occasionally returns a transient upstream 5xx under rapid bulk
// asset uploads. Retry with backoff so a 25-image overlay doesn't die
// halfway. Re-running the whole script is safe too, but this avoids the
// manual re-run for the common transient case.
async function withRetry(label, fn, tries = 4) {
  let lastErr
  for (let i = 1; i <= tries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      const status = e?.statusCode || e?.response?.statusCode
      const transient = !status || status >= 500 || status === 429
      if (!transient || i === tries) throw e
      const wait = 800 * 2 ** (i - 1)
      console.warn(`  ↻ ${label} failed (try ${i}/${tries}, ${status || 'no status'}) — retrying in ${wait}ms`)
      await new Promise((r) => setTimeout(r, wait))
    }
  }
  throw lastErr
}

function ready(v) {
  if (v == null) return false
  if (typeof v === 'string') return v.trim() !== '' && !/^TODO(_|$| |—|-)/.test(v.trim())
  if (Array.isArray(v)) return v.length > 0 && v.some(ready)
  return true
}
const uploaded = {}
async function upload(rel) {
  if (!rel || !ready(rel)) return null
  if (uploaded[rel]) return uploaded[rel]
  const abs = path.join(STAGE, rel)
  if (!fs.existsSync(abs)) { console.warn(`  ⚠ missing ${rel}`); return null }
  const asset = await withRetry(`upload ${path.basename(rel)}`, () =>
    client.assets.upload('image', fs.readFileSync(abs), {filename: path.basename(rel)}),
  )
  uploaded[rel] = asset._id
  return asset._id
}
async function img(rel, fallbackAlt) {
  const id = await upload(rel)
  if (!id) return undefined
  const alt = ALT[rel] || fallbackAlt
  return {_type: 'image', asset: {_type: 'reference', _ref: id}, ...(alt ? {alt} : {})}
}
const set = (id, patch) => withRetry(`patch ${id}`, () => client.patch(id).set(patch).commit())
const create = (doc) => withRetry(`create ${doc._type}`, () => client.create(doc))
const createOrReplace = (doc) => withRetry(`createOrReplace ${doc._id}`, () => client.createOrReplace(doc))
const commitTx = (tx) => withRetry('transaction', () => tx.commit())

async function main() {
  if (client.config().projectId === 'hx5xgigp')
    throw new Error('Refusing to overlay onto hx5xgigp (the demo). Wrong .env active.')
  console.log(`[overlay] ${slug} → project ${client.config().projectId}`)

  // ── siteSettings ──
  const ss = CONTENT.siteSettings || {}
  const sitePatch = {demo: {isDemo: false}, web3formsKey: ''}
  if (ready(ss.studioName)) sitePatch.siteName = ss.studioName
  if (ready(ss.studioPhotographer)) sitePatch.photographerName = ss.studioPhotographer
  if (palette) sitePatch.defaultPalette = palette
  await set('siteSettings', sitePatch)
  const fav = await img(ss.favicon)
  if (fav) await set('siteSettings', {favicon: fav})
  console.log(`[overlay] siteSettings ${palette ? `(palette ${palette})` : ''}`)

  // ── social ──
  const so = CONTENT.social || {}
  const soPatch = {}
  for (const k of ['facebook', 'instagram', 'tiktok', 'youtube'])
    if (ready(so[k])) soPatch[k] = so[k]
  if (Object.keys(soPatch).length) { await set('socialSettings', soPatch); console.log('[overlay] socialSettings') }

  // ── seo ──
  const seo = CONTENT.seo || {}
  const seoPatch = {}
  if (ready(seo.defaultTitle)) seoPatch.defaultTitle = seo.defaultTitle
  if (ready(seo.defaultDescription)) seoPatch.defaultDescription = seo.defaultDescription
  const og = await img(seo.socialImage)
  if (og) seoPatch.defaultSocialImage = og
  if (Object.keys(seoPatch).length) { await set('seoSettings', seoPatch); console.log('[overlay] seoSettings') }

  // ── homepage hero + intro ──
  const hp = CONTENT.homepage || {}
  if (hp.hero && ready(hp.hero.heading)) {
    const heroImg = await img(hp.hero.imageAsset, `${ss.studioName || ''} hero`)
    const hero = await client.fetch(`*[_id=="homepagePage"][0].sections[_type=="heroSection"][0]._key`)
    if (hero) {
      const patch = {
        [`sections[_key=="${hero}"].heading`]: hp.hero.heading,
      }
      if (ready(hp.hero.subheading)) patch[`sections[_key=="${hero}"].subheading`] = hp.hero.subheading
      if (heroImg) patch[`sections[_key=="${hero}"].images`] = [{_key: Math.random().toString(36).slice(2, 12), ...heroImg}]
      await set('homepagePage', patch)
      console.log('[overlay] homepage hero')
    }
  }

  // ── testimonials (replace all) ──
  const ts = (CONTENT.testimonials || []).filter((t) => ready(t.quote) && ready(t.client))
  if (ts.length) {
    const existing = await client.fetch(`*[_type=="testimonial"]._id`)
    const tx = client.transaction()
    existing.forEach((id) => tx.delete(id))
    if (existing.length) await commitTx(tx)
    let order = 1
    for (const t of ts) {
      const portrait = t.imageAsset ? await img(t.imageAsset) : null
      await create({
        _type: 'testimonial', testimonial: t.quote, client: t.client, order: order++,
        ...(t.starRating ? {starRating: t.starRating} : {}),
        ...(t.source ? {source: t.source} : {}),
        ...(portrait ? {image: portrait} : {}),
      })
    }
    console.log(`[overlay] testimonials: ${ts.length}`)
  }

  // ── portfolio categories + items ──
  const pf = CONTENT.portfolio || {}
  if (pf.categories && pf.categories.length) {
    const cats = await client.fetch(`*[_type=="portfolioCategory"]._id`)
    const items = await client.fetch(`*[_type=="portfolioItem"]._id`)
    const txd = client.transaction()
    ;[...cats, ...items].forEach((id) => txd.delete(id))
    if (cats.length + items.length) await commitTx(txd)
    const catId = {}
    for (const c of pf.categories) {
      const id = `portfolioCategory-${c.slug}`
      await createOrReplace({
        _type: 'portfolioCategory', _id: id, title: c.name,
        slug: {_type: 'slug', current: c.slug},
        ...(ready(c.description) ? {description: c.description} : {}),
      })
      catId[c.slug] = id
    }
    let n = 1
    for (const [folder, target] of Object.entries(pf.imageMap || {})) {
      const dir = path.join(STAGE, folder.replace(/\/$/, ''))
      // imageMap value is the destination category slug. Honor it; fall
      // back to the first category only if it's unknown.
      const useCat = catId[target] || catId[Object.keys(catId)[0]]
      if (!catId[target]) {
        console.warn(`  ⚠ imageMap target "${target}" not a known category — using ${Object.keys(catId)[0]}`)
      }
      if (!fs.existsSync(dir)) continue
      for (const f of fs.readdirSync(dir).sort()) {
        if (f.startsWith('.')) continue
        const rel = `${folder.replace(/\/$/, '')}/${f}`
        const image = await img(rel)
        if (!image) continue
        await create({
          _type: 'portfolioItem',
          title: image.alt || f.replace(/\.[a-z]+$/i, '').replace(/[-_]+/g, ' '),
          slug: {_type: 'slug', current: f.replace(/\.[a-z]+$/i, '').toLowerCase()},
          category: {_type: 'reference', _ref: useCat},
          image, order: n++,
        })
      }
    }
    console.log(`[overlay] portfolio: ${pf.categories.length} categories, ${n - 1} items`)
  }

  console.log(`[overlay] done. Review https://${slug}.sanity.studio/`)
}

main().catch((e) => { console.error('[overlay] FAILED:', e); process.exit(1) })
