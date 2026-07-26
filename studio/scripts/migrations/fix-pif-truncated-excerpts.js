// fix-pif-truncated-excerpts.js — publish the blog excerpts that were already
// rewritten by hand but never went live.
//
// The Squarespace importer truncated `excerpt` at the first curly apostrophe,
// so nine posts published fragments — two of them a single word ("Lucy",
// "Michigan"). `excerpt` is both the meta description Google shows AND the card
// text on the blog index, so "Lucy" was the entire search snippet for that post.
//
// Crucially: all nine were ALREADY fixed by hand two days after the import
// (drafts updated 2026-07-08 vs published 2026-07-06) — the corrections just
// never got published. So this copies the DRAFT's excerpt onto the published
// document rather than inventing new copy. The human-written versions are more
// specific than anything generated (they name the Lenawee Pet Collective, the
// five Wags to Wiskers stores, and so on).
//
// It deliberately copies only `excerpt`, and does NOT publish the drafts: two
// of them (lucys-luxury-pet-spa, wags-to-wiskers) also carry unfinished `body`
// edits, which are the author's to publish when ready.
//
//   cd studio
//   npx dotenv -e .env.pets-in-focus-backup -- \
//     npx sanity exec scripts/migrations/fix-pif-truncated-excerpts.js --with-user-token -- [--apply]

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-01-01'})
const APPLY = process.argv.includes('--apply')

// Anything shorter than this on a published post is a truncation artifact
// rather than a deliberately terse excerpt.
const TRUNCATED_UNDER = 100

const run = async () => {
  if (client.config().projectId !== 'tryjma1z') {
    throw new Error(`Refusing to run against ${client.config().projectId} — this is PIF-specific.`)
  }
  console.log(APPLY ? 'APPLYING\n' : 'DRY RUN (pass --apply to write)\n')

  const posts = await client.fetch(
    `*[_type=="blogPost" && !(_id in path("drafts.**")) && defined(excerpt) && length(excerpt) < $n]{
      _id, "slug": slug.current, excerpt
    } | order(slug asc)`,
    {n: TRUNCATED_UNDER},
  )

  let changed = 0
  let missing = 0
  for (const post of posts) {
    const draft = await client.fetch(`*[_id==$id][0].excerpt`, {id: `drafts.${post._id}`})

    // Accept a draft that is longer than the published fragment AND reads as a
    // finished sentence. Length alone rejected a perfectly good 92-character
    // excerpt; the truncation always cut mid-clause, so terminal punctuation is
    // the reliable signal that a human finished the thought.
    const looksComplete =
      typeof draft === 'string' &&
      draft.length > post.excerpt.length &&
      /[.!?]["')\]]?$/.test(draft.trim())

    if (!looksComplete) {
      console.log(`  ⚠ ${post.slug}`)
      console.log(`      published: ${JSON.stringify(post.excerpt)}`)
      console.log(`      no usable draft excerpt — needs writing by hand`)
      missing++
      continue
    }

    console.log(`  • ${post.slug}`)
    console.log(`      before (${post.excerpt.length}): ${JSON.stringify(post.excerpt)}`)
    console.log(`      after  (${draft.length}): ${JSON.stringify(draft)}`)
    if (APPLY) {
      await client.patch(post._id).set({excerpt: draft}).commit({visibility: 'sync'})
      changed++
    }
  }

  console.log(
    APPLY
      ? `\nPatched ${changed} post(s).${missing ? ` ${missing} still need copy.` : ''}`
      : `\n${posts.length} truncated post(s); ${posts.length - missing} recoverable from drafts.`,
  )
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
