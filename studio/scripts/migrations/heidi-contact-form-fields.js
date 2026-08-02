// Copy Heidi Adler's Squarespace contact form fields onto her new contact form.
//
// Read off the live form's rendered DOM (2026-08-01) — the Squarespace form is
// a JS-hydrated website-component, so the fields aren't in the page HTML or in
// ?format=json-pretty; they only exist once the component boots.
//
// Her form, in order:
//   First Name*        text      (Squarespace splits the name into two inputs)
//   Last Name*         text
//   Your Pet's Name    text
//   Email*             email
//   Phone*             tel       (unlabelled in the DOM; identified by
//                                 autocomplete="tel-national")
//   Tell me about your dog(s)!   textarea + helper text
//   How did you hear about me?*  text + helper text
//   Consent checkbox   checkbox
//
// NOT copied: her trailing `message-field` input with autocomplete="new-password".
// That's Squarespace's honeypot, not a real field — our form already ships its
// own (`botcheck`), and duplicating it would just be a second empty input.
//
// Run:
//   cd studio && npx dotenv -e .env.heidi-adler-photography-backup -- \
//     npx sanity exec scripts/migrations/heidi-contact-form-fields.js \
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

// [name, label, type, required, helperText]
const FIELDS = [
  ['first_name', 'First Name', 'text', true, null],
  ['last_name', 'Last Name', 'text', true, null],
  ['pet_name', "Your Pet's Name", 'text', false, null],
  ['email', 'Email', 'email', true, null],
  ['phone', 'Phone', 'tel', true, null],
  [
    'about_your_dogs',
    'Tell me about your dog(s)!',
    'textarea',
    true,
    'Tell me about your dog(s) and what questions you might have.',
  ],
  [
    'how_did_you_hear',
    'How did you hear about me?',
    'text',
    true,
    'Word of mouth, Facebook, Instagram, Google search, in person, etc.',
  ],
  [
    'email_consent',
    'I agree to receive email communications from Heidi Adler Photography',
    'checkbox',
    false,
    null,
  ],
]

async function run() {
  assertProject()
  console.log(`${client.config().projectId} — ${APPLY ? 'APPLYING' : 'DRY RUN'}\n`)

  const doc = await client.getDocument('pageContact')
  const idx = (doc.sections || []).findIndex((s) => s._type === 'contactFormSection')
  if (idx < 0) throw new Error('No contactFormSection on pageContact')

  const formFields = FIELDS.map(([name, label, type, required, description]) => ({
    _key: `f-${name}`,
    _type: 'formField',
    name,
    label,
    type,
    required,
    ...(description ? {description} : {}),
  }))

  const before = doc.sections[idx].formFields || []
  console.log(`  ${before.length} field(s) -> ${formFields.length}`)
  for (const f of formFields) {
    console.log(
      `    ${f.label.slice(0, 46).padEnd(46)} ${f.type.padEnd(9)}${f.required ? 'required' : ''}`,
    )
    if (f.description) console.log(`        hint: ${f.description}`)
  }

  const sections = [...doc.sections]
  sections[idx] = {
    ...sections[idx],
    mode: 'built-in',
    formFields,
    submitText: 'Submit', // hers reads SUBMIT
  }

  if (!APPLY) {
    console.log('\n  DRY RUN — nothing written.')
    return
  }
  await client.patch('pageContact').set({sections}).commit()
  const d = await client.getDocument('drafts.pageContact')
  if (d) await client.patch('drafts.pageContact').set({sections}).commit()
  console.log('\n  ✓ form fields copied')
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
