// Diagnostic: list which of Karen's docs have unpublished drafts.

import {getCliClient} from 'sanity/cli'

const PUB_IDS = [
  'homepagePage', 'pageSeniors', 'pagePets', 'pageFamily',
  'pageHeadshots', 'pageNewborns', 'pageAbout', 'pageContact',
  'siteSettings',
]

async function main() {
  const client = getCliClient()
  const draftIds = PUB_IDS.map((id) => `drafts.${id}`)
  const drafts = await client.fetch(`*[_id in $ids]{_id, _updatedAt}`, {ids: draftIds})
  console.log(`drafts present: ${drafts.length}`)
  drafts.forEach((d) => console.log(` · ${d._id}  (updated ${d._updatedAt})`))

  const homeDraft = await client.getDocument('drafts.homepagePage')
  if (homeDraft) {
    console.log('\n── drafts.homepagePage sections ──')
    for (const s of homeDraft.sections || []) {
      const summary = s._type === 'threeColumnSection'
        ? ` [${(s.columns || []).map((c) => `${c.title}${c.image ? '*' : ''}`).join(' / ')}]`
        : ''
      const heroSummary = s._type === 'heroSection'
        ? ` images: ${(s.images || []).length}`
        : ''
      const splitSummary = s._type === 'splitSection'
        ? ` image: ${s.image ? 'set' : 'empty'}`
        : ''
      console.log(`  ${s._key}  ${s._type}${summary}${heroSummary}${splitSummary}`)
    }
  } else {
    console.log('\nno draft for homepagePage')
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
