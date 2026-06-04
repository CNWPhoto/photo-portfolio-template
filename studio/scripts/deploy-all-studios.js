// deploy-all-studios.js — parallel hosted-Studio fan-out.
//
//   npm run deploy-all                          # all clients, concurrency 5
//   npm run deploy-all -- --concurrency=10      # bump parallelism
//   npm run deploy-all -- --include-demo        # also deploy cnw-photo-demo
//   npm run deploy-all -- --only=blackbird-photography,coola-creative
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
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {getArg, readEnvBackup, STUDIO_DIR, log} from './onboard/lib.js'

const __filename = fileURLToPath(import.meta.url)

// SEQUENTIAL by default. `sanity deploy` builds into a shared dir under
// studio/, so running deploys concurrently lets the builds clobber each other
// and a host can get uploaded with another client's bundle (wrong projectId
// baked in). Only raise concurrency once each deploy builds in isolation.
const concurrency = Number(getArg('concurrency', {fallback: 1}))
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

// Run `sanity deploy` for one slug with its backup env preloaded.
// stdio captured so concurrent deploys' output doesn't interleave; we
// print a compact per-slug summary instead.
function deployOne(slug) {
  return new Promise((resolve) => {
    const env = {...process.env, ...readEnvBackup(slug)}
    const child = spawn(SANITY_BIN, ['deploy'], {
      cwd: STUDIO_DIR,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => {
      stdout += d
    })
    child.stderr.on('data', (d) => {
      stderr += d
    })
    child.on('close', (code) => {
      const url = (stdout.match(/Studio deployed to\s+(\S+)/) || [])[1]
      resolve({slug, code, url, stdout, stderr})
    })
    child.on('error', (err) => {
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
