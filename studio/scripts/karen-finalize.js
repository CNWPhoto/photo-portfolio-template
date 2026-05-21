// karen-finalize.js — last-mile imports for Karen Conrad's site:
//   1. Upload her WordPress logo + favicon assets and wire them into
//      siteSettings (logoType=image, logoImage, favicon).
//   2. Walk the homepage threeColumnSection(s) and fill each column's
//      image slot with the matching service page's hero image.
//
// Run from her project:
//   cp studio/.env.karen-conrad-photography-backup studio/.env
//   cd studio && npx sanity exec scripts/karen-finalize.js --with-user-token
// then restore your local .env.
//
// Idempotent — Sanity dedupes uploaded assets by content hash, and the
// siteSettings patch + per-column patches just overwrite the same fields
// each run.

import {getCliClient} from 'sanity/cli'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const LOGO_URL =
  'https://karenconradphotography.com/wp-content/uploads/2023/03/KC_Logo_CLR_Fin.png'
const FAVICON_URL =
  'https://karenconradphotography.com/wp-content/uploads/2023/03/KC_Logo_CLR_Favicon.png'

// Column title substring → service page doc ID. Substring match so the
// script keeps working if Karen renames "Family Portraits" → "Families"
// or similar in Studio.
const TITLE_TO_DOC_ID = [
  [/famil/i, 'pageFamily'],
  [/senior/i, 'pageSeniors'],
  [/newborn|maternity/i, 'pageNewborns'],
  [/pet/i, 'pagePets'],
  [/headshot/i, 'pageHeadshots'],
]

async function uploadFromUrl(client, url, filename) {
  const res = await fetch(url, {headers: {'User-Agent': UA}})
  if (!res.ok) throw new Error(`download ${url}: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  return client.assets.upload('image', buffer, {filename})
}

function singleImage(assetId) {
  return {_type: 'image', asset: {_type: 'reference', _ref: assetId}}
}

async function patchSiteLogoAndFavicon(client) {
  console.log('── logo + favicon')
  const [logo, favicon] = await Promise.all([
    uploadFromUrl(client, LOGO_URL, 'KC_Logo_CLR_Fin.png'),
    uploadFromUrl(client, FAVICON_URL, 'KC_Logo_CLR_Favicon.png'),
  ])
  console.log(`  ↑ logo    → ${logo._id}`)
  console.log(`  ↑ favicon → ${favicon._id}`)

  await client
    .patch('siteSettings')
    .set({
      logoType: 'image',
      logoImage: singleImage(logo._id),
      logoLarge: false,
      favicon: singleImage(favicon._id),
    })
    .commit()
  console.log('  ✓ siteSettings patched')
}

// Look up a service page's hero image asset ref (the first image of the
// first section, which is the heroSection across every seeded service page).
async function getHeroAssetRef(client, docId) {
  const doc = await client.getDocument(docId)
  if (!doc) return null
  const hero = doc.sections?.find((s) => s._type === 'heroSection')
  return hero?.images?.[0]?.asset?._ref || null
}

function matchTitleToDocId(title) {
  if (!title) return null
  for (const [re, id] of TITLE_TO_DOC_ID) if (re.test(title)) return id
  return null
}

async function fillHomepageColumns(client) {
  console.log('\n── homepage three-column cards')
  const home = await client.getDocument('homepagePage')
  if (!home) throw new Error('homepagePage not found')

  // Resolve every service page's hero asset up-front so we don't refetch
  // for each column.
  const heroRefByDocId = {}
  for (const [, docId] of TITLE_TO_DOC_ID) {
    heroRefByDocId[docId] = await getHeroAssetRef(client, docId)
  }

  let touchedSections = 0
  for (const section of home.sections || []) {
    if (section._type !== 'threeColumnSection') continue
    const updatedColumns = (section.columns || []).map((col) => {
      const docId = matchTitleToDocId(col.title)
      const ref = docId ? heroRefByDocId[docId] : null
      if (!ref) {
        console.log(`  · ${col.title || '(untitled)'} — no match, leaving as-is`)
        return col
      }
      console.log(`  ✓ ${col.title} → ${docId} hero (${ref})`)
      return {...col, image: singleImage(ref)}
    })
    await client
      .patch('homepagePage')
      .set({[`sections[_key=="${section._key}"].columns`]: updatedColumns})
      .commit()
    touchedSections++
  }

  if (touchedSections === 0) {
    console.log('  (no threeColumnSection found on homepage — nothing to fill)')
  } else {
    console.log(`  ✓ patched ${touchedSections} threeColumnSection(s)`)
  }
}

async function main() {
  const client = getCliClient()
  await patchSiteLogoAndFavicon(client)
  await fillHomepageColumns(client)
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
