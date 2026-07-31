// Delete image assets that nothing references — the donor seed's leftovers.
//
// A donor seed copies the demo's whole media library, not just the images the
// overlay ends up placing. On Heidi Adler's dataset that left 45 unreferenced
// assets (Pexels stock, demo-*.jpg, connor-walberg-*.png, and four of the
// demo's own screenshots), all visible in her Studio image picker.
//
// SAFETY:
//   • Re-checks references immediately before each delete, rather than trusting
//     the list gathered at the start — a concurrent Studio edit could have
//     placed an image in between.
//   • Refuses to delete anything referenced by ANY document, drafts included.
//   • --keep-mine skips assets whose filename does not match a known donor
//     pattern, so a client's own uploads are never caught by a broad sweep.
//     Verify first (e.g. against the donor dataset) before dropping the flag.
//   • Dry run by default.
//
// Run:
//   cd studio && npx dotenv -e .env.<slug>-backup -- \
//     npx sanity exec scripts/migrations/purge-orphaned-assets.js \
//     --with-user-token -- --slug=<slug> [--keep-mine] --apply

import {getCliClient} from 'sanity/cli'
import fs from 'node:fs'
import path from 'node:path'

const client = getCliClient({apiVersion: '2024-01-01'})
const APPLY = process.argv.includes('--apply')
const KEEP_MINE = process.argv.includes('--keep-mine')
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

// Filenames the donor seed is known to bring along.
const DONOR_PATTERN =
  /^(pexels-|demo-\d|connor-walberg-|site-photographers-|Modern_chic|Artboard 1@2x|Screenshot \d{4}-\d{2}-\d{2})/i

async function run() {
  const pid = assertProject()
  console.log(
    `${pid} — ${APPLY ? 'APPLYING' : 'DRY RUN (pass --apply)'}${KEEP_MINE ? ' [--keep-mine]' : ''}\n`,
  )

  const orphans = await client.fetch(
    `*[_type == "sanity.imageAsset" && count(*[references(^._id)]) == 0]
       {_id, originalFilename, "kb": round(size/1024)} | order(originalFilename asc)`,
  )
  console.log(`  unreferenced assets: ${orphans.length}`)

  const targets = KEEP_MINE
    ? orphans.filter((a) => DONOR_PATTERN.test(a.originalFilename || ''))
    : orphans
  const skipped = orphans.length - targets.length
  if (skipped) console.log(`  skipped (not donor-pattern): ${skipped}`)

  let deleted = 0
  let rescued = 0
  let failed = 0
  let freedKb = 0

  for (const a of targets) {
    // Re-check right now — the list above may be seconds stale.
    const refs = await client.fetch(`count(*[references($id)])`, {id: a._id})
    if (refs > 0) {
      console.log(`    ~ ${a.originalFilename} — now referenced by ${refs}; KEEPING`)
      rescued++
      continue
    }
    console.log(`    - ${(a.originalFilename || a._id).slice(0, 58)}  ${a.kb}kb`)
    if (APPLY) {
      try {
        await client.delete(a._id)
        deleted++
        freedKb += a.kb || 0
      } catch (e) {
        console.log(`      FAILED: ${e.message.slice(0, 100)}`)
        failed++
      }
    }
  }

  if (!APPLY) {
    console.log(`\n  DRY RUN — ${targets.length} would be deleted. Nothing written.`)
    return
  }
  console.log(
    `\n  ✓ deleted ${deleted}` +
      `${rescued ? `, kept ${rescued} that gained a reference` : ''}` +
      `${failed ? `, ${failed} FAILED` : ''}` +
      ` — freed ~${(freedKb / 1024).toFixed(1)} MB`,
  )

  const left = await client.fetch(
    `count(*[_type == "sanity.imageAsset" && count(*[references(^._id)]) == 0])`,
  )
  console.log(`  unreferenced assets remaining: ${left}`)
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
