// 67-page-seo.js — backfill page SEO (meta description + title tag) from the
// scraped source into each `page` doc's `seo` object.
//
// Run in the swapped client env, after pages exist (same dance as 65/66):
//   cp studio/.env.<slug>-backup studio/.env
//   cd studio && npx sanity exec scripts/onboard/67-page-seo.js \
//     --with-user-token -- --slug=pets-in-focus
//   (restore dev .env after)
//
// Source of truth: .staging/<slug>/manifest/pages-text.json (written by the
// scraper) — { <slug>: { title, titleTag, description, ... } }. Matches each
// page doc by slug.current and fills:
//   seo.seoDescription ← source meta description (og:description)
//   seo.seoTitle       ← source <title> tag, minus the " | Site" suffix
//                        (skipped when it collapses to the site name — e.g.
//                        Squarespace, which leaves per-page titles unset)
//
// FILL-ONLY: never overwrites a value an editor already set (setIfMissing
// semantics), so curated SEO survives and only the gaps get filled. Idempotent.
// Self-contained (CJS-friendly). Cross-platform: works for any scraper that
// writes pages-text.json in this shape.
//
// Flags: --slug=<slug> (required); --dry (report, write nothing).

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
const dry = process.argv.includes('--dry')
const MANI = path.join(REPO_ROOT, '.staging', slug, 'manifest', 'pages-text.json')
const pagesText = JSON.parse(fs.readFileSync(MANI, 'utf8'))
const client = getCliClient()

// Strip a trailing site-name suffix (" | Site", " - Site", " – Site", " — Site")
// off the raw <title>. Returns '' when the title IS the site name or empty, so
// the caller skips it and lets the template fall back to the page title.
function seoTitleFrom(titleTag, siteName) {
  let t = (titleTag || '').trim()
  if (!t) return ''
  if (siteName) {
    const sn = siteName.trim()
    // "Page | Site" / "Site | Page" / "Page - Site" — drop the site-name part.
    t = t.replace(new RegExp(`\\s*[|\\-–—]\\s*${sn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i'), '')
    t = t.replace(new RegExp(`^\\s*${sn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[|\\-–—]\\s*`, 'i'), '')
    if (t.trim().toLowerCase() === sn.toLowerCase()) return ''
  }
  return t.trim()
}

async function main() {
  console.log(`[page-seo] ${slug} → ${client.config().projectId}/${client.config().dataset}${dry ? ' (dry run)' : ''}`)
  const [pages, siteName] = await Promise.all([
    client.fetch(
      `*[_type == "page" && defined(slug.current)]{ _id, title, "slug": slug.current, "seo": seo{ seoTitle, seoDescription } }`,
    ),
    client.fetch(`coalesce(*[_id=="siteSettings"][0].siteName, *[_id=="siteSettings"][0].businessName, "")`),
  ])

  let filledDesc = 0, filledTitle = 0, skipped = 0, noSource = 0
  for (const page of pages) {
    const src = pagesText[page.slug]
    if (!src) { noSource++; continue }
    const patch = {}
    const wantDesc = (src.description || '').trim()
    const wantTitle = seoTitleFrom(src.titleTag, siteName)
    // Fill-only: respect any value an editor already curated.
    if (wantDesc && !page.seo?.seoDescription) patch.seoDescription = wantDesc
    if (wantTitle && !page.seo?.seoTitle) patch.seoTitle = wantTitle
    if (!Object.keys(patch).length) { skipped++; continue }

    if (patch.seoDescription) filledDesc++
    if (patch.seoTitle) filledTitle++
    const marks = [
      patch.seoDescription ? `desc(${patch.seoDescription.length}c)` : null,
      patch.seoTitle ? `title="${patch.seoTitle}"` : null,
    ].filter(Boolean).join(' ')
    console.log(`  ${dry ? '·' : '~'} ${page.slug.padEnd(22)} ${marks}`)
    if (!dry) {
      // setIfMissing the seo object, then set only the fields we're filling —
      // never clobbers a sibling field an editor set on the same object.
      await client
        .patch(page._id)
        .setIfMissing({seo: {_type: 'seo'}})
        .set(Object.fromEntries(Object.entries(patch).map(([k, v]) => [`seo.${k}`, v])))
        .commit()
    }
  }

  console.log(`[page-seo] ${dry ? 'would fill' : 'filled'}: ${filledDesc} description(s), ${filledTitle} title(s) · ${skipped} already set · ${noSource} page(s) with no scraped source`)
}

main().catch((e) => { console.error('[page-seo] FAILED:', e); process.exit(1) })
