// One-time migration: move homepagePage.hero into sections[0].
//
// Context: the homepage used to have a dedicated top-level `hero` field
// separate from the `sections` array. Schema and rendering unified so
// hero is just the first item in `sections`, matching every other page
// route. This script moves the existing hero data into position 0 of
// the sections array for any project still running the old shape.
//
// Usage (from studio/ after swapping .env to target dataset):
//   node scripts/migrate-hero-to-sections.js          # dry run, prints plan
//   node scripts/migrate-hero-to-sections.js --apply  # commits the change
//
// Safe to run multiple times: if the hero field is empty or already
// unset, nothing happens. Existing sections entries are preserved
// (hero is prepended, not replaced).

// Node scripts don't auto-load .env, so pull it in before instantiating
// the Sanity client (which reads SANITY_STUDIO_PROJECT_ID from env).
import 'dotenv/config'
import {getCliClient} from 'sanity/cli'

const apply = process.argv.includes('--apply')
// Editor/write token from env. Generate one in sanity.io/manage →
// <project> → API → Tokens → Add API token (Editor role). Pass via:
//   SANITY_WRITE_TOKEN=<token> node scripts/migrate-hero-to-sections.js --apply
// Falls back to CLI session creds if not set (read-only on most local
// installs, so --apply would fail).
const writeToken = process.env.SANITY_WRITE_TOKEN
const client = getCliClient().withConfig({
  apiVersion: '2024-01-01',
  ...(writeToken ? {token: writeToken, useCdn: false} : {}),
})

const homepage = await client.fetch(`*[_id == "homepagePage"][0]{
  _id, _rev, hero, "sectionsLen": count(sections)
}`)

if (!homepage) {
  console.log('No homepagePage document found — nothing to migrate.')
  process.exit(0)
}

if (!homepage.hero || Object.keys(homepage.hero).length === 0) {
  console.log('homepagePage.hero is empty or missing — nothing to migrate.')
  process.exit(0)
}

const existingSectionsLen = homepage.sectionsLen ?? 0
console.log(`Plan: prepend existing hero (keys: ${Object.keys(homepage.hero).join(', ')}) ` +
  `onto sections[] (currently ${existingSectionsLen} items) and unset the hero field.`)

if (!apply) {
  console.log('\nDry run — no changes made. Re-run with --apply to commit.')
  process.exit(0)
}

const heroSection = {
  ...homepage.hero,
  _key: homepage.hero._key || 'homeHero',
  _type: 'heroSection',
}

await client
  .patch('homepagePage')
  .insert('before', 'sections[0]', [heroSection])
  .unset(['hero'])
  .commit({autoGenerateArrayKeys: false})

console.log('✓ Migration committed. Verify in Studio.')
