// 20-env.js — generate studio/.env.<slug>-backup from a template.
//
//   node studio/scripts/onboard/20-env.js \
//     --slug=kelly-mac-studios \
//     --project-id=<sanity project id> \
//     --title="Kelly Mac Studios"
//
// AppId is left blank; 30-studio-deploy.js fills it after the first deploy.

import fs from 'node:fs'
import {assertSlug, getArg, envBackupPath, log} from './lib.js'

const slug = assertSlug(getArg('slug', {required: true}))
const projectId = getArg('project-id', {required: true})
const title = getArg('title', {required: true})
const previewUrl = getArg('preview-url', {fallback: `https://${slug}.pages.dev`})

const body = `# ── ${title} ──
# Restore via: cp studio/.env.${slug}-backup studio/.env
# Then: cd studio && npm run deploy (to redeploy her Studio)

SANITY_STUDIO_PROJECT_ID=${projectId}
SANITY_STUDIO_DATASET=production
SANITY_STUDIO_HOST=${slug}
SANITY_STUDIO_TITLE=${title}

# Canonical preview URL — soft-launch pages.dev until a custom domain.
SANITY_STUDIO_PREVIEW_URL=${previewUrl}

# Pinned by 30-studio-deploy.js after the first deploy.
SANITY_STUDIO_APP_ID=

# AI Assist on by default during the Sanity Growth trial month.
SANITY_STUDIO_AI_ASSIST=true
`

const dest = envBackupPath(slug)
if (fs.existsSync(dest)) {
  log('env', `${dest} already exists — not overwriting. Delete it first to regenerate.`)
  process.exit(0)
}
fs.writeFileSync(dest, body)
log('env', `wrote ${dest}`)
log('env', 'NEXT: 30-studio-deploy.js')
