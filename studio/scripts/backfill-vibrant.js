// One-time backfill — palettes[].vibrant for datasets seeded before the
// Vibrant tone landed (d2d5209, 2026-06-03).
//
// The palette schema gained a `vibrant` color and seed/_shared.js gained
// per-palette values, but existing datasets were never backfilled, so every
// stock palette has vibrant: null and the runtime falls back to `accent`
// (see src/lib/palette.js). This script sets the canonical _shared.js value
// on STOCK palettes only (matched by slug), and only where vibrant is still
// unset — custom palettes and editor-chosen values are never touched.
// Drafts of siteSettings get the same patch so a later publish can't undo
// the backfill.
//
// Run from studio/ (dry-run prints a plan; --apply commits):
//   npx dotenv -e .env -- sanity exec scripts/backfill-vibrant.js --with-user-token
//   ...add `-- --apply` to write. `-- --only=<projectId>` limits to one project.
//
// Idempotent: re-runs find nothing to change.

import {getCliClient} from 'sanity/cli'

const APPLY = process.argv.includes('--apply')
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1]

// Stock palette vibrant values — must match studio/scripts/seed/_shared.js
const STOCK_VIBRANT = {
  'classic-cream': '#d8a23a',
  'warm-studio': '#2e8b82',
  'dark-editorial': '#c5543c',
  'cool-minimal': '#e76f51',
  'forest-sage': '#c0613a',
}

// Fleet map — mirrors .github/workflows/deploy.yml only_client case map,
// plus the demo canary (hx5xgigp). wedding-demo included for completeness;
// it was seeded post-vibrant and should no-op.
const PROJECTS = [
  {slug: 'cnw-photo-demo', projectId: 'hx5xgigp'},
  {slug: 'family-demo', projectId: 'v14sne67'},
  {slug: 'wedding-demo', projectId: 'boa9509d'},
  {slug: 'coola-creative', projectId: 'tl3zj8iz'},
  {slug: 'lavon-photography', projectId: '3a8494gh'},
  {slug: 'blackbird-photography', projectId: '6nc24jar'},
  {slug: 'kelly-mac-studios', projectId: 'qva1dysl'},
  {slug: 'karen-conrad-photography', projectId: 'hydwn002'},
  {slug: 'pets-in-focus', projectId: 'tryjma1z'},
]

const base = getCliClient()

function planChanges(palettes) {
  if (!Array.isArray(palettes)) return {updated: null, changes: [], skipped: []}
  const changes = []
  const skipped = []
  const updated = palettes.map((p) => {
    const slug = p?.slug?.current
    const stock = STOCK_VIBRANT[slug]
    if (p?.vibrant) {
      skipped.push(`${slug || p?.name}: already set (${p.vibrant})`)
      return p
    }
    if (!stock) {
      skipped.push(`${slug || p?.name}: custom palette — left for editor`)
      return p
    }
    changes.push(`${slug}: null → ${stock}`)
    return {...p, vibrant: stock}
  })
  return {updated, changes, skipped}
}

async function processDoc(client, id, label) {
  const doc = await client.fetch(`*[_id == $id][0]{_id, palettes}`, {id})
  if (!doc) return false
  const {updated, changes, skipped} = planChanges(doc.palettes)
  for (const s of skipped) console.log(`    · ${label} ${s}`)
  if (!changes.length) {
    console.log(`    ✓ ${label} nothing to backfill`)
    return false
  }
  for (const c of changes) console.log(`    + ${label} ${c}`)
  if (APPLY) {
    await client.patch(id).set({palettes: updated}).commit()
    console.log(`    ✓ ${label} patched`)
  }
  return true
}

async function main() {
  console.log(`\n=== backfill-vibrant (${APPLY ? 'APPLY' : 'DRY RUN'}) ===`)
  const targets = PROJECTS.filter((p) => !ONLY || p.projectId === ONLY)
  for (const {slug, projectId} of targets) {
    console.log(`\n${slug} (${projectId})`)
    const client = base.withConfig({projectId, dataset: 'production', apiVersion: '2024-10-01', useCdn: false})
    try {
      await processDoc(client, 'siteSettings', '[published]')
      await processDoc(client, 'drafts.siteSettings', '[draft]    ')
    } catch (err) {
      console.error(`    ✗ ${slug}: ${err.message}`)
    }
  }
  if (!APPLY) console.log('\n(dry run — re-run with `-- --apply` to commit)\n')
  else console.log('\nDone.\n')
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
