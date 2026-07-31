// Rebuild Heidi Adler's homepage to match her real Squarespace homepage.
//
// The donor seed left generic scaffold in place that the overlay never
// replaced: the "How It Works" steps were the demo's (Inquire/Plan/Capture),
// the testimonials section was empty, a "Why Choose Our Studio?" block she
// never had was present, and BOTH non-hero images were demo stock photos —
// including the one illustrating her own "Pets are family" intro.
//
// Four sections of her real homepage were missing entirely: the on-leash FAQ
// teaser, the "Hi, I'm Heidi!" intro, the "Is this right for you?" qualifier,
// and the Thom Jones pull quote. Her one real testimonial (Kim S) was never
// migrated — an earlier pass wrongly concluded she had none because the
// Squarespace section was NAMED "Testimonial Banner".
//
// Source of truth: https://www.heidiadlerphotography.com/ (fetched 2026-07-31).
// All copy below is hers, verbatim. Nothing here is invented.
//
// Run:
//   cd studio && npx dotenv -e .env.heidi-adler-photography-backup -- \
//     npx sanity exec scripts/migrations/heidi-homepage-rebuild.js \
//     --with-user-token -- --slug=heidi-adler-photography --apply

import {getCliClient} from 'sanity/cli'
import fs from 'node:fs'
import path from 'node:path'

const client = getCliClient({apiVersion: '2024-01-01'})
const APPLY = process.argv.includes('--apply')
const slug =
  (process.argv.find((a) => a.startsWith('--slug=')) || '').split('=')[1] || ''

// ── guard: refuse to write to the wrong project ────────────────────────────
// Inlined rather than imported: this runs under `sanity exec`
// (esbuild-register/CJS) and cannot import the ESM lib.js.
function assertProject() {
  const envPath = path.resolve(
    process.cwd(),
    `.env.${slug}-backup`,
  )
  if (!slug) throw new Error('Missing --slug=<slug>')
  const txt = fs.readFileSync(envPath, 'utf8')
  const m = txt.match(/^SANITY_STUDIO_PROJECT_ID=(.*)$/m)
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

// ── her real photos (donor stock replaced) ─────────────────────────────────
const IMG = {
  intro: 'image-02078d6fad15d2c034337326445aa381998dc655-2048x1502-webp',
  onLeash: 'image-00d8c52016e4e81addfa4fc72f3ac2ecfd17f0b6-2450x1633-webp',
  heidi: 'image-0021445856b3f6d7ac6f7f8632cb4b1f51832e94-1366x2048-webp',
  qualifier: 'image-062710758b4c3cb1fa831beb1bfb646d3d3e60e7-2048x1365-webp',
}

const img = (ref, alt) => ({
  _type: 'image',
  asset: {_type: 'reference', _ref: ref},
  ...(alt ? {alt} : {}),
})

const pt = (key, text) => [
  {
    _key: key,
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{_key: key + 's', _type: 'span', marks: [], text}],
  },
]

const link = (pageId) => ({
  _type: 'ctaLink',
  type: 'internal',
  internal: {_type: 'reference', _ref: pageId, _weak: true},
})

// ── her real 4-step process, verbatim ──────────────────────────────────────
const STEPS = [
  [
    '01',
    'Book your session',
    'Get in touch to schedule a call to plan all of the details; dates, time, location, and how you’d like to display your images afterward.',
  ],
  [
    '02',
    'Play Date',
    'This is where the fun happens! Leave all worries and expectations at home and just enjoy the photo session. Your dog’s only job is to be a dog!',
  ],
  [
    '03',
    'View & Order',
    'We’ll get together to view your photos about 2 weeks after your session. You choose your favorites and pick out your artwork. Most clients choose a combination of wall art, albums, and digital files.',
  ],
  [
    '04',
    'Happy Days!',
    'Your products are in and you can’t stop smiling as you enjoy your gorgeous new artwork!',
  ],
]

const TESTIMONIAL_ID = 'testimonial-kim-s'

async function run() {
  const pid = assertProject()
  console.log(`${pid} — ${APPLY ? 'APPLYING' : 'DRY RUN (pass --apply)'}\n`)

  const home = await client.getDocument('homepagePage')
  if (!home) throw new Error('No homepagePage document')
  const byKey = Object.fromEntries((home.sections || []).map((s) => [s._key, s]))

  // 1 ── her real testimonial (was never migrated)
  const testimonial = {
    _id: TESTIMONIAL_ID,
    _type: 'testimonial',
    client: 'Kim S',
    testimonial:
      'Heidi is a dog whisperer! Her ability to bring out the best in a pet is beyond amazing. Her skill with a camera captures so many great pictures that it is difficult to choose the final portfolio.',
    starRating: 5,
    order: 1,
  }

  // 2 ── rebuild sections in her original page order
  const sections = [
    // hero — unchanged, already hers
    byKey.homeHero,

    // "Pets are family" — her copy was right; the IMAGE was demo stock
    {
      ...byKey.homeSplit,
      image: img(IMG.intro, 'Australian shepherd photographed in Sonoma County'),
    },

    byKey.homeFeatured,

    // her real 4-step process (was the demo's 3 generic steps)
    {
      ...byKey.homeSteps,
      _type: 'stepsSection',
      _key: 'homeSteps',
      eyebrow: 'The Experience',
      heading: null,
      gridColumns: 4,
      steps: STEPS.map(([n, title, body], i) => ({
        _key: `step${i + 1}`,
        _type: 'stepItem',
        stepNumber: n,
        title,
        body: pt(`sb${i + 1}`, body),
      })),
      ctaText: 'Session Information',
      ctaLink: link('page-session'),
    },

    // her real testimonial
    {
      ...byKey.homeTestimonials,
      _type: 'testimonialsSection',
      _key: 'homeTestimonials',
      heading: null,
      source: 'pickSpecific',
      testimonials: [
        {_key: 'tk1', _type: 'reference', _ref: TESTIMONIAL_ID},
      ],
    },

    // "But my dog needs to be on-leash" — missing entirely
    {
      _key: 'homeOnLeash',
      _type: 'splitSection',
      enabled: true,
      heading: 'But my dog needs to be on-leash',
      body: pt(
        'ol1',
        'If you’re concerned about this or your pet’s obedience level, don’t be! Most of the pets you see here were actually on-leash during their session.',
      ),
      image: img(IMG.onLeash, 'Three dogs photographed on-leash in Windsor, California'),
      imageLayout: 'left',
      ctaText: 'More FAQs Here',
      ctaLink: link('page-faqs'),
    },

    // "Hi, I'm Heidi!" — missing entirely
    {
      _key: 'homeMeetHeidi',
      _type: 'splitSection',
      enabled: true,
      heading: 'Hi, I’m Heidi! And this is my best guy Jack!',
      body: pt(
        'mh1',
        'I’m an educator turned photographer and you can learn all about me here.',
      ),
      image: img(IMG.heidi, 'Heidi Adler, Sonoma County pet photographer'),
      imageLayout: 'right',
      ctaText: 'Meet Me',
      ctaLink: link('pageAbout'),
    },

    // "Is this right for you?" — missing entirely
    {
      _key: 'homeQualifier',
      _type: 'ctaBandSection',
      enabled: true,
      heading: 'Is this right for you?',
      body: 'Do you love your dog to the moon and back? Do they not only steal your heart, but your bed covers too? Do you appreciate quality over quantity? Are you wanting to capture and showcase the love and bond you share through wall art or an album? If you answered yes to any or all of those, then it’s time to chat.',
      ctaText: 'Schedule a call',
      ctaLink: link('pageContact'),
      backgroundImage: img(IMG.qualifier, 'Dog on a bridge in Sonoma County'),
    },

    // Thom Jones pull quote — missing entirely
    {
      _key: 'homeQuote',
      _type: 'pullQuoteSection',
      enabled: true,
      quote:
        'Dogs have a way of finding the people who need them, and filling an emptiness we didn’t ever know we had.',
      attribution: '― Thom Jones',
      variant: 'centered',
    },
  ].filter(Boolean)

  // dropped: homeWhy ("Why Choose Our Studio?" — donor, plus a demo stock
  // photo) and homeFaq (generic donor FAQ; her real FAQ teaser is the
  // on-leash split above, and the full set lives on /faqs/).
  const dropped = ['homeWhy', 'homeFaq'].filter((k) => byKey[k])

  console.log('  sections after rebuild:')
  for (const s of sections) console.log(`    ${s._type.padEnd(26)} ${s._key}`)
  console.log(`\n  dropped donor sections: ${dropped.join(', ') || 'none'}`)
  console.log(`  testimonial created   : ${testimonial.client}`)
  console.log(`  demo stock images replaced with her photos: 2`)

  if (!APPLY) {
    console.log('\n  DRY RUN — nothing written.')
    return
  }

  await client.createOrReplace(testimonial)
  await client
    .patch('homepagePage')
    .set({sections})
    .commit()
  // keep the draft in step so Studio doesn't show stale content
  const draft = await client.getDocument('drafts.homepagePage')
  if (draft) {
    await client.patch('drafts.homepagePage').set({sections}).commit()
    console.log('  draft patched too')
  }
  console.log('\n  ✓ homepage rebuilt')
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
