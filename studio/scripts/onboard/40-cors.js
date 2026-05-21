// 40-cors.js — add the three CORS origins to the client's Sanity project.
//
//   node studio/scripts/onboard/40-cors.js --slug=kelly-mac-studios
//
// Reads the project id from the client's .env backup, shells the sanity
// CLI inside the swapped env. Idempotent — the CLI no-ops / errors
// harmlessly if an origin already exists (we swallow that).

import {assertSlug, getArg, withClientEnv, readEnvBackup, sh, STUDIO_DIR, log} from './lib.js'

const slug = assertSlug(getArg('slug', {required: true}))
const env = readEnvBackup(slug)
// Add the specific origins this client needs — no wildcards. The Sanity
// CLI prompts interactively for wildcard confirmation (non-tty error in
// CI/scripts), and per-client specific origins are tighter security
// anyway. If a new origin is ever needed (e.g. custom domain after DNS
// migration), re-run this script after updating SANITY_STUDIO_PREVIEW_URL
// in the env backup, or use the Sanity Manage UI ad-hoc.
const origins = [
  'http://localhost:4321',
  env.SANITY_STUDIO_PREVIEW_URL,
  `https://${slug}.sanity.studio`,
].filter(Boolean)

await withClientEnv(slug, async () => {
  for (const o of origins) {
    try {
      sh(`npx sanity cors add "${o}" --credentials`, {cwd: STUDIO_DIR, capture: true})
      log('cors', `added ${o}`)
    } catch (e) {
      const msg = String(e.stdout || e.message || '')
      if (/already exists|duplicate/i.test(msg)) log('cors', `exists ${o}`)
      else throw e
    }
  }
})

log('cors', `done for project ${env.SANITY_STUDIO_PROJECT_ID}`)
log('cors', 'NEXT: 50-donor-seed.js')
