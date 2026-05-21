// karen-sync-drafts.js — push the images we patched into PUBLISHED docs
// onto Karen's existing DRAFT docs without overwriting any other field
// she touched in Studio.
//
// Why this is needed: she opened homepagePage / pageSeniors / siteSettings
// in Studio and made edits (e.g. consolidating two threeColumnSections
// into one) BEFORE karen-import-images.js and karen-finalize.js ran. The
// scripts patched the published versions. Her in-Studio edits live as
// drafts that forked off the pre-image state, so Presentation Mode shows
// them image-less while the live URL shows them with images.
//
// This script reads the published doc as the source of truth for image
// fields, and copies them onto matching draft sections. Other fields on
// the draft (her edits) are left alone. Idempotent.
//
// Run from her project:
//   cp studio/.env.karen-conrad-photography-backup studio/.env
//   cd studio && npx sanity exec scripts/karen-sync-drafts.js --with-user-token

import {getCliClient} from 'sanity/cli'

const TITLE_TO_SERVICE_DOC = [
  [/famil/i, 'pageFamily'],
  [/senior/i, 'pageSeniors'],
  [/newborn|maternity/i, 'pageNewborns'],
  [/pet/i, 'pagePets'],
  [/headshot/i, 'pageHeadshots'],
]

function singleImage(assetRef) {
  return {_type: 'image', asset: {_type: 'reference', _ref: assetRef}}
}

function matchTitle(title) {
  if (!title) return null
  for (const [re, id] of TITLE_TO_SERVICE_DOC) if (re.test(title)) return id
  return null
}

// Pull a section's image fields (hero images[], split image, threeColumn
// columns[].image) keyed by its _key, from a published doc.
function pubImagesByKey(pub) {
  const out = new Map()
  for (const s of pub?.sections || []) {
    if (s._type === 'heroSection' && Array.isArray(s.images) && s.images.length) {
      out.set(s._key, {type: 'hero', images: s.images})
    } else if (s._type === 'splitSection' && s.image) {
      out.set(s._key, {type: 'split', image: s.image})
    }
  }
  return out
}

async function syncPageDraft(client, docId, serviceHeroByDocId) {
  const draftId = `drafts.${docId}`
  const [draft, pub] = await Promise.all([
    client.getDocument(draftId),
    client.getDocument(docId),
  ])
  if (!draft) {
    console.log(`  · no draft for ${docId} — skipping`)
    return
  }
  if (!pub) {
    console.log(`  ! no published ${docId} — skipping`)
    return
  }

  const pubByKey = pubImagesByKey(pub)
  const patches = {}

  for (const section of draft.sections || []) {
    // Hero + split: copy from published section with same _key
    if (section._type === 'heroSection') {
      const fromPub = pubByKey.get(section._key)
      const alreadyHas = Array.isArray(section.images) && section.images.length > 0
      if (!alreadyHas && fromPub?.type === 'hero') {
        patches[`sections[_key=="${section._key}"].images`] = fromPub.images
      }
    } else if (section._type === 'splitSection') {
      const fromPub = pubByKey.get(section._key)
      if (!section.image && fromPub?.type === 'split') {
        patches[`sections[_key=="${section._key}"].image`] = fromPub.image
      }
    } else if (section._type === 'threeColumnSection') {
      // Columns may have been rearranged (different _key than published),
      // so match by column title to the matching service page's hero.
      let touched = false
      const updated = (section.columns || []).map((col) => {
        if (col.image) return col
        const sId = matchTitle(col.title)
        const ref = sId ? serviceHeroByDocId[sId] : null
        if (!ref) return col
        touched = true
        return {...col, image: singleImage(ref)}
      })
      if (touched) {
        patches[`sections[_key=="${section._key}"].columns`] = updated
      }
    }
  }

  if (Object.keys(patches).length === 0) {
    console.log(`  · ${draftId}: nothing to sync`)
    return
  }
  await client.patch(draftId).set(patches).commit()
  console.log(`  ✓ ${draftId}: patched ${Object.keys(patches).length} field(s)`)
}

async function syncSiteSettingsDraft(client) {
  const [draft, pub] = await Promise.all([
    client.getDocument('drafts.siteSettings'),
    client.getDocument('siteSettings'),
  ])
  if (!draft) {
    console.log('  · no draft for siteSettings — skipping')
    return
  }
  const patches = {}
  if (draft.logoType !== 'image' && pub?.logoType === 'image') patches.logoType = 'image'
  if (!draft.logoImage && pub?.logoImage) patches.logoImage = pub.logoImage
  if (!draft.favicon && pub?.favicon) patches.favicon = pub.favicon
  if (Object.keys(patches).length === 0) {
    console.log('  · drafts.siteSettings: nothing to sync')
    return
  }
  await client.patch('drafts.siteSettings').set(patches).commit()
  console.log(`  ✓ drafts.siteSettings: patched ${Object.keys(patches).join(', ')}`)
}

async function main() {
  const client = getCliClient()

  // Pre-fetch each service page's hero image once so we don't refetch
  // for every threeColumn column.
  const serviceDocIds = ['pageFamily', 'pageSeniors', 'pageNewborns', 'pagePets', 'pageHeadshots']
  const serviceHeroByDocId = {}
  for (const id of serviceDocIds) {
    const doc = await client.getDocument(id)
    const hero = doc?.sections?.find((s) => s._type === 'heroSection')
    serviceHeroByDocId[id] = hero?.images?.[0]?.asset?._ref || null
  }
  console.log('service hero refs resolved:', Object.values(serviceHeroByDocId).filter(Boolean).length, '/ 5')

  console.log('\n── syncing page drafts ──')
  const pageIds = ['homepagePage', 'pageSeniors', 'pagePets', 'pageFamily', 'pageHeadshots', 'pageNewborns', 'pageAbout', 'pageContact']
  for (const id of pageIds) {
    await syncPageDraft(client, id, serviceHeroByDocId)
  }

  console.log('\n── syncing siteSettings draft ──')
  await syncSiteSettingsDraft(client)

  console.log('\nDone.')
}

main().catch((e) => { console.error(e); process.exit(1) })
