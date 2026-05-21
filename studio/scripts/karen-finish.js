// Last patch: fill the homepage's homeIntro splitSection image. The
// generic importer's per-page distribution couldn't reach it because
// the homepage source page only had 6 unique photos — they all went
// into the hero slider. Use the About page's hero (KarenJoe portrait)
// as the split image since the homeIntro copy is about Karen.

import {getCliClient} from 'sanity/cli'

async function main() {
  const client = getCliClient()
  const about = await client.getDocument('pageAbout')
  const aboutHero = about?.sections?.find((s) => s._type === 'heroSection')
  const ref = aboutHero?.images?.[0]?.asset?._ref
  if (!ref) {
    throw new Error('no hero image on pageAbout — cannot source homeIntro image')
  }
  const img = {_type: 'image', asset: {_type: 'reference', _ref: ref}}

  // Patch BOTH published + draft so the live URL and the in-Studio
  // Presentation iframe agree.
  for (const docId of ['homepagePage', 'drafts.homepagePage']) {
    const doc = await client.getDocument(docId)
    if (!doc) {
      console.log(`· no ${docId}`)
      continue
    }
    const intro = doc.sections?.find((s) => s._key === 'homeIntro')
    if (!intro) {
      console.log(`! ${docId}: no homeIntro section (renamed?)`)
      continue
    }
    if (intro.image) {
      console.log(`· ${docId}: homeIntro already has an image, skipping`)
      continue
    }
    await client
      .patch(docId)
      .set({[`sections[_key=="homeIntro"].image`]: img})
      .commit()
    console.log(`✓ ${docId}: patched homeIntro.image → ${ref}`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
