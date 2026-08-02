// Repair three fields holding values outside their schema options, found by
// the new enum check in 79-signoff.js.
//
//   heroSection.textPosition        'center' -> 'center-center'
//       Mine. Valid values are the nine-point grid; 'center' matched no
//       [data-text-position] rule, so hero text positioning silently fell back.
//   fullBleedImageSection.textContainer 'inline-overlay' -> 'overlay-card'
//       Donor-seed legacy. The component does `textContainer || 'default'` and
//       only special-cases 'image-only', so it already behaved as overlay-card;
//       this just makes the stored value match, and the Studio dropdown show.
//   siteSettings.fontTheme          'default' -> 'classic-editorial'
//       fontHead.js does FONT_THEMES[x] ?? FONT_THEMES['classic-editorial'],
//       so this is the value it already resolved to. Zero visual change, and
//       moot for Heidi anyway since she has explicit heading/body font picks.
//
// Run:
//   cd studio && npx dotenv -e .env.<slug>-backup -- \
//     npx sanity exec scripts/migrations/heidi-fix-enum-values.js \
//     --with-user-token -- --slug=<slug> --apply

import {getCliClient} from 'sanity/cli'
import fs from 'node:fs'
import path from 'node:path'

const client = getCliClient({apiVersion: '2024-01-01'})
const APPLY = process.argv.includes('--apply')
const slug = (process.argv.find((a) => a.startsWith('--slug=')) || '').split('=')[1] || ''

function assertProject() {
  if (!slug) throw new Error('Missing --slug=<slug>')
  const p = path.resolve(process.cwd(), `.env.${slug}-backup`)
  const m = fs.readFileSync(p, 'utf8').match(/^SANITY_STUDIO_PROJECT_ID=(.*)$/m)
  const expected = m && m[1].trim(), actual = client.config().projectId
  if (expected !== actual) {
    throw new Error(`Refusing to write: --slug=${slug} expects ${expected}, active is ${actual}`)
  }
}

const FIXES = [
  ['heroSection', 'textPosition', 'center', 'center-center'],
  ['fullBleedImageSection', 'textContainer', 'inline-overlay', 'overlay-card'],
  ['siteSettings', 'fontTheme', 'default', 'classic-editorial'],
]

function walk(node, stats) {
  if (Array.isArray(node)) {
    let changed = false
    const out = node.map((v) => { const [nv, c] = walk(v, stats); changed = changed || c; return nv })
    return [changed ? out : node, changed]
  }
  if (!node || typeof node !== 'object') return [node, false]
  let out = node, changed = false
  for (const [type, field, from, to] of FIXES) {
    if (node._type === type && node[field] === from) {
      if (out === node) out = {...node}
      out[field] = to
      changed = true
      stats.push(`${type}.${field}: ${from} -> ${to}`)
    }
  }
  for (const [k, v] of Object.entries(out)) {
    if (k.startsWith('_')) continue
    const [nv, c] = walk(v, stats)
    if (c) { if (out === node) out = {...node}; out[k] = nv; changed = true }
  }
  return [out, changed]
}

async function run() {
  assertProject()
  console.log(`${client.config().projectId} — ${APPLY ? 'APPLYING' : 'DRY RUN'}\n`)
  const docs = await client.fetch(`*[!(_type match "sanity.*") && !(_type match "system.*")]`)
  const writes = []
  for (const doc of docs) {
    const stats = []
    const [next, changed] = walk(doc, stats)
    if (!changed) continue
    console.log(`  ${doc._id.padEnd(34)} ${stats.length} fix(es)`)
    for (const s of [...new Set(stats)]) console.log(`      ${s}`)
    writes.push(next)
  }
  if (!writes.length) return console.log('  nothing to fix')
  if (!APPLY) return console.log('\n  DRY RUN — nothing written.')
  for (const d of writes) await client.createOrReplace(d)
  console.log(`\n  ✓ ${writes.length} document(s) repaired`)
}
run().catch((e) => { console.error(e.message); process.exit(1) })
