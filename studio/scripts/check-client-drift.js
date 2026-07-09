// check-client-drift.js — fail if the client rosters disagree.
//
//   node studio/scripts/check-client-drift.js        # from repo root (CI)
//   cd studio && npm run check-drift                 # local
//
// Two committed rosters must stay in lockstep, or a client silently drops out of
// a fan-out (site updates but not Studio, or vice versa):
//   A. studio/.env.<slug>-backup   — Studio roster (deploy-all-studios, migrate-all read these)
//   B. .github/workflows/deploy.yml `clients` matrix — live-site deploy roster
// This asserts A and B list the SAME clients, with matching projectId + host.
//
// Optional tier (skipped cleanly if `gh` is unavailable/unauthed): every matrix
// client has a GitHub Environment `client-<slug>` holding its deploy secrets —
// a missing one makes that client's site deploy fail at runtime.
//
// Dependency-free: reads files + optionally shells `gh`. Exit 1 on any drift.

import fs from 'node:fs'
import path from 'node:path'
import {execFileSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url)) // <repo>/studio/scripts
const STUDIO_DIR = path.resolve(SCRIPTS_DIR, '..')
const REPO_ROOT = path.resolve(STUDIO_DIR, '..')
const DEMO_SLUG = 'cnw-photo-demo' // the demo is its own CI job, not in the clients matrix

// Slugs intentionally held OUT of the deploy.yml site matrix during a launch
// freeze. They keep their Studio env-backup (so the Studio fan-out still covers
// them) and are only paused from the live-site fan-out. Listed here so this gate
// treats the deliberate "has a backup but no matrix entry" asymmetry as expected,
// not drift. UN-FREEZE: uncomment the client's deploy.yml matrix entry AND remove
// it from this set (the two must move together).
const FROZEN_SLUGS = new Set(['pets-in-focus'])

// ── A. env-backups (Studio roster) ───────────────────────────────────────────
const backups = new Map() // slug -> {projectId, host}
for (const f of fs.readdirSync(STUDIO_DIR)) {
  const m = f.match(/^\.env\.(.+)-backup$/)
  if (!m || m[1] === DEMO_SLUG) continue
  const txt = fs.readFileSync(path.join(STUDIO_DIR, f), 'utf8')
  const val = (k) => (txt.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1] || ''
  backups.set(m[1], {projectId: val('SANITY_STUDIO_PROJECT_ID'), host: val('SANITY_STUDIO_HOST')})
}

// ── B. deploy.yml clients matrix (site roster) ───────────────────────────────
const yml = fs.readFileSync(path.join(REPO_ROOT, '.github', 'workflows', 'deploy.yml'), 'utf8')
const matrix = new Map() // slug -> {projectId, host}
for (const m of yml.matchAll(
  /- slug:\s*(\S+)\s*\n\s*sanity_project_id:\s*(\S+)\s*\n\s*studio_url:\s*(\S+)/g,
)) {
  const host = (m[3].match(/https?:\/\/([^./]+)\.sanity\.studio/) || [])[1] || m[3]
  matrix.set(m[1], {projectId: m[2], host})
}

// ── Compare A ⟷ B ────────────────────────────────────────────────────────────
const problems = []
const allSlugs = new Set([...backups.keys(), ...matrix.keys()])
for (const slug of [...allSlugs].sort()) {
  const a = backups.get(slug)
  const b = matrix.get(slug)
  if (!b && FROZEN_SLUGS.has(slug)) {
    console.log(`[drift] ⏸ ${slug}: frozen — kept in the Studio roster, intentionally out of the deploy.yml site matrix`)
    continue
  }
  if (!a) { problems.push(`${slug}: in deploy.yml matrix but NO studio/.env.${slug}-backup (Studio fan-out would skip it)`); continue }
  if (!b) { problems.push(`${slug}: has an env-backup but NOT in deploy.yml matrix (site fan-out would skip it)`); continue }
  if (a.projectId !== b.projectId) problems.push(`${slug}: projectId mismatch — backup=${a.projectId} vs matrix=${b.projectId}`)
  if (a.host !== b.host) problems.push(`${slug}: host mismatch — backup=${a.host} vs matrix studio_url host=${b.host}`)
  if (!a.projectId || !a.host) problems.push(`${slug}: env-backup missing ${!a.projectId ? 'PROJECT_ID' : ''}${!a.projectId && !a.host ? ' + ' : ''}${!a.host ? 'HOST' : ''}`)
}

// ── Optional: GitHub Environments exist (needs gh) ───────────────────────────
// NON-FATAL: a missing environment makes a client's site deploy fail LOUDLY at
// runtime (not a silent skip), and this tier depends on gh auth/permissions, so
// it must never false-fail the CI gate. Surfaced as a warning; only the
// deterministic file-roster comparison above (`problems`) blocks the build.
const warnings = []
let envNote = ''
try {
  const out = execFileSync('gh', ['api', '--paginate', 'repos/{owner}/{repo}/environments', '-q', '.environments[].name'], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000,
  })
  const envs = new Set(out.split('\n').map((s) => s.trim()).filter(Boolean))
  for (const s of matrix.keys()) {
    if (!envs.has(`client-${s}`)) warnings.push(`${s}: no GitHub Environment 'client-${s}' (site deploy would fail at runtime — missing secrets)`)
  }
  envNote = ` · ${envs.size} GitHub Environments checked`
} catch {
  envNote = ' · GitHub Environments NOT checked (gh unavailable/unauthed)'
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log(`[drift] ${backups.size} env-backups · ${matrix.size} matrix clients${envNote}`)
for (const w of warnings) console.log(`  ⚠ ${w}`)
if (problems.length) {
  console.log(`[drift] ✗ ${problems.length} problem(s):`)
  for (const p of problems) console.log(`  ✗ ${p}`)
  console.log('[drift] RESULT: DRIFT — reconcile before deploying (see docs/client-setup-guide.md).')
  process.exit(1)
}
console.log(`[drift] ✓ rosters agree — ${matrix.size} clients, projectId + host consistent across both${warnings.length ? ` (${warnings.length} warning[s] above)` : ''}.`)
