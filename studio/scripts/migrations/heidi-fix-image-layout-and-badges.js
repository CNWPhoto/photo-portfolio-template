// Two repairs on Heidi Adler's dataset.
//
// 1. INVALID imageLayout VALUES. My page-rebuild migrations wrote 'left' and
//    'right', but splitSection.imageLayout's options are 'image-left',
//    'image-right', 'image-left-full-bleed', 'image-right-full-bleed'. Sanity
//    stores whatever string it's given, and SplitSection.astro builds its class
//    as `isplit--${imageLayout}` — so those sections rendered as
//    `.isplit--left`, which matches NO variant rule. They fell through to the
//    bare `.isplit` base (padding: 0 !important, 1fr 1fr grid), losing their
//    padding, their max-width, and their image sizing entirely.
//
//    A schema `options.list` does not validate on write — only the Studio
//    dropdown constrains it. Scripted writes bypass that completely.
//
// 2. REMOVE FOOTER BADGES. Connor's call: they read poorly down there and are
//    hard to make out. The footerSettings.badges field stays available for a
//    better treatment later; this just clears her data.
//
// Run:
//   cd studio && npx dotenv -e .env.heidi-adler-photography-backup -- \
//     npx sanity exec scripts/migrations/heidi-fix-image-layout-and-badges.js \
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

const VALID = new Set([
  'image-left',
  'image-right',
  'image-left-full-bleed',
  'image-right-full-bleed',
])
const FIX = {left: 'image-left', right: 'image-right'}

async function save(id, patchFn) {
  await patchFn(client.patch(id)).commit()
  const d = await client.getDocument(`drafts.${id}`)
  if (d) await patchFn(client.patch(`drafts.${id}`)).commit()
}

async function run() {
  assertProject()
  console.log(`${client.config().projectId} — ${APPLY ? 'APPLYING' : 'DRY RUN'}\n`)

  // ── 1. imageLayout ──────────────────────────────────────────────────────
  const docs = await client.fetch(
    `*[_type in ["page","homepagePage"] && !(_id in path("drafts.**")) &&
       count(sections[_type=="splitSection"]) > 0]{_id, sections}`,
  )
  let fixed = 0
  for (const d of docs) {
    let changed = false
    const sections = d.sections.map((s) => {
      if (s._type !== 'splitSection') return s
      const cur = s.imageLayout
      if (VALID.has(cur)) return s
      const next = FIX[cur] || 'image-right'
      console.log(`  ${d._id.padEnd(30)} ${s._key.padEnd(16)} ${String(cur)} -> ${next}`)
      changed = true
      fixed++
      return {...s, imageLayout: next}
    })
    if (changed && APPLY) await save(d._id, (p) => p.set({sections}))
  }
  console.log(`\n  ${fixed} splitSection(s) had an invalid imageLayout`)

  // ── 2. footer badges ────────────────────────────────────────────────────
  const foot = await client.getDocument('footerSettings')
  const n = (foot?.badges || []).length
  console.log(`  footerSettings.badges: ${n} -> 0 (removed)`)
  if (APPLY && n) await save('footerSettings', (p) => p.unset(['badges']))

  if (!APPLY) console.log('\n  DRY RUN — nothing written.')
  else console.log('\n  ✓ done')
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
