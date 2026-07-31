// Give every Heidi Adler page a hero with a real <h1>.
//
// Six of her nine pages had NO h1 at all. The full-bleed banners placed at the
// top of Contact, FAQs, Investment and both Tails pages render an <h2>
// (FullBleedImageSection), and About and Session opened on a splitSection —
// also <h2>. Only the homepage and portfolio had an h1.
//
// Swaps the leading fullBleedImageSection for a heroSection carrying the same
// image, and prepends one on the two pages that had no banner. The heading for
// each hero is the page's OWN heading, lifted from the section below it — which
// then has its heading cleared, so there is exactly one h1 and no duplicate.
//
// Mid-page banners are left as fullBleedImageSection: they are decorative
// parallax dividers and correctly carry no h1.
//
// Run:
//   cd studio && npx dotenv -e .env.heidi-adler-photography-backup -- \
//     npx sanity exec scripts/migrations/heidi-page-heroes.js \
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

const heroFrom = (key, {imageRef, alt, heading, eyebrow, subheading}) => ({
  _key: key,
  _type: 'heroSection',
  enabled: true,
  variant: 'image-full',
  heightMode: 'tall',
  images: [
    {
      _key: `${key}Img`,
      _type: 'image',
      asset: {_type: 'reference', _ref: imageRef},
      ...(alt ? {alt} : {}),
    },
  ],
  heading,
  ...(eyebrow ? {eyebrow} : {}),
  ...(subheading ? {subheading} : {}),
  textAlignment: 'center',
  textPosition: 'center',
  overlayOpacity: 0.35,
})

// docId -> {heading lifted from `clearHeadingOn`, image for pages with no banner}
const PLAN = {
  pageContact: {heading: 'Contact Heidi', clearHeadingOn: 'contactIntro'},
  'page-faqs': {heading: 'FAQs', clearHeadingOn: 'faqsMain'},
  'page-investment': {heading: 'Products & Pricing', clearHeadingOn: 'invIntro'},
  'page-tails-of-sonoma-county': {
    heading: 'Tails of Sonoma County',
    eyebrow: 'Calling All Sonoma County Dogs!',
    clearHeadingOn: 'tscIntro',
  },
  'page-tails-of-the-world': {
    heading: 'Tails of the World: Sonoma Wine Country Dogs',
    eyebrow: 'Calling All Sonoma Wine Country Dogs!',
    clearHeadingOn: 'twIntro',
  },
  // no leading banner — a hero is prepended using one of her photos
  pageAbout: {
    heading: 'Heidi and Jack here,',
    clearHeadingOn: 'aboutIntro',
    newImage: 'labrador-retriever-dogs-in-the-snow-lake-tahoe',
    newAlt: 'Labrador retrievers in the snow at Lake Tahoe',
  },
  'page-session': {
    heading: 'Session Information',
    clearHeadingOn: 'sessIntro',
    newImage: 'australian-shepherd-puppy-piano-windsor',
    newAlt: 'Australian shepherd puppy at a piano in Windsor, California',
  },
}

async function save(id, sections) {
  await client.patch(id).set({sections}).commit()
  const d = await client.getDocument(`drafts.${id}`)
  if (d) await client.patch(`drafts.${id}`).set({sections}).commit()
}

async function run() {
  assertProject()
  console.log(`${client.config().projectId} — ${APPLY ? 'APPLYING' : 'DRY RUN'}\n`)
  ASSETS = await client.fetch(`*[_type=="sanity.imageAsset"]{_id, originalFilename}`)

  for (const [docId, plan] of Object.entries(PLAN)) {
    const doc = await client.getDocument(docId)
    if (!doc) {
      console.log(`  ${docId}: MISSING`)
      continue
    }
    let sections = [...(doc.sections || [])]

    if (sections.some((s) => s._type === 'heroSection')) {
      console.log(`  ${docId.padEnd(30)} already has a hero, skipping`)
      continue
    }

    const first = sections[0]
    let note
    if (first && first._type === 'fullBleedImageSection') {
      // reuse the banner's image, replace the section outright
      sections[0] = heroFrom(`${first._key}Hero`, {
        imageRef: first.image?.asset?._ref,
        alt: first.image?.alt,
        heading: plan.heading,
        eyebrow: plan.eyebrow,
      })
      note = `fullBleed ${first._key} -> hero (h1)`
    } else {
      sections.unshift(
        heroFrom('pageHero', {
          imageRef: A(plan.newImage),
          alt: plan.newAlt,
          heading: plan.heading,
          eyebrow: plan.eyebrow,
        }),
      )
      note = 'prepended hero (h1)'
    }

    // clear the now-duplicate heading on the section below
    const ci = sections.findIndex((s) => s._key === plan.clearHeadingOn)
    if (ci >= 0 && sections[ci].heading) {
      sections[ci] = {...sections[ci], heading: null}
      note += `, cleared dup heading on ${plan.clearHeadingOn}`
    }

    console.log(`  ${docId.padEnd(30)} ${note}`)
    if (APPLY) await save(docId, sections)
  }

  if (!APPLY) console.log('\n  DRY RUN — nothing written.')
  else console.log('\n  ✓ heroes in place')
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
