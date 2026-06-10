// Post-donor-seed cleanup — strips demo-only artifacts from a freshly seeded
// client dataset. Companion to 50-donor-seed.js; run immediately after it
// when the donor is one of the demos.
//
// What it does (target dataset only — the donor is never touched):
//   1. Deletes every drafts.** doc (dataset import leaks the donor's drafts;
//      Studio would show the stale draft over the published doc — see
//      wiki/patterns/donor-seed-draft-demo-cruft-purge).
//   2. Unsets siteSettings.demo (the demo-showcase badge must not render on
//      a real client site).
//   3. Blanks seoSettings.siteUrl (it carries the donor's URL; blank falls
//      back gracefully — set properly at the client's domain cutover).
//
// Run from studio/ (dry-run prints a plan; --apply commits):
//   npx dotenv -e .env -- sanity exec scripts/onboard/55-post-seed-clean.js \
//     --with-user-token -- --slug=<slug> [--apply]
//
// Reads the project id from studio/.env.<slug>-backup so it can never run
// against a project that hasn't been onboarded. Idempotent.

import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {getCliClient} from 'sanity/cli'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STUDIO = path.resolve(__dirname, '../..')

const APPLY = process.argv.includes('--apply')
const slug = (process.argv.find((a) => a.startsWith('--slug=')) || '').split('=')[1]
if (!slug) {
  console.error('Usage: node scripts/onboard/55-post-seed-clean.js --slug=<slug> [--apply]')
  process.exit(1)
}

const backupPath = path.join(STUDIO, `.env.${slug}-backup`)
if (!fs.existsSync(backupPath)) {
  console.error(`No ${backupPath} — run 20-env.js first.`)
  process.exit(1)
}
const backup = fs.readFileSync(backupPath, 'utf8')
const projectId = (backup.match(/^SANITY_STUDIO_PROJECT_ID=(.+)$/m) || [])[1]?.trim()
if (!projectId) {
  console.error(`Could not read SANITY_STUDIO_PROJECT_ID from ${backupPath}`)
  process.exit(1)
}
// Hard guard: never run against the demos (they SHOULD have the demo flag).
const DEMO_PROJECT_IDS = ['hx5xgigp', 'v14sne67', 'boa9509d']
if (DEMO_PROJECT_IDS.includes(projectId)) {
  console.error(`✋ ${projectId} is a demo project — refusing to strip demo artifacts from a demo.`)
  process.exit(1)
}

const client = getCliClient().withConfig({
  projectId,
  dataset: 'production',
  apiVersion: '2024-10-01',
  useCdn: false,
})

async function main() {
  console.log(`\n=== 55-post-seed-clean → ${slug} (${projectId}) — ${APPLY ? 'APPLY' : 'DRY RUN'} ===\n`)

  const drafts = await client.fetch(`*[_id in path("drafts.**")]._id`)
  const demoFlag = await client.fetch(`*[_id=="siteSettings"][0].demo`)
  const siteUrl = await client.fetch(`*[_id=="seoSettings"][0].siteUrl`)

  console.log(`drafts to delete: ${drafts.length}`)
  drafts.forEach((id) => console.log(`  - ${id}`))
  console.log(`siteSettings.demo: ${demoFlag ? JSON.stringify(demoFlag) + '  → unset' : 'absent ✓'}`)
  console.log(`seoSettings.siteUrl: ${siteUrl ? `"${siteUrl}" → ''` : 'already blank ✓'}`)

  if (!APPLY) {
    console.log('\n(dry run — re-run with --apply to commit)\n')
    return
  }

  if (drafts.length) {
    let tx = client.transaction()
    for (const id of drafts) tx = tx.delete(id)
    await tx.commit({visibility: 'sync'})
    console.log(`✓ deleted ${drafts.length} drafts`)
  }
  if (demoFlag) {
    await client.patch('siteSettings').unset(['demo']).commit({visibility: 'sync'})
    console.log('✓ unset siteSettings.demo')
  }
  if (siteUrl) {
    await client.patch('seoSettings').set({siteUrl: ''}).commit({visibility: 'sync'})
    console.log('✓ blanked seoSettings.siteUrl')
  }
  console.log('\nDone.\n')
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
