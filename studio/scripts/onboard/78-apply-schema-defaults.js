// 78-apply-schema-defaults.js — fill in the settings a section WOULD have had
// if an editor had added it in Studio.
//
// THE PROBLEM
// `initialValue` is a Studio-client concept. Sanity applies it when an editor
// adds an array item; it is NOT applied server-side. Every section created by
// a script — the onboarding overlay, any migration — therefore stores those
// fields as undefined. The site still renders (components have their own
// fallbacks), but in Studio the controls come up BLANK: Background Tone shows
// no radio selected, Image Layout shows nothing, and an editor can't tell what
// the section is currently doing without changing it to find out.
//
// THE FIX
// Harvest every `initialValue` from the REAL schema objects and fill any field
// that's missing one. Because the defaults are read from the schema itself,
// they can never drift from it — add an initialValue to a field and this picks
// it up on the next run.
//
// Filling a field with its own initialValue is semantically a no-op: it stores
// the value the UI would have stored. Where a component's JS fallback differs
// from the schema's initialValue, that's a genuine inconsistency worth seeing —
// the dry run prints every change so you can check before writing.
//
// Read-only by default. Run at the end of onboarding, and after any migration
// that creates sections.
//
// Run:
//   cd studio && npx dotenv -e .env.<slug>-backup -- \
//     npx sanity exec scripts/onboard/78-apply-schema-defaults.js \
//     --with-user-token -- --slug=<slug> [--apply]
//
// Flags:
//   --slug=<slug>   (required) guards the target project
//   --apply         write (default is a dry run)
//   --verbose       list every individual field filled

// Section icons are JSX and only need to LOAD here, never render.
globalThis.React = {createElement: () => null, Fragment: Symbol('fragment')}

import {getCliClient} from 'sanity/cli'
import fs from 'node:fs'
import path from 'node:path'

const client = getCliClient({apiVersion: '2024-01-01'})
const argv = process.argv
const APPLY = argv.includes('--apply')
const VERBOSE = argv.includes('--verbose')
const slug = (argv.find((a) => a.startsWith('--slug=')) || '').split('=')[1] || ''

function assertProject() {
  if (!slug) throw new Error('Missing --slug=<slug>')
  const envPath = path.resolve(process.cwd(), `.env.${slug}-backup`)
  const m = fs.readFileSync(envPath, 'utf8').match(/^SANITY_STUDIO_PROJECT_ID=(.*)$/m)
  const expected = m && m[1].trim()
  const actual = client.config().projectId
  if (!expected) throw new Error(`No SANITY_STUDIO_PROJECT_ID in ${envPath}`)
  if (expected !== actual) {
    throw new Error(
      `Refusing to write: --slug=${slug} expects project ${expected}, ` +
        `but the active client is ${actual}. Check studio/.env.`,
    )
  }
}

// Collect initialValues per type. Function initialValues are skipped — they can
// depend on document context we don't have here, so guessing would be worse
// than leaving the field unset.
function collectDefaults(fields, out, prefix = '') {
  for (const f of fields || []) {
    if (f?.initialValue !== undefined && typeof f.initialValue !== 'function') {
      out[prefix + f.name] = f.initialValue
    }
    if (Array.isArray(f?.fields)) collectDefaults(f.fields, out, `${prefix}${f.name}.`)
  }
}

// Fill missing keys on any object whose _type has known defaults. Recurses so
// nested objects (array items, sub-objects) are covered too.
function fill(node, defaults, stats, trail = '') {
  if (Array.isArray(node)) {
    let changed = false
    const next = node.map((v, i) => {
      const [nv, c] = fill(v, defaults, stats, `${trail}[${i}]`)
      changed = changed || c
      return nv
    })
    return [changed ? next : node, changed]
  }
  if (!node || typeof node !== 'object') return [node, false]

  let out = node
  let changed = false
  const typeDefaults = node._type ? defaults[node._type] : null
  if (typeDefaults) {
    for (const [key, value] of Object.entries(typeDefaults)) {
      if (key.includes('.')) continue // nested handled by recursion
      if (out[key] === undefined) {
        if (out === node) out = {...node}
        out[key] = value
        changed = true
        stats.filled++
        stats.byType[node._type] = (stats.byType[node._type] || 0) + 1
        if (VERBOSE) console.log(`      ${trail || node._type}.${key} = ${JSON.stringify(value)}`)
      }
    }
  }
  for (const [k, v] of Object.entries(out)) {
    if (k.startsWith('_')) continue
    const [nv, c] = fill(v, defaults, stats, trail ? `${trail}.${k}` : `${node._type || ''}.${k}`)
    if (c) {
      if (out === node) out = {...node}
      out[k] = nv
      changed = true
    }
  }
  return [out, changed]
}

function main() {
  assertProject()
  console.log(`${client.config().projectId} — ${APPLY ? 'APPLYING' : 'DRY RUN (pass --apply)'}\n`)

  return import('../../schemaTypes/index.js')
    .then((mod) => {
      const types = (mod.default && mod.default.schemaTypes) || mod.schemaTypes || []
      const defaults = {}
      for (const t of types) {
        if (!t?.name || !Array.isArray(t.fields)) continue
        const d = {}
        collectDefaults(t.fields, d)
        if (Object.keys(d).length) defaults[t.name] = d
      }
      console.log(`  schema types carrying defaults: ${Object.keys(defaults).length}\n`)
      return defaults
    })
    .then((defaults) =>
      client
        .fetch(`*[!(_type match "sanity.*") && !(_type match "system.*")]`)
        .then((docs) => ({defaults, docs})),
    )
    .then(({defaults, docs}) => {
      const stats = {filled: 0, byType: {}}
      const writes = []
      for (const doc of docs) {
        const before = stats.filled
        const [next, changed] = fill(doc, defaults, stats)
        if (changed) {
          console.log(`  ${doc._id.padEnd(38)} ${stats.filled - before} field(s)`)
          writes.push(next)
        }
      }
      console.log(`\n  ${stats.filled} field(s) across ${writes.length} document(s)`)
      const byType = Object.entries(stats.byType).sort((a, b) => b[1] - a[1])
      for (const [t, n] of byType.slice(0, 12)) console.log(`    ${t.padEnd(28)} ${n}`)

      if (!APPLY) {
        console.log('\n  DRY RUN — nothing written. Re-run with --apply.')
        return
      }
      if (!writes.length) return
      return writes
        .reduce(
          (p, doc) => p.then(() => client.createOrReplace(doc)),
          Promise.resolve(),
        )
        .then(() => console.log('\n  ✓ defaults applied'))
    })
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
