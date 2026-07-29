// remove-duplicate-singletons.js — delete stray copies of a singleton document.
//
// Singletons are identified by a fixed _id ("homepagePage", "portfolio",
// "blogPage", …). A duplicate — same _type, different _id — is invisible in the
// Studio, because the structure links each singleton by its fixed id. But the
// page queries used to fetch *[_type == "X"][0], which returns whichever
// document sorts first by _id, so a stray could take over the route.
//
// That is exactly what happened to one client: a "Headshots - NICHE" copy of
// homepagePage (created during onboarding) sorted before "homepagePage" and so
// WAS her live homepage, while the Studio's Pages → Homepage opened the real
// one. Her homepage edits never reached her site.
//
// The queries now pin _id, so a stray can no longer hijack a route — this
// removes the strays themselves so nobody can stumble into editing one, and so
// publishing a draft-only stray can't recreate the situation.
//
//   cd studio
//   npx dotenv -e .env.<slug>-backup -- \
//     npx sanity exec scripts/migrations/remove-duplicate-singletons.js --with-user-token -- [--apply]
//
// Refuses to delete anything still referenced by another document.

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-01-01'})
const APPLY = process.argv.includes('--apply')

// Types whose _id must equal the type name. Additional galleries etc. are
// arrays on the singleton, not separate docs, so this list is the whole set.
const SINGLETONS = [
  'homepagePage',
  'portfolio',
  'blogPage',
  'notFoundPage',
  'termsAndConditionsPage',
  'privacyPolicyPage',
  'siteSettings',
  'navSettings',
  'footerSettings',
  'socialSettings',
  'codeSettings',
  'seoSettings',
]

const baseId = (id) => id.replace(/^drafts\./, '')

const run = async () => {
  console.log(`${client.config().projectId} — ${APPLY ? 'APPLYING' : 'DRY RUN (pass --apply to write)'}\n`)

  let found = 0
  let deleted = 0
  let blocked = 0

  for (const type of SINGLETONS) {
    const docs = await client.fetch(`*[_type==$type]{_id, _updatedAt} | order(_id asc)`, {type})
    const strays = docs.filter((d) => baseId(d._id) !== type)
    if (!strays.length) continue

    console.log(`  ${type}: ${docs.length} document(s), ${strays.length} stray`)
    for (const s of strays) {
      const refs = await client.fetch(`*[references($id)]{_id}`, {id: baseId(s._id)})
      if (refs.length) {
        console.log(`    ⚠ ${s._id} — referenced by ${refs.length} doc(s); NOT deleting`)
        blocked++
        continue
      }
      found++
      console.log(`    • ${s._id}  (updated ${s._updatedAt?.slice(0, 10)})`)
      if (APPLY) {
        await client.delete(s._id).catch(async (e) => {
          console.log(`      failed: ${e.message.slice(0, 120)}`)
          throw e
        })
        deleted++
      }
    }
  }

  if (!found && !blocked) console.log('  ✓ no stray singletons')
  else if (!APPLY) console.log(`\n  ${found} stray(s) would be deleted.`)

  if (APPLY) {
    console.log(`\nDeleted ${deleted}.${blocked ? ` ${blocked} left in place (referenced).` : ''}`)
    for (const type of SINGLETONS) {
      const n = await client.fetch(`count(*[_type==$type && !(_id in [$type, "drafts." + $type])])`, {type})
      if (n) console.log(`  ⚠ ${type}: ${n} stray still present`)
    }
  }
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
