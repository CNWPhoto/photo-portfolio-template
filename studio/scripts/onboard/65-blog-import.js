// 65-blog-import.js — create blogPost docs from .staging/<slug>/blog/posts.json.
//
// Run via sanity exec inside the swapped client env (npm wrapper handles
// the dotenv; runbook shows the .env swap dance, same as 60-overlay):
//   cp studio/.env.<slug>-backup studio/.env
//   cd studio && npx sanity exec scripts/onboard/65-blog-import.js \
//     --with-user-token -- --slug=kelly-mac-studios
//   (restore dev .env after)
//
// Idempotent: each post gets a deterministic _id (blogPost-<postSlug>),
// createOrReplace, cover images SHA-deduped by Sanity. Re-run freely.
// Self-contained (no ESM lib import — runs under esbuild-register/CJS).

import {getCliClient} from 'sanity/cli'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
function getArg(name, {required = false, fallback} = {}) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  const v = hit ? hit.split('=').slice(1).join('=') : fallback
  if (required && !v) throw new Error(`Missing required --${name}=<value>`)
  return v
}
const slug = getArg('slug', {required: true})
// --only / --skip: comma-separated post slugs to limit a run (repairs).
// --repair: for posts whose doc ALREADY exists, patch only `body` instead of
// createOrReplace — preserves categories, cover, excerpt and any other
// editor changes on the doc. New posts are still created in full.
const onlySlugs = (getArg('only', {fallback: ''}) || '').split(',').map((s) => s.trim()).filter(Boolean)
const skipSlugs = (getArg('skip', {fallback: ''}) || '').split(',').map((s) => s.trim()).filter(Boolean)
const repairMode = process.argv.includes('--repair')
const BLOG = path.join(REPO_ROOT, '.staging', slug, 'blog')
const posts = JSON.parse(fs.readFileSync(path.join(BLOG, 'posts.json'), 'utf8'))
const client = getCliClient()

async function withRetry(label, fn, tries = 4) {
  for (let i = 1; i <= tries; i++) {
    try { return await fn() } catch (e) {
      const st = e?.statusCode || e?.response?.statusCode
      if ((st && st < 500 && st !== 429) || i === tries) throw e
      const w = 800 * 2 ** (i - 1)
      console.warn(`  ↻ ${label} (try ${i}/${tries}) retry ${w}ms`)
      await new Promise((r) => setTimeout(r, w))
    }
  }
}
const key = () => Math.random().toString(36).slice(2, 14)
// body items are structured blocks {s:style, li?:'bullet'|'number',
// runs:[{text,marks}]} from 15-scrape-blog / 12-scrape-squarespace, plus
// media items {img:'blog/body/<file>', alt} and {video:url} from the
// Squarespace path. Back-compat: a plain string (older posts.json) → a
// normal paragraph. Async because images upload to Sanity (SHA-deduped,
// so re-runs are free).
async function buildBody(items, postSlug) {
  const out = []
  for (const b of items || []) {
    if (typeof b === 'string') {
      if (!b.trim()) continue
      out.push({
        _key: key(), _type: 'block', style: 'normal', markDefs: [],
        children: [{_key: key(), _type: 'span', text: b, marks: []}],
      })
      continue
    }
    if (b.video) {
      out.push({_key: key(), _type: 'videoEmbed', url: b.video})
      continue
    }
    if (b.img) {
      const abs = path.join(REPO_ROOT, '.staging', slug, b.img)
      if (!fs.existsSync(abs)) {
        console.warn(`  ⚠ ${postSlug}: staged body image missing, skipped: ${b.img}`)
        continue
      }
      const asset = await withRetry(`upload body img ${path.basename(abs)}`, () =>
        client.assets.upload('image', fs.readFileSync(abs), {filename: path.basename(abs)}),
      )
      out.push({
        _key: key(), _type: 'image',
        asset: {_type: 'reference', _ref: asset._id},
        ...(b.alt ? {alt: b.alt} : {}),
      })
      continue
    }
    const runs = (b.runs || []).filter((r) => r && r.text)
    if (!runs.length) continue
    // A run may carry decorator marks ('strong'/'em') AND a link href. Links
    // become Portable Text annotations: one markDef per link, referenced from
    // the span's marks by _key. Without this the scraper's preserved bold/
    // italic/links would be dropped on import (the old flatten behavior).
    const markDefs = []
    const children = runs.map((r) => {
      const marks = Array.isArray(r.marks) ? [...r.marks] : []
      if (r.link) {
        const _key = key()
        markDefs.push({_key, _type: 'link', href: r.link})
        marks.push(_key)
      }
      return {_key: key(), _type: 'span', text: r.text, marks}
    })
    out.push({
      _key: key(), _type: 'block',
      style: b.s || 'normal',
      ...(b.li ? {listItem: b.li, level: 1} : {}),
      markDefs,
      children,
    })
  }
  return out
}

async function main() {
  if (client.config().projectId === 'hx5xgigp')
    throw new Error('Refusing to import blog into hx5xgigp (the demo).')
  console.log(`[blog-import] ${slug} → ${client.config().projectId}: ${posts.length} posts`)

  // Donor-seed drags the donor's demo blog posts along ("This is a test
  // blog post", "Another blog post") with random UUIDs. Ours all use the
  // deterministic id blogPost-<slug>. Anything else is donor cruft —
  // delete it (incl. drafts) so the client's blog is only her real posts.
  const junk = await client.fetch(
    `*[_type=="blogPost" && !(_id match "blogPost-*") && !(_id match "drafts.blogPost-*")]._id`,
  )
  if (junk.length) {
    const ids = [...new Set(junk.flatMap((id) => [id, `drafts.${id}`, id.replace(/^drafts\./, '')]))]
    const tx = client.transaction()
    ids.forEach((id) => tx.delete(id))
    await withRetry('purge donor blog cruft', () => tx.commit())
    console.log(`[blog-import] removed ${junk.length} donor demo blog post(s)`)
  }

  // Categories: create a blogCategory doc per distinct source tag, then
  // assign each post to its own tags below. Deterministic ids so re-runs are
  // idempotent, and the slug matches the scraper's rewritten footer links
  // (/<base>/category/<slug>) so 'browse by category' resolves on the new site.
  const catSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const allTags = [...new Set(posts.flatMap((p) => p.tags || []))]
  for (const name of allTags) {
    const s = catSlug(name)
    await withRetry(`category ${name}`, () =>
      client.createIfNotExists({
        _id: `blogCategory-${s}`,
        _type: 'blogCategory',
        name,
        slug: {_type: 'slug', current: s},
      }),
    )
  }
  if (allTags.length) console.log(`[blog-import] ensured ${allTags.length} categories: ${allTags.join(', ')}`)

  let targets = posts
  if (onlySlugs.length) targets = targets.filter((p) => onlySlugs.includes(p.slug))
  if (skipSlugs.length) targets = targets.filter((p) => !skipSlugs.includes(p.slug))
  if (targets.length !== posts.length) {
    console.log(`[blog-import] filtered ${posts.length} → ${targets.length} posts (only=${onlySlugs.join(',') || '-'} skip=${skipSlugs.join(',') || '-'})`)
  }

  let ok = 0
  for (const p of targets) {
    const docId = `blogPost-${p.slug}`
    const body = await buildBody(p.body, p.slug)
    const categories = (p.tags || []).map((t) => ({
      _type: 'reference', _key: key(), _ref: `blogCategory-${catSlug(t)}`,
    }))

    if (repairMode) {
      const existing = await client.getDocument(docId)
      if (existing) {
        // Existing doc: replace the body, and set categories from source
        // (posts weren't categorized on the first migration). Titles, covers,
        // excerpts and other editor tweaks stay put. Also set the real cover
        // alt (sitemap caption) if the doc has a cover and one was found.
        const patch = {body, ...(categories.length ? {categories} : {}), ...(p.excerpt ? {excerpt: p.excerpt} : {})}
        if (p.coverAlt && existing.coverImage?.asset) patch['coverImage'] = {...existing.coverImage, alt: p.coverAlt}
        await withRetry(`patch body ${p.slug}`, () =>
          client.patch(docId).set(patch).commit(),
        )
        ok++
        console.log(`  ~ ${p.title.slice(0, 60)} (body repaired: ${body.length} blocks, ${categories.length} cats)`)
        continue
      }
    }

    let cover
    if (p.cover) {
      const abs = path.join(REPO_ROOT, '.staging', slug, p.cover)
      if (fs.existsSync(abs)) {
        const asset = await withRetry(`upload ${p.slug}`, () =>
          client.assets.upload('image', fs.readFileSync(abs), {filename: path.basename(abs)}),
        )
        cover = {
          _type: 'image',
          asset: {_type: 'reference', _ref: asset._id},
          // Real alt from the sitemap caption; fall back to the title.
          alt: p.coverAlt || p.title,
        }
      }
    }
    const doc = {
      _id: docId,
      _type: 'blogPost',
      title: p.title,
      slug: {_type: 'slug', current: p.slug},
      publishDate: p.publishDate || new Date().toISOString().slice(0, 10),
      ...(p.excerpt ? {excerpt: p.excerpt} : {}),
      ...(cover ? {coverImage: cover} : {}),
      ...(categories.length ? {categories} : {}),
      body,
    }
    await withRetry(`create ${p.slug}`, () => client.createOrReplace(doc))
    ok++
    console.log(`  + ${p.title.slice(0, 60)} (${doc.publishDate})`)
  }

  // Make sure the blog is switched on so the posts are reachable.
  try {
    await withRetry('enable blog', () =>
      client.patch('blogPage').set({blogEnabled: true}).commit(),
    )
  } catch { /* blogPage may not exist on every donor — non-fatal */ }

  console.log(`[blog-import] done: ${ok}/${targets.length} posts`)
}

main().catch((e) => { console.error('[blog-import] FAILED:', e); process.exit(1) })
