// 70-gh-env.js — create the per-client GitHub Environment + matrix entry.
//
//   node studio/scripts/onboard/70-gh-env.js \
//     --slug=kelly-mac-studios \
//     --cf-token=... --cf-account=... \
//     --sanity-read-token=... --preview-secret=...
//
// (Pass secrets via env vars instead of flags if you'd rather not have
//  them in shell history: CF_TOKEN, CF_ACCOUNT, SANITY_READ_TOKEN,
//  PREVIEW_SECRET.)
//
// Creates GH env `client-<slug>`, sets the 4 secrets, and inserts the
// matrix entry into .github/workflows/deploy.yml (alphabetically,
// idempotent — skips if the slug is already in the matrix).

import fs from 'node:fs'
import path from 'node:path'
import {assertSlug, getArg, readEnvBackup, sh, REPO_ROOT, log} from './lib.js'

const slug = assertSlug(getArg('slug', {required: true}))
const cfToken = getArg('cf-token', {fallback: process.env.CF_TOKEN})
const cfAccount = getArg('cf-account', {fallback: process.env.CF_ACCOUNT})
const sanityRead = getArg('sanity-read-token', {fallback: process.env.SANITY_READ_TOKEN})
const previewSecret = getArg('preview-secret', {fallback: process.env.PREVIEW_SECRET})
for (const [k, v] of Object.entries({cfToken, cfAccount, sanityRead, previewSecret}))
  if (!v) throw new Error(`Missing ${k} (flag or env var)`)

const projectId = readEnvBackup(slug).SANITY_STUDIO_PROJECT_ID
if (!projectId) throw new Error(`No project id in env backup for ${slug}`)

const REPO = sh('gh repo view --json nameWithOwner -q .nameWithOwner', {capture: true}).trim()
const ENV = `client-${slug}`

sh(`gh api -X PUT repos/${REPO}/environments/${ENV} --silent`)
log('gh-env', `environment ${ENV} ensured`)
const secrets = {
  CF_API_TOKEN: cfToken,
  CF_ACCOUNT_ID: cfAccount,
  SANITY_API_READ_TOKEN: sanityRead,
  SANITY_PREVIEW_SECRET: previewSecret,
}
for (const [name, val] of Object.entries(secrets)) {
  sh(`gh secret set ${name} --env ${ENV} --repo ${REPO} --body ${JSON.stringify(val)}`, {capture: true})
  log('gh-env', `secret ${name} set`)
}

// ── deploy.yml matrix insert ──
const ymlPath = path.join(REPO_ROOT, '.github/workflows/deploy.yml')
let yml = fs.readFileSync(ymlPath, 'utf8')
if (yml.includes(`slug: ${slug}`)) {
  log('gh-env', `matrix already contains ${slug} — skipping yml edit`)
} else {
  const entry = `          - slug: ${slug}\n            sanity_project_id: ${projectId}\n            studio_url: https://${slug}.sanity.studio\n            pages_url: https://${slug}.pages.dev\n`
  // insert right after `        client:` line, keeping alpha-ish order is
  // nice-to-have but not required (matrix order is irrelevant to CI).
  yml = yml.replace(/(\n {8}client:\n)/, `$1${entry}`)
  fs.writeFileSync(ymlPath, yml)
  log('gh-env', `inserted ${slug} into deploy.yml matrix`)
}

log('gh-env', 'NEXT: commit deploy.yml, then 80-cf-provision.js')
