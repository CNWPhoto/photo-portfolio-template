// One-off overlay script — takes the family-demo donor content imported
// into the Blackbird Photography Sanity project and patches every doc
// with Melanie Fogal's real content from .staging/blackbird-photography/.
//
// Run with:
//   cd studio
//   cp .env.blackbird-photography-backup .env
//   npm run blackbird:overlay
//   cp .env.cnw-photo-demo-backup .env   # or restore your dev .env
//
// The script:
//   1. Uploads every image in .staging/.../originals/ as a Sanity asset
//   2. Patches siteSettings, socialSettings, navSettings, footerSettings, seoSettings
//   3. Rewrites homepagePage sections with Melanie's hero, intro, steps, FAQs, etc.
//   4. Rewrites pageAbout, pageContact, pageExperience (Info page)
//   5. Deletes family-demo testimonials, creates Melanie's 4
//   6. Deletes family-demo portfolio categories, creates couples-family / children / products
//   7. Creates portfolio items linking each uploaded image to its category
//
// Idempotent-ish: uploaded assets are deduped by SHA on Sanity's side. Doc
// patches use createOrReplace so re-running overwrites cleanly.

import {getCliClient} from 'sanity/cli'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const STAGING = path.resolve(__dirname, '../../.staging/blackbird-photography')
const CONTENT = JSON.parse(fs.readFileSync(path.join(STAGING, 'content.json'), 'utf8'))

const client = getCliClient()

// ── helpers ────────────────────────────────────────────────────────────────

const uploaded = {} // relPath -> asset._id

async function upload(relPath) {
  if (!relPath) return null
  if (uploaded[relPath]) return uploaded[relPath]
  const abs = path.join(STAGING, relPath)
  if (!fs.existsSync(abs)) {
    console.warn(`  ⚠ missing: ${relPath}`)
    return null
  }
  const filename = path.basename(relPath)
  const buf = fs.readFileSync(abs)
  const asset = await client.assets.upload('image', buf, {filename})
  uploaded[relPath] = asset._id
  console.log(`  ↑ ${(buf.length / 1024).toFixed(0)} KB  ${filename}`)
  return asset._id
}

function imgRef(assetId, alt) {
  if (!assetId) return undefined
  return {
    _type: 'image',
    asset: {_type: 'reference', _ref: assetId},
    ...(alt ? {alt} : {}),
  }
}

function block(text, marks) {
  return {
    _key: rndKey(),
    _type: 'block',
    style: 'normal',
    children: [
      {
        _key: rndKey(),
        _type: 'span',
        text,
        ...(marks ? {marks} : {}),
      },
    ],
  }
}

function rndKey() {
  return Math.random().toString(36).slice(2, 14)
}

function ctaLinkInternal(refId, text) {
  return {
    _type: 'ctaLink',
    type: 'internal',
    internal: {_type: 'reference', _ref: refId, _weak: true},
    ...(text ? {text} : {}),
  }
}

// ── 1. Upload all images ───────────────────────────────────────────────────

async function uploadAllImages() {
  console.log('\n=== Uploading images ===')
  const dirs = ['logo', 'about', 'family', 'children', 'couples', 'products']
  for (const d of dirs) {
    const full = path.join(STAGING, 'originals', d)
    if (!fs.existsSync(full)) continue
    for (const f of fs.readdirSync(full).sort()) {
      if (f.startsWith('.')) continue
      await upload(`originals/${d}/${f}`)
    }
  }
  console.log(`Total: ${Object.keys(uploaded).length} assets uploaded`)
}

// ── 2. siteSettings ────────────────────────────────────────────────────────

async function patchSiteSettings() {
  console.log('\n=== Patching siteSettings ===')
  const faviconId = uploaded['originals/logo/144x144-square-logo.jpg']
  await client
    .patch('siteSettings')
    .set({
      siteName: CONTENT.siteSettings.studioName,
      photographerName: CONTENT.siteSettings.studioPhotographer,
      defaultPalette: 'classic-cream',
      fontTheme: 'soft-contemporary',
      logoType: 'text',
      web3formsKey: '', // Connor pastes her key once she sends it
      demo: {isDemo: false},
      ...(faviconId ? {favicon: imgRef(faviconId)} : {}),
    })
    .commit()
  console.log('  ✓ siteSettings patched (palette: classic-cream)')
}

// ── 3. socialSettings ──────────────────────────────────────────────────────

async function patchSocial() {
  console.log('\n=== Patching socialSettings ===')
  await client
    .patch('socialSettings')
    .set({
      facebook: CONTENT.social.facebook,
      instagram: CONTENT.social.instagram,
      tiktok: '',
      youtube: '',
    })
    .commit()
  console.log('  ✓ facebook + instagram')
}

// ── 4. seoSettings ─────────────────────────────────────────────────────────

async function patchSeo() {
  console.log('\n=== Patching seoSettings ===')
  const socialImageId = uploaded[CONTENT.seo.socialImage]
  await client
    .patch('seoSettings')
    .set({
      defaultTitle: CONTENT.seo.defaultTitle,
      defaultDescription: CONTENT.seo.defaultDescription,
      ...(socialImageId ? {defaultSocialImage: imgRef(socialImageId)} : {}),
      // siteUrl stays blank until she has a custom domain.
    })
    .commit()
  console.log('  ✓ seoSettings patched (siteUrl left blank for domain decision)')
}

// ── 5. homepagePage ────────────────────────────────────────────────────────

async function patchHomepage() {
  console.log('\n=== Rewriting homepagePage sections ===')

  const heroId = uploaded['originals/family/family-session-lake-17.jpg']
  const splitId = uploaded['originals/about/1534003483-nh-photographer-fun.jpg']
  const whyId = uploaded['originals/family/family-maternity-session-castle-15.jpg']

  const sections = [
    // Hero
    {
      _key: 'homeHero',
      _type: 'heroSection',
      enabled: true,
      heading: CONTENT.homepage.hero.heading,
      subheading: CONTENT.homepage.hero.subheading,
      heightMode: 'fullscreen',
      variant: 'image-full',
      textAlignment: 'right',
      textPosition: 'bottom-right',
      overlayOpacity: 25,
      stickyBackground: false,
      ctaText: CONTENT.homepage.hero.ctaText,
      ctaLink: ctaLinkInternal('pageContact'),
      images: heroId
        ? [{_key: rndKey(), _type: 'image', alt: 'Family photo session by the lake', asset: {_type: 'reference', _ref: heroId}}]
        : [],
    },
    // Intro (split section)
    {
      _key: 'homeSplit',
      _type: 'splitSection',
      enabled: true,
      backgroundTone: 'alt',
      eyebrow: CONTENT.homepage.intro.eyebrow,
      heading: CONTENT.homepage.intro.heading,
      body: CONTENT.homepage.intro.body.split('\n\n').map((p) => block(p)),
      imageLayout: 'image-right',
      mobileOrder: 'image-first',
      textAlignment: 'left',
      verticalAlignment: 'center',
      imageAspectRatio: 'auto',
      image: splitId ? imgRef(splitId, CONTENT.homepage.intro.imageAlt) : undefined,
    },
    // Testimonials (preserved)
    {
      _key: 'homeTestimonials',
      _type: 'testimonialsSection',
      enabled: true,
      heading: CONTENT.homepage.testimonialsHeading,
      layout: 'slider',
      source: 'all',
    },
    // Featured portfolio (preserved)
    {
      _key: 'homePortfolio',
      _type: 'featuredPortfolioSection',
      enabled: true,
      backgroundTone: 'default',
      eyebrow: 'Gallery',
      showVerticalLabel: true,
      ctaLink: ctaLinkInternal('portfolio'),
    },
    // Steps — Melanie's full 6-step "No Worries Process"
    {
      _key: 'homeSteps',
      _type: 'stepsSection',
      enabled: true,
      backgroundTone: 'alt',
      eyebrow: CONTENT.homepage.howItWorks.eyebrow,
      heading: CONTENT.homepage.howItWorks.heading,
      ctaText: 'Inquire',
      ctaLink: ctaLinkInternal('pageContact'),
      steps: CONTENT.homepage.howItWorks.steps.map((s) => ({
        _key: 's' + s.number,
        _type: 'stepItem',
        stepNumber: s.number,
        title: s.title,
        body: [block(s.body)],
      })),
    },
    // Why Choose (full bleed image)
    {
      _key: 'homeWhy',
      _type: 'fullBleedImageSection',
      enabled: true,
      backgroundTone: 'default',
      eyebrow: 'Why Choose',
      heading: 'Real Family Moments',
      body: [
        block(
          "Every session is unrushed and led by your family's pace. There are no awkward, rigid poses — just space for your kids to be kids and for the connections that matter to come through naturally.",
        ),
        block(
          "Every print, album, and canvas is designed especially for your home. I don't leave you to guess at sizes, layouts, or what to do with your images — I do that work with you, so what ends up on your wall fits perfectly.",
        ),
      ],
      caption: `Serving ${CONTENT.siteSettings.serviceArea}`,
      cardPlacement: 'right',
      ctaText: 'About Melanie',
      ctaLink: ctaLinkInternal('pageAbout'),
      overlayOpacity: 30,
      parallax: true,
      textContainer: 'overlay-card',
      height: 'tall',
      image: whyId ? imgRef(whyId) : undefined,
    },
    // Location / sessions narrative
    {
      _key: 'homeLocations',
      _type: 'richTextSection',
      enabled: true,
      backgroundTone: 'default',
      heading: 'New Hampshire Family Sessions',
      maxWidth: 'default',
      textAlignment: 'center',
      body: [
        block(
          "Most sessions happen outdoors — at city parks, in the open spaces of southern New Hampshire, on the beach in summer, in fall foliage at peak color. In-home sessions are a favorite for newborns and milestone shoots, when the quiet moments at home are the real story.",
        ),
        block(
          "Every session is shaped around your family and the place that already means something to you.",
          ['em', 'strong'],
        ),
      ],
      ctaText: 'Session Info',
      ctaLink: ctaLinkInternal('pageExperience'),
    },
    // FAQs
    {
      _key: 'homeFaq',
      _type: 'faqSection',
      enabled: true,
      backgroundTone: 'alt',
      layout: 'flat-list',
      showSchema: true,
      verticalSideLabel: 'FAQs',
      faqs: CONTENT.info.faqs.map((f, i) => ({
        _key: 'faq' + (i + 1),
        _type: 'faqItem',
        question: f.q,
        answer: [block(f.a)],
      })),
    },
  ]

  await client
    .patch('homepagePage')
    .set({
      pageTitle: 'Home',
      sections,
      seo: {
        _type: 'seo',
        seoTitle: CONTENT.seo.defaultTitle,
        seoDescription: CONTENT.seo.defaultDescription,
      },
    })
    .commit()
  console.log(`  ✓ homepagePage rewritten (${sections.length} sections)`)
}

// ── 6. pageAbout ───────────────────────────────────────────────────────────

async function patchAbout() {
  console.log('\n=== Rewriting pageAbout ===')
  const portraitId = uploaded['originals/about/1534003483-nh-photographer-fun.jpg']

  const sections = [
    {
      _key: 'aboutIntro',
      _type: 'splitSection',
      enabled: true,
      eyebrow: 'A New Hampshire family photographer who believes the everyday is worth photographing — and that getting in front of the camera shouldn\'t feel stressful.',
      heading: CONTENT.about.heading,
      body: CONTENT.about.body.map((p) => {
        // Drop the leading **bold** markdown — Sanity portable text doesn't render it inline
        const cleaned = p.replace(/^\*\*([^*]+)\*\*/, '$1').replace(/\*\*/g, '')
        return block(cleaned)
      }),
      image: portraitId ? imgRef(portraitId, 'Melanie Fogal, owner of Black Bird Photography') : undefined,
      imageLayout: 'image-left',
      mobileOrder: 'image-first',
      textAlignment: 'left',
      verticalAlignment: 'center',
      imageAspectRatio: 'auto',
    },
    {
      _key: 'aboutPhilosophy',
      _type: 'splitSection',
      enabled: true,
      backgroundTone: 'alt',
      eyebrow: CONTENT.about.philosophy.heading,
      heading: 'Focused on you, every step of the way',
      body: [block(CONTENT.about.philosophy.body)],
      imageLayout: 'image-right',
      mobileOrder: 'text-first',
      textAlignment: 'left',
      verticalAlignment: 'center',
    },
    {
      _key: 'aboutQuote',
      _type: 'pullQuoteSection',
      enabled: true,
      backgroundTone: 'default',
      variant: 'centered',
      quote: CONTENT.about.pullQuote.quote,
      attribution: CONTENT.about.pullQuote.attribution,
    },
    {
      _key: 'aboutTidbits',
      _type: 'richTextSection',
      enabled: true,
      backgroundTone: 'alt',
      heading: 'A few tidbits about me',
      maxWidth: 'narrow',
      textAlignment: 'left',
      body: CONTENT.about.personalTidbits.map((t) => block('— ' + t)),
    },
    {
      _key: 'aboutCta',
      _type: 'ctaBandSection',
      enabled: true,
      backgroundTone: 'alt',
      layout: 'centered',
      heading: "Let's create something to hold close",
      body: "If you'd like to capture the people who matter to you in a way that feels honest and lasting, I'd love to hear from you.",
      ctaText: 'Get In Touch',
      ctaLink: ctaLinkInternal('pageContact'),
      caption: `Serving ${CONTENT.siteSettings.location} and surrounding areas`,
      centeredHeight: 'viewport',
    },
  ]

  await client
    .patch('pageAbout')
    .set({
      title: 'About',
      slug: {_type: 'slug', current: 'about'},
      sections,
      navThemeOverHero: 'auto',
    })
    .commit()
  console.log(`  ✓ pageAbout rewritten (${sections.length} sections)`)
}

// ── 7. pageContact ─────────────────────────────────────────────────────────

async function patchContact() {
  console.log('\n=== Rewriting pageContact ===')
  await client
    .patch('pageContact')
    .set({
      title: 'Contact',
      slug: {_type: 'slug', current: 'contact'},
      sections: [
        {
          _key: 'contactHero',
          _type: 'heroSection',
          enabled: true,
          variant: 'centered-text',
          heightMode: 'medium',
          heading: 'How Exciting!',
          subheading: 'You decided to get in touch. Fill out the form below and I\'ll be in contact within one business day.',
        },
        {
          _key: 'contactForm',
          _type: 'contactFormSection',
          enabled: true,
          heading: 'Get in Touch',
          successMessage: "Thank you! Your message is on its way to me. I'll respond within one business day.",
        },
        {
          _key: 'contactDetails',
          _type: 'richTextSection',
          enabled: true,
          backgroundTone: 'alt',
          heading: 'Other Ways to Reach Me',
          maxWidth: 'narrow',
          textAlignment: 'center',
          body: [
            block(`Email: ${CONTENT.contact.email}`),
            block(`Hours: ${CONTENT.contact.hours}`),
            block(`Service area: ${CONTENT.siteSettings.serviceArea}`),
          ],
        },
      ],
    })
    .commit()
  console.log('  ✓ pageContact rewritten')
}

// ── 8. pageExperience (the Info page) ──────────────────────────────────────

async function patchExperience() {
  console.log('\n=== Rewriting pageExperience (Info page) ===')
  const heroId = uploaded['originals/family/family-maternity-session-castle-11.jpg']

  const productCards = CONTENT.info.products.map((p, i) => ({
    _key: 'prod' + (i + 1),
    _type: 'columnItem',
    title: p.name,
    body: [block(p.blurb)],
  }))

  const sections = [
    {
      _key: 'expHero',
      _type: 'heroSection',
      enabled: true,
      variant: 'image-full',
      heightMode: 'medium',
      heading: CONTENT.info.heading,
      subheading: CONTENT.info.sessionFee.blurb,
      textPosition: 'bottom-left',
      textAlignment: 'left',
      overlayOpacity: 35,
      stickyBackground: false,
      images: heroId ? [{_key: rndKey(), _type: 'image', asset: {_type: 'reference', _ref: heroId}}] : [],
    },
    {
      _key: 'expSessionFee',
      _type: 'richTextSection',
      enabled: true,
      backgroundTone: 'alt',
      eyebrow: 'Session Fee',
      heading: `$${CONTENT.info.sessionFee.amount}`,
      maxWidth: 'narrow',
      textAlignment: 'center',
      body: [block(CONTENT.info.sessionFee.blurb)],
    },
    {
      _key: 'expProducts',
      _type: 'threeColumnSection',
      enabled: true,
      backgroundTone: 'default',
      variant: 'icon-list',
      alignment: 'left',
      verticalSideLabel: 'Heirloom Products',
      columns: productCards.slice(0, 3),
    },
    {
      _key: 'expProducts2',
      _type: 'threeColumnSection',
      enabled: true,
      backgroundTone: 'default',
      variant: 'icon-list',
      alignment: 'left',
      columns: productCards.slice(3),
    },
    {
      _key: 'expWallArt',
      _type: 'richTextSection',
      enabled: true,
      backgroundTone: 'alt',
      heading: CONTENT.info.wallArtStartingPrice,
      maxWidth: 'narrow',
      textAlignment: 'center',
      body: [
        block(
          "Each ordered print product includes its digital file. I don't sell digital-only packages — I believe in physical wall art and albums you can hold in your hands.",
        ),
      ],
    },
    {
      _key: 'expFaq',
      _type: 'faqSection',
      enabled: true,
      backgroundTone: 'default',
      layout: 'flat-list',
      showSchema: true,
      verticalSideLabel: 'FAQs',
      faqs: CONTENT.info.faqs.map((f, i) => ({
        _key: 'expfaq' + (i + 1),
        _type: 'faqItem',
        question: f.q,
        answer: [block(f.a)],
      })),
    },
    {
      _key: 'expCta',
      _type: 'ctaBandSection',
      enabled: true,
      layout: 'centered',
      centeredHeight: 'viewport',
      heading: 'Ready to book?',
      body: "If you've read this far and it sounds like a good fit, let's chat. I'll get back to you within one business day.",
      ctaText: 'Inquire',
      ctaLink: ctaLinkInternal('pageContact'),
    },
  ]

  await client
    .patch('pageExperience')
    .set({
      title: 'Info',
      slug: {_type: 'slug', current: 'info'},
      sections,
      navThemeOverHero: 'auto',
    })
    .commit()
  console.log(`  ✓ pageExperience rewritten (${sections.length} sections)`)
}

// ── 9. Testimonials ────────────────────────────────────────────────────────

async function replaceTestimonials() {
  console.log('\n=== Replacing testimonials ===')
  const existing = await client.fetch(`*[_type == "testimonial"]._id`)
  console.log(`  Found ${existing.length} existing testimonials to delete`)
  if (existing.length) {
    const tx = client.transaction()
    existing.forEach((id) => tx.delete(id))
    await tx.commit()
  }

  let order = 1
  for (const t of CONTENT.testimonials) {
    const portraitId = t.imageAsset ? uploaded[t.imageAsset] : null
    const doc = {
      _type: 'testimonial',
      testimonial: t.quote,
      client: t.client,
      order: order++,
      starRating: t.starRating,
      source: t.source,
      ...(portraitId ? {image: imgRef(portraitId)} : {}),
    }
    const created = await client.create(doc)
    console.log(`  + ${t.client.padEnd(35)}  ★${t.starRating}  ${created._id}`)
  }
}

// ── 10. Portfolio categories + items ───────────────────────────────────────

async function replacePortfolio() {
  console.log('\n=== Replacing portfolio categories + items ===')
  // Delete existing categories + items
  const existingCats = await client.fetch(`*[_type == "portfolioCategory"]._id`)
  const existingItems = await client.fetch(`*[_type == "portfolioItem"]._id`)
  console.log(`  Deleting ${existingCats.length} categories + ${existingItems.length} items`)
  const txDel = client.transaction()
  ;[...existingCats, ...existingItems].forEach((id) => txDel.delete(id))
  if (existingCats.length + existingItems.length) await txDel.commit()

  // Create Melanie's 3 categories
  const catMap = {} // slug -> _id
  for (const c of CONTENT.portfolio.categories) {
    const doc = {
      _type: 'portfolioCategory',
      _id: 'portfolioCategory-' + c.slug,
      title: c.name,
      slug: {_type: 'slug', current: c.slug},
      description: c.description,
    }
    await client.createOrReplace(doc)
    catMap[c.slug] = doc._id
    console.log(`  + category: ${c.name} (${c.slug})`)
  }

  // Create portfolio items, mapping originals/ folders to categories
  const folderToCat = {
    family: 'couples-family',
    couples: 'couples-family',
    children: 'children',
    products: 'products',
  }

  let itemOrder = 1
  let createdCount = 0
  for (const [folder, catSlug] of Object.entries(folderToCat)) {
    const dir = path.join(STAGING, 'originals', folder)
    if (!fs.existsSync(dir)) continue
    for (const f of fs.readdirSync(dir).sort()) {
      if (f.startsWith('.')) continue
      const assetId = uploaded[`originals/${folder}/${f}`]
      if (!assetId) continue
      const title = f
        .replace(/\.(jpg|jpeg|png|webp)$/i, '')
        .replace(/^\d+[-_]?/, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase())
        .slice(0, 80)
      await client.create({
        _type: 'portfolioItem',
        title,
        slug: {_type: 'slug', current: f.replace(/\.(jpg|jpeg|png|webp)$/i, '').toLowerCase()},
        category: {_type: 'reference', _ref: catMap[catSlug]},
        image: imgRef(assetId, title),
        order: itemOrder++,
      })
      createdCount++
    }
  }
  console.log(`  Created ${createdCount} portfolio items across ${Object.keys(catMap).length} categories`)
}

// ── 11. portfolio (index page) — refresh featured shots ────────────────────

async function patchPortfolioIndex() {
  console.log('\n=== Patching portfolio index page ===')
  await client
    .patch('portfolio')
    .set({
      title: 'Portfolio',
      heading: 'Recent Work',
      description: 'Family, children, and heirloom products from sessions across southern New Hampshire.',
    })
    .commit()
  console.log('  ✓ portfolio index updated')
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  const start = Date.now()
  console.log(`\nBlackbird Photography overlay starting`)
  console.log(`  Project:  ${client.config().projectId}`)
  console.log(`  Dataset:  ${client.config().dataset}`)
  console.log(`  Staging:  ${STAGING}`)

  if (client.config().projectId !== '6nc24jar') {
    console.error('\n✗ Refusing to run — projectId is not 6nc24jar (Blackbird).')
    console.error('  Run "cp .env.blackbird-photography-backup .env" first.')
    process.exit(1)
  }

  await uploadAllImages()
  await patchSiteSettings()
  await patchSocial()
  await patchSeo()
  await patchHomepage()
  await patchAbout()
  await patchContact()
  await patchExperience()
  await replaceTestimonials()
  await replacePortfolio()
  await patchPortfolioIndex()

  console.log(`\n✓ Done in ${((Date.now() - start) / 1000).toFixed(1)}s`)
  console.log(`  Open https://blackbird-photography.sanity.studio/ to review.`)
}

main().catch((err) => {
  console.error('\n✗ Overlay failed:', err)
  process.exit(1)
})
