// 90-domain-cutover.js — move a live client from workers.dev to their real
// domain in one command (P2 #15). Codifies the tribal-memory checklist:
//
//   1. Attach the domain to the Worker (CF Custom Domain — auto DNS + cert)
//   2. Update SANITY_STUDIO_PREVIEW_URL in studio/.env.<slug>-backup
//   3. Add the new origin to the Sanity project's CORS list
//   4. Patch seoSettings.siteUrl in the client dataset (via 92-set-siteurl.js)
//   5. Redeploy the hosted Studio (preview URL + allowOrigins bake at deploy)
//   6. Smoke-test the new domain (200 + section marker, with retries — new
//      certs can take a minute or two)
//   7. Print the manual follow-ups (www redirect rule, Search Console, …)
//
//   node studio/scripts/onboard/90-domain-cutover.js \
//     --slug=pets-in-focus \
//     --domain=www.petsinfocus.com \
//     --account-id=<client CF account id> \
//     --cf-token=<token>            # or env CF_API_TOKEN; "Edit Cloudflare
//                                   # Workers" template scoped to the account
//     [--skip-cf]                   # domain already attached in the dashboard
//
// --domain is the CANONICAL host (apex or www — see the vault's
// www-canonical-host pattern; pick one and keep all four settings aligned).
// Prereq: the domain's zone must already exist in the client's CF account
// (nameservers pointed at Cloudflare). Idempotent — every step no-ops or
// updates in place on re-run.

import fs from 'node:fs'
import {execSync} from 'node:child_process'
import {
  assertSlug,
  getArg,
  withClientEnv,
  readEnvBackup,
  envBackupPath,
  cf,
  sh,
  STUDIO_DIR,
  REPO_ROOT,
  log,
} from './lib.js'

const slug = assertSlug(getArg('slug', {required: true}))
const domain = getArg('domain', {required: true}).replace(/^https?:\/\//, '').replace(/\/+$/, '')
const accountId = getArg('account-id', {required: !getArg('skip-cf')})
const cfToken = getArg('cf-token', {fallback: process.env.CF_API_TOKEN})
const skipCf = process.argv.includes('--skip-cf')
const origin = `https://${domain}`
const apex = domain.split('.').slice(-2).join('.')

if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
  throw new Error(`--domain doesn't look like a hostname: "${domain}"`)
}

// ── 1. CF: attach the custom domain to the Worker ──────────────────────────
if (skipCf) {
  log('cutover', '1/6 skipping CF domain attach (--skip-cf)')
} else {
  if (!cfToken) throw new Error('Provide --cf-token=... or set CF_API_TOKEN')
  log('cutover', `1/6 looking up zone for ${apex}…`)
  const zones = await cf(cfToken, 'GET', `/zones?name=${apex}&account.id=${accountId}`)
  const zone = zones?.[0]
  if (!zone) {
    throw new Error(
      `No CF zone "${apex}" in account ${accountId}. Add the site to the client's ` +
        `Cloudflare account (nameserver cutover) first, then re-run.`,
    )
  }
  log('cutover', `attaching ${domain} → Worker "${slug}"…`)
  await cf(cfToken, 'PUT', `/accounts/${accountId}/workers/domains`, {
    zone_id: zone.id,
    hostname: domain,
    service: slug,
    environment: 'production',
  })
  log('cutover', `custom domain attached (DNS + cert are auto-managed by CF)`)
}

// ── 2. env backup: point the Studio preview at the new origin ───────────────
const backupPath = envBackupPath(slug)
const before = readEnvBackup(slug)
if (before.SANITY_STUDIO_PREVIEW_URL === origin) {
  log('cutover', `2/6 env backup already points at ${origin}`)
} else {
  const txt = fs.readFileSync(backupPath, 'utf8')
  fs.writeFileSync(
    backupPath,
    txt.replace(/^SANITY_STUDIO_PREVIEW_URL=.*$/m, `SANITY_STUDIO_PREVIEW_URL=${origin}`),
  )
  log('cutover', `2/6 ${backupPath}: preview URL ${before.SANITY_STUDIO_PREVIEW_URL} → ${origin}`)
  log('cutover', '      (the 15-min health check reads this file, so it retargets automatically)')
}

// ── 3–5. inside the client env: CORS, siteUrl, Studio redeploy ─────────────
await withClientEnv(slug, async () => {
  log('cutover', `3/6 adding CORS origin ${origin}…`)
  try {
    sh(`npx sanity cors add "${origin}" --credentials`, {cwd: STUDIO_DIR, capture: true})
    log('cutover', `added ${origin}`)
  } catch (e) {
    const msg = String(e.stdout || e.message || '')
    if (/already exists|duplicate/i.test(msg)) log('cutover', `CORS origin already present`)
    else throw e
  }

  log('cutover', `4/6 patching seoSettings.siteUrl…`)
  execSync(`npx sanity exec scripts/onboard/92-set-siteurl.js --with-user-token`, {
    cwd: STUDIO_DIR,
    stdio: 'inherit',
    env: {...process.env, CUTOVER_SITE_URL: origin},
  })
})

log('cutover', `5/6 redeploying hosted Studio (bakes the new preview URL + allowOrigins)…`)
sh(`node studio/scripts/onboard/30-studio-deploy.js --slug=${slug}`, {cwd: REPO_ROOT})

// ── 6. smoke: the new domain serves the site ────────────────────────────────
log('cutover', `6/6 smoke-testing ${origin}/ (cert issuance can take a minute)…`)
let ok = false
for (let i = 0; i < 12; i++) {
  try {
    const res = await fetch(`${origin}/`, {redirect: 'follow'})
    const body = await res.text()
    if (res.status === 200 && body.includes('data-section-type')) {
      ok = true
      break
    }
    log('cutover', `  attempt ${i + 1}: status ${res.status} — retrying in 15s`)
  } catch (e) {
    log('cutover', `  attempt ${i + 1}: ${e.cause?.code || e.message} — retrying in 15s`)
  }
  await new Promise((r) => setTimeout(r, 15000))
}
if (!ok) {
  log('cutover', `⚠ ${origin} not serving yet. Usually just slow cert/DNS — check again in a few`)
  log('cutover', `  minutes. If YOUR machine can't resolve it but https://1.1.1.1 can, that's the`)
  log('cutover', `  local DNS negative-cache gotcha: verify with \`dig @1.1.1.1 ${domain}\`.`)
} else {
  log('cutover', `✓ ${origin} is live (200 + section marker)`)
}

// ── manual follow-ups ───────────────────────────────────────────────────────
const alt = domain === apex ? `www.${apex}` : apex
console.log(`
[cutover] Done. Manual follow-ups (dashboard/browser):
  □ Redirect rule for the other host: ${alt} → ${origin}
    (CF dashboard → zone ${apex} → Rules → Redirect Rules → wildcard Single Redirect, 301)
  □ Google Search Console: add ${origin} property, submit ${origin}/sitemap.xml
  □ If the domain previously lived on a CF Pages project, remove it there
  □ Announce to the client + update any bio/social links
  □ Sanity Studio for this client now previews ${origin} — sanity-check Presentation once
`)
