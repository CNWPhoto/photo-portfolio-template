// Last two image gaps on Heidi Adler's site.
//
//   1. Her Session page's `session-info` section carries TWO photos; only one
//      was placed. Adds the second to the intro.
//
//   2. Her PPA Member and Professional Photographers accreditation badges
//      appear on her live site but had nowhere to go: footerSettings has no
//      image field, so they can't sit in the footer the way hers do. Placed on
//      About instead, where credentials read naturally.
//
// NOTE (template follow-up): footerSettings should grow a trust-badge array —
// PPA/accreditation marks are common for photographers and every client
// migrating from Squarespace or Wix will hit this same wall.
//
// Run:
//   cd studio && npx dotenv -e .env.heidi-adler-photography-backup -- \
//     npx sanity exec scripts/migrations/heidi-badges-and-session-image.js \
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
  const f = norm(frag)
  const hit = ASSETS.find((a) => norm(a.originalFilename).includes(f))
  if (!hit) throw new Error(`No asset matching "${frag}"`)
  return hit._id
}
const img = (ref, alt) => ({
  _type: 'image',
  asset: {_type: 'reference', _ref: ref},
  ...(alt ? {alt} : {}),
})

async function save(id, sections) {
  await client.patch(id).set({sections}).commit()
  const d = await client.getDocument(`drafts.${id}`)
  if (d) await client.patch(`drafts.${id}`).set({sections}).commit()
}

async function run() {
  assertProject()
  console.log(`${client.config().projectId} — ${APPLY ? 'APPLYING' : 'DRY RUN'}\n`)
  ASSETS = await client.fetch(`*[_type=="sanity.imageAsset"]{_id, originalFilename}`)

  // 1 ── second session photo
  const sess = await client.getDocument('page-session')
  let sSections = [...(sess.sections || [])]
  const si = sSections.findIndex((s) => s._key === 'sessIntro')
  if (si >= 0 && !sSections[si].image) {
    // sessIntro is a richTextSection; convert to a split so the photo has a home
    sSections[si] = {
      ...sSections[si],
      _type: 'splitSection',
      imageLayout: 'left',
      image: img(
        A('Heidi-Adler-Pet-Photography-1-19'),
        'Dog photographed on location in Sonoma County',
      ),
    }
    console.log('  page-session : sessIntro -> splitSection with her second photo')
  } else {
    console.log('  page-session : sessIntro already has an image, skipping')
  }

  // 2 ── credentials on About
  const about = await client.getDocument('pageAbout')
  let aSections = [...(about.sections || [])]
  if (!aSections.some((s) => s._key === 'aboutBadges')) {
    const idx = aSections.findIndex((s) => s._key === 'aboutCta')
    const badges = {
      _key: 'aboutBadges',
      _type: 'threeColumnSection',
      enabled: true,
      heading: null,
      columns: [
        {
          _key: 'badgePpa',
          _type: 'columnItem',
          hideMedia: false,
          image: img(A('PPA_Member_Color'), 'Professional Photographers of America member'),
        },
        {
          _key: 'badgeAccred',
          _type: 'columnItem',
          hideMedia: false,
          image: img(A('accreditation-associate'), 'Accredited associate photographer'),
        },
      ],
      columnWidths: 'equal',
    }
    aSections.splice(idx < 0 ? aSections.length : idx, 0, badges)
    console.log('  pageAbout    : added PPA + accreditation badges')
  } else {
    console.log('  pageAbout    : badges already present, skipping')
  }

  if (!APPLY) {
    console.log('\n  DRY RUN — nothing written.')
    return
  }
  await save('page-session', sSections)
  await save('pageAbout', aSections)
  console.log('\n  ✓ done')
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
