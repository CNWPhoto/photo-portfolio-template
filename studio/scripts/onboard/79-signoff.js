// 79-signoff.js — the onboarding gate. Answers one question: is this client
// actually finished, or does it just look finished?
//
// WHY THIS EXISTS
// A runbook is a document, and documents get skipped. Three separate live bugs
// in this repo trace to exactly that:
//   • 55-post-seed-clean was missing from the README's flow, so every client
//     onboarded from it inherited the DEMO's siteUrl (blackbird, kelly-mac).
//   • Nothing ever set a client's own siteUrl before their domain cutover, so
//     pre-cutover clients shipped with NO canonical tag on any page
//     (heidi-adler-photography — the nightly health check had been failing
//     since her launch).
//   • Script-created sections never got their schema defaults, leaving every
//     Studio control blank.
// Each was invisible until something else surfaced it weeks later.
//
// So this does NOT track "did someone run step N" — a completion flag is just
// another thing that can be wrong. It asserts the OUTCOME each step is
// supposed to produce, read back from the dataset, the repo and GitHub. A step
// run badly, half-run, or later undone by an editor fails the same as one never
// run at all.
//
// Read-only. Exit 0 only when every hard check passes.
//
// Run:
//   cd studio && npx dotenv -e .env.<slug>-backup -- \
//     npx sanity exec scripts/onboard/79-signoff.js --with-user-token -- --slug=<slug>
//
// Flags:
//   --slug=<slug>   (required)
//   --json          machine-readable report

globalThis.React = {createElement: () => null, Fragment: Symbol('fragment')}

import {getCliClient} from 'sanity/cli'
import {execSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const client = getCliClient({apiVersion: '2024-01-01'})
const argv = process.argv
const JSON_OUT = argv.includes('--json')
const slug = (argv.find((a) => a.startsWith('--slug=')) || '').split('=')[1] || ''
if (!slug) {
  console.error('Usage: --slug=<slug> [--json]')
  process.exit(1)
}

const REPO = path.resolve(process.cwd(), '..')
const results = []
const add = (step, name, ok, detail, hard = true) =>
  results.push({step, name, ok, detail, hard})

function readEnvBackup() {
  const p = path.join(process.cwd(), `.env.${slug}-backup`)
  if (!fs.existsSync(p)) return null
  const out = {}
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) out[m[1]] = m[2].trim()
  }
  return out
}

const DONOR_MARKERS = [
  'cnw-photo-demo',
  'connor-walberg',
  // Spaced form. The hyphenated marker above only matches slugs and URLs;
  // the donor's homepagePage.pageTitle reads "Pet Photography - Connor
  // Walberg", which lowercasing alone doesn't reconcile. Chaltron
  // Photography shipped that as her live <title> and this check passed.
  'connor walberg',
  'Denver Dog',
  'Pet Photographer Site',
  'Why Choose Our Studio',
  'Images that Rock',
  'Write a description about your business',
  'Steve Jobs',
  'The Johnson Family',
]

// Allowed values for any field with an options.list. A schema options list
// does NOT validate on write — only the Studio dropdown constrains it — so a
// scripted write can store anything. Three live bugs came from exactly this:
// splitSection.imageLayout 'left' (should be 'image-left'), nav children typed
// 'navLink' (should be 'navChildLink'), and galleryGridSection.layout 'grid'
// (should be 'grid-2'). All three rendered as a class that matched no CSS, so
// the section silently lost its layout with nothing logged anywhere.
function collectEnums(fields, out) {
  for (const f of fields || []) {
    const list = f?.options?.list
    if (Array.isArray(list) && list.length) {
      out[f.name] = list.map((o) => (typeof o === 'string' ? o : o?.value)).filter(Boolean)
    }
    if (Array.isArray(f?.fields)) collectEnums(f.fields, out)
  }
}
function countBadEnums(node, enums, bad = []) {
  if (Array.isArray(node)) {
    node.forEach((v) => countBadEnums(v, enums, bad))
    return bad
  }
  if (!node || typeof node !== 'object') return bad
  const e = node._type ? enums[node._type] : null
  if (e) {
    for (const [field, allowed] of Object.entries(e)) {
      const v = node[field]
      if (typeof v === 'string' && v && !allowed.includes(v)) {
        bad.push(`${node._type}.${field}="${v}"`)
      }
    }
  }
  for (const [k, v] of Object.entries(node)) {
    if (!k.startsWith('_')) countBadEnums(v, enums, bad)
  }
  return bad
}

function collectDefaults(fields, out, prefix = '') {
  for (const f of fields || []) {
    if (f?.initialValue !== undefined && typeof f.initialValue !== 'function') {
      out[prefix + f.name] = f.initialValue
    }
    if (Array.isArray(f?.fields)) collectDefaults(f.fields, out, `${prefix}${f.name}.`)
  }
}
function countMissingDefaults(node, defaults, seen = {n: 0}) {
  if (Array.isArray(node)) {
    node.forEach((v) => countMissingDefaults(v, defaults, seen))
    return seen.n
  }
  if (!node || typeof node !== 'object') return seen.n
  const d = node._type ? defaults[node._type] : null
  if (d) {
    for (const k of Object.keys(d)) {
      if (!k.includes('.') && node[k] === undefined) seen.n++
    }
  }
  for (const [k, v] of Object.entries(node)) {
    if (!k.startsWith('_')) countMissingDefaults(v, defaults, seen)
  }
  return seen.n
}

function main() {
  const env = readEnvBackup()

  // ── 20-env ──────────────────────────────────────────────────────────────
  add(
    '20-env',
    'env backup present with project id + preview URL',
    !!(env && env.SANITY_STUDIO_PROJECT_ID && env.SANITY_STUDIO_PREVIEW_URL),
    env
      ? `project=${env.SANITY_STUDIO_PROJECT_ID || '(missing)'} preview=${env.SANITY_STUDIO_PREVIEW_URL || '(missing)'}`
      : `no studio/.env.${slug}-backup`,
  )
  if (!env) return report()

  const expected = env.SANITY_STUDIO_PROJECT_ID
  const actual = client.config().projectId
  add(
    'guard',
    'active Sanity project matches the slug',
    expected === actual,
    `expected ${expected}, active ${actual}`,
  )
  if (expected !== actual) return report()

  const previewOrigin = (env.SANITY_STUDIO_PREVIEW_URL || '').replace(/\/+$/, '')

  // ── deploy.yml wiring ───────────────────────────────────────────────────
  const wf = path.join(REPO, '.github/workflows/deploy.yml')
  const yml = fs.existsSync(wf) ? fs.readFileSync(wf, 'utf8') : ''
  add(
    'deploy.yml',
    'client is in the fan-out matrix',
    new RegExp(`slug:\\s*${slug}\\b`).test(yml),
    'matrix entry',
  )
  add(
    'deploy.yml',
    'client is in the workflow_dispatch case block',
    new RegExp(`${slug}\\)\\s*PID=`).test(yml),
    'single-client dispatch mapping',
  )

  // ── 70-gh-env ───────────────────────────────────────────────────────────
  let secrets = []
  try {
    const out = execSync(
      `gh api repos/{owner}/{repo}/environments/client-${slug}/secrets --jq '.secrets[].name'`,
      {cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']},
    )
    secrets = out.split('\n').filter(Boolean)
  } catch {
    secrets = []
  }
  const need = ['CF_API_TOKEN', 'CF_ACCOUNT_ID', 'SANITY_API_READ_TOKEN', 'SANITY_PREVIEW_SECRET']
  const missing = need.filter((n) => !secrets.includes(n))
  add(
    '70-gh-env',
    'GitHub environment has all four deploy secrets',
    secrets.length > 0 && missing.length === 0,
    secrets.length ? (missing.length ? `missing: ${missing.join(', ')}` : 'all present') : 'environment not found (or gh not authenticated)',
  )

  return Promise.all([
    client.fetch(`*[!(_type match "sanity.*") && !(_type match "system.*")]`),
    import('../../schemaTypes/index.js'),
  ]).then(([docs, mod]) => {
    const site = docs.find((d) => d._id === 'siteSettings') || {}
    const seo = docs.find((d) => d._id === 'seoSettings') || {}

    // ── 55-post-seed-clean ────────────────────────────────────────────────
    const blob = JSON.stringify(docs)
    const hits = DONOR_MARKERS.filter((m) => blob.toLowerCase().includes(m.toLowerCase()))
    add(
      '55-post-seed-clean',
      'no donor content left in the dataset',
      hits.length === 0,
      hits.length ? `found: ${hits.join(', ')}` : 'clean',
    )

    // ── 75-siteurl ────────────────────────────────────────────────────────
    const siteUrl = (seo.siteUrl || '').replace(/\/+$/, '')
    add(
      '75-siteurl',
      'seoSettings.siteUrl is set (drives the canonical tag)',
      !!siteUrl && !/cnw-photo-demo/.test(siteUrl),
      siteUrl || '(unset — every page ships with NO canonical)',
    )
    add(
      '75-siteurl',
      'siteUrl matches the env-backup preview origin',
      !siteUrl || !previewOrigin || siteUrl === previewOrigin,
      `siteUrl=${siteUrl || '-'} preview=${previewOrigin || '-'}`,
      false,
    )

    // ── 60-overlay ────────────────────────────────────────────────────────
    // Typography is set EITHER by a preset fontTheme or by picking the two
    // sides individually — both are valid, so accept either. (An earlier
    // version demanded both and flagged every established client, which is
    // exactly the false-positive that trains people to ignore a gate.)
    const hasFonts = !!(site.fontTheme || (site.headingFont && site.bodyFont))
    add(
      '60-overlay',
      'palette and typography chosen',
      !!site.defaultPalette && hasFonts,
      `palette=${site.defaultPalette || '-'} theme=${site.fontTheme || '-'} heading=${site.headingFont || '-'} body=${site.bodyFont || '-'}`,
    )

    // ── 78-apply-schema-defaults ──────────────────────────────────────────
    const types = (mod.default && mod.default.schemaTypes) || mod.schemaTypes || []
    const defaults = {}
    const enums = {}
    for (const t of types) {
      if (!t?.name || !Array.isArray(t.fields)) continue
      const d = {}
      collectDefaults(t.fields, d)
      if (Object.keys(d).length) defaults[t.name] = d
      const e = {}
      collectEnums(t.fields, e)
      if (Object.keys(e).length) enums[t.name] = e
    }
    const missingDefaults = countMissingDefaults(docs, defaults)
    add(
      '78-defaults',
      'no section is missing a field that has a schema default',
      missingDefaults === 0,
      missingDefaults ? `${missingDefaults} blank control(s) in Studio` : 'all filled',
    )

    // ── the Studio the client will actually use ───────────────────────────
    // <site>/studio is produced by the site build, so this also proves the
    // deploy landed. The hosted <slug>.sanity.studio is legacy and no longer
    // created — see "Where the Studio lives" in the runbook.
    let studioCode = 0
    try {
      studioCode = Number(
        execSync(
          `curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "${previewOrigin}/studio/"`,
          {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']},
        ).trim(),
      )
    } catch {
      studioCode = 0
    }
    add(
      'studio',
      'embedded Studio reachable at <site>/studio',
      [200, 301, 302, 307, 308].includes(studioCode),
      `${previewOrigin}/studio/ returned ${studioCode || 'no response'}`,
    )

    // ── enum integrity ────────────────────────────────────────────────────
    const badEnums = countBadEnums(docs, enums)
    add(
      'schema',
      'no field holds a value outside its schema options',
      badEnums.length === 0,
      badEnums.length ? [...new Set(badEnums)].slice(0, 6).join(', ') : 'all valid',
    )

    // ── content readiness ─────────────────────────────────────────────────
    add(
      'content',
      'Web3Forms key set (contact form delivers)',
      !!site.web3formsKey,
      site.web3formsKey ? 'set' : 'unset — submissions go nowhere',
      false,
    )
    add('content', 'business city set (LocalBusiness schema)', !!seo.businessCity, seo.businessCity || 'unset', false)

    return report()
  })
}

function report() {
  if (JSON_OUT) {
    console.log(JSON.stringify({slug, results}, null, 2))
  } else {
    console.log(`\n[signoff] ${slug}\n`)
    for (const r of results) {
      const mark = r.ok ? '✓' : r.hard ? '✗' : '~'
      console.log(`  ${mark} ${r.step.padEnd(20)} ${r.name}`)
      if (!r.ok) console.log(`      ${r.detail}`)
    }
    const fails = results.filter((r) => !r.ok && r.hard)
    const warns = results.filter((r) => !r.ok && !r.hard)
    console.log(
      `\n  ${results.filter((r) => r.ok).length} passed, ${fails.length} failed, ${warns.length} warning(s)`,
    )
    if (fails.length) {
      console.log('\n[signoff] NOT READY — resolve the ✗ items above.')
    } else {
      console.log('\n[signoff] READY (page fidelity is a separate gate: 68-verify-pages.js)')
    }
  }
  if (results.some((r) => !r.ok && r.hard)) process.exit(1)
}

main().catch((e) => {
  console.error('[signoff] FAILED:', e.message || e)
  process.exit(1)
})
