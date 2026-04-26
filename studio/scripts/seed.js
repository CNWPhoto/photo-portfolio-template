// Seed runner — populates a fresh dataset with starter content for the
// chosen niche. Niche-specific content lives in ./seed/niches/<slug>.js;
// shared helpers (palettes, ctaLink builders, sectionBase) live in
// ./seed/_shared.js.
//
// Usage:
//   npm run seed                              — additive (createIfNotExists),
//                                                pets niche (default).
//   npm run seed -- --niche=pets              — same as above, explicit.
//   npm run seed -- --niche=families          — once families niche ships.
//   npm run seed:replace                      — REPLACE mode (createOrReplace),
//                                                pets niche.
//   npm run seed:replace -- --niche=families  — REPLACE mode, families niche.
//
// Replace mode overwrites homepagePage / notFoundPage / etc. — snapshot
// first via the rollback guide before running it against any production
// dataset. See docs/rewrite-rollback.md.

import {getCliClient} from 'sanity/cli'
import {niches, DEFAULT_NICHE} from './seed/niches/index.js'

const client = getCliClient()
const replace = process.argv.includes('--replace')
const nicheArg = process.argv.find((a) => a.startsWith('--niche='))
const nicheSlug = nicheArg?.split('=')[1] || DEFAULT_NICHE

const niche = niches[nicheSlug]
if (!niche) {
  const available = Object.keys(niches).join(', ')
  console.error(`\n✗ Unknown niche: "${nicheSlug}"\n  Available niches: ${available}\n`)
  process.exit(1)
}

const docs = niche.buildDocs()

async function main() {
  const mode = replace ? 'createOrReplace (REPLACE mode)' : 'createIfNotExists (additive)'
  console.log(`\nSeeding ${docs.length} documents for niche "${niche.name}" using ${mode}...\n`)

  // Pre-check which docs already exist so the per-doc log line accurately
  // labels created vs skipped. The previous heuristic compared
  // _createdAt === _updatedAt on the response, which falsely flagged
  // existing-but-pristine docs as newly created — alarming when running
  // additive seed against a partially-populated dataset.
  let existingIds = new Set()
  if (!replace) {
    const ids = docs.map((d) => d._id)
    const existing = await client.fetch(`*[_id in $ids]._id`, {ids})
    existingIds = new Set(existing)
  }

  let created = 0
  let skipped = 0
  for (const doc of docs) {
    try {
      if (replace) {
        await client.createOrReplace(doc)
        console.log(`  ↻ ${doc._type}: ${doc._id}`)
        created++
      } else if (existingIds.has(doc._id)) {
        // No write needed — createIfNotExists would be a no-op anyway,
        // but skipping the call entirely makes the run faster on
        // already-populated datasets.
        console.log(`  · ${doc._type}: ${doc._id} (already exists, skipped)`)
        skipped++
      } else {
        await client.createIfNotExists(doc)
        console.log(`  + ${doc._type}: ${doc._id}`)
        created++
      }
    } catch (err) {
      console.error(`  ✗ ${doc._type}: ${doc._id} — ${err.message}`)
      throw err
    }
  }

  console.log(`\nDone. ${replace ? 'Replaced' : 'Created'}: ${created}, Skipped: ${skipped}\n`)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
