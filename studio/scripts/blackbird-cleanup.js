import {getCliClient} from 'sanity/cli'

async function main() {
  const client = getCliClient()

  await client.patch('siteSettings').set({photographerName: 'Melanie Fogal'}).commit()
  console.log('✓ siteSettings.photographerName = Melanie Fogal')

  await client
    .patch('pageAbout')
    .set({'sections[_key=="aboutIntro"].image.alt': 'Melanie Fogal, owner of Black Bird Photography'})
    .commit()
  console.log('✓ pageAbout aboutIntro image alt updated')

  const orphans = await client.fetch(
    `*[_type == "page" && (title == "Test" || _id match "drafts.*22311ded*")]._id`,
  )
  if (orphans.length) {
    const tx = client.transaction()
    orphans.forEach((id) => tx.delete(id))
    await tx.commit()
    console.log(`✓ deleted ${orphans.length} orphan Test page(s):`, orphans)
  } else {
    console.log('✓ no orphan Test pages found')
  }

  const check = await client.fetch(`{
    "photographerName": *[_id=="siteSettings"][0].photographerName,
    "pageCount": count(*[_type=="page" && !(_id in path("drafts.**"))]),
    "pages": *[_type=="page" && !(_id in path("drafts.**"))]{title, "slug": slug.current}
  }`)
  console.log('\nFinal state:', JSON.stringify(check, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
