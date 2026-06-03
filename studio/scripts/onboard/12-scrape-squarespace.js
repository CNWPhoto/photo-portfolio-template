// 12-scrape-squarespace.js — Squarespace-aware supplement to 10-scrape.js.
//
//   node studio/scripts/onboard/12-scrape-squarespace.js \
//     --slug=pets-in-focus --url=https://www.petsinfocus.com/ \
//     --blog-path=lenaweepetcollective
//
// Why this exists: 10-scrape's image-sitemap path works on Squarespace,
// but its page-text dump guesses WordPress slugs (about/pricing/…) and
// 15-scrape-blog only matches /blog/<post>/ on Pixieset markup. Squarespace
// has cleaner sources:
//   - sitemap.xml lists every real page + blog URL
//   - any page + "?format=json-pretty" returns structured content
//   - the blog collection + "?format=rss" returns full post bodies in
//     <content:encoded> (cleanest body source for import)
//
// Output (additive — does NOT touch 10-scrape's content.json):
//   manifest/pages-text.json   real visible copy keyed by actual slug (ALL pages)
//   manifest/all-media.json    not touched (10-scrape owns it)
//   blog/posts.json            27 posts ready for 65-blog-import
//   blog/covers/               post cover images

import fs from 'node:fs'
import path from 'node:path'
import {assertSlug, getArg, stagingDir, log} from './lib.js'

const slug = assertSlug(getArg('slug', {required: true}))
const url = getArg('url', {required: true})
const blogPath = getArg('blog-path', {fallback: ''})
const origin = new URL(url).origin
const UA = {'User-Agent': 'Mozilla/5.0 (onboarding-scrape)'}

const STAGE = stagingDir(slug)
const MANI = path.join(STAGE, 'manifest')
const BLOG = path.join(STAGE, 'blog')
const COVERS = path.join(BLOG, 'covers')
for (const d of [MANI, COVERS]) fs.mkdirSync(d, {recursive: true})

const NAMED = {amp: '&', nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>',
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”',
  ndash: '–', mdash: '—', hellip: '…'}
const decKeep = (s) => (s || '')
  .replace(/&#(\d+);?/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&([a-z]+);?/gi, (m, name) => NAMED[name.toLowerCase()] ?? m)
  .replace(/&amp;?/g, '&')
const dec = (s) => decKeep(s).trim()

async function text(u) {
  const r = await fetch(u, {headers: UA})
  return r.ok ? r.text() : ''
}
const meta = (h, prop) => dec((h.match(
  new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, 'i'),
) || [])[1] || '')

function stripToText(html) {
  return dec(html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;?/g, ' ')
    .replace(/\s+/g, ' '))
}

// Convert <content:encoded> / page HTML to structured blocks for import.
function bodyStructured(html) {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')
  const blocks = []
  const blockRe = /<(h1|h2|h3|h4|p|blockquote)\b[^>]*>([\s\S]*?)<\/\1>|<(ul|ol)\b[^>]*>([\s\S]*?)<\/\3>/gi
  let m
  while ((m = blockRe.exec(html))) {
    if (m[3]) {
      const li = m[3].toLowerCase() === 'ol' ? 'number' : 'bullet'
      for (const liM of m[4].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
        const t = stripToText(liM[1])
        // runs shape so 65-blog-import maps it to Portable Text spans
        if (t) blocks.push({s: 'normal', li, runs: [{text: t, marks: []}]})
      }
      continue
    }
    const tag = m[1].toLowerCase()
    const t = stripToText(m[2])
    if (!t) continue
    const s = tag === 'h1' || tag === 'h2' ? 'h2' : (tag === 'h3' || tag === 'h4') ? 'h3'
      : tag === 'blockquote' ? 'blockquote' : 'normal'
    blocks.push({s, runs: [{text: t, marks: []}]})
  }
  // de-dupe consecutive identical blocks (compare first run's text)
  const txt = (b) => (b.runs && b.runs[0] && b.runs[0].text) || ''
  return blocks.filter((b, i) => i === 0 || norm(txt(b)) !== norm(txt(blocks[i - 1]))).slice(0, 200)
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
  log('sqsp', `slug=${slug} url=${url} blog-path=${blogPath || '(none)'}`)

  // 1. Every URL from the sitemap, split into pages vs blog posts.
  const xml = await text(`${origin}/sitemap.xml`)
  const locs = [...new Set([...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1]))]
  const blogPrefix = blogPath ? `${origin}/${blogPath}/` : null
  const blogUrls = blogPrefix ? locs.filter((l) => l.startsWith(blogPrefix)) : []
  const pageUrls = locs.filter((l) => !blogPrefix || (!l.startsWith(blogPrefix) && l !== blogPrefix.replace(/\/$/, '')))

  // 2. Full visible copy for EVERY page, keyed by real slug.
  const pages = {}
  for (const p of pageUrls) {
    const html = await text(p)
    if (!html) continue
    const key = p.replace(origin, '').replace(/^\/|\/$/g, '') || 'home'
    pages[key] = {
      url: p,
      title: meta(html, 'og:title'),
      description: meta(html, 'og:description'),
      text: stripToText(html).slice(0, 8000),
    }
    log('sqsp', `page ${key}: ${pages[key].text.length} chars`)
  }
  fs.writeFileSync(path.join(MANI, 'pages-text.json'), JSON.stringify(pages, null, 2))

  // 3. Blog posts — prefer RSS (full <content:encoded>), backfill per-post.
  const posts = []
  if (blogPath) {
    const rss = await text(`${origin}/${blogPath}?format=rss`)
    const items = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((m) => m[1])
    const grab = (b, tag) => {
      const m = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
      return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ''
    }
    const byUrl = new Map()
    for (const it of items) {
      const link = grab(it, 'link')
      byUrl.set(link.replace(/\/$/, ''), it)
    }
    for (const p of blogUrls) {
      const it = byUrl.get(p.replace(/\/$/, ''))
      const postSlug = p.replace(/\/$/, '').split('/').pop()
      let title = '', dateRaw = '', encoded = '', excerpt = '', coverUrl = ''
      if (it) {
        title = dec(grab(it, 'title'))
        dateRaw = grab(it, 'pubDate')
        encoded = grab(it, 'content:encoded')
        coverUrl = (it.match(/<media:content[^>]+url=["']([^"']+)["']/i) || [])[1] || ''
      }
      // backfill from the post page if RSS didn't carry it (RSS may cap items)
      if (!encoded) {
        const html = await text(p)
        title = title || meta(html, 'og:title')
        excerpt = meta(html, 'og:description')
        coverUrl = coverUrl || meta(html, 'og:image')
        encoded = (html.match(/<div class="sqs-html-content">([\s\S]*?)<\/div>\s*<\/div>/i) || [])[1] || html
      }
      const publishDate = dateRaw && !isNaN(new Date(dateRaw)) ? new Date(dateRaw).toISOString().slice(0, 10) : null
      let cover = null
      if (coverUrl) {
        const fn = `${postSlug}${path.extname(new URL(coverUrl).pathname) || '.jpg'}`
        if (await dl(coverUrl, path.join(COVERS, fn))) cover = `blog/covers/${fn}`
      }
      const body = bodyStructured(encoded)
      posts.push({title, slug: postSlug, url: p, publishDate, excerpt, cover, body})
      log('sqsp', `blog ${title.slice(0, 50)} — ${body.length} blk${publishDate ? ` (${publishDate})` : ' (no date — likely a category page, filtered)'}`)
    }
    // Squarespace lists blog CATEGORY/tag pages under the same path prefix.
    // They carry no RSS <item> (hence no pubDate) — drop them so only real
    // dated posts get imported.
    const realPosts = posts.filter((p) => p.publishDate)
    log('sqsp', `${posts.length} URLs under blog path → ${realPosts.length} real posts (${posts.length - realPosts.length} category pages filtered)`)
    posts.length = 0
    posts.push(...realPosts)
    fs.writeFileSync(path.join(BLOG, 'posts.json'), JSON.stringify(posts, null, 2))
  }

  log('sqsp', `done → ${pageUrls.length} pages, ${posts.length} blog posts`)
}

main().catch((e) => {
  console.error('[sqsp] FAILED:', e.message)
  process.exit(1)
})
