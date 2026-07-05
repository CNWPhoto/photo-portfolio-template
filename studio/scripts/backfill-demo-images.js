// backfill-demo-images.js — one-off (P1 #8): upload the Pexels images the
// demo previously rendered via runtime fallbacks into the demo dataset, so
// the fallback code path could be replaced with palette placeholders without
// the demo losing its imagery. Covers /, /about/, /experience/, /contact/.
//
// Only fills EMPTY slots (published and stale drafts alike) — never overwrites
// an image an editor has set. A second pass adds alt text to any slot holding
// one of OUR uploaded assets with alt missing (the shared imageField warns on
// missing alt). Asset dedupe is automatic (Sanity hashes uploads), so
// re-running is safe.
//
// Run against the demo project (hx5xgigp is the sanity.cli.js default):
//   cd studio && npx sanity exec scripts/backfill-demo-images.js --with-user-token

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-01-01'})

const pexelsUrl = (id, w) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`

// id → download width. Heroes/full-bleeds get 2000, the rest 1600.
const IMAGES = {
  1108099: 1600,
  1629781: 2000,
  1805164: 2000,
  2253275: 2000,
  825949: 1600,
  4587955: 1600,
  3726314: 1600,
  1254140: 1600,
}

// Alt text per image — set on fill, and repaired onto already-filled slots
// by the alt pass (the shared imageField warns on missing alt).
const ALT = {
  1108099: 'Golden retriever in warm afternoon light',
  1629781: 'Dog in a rocky mountain landscape',
  1805164: 'Playful dog in soft afternoon light',
  2253275: 'Dog exploring in golden afternoon light',
  825949: 'Dog portrait in natural light',
  4587955: 'Close-up dog portrait outdoors',
  3726314: 'Dog looking curiously at the camera',
  1254140: 'Dog running through an open field',
}

// docId → list of slot fillers. `path` is relative to the doc root and uses
// _key filters only, so applying the same spec to a draft is a no-op wherever
// the draft's shape differs.
const SLOTS = {
  homepagePage: [
    {path: 'sections[_key=="homeSplit"].image', pexels: 1108099},
    {path: 'sections[_key=="homeWhy"].image', pexels: 1629781},
  ],
  pageAbout: [
    {path: 'sections[_key=="aboutIntro"].image', pexels: 1805164},
    {path: 'sections[_key=="aboutExpect"].columns', pexels: [1108099, 2253275, 825949], kind: 'columns'},
    {path: 'sections[_key=="aboutPersonal"].image', pexels: 4587955},
    {path: 'sections[_key=="aboutCta"].backgroundImage', pexels: 3726314},
    {path: 'sections[_key=="aboutCta"].foregroundImage', pexels: 1254140},
  ],
  pageContact: [{path: 'sections[_key=="contactHero"].images', pexels: [2253275], kind: 'heroImages'}],
  pageExperience: [
    {path: 'sections[_key=="expHero"].images', pexels: [1805164], kind: 'heroImages'},
    {path: 'sections[_key=="expSessions"].image', pexels: 825949},
    {path: 'sections[_key=="expArtwork"].image', pexels: 3726314},
    {path: 'sections[_key=="expNext"].image', pexels: 1629781},
  ],
}

const imageRef = (assetId, key, alt) => ({
  _type: 'image',
  ...(key ? {_key: key} : {}),
  ...(alt ? {alt} : {}),
  asset: {_type: 'reference', _ref: assetId},
})

// Resolve a slot's current value on a fetched doc (mirrors the _key paths above).
function currentValue(doc, path) {
  const [, sectionKey, field] = path.match(/sections\[_key=="(.+?)"\]\.(\w+)/)
  const section = (doc.sections || []).find((s) => s._key === sectionKey)
  return {section, value: section?.[field], field}
}

async function uploadAll() {
  const assets = {}
  for (const [id, w] of Object.entries(IMAGES)) {
    const res = await fetch(pexelsUrl(id, w))
    if (!res.ok) throw new Error(`pexels ${id}: HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    const asset = await client.assets.upload('image', buffer, {filename: `demo-${id}.jpg`})
    assets[id] = asset._id
    console.log(`  ✓ uploaded ${id} → ${asset._id} (${Math.round(buffer.length / 1024)}KB)`)
  }
  return assets
}

async function fillDoc(docId, assets) {
  const doc = await client.getDocument(docId)
  if (!doc) {
    console.log(`  – ${docId}: not found, skipping`)
    return
  }
  const patches = {}
  for (const slot of SLOTS[docId.replace(/^drafts\./, '')]) {
    const {section, value} = currentValue(doc, slot.path)
    if (!section) continue // draft shape differs — leave it alone
    if (slot.kind === 'heroImages') {
      if (Array.isArray(value) && value.some((img) => img?.asset?._ref)) continue // already has images
      patches[slot.path] = slot.pexels.map((id, i) => imageRef(assets[id], `backfill${i}`, ALT[id]))
    } else if (slot.kind === 'columns') {
      if (!Array.isArray(value) || value.length === 0) continue
      if (value.some((col) => col?.image?.asset?._ref)) continue // any editor image → hands off
      patches[slot.path] = value.map((col, i) => {
        const id = slot.pexels[i % slot.pexels.length]
        return {...col, image: imageRef(assets[id], undefined, ALT[id])}
      })
    } else {
      if (value?.asset?._ref) continue // already set
      patches[slot.path] = imageRef(assets[slot.pexels], undefined, ALT[slot.pexels])
    }
  }
  if (Object.keys(patches).length === 0) {
    console.log(`  – ${docId}: nothing to fill`)
    return
  }
  await client.patch(docId).set(patches).commit()
  console.log(`  ✓ ${docId}: filled ${Object.keys(patches).length} slot(s)`)
}

// Add missing alt text to slots that hold one of OUR uploaded assets.
// Never touches an editor's image (asset id must match an upload) or an
// existing alt.
async function altPass(docId, assets) {
  const doc = await client.getDocument(docId)
  if (!doc) return
  const altByRef = Object.fromEntries(Object.entries(assets).map(([id, ref]) => [ref, ALT[id]]))
  const ours = (img) => img?.asset?._ref && altByRef[img.asset._ref]
  const patches = {}
  for (const slot of SLOTS[docId.replace(/^drafts\./, '')]) {
    const {value} = currentValue(doc, slot.path)
    if (slot.kind === 'heroImages') {
      for (const img of value || []) {
        if (ours(img) && !img.alt && img._key) {
          patches[`${slot.path}[_key=="${img._key}"].alt`] = altByRef[img.asset._ref]
        }
      }
    } else if (slot.kind === 'columns') {
      if (!Array.isArray(value)) continue
      if (!value.some((col) => ours(col?.image) && !col.image.alt)) continue
      patches[slot.path] = value.map((col) =>
        ours(col?.image) && !col.image.alt
          ? {...col, image: {...col.image, alt: altByRef[col.image.asset._ref]}}
          : col,
      )
    } else if (ours(value) && !value.alt) {
      patches[`${slot.path}.alt`] = altByRef[value.asset._ref]
    }
  }
  if (Object.keys(patches).length === 0) {
    console.log(`  – ${docId}: alt text already complete`)
    return
  }
  await client.patch(docId).set(patches).commit()
  console.log(`  ✓ ${docId}: alt text added to ${Object.keys(patches).length} slot(s)`)
}

async function main() {
  console.log(`Backfilling demo images into ${client.config().projectId}/${client.config().dataset}`)
  if (client.config().projectId !== 'hx5xgigp') {
    throw new Error('Refusing to run outside the demo project (hx5xgigp)')
  }

  console.log('Uploading assets…')
  const assets = await uploadAll()

  console.log('Filling published docs…')
  for (const docId of Object.keys(SLOTS)) await fillDoc(docId, assets)

  console.log('Mirroring into pre-existing drafts (empty slots only)…')
  for (const docId of Object.keys(SLOTS)) await fillDoc(`drafts.${docId}`, assets)

  console.log('Alt-text pass (published + drafts, our assets only)…')
  for (const docId of Object.keys(SLOTS)) {
    await altPass(docId, assets)
    await altPass(`drafts.${docId}`, assets)
  }

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
