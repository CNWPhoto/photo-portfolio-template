// ⚠️  RETIRED 2026-06-04 — DO NOT RE-RUN AGAINST THE LIVE DATASET. ⚠️
//
// This script did its job: the wedding-demo dataset (boa9509d) is now the
// source of truth and has diverged via manual Studio edits. Re-running with
// --apply would clobber those edits (createOrReplace on fixed _ids) and
// DELETE any pages/testimonials/posts/categories created since (keep-list
// deletion). It is kept only as reference material for extracting
// seed/niches/weddings.js once the demo design is final.
//
// --apply is therefore guarded: it refuses to run without --force.
//
// ── Original purpose ──────────────────────────────────────────────────────
// One-off overlay script — rebuilds the wedding-demo dataset (Sanity boa9509d)
// as a complete fine-art wedding site for the invented brand "Wren & Ivy
// Photography" (photographer Adeline Wren). The dataset was cloned from
// family-demo and still carried family copy + clone cruft; this script
// overwrites every doc with wedding content and purges the cruft.
//
// This is NOT the niche seed file. Per the modular-seed sequencing rule we
// build + polish the demo in the dataset first, and only later extract
// studio/scripts/seed/niches/weddings.js once the design has landed.
//
// Run from studio/ (dry-run prints a plan; --apply commits):
//   SANITY_STUDIO_PROJECT_ID=boa9509d SANITY_STUDIO_DATASET=production \
//     npx dotenv -e .env -- sanity exec scripts/wedding-overlay.js --with-user-token
//   ...add `-- --apply` to actually write.
//
// The client is pinned to boa9509d via withConfig() regardless of env, so it
// can never accidentally hit the hx5xgigp template demo.
//
// Idempotent: every doc uses createOrReplace on a fixed _id; images are
// referenced by existing asset _id (already uploaded), nothing is uploaded.

import {getCliClient} from 'sanity/cli'
import {
  block, bodyText, ctaInternal, sectionBase, palettes, ID,
} from './seed/_shared.js'

const APPLY = process.argv.includes('--apply')
const PURGE_ASSETS = process.argv.includes('--purge-assets')
const FORCE = process.argv.includes('--force')

// Retired-script guard — see header. The dataset has diverged via manual
// Studio edits; --apply now requires an explicit --force acknowledgment.
if (APPLY && !FORCE) {
  console.error(
    '\n✋ wedding-overlay.js is RETIRED (2026-06-04).\n' +
    'The boa9509d dataset is now the source of truth — re-running --apply\n' +
    'would overwrite manual Studio edits and delete docs not in its keep-lists.\n' +
    'If you truly intend this, re-run with: -- --apply --force\n',
  )
  process.exit(1)
}

const client = getCliClient().withConfig({
  projectId: 'boa9509d',
  dataset: 'production',
  apiVersion: '2024-10-01',
  useCdn: false,
})

// ── Asset map (already-uploaded wedding photos) ──────────────────────────
const A = {
  // Portraits (~2000x3000)
  p11450703: 'image-913a7cecd597384565665391317062fe39bb711b-2000x2997-jpg',
  p13617315: 'image-e6594af160bab05342d1745f919ca135154d5a71-2000x3000-jpg',
  p14918363: 'image-72ca02eba7da615a68e13aaace9b5b32306c1229-2000x2995-jpg',
  p19681533: 'image-99fd7d2810f9c648d2f7927c065be29c5b41925a-2000x3000-jpg',
  p27060159: 'image-75ce1c761a916eaa0d1016228799b4db455b7d8a-2000x3000-jpg',
  p27552558: 'image-6cbddd24b1db41373f85794e67cf3e9e22984b1b-2000x3003-jpg',
  p28448620: 'image-289cdf5fa2ebbca103489e2e436bb421344b5b23-2000x3000-jpg',
  p30657132: 'image-6854638fc8f20e49902d81fa32b64c579d2d2095-2000x3000-jpg',
  p31629944: 'image-f91f9308b8eba0630e8c733deacbba4f01e5e5dd-2000x3000-jpg',
  p32795181: 'image-e7c6b3282e52723b1ca8b4bc66b035bf2378364e-2000x3000-jpg',
  p37380420: 'image-6b4ed666953f74e68bc02c0cf8e9e87adaf15b0d-2000x3000-jpg',
  p6679832: 'image-a24d1be8bdfeeb2888b8cf469fca3ad994ef28ae-2000x3006-jpg',
  p752805: 'image-3bd49f5859c538bfa3b0ad5de2b1a83c60a53b34-2000x2949-jpg',
  // Square
  s19950472: 'image-ecc17b39a3ac9566de6984191f95a7d98ebdf929-2000x2000-jpg',
  // Landscapes
  l19365954: 'image-d4cb991381f050712d3292587f6518d03167660f-2000x1600-jpg',
  l7777910: 'image-90288959e41e406f081097b232e3b749d2d6cf23-2000x1333-jpg',
  l9517406: 'image-cbcc97aaee01fbf0347f60f4b914d26f309ca765-2000x1333-jpg',
}

// Image helpers
const pic = (id, alt) => ({_type: 'image', asset: {_ref: id}, alt})
const picItem = (key, id, alt, extra = {}) => ({_key: key, _type: 'image', asset: {_ref: id}, alt, ...extra})
const ref = (id, key) => ({_type: 'reference', _ref: id, _key: key})

const docs = []

// ── siteSettings ─────────────────────────────────────────────────────────
docs.push({
  _id: 'siteSettings',
  _type: 'siteSettings',
  siteName: 'Wren & Ivy Photography',
  photographerName: 'Adeline Wren',
  logoType: 'text',
  fontTheme: 'romantic-script',
  palettes,
  defaultPalette: 'classic-cream',
  subheadingCase: 'uppercase',
  textColorPreset: '',
  // Placeholder so the demo renders the actual form (not the "not configured"
  // notice). Swap for a real Web3Forms access key to enable live submissions.
  web3formsKey: 'demo-placeholder-key',
  aiAssistEnabled: true,
  demo: {isDemo: true, nicheLabel: 'Wedding Photography'},
})

// ── navSettings ────────────────────────────────────────────────────────────
docs.push({
  _id: 'navSettings',
  _type: 'navSettings',
  navVariant: 'centered',
  stickyNav: true,
  links: [
    {_key: 'navExperience', _type: 'navLink', label: 'Experience', linkType: 'internal', internalRef: {_type: 'reference', _ref: ID.experience, _weak: true}, enabled: true, openInNewTab: false, isButton: false},
    {_key: 'navPortfolio', _type: 'navLink', label: 'Portfolio', linkType: 'internal', internalRef: {_type: 'reference', _ref: ID.portfolio, _weak: true}, enabled: true, openInNewTab: false, isButton: false},
    {_key: 'navAbout', _type: 'navLink', label: 'About', linkType: 'internal', internalRef: {_type: 'reference', _ref: ID.about, _weak: true}, enabled: true, openInNewTab: false, isButton: false},
    {_key: 'navBlog', _type: 'navLink', label: 'Journal', linkType: 'internal', internalRef: {_type: 'reference', _ref: 'blogPage', _weak: true}, enabled: true, openInNewTab: false, isButton: false},
    {_key: 'navInquire', _type: 'navLink', label: 'Inquire', linkType: 'internal', internalRef: {_type: 'reference', _ref: ID.contact, _weak: true}, enabled: true, openInNewTab: false, isButton: true},
  ],
})

// ── footerSettings ──────────────────────────────────────────────────────────
docs.push({
  _id: 'footerSettings',
  _type: 'footerSettings',
  internalTitle: 'Footer',
  backgroundTone: 'dark',
  links: [
    {_key: 'fl1', _type: 'footerLink', label: 'Home', url: '/', enabled: true, openInNewTab: false},
    {_key: 'fl2', _type: 'footerLink', label: 'Experience', url: '/experience', enabled: true, openInNewTab: false},
    {_key: 'fl3', _type: 'footerLink', label: 'Portfolio', url: '/portfolio', enabled: true, openInNewTab: false},
    {_key: 'fl4', _type: 'footerLink', label: 'About', url: '/about', enabled: true, openInNewTab: false},
    {_key: 'fl5', _type: 'footerLink', label: 'Journal', url: '/blog', enabled: true, openInNewTab: false},
    {_key: 'fl6', _type: 'footerLink', label: 'Inquire', url: '/inquire', enabled: true, openInNewTab: false},
  ],
  middleColumn: {enabled: true, label: 'On the Journal', note: bodyText('Wedding planning notes, real celebrations, and a little romance — delivered now and then.')},
  legalLinks: {
    privacyPolicy: {enabled: false, label: 'Privacy Policy', url: '/privacy-policy'},
    terms: {enabled: false, label: 'Terms', url: '/terms'},
  },
})

// ── socialSettings ──────────────────────────────────────────────────────────
docs.push({
  _id: 'socialSettings',
  _type: 'socialSettings',
  instagram: 'https://instagram.com/wrenandivyphoto',
  facebook: 'https://facebook.com/wrenandivyphoto',
  youtube: '',
  tiktok: '',
  custom: {label: 'Pinterest', url: 'https://pinterest.com/wrenandivyphoto'},
})

// ── seoSettings ─────────────────────────────────────────────────────────────
docs.push({
  _id: 'seoSettings',
  _type: 'seoSettings',
  siteUrl: 'https://wedding-demo.connor-213.workers.dev',
  businessEmail: 'hello@wrenandivyphoto.com',
  businessPhone: '(843) 555-0142',
  businessCity: 'Charleston',
  businessState: 'SC',
  areaServed: 'Charleston, Savannah, the Lowcountry, and destinations worldwide',
  priceRange: '$$$',
})

// ── Homepage ────────────────────────────────────────────────────────────────
docs.push({
  _id: 'homepagePage',
  _type: 'homepagePage',
  pageTitle: 'Home',
  sections: [
    // 1. Hero (slider)
    sectionBase({
      _key: 'homeHero', _type: 'heroSection',
      variant: 'slider',
      images: [
        picItem('h1', A.l7777910, 'A couple embracing in soft evening light'),
        picItem('h2', A.p13617315, 'Bride and groom holding hands at the altar'),
        picItem('h3', A.l9517406, 'Newlyweds walking through golden light'),
      ],
      eyebrow: 'Fine Art Wedding Photography',
      heading: 'Where your love story\nbecomes art',
      headingSize: 'large',
      subheading: 'Timeless, romantic wedding photography in Charleston & beyond.',
      ctaText: 'View Recent Weddings',
      ctaLink: ctaInternal(ID.portfolio),
      textAlignment: 'center',
      textPosition: 'center-center',
      heightMode: 'fullscreen',
      overlayOpacity: 35,
    }),
    // 2. Three-column quick-nav (image cards)
    sectionBase({
      _key: 'homeBegin', _type: 'threeColumnSection',
      backgroundTone: 'default',
      eyebrow: 'Explore',
      heading: 'Begin Here',
      variant: 'image-cards',
      columnWidths: 'equal',
      alignment: 'center',
      columns: [
        {_key: 'cb1', _type: 'columnItem', image: pic(A.p27060159, 'A bride and groom portrait'), title: 'The Portfolio', body: bodyText('A gallery of recent weddings, engagements, and elopements.'), ctaText: 'View the Portfolio', ctaLink: ctaInternal(ID.portfolio)},
        {_key: 'cb2', _type: 'columnItem', image: pic(A.p32795181, 'A couple laughing together'), title: 'The Experience', body: bodyText('How we work together, from first hello to your final gallery.'), ctaText: 'The Experience', ctaLink: ctaInternal(ID.experience)},
        {_key: 'cb3', _type: 'columnItem', image: pic(A.p6679832, 'Photographer Adeline Wren'), title: 'Meet Adeline', body: bodyText('The heart and eye behind Wren & Ivy.'), ctaText: 'Meet Adeline', ctaLink: ctaInternal(ID.about)},
      ],
    }),
    // 3. Split welcome
    sectionBase({
      _key: 'homeWelcome', _type: 'splitSection',
      backgroundTone: 'alt',
      imageLayout: 'image-right',
      eyebrow: 'Welcome',
      heading: 'For couples who feel\nmore than they pose',
      body: bodyText(
        "I'm Adeline — a wedding photographer drawn to the in-between moments: the held breath before the vows, the laughter that ruins the careful pose, the quiet hand-squeeze no one else catches.",
        'My work is unhurried and led by you. No stiff lineups or forced smiles — just space for your day to unfold, photographed the way it actually felt.',
      ),
      image: pic(A.p28448620, 'Bride and groom in a candid embrace'),
      ctaText: 'Get to know me',
      ctaLink: ctaInternal(ID.about),
      textAlignment: 'left',
    }),
    // 4. Pull quote
    sectionBase({
      _key: 'homeQuote', _type: 'pullQuoteSection',
      backgroundTone: 'default',
      quote: 'We turn fleeting moments into memories meant to last a lifetime.',
      variant: 'italic-large',
    }),
    // 5. Featured gallery
    sectionBase({
      _key: 'homeGallery', _type: 'galleryGridSection',
      backgroundTone: 'default',
      eyebrow: 'Featured Weddings',
      heading: 'A few favorites',
      layout: 'masonry',
      gap: 'normal',
      lightbox: true,
      images: [
        picItem('g1', A.p11450703, 'Bride in her gown by a window'),
        picItem('g2', A.p14918363, 'Couple sharing a first dance'),
        picItem('g3', A.l19365954, 'Wedding ceremony from the aisle'),
        picItem('g4', A.p27552558, 'Bride and groom portrait at sunset'),
        picItem('g5', A.p31629944, 'Newlyweds beneath an arch of flowers'),
        picItem('g6', A.p37380420, 'Detail of the bridal bouquet'),
        picItem('g7', A.p752805, 'Couple walking hand in hand'),
        picItem('g8', A.l9517406, 'Reception toast among guests'),
        picItem('g9', A.p19681533, 'Bride and groom in soft window light'),
      ],
      ctaText: 'View Full Portfolio',
      ctaLink: ctaInternal(ID.portfolio),
    }),
    // 6. Steps (the experience)
    sectionBase({
      _key: 'homeSteps', _type: 'stepsSection',
      backgroundTone: 'alt',
      eyebrow: 'The Experience',
      heading: 'From hello to heirloom',
      gridColumns: 3,
      steps: [
        {_key: 'st1', _type: 'stepItem', stepNumber: '01', title: 'Inquire & Connect', body: bodyText("Tell me about the two of you. We'll talk through your day over coffee or a call and make sure we're the right fit.")},
        {_key: 'st2', _type: 'stepItem', stepNumber: '02', title: 'The Wedding Day', body: bodyText('I document the day as it unfolds — calm, present, and a step ahead — so you can simply be in it.')},
        {_key: 'st3', _type: 'stepItem', stepNumber: '03', title: 'Your Heirloom Gallery', body: bodyText('Weeks later you receive a hand-edited gallery and the option of a keepsake album to hold for generations.')},
      ],
      ctaText: 'See the Full Experience',
      ctaLink: ctaInternal(ID.experience),
    }),
    // 7. Full-bleed statement
    sectionBase({
      _key: 'homeStatement', _type: 'fullBleedImageSection',
      image: pic(A.p30657132, 'A couple silhouetted against the evening sky'),
      textContainer: 'overlay-card',
      cardPlacement: 'left',
      eyebrow: 'Your Day, Beautifully Kept',
      heading: "Photographs you'll\nreach for in fifty years",
      body: bodyText('Not just images of a day, but a record of how it felt to be exactly this in love.'),
      ctaText: 'Start Your Inquiry',
      ctaLink: ctaInternal(ID.contact),
      caption: 'Now booking 2026 & 2027 weddings',
      height: 'tall',
      overlayOpacity: 40,
      parallax: true,
    }),
    // 8. Testimonials
    sectionBase({
      _key: 'homeTestimonials', _type: 'testimonialsSection',
      backgroundTone: 'default',
      layout: 'image-slider',
      heading: 'Kind words from past couples',
      maxCount: 5,
    }),
    // 9. CTA band
    sectionBase({
      _key: 'homeCta', _type: 'ctaBandSection',
      backgroundTone: 'dark',
      layout: 'overlapping-images',
      heading: 'Ready to tell your story?',
      body: "Let's create something timeless together.",
      ctaText: 'Inquire',
      ctaLink: ctaInternal(ID.contact),
      backgroundImage: pic(A.p32795181, 'Couple laughing on their wedding day'),
      foregroundImage: pic(A.p14918363, 'First dance under string lights'),
      caption: 'Charleston · destination · worldwide',
    }),
    // 10. FAQ
    sectionBase({
      _key: 'homeFaq', _type: 'faqSection',
      backgroundTone: 'alt',
      heading: 'Frequently Asked Questions',
      layout: 'accordion',
      showSchema: true,
      faqs: [
        {_key: 'fq1', _type: 'faqItem', question: 'How far in advance should we book?', answer: bodyText('Most couples reach out 9–14 months ahead. I take a limited number of weddings each year so every couple gets my full attention — popular dates go early.')},
        {_key: 'fq2', _type: 'faqItem', question: 'Do you travel for weddings?', answer: bodyText("Always. I'm based in Charleston but photograph weddings across the Lowcountry and worldwide. Travel beyond a few hours is added simply at cost.")},
        {_key: 'fq3', _type: 'faqItem', question: 'How many photos will we receive?', answer: bodyText('A typical full wedding day yields 600–800 hand-edited images, delivered in a private online gallery you can download, print, and share.')},
        {_key: 'fq4', _type: 'faqItem', question: 'What does it cost to reserve our date?', answer: bodyText('A signed agreement and a 30% retainer hold your date. The remaining balance is due two weeks before the wedding.')},
      ],
    }),
  ],
})

// ── Testimonials ────────────────────────────────────────────────────────────
const testimonials = [
  {id: 'testimonial-1', client: 'Mei & James', order: 1, rating: 5, img: A.p27552558, text: "Adeline felt less like a vendor and more like a friend who happened to be brilliant with a camera. Our gallery made us cry — she captured the day exactly as it felt."},
  {id: 'testimonial-2', client: 'Sara & Daniel', order: 2, rating: 5, img: A.p11450703, text: 'You simply must book her. She is calm, unobtrusive, and somehow everywhere at once. Every photo looks like a quiet, beautiful film still.'},
  {id: 'testimonial-3', client: 'Gabriela & Tom', order: 3, rating: 5, img: A.p31629944, text: 'Hands down the best decision of our wedding planning. Adeline put us at ease instantly, and the images are timeless — not trendy, just us.'},
  {id: 'testimonial-4', client: 'Priya & Aaron', order: 4, rating: 5, img: A.p14918363, text: "We're not 'photo people,' and Adeline made it effortless. Looking back, the photographs are the part of the day we treasure most."},
  {id: 'testimonial-5', client: 'Hannah & Will', order: 5, rating: 5, img: A.p752805, text: 'From our engagement session to the last dance, she told our story with so much heart. We will recommend her to everyone we know.'},
]
for (const t of testimonials) {
  docs.push({
    _id: t.id, _type: 'testimonial',
    testimonial: t.text, client: t.client, order: t.order,
    starRating: t.rating, source: 'direct',
    image: pic(t.img, `${t.client} on their wedding day`),
  })
}

// ── Portfolio categories ─────────────────────────────────────────────────────
const portfolioCategories = [
  {slug: 'weddings', name: 'Weddings'},
  {slug: 'engagements', name: 'Engagements'},
  {slug: 'elopements', name: 'Elopements'},
]
for (const c of portfolioCategories) {
  docs.push({_id: `portfolioCategory-${c.slug}`, _type: 'portfolioCategory', name: c.name, slug: {_type: 'slug', current: c.slug}})
}
const CAT = {wed: 'portfolioCategory-weddings', eng: 'portfolioCategory-engagements', elo: 'portfolioCategory-elopements'}

// ── Portfolio singleton (all 17 images) ──────────────────────────────────────
const portfolioImages = [
  ['pi1', A.p27060159, 'Bride and groom portrait', [CAT.wed]],
  ['pi2', A.p13617315, 'Couple at the altar', [CAT.wed]],
  ['pi3', A.p28448620, 'Candid embrace during the ceremony', [CAT.wed]],
  ['pi4', A.p14918363, 'First dance', [CAT.wed]],
  ['pi5', A.p31629944, 'Newlyweds beneath a floral arch', [CAT.wed]],
  ['pi6', A.p11450703, 'Bride by the window', [CAT.wed]],
  ['pi7', A.p37380420, 'Bridal bouquet detail', [CAT.wed]],
  ['pi8', A.p27552558, 'Sunset couple portrait', [CAT.wed, CAT.eng]],
  ['pi9', A.p752805, 'Couple walking hand in hand', [CAT.eng]],
  ['pi10', A.p32795181, 'Couple laughing together', [CAT.eng]],
  ['pi11', A.p6679832, 'Engagement portrait outdoors', [CAT.eng]],
  ['pi12', A.s19950472, 'Tender close embrace', [CAT.eng]],
  ['pi13', A.p19681533, 'Bride and groom in window light', [CAT.elo]],
  ['pi14', A.p30657132, 'Couple silhouetted at dusk', [CAT.elo]],
  ['pi15', A.l19365954, 'Ceremony from the aisle', [CAT.wed]],
  ['pi16', A.l7777910, 'Couple embracing in evening light', [CAT.elo]],
  ['pi17', A.l9517406, 'Reception toast', [CAT.wed]],
]
docs.push({
  _id: 'portfolio', _type: 'portfolio',
  pageTitle: 'Portfolio', slug: {_type: 'slug', current: 'portfolio'},
  title: 'Portfolio', byline: 'A collection of recent weddings, engagements & elopements',
  galleryColumns: 3,
  images: portfolioImages.map(([key, id, alt, cats]) => picItem(key, id, alt, {
    title: alt,
    categories: cats.map((cid, i) => ref(cid, `${key}c${i}`)),
  })),
})

// ── Blog ──────────────────────────────────────────────────────────────────
docs.push({
  _id: 'blogPage', _type: 'blogPage',
  blogEnabled: true, pageTitle: 'Journal', slug: {_type: 'slug', current: 'blog'},
  heroImage: pic(A.l7777910, 'Couple in evening light'),
  heroEyebrow: 'The Journal',
  heroHeading: 'Notes from the field',
  heroSubtext: 'Real weddings, planning tips, and a little romance.',
  heroTextAlignment: 'center', heroTextPosition: 'center-center',
  heroHeightMode: 'tall', heroOverlayOpacity: 35,
  layout: 'list', postsPerPage: 12,
})

const blogCategories = [
  {slug: 'planning', name: 'Planning'},
  {slug: 'real-weddings', name: 'Real Weddings'},
]
for (const c of blogCategories) {
  docs.push({_id: `blogCategory-${c.slug}`, _type: 'blogCategory', name: c.name, slug: {_type: 'slug', current: c.slug}})
}

const posts = [
  {
    id: 'post-timeline', slug: 'stress-free-wedding-day-timeline',
    title: '5 Tips for a Stress-Free Wedding Day Timeline',
    date: '2026-05-20', cat: 'blogCategory-planning', cover: A.p27060159,
    excerpt: 'A relaxed wedding day starts with a thoughtful timeline. Here are the five things I tell every couple before the big day.',
    paras: [
      'A wedding day moves fast. The couples who enjoy theirs most are almost always the ones who built a little breathing room into the schedule. After photographing weddings across the Lowcountry, these are the five things I come back to again and again.',
      '1. Build in a buffer. Whatever you think hair and makeup will take, add thirty minutes. A calm morning sets the tone for the entire day.',
      '2. Photograph portraits at golden hour. The light in the hour before sunset is unmatched. We can slip away for ten minutes during the reception and come back with your favorite images of the day.',
      '3. Consider a first look. It steadies the nerves, buys us more daylight, and gives you a private moment together before the whirlwind begins.',
      '4. Assign a point person. Hand the day off to a planner or a trusted friend so neither of you is fielding questions in your gown or suit.',
      '5. Eat, and take a beat. Sit down, taste the meal you chose, and look around the room. It goes quickly — the photographs are how you get to keep it.',
    ],
  },
  {
    id: 'post-battery', slug: 'golden-hour-on-the-battery-mei-and-james',
    title: 'Golden Hour on the Battery: Mei & James',
    date: '2026-04-28', cat: 'blogCategory-real-weddings', cover: A.p31629944,
    excerpt: 'An intimate Charleston wedding that ended with the softest light on the water. A look back at one of my favorite celebrations.',
    paras: [
      'Mei and James wanted a day that felt like a long dinner party with the people they love — warm, unhurried, and full of laughter. They got exactly that.',
      'The ceremony was small and held under live oaks, with vows that had the whole crowd reaching for tissues. By the time we stepped out for portraits, the sun was low over the harbor and the entire Battery glowed.',
      'These are the evenings I live for: no rush, no shot list to race through, just two people completely at ease and a sky doing all the work for me. Congratulations, Mei & James.',
    ],
  },
  {
    id: 'post-engagement', slug: 'why-every-couple-should-have-an-engagement-session',
    title: 'Why Every Couple Should Have an Engagement Session',
    date: '2026-04-10', cat: 'blogCategory-planning', cover: A.p14918363,
    excerpt: "It's not just for save-the-dates. An engagement session is the secret to feeling completely comfortable in front of the camera on your wedding day.",
    paras: [
      "I recommend an engagement session to every couple I work with, and it has very little to do with save-the-date cards.",
      'It is a rehearsal — for all of us. You learn what it feels like to be photographed together, I learn how you interact, and by the time your wedding arrives, the camera has long since disappeared.',
      'It is also simply a beautiful excuse to document this season of your life: newly engaged, giddy, and looking forward to everything ahead. Years from now, those images will mean just as much as the wedding ones.',
    ],
  },
]
for (const p of posts) {
  docs.push({
    _id: p.id, _type: 'blogPost',
    title: p.title, slug: {_type: 'slug', current: p.slug},
    publishDate: p.date, excerpt: p.excerpt,
    coverImage: pic(p.cover, p.title),
    categories: [ref(p.cat, 'pc1')],
    body: bodyText(...p.paras),
  })
}

// ── About page ───────────────────────────────────────────────────────────────
docs.push({
  _id: ID.about, _type: 'page',
  title: 'About', slug: {_type: 'slug', current: 'about'}, navThemeOverHero: 'auto',
  sections: [
    sectionBase({
      _key: 'aboutIntro', _type: 'splitSection',
      imageLayout: 'image-left',
      eyebrow: 'Meet the photographer',
      heading: "Hi, I'm Adeline",
      body: bodyText(
        "I'm a fine art wedding photographer based in Charleston, South Carolina, drawn to soft light, real emotion, and the kind of photographs that still feel honest decades later.",
        "I've spent the last eight years learning that the best images are never the ones I force. They're the ones I notice — a glance, a laugh, a tear quickly wiped away. My job is to be present enough to catch them.",
      ),
      image: pic(A.p6679832, 'Photographer Adeline Wren'),
      textAlignment: 'left',
    }),
    sectionBase({
      _key: 'aboutBelieve', _type: 'threeColumnSection',
      backgroundTone: 'alt',
      verticalSideLabel: 'My Approach',
      eyebrow: 'What I believe',
      variant: 'image-cards',
      alignment: 'left',
      columns: [
        {_key: 'ab1', _type: 'columnItem', image: pic(A.p28448620, 'A calm, candid moment'), title: 'Calm & Unhurried', body: bodyText('Your day should feel like yours. I work quietly and a step ahead, so you never feel managed or rushed.')},
        {_key: 'ab2', _type: 'columnItem', image: pic(A.p32795181, 'A couple laughing together'), title: 'Led by Connection', body: bodyText('The best photographs come from real ease. I take time to know you so what we make together feels personal, never generic.')},
        {_key: 'ab3', _type: 'columnItem', image: pic(A.p27552558, 'A timeless sunset portrait'), title: 'Timeless, Not Trendy', body: bodyText('I edit for images that age gracefully — warm, natural, and true to the day, long after trends have passed.')},
      ],
    }),
    sectionBase({
      _key: 'aboutPersonal', _type: 'splitSection',
      imageLayout: 'image-right',
      heading: 'A little more about me',
      body: bodyText(
        'When I\'m not behind the camera, you\'ll find me chasing good light on long walks, collecting film cameras I don\'t need, and planning the next trip with my own favorite person.',
        'Photography taught me to slow down and pay attention — and that\'s the gift I hope to give back to every couple I work with.',
      ),
      image: pic(A.p30657132, 'Adeline at work during golden hour'),
      textAlignment: 'left',
    }),
    sectionBase({
      _key: 'aboutQuote', _type: 'pullQuoteSection',
      quote: 'I believe photographs should feel honest, timeless, and entirely your own.',
      variant: 'centered',
    }),
    sectionBase({
      _key: 'aboutGallery', _type: 'galleryGridSection',
      backgroundTone: 'default',
      eyebrow: 'A few favorites',
      layout: 'grid-3', gap: 'normal', lightbox: true,
      images: [
        picItem('ag1', A.p11450703, 'Bride by the window'),
        picItem('ag2', A.p31629944, 'Newlyweds beneath florals'),
        picItem('ag3', A.p37380420, 'Bouquet detail'),
        picItem('ag4', A.l9517406, 'Reception toast'),
        picItem('ag5', A.p752805, 'Couple walking together'),
        picItem('ag6', A.p13617315, 'Couple at the altar'),
      ],
    }),
    sectionBase({
      _key: 'aboutCta', _type: 'ctaBandSection',
      backgroundTone: 'alt',
      layout: 'overlapping-images',
      heading: "Let's tell your story",
      body: "If this sounds like the kind of photography you've been hoping for, I'd love to hear from you.",
      ctaText: 'Get In Touch',
      ctaLink: ctaInternal(ID.contact),
      caption: 'Charleston & beyond',
      backgroundImage: pic(A.p27060159, 'A couple on their wedding day'),
    }),
  ],
})

// ── Experience page ────────────────────────────────────────────────────────────
docs.push({
  _id: ID.experience, _type: 'page',
  title: 'Experience', slug: {_type: 'slug', current: 'experience'}, navThemeOverHero: 'auto',
  sections: [
    sectionBase({
      _key: 'expHero', _type: 'heroSection',
      variant: 'image-full',
      images: [picItem('eh1', A.l9517406, 'Newlyweds in golden light')],
      eyebrow: 'The Experience',
      heading: 'Thoughtful from\nstart to finish',
      subheading: 'What working together looks like, from your first inquiry to your finished album.',
      heightMode: 'tall', textAlignment: 'center', textPosition: 'center-center',
      overlayOpacity: 40, stickyBackground: true,
    }),
    sectionBase({
      _key: 'expIntro', _type: 'richTextSection',
      body: bodyText(
        'Every wedding I photograph is built around the same belief: the day should feel like yours, and the photographs should feel like you. From our first conversation to the moment your gallery arrives, you are guided through each step so the whole experience feels calm and genuinely enjoyable.',
        'There is no rigid shot list and no pressure to perform — only space for real moments to happen, and someone there to catch them.',
      ),
      maxWidth: 'narrow', textAlignment: 'center',
    }),
    sectionBase({
      _key: 'expSteps', _type: 'stepsSection',
      backgroundTone: 'alt',
      eyebrow: 'How it works',
      heading: 'Four simple steps',
      gridColumns: 4,
      steps: [
        {_key: 'es1', _type: 'stepItem', stepNumber: '01', title: 'Inquire', body: bodyText('Reach out with your date and a little about your day. I reply within 24–48 hours.')},
        {_key: 'es2', _type: 'stepItem', stepNumber: '02', title: 'Plan', body: bodyText('We build your timeline together and, if you\'d like, meet for an engagement session.')},
        {_key: 'es3', _type: 'stepItem', stepNumber: '03', title: 'Celebrate', body: bodyText('On the day, I document everything quietly so you can stay fully present.')},
        {_key: 'es4', _type: 'stepItem', stepNumber: '04', title: 'Relive', body: bodyText('Weeks later, your hand-edited gallery and optional heirloom album arrive.')},
      ],
    }),
    sectionBase({
      _key: 'expCollections', _type: 'threeColumnSection',
      backgroundTone: 'default',
      eyebrow: 'Collections',
      heading: 'Ways to work together',
      variant: 'image-cards',
      alignment: 'left',
      columns: [
        {_key: 'ec1', _type: 'columnItem', image: pic(A.p19681533, 'An intimate elopement'), title: 'The Elopement', body: bodyText('Up to four hours of coverage for intimate ceremonies and just-the-two-of-you days. Investment from $2,800.')},
        {_key: 'ec2', _type: 'columnItem', image: pic(A.p14918363, 'A half-day celebration'), title: 'The Half Day', body: bodyText('Six hours of coverage for smaller weddings — ceremony through the first dances. Investment from $4,200.')},
        {_key: 'ec3', _type: 'columnItem', image: pic(A.p31629944, 'A full wedding day'), title: 'The Full Day', body: bodyText('Up to ten hours, a second photographer, and a complete gallery. Investment from $6,500.')},
      ],
    }),
    sectionBase({
      _key: 'expStatement', _type: 'fullBleedImageSection',
      image: pic(A.l7777910, 'A couple embracing at dusk'),
      textContainer: 'overlay-card', cardPlacement: 'right',
      eyebrow: 'Heirloom Albums',
      heading: 'Made to be held',
      body: bodyText('Every collection can include a hand-designed, linen-bound album — the kind your children will one day pull off the shelf.'),
      ctaText: 'Start Your Inquiry', ctaLink: ctaInternal(ID.contact),
      height: 'medium', overlayOpacity: 40,
    }),
    sectionBase({
      _key: 'expFaq', _type: 'faqSection',
      backgroundTone: 'alt',
      heading: 'Common Questions',
      layout: 'accordion', showSchema: true,
      faqs: [
        {_key: 'ef1', _type: 'faqItem', question: 'Do you have a second photographer?', answer: bodyText('Yes — a second photographer is included with the Full Day collection and available as an add-on for the others.')},
        {_key: 'ef2', _type: 'faqItem', question: 'When will we get our photos?', answer: bodyText('Sneak peeks within one week, and your full gallery within six weeks of the wedding.')},
        {_key: 'ef3', _type: 'faqItem', question: 'Do you help with the timeline?', answer: bodyText('Always. Building a relaxed, photo-friendly timeline together is one of my favorite parts of the planning process.')},
        {_key: 'ef4', _type: 'faqItem', question: 'What if it rains?', answer: bodyText("Some of my favorite images happen under umbrellas. We'll have a backup plan, and I promise your day will still be beautiful.")},
      ],
    }),
    sectionBase({
      _key: 'expCta', _type: 'ctaBandSection',
      backgroundTone: 'dark',
      layout: 'centered',
      heading: 'Tell me about your day',
      body: 'I take a limited number of weddings each year. Reach out to check your date.',
      ctaText: 'Inquire',
      ctaLink: ctaInternal(ID.contact),
    }),
  ],
})

// ── Inquire page (contact) ────────────────────────────────────────────────────
docs.push({
  _id: ID.contact, _type: 'page',
  title: 'Inquire', slug: {_type: 'slug', current: 'inquire'}, navThemeOverHero: 'auto',
  sections: [
    sectionBase({
      _key: 'inqHero', _type: 'heroSection',
      variant: 'image-full',
      images: [picItem('ih1', A.p19681533, 'Bride and groom in soft light')],
      eyebrow: "Let's begin",
      heading: 'Inquire',
      subheading: "Tell me about your day and what you're dreaming up — I'll get back to you within 24–48 hours.",
      heightMode: 'tall', textAlignment: 'center', textPosition: 'center-center',
      overlayOpacity: 42,
    }),
    sectionBase({
      _key: 'inqForm', _type: 'contactFormSection',
      heading: "I can't wait to hear from you",
      body: bodyText("Prefer email? Reach me directly at hello@wrenandivyphoto.com or find me on Instagram @wrenandivyphoto."),
      mode: 'built-in',
      submitText: 'Send Inquiry',
      successMessage: "Thank you — your inquiry is on its way! I'll be in touch within 24–48 hours.",
      errorMessage: 'Something went wrong. Please try again or email hello@wrenandivyphoto.com directly.',
      formFields: [
        {_key: 'in1', _type: 'formField', name: 'name', label: 'Your Name', type: 'text', required: true},
        {_key: 'in2', _type: 'formField', name: 'partner', label: "Partner's Name", type: 'text', required: false},
        {_key: 'in3', _type: 'formField', name: 'email', label: 'Email', type: 'email', required: true},
        {_key: 'in4', _type: 'formField', name: 'wedding_date', label: 'Wedding Date (or approximate)', type: 'text', required: false},
        {_key: 'in5', _type: 'formField', name: 'venue', label: 'Venue or Location', type: 'text', required: false},
        {_key: 'in6', _type: 'formField', name: 'message', label: 'Tell me about your day', type: 'textarea', required: true},
      ],
    }),
    sectionBase({
      _key: 'inqInfo', _type: 'contactInfoSection',
      backgroundTone: 'alt',
      heading: 'Other ways to reach me',
      layout: 'card',
      showEmail: true, emailOverride: 'hello@wrenandivyphoto.com',
      showPhone: true, phoneOverride: '(843) 555-0142',
      showSocial: true, showMap: false,
    }),
  ],
})

// ── 404 ──────────────────────────────────────────────────────────────────────
docs.push({
  _id: 'notFoundPage', _type: 'notFoundPage',
  sections: [
    sectionBase({
      _key: 'nf1', _type: 'fullBleedImageSection',
      image: pic(A.l7777910, 'A couple in soft evening light'),
      heading: '404',
      body: bodyText('This page seems to have wandered off. Let\'s get you back to the good stuff.'),
      ctaText: 'Back to Home',
      ctaLink: ctaInternal(ID.home),
      textContainer: 'overlay-card',
      height: 'viewport', overlayOpacity: 50,
    }),
  ],
})

// ── Run ────────────────────────────────────────────────────────────────────────
const KEEP_PAGES = [ID.about, ID.experience, ID.contact]
const KEEP_TESTIMONIALS = testimonials.map((t) => t.id)
const KEEP_PCATS = portfolioCategories.map((c) => `portfolioCategory-${c.slug}`)
const KEEP_BCATS = blogCategories.map((c) => `blogCategory-${c.slug}`)
const KEEP_POSTS = posts.map((p) => p.id)

async function main() {
  console.log(`\n=== wedding-overlay → boa9509d/production (${APPLY ? 'APPLY' : 'DRY RUN'}) ===\n`)

  // Identify cruft to delete
  const drafts = await client.fetch(`*[_id in path("drafts.**")]._id`)
  const strayPages = await client.fetch(`*[_type == "page" && !(_id in $keep)]._id`, {keep: KEEP_PAGES})
  const strayTest = await client.fetch(`*[_type == "testimonial" && !(_id in $keep)]._id`, {keep: KEEP_TESTIMONIALS})
  const strayPCat = await client.fetch(`*[_type == "portfolioCategory" && !(_id in $keep)]._id`, {keep: KEEP_PCATS})
  const strayBCat = await client.fetch(`*[_type == "blogCategory" && !(_id in $keep)]._id`, {keep: KEEP_BCATS})
  const strayPosts = await client.fetch(`*[_type == "blogPost" && !(_id in $keep)]._id`, {keep: KEEP_POSTS})
  const toDelete = [...new Set([...drafts, ...strayPages, ...strayTest, ...strayPCat, ...strayBCat, ...strayPosts])]

  console.log(`Docs to write:  ${docs.length}`)
  docs.forEach((d) => console.log(`  + ${d._type.padEnd(22)} ${d._id}`))
  console.log(`\nDocs to delete: ${toDelete.length}`)
  toDelete.forEach((id) => console.log(`  - ${id}`))

  if (!APPLY) {
    console.log('\n(dry run — re-run with `-- --apply` to commit)\n')
    return
  }

  // Write in a single transaction-ish batch
  let tx = client.transaction()
  for (const d of docs) tx = tx.createOrReplace(d)
  await tx.commit({visibility: 'async'})
  console.log(`\n✓ wrote ${docs.length} docs`)

  if (toDelete.length) {
    let dtx = client.transaction()
    for (const id of toDelete) dtx = dtx.delete(id)
    await dtx.commit({visibility: 'async'})
    console.log(`✓ deleted ${toDelete.length} cruft docs`)
  }
  if (PURGE_ASSETS) {
    const orphans = await client.fetch(`*[_type=="sanity.imageAsset" && count(*[references(^._id)])==0]._id`)
    console.log(`\nOrphan assets to purge: ${orphans.length}`)
    let atx = client.transaction()
    for (const id of orphans) atx = atx.delete(id)
    if (orphans.length) await atx.commit({visibility: 'async'})
    console.log(`✓ purged ${orphans.length} unreferenced assets`)
  }

  console.log('\nDone.\n')
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
