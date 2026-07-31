// Replace donor placeholder copy in Heidi Adler's footer, and fill the
// business phone/email that her real site publishes in its own footer.
//
// The donor seed left "Images that Rock!" + "Write a description about your
// business and who you serve in this column and locations served for SEO."
// rendering on every page of her live site.
//
// Also fixes a doubled dash on the Thom Jones pull quote: the template
// already renders an em dash before the attribution, so storing "― Thom
// Jones" produced "— ― Thom Jones".
//
// Source: https://www.heidiadlerphotography.com/ footer (fetched 2026-07-31).
//
// Run:
//   cd studio && npx dotenv -e .env.heidi-adler-photography-backup -- \
//     npx sanity exec scripts/migrations/heidi-footer-and-contact.js \
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
  return actual
}

const PHONE = '707-395-7762'
const EMAIL = 'heidi@heidiadlerphotography.com'
const TAGLINE =
  'Creating custom portraits for pets & their people in Sonoma, Napa, & the North Bay area'

async function run() {
  const pid = assertProject()
  console.log(`${pid} — ${APPLY ? 'APPLYING' : 'DRY RUN (pass --apply)'}\n`)

  const footer = await client.getDocument('footerSettings')
  const mid = footer?.middleColumn || {}
  const oldLabel = mid.label
  const oldNote = mid.note?.[0]?.children?.[0]?.text

  console.log('  footer middle column')
  console.log(`    label : ${JSON.stringify(oldLabel)}  ->  ${JSON.stringify('Heidi Adler Photography')}`)
  console.log(`    note  : ${JSON.stringify((oldNote || '').slice(0, 52))}…`)
  console.log(`            ->  ${JSON.stringify(TAGLINE.slice(0, 52))}…`)
  console.log(`  seoSettings.businessPhone -> ${PHONE}`)
  console.log(`  seoSettings.businessEmail -> ${EMAIL}`)
  console.log('  pull-quote attribution    -> "Thom Jones" (drops doubled dash)')

  if (!APPLY) {
    console.log('\n  DRY RUN — nothing written.')
    return
  }

  await client
    .patch('footerSettings')
    .set({
      'middleColumn.label': 'Heidi Adler Photography',
      'middleColumn.note': [
        {
          _key: 'heidiTagline',
          _type: 'block',
          style: 'normal',
          markDefs: [],
          children: [
            {_key: 'heidiTaglineSpan', _type: 'span', marks: [], text: TAGLINE},
          ],
        },
      ],
    })
    .commit()

  await client
    .patch('seoSettings')
    .set({businessPhone: PHONE, businessEmail: EMAIL})
    .commit()

  // drop the doubled dash on the pull quote
  const home = await client.getDocument('homepagePage')
  const sections = (home.sections || []).map((s) =>
    s._key === 'homeQuote' ? {...s, attribution: 'Thom Jones'} : s,
  )
  await client.patch('homepagePage').set({sections}).commit()

  for (const id of ['drafts.footerSettings', 'drafts.seoSettings', 'drafts.homepagePage']) {
    const d = await client.getDocument(id)
    if (!d) continue
    if (id.endsWith('homepagePage')) {
      await client.patch(id).set({sections}).commit()
    } else if (id.endsWith('seoSettings')) {
      await client.patch(id).set({businessPhone: PHONE, businessEmail: EMAIL}).commit()
    } else {
      await client
        .patch(id)
        .set({
          'middleColumn.label': 'Heidi Adler Photography',
          'middleColumn.note': [
            {
              _key: 'heidiTagline',
              _type: 'block',
              style: 'normal',
              markDefs: [],
              children: [
                {_key: 'heidiTaglineSpan', _type: 'span', marks: [], text: TAGLINE},
              ],
            },
          ],
        })
        .commit()
    }
    console.log(`  draft patched: ${id}`)
  }

  console.log('\n  ✓ footer + contact details updated')
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
