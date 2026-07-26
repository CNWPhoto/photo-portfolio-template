// remove-portfolio-categories.js — clear the data left behind after the
// portfolioCategory type was removed from the schema (2026-07).
//
// The feature was half-built: it created /portfolio/category/<slug>/ pages
// that nothing linked to, that carried noindex, and that read "No images in
// this category yet" on 5 of 11 sites (the pets seed created four categories
// and never tagged an image with any of them). Separate collections are
// handled by the Portfolio page's Additional Galleries, which render as tabs.
//
// The route, schema type and per-image field are gone in code; this clears the
// documents and the now-dangling references so nothing lingers as an unknown
// type in the Studio.
//
// Order matters: unset the image references FIRST, then delete the category
// documents. Deleting first would leave strong references pointing at missing
// docs, which Sanity flags as validation errors.
//
//   cd studio
//   npx dotenv -e .env.<slug>-backup -- \
//     npx sanity exec scripts/migrations/remove-portfolio-categories.js --with-user-token -- [--apply]

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-01-01'})
const APPLY = process.argv.includes('--apply')

const run = async () => {
  const projectId = client.config().projectId
  console.log(`${projectId} — ${APPLY ? 'APPLYING' : 'DRY RUN (pass --apply to write)'}\n`)

  // Both published and draft copies of the portfolio doc can hold the field.
  const portfolios = await client.fetch(
    `*[_type=="portfolio"]{
      _id,
      "tagged": count(images[count(categories) > 0]),
      images,
      additionalGalleries
    }`,
  )
  for (const p of portfolios) {
    if (!p.tagged) {
      console.log(`  ✓ ${p._id}: no tagged images`)
      continue
    }
    console.log(`  • ${p._id}: clearing categories on ${p.tagged} image(s)`)
    if (APPLY) {
      // unset(['images[].categories']) silently no-ops — Sanity's empty-filter
      // array syntax doesn't reach into each element for unset, so the
      // references survived and the delete below then failed on them. Rewrite
      // the array without the field instead.
      const strip = (arr) =>
        (arr ?? []).map(({categories, ...img}) => img)
      const patch = {images: strip(p.images)}
      if (p.additionalGalleries) {
        patch.additionalGalleries = p.additionalGalleries.map((g) => ({
          ...g,
          images: strip(g.images),
        }))
      }
      await client.patch(p._id).set(patch).commit({visibility: 'sync'})
    }
  }

  const cats = await client.fetch(`*[_type=="portfolioCategory"]{_id, name}`)
  if (!cats.length) {
    console.log('  ✓ no portfolioCategory documents')
  } else {
    console.log(`  • deleting ${cats.length} portfolioCategory document(s): ${cats.map((c) => c.name).join(', ')}`)
    if (APPLY) {
      // Delete drafts alongside published, or the draft resurfaces the type.
      const ids = cats.flatMap((c) => [c._id, `drafts.${c._id.replace(/^drafts\./, '')}`])
      let tx = client.transaction()
      for (const id of [...new Set(ids)]) tx = tx.delete(id)
      await tx.commit({visibility: 'sync'})
    }
  }

  if (APPLY) {
    const left = await client.fetch(`count(*[_type=="portfolioCategory"])`)
    console.log(`\nDone. portfolioCategory documents remaining: ${left}`)
  }
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
