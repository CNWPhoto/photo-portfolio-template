// heather-categories-to-galleries.js — turn Wren & Ivy's portfolio category
// tags into real Additional Galleries (tabs).
//
// She tagged all 17 portfolio images as Weddings (10), Engagements (5) and
// Elopements (3) — deliberate organisation that produced nothing visible,
// because portfolio categories had no filter UI, carried noindex, and were
// linked from nowhere. That feature is now removed; this preserves her intent
// in the mechanism that actually works.
//
// Layout: the largest group stays as the main portfolio gallery, the other two
// become the two Additional Galleries (the schema caps at 2 — her three groups
// fit exactly).
//
//   cd studio
//   npx dotenv -e .env.heatherjl-photography-backup -- \
//     npx sanity exec scripts/migrations/heather-categories-to-galleries.js --with-user-token -- [--apply]
//
// MUST run BEFORE remove-portfolio-categories.js — that script deletes the
// tags this one reads.

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-01-01'})
const APPLY = process.argv.includes('--apply')

// Largest group stays in the main gallery; the rest become tabs, in this order.
const MAIN = 'Weddings'
const TABS = ['Engagements', 'Elopements']

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const run = async () => {
  if (client.config().projectId !== '7n71940p') {
    throw new Error(`Refusing to run against ${client.config().projectId} — this is Wren & Ivy-specific.`)
  }
  console.log(APPLY ? 'APPLYING\n' : 'DRY RUN (pass --apply to write)\n')

  const doc = await client.fetch(
    `*[_id=="portfolio"][0]{
      "existing": count(additionalGalleries),
      "images": images[]{..., "cats": categories[]->name}
    }`,
  )
  if (doc?.existing) {
    throw new Error(`Portfolio already has ${doc.existing} additional galleries — resolve by hand.`)
  }
  const images = doc?.images ?? []

  // An image tagged into more than one group would otherwise be duplicated
  // across galleries. Assign it to the most specific group present, i.e. the
  // last one in [MAIN, ...TABS], and say so.
  const priority = [...TABS].reverse()
  const bucket = (img) => {
    const cats = img.cats || []
    for (const p of priority) if (cats.includes(p)) return p
    return cats.includes(MAIN) ? MAIN : null
  }

  const groups = {[MAIN]: [], ...Object.fromEntries(TABS.map((t) => [t, []]))}
  const unassigned = []
  for (const img of images) {
    const b = bucket(img)
    if (!b) {
      unassigned.push(img)
      continue
    }
    if ((img.cats || []).length > 1) {
      console.log(`  ℹ multi-tagged image (${img.cats.join(' + ')}) → ${b}`)
    }
    // Strip the projection helper and the now-removed categories field.
    const {cats, categories, ...clean} = img
    groups[b].push(clean)
  }

  console.log('')
  console.log(`  main gallery  ${MAIN}: ${groups[MAIN].length} image(s)`)
  for (const t of TABS) console.log(`  tab           ${t}: ${groups[t].length} image(s)`)
  if (unassigned.length) console.log(`  ⚠ untagged (staying in main): ${unassigned.length}`)
  const total = groups[MAIN].length + TABS.reduce((n, t) => n + groups[t].length, 0) + unassigned.length
  console.log(`  total accounted for: ${total} of ${images.length}`)
  if (total !== images.length) throw new Error('Image count mismatch — refusing to write.')

  if (!APPLY) return console.log('\nDry run complete.')

  const additionalGalleries = TABS.filter((t) => groups[t].length).map((t, i) => ({
    _key: `gallery-${slugify(t)}`,
    _type: 'additionalGallery',
    name: t,
    slug: {_type: 'slug', current: slugify(t)},
    images: groups[t].map((img, n) => ({...img, _key: img._key || `${slugify(t)}-${n}`})),
  }))

  await client
    .patch('portfolio')
    .set({
      images: [...groups[MAIN], ...unassigned],
      additionalGalleries,
    })
    .commit({visibility: 'sync'})

  const after = await client.fetch(
    `*[_id=="portfolio"][0]{"main": count(images), "tabs": additionalGalleries[]{name, "n": count(images)}}`,
  )
  console.log('\nAfter:', JSON.stringify(after))
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
