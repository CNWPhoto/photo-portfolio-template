// fix-doubled-seo-titles.js — remove business names that appear twice in the
// rendered <title>.
//
// Layout.astro composes `${pageTitle} | ${siteName}`, so the site name is
// appended automatically. The old help-desk SEO guide told clients to type it
// into the SEO Title field as well, which produced titles like
// "Karen Conrad Photography | Karen Conrad Photography" — live in Google.
//
// Each replacement below was written against that site's own copy (its H1,
// meta description and nav), not invented. Run per client:
//
//   cd studio
//   npx dotenv -e .env.<slug>-backup -- \
//     npx sanity exec scripts/migrations/fix-doubled-seo-titles.js --with-user-token -- [--apply]
//
// Defaults to a dry run; pass --apply to write. Idempotent — a doc already
// holding the target value is skipped.

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-01-01'})
const APPLY = process.argv.includes('--apply')

// projectId -> [{ id, to, why }]. `to: null` clears the field so the title
// falls back to the page title.
const FIXES = {
  // Karen Conrad — Colorado Front Range portraits (seniors, pets, family,
  // couples, kids, headshots) per her own About copy.
  hydwn002: [
    {
      id: 'homepagePage',
      to: 'Colorado Portrait Photographer',
      why: 'was exactly the site name, rendering it twice',
    },
  ],
  // Kelly Mac — pet, equine and pet-in-brand work in Rancho Cucamonga / SoCal
  // per her meta description.
  qva1dysl: [
    {
      id: 'homepagePage',
      to: 'Pet & Equine Photography | Rancho Cucamonga',
      why: 'was exactly the site name, rendering it twice',
    },
  ],
  // Blackbird — both pages carried the same title, which also duplicated the
  // site name. The headshots page additionally needed its own.
  '6nc24jar': [
    {
      id: 'homepagePage',
      to: 'New Hampshire Portrait Photographer',
      why: 'brand prefix duplicated the appended site name',
    },
    {
      // ⚠ This is a STRAY SECOND homepagePage document (titled
      // "Headshots - NICHE", a near-identical clone of the real one). It is
      // what the live homepage actually renders: index.astro queries
      // *[_type == "homepagePage"][0], which orders by _id, and "59dc..."
      // sorts before "homepagePage". So it must carry the HOMEPAGE title, not
      // a headshots one, until the duplicate is deleted — at which point this
      // entry should be removed.
      id: '59dc4e7b-802d-4fe3-b157-8ee2bbf6d59e',
      to: 'New Hampshire Portrait Photographer',
      why: 'stray duplicate homepagePage that currently wins the / route',
    },
  ],
  // Pets in Focus — brand sat mid-title on two pages.
  tryjma1z: [
    {
      id: '1e407c4b-8adf-4ef2-8c72-b7cd30188a74',
      to: 'Dog Photography FAQs | Tecumseh, MI',
      why: 'brand appeared mid-title and again appended',
    },
    {
      id: 'pageContact',
      to: 'Contact | Tecumseh, MI Dog Photographer',
      why: 'brand appeared mid-title and again appended',
    },
  ],
  // Coola — the blog title was a sentence-length description, not a title.
  tl3zj8iz: [
    {
      id: 'blogPage',
      to: 'Product Photography Journal',
      why: 'was a description sentence containing the brand',
    },
  ],
}

const run = async () => {
  const projectId = client.config().projectId
  const fixes = FIXES[projectId]
  if (!fixes) {
    console.log(`No doubled titles recorded for project ${projectId} — nothing to do.`)
    return
  }

  const siteName = await client.fetch(`*[_id=="siteSettings"][0].siteName`)
  console.log(`${projectId} — siteName ${JSON.stringify(siteName)}`)
  console.log(APPLY ? 'APPLYING\n' : 'DRY RUN (pass --apply to write)\n')

  let changed = 0
  for (const {id, to, why} of fixes) {
    const current = await client.fetch(`*[_id==$id][0].seo.seoTitle`, {id})
    if (current === undefined || current === null) {
      console.log(`  ~ ${id}: no seoTitle set — skipping`)
      continue
    }
    // Deliberately does NOT `continue` when the published doc is already
    // correct: a stale draft still needs patching, and skipping here on a
    // re-run would leave it to revert the fix on the editor's next publish.
    if (current === to) {
      console.log(`  ✓ ${id}: published already correct`)
    }
    if (current !== to) {
      console.log(`  • ${id}  (${why})`)
      console.log(`      before: ${JSON.stringify(current)}`)
      console.log(`      after:  ${JSON.stringify(to)}`)
      console.log(`      renders: ${JSON.stringify(`${to ?? '<page title>'} | ${siteName}`)}`)
    }

    // Patch the draft too when one exists, otherwise the editor's next Publish
    // silently restores the old title. Note the public API only ever returns
    // published documents, so drafts are invisible to an unauthenticated
    // check — this must run through an authenticated client.
    const draftId = `drafts.${id}`
    const draft = await client.fetch(`*[_id==$id][0].seo.seoTitle`, {id: draftId})
    const hasDraft = draft !== undefined && draft !== null
    if (hasDraft) console.log(`      draft:  ${JSON.stringify(draft)} → same value`)

    if (APPLY) {
      const write = async (docId) => {
        const patch = client.patch(docId)
        await (to === null
          ? patch.unset(['seo.seoTitle'])
          : patch.set({'seo.seoTitle': to})
        ).commit({visibility: 'sync'})
      }
      await write(id)
      if (hasDraft) await write(draftId)
      changed++
    }
  }
  console.log(APPLY ? `\nPatched ${changed} document(s).` : `\n${fixes.length} candidate(s).`)
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
