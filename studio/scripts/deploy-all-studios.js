// deploy-all-studios.js — hosted-Studio fan-out.
//
//   npm run deploy-all                          # all clients, SEQUENTIAL (concurrency=1, in-place)
//   npm run deploy-all -- --concurrency=8       # PARALLEL — each deploy in an isolated scratch copy
//   npm run deploy-all -- --include-demo        # also deploy cnw-photo-demo
//   npm run deploy-all -- --only=blackbird-photography,coola-creative
//
// Safety: refuses to deploy a client whose env-backup is missing PROJECT_ID or
// HOST (which would silently fall back to the demo), and after each deploy
// verifies it landed on that client's own <host>.sanity.studio.
//
// Why this exists: `npm run deploy` reads from studio/.env, so deploying
// N clients sequentially means N × (cp backup → deploy → restore). The .env
// is shared mutable state, so the sequential pattern is the bottleneck —
// not the deploys themselves, which are independent on Sanity's side.
//
// This script preloads each client's env-backup variables directly into
// the spawned `sanity deploy` process and skips the studio/.env file
// entirely. Five (or more) deploys can then run concurrently against
// sanity.io without stepping on each other's files. Local studio/.env is
// never touched — local dev keeps iframing localhost:4321 the whole time.

import {spawn} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {getArg, readEnvBackup, STUDIO_DIR, REPO_ROOT, log} from './onboard/lib.js'

const __filename = fileURLToPath(import.meta.url)

// Default concurrency=1 (SEQUENTIAL) — byte-identical to the historical
// behavior: each deploy runs in-place in studio/. `sanity deploy` writes
// cwd-relative build state (.sanity/runtime + dist), so concurrent in-place
// runs would clobber each other and a host could get uploaded with another
// client's bundle (wrong projectId baked in). When --concurrency>1 is passed,
// each deploy is run in an ISOLATED scratch copy of studio/ instead (see
// deployOne), so parallel runs can't collide. Raising concurrency is opt-in.
const concurrency = Number(getArg('concurrency', {fallback: 1}))
const isolate = concurrency > 1
const onlyArg = getArg('only')
const includeDemo = process.argv.includes('--include-demo')

// Discover deployable Studios by scanning studio/.env.*-backup. Single
// source of truth — no list duplicated between this script, the GH
// Actions matrix, and the onboarding registry.
const allSlugs = fs
  .readdirSync(STUDIO_DIR)
  .map((f) => f.match(/^\.env\.(.+)-backup$/))
  .filter(Boolean)
  .map((m) => m[1])
  .sort()

let slugs = allSlugs
if (onlyArg) {
  const wanted = new Set(onlyArg.split(',').map((s) => s.trim()))
  slugs = allSlugs.filter((s) => wanted.has(s))
  const missing = [...wanted].filter((s) => !allSlugs.includes(s))
  if (missing.length) {
    throw new Error(`Unknown slug(s) in --only: ${missing.join(', ')}`)
  }
}
if (!includeDemo) slugs = slugs.filter((s) => s !== 'cnw-photo-demo')

if (slugs.length === 0) {
  log('deploy-all', 'no slugs to deploy (filtered everything out)')
  process.exit(0)
}

const SANITY_BIN = path.join(STUDIO_DIR, 'node_modules', '.bin', 'sanity')
if (!fs.existsSync(SANITY_BIN)) {
  throw new Error(`Missing ${SANITY_BIN}. Run \`cd studio && npm install\` first.`)
}

// Files/dirs `sanity deploy` reads from studio/'s cwd. Everything else comes
// through SYMLINKS (never copies). Kept minimal on purpose.
const SCRATCH_FILES = ['sanity.config.js', 'sanity.cli.js', 'package.json', 'eslint.config.mjs']
const SCRATCH_DIRS = ['schemaTypes', 'components', 'static']

// Make an isolated scratch MINI-REPO so a concurrent `sanity deploy` writes its
// .sanity/runtime + dist there instead of the shared studio/ (what lets parallel
// deploys not clobber each other). The layout mirrors the real repo because the
// Studio schema imports one file from outside studio/ (schemaTypes/siteSettings.js
// → ../../src/lib/fontCatalog.js): a flat copy of studio/ alone would break that
// relative path.
//
//   <root>/           (mktemp)
//     src         -> symlink → <repo>/src            (../../src/... resolves)
//     node_modules -> symlink → <repo>/node_modules  (any src npm deps resolve)
//     studio/       (copied config + schema + components + static)
//       node_modules -> symlink → <repo>/studio/node_modules
//
// Returns { root, cwd } — cwd is <root>/studio, where `sanity deploy` runs.
function makeScratch(slug) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `studio-deploy-${slug}-`))
  fs.symlinkSync(path.join(REPO_ROOT, 'src'), path.join(root, 'src'), 'dir')
  fs.symlinkSync(path.join(REPO_ROOT, 'node_modules'), path.join(root, 'node_modules'), 'dir')
  const cwd = path.join(root, 'studio')
  fs.mkdirSync(cwd)
  for (const f of SCRATCH_FILES) {
    const src = path.join(STUDIO_DIR, f)
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(cwd, f))
  }
  for (const d of SCRATCH_DIRS) {
    const src = path.join(STUDIO_DIR, d)
    if (fs.existsSync(src)) fs.cpSync(src, path.join(cwd, d), {recursive: true})
  }
  fs.symlinkSync(path.join(STUDIO_DIR, 'node_modules'), path.join(cwd, 'node_modules'), 'dir')
  return {root, cwd}
}
// Cleanup: unlink the three symlinks (removes the LINKS, never their targets)
// then remove the copied tree. rmSync also treats any stray symlink as a link,
// so the real src / node_modules can never be deleted here.
function rmScratch(root) {
  try {
    for (const link of ['studio/node_modules', 'src', 'node_modules']) {
      const p = path.join(root, link)
      try { if (fs.lstatSync(p).isSymbolicLink()) fs.unlinkSync(p) } catch { /* absent */ }
    }
    fs.rmSync(root, {recursive: true, force: true})
  } catch { /* best-effort cleanup */ }
}

// Run `sanity deploy` for one slug with its backup env preloaded.
// stdio captured so concurrent deploys' output doesn't interleave; we
// print a compact per-slug summary instead.
function deployOne(slug) {
  return new Promise((resolve) => {
    const env = {...process.env, ...readEnvBackup(slug)}
    // GUARD: sanity.cli.js falls back to the DEMO's project/host when these are
    // unset (projectId → 'hx5xgigp', studioHost → 'cnw-photo-demo'). A backup
    // missing either would silently deploy this client's build to the demo's
    // host, or point their Studio at the demo project. Refuse rather than risk
    // it — this is a safety stop, not a deploy.
    const projectId = env.SANITY_STUDIO_PROJECT_ID
    const host = env.SANITY_STUDIO_HOST
    if (!projectId || !host) {
      resolve({slug, code: -2, url: null, stdout: '',
        stderr: `refusing to deploy: env-backup missing ${!projectId ? 'SANITY_STUDIO_PROJECT_ID' : ''}${!projectId && !host ? ' + ' : ''}${!host ? 'SANITY_STUDIO_HOST' : ''} (would fall back to the demo)`,
      })
      return
    }
    const scratch = isolate ? makeScratch(slug) : null
    const cwd = scratch ? scratch.cwd : STUDIO_DIR
    const child = spawn(SANITY_BIN, ['deploy'], {cwd, env, stdio: ['ignore', 'pipe', 'pipe']})
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('close', (code) => {
      if (scratch) rmScratch(scratch.root)
      const url = (stdout.match(/Studio deployed to\s+(\S+)/) || [])[1]
      // VERIFY: the deploy landed on THIS client's host, not the demo fallback.
      // A mismatch means the wrong bundle went somewhere — surface it loudly.
      let code2 = code
      if (code === 0 && url && !url.includes(`${host}.sanity.studio`)) {
        code2 = -3
        stderr += `\nHOST MISMATCH: expected ${host}.sanity.studio, deployed to ${url}`
      }
      resolve({slug, code: code2, url, stdout, stderr})
    })
    child.on('error', (err) => {
      if (scratch) rmScratch(scratch.root)
      resolve({slug, code: -1, url: null, stdout, stderr: String(err)})
    })
  })
}

// Simple slot-pool: `concurrency` workers pull from a shared queue.
// `Promise.allSettled` over plain `slugs.map(deployOne)` would also work
// but would fire all N at once — fine for 5, risky for 50 if Sanity's
// API throttles bursts. Limiting concurrency gives a predictable upper
// bound on inflight deploys.
async function runWithLimit(items, limit, fn) {
  const queue = items.slice()
  const results = []
  await Promise.all(
    Array.from({length: Math.min(limit, items.length)}, async () => {
      while (queue.length) {
        const item = queue.shift()
        results.push(await fn(item))
      }
    }),
  )
  return results
}

const start = Date.now()
log('deploy-all', `deploying ${slugs.length} Studios at concurrency=${concurrency}…`)
log('deploy-all', `slugs: ${slugs.join(', ')}`)

const results = await runWithLimit(slugs, concurrency, deployOne)
const elapsed = ((Date.now() - start) / 1000).toFixed(1)

const ok = results.filter((r) => r.code === 0)
const failed = results.filter((r) => r.code !== 0)

for (const r of ok) {
  log('deploy-all', `✓ ${r.slug} → ${r.url || '(no URL parsed)'}`)
}
for (const r of failed) {
  log('deploy-all', `✗ ${r.slug} (exit ${r.code})`)
  if (r.stderr) {
    process.stderr.write(r.stderr.split('\n').slice(-10).join('\n') + '\n')
  }
}

log('deploy-all', `done in ${elapsed}s — ${ok.length}/${results.length} succeeded`)
process.exit(failed.length ? 1 : 0)
