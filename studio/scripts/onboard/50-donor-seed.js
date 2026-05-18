// 50-donor-seed.js — clone a polished donor dataset into the new project.
//
//   node studio/scripts/onboard/50-donor-seed.js \
//     --slug=kelly-mac-studios --donor=cnw-photo-demo
//
// Exports the donor's production dataset, imports it --replace into the
// client's empty project. Donor slug → project id via lib DONORS map.
// The client's project must be empty (freshly created) — --replace wipes.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {assertSlug, getArg, withClientEnv, readEnvBackup, envBackupPath, DONORS, sh, STUDIO_DIR, REPO_ROOT, log} from './lib.js'

const slug = assertSlug(getArg('slug', {required: true}))
const donor = getArg('donor', {required: true})
const donorId = DONORS[donor]
if (!donorId) throw new Error(`Unknown donor "${donor}". Known: ${Object.keys(DONORS).join(', ')}`)

const targetId = readEnvBackup(slug).SANITY_STUDIO_PROJECT_ID
if (!targetId) throw new Error(`No SANITY_STUDIO_PROJECT_ID in ${envBackupPath(slug)}`)
if (targetId === donorId) throw new Error('Target project == donor project. Refusing.')

const tarball = path.join(os.tmpdir(), `${donor}-export-${Date.now()}.tar.gz`)

// Export from the donor: temporarily point env at the donor backup if we
// have one, else use --project flag style via a throwaway env.
log('donor-seed', `exporting ${donor} (${donorId})…`)
const donorBackup = path.join(STUDIO_DIR, `.env.${donor}-backup`)
if (fs.existsSync(donorBackup)) {
  const snap = path.join(REPO_ROOT, `.staging/.env-seed-${Date.now()}.bak`)
  const active = path.join(STUDIO_DIR, '.env')
  const had = fs.existsSync(active)
  if (had) fs.copyFileSync(active, snap)
  fs.copyFileSync(donorBackup, active)
  try {
    sh(`npx sanity dataset export production ${tarball}`, {cwd: STUDIO_DIR})
  } finally {
    if (had) { fs.copyFileSync(snap, active); fs.rmSync(snap, {force: true}) }
  }
} else {
  throw new Error(`No donor backup studio/.env.${donor}-backup — add one or export manually.`)
}

log('donor-seed', `importing into ${slug} (${targetId}) with --replace…`)
await withClientEnv(slug, async () => {
  sh(`npx sanity dataset import ${tarball} production --replace`, {cwd: STUDIO_DIR})
})
fs.rmSync(tarball, {force: true})

log('donor-seed', 'done')
log('donor-seed', 'NEXT: edit .staging/<slug>/content.json (see REVIEW.md), then 60-overlay.js')
