// 68-verify-pages.js — migration-fidelity audit for PAGES.
//
// The sibling of 66-verify-blog.js. Blogs got a mechanical verifier after the
// PIF migration "ran clean" while silently losing content; pages never did, and
// the same class of failure duly happened on the Heidi Adler migration:
// donor copy left in place, ~75% of two pages' text missing, per-section images
// never placed, and six of nine pages shipped with no <h1> at all. Every one of
// those is mechanically detectable. This detects them.
//
// Fetches the LIVE rendered pages and diffs them against the ORIGINAL source
// site, rather than against the staged scrape — the scrape is itself a suspect
// (it discovers from sitemap.xml, which on Squarespace routinely omits pages).
// Comparing to what the client can actually still see is the stronger check.
//
// Read-only. Exit 0 if every hard check passes, 1 on any FAIL.
//
// Flags:
//   --slug=<slug>          (required) client slug; reads .env.<slug>-backup
//   --live=<url>           (required) the NEW site, e.g. https://x.workers.dev
//   --source=<url>         (required) the ORIGINAL site being replaced
//   --map=a:b,c:d          new-path:source-path pairs (default: same path)
//   --min-text=0.9         required sentence coverage (default 0.9)
//   --json                 machine-readable report
//
// Example:
//   cd studio && npx dotenv -e .env.heidi-adler-photography-backup -- \
//     npx sanity exec scripts/onboard/68-verify-pages.js --with-user-token -- \
//     --slug=heidi-adler-photography \
//     --live=https://heidi-adler-photography.heidi-ca0.workers.dev \
//     --source=https://www.heidiadlerphotography.com \
//     --map=/investment/:/productsandpricing,/about/:/about-me

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-01-01'})
const argv = process.argv
function getArg(name, fallback) {
  const hit = argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}
const JSON_OUT = argv.includes('--json')
const slug = getArg('slug')
const LIVE = (getArg('live') || '').replace(/\/$/, '')
const SOURCE = (getArg('source') || '').replace(/\/$/, '')
const MIN_TEXT = parseFloat(getArg('min-text', '0.9'))

if (!slug || !LIVE || !SOURCE) {
  console.error('Usage: --slug=<slug> --live=<new-url> --source=<original-url> [--map=a:b] [--json]')
  process.exit(1)
}

const MAP = Object.fromEntries(
  (getArg('map', '') || '')
    .split(',')
    .filter(Boolean)
    .map((p) => p.split(':').map((s) => s.trim())),
)

// Strings that mean the donor seed was never fully overwritten. Extend freely —
// a false positive costs a glance, a false negative ships to a client.
const DONOR_MARKERS = [
  'Pet Photographer Site',
  'Why Choose Our Studio',
  'A simple, relaxed process',
  'Reach out and tell us about your dog',
  'Images that Rock',
  'Write a description about your business',
  'collection of recent dog photography sessions',
  'collection of recent cat photography sessions',
  'lorem ipsum',
  'Steve Jobs',
  'The Johnson Family',
  'cnw-photo-demo',
  'connor-walberg',
  'Denver Dog',
]

const strip = (h) =>
  h
    .replace(/<(script|style|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
const decode = (t) =>
  t
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&lsquo;|&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&[a-z]+;/gi, ' ')
const text = (h) => decode(strip(h)).replace(/\s+/g, ' ').trim()
const key = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

async function get(url) {
  const res = await fetch(url, {headers: {'User-Agent': 'Mozilla/5.0'}})
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.text()
}

async function main() {
  // Which pages to check comes from the dataset, so a page added later is
  // audited automatically instead of being forgotten.
  const docs = await client.fetch(
    `*[_type in ["page","portfolio","homepagePage"] && !(_id in path("drafts.**"))]{
       _id, _type, "slug": slug.current }`,
  )
  const paths = docs
    .map((d) =>
      d._type === 'homepagePage' ? '/' : `/${(d.slug || '').replace(/^\/|\/$/g, '')}/`,
    )
    .filter((p, i, a) => p && a.indexOf(p) === i)
    .sort()

  const results = []
  for (const p of paths) {
    const srcPath = MAP[p] || p
    const r = {path: p, source: srcPath, fails: [], warns: [], stats: {}}
    let liveHtml, srcHtml
    try {
      liveHtml = await get(LIVE + p)
    } catch (e) {
      r.fails.push(`live page unreachable: ${e.message}`)
      results.push(r)
      continue
    }
    try {
      srcHtml = await get(SOURCE + srcPath)
    } catch {
      r.warns.push(`source ${srcPath} unreachable — text/image diff skipped`)
    }

    const liveText = text(liveHtml)
    const liveKey = key(liveText)

    // ── 1. exactly one h1 ────────────────────────────────────────────────
    const h1s = liveHtml.match(/<h1[\s>]/gi) || []
    r.stats.h1 = h1s.length
    if (h1s.length === 0) r.fails.push('no <h1> on the page')
    else if (h1s.length > 1) r.fails.push(`${h1s.length} <h1> tags (expected 1)`)

    // ── 2. no donor copy ─────────────────────────────────────────────────
    const donor = DONOR_MARKERS.filter((m) => liveText.toLowerCase().includes(m.toLowerCase()))
    if (donor.length) r.fails.push(`donor copy present: ${donor.join(', ')}`)

    // ── 3. no empty/placeholder rendering ────────────────────────────────
    if (/“\s*”|""/.test(liveText)) {
      r.warns.push('empty quotation marks — a testimonial or quote may be unpopulated')
    }
    if (liveText.length < 300) r.warns.push(`very little text (${liveText.length} chars)`)

    // ── 4. text coverage vs the original ─────────────────────────────────
    if (srcHtml) {
      const srcText = text(srcHtml)
      // sentences long enough to be real copy, not UI chrome
      const sents = srcText.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 45)
      const missing = sents.filter((s) => !liveKey.includes(key(s).slice(0, 55)))
      const cov = sents.length ? (sents.length - missing.length) / sents.length : 1
      r.stats.sentences = `${sents.length - missing.length}/${sents.length}`
      r.stats.coverage = `${Math.round(cov * 100)}%`
      r.missing = missing.slice(0, 5).map((s) => s.slice(0, 80))
      if (cov < MIN_TEXT) {
        r.fails.push(`text coverage ${Math.round(cov * 100)}% < ${Math.round(MIN_TEXT * 100)}%`)
      }

      // ── 5. image count vs the original ─────────────────────────────────
      // The failure this exists to catch: pages rebuilt with the right words
      // and a token image each, banners silently dropped.
      const srcImgs = new Set(
        (srcHtml.match(/https:\/\/images\.squarespace-cdn\.com\/content\/v1\/[^"'\s?]+/g) || [])
          .concat(srcHtml.match(/https:\/\/[^"'\s?]+\/wp-content\/uploads\/[^"'\s?]+/g) || []),
      )
      const liveImgs = new Set(
        (liveHtml.match(/cdn\.sanity\.io\/images\/[^/]+\/[^/]+\/([0-9a-f]{40})/g) || []).map((m) =>
          m.slice(-40),
        ),
      )
      r.stats.images = `${liveImgs.size}/${srcImgs.size}`
      if (srcImgs.size >= 3 && liveImgs.size < srcImgs.size * 0.6) {
        r.fails.push(`only ${liveImgs.size} images vs ${srcImgs.size} on the source`)
      } else if (srcImgs.size && liveImgs.size < srcImgs.size) {
        r.warns.push(`${liveImgs.size} images vs ${srcImgs.size} on the source`)
      }
    }

    // ── 6. every internal link resolves ──────────────────────────────────
    // Catches nav/footer links stored in the wrong shape, which render as an
    // empty href or vanish entirely.
    const hrefs = [...liveHtml.matchAll(/<a[^>]+href="([^"]*)"/gi)].map((m) => m[1])
    const empty = hrefs.filter((h) => !h || h === '#' || h === 'undefined').length
    if (empty) r.fails.push(`${empty} link(s) with an empty/# href`)
    r.stats.links = hrefs.length

    // ── 7. trailing slash on internal links ──────────────────────────────
    const unslashed = hrefs.filter(
      (h) => /^\/[a-z0-9-]+(\/[a-z0-9-]+)*$/i.test(h) && !h.endsWith('/') && !/\.[a-z0-9]{2,8}$/i.test(h),
    )
    if (unslashed.length) {
      r.warns.push(`${unslashed.length} internal link(s) missing a trailing slash: ${unslashed.slice(0, 3).join(', ')}`)
    }

    // ── 8. meta description present ──────────────────────────────────────
    if (!/<meta[^>]+name="description"[^>]+content="[^"]{20,}"/i.test(liveHtml)) {
      r.warns.push('no meta description')
    }

    results.push(r)
  }

  // ── unplaced scraped images: uploaded but referenced by nothing ────────
  const orphans = await client.fetch(
    `count(*[_type == "sanity.imageAsset" && count(*[references(^._id)]) == 0])`,
  )

  if (JSON_OUT) {
    console.log(JSON.stringify({slug, results, orphanAssets: orphans}, null, 2))
  } else {
    console.log(`\n[verify-pages] ${slug} — ${LIVE}\n`)
    console.log(
      `  ${'PAGE'.padEnd(28)} ${'H1'.padEnd(3)} ${'TEXT'.padEnd(9)} ${'IMAGES'.padEnd(8)} STATUS`,
    )
    for (const r of results) {
      const status = r.fails.length ? '✗ FAIL' : r.warns.length ? '~ warn' : '✓ ok'
      console.log(
        `  ${r.path.padEnd(28)} ${String(r.stats.h1 ?? '-').padEnd(3)} ` +
          `${String(r.stats.coverage ?? '-').padEnd(9)} ${String(r.stats.images ?? '-').padEnd(8)} ${status}`,
      )
      for (const f of r.fails) console.log(`      ✗ ${f}`)
      for (const w of r.warns) console.log(`      ~ ${w}`)
      for (const m of r.missing || []) console.log(`        missing: ${m}…`)
    }
    if (orphans) {
      console.log(`\n  ~ ${orphans} uploaded image(s) referenced by nothing — placed or purged?`)
    }
  }

  const failed = results.filter((r) => r.fails.length)
  if (failed.length) {
    console.log(
      `\n[verify-pages] RESULT: FAIL — ${failed.length} page(s). Resolve the ✗ items before sign-off.`,
    )
    process.exit(1)
  }
  console.log('\n[verify-pages] RESULT: PASS')
}

main().catch((e) => {
  console.error('[verify-pages] FAILED:', e)
  process.exit(1)
})
