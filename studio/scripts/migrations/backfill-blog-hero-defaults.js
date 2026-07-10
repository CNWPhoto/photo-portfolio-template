// backfill-blog-hero-defaults.js — one-time, before removing the blog hero
// render-time fallback.
//
// blog.astro used `heroHeading || 'The Journal'` / `heroSubtext || 'Notes from
// behind the lens'`, so any blogPage that never set those fields showed the
// default — and an editor who cleared them got the default right back. We're
// removing that render fallback (defaults now live as schema initialValue) so a
// cleared field yields an empty hero. To keep existing live blogs from going
// unexpectedly empty on deploy, backfill the current default as a REAL,
// clearable value onto blogs that are still missing it.
//
// Run EXCLUDING pets-in-focus (Michelle deliberately wants hers empty):
//   npm run migrate-all -- --script=scripts/migrations/backfill-blog-hero-defaults.js \
//     --only=blackbird-photography,coola-creative,everlight-education,family-demo,heatherjl-photography,karen-conrad-photography,kelly-mac-studios,lavon-photography,wedding-demo --include-demo            # DRY
//   ...same... --apply                                                                                   # WRITE
//
// Idempotent: setIfMissing means a second pass finds nothing to change.

import 'dotenv/config'
import {getCliClient} from 'sanity/cli'

const apply = process.argv.includes('--apply')
const slug = (process.argv.find((a) => a.startsWith('--slug=')) || '').split('=')[1] || '(local)'

let client = getCliClient()
if (process.env.SANITY_WRITE_TOKEN) client = client.withConfig({token: process.env.SANITY_WRITE_TOKEN})

const HERO_HEADING = 'The Journal'
const HERO_SUBTEXT = 'Notes from behind the lens'

async function main() {
  const {projectId, dataset} = client.config()
  const docs = await client.fetch(
    `*[_id == "blogPage" && (!defined(heroHeading) || !defined(heroSubtext))]{ _id, heroHeading, heroSubtext }`,
  )
  let migrated = 0
  for (const doc of docs) {
    const set = {}
    if (!doc.heroHeading) set.heroHeading = HERO_HEADING
    if (!doc.heroSubtext) set.heroSubtext = HERO_SUBTEXT
    console.log(`  ${apply ? '~' : '·'} ${doc._id}: setIfMissing ${JSON.stringify(set)}`)
    if (apply && Object.keys(set).length) {
      await client.patch(doc._id).setIfMissing(set).commit()
      migrated++
    }
  }
  const verb = apply ? `migrated ${migrated}` : `would migrate ${docs.length}`
  console.log(`[migrate] ${slug} ${projectId}/${dataset}: ${verb}`)
}

main().catch((e) => {
  console.error('[migrate] FAILED:', e)
  process.exit(1)
})
