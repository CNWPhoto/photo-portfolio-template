// migrate-all-datasets.js — run one data migration across EVERY client dataset.
//
// The fleet automation for the "dry-run, then apply, against every live dataset"
// steps of the data-migration-before-code-deploy sequence (expand → migrate →
// contract). Sibling of deploy-all-studios.js. See the vault playbook
// `wiki/playbooks/fleet-feature-migration` for the full procedure.
//
//   npm run migrate-all -- --script=scripts/migrations/<name>.js                 # DRY across all clients
//   npm run migrate-all -- --script=scripts/migrations/<name>.js --apply         # APPLY across all clients
//   npm run migrate-all -- --script=... --only=pets-in-focus                     # one client (dry)
//   npm run migrate-all -- --script=... --only=pets-in-focus --apply             # one client (apply)
//   npm run migrate-all -- --script=... --snapshot --apply                       # export each dataset first
//   npm run migrate-all -- --script=... --include-demo                           # also cnw-photo-demo
//   npm run migrate-all -- --script=... --concurrency=4 --apply                  # raise parallelism
//
// Each client's studio/.env.<slug>-backup is preloaded into the spawned
// `sanity exec`, so the migration script's getCliClient() targets that client's
// project + dataset — no studio/.env swap, so it's concurrency-safe (unlike
// deploy-all, this runs `sanity exec`, not `sanity deploy`, so there's no shared
// build dir to corrupt). `--apply` is PASSED THROUGH to the migration script;
// without it the script dry-runs (prints planned patches, writes nothing).
//
// Auth: runs with `--with-user-token` — as of 2026-07 Connor's Sanity session
// has editor access to every client project (verified writing to tryjma1z this
// cycle). If a project returns 401, that migration falls back to a per-project
// SANITY_WRITE_TOKEN (see sanity-migration-script-setup); put it in that client's
// env-backup and the template picks it up.

import {spawn} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {getArg, readEnvBackup, STUDIO_DIR, log} from './onboard/lib.js'

const scriptRel = getArg('script', {required: true}) // e.g. scripts/migrations/foo.js (relative to studio/)
const apply = process.argv.includes('--apply')
const snapshot = process.argv.includes('--snapshot')
const includeDemo = process.argv.includes('--include-demo')
const onlyArg = getArg('only')
// Default sequential: legible per-client logs and a gentle API rate. These are
// independent `sanity exec` runs (no shared build dir), so raising concurrency
// is safe once you trust the migration.
const concurrency = Number(getArg('concurrency', {fallback: 1}))
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

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
  if (missing.length) throw new Error(`Unknown slug(s) in --only: ${missing.join(', ')}`)
}
if (!includeDemo) slugs = slugs.filter((s) => s !== 'cnw-photo-demo')
if (!slugs.length) {
  log('migrate-all', 'no slugs to migrate (filtered everything out)')
  process.exit(0)
}

const SANITY_BIN = path.join(STUDIO_DIR, 'node_modules', '.bin', 'sanity')
if (!fs.existsSync(SANITY_BIN)) {
  throw new Error(`Missing ${SANITY_BIN}. Run \`cd studio && npm install\` first.`)
}
const migPath = path.join(STUDIO_DIR, scriptRel)
if (!fs.existsSync(migPath)) {
  throw new Error(`Migration script not found: ${migPath} (pass --script relative to studio/)`)
}

function run(bin, args, env) {
  return new Promise((resolve) => {
    const child = spawn(bin, args, {cwd: STUDIO_DIR, env, stdio: ['ignore', 'pipe', 'pipe']})
    let out = '', err = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (err += d))
    child.on('close', (code) => resolve({code, out, err}))
    child.on('error', (e) => resolve({code: -1, out, err: String(e)}))
  })
}

async function migrateOne(slug) {
  const env = {...process.env, ...readEnvBackup(slug)}
  const dataset = env.SANITY_STUDIO_DATASET || 'production'

  // Optional pre-migration snapshot — recommended for the destructive/contract
  // phase. One tarball (docs + assets) per client, restore is `dataset import
  // --replace`. See sanity-dataset-snapshot-before-migration.
  if (snapshot && apply) {
    const dir = path.join(STUDIO_DIR, '.migration-snapshots')
    fs.mkdirSync(dir, {recursive: true})
    const out = path.join(dir, `${slug}-${dataset}-${STAMP}.tar.gz`)
    const snap = await run(SANITY_BIN, ['dataset', 'export', dataset, out], env)
    if (snap.code !== 0) {
      return {slug, code: snap.code, summary: `snapshot failed`, err: snap.err.split('\n').slice(-6).join('\n')}
    }
  }

  const args = ['exec', scriptRel, '--with-user-token', '--', `--slug=${slug}`, ...(apply ? ['--apply'] : [])]
  const r = await run(SANITY_BIN, args, env)
  // Surface the migration script's own final line (its "[migrate] …" summary).
  const summary = (r.out.trim().split('\n').filter(Boolean).pop() || '').slice(0, 160)
  return {slug, code: r.code, summary, err: r.err}
}

async function runWithLimit(items, limit, fn) {
  const queue = items.slice()
  const results = []
  await Promise.all(
    Array.from({length: Math.min(limit, items.length)}, async () => {
      while (queue.length) results.push(await fn(queue.shift()))
    }),
  )
  return results
}

const start = Date.now()
log('migrate-all', `${apply ? 'APPLYING' : 'DRY RUN'} ${scriptRel} across ${slugs.length} client(s) at concurrency=${concurrency}${snapshot && apply ? ' (+snapshot)' : ''}`)
log('migrate-all', `clients: ${slugs.join(', ')}`)
if (!apply) log('migrate-all', 'DRY RUN — no writes. Re-run with --apply once the planned patches look right.')

const results = await runWithLimit(slugs, concurrency, migrateOne)
const elapsed = ((Date.now() - start) / 1000).toFixed(1)

// code 0 = clean; code 2 = the migration flagged docs for manual review (by
// convention in the template); anything else = failure.
const ok = results.filter((r) => r.code === 0)
const flagged = results.filter((r) => r.code === 2)
const failed = results.filter((r) => r.code !== 0 && r.code !== 2)

for (const r of [...ok, ...flagged]) log('migrate-all', `${r.code === 2 ? '⚑' : '✓'} ${r.slug} — ${r.summary || '(no summary)'}`)
for (const r of failed) {
  log('migrate-all', `✗ ${r.slug} (exit ${r.code}) — ${r.summary || ''}`)
  if (r.err) process.stderr.write(r.err.split('\n').slice(-8).join('\n') + '\n')
}

log('migrate-all', `done in ${elapsed}s — ${ok.length} clean, ${flagged.length} flagged, ${failed.length} failed`)
if (flagged.length) log('migrate-all', 'Flagged clients need a human decision on the ambiguous docs before contract.')
process.exit(failed.length ? 1 : 0)
