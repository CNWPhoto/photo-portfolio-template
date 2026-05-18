// 15-scrape-blog.js — harvest an existing blog into .staging/<slug>/blog/.
//
//   node studio/scripts/onboard/15-scrape-blog.js \
//     --slug=kelly-mac-studios --url=https://www.kellymacstudios.com/ \
//     [--limit=0]   (0 = all posts)
//
// Reads the sitemap, finds /blog/<post>/ URLs, and for each post pulls
// title / date / excerpt / cover image / best-effort body text from the
// og: tags + visible content. Output:
//   .staging/<slug>/blog/posts.json   (array, ready for 65-blog-import)
//   .staging/<slug>/blog/covers/      (downloaded cover images)
//
// Body is extracted as plain paragraphs — Pixieset/Squarespace markup is
// too irregular to recover headings/inline formatting reliably. 65-blog-
// import turns these into Portable Text blocks. Real text + cover + date
// for 40 posts is a massive head start; a post she wants pixel-perfect
// gets a Studio polish later. (auto-draft, human edits.)

import fs from 'node:fs'
import path from 'node:path'
import {assertSlug, getArg, stagingDir, log} from './lib.js'

const slug = assertSlug(getArg('slug', {required: true}))
const url = getArg('url', {required: true})
const limit = Number(getArg('limit', {fallback: '0'}))
const origin = new URL(url).origin

const BLOG = path.join(stagingDir(slug), 'blog')
const COVERS = path.join(BLOG, 'covers')
fs.mkdirSync(COVERS, {recursive: true})
const UA = {'User-Agent': 'Mozilla/5.0 (onboarding-blog-scrape)'}

const NAMED = {
  amp: '&', nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>',
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–',
  mdash: '—', hellip: '…',
}
const dec = (s) =>
  (s || '')
    // numeric (decimal &#039; / &#39; and hex &#x27;) — handles Pixieset's
    // zero-padded entities the old hardcoded list missed.
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED[name.toLowerCase()] ?? m)
    // &amp; last in case earlier passes exposed e.g. &amp;#039;
    .replace(/&amp;/g, '&')
    .trim()

async function text(u) {
  const r = await fetch(u, {headers: UA})
  return r.ok ? r.text() : ''
}
const meta = (h, prop) =>
  dec(
    (h.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, 'i'),
    ) || [])[1] || '',
  )

function parseDate(body) {
  // Pixieset shows "January 16, 2026" right under the H1.
  const m = body.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/,
  )
  if (!m) return null
  const d = new Date(m[0])
  return isNaN(d) ? null : d.toISOString().slice(0, 10)
}

function bodyParagraphs(html, title) {
  let b = html
    .replace(/<(script|style|nav|header|footer|form)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|br)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
  b = dec(b).replace(/[ \t]+/g, ' ')
  // Drop everything up to and including the date line (chrome + title).
  const dm = b.match(
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/,
  )
  if (dm) b = b.slice(b.indexOf(dm[0]) + dm[0].length)
  // Cut common footer boilerplate.
  for (const stop of ['Join the VIP', '© ', 'All Rights Reserved', 'Kelly Mac Studios Home', 'Read More', 'Previous Post', 'Next Post']) {
    const i = b.indexOf(stop)
    if (i > 200) b = b.slice(0, i)
  }
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')
  const nt = norm(title)
  return b
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && norm(s) !== nt) // drop the repeated title line (case/punct-insensitive)
    .slice(0, 60)
}

async function dl(u, dest) {
  try {
    const r = await fetch(encodeURI(decodeURI(u)), {headers: UA})
    if (!r.ok) return false
    fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()))
    return true
  } catch {
    return false
  }
}

async function main() {
  const xml = await text(`${origin}/sitemap.xml`)
  const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1])
  let posts = [...new Set(locs)].filter(
    (l) => /\/blog\/[^/]+\/?$/.test(l) && !/\/blog\/?$/.test(l),
  )
  if (limit > 0) posts = posts.slice(0, limit)
  log('blog', `${posts.length} blog posts found`)

  const out = []
  for (const p of posts) {
    const html = await text(p)
    if (!html) {
      log('blog', `skip (fetch failed): ${p}`)
      continue
    }
    const rawTitle = meta(html, 'og:title') ||
      dec((html.match(/<title>([^<]+)<\/title>/i) || [])[1] || '')
    const title = rawTitle.replace(/\s*[-–—]\s*Kelly Mac Studios\s*$/i, '').trim()
    const postSlug = p.replace(/\/$/, '').split('/').pop()
    const stripped = dec(
      html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' '),
    )
    const publishDate = parseDate(stripped)
    const excerpt = meta(html, 'og:description')
    const coverUrl = meta(html, 'og:image')
    let cover = null
    if (coverUrl) {
      const fn = `${postSlug}${path.extname(new URL(coverUrl).pathname) || '.jpg'}`
      if (await dl(coverUrl, path.join(COVERS, fn))) cover = `blog/covers/${fn}`
    }
    const body = bodyParagraphs(html, title)
    out.push({title, slug: postSlug, url: p, publishDate, excerpt, cover, body})
    log('blog', `✓ ${title.slice(0, 60)}${publishDate ? ` (${publishDate})` : ' (no date)'} — ${body.length}¶`)
  }

  fs.writeFileSync(path.join(BLOG, 'posts.json'), JSON.stringify(out, null, 2))
  const noDate = out.filter((p) => !p.publishDate).length
  const noCover = out.filter((p) => !p.cover).length
  log('blog', `wrote ${out.length} posts → ${path.join(BLOG, 'posts.json')}`)
  if (noDate) log('blog', `⚠ ${noDate} posts missing a parsed date (default to today on import; fix in Studio)`)
  if (noCover) log('blog', `⚠ ${noCover} posts missing a cover image`)
  log('blog', 'NEXT: 65-blog-import.js (after the Sanity project is seeded)')
}

main().catch((e) => {
  console.error('[blog] FAILED:', e.message)
  process.exit(1)
})
