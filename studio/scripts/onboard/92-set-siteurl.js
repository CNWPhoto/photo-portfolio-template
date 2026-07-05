// 92-set-siteurl.js — patch seoSettings.siteUrl in the ACTIVE studio/.env
// project. Helper for 90-domain-cutover.js (which runs it inside
// withClientEnv), but safe to run standalone after a manual env swap:
//
//   cd studio && CUTOVER_SITE_URL=https://example.com \
//     npx sanity exec scripts/onboard/92-set-siteurl.js --with-user-token
//
// No top-level await — sanity exec compiles to CJS.

import {getCliClient} from 'sanity/cli'

function main() {
  const siteUrl = (process.env.CUTOVER_SITE_URL || '').replace(/\/+$/, '')
  if (!/^https:\/\/[^/]+$/.test(siteUrl)) {
    throw new Error(`CUTOVER_SITE_URL must be an origin like https://example.com (got "${siteUrl}")`)
  }
  const client = getCliClient({apiVersion: '2026-01-01'})
  const cfg = client.config()
  console.log(`[siteurl] setting seoSettings.siteUrl=${siteUrl} in ${cfg.projectId}/${cfg.dataset}`)
  return client
    .patch('seoSettings')
    .set({siteUrl})
    .commit()
    .then(() => console.log('[siteurl] done'))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
