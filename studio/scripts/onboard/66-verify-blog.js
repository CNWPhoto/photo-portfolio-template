// 66-verify-blog.js — automated migration-fidelity audit for a blog import.
//
// Run AFTER 65-blog-import, inside the swapped client env (same dance):
//   cp studio/.env.<slug>-backup studio/.env
//   cd studio && npx sanity exec scripts/onboard/66-verify-blog.js \
//     --with-user-token -- --slug=pets-in-focus
//   (restore dev .env after)
//
// Diffs the LIVE dataset against the staged scrape (.staging/<slug>/blog/
// posts.json — the source of truth from 12-scrape-squarespace) and asserts the
// README "Blog migration fidelity checklist" mechanically, so a migration can
// be signed off without hand-running curl/browser spot-checks. It is read-only
// (no writes) and self-contained (no ESM lib import — runs under CJS).
//
// Exit code: 0 if every hard check passes, 1 if any FAIL. WARNs never fail the
// run (they flag things a human should eyeball — e.g. a mark-count drift).
//
// Flags:
//   --slug=<slug>   (required) which staged migration to audit
//   --only=a,b      limit to these post slugs
//   --json          emit a machine-readable JSON report instead of the table

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
const onlySlugs = (getArg('only', {fallback: ''}) || '').split(',').map((s) => s.trim()).filter(Boolean)
const asJson = process.argv.includes('--json')
const BLOG = path.join(REPO_ROOT, '.staging', slug, 'blog')
const staged = JSON.parse(fs.readFileSync(path.join(BLOG, 'posts.json'), 'utf8'))
const client = getCliClient()

// ── staged (source) metrics ──────────────────────────────────────────────────
// Mirror the shapes 65-blog-import consumes: body items are {img}, {video}, or
// {s, li, runs:[{text, marks, link}]}. Empty strings / empty-run blocks are
// dropped by the importer, so count only what would survive.
function stagedMetrics(p) {
  const body = (p.body || []).filter((b) => {
    if (typeof b === 'string') return !!b.trim()
    if (b.img || b.video) return true
    return (b.runs || []).some((r) => r && r.text)
  })
  let images = 0, videos = 0, strong = 0, em = 0, links = 0
  const linkHrefs = []
  for (const b of body) {
    if (b.img) { images++; continue }
    if (b.video) { videos++; continue }
    for (const r of b.runs || []) {
      const marks = Array.isArray(r.marks) ? r.marks : []
      if (marks.includes('strong')) strong++
      if (marks.includes('em')) em++
      if (r.link) { links++; linkHrefs.push(r.link) }
    }
  }
  const first = body[0]
  const firstIsTitleDup = !!(first && first.runs && (first.s === 'h2' || first.s === 'h3') &&
    first.runs.map((r) => r.text).join('').trim().toLowerCase() === (p.title || '').trim().toLowerCase())
  return {
    blocks: body.length, images, videos, strong, em, links, linkHrefs,
    hasExcerpt: !!(p.excerpt && p.excerpt.trim()),
    excerpt: (p.excerpt || '').trim(),
    hasCover: !!p.cover,
    tags: p.tags || [],
    firstIsTitleDup,
  }
}

// ── doc (imported) metrics ───────────────────────────────────────────────────
function docMetrics(doc) {
  const body = doc.body || []
  let images = 0, imagesNoAlt = 0, videos = 0, strong = 0, em = 0, links = 0, dupAdjImages = 0
  const linkHrefs = []
  let prevImgRef = null
  for (const b of body) {
    if (b._type === 'image') {
      images++
      if (!b.alt || !String(b.alt).trim()) imagesNoAlt++
      // Gallery / lazy-load twin: same asset repeated back-to-back (the
      // Squarespace page-scrape doubling). Counts consecutive repeats only.
      const ref = b.asset?._ref || null
      if (ref && ref === prevImgRef) dupAdjImages++
      prevImgRef = ref
      continue
    }
    prevImgRef = null
    if (b._type === 'videoEmbed') { videos++; continue }
    if (b._type === 'block') {
      for (const c of b.children || []) {
        const marks = Array.isArray(c.marks) ? c.marks : []
        if (marks.includes('strong')) strong++
        if (marks.includes('em')) em++
      }
      for (const md of b.markDefs || []) {
        if (md._type === 'link') { links++; linkHrefs.push(md.href || '') }
      }
    }
  }
  const first = body[0]
  const firstText = first?.children?.[0]?.text || ''
  const firstIsTitleDup = !!(first && first._type === 'block' && (first.style === 'h2' || first.style === 'h3') &&
    firstText.trim().toLowerCase() === (doc.title || '').trim().toLowerCase())
  return {
    blocks: body.length, images, imagesNoAlt, videos, strong, em, links, linkHrefs, dupAdjImages,
    hasExcerpt: !!(doc.excerpt && String(doc.excerpt).trim()),
    excerpt: String(doc.excerpt || '').trim(),
    coverAlt: doc.coverImage?.alt ? String(doc.coverImage.alt).trim() : '',
    hasCover: !!doc.coverImage?.asset,
    categoryRefs: (doc.categories || []).map((c) => c._ref).filter(Boolean),
    resolvedCats: (doc.resolvedCats || []).filter(Boolean),
    firstIsTitleDup,
  }
}

async function main() {
  console.log(`[verify-blog] ${slug} → ${client.config().projectId}/${client.config().dataset}`)
  let posts = staged
  if (onlySlugs.length) posts = posts.filter((p) => onlySlugs.includes(p.slug))

  // Source origin host — an absolute link back to it in body copy is a leak
  // (internal blog links should be rewritten relative on import).
  let srcHost = ''
  try { srcHost = new URL(staged.find((p) => p.url)?.url || '').host } catch { /* none */ }

  const [docs, blogPage, allCatIds] = await Promise.all([
    client.fetch(
      `*[_type == "blogPost" && _id match "blogPost-*" && !(_id in path("drafts.**"))]{
        _id, title, excerpt,
        coverImage{alt, asset},
        body[]{_type, style, alt, asset, children[]{text, marks}, markDefs[]{_type, href}},
        "categories": categories[]{_ref},
        "resolvedCats": categories[]->slug.current
      }`,
    ),
    client.fetch(`*[_id == "blogPage"][0]{ "hasCta": defined(postCtaText), "blogSlug": slug.current }`),
    client.fetch(`*[_type == "blogCategory"]._id`),
  ])
  const catIdSet = new Set(allCatIds)
  const docBySlugId = new Map(docs.map((d) => [d._id, d]))

  const rows = []
  let hardFails = 0, warns = 0
  const fail = (r, msg) => { r.fails.push(msg); hardFails++ }
  const warn = (r, msg) => { r.warns.push(msg); warns++ }

  for (const p of posts) {
    const r = {slug: p.slug, title: p.title, fails: [], warns: []}
    rows.push(r)
    const doc = docBySlugId.get(`blogPost-${p.slug}`)
    if (!doc) { fail(r, 'MISSING doc (blogPost-' + p.slug + ')'); continue }
    const s = stagedMetrics(p)
    const d = docMetrics(doc)

    // Title
    if ((doc.title || '').trim() !== (p.title || '').trim())
      fail(r, `title mismatch: "${doc.title}" != "${p.title}"`)
    // Excerpt — hard: must be present; soft: should match staged source.
    if (!d.hasExcerpt) fail(r, 'excerpt missing')
    else if (s.hasExcerpt && d.excerpt !== s.excerpt) warn(r, 'excerpt differs from source')
    // Leading title-duplicate heading (renders the title twice).
    if (d.firstIsTitleDup) fail(r, 'leading heading duplicates the title')
    // Images + alt coverage.
    if (d.imagesNoAlt > 0) fail(r, `${d.imagesNoAlt}/${d.images} body image(s) missing alt`)
    // Duplicate featured/gallery image rendered twice back-to-back.
    if (d.dupAdjImages > 0) fail(r, `${d.dupAdjImages} duplicate image(s) repeated consecutively (gallery/lazy-load twin)`)
    if (d.images !== s.images) warn(r, `image count ${d.images} vs source ${s.images}`)
    // Cover alt.
    if (d.hasCover && !d.coverAlt) fail(r, 'cover image missing alt')
    // Videos (native sqs-video blocks are the classic silent loss).
    if (d.videos !== s.videos) fail(r, `video count ${d.videos} vs source ${s.videos}`)
    // Categories: same count as source tags, and every ref resolves.
    if (d.categoryRefs.length !== s.tags.length)
      warn(r, `category count ${d.categoryRefs.length} vs source tags ${s.tags.length}`)
    const orphanRefs = d.categoryRefs.filter((id) => !catIdSet.has(id))
    if (orphanRefs.length) fail(r, `unresolved category ref(s): ${orphanRefs.join(', ')}`)
    // Inline formatting drift (soft — decorators are lossy across CMS quirks).
    if (d.strong !== s.strong) warn(r, `strong marks ${d.strong} vs source ${s.strong}`)
    if (d.em !== s.em) warn(r, `em marks ${d.em} vs source ${s.em}`)
    if (d.links !== s.links) warn(r, `links ${d.links} vs source ${s.links}`)
    // Old-site link leak: an absolute href back to the source host.
    if (srcHost) {
      const leaks = d.linkHrefs.filter((h) => {
        try { return new URL(h).host === srcHost } catch { return false }
      })
      if (leaks.length) warn(r, `${leaks.length} link(s) point back at ${srcHost}: ${leaks.slice(0, 2).join(', ')}`)
    }
    // Double-encoded query href (&amp;amp; from a mis-decoded link).
    if (d.linkHrefs.some((h) => /&amp;/.test(h))) fail(r, 'link href is double-encoded (&amp;)')
  }

  // ── dataset-level checks ─────────────────────────────────────────────────
  const dataset = {fails: [], warns: []}
  const importedCount = docs.length
  if (!onlySlugs.length && importedCount !== staged.length)
    dataset.fails.push(`post count ${importedCount} != source ${staged.length}`)
  if (!blogPage?.hasCta)
    dataset.warns.push('blogPage.postCtaText is empty (central category CTA not set)')
  // Nav remnant: any body block still carrying the per-post "Looking for
  // specific posts?" category nav that should live only in postCtaText.
  const navRemnant = docs.filter((d) =>
    (d.body || []).some((b) => b._type === 'block' &&
      /looking for specific posts/i.test((b.children || []).map((c) => c.text || '').join(' '))),
  )
  if (navRemnant.length)
    dataset.fails.push(`${navRemnant.length} post(s) still carry the inline category nav: ${navRemnant.map((d) => d._id).join(', ')}`)
  hardFails += dataset.fails.length
  warns += dataset.warns.length

  // ── report ───────────────────────────────────────────────────────────────
  if (asJson) {
    console.log(JSON.stringify({slug, projectId: client.config().projectId, hardFails, warns, dataset, posts: rows}, null, 2))
  } else {
    for (const r of rows) {
      const status = r.fails.length ? '✗ FAIL' : r.warns.length ? '~ warn' : '✓ ok  '
      console.log(`${status}  ${r.slug}`)
      for (const f of r.fails) console.log(`         ✗ ${f}`)
      for (const w of r.warns) console.log(`         ~ ${w}`)
    }
    console.log('\n── dataset ──')
    for (const f of dataset.fails) console.log(`  ✗ ${f}`)
    for (const w of dataset.warns) console.log(`  ~ ${w}`)
    console.log(`  blog base slug: ${blogPage?.blogSlug || '(unset → "blog")'}`)
    console.log(`  posts audited: ${rows.length}   imported: ${importedCount}   categories: ${allCatIds.length}`)
  }

  const okPosts = rows.filter((r) => !r.fails.length).length
  console.log(`\n[verify-blog] ${okPosts}/${rows.length} posts pass · ${hardFails} hard fail(s) · ${warns} warning(s)`)
  if (hardFails) {
    console.log('[verify-blog] RESULT: FAIL — resolve the ✗ items above before sign-off.')
    process.exit(1)
  }
  console.log('[verify-blog] RESULT: PASS')
}

main().catch((e) => { console.error('[verify-blog] FAILED:', e); process.exit(1) })
