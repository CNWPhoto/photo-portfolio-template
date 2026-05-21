// karen-import-images.js — scrape karenconradphotography.com for full-size
// photos and place them into her seeded Sanity documents.
//
// Per-page distribution:
//   - heroSection slider → first 4-6 images
//   - heroSection image-full / image-right → first 1 image
//   - splitSection → next image into `.image`
//   - threeColumnSection → cycle remaining images into each column's .image
//   - galleryGridSection → absorbs everything left over
//
// Asset dedupe is automatic — Sanity hashes uploads and returns the same
// asset _id for identical content, so re-running this is safe.
//
// Run from her project: cp studio/.env.karen-conrad-photography-backup studio/.env
//   cd studio && npx sanity exec scripts/karen-import-images.js --with-user-token
// then restore your local .env afterward.

import {getCliClient} from 'sanity/cli'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const PAGES = [
  {slug: 'home',      url: 'https://karenconradphotography.com/',                                 docId: 'homepagePage'},
  {slug: 'seniors',   url: 'https://karenconradphotography.com/senior-photos-colorado-springs/',  docId: 'pageSeniors'},
  {slug: 'pets',      url: 'https://karenconradphotography.com/pet-portraits-colorado-springs/',  docId: 'pagePets'},
  {slug: 'family',    url: 'https://karenconradphotography.com/family-portraits-colorado-springs/', docId: 'pageFamily'},
  {slug: 'headshots', url: 'https://karenconradphotography.com/headshots-colorado-springs/',      docId: 'pageHeadshots'},
  {slug: 'newborns',  url: 'https://karenconradphotography.com/newborn-photoshoot-colorado-springs/', docId: 'pageNewborns'},
  {slug: 'about',     url: 'https://karenconradphotography.com/about/',                           docId: 'pageAbout'},
]

// Filters for non-photo assets that get into wp-content/uploads/.
// All take precedence over "include" — anything matching is skipped.
const SKIP_PATTERNS = [
  /-\d+x\d+\.(jpg|jpeg|png|webp)$/i,   // WP-resized thumbnails
  /\/thegem\//i,                        // theme assets
  /\/logos?\//i,
  /KC_Logo/i,
  /KCP_Frame/i,                         // her branded picture-frame overlays
  /Favicon/i,
  /Booklet/i,                           // brochure visuals, not photos
]

function shouldKeep(url) {
  return !SKIP_PATTERNS.some((re) => re.test(url))
}

async function fetchHTML(url) {
  const res = await fetch(url, {headers: {'User-Agent': UA}})
  if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`)
  return res.text()
}

function extractImages(html) {
  const re =
    /https:\/\/karenconradphotography\.com\/wp-content\/uploads\/[^"' )]+?\.(?:jpg|jpeg|png|webp)/gi
  const found = html.match(re) || []
  return [...new Set(found)].filter(shouldKeep)
}

// Strip the long elementor hash + WP-scaled suffix from filenames so the
// Sanity asset's stored originalFilename is human-readable.
function tidyFilename(url) {
  const last = url.split('/').pop()
  return last
    .replace(/-q8cwxm[a-z0-9]{20,}/i, '') // elementor hash
    .replace(/-scaled\./i, '.')           // WP large-image suffix
}

const assetCache = new Map() // url → assetDoc

async function uploadImage(client, url) {
  if (assetCache.has(url)) return assetCache.get(url)
  const res = await fetch(url, {headers: {'User-Agent': UA}})
  if (!res.ok) throw new Error(`download ${url}: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const filename = tidyFilename(url)
  const asset = await client.assets.upload('image', buffer, {filename})
  assetCache.set(url, asset)
  return asset
}

function imageItem(assetId, key) {
  return {
    _type: 'image',
    _key: key,
    asset: {_type: 'reference', _ref: assetId},
  }
}

function singleImage(assetId) {
  return {_type: 'image', asset: {_type: 'reference', _ref: assetId}}
}

// Consume images into the page's sections based on each section's _type
// and current shape. Returns a patches object suitable for client.patch().
function distribute(doc, assets) {
  let i = 0
  const next = () => assets[i++] || null
  const patches = {}

  for (const section of doc.sections || []) {
    if (i >= assets.length) break

    if (section._type === 'heroSection') {
      const variant = section.variant
      // Slider eats up to 6; full/right eats 1.
      const take = variant === 'slider' ? Math.min(6, assets.length - i) : 1
      const heroImgs = []
      for (let n = 0; n < take && i < assets.length; n++) {
        heroImgs.push(imageItem(assets[i++]._id, `heroImg${n + 1}`))
      }
      if (heroImgs.length) {
        patches[`sections[_key=="${section._key}"].images`] = heroImgs
      }
    } else if (section._type === 'splitSection') {
      const a = next()
      if (a) patches[`sections[_key=="${section._key}"].image`] = singleImage(a._id)
    } else if (section._type === 'threeColumnSection') {
      // Replace each existing column's image; keep all other column fields.
      const updated = (section.columns || []).map((col) => {
        const a = next()
        if (!a) return col
        return {...col, image: singleImage(a._id)}
      })
      patches[`sections[_key=="${section._key}"].columns`] = updated
    } else if (section._type === 'galleryGridSection') {
      // Gallery absorbs everything remaining.
      const rest = []
      while (i < assets.length) {
        rest.push(imageItem(assets[i]._id, `galImg${rest.length + 1}`))
        i++
      }
      if (rest.length) {
        patches[`sections[_key=="${section._key}"].images`] = rest
      }
    }
  }

  return patches
}

async function main() {
  const client = getCliClient()

  // Project-wide tally so we can summarize at the end.
  let totalUploaded = 0
  let totalSkipped = 0

  for (const page of PAGES) {
    console.log(`\n── ${page.slug}  →  ${page.docId}`)
    let html
    try {
      html = await fetchHTML(page.url)
    } catch (e) {
      console.log(`  ✗ scrape failed: ${e.message}`)
      continue
    }
    const urls = extractImages(html)
    console.log(`  scraped: ${urls.length} unique images`)
    if (urls.length === 0) {
      console.log('  (nothing to upload — skipping)')
      continue
    }

    const assets = []
    for (const u of urls) {
      try {
        const a = await uploadImage(client, u)
        assets.push(a)
        const cached = a._createdAt && a._createdAt < new Date(Date.now() - 60_000).toISOString()
        if (cached) totalSkipped++
        else totalUploaded++
        console.log(`  ${cached ? '·' : '↑'} ${tidyFilename(u)}  →  ${a._id}`)
      } catch (e) {
        console.log(`  ✗ ${u}: ${e.message}`)
      }
    }

    const doc = await client.getDocument(page.docId)
    if (!doc) {
      console.log(`  ! doc ${page.docId} not found in dataset`)
      continue
    }

    const patches = distribute(doc, assets)
    if (Object.keys(patches).length === 0) {
      console.log('  (no slots to fill)')
      continue
    }
    await client.patch(page.docId).set(patches).commit()
    console.log(`  ✓ patched ${Object.keys(patches).length} section(s)`)
  }

  console.log(
    `\nDone. Uploaded ${totalUploaded} new asset(s); reused ${totalSkipped} from prior runs.`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
