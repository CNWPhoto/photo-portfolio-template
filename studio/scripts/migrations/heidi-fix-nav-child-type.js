// Repair Heidi Adler's dropdown sub-links so they're editable in Studio again.
//
// My nav consolidation wrote each sub-link as `_type: 'navLink'` — the PARENT
// link type — but navSettings.links[].children[] declares `navChildLink`.
// Studio can't render an editor for a type a list doesn't accept, so each
// sub-link showed as "Item of type navLink not valid for this list" and could
// only be moved or deleted.
//
// The site rendered them correctly the whole time (Nav.astro reads `children`
// without checking _type), which is exactly why this went unnoticed: the
// symptom was invisible outside the Studio.
//
// Sub-links also accept a narrower field set than parents — label, linkType,
// internalRef, url, openInNewTab. The `enabled` toggle I copied from the parent
// shape isn't declared on them, so it's dropped here too.
//
// Run:
//   cd studio && npx dotenv -e .env.heidi-adler-photography-backup -- \
//     npx sanity exec scripts/migrations/heidi-fix-nav-child-type.js \
//     --with-user-token -- --slug=heidi-adler-photography --apply

import {getCliClient} from 'sanity/cli'
import fs from 'node:fs'
import path from 'node:path'

const client = getCliClient({apiVersion: '2024-01-01'})
const APPLY = process.argv.includes('--apply')
const slug =
  (process.argv.find((a) => a.startsWith('--slug=')) || '').split('=')[1] || ''

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

// Exactly what childLinkFields declares — anything else is dropped.
const ALLOWED = ['label', 'linkType', 'internalRef', 'url', 'openInNewTab']

async function save(id, links) {
  await client.patch(id).set({links}).commit()
  const d = await client.getDocument(`drafts.${id}`)
  if (d) await client.patch(`drafts.${id}`).set({links}).commit()
}

async function run() {
  assertProject()
  console.log(`${client.config().projectId} — ${APPLY ? 'APPLYING' : 'DRY RUN'}\n`)

  const nav = await client.getDocument('navSettings')
  let fixedChildren = 0
  let droppedFields = 0

  const links = (nav.links || []).map((link) => {
    if (!Array.isArray(link.children) || !link.children.length) return link
    const children = link.children.map((c) => {
      const out = {_key: c._key, _type: 'navChildLink'}
      for (const f of ALLOWED) if (c[f] !== undefined) out[f] = c[f]
      const extra = Object.keys(c).filter(
        (k) => !ALLOWED.includes(k) && k !== '_key' && k !== '_type',
      )
      if (c._type !== 'navChildLink') fixedChildren++
      if (extra.length) {
        droppedFields += extra.length
        console.log(`    ${link.label} / ${c.label}: dropping ${extra.join(', ')}`)
      }
      return out
    })
    console.log(`  ${link.label}: ${children.length} sub-link(s) -> navChildLink`)
    return {...link, children}
  })

  console.log(`\n  ${fixedChildren} sub-link(s) had the wrong _type`)
  console.log(`  ${droppedFields} undeclared field(s) removed`)

  if (!APPLY) {
    console.log('\n  DRY RUN — nothing written.')
    return
  }
  await save('navSettings', links)
  console.log('\n  ✓ nav sub-links repaired')
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
