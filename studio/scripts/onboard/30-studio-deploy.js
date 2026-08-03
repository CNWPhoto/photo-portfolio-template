// ⚠️  NO LONGER PART OF ONBOARDING (2026-08-02).
//
// Clients edit at <site>/studio, which the site build produces and every
// deploy refreshes. This script deploys a SECOND, Sanity-hosted copy that
// only updates when someone runs it by hand — and across the fleet that copy
// silently fell weeks behind the schema, showing editors real fields flagged
// "Unknown field found" with a Remove-field button beside their own content.
//
// Still works, and the 12 pre-existing hosted Studios were left alive as
// dormant fallbacks (the embedded Studio is served BY the client's site, so
// if the site is down they can't edit). Run this only if a client explicitly
// wants that independent copy — and remember it needs redeploying after every
// schema change, which is the whole reason it was dropped.
//
// 30-studio-deploy.js — deploy the hosted Studio, capture + pin the appId.
//
//   node studio/scripts/onboard/30-studio-deploy.js --slug=kelly-mac-studios
//
// Swaps studio/.env to the client backup, runs `npm run deploy`, parses
// the printed appId, writes it back into the backup, restores the dev
// .env. Safe to re-run (deploy is idempotent; appId line just re-pins).

import fs from 'node:fs'
import {assertSlug, getArg, withClientEnv, envBackupPath, sh, STUDIO_DIR, log} from './lib.js'

const slug = assertSlug(getArg('slug', {required: true}))

await withClientEnv(slug, async () => {
  log('studio-deploy', `deploying Studio for ${slug}…`)
  const out = sh('npm run deploy', {cwd: STUDIO_DIR, capture: true})
  process.stdout.write(out)
  const m = out.match(/Add appId:\s*'([a-z0-9]+)'/i) ||
            out.match(/appId['":\s]+([a-z0-9]{20,})/i)
  if (m) {
    const appId = m[1]
    const p = envBackupPath(slug)
    const txt = fs.readFileSync(p, 'utf8')
    if (/SANITY_STUDIO_APP_ID=\s*$/m.test(txt) || /SANITY_STUDIO_APP_ID=$/m.test(txt)) {
      fs.writeFileSync(p, txt.replace(/SANITY_STUDIO_APP_ID=.*/m, `SANITY_STUDIO_APP_ID=${appId}`))
      log('studio-deploy', `pinned appId ${appId} into ${p}`)
    } else {
      log('studio-deploy', `appId ${appId} (backup already had one — left as-is)`)
    }
  } else {
    log('studio-deploy', 'no appId in output (already pinned on a prior run — fine)')
  }
})

log('studio-deploy', `Studio live at https://${slug}.sanity.studio/`)
log('studio-deploy', 'NEXT: 40-cors.js')
