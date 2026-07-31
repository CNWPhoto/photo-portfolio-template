// Move Heidi Adler's PPA + accreditation marks from the About page into the
// footer, now that footerSettings has a badges[] field.
//
// They live in the footer of her Squarespace site, on every page. They were
// parked on About only because the template had nowhere else to put them.
//
// Run:
//   cd studio && npx dotenv -e .env.heidi-adler-photography-backup -- \
//     npx sanity exec scripts/migrations/heidi-footer-badges.js \
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

const BADGES = [
  ['ppa', 'PPA_Member_Color', 'Professional Photographers of America member'],
  ['accred', 'accreditation-associate', 'Accredited associate photographer'],
]

async function save(id, patchFn) {
  await patchFn(client.patch(id)).commit()
  const d = await client.getDocument(`drafts.${id}`)
  if (d) await patchFn(client.patch(`drafts.${id}`)).commit()
}

async function run() {
  assertProject()
  console.log(`${client.config().projectId} — ${APPLY ? 'APPLYING' : 'DRY RUN'}\n`)
  ASSETS = await client.fetch(`*[_type=="sanity.imageAsset"]{_id, originalFilename}`)

  const badges = BADGES.map(([key, frag, label]) => ({
    _key: `badge-${key}`,
    _type: 'footerBadge',
    label,
    image: {_type: 'image', asset: {_type: 'reference', _ref: A(frag)}, alt: label},
  }))
  console.log(`  footerSettings.badges <- ${badges.map((b) => b.label).join(', ')}`)

  // drop the stand-in section from About
  const about = await client.getDocument('pageAbout')
  const sections = (about.sections || []).filter((s) => s._key !== 'aboutBadges')
  const removed = (about.sections || []).length - sections.length
  console.log(`  pageAbout: ${removed ? 'removed the stand-in aboutBadges section' : 'no stand-in section found'}`)

  if (!APPLY) {
    console.log('\n  DRY RUN — nothing written.')
    return
  }
  await save('footerSettings', (p) => p.set({badges}))
  if (removed) await save('pageAbout', (p) => p.set({sections}))
  console.log('\n  ✓ badges moved to the footer')
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
