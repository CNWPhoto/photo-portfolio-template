// fix-seosettings-siteurl.js — repair seoSettings.siteUrl across the fleet.
//
// WHY: a 2026-07-16 audit of the live canonical tag on every client found
// siteUrl stale, WRONG, or missing almost everywhere:
//   blackbird     → https://family-demo.pages.dev      (another CLIENT's URL)
//   kelly-mac     → https://cnw-photo-demo.pages.dev   (the DEMO's URL)
//   demo/family-demo/lavon → *.pages.dev               (dead, pre-Workers)
//   everlight/heatherjl/karen-conrad → unset           (no canonical emitted)
//   coola / pets-in-focus / wedding-demo → correct
// Root cause: donor-clone onboarding copies the donor's dataset, so the donor's
// siteUrl rode along and was never re-pointed; the Pages→Workers migration then
// stranded the rest on dead *.pages.dev hosts.
//
// This is live SEO damage, not cosmetic: siteUrl drives the canonical tag, the
// sitemap's <loc>s, and robots.txt's Sitemap line — so blackbird is currently
// telling Google that family-demo is its canonical.
//
// SOURCE OF TRUTH: SANITY_STUDIO_PREVIEW_URL from the client's
// studio/.env.<slug>-backup, which migrate-all preloads into `sanity exec`.
// Per wiki/patterns/www-canonical-host-decision those two are supposed to be
// the SAME value — this migration makes that true.
//
//   npm run migrate-all -- --script=scripts/migrations/fix-seosettings-siteurl.js --include-demo           # DRY all
//   npm run migrate-all -- --script=scripts/migrations/fix-seosettings-siteurl.js --include-demo --apply   # WRITE all
//   npm run migrate-all -- --script=scripts/migrations/fix-seosettings-siteurl.js --only=<slug> --apply    # one client
//
// NOTE ordering: if a client's canonical host is changing (e.g. Lavon moving to
// her custom domain), update SANITY_STUDIO_PREVIEW_URL in her env-backup FIRST,
// then run this — the backup is the input, not the output.
//
// Idempotent: a second pass finds nothing to change.
// FLAGS (exit 2) instead of guessing when the canonical can't be known.

import 'dotenv/config'
import {getCliClient} from 'sanity/cli'

const apply = process.argv.includes('--apply')
const slug = (process.argv.find((a) => a.startsWith('--slug=')) || '').split('=')[1] || '(local)'

let client = getCliClient()
if (process.env.SANITY_WRITE_TOKEN) client = client.withConfig({token: process.env.SANITY_WRITE_TOKEN})

// Convention: siteUrl carries NO trailing slash — the site appends it
// (trailingSlash:'always'). Matches the correct clients (coola, pets-in-focus).
const normalize = (u) => (u || '').trim().replace(/\/+$/, '')

async function main() {
  const {projectId, dataset} = client.config()
  const raw = process.env.SANITY_STUDIO_PREVIEW_URL
  const expected = normalize(raw)

  // FLAG, don't guess. A localhost/empty preview URL means the client isn't
  // deployed yet (pre-Cloudflare onboarding) — we cannot know their canonical,
  // and writing a localhost siteUrl would be worse than leaving it alone.
  if (!expected || /^https?:\/\/localhost/i.test(expected)) {
    console.log(`  ⚑ ${slug}: SANITY_STUDIO_PREVIEW_URL is ${JSON.stringify(raw || '')} — no deployed canonical to derive from`)
    console.log(`[migrate] ${slug} ${projectId}/${dataset}: flagged 1 (skipped)`)
    process.exit(2)
  }

  // Patch BOTH the published doc and any draft. If an editor has an open draft,
  // patching only the published copy means their next publish silently restores
  // the stale siteUrl (see wiki/patterns/draft-sync-after-script-vs-editor-collision).
  const docs = await client.fetch(`*[_id in ["seoSettings", "drafts.seoSettings"]]{ _id, siteUrl }`)

  if (!docs.length) {
    console.log(`  ⚑ ${slug}: no seoSettings document exists`)
    console.log(`[migrate] ${slug} ${projectId}/${dataset}: flagged 1`)
    process.exit(2)
  }

  let updated = 0
  let alreadyOk = 0
  for (const doc of docs) {
    if (normalize(doc.siteUrl) === expected) {
      alreadyOk++
      console.log(`  ✓ ${doc._id}: already ${expected}`)
      continue
    }
    console.log(`  ${apply ? '~' : '·'} ${doc._id}: ${JSON.stringify(doc.siteUrl ?? null)} → ${JSON.stringify(expected)}`)
    if (apply) {
      await client.patch(doc._id).set({siteUrl: expected}).commit()
      updated++
    }
  }

  const pending = docs.length - alreadyOk
  const verb = apply ? `updated ${updated}` : `would update ${pending}`
  console.log(`[migrate] ${slug} ${projectId}/${dataset}: ${verb}; already-correct ${alreadyOk} → ${expected}`)
}

main().catch((e) => {
  console.error('[migrate] FAILED:', e)
  process.exit(1)
})
