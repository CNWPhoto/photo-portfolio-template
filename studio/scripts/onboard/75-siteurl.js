// 75-siteurl.js — set seoSettings.siteUrl to the client's interim workers.dev
// origin, right after their first deploy.
//
// WHY THIS STEP EXISTS
// 55-post-seed-clean.js deliberately BLANKS seoSettings.siteUrl after a donor
// seed — that's the fix for clients inheriting the demo's domain. But blanking
// is only half the job: something has to set the client's OWN url afterwards,
// and the only thing that did was 90-domain-cutover.js, which doesn't run until
// the domain moves. Every client deployed before their cutover therefore sat
// with an empty siteUrl and NO CANONICAL TAG on any page — caught on
// heidi-adler-photography 2026-08-01 by the fleet health check, which had been
// failing every run since her launch.
//
// Derives the origin from SANITY_STUDIO_PREVIEW_URL in the client's committed
// env-backup, so it needs no new information — 20-env.js already wrote it.
// 90-domain-cutover.js overwrites this with the real domain later.
//
// Idempotent, and refuses to downgrade a real custom domain back to a
// workers.dev host unless --force is passed.
//
// Run (after the first deploy, once the workers.dev host is known):
//   cd studio && npx dotenv -e .env.<slug>-backup -- \
//     npx sanity exec scripts/onboard/75-siteurl.js --with-user-token -- \
//     --slug=<slug> --apply
//
// Flags:
//   --slug=<slug>   (required) reads .env.<slug>-backup
//   --url=<origin>  override the derived origin
//   --force         allow replacing a custom domain with a workers.dev host
//   --apply         write (default is a dry run)

import {getCliClient} from 'sanity/cli'
import fs from 'node:fs'
import path from 'node:path'

const client = getCliClient({apiVersion: '2024-01-01'})
const argv = process.argv
const APPLY = argv.includes('--apply')
const FORCE = argv.includes('--force')
const arg = (n) => {
  const hit = argv.find((a) => a.startsWith(`--${n}=`))
  return hit ? hit.slice(n.length + 3) : ''
}
const slug = arg('slug')

// Inlined rather than imported: this runs under `sanity exec`
// (esbuild-register/CJS) and cannot import the ESM lib.js.
function readBackup() {
  if (!slug) throw new Error('Missing --slug=<slug>')
  const p = path.resolve(process.cwd(), `.env.${slug}-backup`)
  const txt = fs.readFileSync(p, 'utf8')
  const out = {}
  for (const line of txt.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) out[m[1]] = m[2].trim()
  }
  return {env: out, path: p}
}

function main() {
  const {env, path: envPath} = readBackup()
  const expected = env.SANITY_STUDIO_PROJECT_ID
  const actual = client.config().projectId
  if (!expected) throw new Error(`No SANITY_STUDIO_PROJECT_ID in ${envPath}`)
  if (expected !== actual) {
    throw new Error(
      `Refusing to write: --slug=${slug} expects project ${expected}, ` +
        `but the active client is ${actual}. Check studio/.env.`,
    )
  }

  const derived = (arg('url') || env.SANITY_STUDIO_PREVIEW_URL || '').replace(/\/+$/, '')
  if (!/^https:\/\/[^/]+$/.test(derived)) {
    throw new Error(
      `Need an origin like https://example.com — got "${derived}". ` +
        `Set SANITY_STUDIO_PREVIEW_URL in ${envPath} (20-env.js writes it), or pass --url=`,
    )
  }

  console.log(`${actual} — ${APPLY ? 'APPLYING' : 'DRY RUN (pass --apply)'}\n`)

  return client.getDocument('seoSettings').then((doc) => {
    const current = (doc?.siteUrl || '').replace(/\/+$/, '')
    const isWorkersDev = /\.workers\.dev$/.test(derived)
    const currentIsCustom = current && !/\.workers\.dev$/.test(current)

    if (current === derived) {
      console.log(`  siteUrl already ${derived} — nothing to do`)
      return
    }
    if (currentIsCustom && isWorkersDev && !FORCE) {
      console.log(
        `  REFUSING: siteUrl is already the custom domain ${current}; ` +
          `would downgrade to ${derived}. Pass --force if that is really intended.`,
      )
      process.exitCode = 1
      return
    }

    console.log(`  seoSettings.siteUrl: ${current || '(unset)'} -> ${derived}`)
    if (!APPLY) {
      console.log('\n  DRY RUN — nothing written.')
      return
    }

    // Patch the draft too. 92-set-siteurl.js patched only the published doc, so
    // an editor publishing an older draft would silently restore the blank.
    return client
      .patch('seoSettings')
      .set({siteUrl: derived})
      .commit()
      .then(() => client.getDocument('drafts.seoSettings'))
      .then((draft) =>
        draft
          ? client
              .patch('drafts.seoSettings')
              .set({siteUrl: derived})
              .commit()
              .then(() => console.log('  draft patched too'))
          : null,
      )
      .then(() => {
        console.log('\n  ✓ siteUrl set — canonical tags will render on the next build')
        console.log('  (90-domain-cutover.js overwrites this at cutover)')
      })
  })
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
