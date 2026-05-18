// 80-cf-provision.js — create the client's Cloudflare Pages project and
// set its production runtime env vars, via the CF API.
//
//   node studio/scripts/onboard/80-cf-provision.js \
//     --slug=kelly-mac-studios \
//     --cf-token=... --cf-account=... \
//     --sanity-read-token=... --preview-secret=...
//
// Replaces the manual Phase-2 clickwork: creates the Pages project in
// Direct Upload mode with production_branch=production, and sets the 4
// runtime env vars (the easy-to-miss step). The first real asset deploy
// still comes from the GH Actions matrix (70-gh-env.js wires that).
//
// Idempotent: if the project already exists we just (re)apply env vars.

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
