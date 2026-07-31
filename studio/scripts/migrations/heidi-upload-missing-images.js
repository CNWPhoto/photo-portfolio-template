// Upload the images Heidi's pages use that the scrape never captured.
//
// The scraper discovered images from sitemap.xml + the portfolio pages, so
// per-section artwork (parallax banners, product shots, charity logos, her
// PPA/accreditation badges) was missed. Downloads each at Squarespace's
// original resolution (?format=2500w) so quality survives; Sanity's pipeline
// handles the responsive resizing from there.
//
// Idempotent: Sanity dedupes by content hash, so re-running returns the same
// asset ids rather than creating copies.
//
// Run:
//   cd studio && npx dotenv -e .env.heidi-adler-photography-backup -- \
//     npx sanity exec scripts/migrations/heidi-upload-missing-images.js \
//     --with-user-token -- --slug=heidi-adler-photography --apply

import {getCliClient} from 'sanity/cli'
import fs from 'node:fs'
import path from 'node:path'

const client = getCliClient({apiVersion: '2024-01-01'})
const APPLY = process.argv.includes('--apply')
const slug =
  (process.argv.find((a) => a.startsWith('--slug=')) || '').split('=')[1] || ''
const LIST =
  (process.argv.find((a) => a.startsWith('--list=')) || '').split('=')[1] || ''

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

async function run() {
  assertProject()
  const rows = JSON.parse(fs.readFileSync(LIST, 'utf8'))
  console.log(
    `${client.config().projectId} — ${APPLY ? 'APPLYING' : 'DRY RUN'} — ${rows.length} image(s)\n`,
  )

  const out = {}
  for (const r of rows) {
    // ?format=2500w = Squarespace's largest derivative. PNGs (logos/badges)
    // are fetched untouched so transparency survives.
    const url = /\.png$/i.test(r.name) ? r.url : `${r.url}?format=2500w`
    if (!APPLY) {
      console.log(`  would upload  ${r.name}`)
      continue
    }
    const res = await fetch(url, {headers: {'User-Agent': 'Mozilla/5.0'}})
    if (!res.ok) {
      console.log(`  FAILED ${res.status}  ${r.name}`)
      continue
    }
    const buf = Buffer.from(await res.arrayBuffer())
    const asset = await client.assets.upload('image', buf, {
      filename: r.name.replace(/\+/g, ' '),
    })
    out[r.name] = asset._id
    console.log(
      `  ✓ ${asset.metadata?.dimensions?.width}x${asset.metadata?.dimensions?.height}  ` +
        `${Math.round(buf.length / 1024)}kb  ${r.name.slice(0, 46)}`,
    )
    console.log(`      ${asset._id}`)
  }

  if (APPLY) {
    const p = LIST.replace(/\.json$/, '-ids.json')
    fs.writeFileSync(p, JSON.stringify(out, null, 1))
    console.log(`\n  ids written to ${p}`)
  }
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
