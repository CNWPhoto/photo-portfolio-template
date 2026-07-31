// Two gaps found by diffing the rebuilt pages against Heidi's live site:
//
//   1. Her Contact page shows her phone (707-395-7762) and email directly
//      under the "Contact Heidi" heading. The rebuilt page had the copy and
//      the form but no visible contact details — they only existed in
//      seoSettings, which feeds LocalBusiness schema, not the page.
//
//   2. The "What if my dog needs to stay on leash?" FAQ dropped her closing
//      line: "Check out what a before and after image looks like of this
//      adorable little lab!"
//
// Run:
//   cd studio && npx dotenv -e .env.heidi-adler-photography-backup -- \
//     npx sanity exec scripts/migrations/heidi-contact-and-faq-gaps.js \
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

const LEASH_ANSWER =
  'All the cool kids are wearing them! As your dog’s safety is of the utmost importance, leashes are required for all sessions. But don’t worry, with a little photoshop magic, they will be removed from your final images. Check out what a before and after image looks like of this adorable little lab!'

async function commitBoth(id, mutate) {
  await mutate(client.patch(id)).commit()
  const d = await client.getDocument(`drafts.${id}`)
  if (d) await mutate(client.patch(`drafts.${id}`)).commit()
}

async function run() {
  assertProject()
  console.log(`${client.config().projectId} — ${APPLY ? 'APPLYING' : 'DRY RUN'}\n`)

  // 1 ── contact details on the Contact page
  const contact = await client.getDocument('pageContact')
  const hasInfo = (contact.sections || []).some(
    (s) => s._type === 'contactInfoSection',
  )
  const infoSection = {
    _key: 'contactDetails',
    _type: 'contactInfoSection',
    enabled: true,
    showPhone: true,
    showEmail: true,
    phoneOverride: '707-395-7762',
    emailOverride: 'heidi@heidiadlerphotography.com',
    showSocial: true,
    showMap: false,
  }
  // insert right after the intro, before the form — matching her page order
  const idx = (contact.sections || []).findIndex(
    (s) => s._type === 'contactFormSection',
  )
  const sections = [...(contact.sections || [])]
  if (!hasInfo) sections.splice(idx < 0 ? sections.length : idx, 0, infoSection)
  console.log(
    `  pageContact: ${hasInfo ? 'contactInfoSection already present' : 'adding contactInfoSection (phone + email)'}`,
  )

  // 2 ── restore the dropped FAQ line
  const faqs = await client.getDocument('page-faqs')
  let fixed = 0
  const faqSections = (faqs.sections || []).map((s) => {
    if (s._type !== 'faqSection') return s
    return {
      ...s,
      faqs: (s.faqs || []).map((f) => {
        if (!/stay on leash/i.test(f.question || '')) return f
        const cur = f.answer?.[0]?.children?.[0]?.text || ''
        if (cur.includes('before and after')) return f
        fixed++
        return {
          ...f,
          answer: [
            {
              _key: 'leashAns',
              _type: 'block',
              style: 'normal',
              markDefs: [],
              children: [
                {_key: 'leashAnsSpan', _type: 'span', marks: [], text: LEASH_ANSWER},
              ],
            },
          ],
        }
      }),
    }
  })
  console.log(`  page-faqs  : ${fixed} answer(s) restored (before/after lab line)`)

  if (!APPLY) {
    console.log('\n  DRY RUN — nothing written.')
    return
  }
  if (!hasInfo) await commitBoth('pageContact', (p) => p.set({sections}))
  if (fixed) await commitBoth('page-faqs', (p) => p.set({sections: faqSections}))
  console.log('\n  ✓ gaps closed')
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
