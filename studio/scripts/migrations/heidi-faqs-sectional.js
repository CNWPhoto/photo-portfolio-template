// Rebuild Heidi Adler's FAQs page to match her real one.
//
// Hers is not an accordion. Each question is its own section — heading, answer,
// and in one case a row of images — ending with two side-by-side CTAs. The
// migration had collapsed all six into a single faqSection dropdown, which
// loses the photographs entirely and buries the answers behind clicks.
//
// Structure read off her rendered page (2026-08-01):
//   H1  FAQs                                  -> hero (already in place)
//   IMG australian-shepherd-action-running    -> hero image (already in place)
//   Q   What if my dog wont sit still?
//   Q   What if my dog needs to stay on leash?  + "check out the before and after"
//   IMG labrador-retriever-puppy / labrador-retriever / DSC04330   <- the before/after set
//   Q   What if my dog is a bit anxious?
//   Q   What should I bring to my session?      (four items)
//   Q   Can I be in the images too?
//   Q   This sounds great! How do I book?
//   BTN Click here for session info -> /session
//   BTN Ready? Book your session    -> /contact
//
// The two buttons are why ctaBandSection gained secondaryCtaText/Link.
//
// Her source has a typo — "Do'n't worry about that" — corrected to "Don't".
// Everything else is verbatim.
//
// Run:
//   cd studio && npx dotenv -e .env.heidi-adler-photography-backup -- \
//     npx sanity exec scripts/migrations/heidi-faqs-sectional.js \
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

let k = 0
const key = (p) => `${p}${++k}`
const body = (paras) =>
  paras.map((text) => {
    const id = key('b')
    return {
      _key: id,
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [{_key: id + 's', _type: 'span', marks: [], text}],
    }
  })
const bullets = (items) =>
  items.map((text) => {
    const id = key('li')
    return {
      _key: id,
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [{_key: id + 's', _type: 'span', marks: [], text}],
    }
  })
const link = (id) => ({
  _type: 'ctaLink',
  type: 'internal',
  internal: {_type: 'reference', _ref: id, _weak: true},
})
const qa = (_key, heading, paras, opts = {}) => ({
  _key,
  _type: 'richTextSection',
  enabled: true,
  heading,
  body: opts.list ? [...body(paras), ...bullets(opts.list)] : body(paras),
  maxWidth: 'default',
  textAlignment: 'left',
  spacing: 'normal',
  backgroundTone: opts.tone || 'default',
})

async function run() {
  assertProject()
  console.log(`${client.config().projectId} — ${APPLY ? 'APPLYING' : 'DRY RUN'}\n`)
  ASSETS = await client.fetch(`*[_type=="sanity.imageAsset"]{_id, originalFilename}`)

  const doc = await client.getDocument('page-faqs')
  const hero = (doc.sections || []).find((s) => s._type === 'heroSection')
  if (!hero) throw new Error('No hero on page-faqs — run heidi-page-heroes.js first')

  const sections = [
    hero,

    qa('faqSit', 'What if my dog won’t sit still?', [
      'It’s okay! We will still get the shot. I photograph hyper, untrained dogs all the time and guarantee we’ll get the images you love, or your money back!',
    ]),

    qa(
      'faqLeash',
      'What if my dog needs to stay on leash?',
      [
        'All the cool kids are wearing them! As your dog’s safety is of the utmost importance, leashes are required for all sessions. But don’t worry, with a little photoshop magic, they will be removed from your final images.',
        'Check out what a before and after image looks like of this adorable little lab!',
      ],
      {tone: 'alt'},
    ),

    // the before/after set that sits under the leash answer on her page
    {
      _key: 'faqLeashImages',
      _type: 'galleryGridSection',
      enabled: true,
      backgroundTone: 'alt',
      layout: 'grid',
      gap: 'normal',
      lightbox: true,
      images: [
        ['labrador-retriever-puppy-heidi-adler-photography', 'Labrador puppy on-leash, before retouching'],
        ['labrador-retriever-Heidi-Adler-Photography', 'The same labrador with the leash removed'],
        ['DSC04330', 'Labrador retriever portrait'],
      ].map(([frag, alt]) => ({
        _key: key('gi'),
        _type: 'image',
        asset: {_type: 'reference', _ref: A(frag)},
        alt,
      })),
    },

    qa('faqAnxious', 'What if my dog is a bit anxious?', [
      'Don’t worry about that, I have anxious dogs too. We don’t force your dog to do anything, we just work at their pace so they feel comfortable and have a good time!',
    ]),

    qa('faqBring', 'What should I bring to my session?', [], {
      list: [
        'Your dog of course!',
        'Small, bite-sized treats and their favorite toys.',
        'A flat collar for the photos if your dog needs to walk on a leash.',
        'A positive attitude! We are here to have fun!',
      ],
      tone: 'alt',
    }),

    qa('faqInImages', 'Can I be in the images too?', [
      'Absolutely! I love capturing the special bond between a dog and their people. You don’t have to be in them, but I definitely recommend jumping in for a few.',
    ]),

    qa('faqBook', 'This sounds great! How do I book?', [
      'You can easily book your session through the button below. Or give me a call at 707-395-7762 or email at heidi@heidiadlerphotography.com',
    ]),

    {
      _key: 'faqsCta',
      _type: 'ctaBandSection',
      enabled: true,
      backgroundTone: 'default',
      layout: 'centered',
      heading: 'Ready?',
      ctaText: 'Book your session',
      ctaLink: link('pageContact'),
      secondaryCtaText: 'Click here for session info',
      secondaryCtaLink: link('page-session'),
      backgroundImage: {
        _type: 'image',
        asset: {_type: 'reference', _ref: A('australian-shepherd-action-running')},
      },
      parallax: true,
    },
  ]

  const before = (doc.sections || []).map((s) => s._type)
  console.log(`  before: ${before.join(', ')}`)
  console.log(`  after :`)
  for (const s of sections) console.log(`    ${s._type.padEnd(22)} ${s._key.padEnd(16)} ${s.heading || ''}`)
  console.log(`\n  accordion replaced by ${sections.filter((s) => s._type === 'richTextSection').length} question sections`)
  console.log(`  images restored: 3 (the before/after set)`)
  console.log(`  CTAs: 2 (Book your session + Click here for session info)`)

  if (!APPLY) {
    console.log('\n  DRY RUN — nothing written.')
    return
  }
  await client.patch('page-faqs').set({sections}).commit()
  const d = await client.getDocument('drafts.page-faqs')
  if (d) await client.patch('drafts.page-faqs').set({sections}).commit()
  console.log('\n  ✓ FAQs page rebuilt')
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
