// Match the FAQ image layout to Heidi's real page.
//
// Measured on her live /faqs (2026-08-01): the two labrador shots sit SIDE BY
// SIDE as a before/after pair, and DSC04330 sits alone on its own row. My
// rebuild put all three in one gallery and set `layout: "grid"` — which is not
// a valid option (grid-2 | grid-3 | grid-4 | masonry | carousel), so the
// component emitted no `gallery--grid-N` class and grid-template-columns never
// applied at all.
//
// No new section type is needed: galleryGridSection already does two-up via
// layout 'grid-2', with a gap control for the spacing between.
//
// Run:
//   cd studio && npx dotenv -e .env.heidi-adler-photography-backup -- \
//     npx sanity exec scripts/migrations/heidi-faqs-before-after.js \
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

let ASSETS = []
const norm = (n) => String(n || '').toLowerCase().replace(/[^a-z0-9]/g, '')
function A(frag) {
  const hit = ASSETS.find((a) => norm(a.originalFilename).includes(norm(frag)))
  if (!hit) throw new Error(`No asset matching "${frag}"`)
  return hit._id
}
const img = (frag, alt) => ({
  _type: 'image',
  asset: {_type: 'reference', _ref: A(frag)},
  alt,
})

async function run() {
  assertProject()
  console.log(`${client.config().projectId} — ${APPLY ? 'APPLYING' : 'DRY RUN'}\n`)
  ASSETS = await client.fetch(`*[_type=="sanity.imageAsset"]{_id, originalFilename}`)

  const doc = await client.getDocument('page-faqs')
  const i = (doc.sections || []).findIndex((s) => s._key === 'faqLeashImages')
  if (i < 0) throw new Error('faqLeashImages not found on page-faqs')

  const beforeAfter = {
    _key: 'faqBeforeAfter',
    _type: 'galleryGridSection',
    enabled: true,
    backgroundTone: 'alt',
    layout: 'grid-2', // two-up — the valid option my rebuild missed
    gap: 'normal',
    lightbox: true,
    images: [
      {
        _key: 'ba1',
        ...img('labrador-retriever-puppy-heidi-adler-photography', 'Labrador puppy on-leash — before retouching'),
      },
      {
        _key: 'ba2',
        ...img('labrador-retriever-Heidi-Adler-Photography', 'The same labrador with the leash retouched out — after'),
      },
    ],
  }

  // DSC04330 sits alone on her page, so it gets its own full-width block
  const solo = {
    _key: 'faqSoloImage',
    _type: 'fullBleedImageSection',
    enabled: true,
    backgroundTone: 'default',
    image: img('DSC04330', 'Labrador retriever portrait'),
    height: 'medium',
    parallax: false,
  }

  const sections = [...doc.sections]
  sections.splice(i, 1, beforeAfter, solo)

  console.log('  faqLeashImages (3 images, layout:"grid" — invalid) becomes:')
  console.log(`    galleryGridSection    faqBeforeAfter  layout=grid-2  2 images, gap=normal`)
  console.log(`    fullBleedImageSection faqSoloImage    DSC04330 on its own row`)

  if (!APPLY) {
    console.log('\n  DRY RUN — nothing written.')
    return
  }
  await client.patch('page-faqs').set({sections}).commit()
  const d = await client.getDocument('drafts.page-faqs')
  if (d) await client.patch('drafts.page-faqs').set({sections}).commit()
  console.log('\n  ✓ before/after pair now renders two-up')
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
