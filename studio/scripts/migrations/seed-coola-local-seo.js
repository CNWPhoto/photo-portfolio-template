// seed-coola-local-seo.js — fill Coola Creative's empty business fields.
//
// seoSettings drives the ProfessionalService/LocalBusiness structured data.
// Coola's block contained only a name and URL — no phone, email, city, state,
// areaServed or priceRange — so Google had nothing to place her with for
// "product photographer near me"-style searches.
//
// Every value below is taken from her own live site (contact page + FAQ copy),
// not invented. priceRange and areaServed are the two judgement calls:
//   priceRange '$$' — her published pricing starts around $500.
//   areaServed     — Novi outward through Metro Detroit.
// Both are easy to adjust in Studio → Site Settings → SEO.
//
//   cd studio
//   npx dotenv -e .env.coola-creative-backup -- \
//     npx sanity exec scripts/migrations/seed-coola-local-seo.js --with-user-token -- [--apply]

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-01-01'})
const APPLY = process.argv.includes('--apply')

const VALUES = {
  businessPhone: '248-924-9584',
  businessEmail: 'carla@coolacreative.com',
  businessCity: 'Novi',
  businessState: 'MI',
  areaServed: 'Novi, Farmington Hills, Northville, Metro Detroit, Michigan',
  priceRange: '$$',
}

const run = async () => {
  if (client.config().projectId !== 'tl3zj8iz') {
    throw new Error(`Refusing to run against ${client.config().projectId} — this is Coola-specific.`)
  }
  console.log(APPLY ? 'APPLYING\n' : 'DRY RUN (pass --apply to write)\n')

  const patch = {}
  for (const [key, value] of Object.entries(VALUES)) {
    // Only fill blanks — never overwrite something an editor has since set.
    for (const docId of ['seoSettings', 'drafts.seoSettings']) {
      const existing = await client.fetch(`*[_id==$id][0][$k]`, {id: docId, k: key})
      if (existing) {
        console.log(`  ✓ ${key}: already set on ${docId} (${JSON.stringify(existing)}) — leaving`)
      }
    }
    const published = await client.fetch(`*[_id=="seoSettings"][0][$k]`, {k: key})
    if (!published) {
      console.log(`  • ${key} → ${JSON.stringify(value)}`)
      patch[key] = value
    }
  }

  if (!Object.keys(patch).length) return console.log('\nNothing to fill.')
  if (!APPLY) return console.log(`\n${Object.keys(patch).length} field(s) would be set.`)

  await client.patch('seoSettings').set(patch).commit({visibility: 'sync'})
  // Keep any draft in step so the next Publish doesn't blank these again.
  const hasDraft = await client.fetch(`defined(*[_id=="drafts.seoSettings"][0])`)
  if (hasDraft) await client.patch('drafts.seoSettings').set(patch).commit({visibility: 'sync'})
  console.log(`\nSet ${Object.keys(patch).length} field(s)${hasDraft ? ' (published + draft)' : ''}.`)
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
