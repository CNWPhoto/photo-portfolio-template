// Repair meta descriptions on Heidi Adler's pages.
//
// An earlier rebuild wrote `seo.metaDescription`, but the seo object defines
// `seoDescription` (studio/schemaTypes/seo.js). Sanity happily stores unknown
// fields, so nothing errored — the descriptions simply never rendered. Found by
// 68-verify-pages.js, which is the entire reason that script exists.
//
// Removes the dead field everywhere and fills seoDescription on the three
// documents that lack it.
//
// Run:
//   cd studio && npx dotenv -e .env.heidi-adler-photography-backup -- \
//     npx sanity exec scripts/migrations/heidi-fix-seo-description-field.js \
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

const FILL = {
  pageAbout:
    'Meet Heidi Adler — an educator turned award-winning pet photographer based in Sonoma County Wine Country, creating artwork of dogs and the people who love them.',
  portfolio:
    'Dog and pet portraits photographed in Sonoma, Napa, Marin and the North Bay by Heidi Adler Photography.',
  homepagePage:
    'Custom pet portraits in Sonoma, Napa, Marin and the North Bay. Award-winning dog photography by Heidi Adler, creating artwork for pets and the people who love them.',
}

async function run() {
  assertProject()
  console.log(`${client.config().projectId} — ${APPLY ? 'APPLYING' : 'DRY RUN'}\n`)

  const docs = await client.fetch(
    `*[_type in ["page","portfolio","homepagePage"] && !(_id in path("drafts.**"))]
       {_id, "bad": seo.metaDescription, "good": seo.seoDescription}`,
  )

  for (const d of docs) {
    const actions = []
    if (d.bad) actions.push('unset dead seo.metaDescription')
    const fill = !d.good && FILL[d._id]
    if (fill) actions.push('set seo.seoDescription')
    if (!actions.length) continue
    console.log(`  ${d._id.padEnd(32)} ${actions.join(' + ')}`)
    if (!APPLY) continue

    for (const id of [d._id, `drafts.${d._id}`]) {
      const exists = await client.getDocument(id)
      if (!exists) continue
      let p = client.patch(id)
      if (d.bad) p = p.unset(['seo.metaDescription'])
      if (fill) p = p.set({'seo.seoDescription': fill})
      await p.commit()
    }
  }

  if (!APPLY) console.log('\n  DRY RUN — nothing written.')
  else console.log('\n  ✓ seo descriptions repaired')
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
