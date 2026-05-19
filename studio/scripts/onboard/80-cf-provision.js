// 80-cf-provision.js — DEPRECATED (Workers migration, 2026-05-19).
//
// This script was the Pages-era automation: it created a CF Pages
// project in the client's account and set its 4 runtime env vars (the
// easy-to-miss CF dashboard step). On the Workers model both are
// obsolete:
//   - The Worker is created on first `wrangler deploy --name <slug>`.
//   - Runtime secrets are uploaded as Worker secrets by the workflow's
//     `wrangler secret bulk` step from the `client-<slug>` GitHub
//     Environment — there is no separate CF-dashboard env-var step.
//
// Onboarding step replaced by: `gh workflow run deploy.yml --ref main
// -f only_client=<slug>` after 70-gh-env.js has populated the GH
// Environment secrets. See studio/scripts/onboard/README.md.
//
// Kept for reference until the next cleanup pass; do not run.

import {assertSlug, getArg, readEnvBackup, cf, log} from './lib.js'

const slug = assertSlug(getArg('slug', {required: true}))
const token = getArg('cf-token', {fallback: process.env.CF_TOKEN, required: true})
const account = getArg('cf-account', {fallback: process.env.CF_ACCOUNT, required: true})
const sanityRead = getArg('sanity-read-token', {fallback: process.env.SANITY_READ_TOKEN, required: true})
const previewSecret = getArg('preview-secret', {fallback: process.env.PREVIEW_SECRET, required: true})
const projectId = readEnvBackup(slug).SANITY_STUDIO_PROJECT_ID
if (!projectId) throw new Error(`No project id in env backup for ${slug}`)

const base = `/accounts/${account}/pages/projects`

// 1. Create the project (Direct Upload) if it doesn't exist.
let exists = true
try {
  await cf(token, 'GET', `${base}/${slug}`)
  log('cf', `project ${slug} already exists`)
} catch {
  exists = false
}
if (!exists) {
  await cf(token, 'POST', base, {
    name: slug,
    production_branch: 'production',
  })
  log('cf', `created Pages project ${slug} (production_branch=production)`)
} else {
  // ALWAYS enforce production_branch, even on a pre-existing project. A
  // hand-created CF Pages project defaults to production_branch=main;
  // our matrix deploys target --branch=production, so without this the
  // production deployment lands as a *preview* and <slug>.pages.dev
  // keeps serving the placeholder (160-byte body → smoke test fails).
  // This is the Phase-2.3 gotcha from the playbook, now self-healing.
  const proj = await cf(token, 'GET', `${base}/${slug}`)
  if (proj.production_branch !== 'production') {
    await cf(token, 'PATCH', `${base}/${slug}`, {production_branch: 'production'})
    log('cf', `fixed production_branch ${proj.production_branch} → production`)
  } else {
    log('cf', 'production_branch already = production')
  }
}

// 2. Set production runtime env vars (the step that's easy to miss by hand).
const envVars = {
  PUBLIC_SANITY_PROJECT_ID: {type: 'plain_text', value: projectId},
  PUBLIC_SANITY_DATASET: {type: 'plain_text', value: 'production'},
  SANITY_API_READ_TOKEN: {type: 'secret_text', value: sanityRead},
  SANITY_PREVIEW_SECRET: {type: 'secret_text', value: previewSecret},
}
await cf(token, 'PATCH', `${base}/${slug}`, {
  deployment_configs: {production: {env_vars: envVars}},
})
log('cf', 'production runtime env vars set (2 plaintext, 2 secret)')

log('cf', `done. First asset deploy comes from the GH matrix:`)
log('cf', `  git checkout production && git merge main && git push origin production`)
