// Rebuild every remaining Heidi Adler page from her real Squarespace copy.
//
// The donor seed left generic scaffold that the overlay only partially
// replaced. Measured against her live site (fetched 2026-07-31):
//
//   page                     hers      in Sanity   gap
//   about-me                 1315ch    2638ch      donor copy mixed in
//   faqs                     1436ch    1244ch      missing FAQs
//   session                  1808ch    1397ch      ~23% missing
//   productsandpricing       2910ch    1171ch      ~60% missing
//   tails-of-sonoma-county   3094ch     810ch      ~74% missing
//   tails-of-the-world       3374ch     794ch      ~76% missing
//   portfolio                -          -          titled "Dogs | Pet
//                                                  Photographer Site", plus
//                                                  an empty donor "Cats" tab
//
// Every string below is transcribed verbatim from her live pages. Nothing is
// invented or paraphrased. Donor stock photos are swapped for her own work.
//
// Run:
//   cd studio && npx dotenv -e .env.heidi-adler-photography-backup -- \
//     npx sanity exec scripts/migrations/heidi-all-pages-rebuild.js \
//     --with-user-token -- --slug=heidi-adler-photography --apply

import {getCliClient} from 'sanity/cli'
import fs from 'node:fs'
import path from 'node:path'

const client = getCliClient({apiVersion: '2024-01-01'})
const APPLY = process.argv.includes('--apply')
const slug =
  (process.argv.find((a) => a.startsWith('--slug=')) || '').split('=')[1] || ''

function assertProject() {
  if (!slug) throw new Error('Missing --slug=<slug>')
  const envPath = path.resolve(process.cwd(), `.env.${slug}-backup`)
  const m = fs.readFileSync(envPath, 'utf8').match(/^SANITY_STUDIO_PROJECT_ID=(.*)$/m)
  const expected = m && m[1].trim()
  const actual = client.config().projectId
  if (!expected) throw new Error(`No SANITY_STUDIO_PROJECT_ID in ${envPath}`)
  if (expected !== actual) {
    throw new Error(
      `Refusing to write: --slug=${slug} expects project ${expected}, ` +
        `but the active client is ${actual}. Check studio/.env.`,
    )
  }
  return actual
}

// ── her photographs (all donor stock replaced) ─────────────────────────────
const P = {
  heidiJack: 'image-0021445856b3f6d7ac6f7f8632cb4b1f51832e94-1366x2048-webp',
  aussie: 'image-02078d6fad15d2c034337326445aa381998dc655-2048x1502-webp',
  threeDogs: 'image-00d8c52016e4e81addfa4fc72f3ac2ecfd17f0b6-2450x1633-webp',
  bridge: 'image-062710758b4c3cb1fa831beb1bfb646d3d3e60e7-2048x1365-webp',
  golden: 'image-07191ce2283c29c45cd06961e3da524261e6d756-2048x1638-webp',
  labPuppy: 'image-154cf1dba48086da355ebc718f95ac80de9e04ec-2048x1493-webp',
  bernadoodle: 'image-1b1f69e204413a176ca0c57ac13d895c1da65fe9-2048x1463-webp',
  shepherd: 'image-360e8d2b3f6dba927207dc155fd6ac6c6cb31b07-2450x2450-webp',
  goldenPup: 'image-4007bae304aa38ffde16c6261653e7a845055c9a-1609x2048-webp',
  lab: 'image-1a0d0581116a0b3071b43c6bd5118cf1d720f102-2048x1365-webp',
}

let _k = 0
const key = (p) => `${p}${++_k}`
const img = (ref, alt) => ({
  _type: 'image',
  asset: {_type: 'reference', _ref: ref},
  ...(alt ? {alt} : {}),
})
// portable text from an array of paragraph strings
const body = (paras) =>
  paras.map((text) => {
    const k = key('b')
    return {
      _key: k,
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [{_key: k + 's', _type: 'span', marks: [], text}],
    }
  })
const link = (id) => ({
  _type: 'ctaLink',
  type: 'internal',
  internal: {_type: 'reference', _ref: id, _weak: true},
})
const extLink = (href) => ({_type: 'ctaLink', type: 'external', url: href})

const rich = (k, {eyebrow, heading, paras, ctaText, ctaLink, maxWidth}) => ({
  _key: k,
  _type: 'richTextSection',
  enabled: true,
  ...(eyebrow ? {eyebrow} : {}),
  ...(heading ? {heading} : {}),
  body: body(paras),
  ...(ctaText ? {ctaText} : {}),
  ...(ctaLink ? {ctaLink} : {}),
  ...(maxWidth ? {maxWidth} : {}),
})

const split = (k, {heading, paras, image, imageLayout, ctaText, ctaLink, eyebrow}) => ({
  _key: k,
  _type: 'splitSection',
  enabled: true,
  ...(eyebrow ? {eyebrow} : {}),
  ...(heading ? {heading} : {}),
  body: body(paras),
  image,
  imageLayout: imageLayout || 'left',
  ...(ctaText ? {ctaText} : {}),
  ...(ctaLink ? {ctaLink} : {}),
})

const threeCol = (k, {eyebrow, heading, columns}) => ({
  _key: k,
  _type: 'threeColumnSection',
  enabled: true,
  ...(eyebrow ? {eyebrow} : {}),
  ...(heading ? {heading} : {}),
  columns: columns.map(([title, text]) => ({
    _key: key('c'),
    _type: 'columnItem',
    hideMedia: true,
    title,
    body: body([text]),
  })),
})

const ctaBand = (k, {heading, text, ctaText, ctaLink, bg}) => ({
  _key: k,
  _type: 'ctaBandSection',
  enabled: true,
  heading,
  ...(text ? {body: text} : {}),
  ctaText,
  ctaLink,
  ...(bg ? {backgroundImage: img(bg)} : {}),
})

// ═══════════════════════════════════════════════════════════════════════════
// ABOUT — her copy, verbatim
// ═══════════════════════════════════════════════════════════════════════════
const ABOUT = [
  split('aboutIntro', {
    eyebrow: 'Meet your Photographer',
    heading: 'Heidi and Jack here,',
    paras: [
      'You can usually find me covered in pet hair for the best of reasons, capturing your pet’s distinctive personality in an artistic photograph to be treasured for your lifetime.',
      'Whether it’s a portrait or action shot, serious or silly, my images capture a pet’s boundless energy, endless joy and unique expressions; that look in their eyes, the way their ears perk up, that adorable head tilt—together we will capture what you love most about your pet.',
      'I cherish my pets, as you do yours. I would love to memorialize the special bond you share.',
    ],
    image: img(P.heidiJack, 'Heidi Adler and her dog Jack'),
    imageLayout: 'right',
  }),
  threeCol('aboutDifferent', {
    eyebrow: 'I know you have choices for your pet’s photographer. . .',
    heading: 'Here’s how I’m different',
    columns: [
      [
        'Pets are the beating heart of my business',
        'I’m a pet photographer first and foremost, meaning not only do I know ALL the tricks to create incredible photos with four-legged subjects, I’ll also love and adore your precious animals too!',
      ],
      [
        'We create art',
        'Our primary focus is creating tangible, beautiful artwork that will bring you joy for years to come!',
      ],
      [
        'Count on quality!',
        'Handcrafted in Germany or framed with authentically weathered Vermont barn wood, rest assured that your artwork comes from the best artisans in the business.',
      ],
    ],
  }),
  ctaBand('aboutCta', {
    heading: 'Ready to create artwork of your best friend?',
    ctaText: 'Get in touch',
    ctaLink: link('pageContact'),
    bg: P.golden,
  }),
]

// ═══════════════════════════════════════════════════════════════════════════
// FAQS — all six of hers, verbatim
// ═══════════════════════════════════════════════════════════════════════════
const FAQS = [
  [
    'What if my dog wont sit still?',
    'It’s okay! We will still get the shot. I photograph hyper, untrained dogs all the time and guarantee we’ll get the images you love, or your money back!',
  ],
  [
    'What if my dog needs to stay on leash?',
    'All the cool kids are wearing them! As your dog’s safety is of the utmost importance, leashes are required for all sessions. But don’t worry, with a little photoshop magic, they will be removed from your final images.',
  ],
  [
    'What if my dog is a bit anxious?',
    'Don’t worry about that, I have anxious dogs too. We don’t force your dog to do anything, we just work at their pace so they feel comfortable and have a good time!',
  ],
  [
    'What should I bring to my session?',
    'Your dog of course! Small, bite-sized treats and their favorite toys. A flat collar for the photos if your dog needs to walk on a leash. A positive attitude! We are here to have fun!',
  ],
  [
    'Can I be in the images too?',
    'Absolutely! I love capturing the special bond between a dog and their people. You don’t have to be in them, but I definitely recommend jumping in for a few.',
  ],
  [
    'This sounds great! How do I book?',
    'You can easily book your session through the button below. Or give me a call at 707-395-7762 or email at heidi@heidiadlerphotography.com',
  ],
]

const FAQ_PAGE = [
  {
    _key: 'faqsMain',
    _type: 'faqSection',
    enabled: true,
    heading: 'FAQs',
    showSchema: true,
    faqs: FAQS.map(([question, answer]) => ({
      _key: key('q'),
      _type: 'faqItem',
      question,
      answer: body([answer]),
    })),
  },
  ctaBand('faqsCta', {
    heading: 'Ready?',
    ctaText: 'Book your session',
    ctaLink: link('page-session'),
    bg: P.labPuppy,
  }),
]

// ═══════════════════════════════════════════════════════════════════════════
// SESSION — her copy, verbatim
// ═══════════════════════════════════════════════════════════════════════════
const SESSION = [
  rich('sessIntro', {
    heading: 'Session Information',
    paras: [
      'Whether your pet is an exuberant puppy, a highly trained service dog, or somewhere in between, we will create a session where you and your pet feel comfortable, relaxed, and most importantly we are going to have so much fun!',
      'My goal is to create a low-stress, no-pressure session where all your dog needs to do is, well….be a dog. Serious or silly, follows commands, or runs around being goofy. . . we will create images that capture your dog’s wonderful personality.',
    ],
  }),
  split('sessDetails', {
    eyebrow: 'The Details',
    heading: '$499 RESERVATION RETAINER',
    paras: [
      'What does this include?',
      '– Product Credit in the amount paid at booking',
      '– Artwork planning + design assistance',
      '– A private on-location photography session',
      '– Guided image selection and ordering appointment',
      '– Custom online gallery for your purchased images',
      '– Artwork delivered directly to your home',
    ],
    image: img(P.aussie, 'Australian shepherd photographed in Sonoma County'),
    imageLayout: 'right',
  }),
  rich('sessLocations', {
    heading: 'Locations?',
    paras: [
      'Most of our sessions take place at our picturesque 7-acre property located in Sonoma County. We have both studio and outdoor options available.',
      'We also offer sessions at dog friendly beaches, local parks, and downtown urban areas...the options are endless in this beautiful place we call home.',
      'If you aren’t sure where you would like your session to take place we will work together to find a place that will be just right for what you are looking for.',
    ],
    ctaText: 'Book your session',
    ctaLink: link('pageContact'),
  }),
  threeCol('sessArtwork', {
    eyebrow: 'The Artwork',
    columns: [
      ['Albums & Folio Boxes', 'Starting at $1095'],
      ['Wall Art', 'Single pieces starting at $495'],
      ['Desktop Art', 'Starting at $515'],
    ],
  }),
  rich('sessFinePrint', {
    paras: [
      'The Session Fee is non-refundable and collected at the time your session is reserved. The Creation Fee does not include any photos or artwork. Most clients choose to spend around $1,500 on their pet’s photography experience.',
    ],
  }),
]

// ═══════════════════════════════════════════════════════════════════════════
// INVESTMENT (her /productsandpricing) — verbatim
// ═══════════════════════════════════════════════════════════════════════════
const INVESTMENT = [
  rich('invIntro', {
    heading: 'Products & Pricing',
    paras: [
      'There are so many beautiful ways to enjoy your images, and we are proud to offer a carefully chosen collection of handcrafted, high-quality products. We work with some of the very best labs in the industry to make sure everything we offer is something we would be proud to have in our own homes.',
      'Print bundles begin at $395 and wall art starts at $495. Your final investment depends on how many images you fall in love with and how you’d like to display them.',
      'The best part? You only purchase what you truly love—no pressure, ever.',
    ],
  }),
  split('invAddOns', {
    heading: 'Boutique Add-Ons',
    paras: [
      'These smaller pieces are perfect for capturing the little moments that make your story whole. While they can stand alone, they really shine when paired with wall art, albums, or folio boxes. Think of them as the perfect finishing touches.',
      'Available in collections or on their own, starting at $295.',
    ],
    image: img(P.labPuppy, 'Labrador retriever puppy portrait'),
    imageLayout: 'left',
  }),
  split('invWallArt', {
    heading: 'Wall Art',
    paras: [
      'Wall art is the most popular way clients enjoy their images—displayed where they can be seen and loved every day. You can choose from beautifully crafted reclaimed wood frames, rustic barnwood rounds, vibrant canvas wraps with rich, textured finishes, or sleek metal prints that add a modern touch with vivid color and durability.',
      'Each piece is made to showcase your images with timeless style and quality, perfectly suited to your home décor.',
      'Wall art is available in all collections or a la carte, starting at $495.',
    ],
    image: img(P.bernadoodle, 'Bernedoodle portrait by Heidi Adler Photography'),
    imageLayout: 'right',
  }),
  split('invFolio', {
    heading: 'Heirloom Folio Box',
    paras: [
      'A beautiful and versatile way to showcase your favorite images. Whether displayed on a shelf or coffee table, the acrylic folio box is a stunning piece on its own.',
      'Each one features a striking cover image and holds a curated set of matted prints you’ll want to revisit again and again. Includes matching high-res digital files. Starting at $795.',
    ],
    image: img(P.shepherd, 'German shepherd photographed in Sebastopol, California'),
    imageLayout: 'left',
  }),
  split('invCollections', {
    heading: 'Signature Collections',
    paras: [
      'Sometimes, choosing just a few portraits isn’t enough—there are too many favorites! That’s where our Signature Collections come in, offering a simple way to enjoy a curated selection of your favorite images.',
      'From striking wall art to heirloom folio boxes and other keepsakes, these collections bring your memories to life beautifully.',
      'Starting at $1,295 each Signature Collection also includes high-resolution digital files of all the images featured.',
    ],
    image: img(P.goldenPup, 'Golden retriever puppy portrait'),
    imageLayout: 'right',
  }),
  split('invAlbums', {
    heading: 'Fine Art Albums',
    paras: [
      'Fine art albums are a favorite for telling the full story of your session. Each one begins with 20 images, thoughtfully designed across seamless, lay-flat pages that feel as beautiful as they look.',
      'The album features a custom image cover and comes in a coordinating decorative box—perfect for safekeeping and display.',
      'Albums are included in the Artisan Collection or available on their own starting at $1,895, and include matching high-res digital files of the images inside.',
    ],
    image: img(P.lab, 'Labrador retriever portrait by Heidi Adler Photography'),
    imageLayout: 'left',
  }),
  ctaBand('invCta', {
    heading: 'Ready to create artwork of your best friend?',
    ctaText: 'Get in touch',
    ctaLink: link('pageContact'),
    bg: P.bridge,
  }),
]

// ═══════════════════════════════════════════════════════════════════════════
// TAILS OF SONOMA COUNTY — verbatim
// ═══════════════════════════════════════════════════════════════════════════
const TAILS_SONOMA = [
  rich('tscIntro', {
    eyebrow: 'Calling All Sonoma County Dogs!',
    heading: 'Tails of Sonoma County',
    paras: [
      'We are looking for 25 dogs to be featured in Tails of Sonoma County — a limited edition coffee table book celebrating the dogs who fill our lives with happiness, companionship, and unconditional love. This book is dedicated to supporting the lifesaving work of Dogwood Animal Rescue Project.',
      'The portraits in Tails of Sonoma County will capture the very heart of what it means to love a dog––the quiet moments, the joyful energy, the deep bond we share … images that are full of heart and bursting with personality, all photographed in beautiful Sonoma County.',
    ],
  }),
  threeCol('tscWhy', {
    heading: 'WHY APPLY?',
    columns: [
      [
        'Celebrate your dog',
        'Celebrate your dog with a portrait session with Heidi Adler, an internationally award-winning pet photographer.',
      ],
      [
        'Be featured',
        'Be featured in a limited edition coffee table book alongside 24 other amazing dogs. Create lasting memories and a keepsake you’ll treasure forever.',
      ],
      [
        'Make a difference',
        '100% of book sales from Tails of Sonoma County will benefit Dogwood Animal Rescue Project, a volunteer-driven nonprofit dedicated to rescuing, rehabilitating, and rehoming animals in need.',
      ],
    ],
  }),
  rich('tscDogwood', {
    paras: [
      'Through their life-saving programs, Dogwood provides critical medical care, safe shelter, and loving new homes to hundreds of animals each year. Their commitment to spay and neuter initiatives and funding thousands of surgeries annually—helps prevent overpopulation and improves the welfare of pets and community animals across California.',
      'By supporting this project, you’re helping Dogwood continue its mission to give every animal a chance at a healthier, happier life.',
    ],
  }),
  split('tscDetails', {
    heading: 'THE DETAILS:',
    paras: [
      'All Sonoma County Dogs are welcome to apply!',
      'A $100 registration fee* includes your custom pet photography session with Heidi Adler Photography to create beautiful artwork of your dog and a two-image feature in Tails of Sonoma County.',
      '50% of the registration fee and 100% of book sales go directly to Dogwood Animal Rescue Project.',
      'Book project sessions will take place at scenic locations throughout Sonoma County.',
      '*Your registration fee does not include any digital files, prints, or products. Prints and products, which start at $395, are purchased separately at your ordering appointment. No fee is due unless your application is formally accepted for this project.',
    ],
    image: img(P.threeDogs, 'Three dogs photographed in Windsor, California'),
    imageLayout: 'right',
  }),
  rich('tscAbout', {
    heading: 'About Dogwood Animal Rescue Project',
    paras: [
      'Dogwood Animal Rescue Project is a foster-based, mostly volunteer non-profit rescue organization focused on the rescue and placement of animals into safe, nurturing homes. They work to provide necessary medical care, ongoing spay/neuter clinics, hands-on nurturing, and placement of the homeless animals of Sonoma County and beyond.',
      'Dogwood is continually striving to successfully fulfill their vision to establish programs tailored to assist animals in need by ensuring they find safe, loving homes and receive the medical care necessary to live long and healthy lives.',
    ],
    ctaText: 'Learn more about Dogwood Animal Rescue Project',
    ctaLink: extLink('https://dogwoodanimalrescue.org/'),
  }),
  {
    _key: 'tscClosed',
    _type: 'pullQuoteSection',
    enabled: true,
    quote: 'Applications Closed',
    variant: 'centered',
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// TAILS OF THE WORLD — verbatim
// ═══════════════════════════════════════════════════════════════════════════
const TAILS_WORLD = [
  rich('twIntro', {
    eyebrow: 'Calling All Sonoma Wine Country Dogs!',
    heading: 'TAILS OF THE WORLD: Sonoma Wine Country Dogs',
    paras: [
      'We need you! We are looking for 10 extraordinary dogs to feature in the Tails of the World Collective’s upcoming fundraiser coffee table book, “Tails of the World: Volume Three.” This gorgeous collector’s edition will showcase professional photographs of dogs from around the globe, with all proceeds from session fees and book sales generously donated to both local and worldwide animal charities.',
      'Each year, our community of professional pet photographers comes together with a shared mission: to raise funds for animal rescue. Since the inception of Tails of the World, we have proudly featured over 1,150 dogs and raised more than $95,000 for this vital cause.',
      'In 2024, we have set an ambitious goal to raise $70,000 with “Tails of the World: Volume Three.” To achieve this, we need your help to find a diverse group of dogs whose stories and spirits will inspire and captivate our audience. Whether they are therapy dogs, rescue dogs, adventure companions, or cherished pets, we want to celebrate the unique bond between these dogs and their humans, and the remarkable roles they play in our lives.',
      'Heidi Adler Photography has been selected as the official 2024 Tails of the World: Sonoma Wine Country photographer and we are now taking applications for Limited Edition photo sessions. These sessions will take place in the heart of Sonoma Wine Country, capturing our gorgeous hills, vineyards and coastline.',
    ],
  }),
  split('twCharity', {
    heading: 'Who does this Fundraiser Support?',
    paras: [
      'Dogwood Animal Rescue Project is a volunteer-led non-profit animal rescue organization located in Sonoma County, California. Their mission is to support animals and the people who love them through rescue, rehoming, spay/neuter and education.',
    ],
    image: img(P.bridge, 'Dog photographed on a bridge in Sonoma County'),
    imageLayout: 'left',
    ctaText: 'Learn more about Dogwood Animal Rescue Project',
    ctaLink: extLink('https://dogwoodanimalrescue.org/'),
  }),
  rich('twWho', {
    heading: 'Who Can Enter',
    paras: [
      'If you are interested in having your dog featured in the book, fill out an application here to be considered for the project. The 10 dogs who are selected from the applicants will pay a $100 registration fee, which will be donated to our charity partner, Dogwood Animal Rescue Project, to help with their life-saving efforts. All Sonoma County dogs are welcome to apply!',
      'Here is what is included:',
      '~ Personalized planning consultation to prepare for your session.',
      '~ 20 minute Limited Edition book project photography session to be held throughout June, July and August at select Sonoma County locations.',
      '~ One image is guaranteed to be featured in Tails of the World: Volume Three!',
      '~ An image reveal appointment to view the best images from your session and purchase artwork (if desired).',
      'Prints, wall art, digitals & other products are not included, but will be available to purchase after our photo session. A social media sized digital is included with any artwork purchase.',
      'Upgrade to a full 60-minute session for only $99 more and receive $200 artwork credit.',
    ],
  }),
  rich('twCharityInfo', {
    heading: 'Charity Info',
    paras: [
      'Tails of the World: Volume 3 will be designed and professionally printed by the founder of the project, Caitlin J. McColl, and will be available for purchase in December 2024. All book sale proceeds are donated to Geelong Animal Welfare Society.',
      'To learn more about this charity go to: tailsoftheworld.com/charity',
    ],
  }),
  {
    _key: 'twClosed',
    _type: 'pullQuoteSection',
    enabled: true,
    quote: 'Applications Closed',
    variant: 'centered',
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// CONTACT — her copy + her real service areas
// ═══════════════════════════════════════════════════════════════════════════
const CONTACT = [
  rich('contactIntro', {
    heading: 'Contact Heidi',
    paras: [
      'Ready to schedule your custom pet photography session? Want to learn more about the Heidi Adler Photography experience, product availability, and pricing?',
      'Fill out the form below and I’ll be in touch!',
      'Serving the pets and people of: North Bay (San Francisco Bay Area), Sonoma County, Marin County, Napa County.',
    ],
  }),
]

const PAGE_SEO = {
  pageAbout: ['About Heidi', 'Meet Heidi Adler — an award-winning pet photographer based in Sonoma County Wine Country, creating artwork of dogs and the people who love them.'],
  pageContact: ['Contact', 'Get in touch to schedule a custom pet photography session in Sonoma, Napa, Marin and the North Bay.'],
  'page-faqs': ['FAQs', 'Answers to the most common questions about pet photography sessions with Heidi Adler Photography.'],
  'page-session': ['Session Information', 'What a custom pet photography session with Heidi Adler includes, where we shoot, and what to expect.'],
  'page-investment': ['Investment', 'Products and pricing for Heidi Adler Photography — wall art, albums, folio boxes and signature collections.'],
  'page-tails-of-sonoma-county': ['Tails of Sonoma County', 'A limited edition coffee table book benefiting Dogwood Animal Rescue Project.'],
  'page-tails-of-the-world': ['Tails of the World', 'Sonoma Wine Country dogs featured in the Tails of the World Volume Three fundraiser book.'],
}

const PAGES = {
  pageAbout: ABOUT,
  pageContact: null, // handled specially — keep the form section
  'page-faqs': FAQ_PAGE,
  'page-session': SESSION,
  'page-investment': INVESTMENT,
  'page-tails-of-sonoma-county': TAILS_SONOMA,
  'page-tails-of-the-world': TAILS_WORLD,
}

async function setSections(id, sections) {
  await client.patch(id).set({sections}).commit()
  const d = await client.getDocument(`drafts.${id}`)
  if (d) await client.patch(`drafts.${id}`).set({sections}).commit()
}

async function run() {
  const pid = assertProject()
  console.log(`${pid} — ${APPLY ? 'APPLYING' : 'DRY RUN (pass --apply)'}\n`)

  for (const [id, sections] of Object.entries(PAGES)) {
    if (!sections) continue
    const before = await client.getDocument(id)
    console.log(
      `  ${id.padEnd(30)} ${String((before?.sections || []).length).padStart(2)} -> ${String(sections.length).padStart(2)} sections`,
    )
    if (APPLY) await setSections(id, sections)
  }

  // contact: replace the intro but KEEP the existing contact form section
  {
    const doc = await client.getDocument('pageContact')
    const form = (doc.sections || []).filter((s) =>
      ['contactFormSection', 'contactInfoSection'].includes(s._type),
    )
    const sections = [...CONTACT, ...form]
    console.log(
      `  ${'pageContact'.padEnd(30)} ${String((doc.sections || []).length).padStart(2)} -> ${String(sections.length).padStart(2)} sections (form preserved)`,
    )
    if (APPLY) await setSections('pageContact', sections)
  }

  // page SEO titles + descriptions
  console.log('\n  page SEO:')
  for (const [id, [title, desc]] of Object.entries(PAGE_SEO)) {
    console.log(`    ${id.padEnd(30)} "${title}"`)
    if (APPLY) {
      await client
        .patch(id)
        .set({pageTitle: title, 'seo.metaDescription': desc})
        .commit()
    }
  }

  // ── portfolio: donor titles + empty "Cats" gallery + duplicate images ────
  const pf = await client.getDocument('portfolio')
  const seen = new Set()
  const deduped = (pf.images || []).filter((i) => {
    const ref = i?.asset?._ref
    if (!ref || seen.has(ref)) return false
    seen.add(ref)
    return true
  })
  const removedDupes = (pf.images || []).length - deduped.length
  const emptyGalleries = (pf.additionalGalleries || []).filter(
    (g) => !(g.images || []).length,
  )
  console.log('\n  portfolio:')
  console.log(`    title      "${pf.title}" -> "Portfolio"`)
  console.log(`    pageTitle  "${pf.pageTitle}" -> "Portfolio"`)
  console.log(`    duplicate images removed: ${removedDupes}`)
  console.log(
    `    empty donor galleries removed: ${emptyGalleries.map((g) => g.name).join(', ') || 'none'}`,
  )
  if (APPLY) {
    const keptGalleries = (pf.additionalGalleries || []).filter(
      (g) => (g.images || []).length,
    )
    await client
      .patch('portfolio')
      .set({
        title: 'Portfolio',
        pageTitle: 'Portfolio',
        byline: null,
        images: deduped,
        additionalGalleries: keptGalleries,
        'seo.metaDescription':
          'Dog and pet portraits photographed in Sonoma, Napa, Marin and the North Bay by Heidi Adler Photography.',
      })
      .commit()
    const d = await client.getDocument('drafts.portfolio')
    if (d) {
      await client
        .patch('drafts.portfolio')
        .set({
          title: 'Portfolio',
          pageTitle: 'Portfolio',
          images: deduped,
          additionalGalleries: keptGalleries,
        })
        .commit()
    }
  }

  if (!APPLY) {
    console.log('\n  DRY RUN — nothing written.')
    return
  }
  console.log('\n  ✓ all pages rebuilt')
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
