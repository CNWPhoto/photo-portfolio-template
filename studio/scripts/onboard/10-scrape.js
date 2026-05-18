// 10-scrape.js — harvest an existing site into .staging/<slug>/.
//
//   node studio/scripts/onboard/10-scrape.js \
//     --slug=kelly-mac-studios \
//     --url=https://www.kellymacstudios.com/ \
//     [--niche=pet] [--max-per-bucket=25]
//
// What it automates (the tedious part): pulling the full media library
// from a WordPress site's REST API, classifying images into buckets by
// filename keywords, downloading a curated subset, and scaffolding a
// content.json + REVIEW.md.
//
// What it deliberately does NOT do: write finished marketing copy. The
// content.json is a SKELETON with raw page-text dumps for the human to
// mine. Per the onboarding decision: auto-draft, human edits before the
// overlay runs. REVIEW.md is the punch list of what to fill in.

import fs from 'node:fs'
import path from 'node:path'
import {assertSlug, getArg, stagingDir, log} from './lib.js'

const slug = assertSlug(getArg('slug', {required: true}))
const url = getArg('url', {required: true})
const niche = getArg('niche', {fallback: 'generic'})
const maxPerBucket = Number(getArg('max-per-bucket', {fallback: '25'}))

const origin = new URL(url).origin
const STAGE = stagingDir(slug)
const ORIG = path.join(STAGE, 'originals')
const MANI = path.join(STAGE, 'manifest')
for (const d of [STAGE, ORIG, MANI]) fs.mkdirSync(d, {recursive: true})

const UA = {'User-Agent': 'Mozilla/5.0 (onboarding-scrape)'}

// Bucket keyword sets. Generic defaults + niche-specific extra keywords.
// Order matters — first match wins, so chrome/logo before photos.
const NICHE_KW = {
  pet: ['dog', 'puppy', 'cat', 'kitten', 'pet', 'horse', 'equine', 'animal'],
  family: ['family', 'children', 'child', 'kids', 'baby', 'newborn', 'couple'],
  wedding: ['wedding', 'bride', 'groom', 'engagement', 'elopement'],
  generic: [],
}
function classify(fileName) {
  const f = fileName.toLowerCase()
  if (/logo|favicon|icon-?\d|brandmark|wordmark/.test(f)) return 'logo'
  if (/headshot|about|-me-|photographer|portrait-of/.test(f)) return 'about'
  if (/flower|divider|texture|pattern|badge|stroke|social|fb-|insta/.test(f))
    return 'decorative'
  if (/album|canvas|wall-?art|product|print|frame/.test(f)) return 'products'
  const kws = NICHE_KW[niche] || NICHE_KW.generic
  if (kws.some((k) => f.includes(k))) return 'gallery'
  if (/\.(jpe?g)$/.test(f)) return 'gallery' // default real photos to gallery
  return 'skip'
}

async function fetchJson(u) {
  const r = await fetch(u, {headers: UA})
  if (!r.ok) throw new Error(`${r.status} on ${u}`)
  return r.json()
}
async function fetchText(u) {
  const r = await fetch(u, {headers: UA})
  if (!r.ok) return ''
  return r.text()
}

async function harvestImageSitemap() {
  // Pixieset / Pic-Time / many photographer platforms publish a Google
  // image sitemap: every page <url> carries <image:loc> + <image:caption>
  // (caption is alt text the photographer wrote — high-value). Handles a
  // sitemap index that points at child sitemaps too.
  async function pull(u) {
    const xml = await fetchText(u)
    if (!xml) return []
    // sitemap index → recurse
    if (/<sitemapindex/i.test(xml)) {
      const children = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1])
      const all = []
      for (const c of children) all.push(...(await pull(c)))
      return all
    }
    const out = []
    // split into <url> blocks so each image keeps its parent page context
    for (const block of xml.split(/<url>/i).slice(1)) {
      const pageM = block.match(/<loc>\s*([^<]+?)\s*<\/loc>/i)
      const page = pageM ? pageM[1] : ''
      for (const im of block.matchAll(
        /<image:image>([\s\S]*?)<\/image:image>/gi,
      )) {
        const loc = (im[1].match(/<image:loc>\s*([^<]+?)\s*<\/image:loc>/i) || [])[1]
        const cap = (im[1].match(/<image:caption>\s*([\s\S]*?)\s*<\/image:caption>/i) || [])[1]
        if (loc) out.push({url: loc.trim(), alt: (cap || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim(), title: '', page, date: ''})
      }
    }
    return out
  }
  const items = await pull(`${origin}/sitemap.xml`)
  if (!items.length) return null
  // de-dupe by URL
  const seen = new Set()
  return items.filter((i) => !seen.has(i.url) && seen.add(i.url))
}

async function harvestWpMedia() {
  // Probe page 1 to read X-WP-TotalPages
  const probe = await fetch(`${origin}/wp-json/wp/v2/media?per_page=100&page=1`, {
    headers: UA,
  })
  if (!probe.ok) return null
  const pages = Number(probe.headers.get('x-wp-totalpages') || '1')
  const items = []
  for (let p = 1; p <= pages; p++) {
    const batch = await fetchJson(
      `${origin}/wp-json/wp/v2/media?per_page=100&page=${p}`,
    )
    items.push(...batch)
  }
  return items.map((i) => ({
    id: i.id,
    url: i.source_url,
    alt: i.alt_text || '',
    title: (i.title && i.title.rendered) || '',
    mime: i.mime_type,
    w: i.media_details && i.media_details.width,
    h: i.media_details && i.media_details.height,
    date: i.date,
  }))
}

async function download(u, dest) {
  try {
    const parsed = new URL(u)
    const safe = encodeURI(decodeURI(parsed.href))
    const r = await fetch(safe, {headers: UA})
    if (!r.ok) return false
    const buf = Buffer.from(await r.arrayBuffer())
    fs.writeFileSync(dest, buf)
    return buf.length
  } catch {
    return false
  }
}

async function scrapePagesText() {
  // Best-effort copy harvest: pull the homepage + common slugs, strip tags,
  // dump the visible text for the human to mine into content.json.
  const slugs = ['', 'about', 'about-me', 'info', 'pricing', 'investment',
    'services', 'contact', 'portfolio', 'galleries']
  const dump = {}
  for (const s of slugs) {
    const pageUrl = s ? `${origin}/${s}/` : `${origin}/`
    const html = await fetchText(pageUrl)
    if (!html) continue
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (text.length > 120) dump[s || 'home'] = text.slice(0, 4000)
  }
  return dump
}

async function main() {
  log('scrape', `slug=${slug} url=${url} niche=${niche}`)

  // Source priority: WP REST API → image sitemap → homepage <img> scrape.
  let media = await harvestWpMedia()
  let source = 'wp-rest'
  if (!media) {
    media = await harvestImageSitemap()
    source = 'image-sitemap'
  }
  const buckets = {logo: [], about: [], products: [], gallery: [], decorative: [], skip: []}

  if (media) {
    log('scrape', `${source} → ${media.length} media items`)
    fs.writeFileSync(
      path.join(MANI, 'all-media.json'),
      JSON.stringify(media, null, 2),
    )
    for (const m of media) {
      const fn = decodeURIComponent((m.url || '').split('/').pop() || '')
      buckets[classify(fn)].push(m)
    }
  } else {
    log('scrape', 'No WP REST / sitemap — falling back to homepage <img> scrape')
    const html = await fetchText(url)
    const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map(
      (x) => x[1],
    )
    for (let u of imgs) {
      if (u.startsWith('//')) u = 'https:' + u
      if (u.startsWith('/')) u = origin + u
      const fn = decodeURIComponent(u.split('/').pop() || '')
      buckets[classify(fn)].push({url: u, alt: '', title: '', date: ''})
    }
  }

  // Download curated subset per bucket (newest first when dates exist).
  // assetAlt maps staged path → caption/alt the photographer wrote, so the
  // overlay can use real alt text instead of a derived-from-filename guess.
  const downloaded = {}
  const assetAlt = {}
  for (const [b, list] of Object.entries(buckets)) {
    if (b === 'skip' || b === 'decorative') continue
    const sorted = [...list].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    const take = b === 'logo' || b === 'about' ? sorted.slice(0, 4) : sorted.slice(0, maxPerBucket)
    const dir = path.join(ORIG, b)
    fs.mkdirSync(dir, {recursive: true})
    downloaded[b] = []
    for (const m of take) {
      const fn = decodeURIComponent((m.url || '').split('/').pop() || '').replace(/\s+/g, '_')
      const dest = path.join(dir, fn)
      const rel = `originals/${b}/${fn}`
      if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
        downloaded[b].push(rel)
        if (m.alt) assetAlt[rel] = m.alt
        continue
      }
      const size = await download(m.url, dest)
      if (size) {
        downloaded[b].push(rel)
        if (m.alt) assetAlt[rel] = m.alt
      }
    }
    log('scrape', `${b}: ${downloaded[b].length} downloaded`)
  }
  fs.writeFileSync(path.join(MANI, 'asset-alt.json'), JSON.stringify(assetAlt, null, 2))

  const textDump = await scrapePagesText()
  fs.writeFileSync(
    path.join(MANI, 'page-text.json'),
    JSON.stringify(textDump, null, 2),
  )

  // content.json SKELETON — structure only, raw values for human to refine.
  const skeleton = {
    client: {
      slug,
      name: 'TODO — display name',
      photographer: 'TODO — photographer name',
      niche,
      currentSite: url,
      scrapedAt: new Date().toISOString().slice(0, 10),
    },
    siteSettings: {
      studioName: 'TODO',
      studioPhotographer: 'TODO',
      location: 'TODO',
      serviceArea: 'TODO',
      logoAsset: downloaded.logo && downloaded.logo[0] ? downloaded.logo[0] : null,
      favicon: downloaded.logo && downloaded.logo[1] ? downloaded.logo[1] : null,
    },
    social: {facebook: 'TODO', instagram: 'TODO'},
    contact: {email: 'TODO', hours: 'TODO'},
    homepage: {
      hero: {
        heading: 'TODO',
        subheading: 'TODO',
        imageAsset: downloaded.gallery && downloaded.gallery[0] ? downloaded.gallery[0] : null,
        ctaText: 'Inquire',
      },
      intro: {eyebrow: 'TODO', heading: 'TODO', body: 'TODO', imageAsset: downloaded.about && downloaded.about[0] ? downloaded.about[0] : null},
      testimonialsHeading: 'What Clients Are Saying',
    },
    about: {heading: 'TODO', body: ['TODO'], pullQuote: {quote: 'TODO', attribution: ''}},
    testimonials: [{client: 'TODO', quote: 'TODO', source: 'direct', starRating: 5}],
    portfolio: {
      categories: [{slug: 'gallery', name: 'Gallery', description: 'TODO'}],
      imageMap: {gallery: 'originals/gallery/'},
    },
    seo: {
      siteUrl: 'TODO_AFTER_DOMAIN',
      defaultTitle: 'TODO',
      defaultDescription: 'TODO',
      socialImage: downloaded.gallery && downloaded.gallery[0] ? downloaded.gallery[0] : null,
    },
  }
  const contentPath = path.join(STAGE, 'content.json')
  if (fs.existsSync(contentPath)) {
    log('scrape', 'content.json already exists — wrote content.skeleton.json instead (not overwriting your edits)')
    fs.writeFileSync(path.join(STAGE, 'content.skeleton.json'), JSON.stringify(skeleton, null, 2))
  } else {
    fs.writeFileSync(contentPath, JSON.stringify(skeleton, null, 2))
  }

  const counts = Object.fromEntries(
    Object.entries(downloaded).map(([k, v]) => [k, v.length]),
  )
  fs.writeFileSync(
    path.join(STAGE, 'REVIEW.md'),
    `# ${slug} — content review checklist

Scraped from ${url} on ${new Date().toISOString().slice(0, 10)}.

## Downloaded assets
${Object.entries(counts).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

## Before running 60-overlay.js you MUST:

- [ ] Fill every \`TODO\` in content.json (voice/copy pass — mine manifest/page-text.json for raw copy)
- [ ] Pick the hero image (currently \`${skeleton.homepage.hero.imageAsset || 'NONE — set one'}\`)
- [ ] Confirm logo + favicon assets in siteSettings
- [ ] Replace placeholder testimonials with real ones (+ attribution)
- [ ] Set portfolio categories to match her actual galleries
- [ ] Confirm social + contact details
- [ ] Decide which gallery images make the cut (review originals/gallery/)

## Raw material
- manifest/all-media.json — full media catalog
- manifest/page-text.json — stripped page copy, keyed by slug
- originals/ — downloaded images by bucket

## Notes
- Niche keyword set used: \`${niche}\`
- Re-running this script will NOT overwrite an edited content.json
  (it writes content.skeleton.json instead).
`,
  )

  log('scrape', `done → ${STAGE}`)
  log('scrape', `NEXT: edit content.json (see REVIEW.md), then run 20-env.js`)
}

main().catch((e) => {
  console.error('[scrape] FAILED:', e.message)
  process.exit(1)
})
