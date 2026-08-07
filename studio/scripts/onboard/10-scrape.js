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

function decodeEntities(s) {
  return String(s || '')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
}

// <meta property="og:x" content="…"> in either attribute order.
function meta(html, prop) {
  const pat = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`,
    'i',
  )
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`,
    'i',
  )
  return decodeEntities((html.match(pat) || html.match(alt) || [])[1] || '')
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

// Last-resort slug guesses. ONLY used when a site publishes neither a WP REST
// pages endpoint nor a sitemap — i.e. almost never. This list used to be the
// ONLY discovery mechanism, which is how a migration silently ships one page:
// Chaltron Photography's nine pages are all named for what they rank for
// (/family-photography-ludington/, /wanderlust/, /booknow/), so the guess list
// matched the homepage and nothing else — 490 of 6,421 words, and the operator
// sees a manifest that looks populated. 12-scrape-squarespace.js was written to
// route around this rather than fix it, which left WordPress — the platform
// these guesses were named for — on the broken path.
const GUESS_SLUGS = ['', 'about', 'about-me', 'info', 'pricing', 'investment',
  'services', 'contact', 'portfolio', 'galleries']

async function harvestWpPages() {
  // WordPress REST: authoritative page list AND Yoast's per-page SEO, which is
  // more reliable than re-deriving it from <title>/og: tags in the markup.
  const probe = await fetch(`${origin}/wp-json/wp/v2/pages?per_page=100&page=1`, {headers: UA})
  if (!probe.ok) return null
  const total = Number(probe.headers.get('x-wp-totalpages') || '1')
  const items = []
  for (let p = 1; p <= total; p++) {
    const batch = await fetchJson(`${origin}/wp-json/wp/v2/pages?per_page=100&page=${p}`)
    if (Array.isArray(batch)) items.push(...batch)
  }
  if (!items.length) return null
  return items
    .filter((i) => i.status === undefined || i.status === 'publish')
    .map((i) => ({
      url: i.link,
      yoastTitle: (i.yoast_head_json && i.yoast_head_json.title) || '',
      yoastDesc: (i.yoast_head_json && i.yoast_head_json.description) || '',
    }))
}

async function harvestSitemapPages() {
  // Same index-aware walk as harvestImageSitemap, but collecting page <loc>s.
  async function pull(u) {
    const xml = await fetchText(u)
    if (!xml) return []
    if (/<sitemapindex/i.test(xml)) {
      const children = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1])
      const all = []
      for (const c of children) all.push(...(await pull(c)))
      return all
    }
    return [...xml.matchAll(/<url>[\s\S]*?<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim())
  }
  return pull(`${origin}/sitemap.xml`)
}

function pageTextFrom(html) {
  // Drop chrome so each page's dump is what's UNIQUE to it. Nav and footer
  // repeat on every page; leaving them in makes a thin page look substantial
  // and buries the real copy the human has to mine.
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(nav|header|footer)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

async function scrapePagesText() {
  // Discover the REAL page list, then dump full copy for every one of them.
  // Order matters: WP REST carries Yoast SEO, the sitemap is the cross-platform
  // fallback, and guessing is the admission of defeat.
  let discovered = []
  let how = ''
  const wp = await harvestWpPages()
  if (wp && wp.length) {
    discovered = wp
    how = 'wp-rest'
  } else {
    const urls = await harvestSitemapPages()
    if (urls.length) {
      discovered = urls.map((u) => ({url: u}))
      how = 'sitemap'
    } else {
      discovered = GUESS_SLUGS.map((s) => ({url: s ? `${origin}/${s}/` : `${origin}/`}))
      how = 'guessed slugs'
    }
  }
  // Same-origin, de-duped, and no feed/media URLs.
  const seen = new Set()
  discovered = discovered.filter((d) => {
    if (!d.url || !d.url.startsWith(origin)) return false
    if (/\.(xml|json|jpe?g|png|webp|pdf)$/i.test(d.url)) return false
    const k = d.url.replace(/\/$/, '')
    return !seen.has(k) && seen.add(k)
  })
  log('scrape', `pages: ${discovered.length} discovered via ${how}`)
  if (how === 'guessed slugs') {
    log('scrape', 'WARNING: no page list found — copy harvest is a guess, verify by hand')
  }

  const pages = {}
  for (const d of discovered) {
    const html = await fetchText(d.url)
    if (!html) continue
    const key = d.url.replace(origin, '').replace(/^\/|\/$/g, '') || 'home'
    const titleTag = decodeEntities(
      (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '',
    )
    const text = pageTextFrom(html)
    if (text.length < 40) continue
    pages[key] = {
      url: d.url,
      title: d.yoastTitle || meta(html, 'og:title'),
      titleTag: d.yoastTitle || titleTag,
      description: d.yoastDesc || meta(html, 'og:description'),
      // Structure the human needs to rebuild the page faithfully.
      headings: [...html.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({
        level: Number(m[1]),
        text: decodeEntities(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(),
      })).filter((h) => h.text),
      images: [...new Set(
        [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1])
          .filter((u) => /wp-content\/uploads|\/assets\/|images\//i.test(u)),
      )],
      // Generous cap: the old 4000-char limit truncated any real legal page —
      // Chaltron's privacy policy alone is ~22k characters.
      text: text.slice(0, 60000),
    }
    log('scrape', `page ${key}: ${text.length} chars, ${pages[key].images.length} img`)
  }
  return pages
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
  // pages-text.json is the shape 67-page-seo.js consumes ({slug: {title,
  // titleTag, description, text}}). Only 12-scrape-squarespace wrote it, so
  // WordPress clients reached the SEO backfill with no input at all and
  // silently got no meta descriptions.
  fs.writeFileSync(
    path.join(MANI, 'pages-text.json'),
    JSON.stringify(textDump, null, 2),
  )
  // page-text.json keeps the older flat {slug: text} shape — REVIEW.md points
  // the human at it for the copy pass.
  fs.writeFileSync(
    path.join(MANI, 'page-text.json'),
    JSON.stringify(
      Object.fromEntries(Object.entries(textDump).map(([k, v]) => [k, v.text])),
      null,
      2,
    ),
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
    // phone/city/state/areaServed feed seoSettings, which is the entire
    // LocalBusiness block in the structured data — the thing that gets a local
    // photographer into map/"near me" results. Prompted here because leaving
    // them to a later manual pass meant they were simply never filled in.
    contact: {
      email: 'TODO',
      hours: 'TODO',
      phone: 'TODO',
      city: 'TODO',
      state: 'TODO',
      areaServed: 'TODO_COMMA_SEPARATED_CITIES',
    },
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
      // Applied to homepagePage.seo — there are no site-wide default
      // title/description fields, so these are the homepage's own.
      defaultTitle: 'TODO',
      defaultDescription: 'TODO',
      // Becomes seoSettings.defaultOgImage — the site-wide fallback so pages
      // without their own share image don't post as blank cards.
      socialImage: downloaded.gallery && downloaded.gallery[0] ? downloaded.gallery[0] : null,
      priceRange: 'TODO_$_TO_$$$$',
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
