// Place Heidi Adler's real per-section images on every page, including the
// full-bleed parallax banners her Squarespace site uses.
//
// The pages were rebuilt with her copy but only a token image each: her
// Session page had 8 images and mine had 3, and the parallax banner between
// "Session Information" and "The Artwork" was missing entirely. Same on the
// Investment and both Tails pages.
//
// Squarespace marks these with `Index-page--has-image`; the equivalent here is
// fullBleedImageSection with parallax: true.
//
// Every asset below is hers, matched by filename to what her live page uses in
// that position.
//
// Run:
//   cd studio && npx dotenv -e .env.heidi-adler-photography-backup -- \
//     npx sanity exec scripts/migrations/heidi-place-page-images.js \
//     --with-user-token -- --slug=heidi-adler-photography --apply

import {getCliClient} from 'sanity/cli'
import fs from 'node:fs'
import path from 'node:path'

const client = getCliClient({apiVersion: '2024-01-01'})
const APPLY = process.argv.includes('--apply')
const slug =
  (process.argv.find((a) => a.startsWith('--slug=')) || '').split('=')[1] || ''

function assertProject() {
  if (!slug) throw new Error('Missing --slug=<slug>')
  const envPath = path.resolve(process.cwd(), `.env.${slug}-backup`)
  const m = fs.readFileSync(envPath, 'utf8').match(/^SANITY_STUDIO_PROJECT_ID=(.*)$/m)
  const expected = m && m[1].trim()
  const actual = client.config().projectId
  if (!expected) throw new Error(`No SANITY_STUDIO_PROJECT_ID in ${envPath}`)
  if (expected !== actual) {
    throw new Error(
      `Refusing to write: --slug=${slug} expects project ${expected}, ` +
        `but the active client is ${actual}. Check studio/.env.`,
    )
  }
}

// Resolve an asset id from a filename fragment, so this reads like her site.
let ASSETS = []
const norm = (n) => String(n || '').toLowerCase().replace(/[^a-z0-9]/g, '')
function A(fragment) {
  const f = norm(fragment)
  const hit = ASSETS.find((a) => norm(a.originalFilename).includes(f))
  if (!hit) throw new Error(`No asset matching "${fragment}"`)
  return hit._id
}

const img = (ref, alt) => ({
  _type: 'image',
  asset: {_type: 'reference', _ref: ref},
  ...(alt ? {alt} : {}),
})

const fullBleed = (k, {ref, alt, heading, height}) => ({
  _key: k,
  _type: 'fullBleedImageSection',
  enabled: true,
  image: img(ref, alt),
  parallax: true,
  height: height || 'tall',
  overlayOpacity: 0.15,
  ...(heading ? {heading} : {}),
})

// ── per page: {sectionKey: assetFragment} for images that slot into an
//    existing section, plus banners inserted at a position.
const PLACEMENTS = {
  'page-session': {
    images: {
      sessDetails: ['australian-shepherd-puppy-piano-windsor', 'Australian shepherd puppy at a piano in Windsor, California'],
    },
    columnImages: {
      sessArtwork: [
        ['DSC04951', 'Fine art album spread'],
        ['Peaceful_living_room_Wall', 'Wall art displayed in a living room'],
        ['DSC04987-Edit', 'Desktop art print'],
      ],
    },
    banners: [
      // her `artwork-banner` parallax section, between the session copy and
      // The Artwork columns
      {after: 'sessLocations', key: 'sessBanner', ref: 'Modern_chic_living_room_interior', alt: 'Wall art displayed above a sofa in a modern living room'},
    ],
  },
  'page-investment': {
    images: {
      invAddOns: ['MIX_bg_577kam', 'Boutique add-on prints'],
      invWallArt: ['Vintage-cottage chow', 'Framed wall art in a cottage interior'],
      invFolio: ['foliobox3finn', 'Heirloom folio box with matted prints'],
      invCollections: ['Wood Round', 'Wood round wall art'],
      invAlbums: ['Gobook_05 perdy', 'Fine art album with custom image cover'],
    },
    banners: [
      {before: 'invIntro', key: 'invBanner', ref: 'DSC07051-Edit-2', alt: 'Dog portrait displayed as wall art'},
    ],
  },
  'page-tails-of-sonoma-county': {
    images: {
      tscDetails: ['DSC08273-Edit', 'Dog photographed in Sonoma County'],
      tscAbout: ['DARP logo 1', 'Dogwood Animal Rescue Project logo'],
    },
    banners: [
      {before: 'tscIntro', key: 'tscBannerTop', ref: 'Tails of Sonoma County', alt: 'Tails of Sonoma County book cover'},
      {after: 'tscWhy', key: 'tscBanner', ref: 'bernadoodle-Heidi-Adler-Pet-Photography-1-4', alt: 'Bernedoodle photographed in Sonoma County'},
      {after: 'tscAbout', key: 'tscBannerEnd', ref: 'DSC04690-final', alt: 'Rescue dog portrait'},
    ],
  },
  'page-tails-of-the-world': {
    images: {
      twCharity: ['DARP logo 2', 'Dogwood Animal Rescue Project logo'],
      twCharityInfo: ['DSC09980-Edit-Edit-Edit', 'Dog photographed in Sonoma wine country'],
    },
    banners: [
      {before: 'twIntro', key: 'twBannerTop', ref: 'Logo-banner-image-web', alt: 'Tails of the World banner'},
      {after: 'twWho', key: 'twBanner', ref: 'Heidi Adler Photography-1-3', alt: 'Dog photographed in the Sonoma hills'},
      {after: 'twCharityInfo', key: 'twBannerEnd', ref: 'DSC02620-Edit', alt: 'Dog portrait in Sonoma wine country'},
    ],
  },
  pageAbout: {
    images: {
      aboutIntro: ['52Frames Week1', 'Heidi Adler with her dog Jack'],
    },
    columnImages: {
      aboutDifferent: [
        ['labrador-retriever-dogs-in-the-snow-lake-tahoe', 'Labrador retrievers in the snow at Lake Tahoe'],
        ['test2', 'Fine art print of a dog portrait'],
        ['labrador-retriever-windsor-California', 'Labrador retriever photographed in Windsor, California'],
      ],
    },
  },
  'page-faqs': {
    banners: [
      {before: 'faqsMain', key: 'faqsBanner', ref: 'australian-shepherd-action-running', alt: 'Australian shepherd running'},
      {after: 'faqsMain', key: 'faqsBanner2', ref: 'DSC04330', alt: 'Labrador puppy on-leash before retouching'},
    ],
  },
  pageContact: {
    banners: [
      {before: 'contactIntro', key: 'contactBanner', ref: 'DSC09780_Edit', alt: 'Dog photographed in Sonoma County', height: 'medium'},
    ],
  },
}

async function run() {
  assertProject()
  console.log(`${client.config().projectId} — ${APPLY ? 'APPLYING' : 'DRY RUN'}\n`)
  ASSETS = await client.fetch(
    `*[_type=="sanity.imageAsset"]{_id, originalFilename}`,
  )

  for (const [docId, plan] of Object.entries(PLACEMENTS)) {
    const doc = await client.getDocument(docId)
    if (!doc) {
      console.log(`  ${docId}: MISSING doc, skipping`)
      continue
    }
    let sections = [...(doc.sections || [])]
    const notes = []

    // 1. images onto existing split/rich sections
    for (const [key, [frag, alt]] of Object.entries(plan.images || {})) {
      const i = sections.findIndex((s) => s._key === key)
      if (i < 0) {
        notes.push(`no section ${key}`)
        continue
      }
      sections[i] = {...sections[i], image: img(A(frag), alt)}
      notes.push(`img -> ${key}`)
    }

    // 2. images onto three-column items
    for (const [key, cols] of Object.entries(plan.columnImages || {})) {
      const i = sections.findIndex((s) => s._key === key)
      if (i < 0) {
        notes.push(`no section ${key}`)
        continue
      }
      const columns = (sections[i].columns || []).map((c, n) => {
        const spec = cols[n]
        if (!spec) return c
        return {...c, hideMedia: false, image: img(A(spec[0]), spec[1])}
      })
      sections[i] = {...sections[i], columns}
      notes.push(`${cols.length} col imgs -> ${key}`)
    }

    // 3. parallax banners
    for (const b of plan.banners || []) {
      if (sections.some((s) => s._key === b.key)) continue
      const sec = fullBleed(b.key, {ref: A(b.ref), alt: b.alt, height: b.height})
      if (b.before) {
        const i = sections.findIndex((s) => s._key === b.before)
        sections.splice(i < 0 ? 0 : i, 0, sec)
      } else {
        const i = sections.findIndex((s) => s._key === b.after)
        sections.splice(i < 0 ? sections.length : i + 1, 0, sec)
      }
      notes.push(`banner ${b.key}`)
    }

    console.log(`  ${docId.padEnd(30)} ${String((doc.sections || []).length).padStart(2)} -> ${String(sections.length).padStart(2)}  ${notes.join(', ')}`)

    if (APPLY) {
      await client.patch(docId).set({sections}).commit()
      const d = await client.getDocument(`drafts.${docId}`)
      if (d) await client.patch(`drafts.${docId}`).set({sections}).commit()
    }
  }

  if (!APPLY) console.log('\n  DRY RUN — nothing written.')
  else console.log('\n  ✓ images placed')
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
