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
const origins = [
  'http://localhost:4321',
  'https://*.pages.dev',
  `https://${slug}.pages.dev`,
]

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
