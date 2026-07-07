// _template.js — copy this to studio/scripts/migrations/<describe-the-change>.js
// for a fleet-safe field migration (the "migrate" step of expand → migrate →
// contract). See the vault playbook `wiki/playbooks/fleet-feature-migration`.
//
// Run one client (standalone):
//   cd studio && npx sanity exec scripts/migrations/<name>.js --with-user-token -- --slug=<slug>          # DRY
//   cd studio && npx sanity exec scripts/migrations/<name>.js --with-user-token -- --slug=<slug> --apply  # WRITE
// Run the whole fleet:
//   npm run migrate-all -- --script=scripts/migrations/<name>.js            # DRY all
//   npm run migrate-all -- --script=scripts/migrations/<name>.js --apply    # WRITE all
//
// Contract:
// - DRY by default; only `--apply` writes.
// - Idempotent: a second pass after success finds nothing to do.
// - FLAG, don't guess: if the old→new mapping is ambiguous for a doc, push its
//   id to `flagged` instead of writing, and exit 2 so the fleet harness marks
//   the client for human review before you run the contract (field-removal) step.

import 'dotenv/config' // FIRST — so getCliClient() reads SANITY_STUDIO_PROJECT_ID
import {getCliClient} from 'sanity/cli'

const apply = process.argv.includes('--apply')
const slug = (process.argv.find((a) => a.startsWith('--slug=')) || '').split('=')[1] || '(local)'

// `--with-user-token` (via the harness / the exec flag) gives write access on
// projects Connor's session owns. If a project is read-only, drop a
// SANITY_WRITE_TOKEN in its env-backup and this picks it up.
let client = getCliClient()
if (process.env.SANITY_WRITE_TOKEN) client = client.withConfig({token: process.env.SANITY_WRITE_TOKEN})

// ── EDIT THIS BLOCK ──────────────────────────────────────────────────────────
// 1) QUERY only the docs still in the OLD shape (so re-runs are no-ops).
const QUERY = `*[_type == "siteSettings" && defined(oldFieldA)]{ _id, oldFieldA, oldFieldB }`

// 2) MAP old → new. Return the value to set on `newField`, or `null` to FLAG the
//    doc for manual review (ambiguous / lossy — don't guess).
function toNewValue(doc) {
  // e.g. combine two old fields into one:
  //   if (doc.oldFieldA && doc.oldFieldB && doc.oldFieldA !== doc.oldFieldB) return null // ambiguous → flag
  //   return doc.oldFieldA ?? doc.oldFieldB
  return doc.oldFieldA
}

// 3) NAME the new field to set and the old field(s) to remove.
const NEW_FIELD = 'newField'
const OLD_FIELDS = ['oldFieldA', 'oldFieldB']
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const {projectId, dataset} = client.config()
  const docs = await client.fetch(QUERY)
  let migrated = 0
  const flagged = []

  for (const doc of docs) {
    const next = toNewValue(doc)
    if (next === null || next === undefined) {
      flagged.push(doc._id)
      console.log(`  ⚑ ${doc._id} — ambiguous, needs manual review`)
      continue
    }
    console.log(`  ${apply ? '~' : '·'} ${doc._id} → ${NEW_FIELD}=${JSON.stringify(next)} (unset ${OLD_FIELDS.join(', ')})`)
    if (apply) {
      await client.patch(doc._id).set({[NEW_FIELD]: next}).unset(OLD_FIELDS).commit()
      migrated++
    }
  }

  const verb = apply ? 'migrated' : 'would migrate'
  console.log(`[migrate] ${slug} ${projectId}/${dataset}: ${verb} ${apply ? migrated : docs.length - flagged.length}; flagged ${flagged.length}${flagged.length ? ' (' + flagged.join(', ') + ')' : ''}`)
  // Exit 2 signals the fleet harness "completed, but this client has flagged
  // docs" — resolve those before the contract (field-removal) deploy.
  if (flagged.length) process.exit(2)
}

main().catch((e) => {
  console.error('[migrate] FAILED:', e)
  process.exit(1)
})
