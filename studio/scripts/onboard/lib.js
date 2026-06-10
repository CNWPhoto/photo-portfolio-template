// Shared helpers for the client-onboarding scripts (10-scrape … 80-cf-provision).
//
// Plain ESM — no sanity/cli import here so this loads in both `node`
// (scrape, gh-env, cf-provision) and `sanity exec` (overlay) contexts.
// Scripts that need a Sanity client import getCliClient themselves.

import {execSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// studio/scripts/onboard → repo root is three up
export const REPO_ROOT = path.resolve(__dirname, '../../..')
export const STUDIO_DIR = path.join(REPO_ROOT, 'studio')

// ── slug ───────────────────────────────────────────────────────────────────
const SLUG_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
export function assertSlug(slug) {
  if (!slug || !SLUG_RE.test(slug)) {
    throw new Error(
      `Invalid slug "${slug}". Use lowercase kebab-case, e.g. kelly-mac-studios.`,
    )
  }
  return slug
}

export function getArg(name, {required = false, fallback = undefined} = {}) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  const val = hit ? hit.split('=').slice(1).join('=') : fallback
  if (required && !val) {
    throw new Error(`Missing required --${name}=<value>`)
  }
  return val
}

// ── paths ──────────────────────────────────────────────────────────────────
export function stagingDir(slug) {
  return path.join(REPO_ROOT, '.staging', slug)
}
export function envBackupPath(slug) {
  return path.join(STUDIO_DIR, `.env.${slug}-backup`)
}
export const ACTIVE_ENV = path.join(STUDIO_DIR, '.env')

// ── studio .env swap/restore ───────────────────────────────────────────────
// Snapshot the active studio/.env, copy the client's backup over it, run
// `fn`, then always restore the snapshot — even if fn throws. Mirrors the
// manual cp dance from the Blackbird onboarding so local dev .env is never
// left pointing at a client project.
export async function withClientEnv(slug, fn) {
  assertSlug(slug)
  const backup = envBackupPath(slug)
  if (!fs.existsSync(backup)) {
    throw new Error(`No env backup at ${backup}. Run 20-env.js first.`)
  }
  const snapPath = path.join(
    REPO_ROOT,
    `.staging/.env-snapshot-${Date.now()}.bak`,
  )
  const hadActive = fs.existsSync(ACTIVE_ENV)
  if (hadActive) fs.copyFileSync(ACTIVE_ENV, snapPath)
  fs.copyFileSync(backup, ACTIVE_ENV)
  try {
    return await fn()
  } finally {
    if (hadActive) {
      fs.copyFileSync(snapPath, ACTIVE_ENV)
      fs.rmSync(snapPath, {force: true})
    }
  }
}

export function readEnvBackup(slug) {
  const txt = fs.readFileSync(envBackupPath(slug), 'utf8')
  const out = {}
  for (const line of txt.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) out[m[1]] = m[2]
  }
  return out
}

// ── shell ──────────────────────────────────────────────────────────────────
export function sh(cmd, opts = {}) {
  return execSync(cmd, {
    cwd: opts.cwd || REPO_ROOT,
    stdio: opts.capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
    env: {...process.env, ...(opts.env || {})},
  })
}

// ── Cloudflare API ─────────────────────────────────────────────────────────
const CF_BASE = 'https://api.cloudflare.com/client/v4'
export async function cf(token, method, urlPath, body) {
  const res = await fetch(`${CF_BASE}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body ? {body: JSON.stringify(body)} : {}),
  })
  const json = await res.json().catch(() => ({}))
  if (!json.success) {
    throw new Error(
      `CF ${method} ${urlPath} failed: ${JSON.stringify(json.errors || json)}`,
    )
  }
  return json.result
}

// ── known donors ───────────────────────────────────────────────────────────
// Maps a donor slug to its Sanity project id, for 50-donor-seed.js.
export const DONORS = {
  'cnw-photo-demo': 'hx5xgigp',
  'family-demo': 'v14sne67',
  'wedding-demo': 'boa9509d',
  'coola-creative': 'tl3zj8iz',
  'lavon-photography': '3a8494gh',
  'blackbird-photography': '6nc24jar',
}

// ── known palettes (from the seeded siteSettings.palettes) ─────────────────
// slug → human label. The overlay validates --palette against this so a
// typo doesn't silently leave the donor's palette in place.
export const PALETTES = {
  'classic-cream': 'Classic Cream',
  'warm-studio': 'Warm Studio',
  'dark-editorial': 'Dark Editorial',
  'cool-minimal': 'Cool Minimal',
  'forest-sage': 'Forest Sage',
}

export function log(step, msg) {
  console.log(`[${step}] ${msg}`)
}
