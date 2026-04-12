// Seed script — populates a fresh dataset with starter content matching
// the legacy site, translated into the new section catalog.
//
// Usage:
//   npm run seed              — additive (createIfNotExists). Safe; won't
//                               overwrite documents you've already edited.
//   npm run seed:replace      — migration mode (createOrReplace). USE THIS
//                               to migrate a dataset that has stale legacy
//                               section data on existing singletons. Will
//                               overwrite homepagePage / notFoundPage / etc.
//
// Snapshot first via the rollback guide before running --replace against
// production. See docs/rewrite-rollback.md.

import {getCliClient} from 'sanity/cli'

const client = getCliClient()
const replace = process.argv.includes('--replace')

// ── Helpers ────────────────────────────────────────────────────────────
const k = (() => {
  let n = 0
  return (prefix = 'k') => `${prefix}${(++n).toString(36)}`
})()

const block = (text, style = 'normal') => {
  const key = k('b')
  return {
    _type: 'block',
    _key: key,
    style,
    markDefs: [],
    children: [{_type: 'span', _key: key + 's', text}],
  }
}

const bodyText = (...paragraphs) => paragraphs.map((p) => block(p))

const ctaInternal = (refId) => ({
  _type: 'ctaLink',
  type: 'internal',
  internal: {_type: 'reference', _ref: refId, _weak: true},
})

const ctaExternal = (url) => ({
  _type: 'ctaLink',
  type: 'external',
  external: url,
})

const ctaAnchor = (anchor) => ({
  _type: 'ctaLink',
  type: 'anchor',
  anchor,
})

const sectionBase = (overrides = {}) => ({
  enabled: true,
  spacing: 'normal',
  ...overrides,
})

// ── Palettes — values match src/styles/palette.css and the legacy data-theme block ──
const palettes = [
  {
    _key: 'p1', _type: 'palette',
    name: 'Classic Cream',
    slug: {_type: 'slug', current: 'classic-cream'},
    bg: '#f5f3ef', bgAlt: '#edeae4', surface: '#edeae4',
    text: '#1a2744', textMuted: '#4a5568', textMutedLight: '#8a94a6',
    accent: '#8b2635', accentDark: '#6b1c28', border: '#d4cfc6',
    sectionAlt: '#edeae4', sectionDark: '#1a2744', sectionDarkText: '#f5f3ef',
    btnBg: '#8b2635', btnText: '#ffffff',
  },
  {
    _key: 'p2', _type: 'palette',
    name: 'Warm Studio',
    slug: {_type: 'slug', current: 'warm-studio'},
    bg: '#fdf6ee', bgAlt: '#f5ead9', surface: '#f5ead9',
    text: '#2c1810', textMuted: '#6b4c3b', textMutedLight: '#a88070',
    accent: '#c9702a', accentDark: '#a85a20', border: '#e8d5c0',
    sectionAlt: '#f5ead9', sectionDark: '#2c1810', sectionDarkText: '#fdf6ee',
    btnBg: '#c9702a', btnText: '#ffffff',
  },
  {
    _key: 'p3', _type: 'palette',
    name: 'Dark Editorial',
    slug: {_type: 'slug', current: 'dark-editorial'},
    bg: '#1a1a1a', bgAlt: '#252525', surface: '#252525',
    text: '#f0ede8', textMuted: '#a0998e', textMutedLight: '#6b645c',
    accent: '#c9a96e', accentDark: '#a8895a', border: '#3a3a3a',
    sectionAlt: '#252525', sectionDark: '#111111', sectionDarkText: '#f0ede8',
    btnBg: '#c9a96e', btnText: '#1a1a1a',
  },
  {
    _key: 'p4', _type: 'palette',
    name: 'Cool Minimal',
    slug: {_type: 'slug', current: 'cool-minimal'},
    bg: '#f8f9fa', bgAlt: '#eef1f4', surface: '#eef1f4',
    text: '#1c2b3a', textMuted: '#4a5e6e', textMutedLight: '#8a99a6',
    accent: '#4a7c9e', accentDark: '#3a6480', border: '#d0d8de',
    sectionAlt: '#eef1f4', sectionDark: '#1c2b3a', sectionDarkText: '#f8f9fa',
    btnBg: '#4a7c9e', btnText: '#ffffff',
  },
  {
    _key: 'p5', _type: 'palette',
    name: 'Forest Sage',
    slug: {_type: 'slug', current: 'forest-sage'},
    bg: '#f2f4f0', bgAlt: '#e4ebe0', surface: '#e4ebe0',
    text: '#1e2d1f', textMuted: '#4a5e4b', textMutedLight: '#8a9e8b',
    accent: '#5a7a4e', accentDark: '#456040', border: '#ccd6c8',
    sectionAlt: '#e4ebe0', sectionDark: '#1e2d1f', sectionDarkText: '#f2f4f0',
    btnBg: '#5a7a4e', btnText: '#ffffff',
  },
]

// ── Page IDs (deterministic so navSettings can reference them) ────────
const ID = {
  about: 'pageAbout',
  experience: 'pageExperience',
  contact: 'pageContact',
}

// ── Documents to seed ──────────────────────────────────────────────────
const docs = []

// Site settings
docs.push({
  _id: 'siteSettings',
  _type: 'siteSettings',
  siteName: 'Pet Photography',
  photographerName: 'Your Name',
  logoType: 'text',
  colorTheme: 'classic-cream',
  fontTheme: 'classic-editorial',
  palettes,
  defaultPalette: 'classic-cream',
  web3formsKey: '',
  textColorPreset: '',
})

// Nav settings — internal refs to the seeded page docs
docs.push({
  _id: 'navSettings',
  _type: 'navSettings',
  navVariant: 'classic',
  links: [
    {
      _key: 'navExperience', _type: 'navLink',
      label: 'Experience', linkType: 'internal',
      internalRef: {_type: 'reference', _ref: ID.experience, _weak: true},
      enabled: true, openInNewTab: false, isButton: false,
    },
    {
      _key: 'navPortfolio', _type: 'navLink',
      label: 'Portfolio', linkType: 'external', url: '/portfolio',
      enabled: true, openInNewTab: false, isButton: false,
    },
    {
      _key: 'navAbout', _type: 'navLink',
      label: 'About', linkType: 'internal',
      internalRef: {_type: 'reference', _ref: ID.about, _weak: true},
      enabled: true, openInNewTab: false, isButton: false,
    },
    {
      _key: 'navBlog', _type: 'navLink',
      label: 'Blog', linkType: 'external', url: '/blog',
      enabled: true, openInNewTab: false, isButton: false,
    },
    {
      _key: 'navInquire', _type: 'navLink',
      label: 'Inquire', linkType: 'internal',
      internalRef: {_type: 'reference', _ref: ID.contact, _weak: true},
      enabled: true, openInNewTab: false, isButton: true,
    },
  ],
})

// Footer settings
docs.push({
  _id: 'footerSettings',
  _type: 'footerSettings',
  internalTitle: 'Footer',
  links: [
    {_key: 'fl1', _type: 'footerLink', label: 'Home',       url: '/',           enabled: true, openInNewTab: false},
    {_key: 'fl2', _type: 'footerLink', label: 'About',      url: '/about',      enabled: true, openInNewTab: false},
    {_key: 'fl3', _type: 'footerLink', label: 'Experience', url: '/experience', enabled: true, openInNewTab: false},
    {_key: 'fl4', _type: 'footerLink', label: 'Portfolio',  url: '/portfolio',  enabled: true, openInNewTab: false},
    {_key: 'fl5', _type: 'footerLink', label: 'Blog',       url: '/blog',       enabled: true, openInNewTab: false},
    {_key: 'fl6', _type: 'footerLink', label: 'Contact',    url: '/contact',    enabled: true, openInNewTab: false},
  ],
  middleColumn: {enabled: false, label: 'Newsletter'},
  legalLinks: {
    privacyPolicy: {enabled: false, label: 'Privacy Policy', url: '/privacy-policy'},
    terms: {enabled: false, label: 'Terms', url: '/terms'},
  },
})

// Social settings — placeholders
docs.push({
  _id: 'socialSettings',
  _type: 'socialSettings',
  instagram: '',
  facebook: '',
  youtube: '',
  tiktok: '',
})

// SEO settings — placeholders, siteUrl blank so sitemap/schema gracefully fall back
docs.push({
  _id: 'seoSettings',
  _type: 'seoSettings',
  siteUrl: '',
})

// Code settings — empty
docs.push({_id: 'codeSettings', _type: 'codeSettings'})

// ── Homepage ──────────────────────────────────────────────────────────
docs.push({
  _id: 'homepagePage',
  _type: 'homepagePage',
  pageTitle: 'Home',
  hero: sectionBase({
    _type: 'heroSection',
    variant: 'slider',
    heading: 'Capturing Your Story',
    subheading: 'Authentic photography that tells the story of every dog.',
    ctaText: 'Inquire',
    ctaLink: ctaInternal(ID.contact),
    textAlignment: 'center',
    textPosition: 'center-center',
    heightMode: 'auto',
    overlayOpacity: 30,
    nicheKeyword: 'Pet Photography',
    images: [],
  }),
  sections: [
    sectionBase({
      _key: 'homeSplit', _type: 'splitSection',
      imageLayout: 'image-right',
      eyebrow: 'Every Session is Unique',
      heading: 'Welcome',
      body: bodyText(
        "Every session is crafted entirely around your dog's unique personality. We find the light, the location, and the moments that tell their story.",
        'No forced poses. No rushed timelines. Just you, your dog, and the kind of photography that makes people stop and say "that\'s exactly them."',
      ),
      ctaText: 'See the Experience',
      ctaLink: ctaInternal(ID.experience),
      imageAspectRatio: 'auto',
      textAlignment: 'left',
      verticalAlignment: 'center',
      mobileOrder: 'image-first',
    }),
    sectionBase({
      _key: 'homeTestimonials', _type: 'testimonialsSection',
      heading: 'What Clients Are Saying',
      layout: 'slider',
      source: 'all',
    }),
    sectionBase({
      _key: 'homeFeatured', _type: 'featuredPortfolioSection',
      eyebrow: 'Featured Work',
      heading: 'Recent Sessions',
      layout: 'masonry',
      source: 'latest',
      itemCount: 6,
      ctaText: 'View All',
      ctaLink: ctaExternal('/portfolio'),
    }),
    sectionBase({
      _key: 'homeSteps', _type: 'stepsSection',
      eyebrow: 'How It Works',
      heading: 'A simple, relaxed process',
      variant: 'horizontal-cards',
      steps: [
        {
          _key: 's1', _type: 'stepItem', stepNumber: '01',
          title: 'Inquire',
          body: bodyText('Reach out and tell us about your dog. We\'ll set up a quick chat to plan the session.'),
        },
        {
          _key: 's2', _type: 'stepItem', stepNumber: '02',
          title: 'Plan',
          body: bodyText('We pick a location and time of day that flatters the light and matches your dog\'s vibe.'),
        },
        {
          _key: 's3', _type: 'stepItem', stepNumber: '03',
          title: 'Capture',
          body: bodyText('We meet, we play, and we capture honest moments. You get the gallery a few days later.'),
        },
      ],
      ctaText: 'Book a Session',
      ctaLink: ctaInternal(ID.contact),
    }),
    sectionBase({
      _key: 'homeWhy', _type: 'fullBleedImageSection',
      eyebrow: 'Why Choose',
      heading: 'Why Choose\nOur Studio?',
      body: bodyText(
        'We\'ve spent years honing the craft of photographing dogs in natural light, on location, in their happiest element.',
        'Every gallery is hand-edited with care. No filters, no rushed turnarounds, no awkward poses.',
      ),
      ctaText: 'Learn More',
      ctaLink: ctaInternal(ID.about),
      caption: 'Sessions starting at $450',
      textContainer: 'overlay-card',
      textPosition: 'center-center',
      overlayOpacity: 30,
      height: 'tall',
      parallax: false,
    }),
    sectionBase({
      _key: 'homeFaq', _type: 'faqSection',
      eyebrow: 'FAQ',
      heading: 'Frequently Asked Questions',
      layout: 'flat-list',
      verticalSideLabel: 'FAQs',
      showSchema: true,
      faqs: [
        {
          _key: 'faq1', _type: 'faqItem',
          question: 'How long is a typical session?',
          answer: bodyText('Most sessions run 60–90 minutes. We never rush — we finish when we have what we need.'),
        },
        {
          _key: 'faq2', _type: 'faqItem',
          question: 'What if my dog is shy or reactive?',
          answer: bodyText('We have plenty of experience with anxious dogs. We\'ll plan a quiet location and a slow pace.'),
        },
        {
          _key: 'faq3', _type: 'faqItem',
          question: 'How long until I see the photos?',
          answer: bodyText('You\'ll get a private gallery within two weeks of the session.'),
        },
      ],
    }),
  ],
})

// ── About page ────────────────────────────────────────────────────────
docs.push({
  _id: ID.about,
  _type: 'page',
  title: 'About',
  slug: {_type: 'slug', current: 'about'},
  navThemeOverHero: 'auto',
  sections: [
    sectionBase({
      _key: 'aboutIntro', _type: 'splitSection',
      imageLayout: 'image-left',
      eyebrow: 'About',
      heading: 'Meet the photographer',
      body: bodyText(
        'I\'m a photographer who fell in love with capturing dogs the way their people see them — full of personality, light, and life.',
        'Every session is built around the dog. No two are the same.',
      ),
      ctaText: 'Book a Session',
      ctaLink: ctaInternal(ID.contact),
      imageAspectRatio: 'auto',
    }),
    sectionBase({
      _key: 'aboutPersonal', _type: 'splitSection',
      imageLayout: 'image-right',
      eyebrow: 'My Story',
      heading: 'Why dogs?',
      body: bodyText(
        'I grew up with dogs and never lost the urge to follow them around with a camera.',
        'After years of shooting weddings and editorial work, I narrowed in on what I love most — and that\'s where this studio came from.',
      ),
    }),
    sectionBase({
      _key: 'aboutExpect', _type: 'threeColumnSection',
      eyebrow: 'What to Expect',
      heading: 'A simple process',
      variant: 'numbered-steps',
      verticalSideLabel: 'What to Expect',
      alignment: 'center',
      columns: [
        {
          _key: 'c1', _type: 'columnItem',
          title: 'Honest moments',
          body: bodyText('No forced poses. We let your dog be themselves.'),
        },
        {
          _key: 'c2', _type: 'columnItem',
          title: 'Beautiful light',
          body: bodyText('We schedule for golden hour and flattering natural light.'),
        },
        {
          _key: 'c3', _type: 'columnItem',
          title: 'Hand-edited galleries',
          body: bodyText('Every photo is carefully edited — no filters, no shortcuts.'),
        },
      ],
    }),
    sectionBase({
      _key: 'aboutQuote', _type: 'pullQuoteSection',
      quote: 'These photos brought me to tears. You captured exactly who she is.',
      attribution: 'Sarah M.',
      variant: 'centered',
    }),
    sectionBase({
      _key: 'aboutCta', _type: 'ctaBandSection',
      heading: 'Ready to plan a session?',
      body: 'Tell us about your dog and we\'ll find a time that works.',
      ctaText: 'Get in Touch',
      ctaLink: ctaInternal(ID.contact),
      layout: 'centered',
    }),
  ],
})

// ── Experience page ──────────────────────────────────────────────────
docs.push({
  _id: ID.experience,
  _type: 'page',
  title: 'Experience',
  slug: {_type: 'slug', current: 'experience'},
  navThemeOverHero: 'auto',
  sections: [
    sectionBase({
      _key: 'expHero', _type: 'heroSection',
      variant: 'image-full',
      heading: 'The Experience',
      subheading: 'Every session, start to finish',
      heightMode: 'tall',
      stickyBackground: true,
      textAlignment: 'center',
      textPosition: 'center-center',
      overlayOpacity: 35,
      images: [],
    }),
    sectionBase({
      _key: 'expIntro', _type: 'richTextSection',
      heading: 'How a session unfolds',
      body: bodyText(
        'From the first inquiry to the final gallery, every step is designed to feel relaxed and unhurried.',
        'You\'ll know what to expect at every stage — and your dog will too.',
      ),
      maxWidth: 'narrow',
      textAlignment: 'center',
    }),
    sectionBase({
      _key: 'expSessions', _type: 'splitSection',
      imageLayout: 'image-left',
      eyebrow: 'Sessions',
      heading: 'On-location sessions',
      body: bodyText(
        '60 to 90 minutes at a location that flatters your dog and the light.',
        'Includes a hand-edited gallery of 30+ images, delivered within two weeks.',
      ),
      ctaText: 'Inquire',
      ctaLink: ctaInternal(ID.contact),
    }),
    sectionBase({
      _key: 'expArtwork', _type: 'splitSection',
      imageLayout: 'image-right',
      eyebrow: 'Artwork',
      heading: 'Prints and wall art',
      body: bodyText(
        'Optional fine-art prints, framed canvases, and albums available after your session.',
        'We\'ll walk you through options together so you can pick what fits your space.',
      ),
    }),
    sectionBase({
      _key: 'expNext', _type: 'fullBleedImageSection',
      eyebrow: 'Next Steps',
      heading: 'Ready when you are',
      body: bodyText('Reach out and tell us about your dog. We\'ll go from there.'),
      ctaText: 'Inquire',
      ctaLink: ctaInternal(ID.contact),
      textContainer: 'overlay-card',
      textPosition: 'center-center',
      height: 'medium',
      overlayOpacity: 35,
    }),
    sectionBase({
      _key: 'expFaq', _type: 'faqSection',
      heading: 'Common Questions',
      layout: 'accordion',
      showSchema: true,
      faqs: [
        {
          _key: 'efaq1', _type: 'faqItem',
          question: 'Where do you shoot?',
          answer: bodyText('Outdoor locations within an hour of the studio. We\'ll suggest a few based on your dog\'s comfort level.'),
        },
        {
          _key: 'efaq2', _type: 'faqItem',
          question: 'What\'s included?',
          answer: bodyText('A 60–90 minute session, location scouting, hand-edited digital gallery of 30+ images.'),
        },
        {
          _key: 'efaq3', _type: 'faqItem',
          question: 'Do you offer prints?',
          answer: bodyText('Yes — fine art prints, framed canvases, and albums are available as add-ons after your session.'),
        },
      ],
    }),
  ],
})

// ── Contact page ──────────────────────────────────────────────────────
docs.push({
  _id: ID.contact,
  _type: 'page',
  title: 'Contact',
  slug: {_type: 'slug', current: 'contact'},
  navThemeOverHero: 'auto',
  sections: [
    sectionBase({
      _key: 'contactForm', _type: 'contactFormSection',
      eyebrow: 'Get in Touch',
      heading: 'Tell us about your dog',
      body: bodyText('Fill out the form and we\'ll get back to you within a couple of days.'),
      mode: 'built-in',
      submitText: 'Send',
      successMessage: "Thanks — we'll be in touch soon.",
      errorMessage: 'Something went wrong. Please try again or email us directly.',
      formFields: [
        {_key: 'ff1', _type: 'formField', name: 'name',    label: 'Name',    type: 'text',     required: true},
        {_key: 'ff2', _type: 'formField', name: 'email',   label: 'Email',   type: 'email',    required: true},
        {_key: 'ff3', _type: 'formField', name: 'message', label: 'Message', type: 'textarea', required: true},
      ],
    }),
    sectionBase({
      _key: 'contactInfo', _type: 'contactInfoSection',
      heading: 'Other ways to reach us',
      layout: 'card',
      showEmail: true,
      showPhone: false,
      showSocial: true,
      showMap: false,
    }),
  ],
})

// ── 404 page ─────────────────────────────────────────────────────────
docs.push({
  _id: 'notFoundPage',
  _type: 'notFoundPage',
  sections: [
    sectionBase({
      _key: 'nf1', _type: 'fullBleedImageSection',
      heading: '404',
      body: bodyText('Page not found.'),
      ctaText: 'Back to Home',
      ctaLink: ctaExternal('/'),
      textContainer: 'inline-overlay',
      textPosition: 'center-center',
      height: 'viewport',
      overlayOpacity: 50,
    }),
  ],
})

// ── Categories ───────────────────────────────────────────────────────
const blogCategories = [
  {slug: 'sessions',           name: 'Sessions'},
  {slug: 'behind-the-scenes',  name: 'Behind the Scenes'},
]
for (const c of blogCategories) {
  docs.push({
    _id: `blogCategory-${c.slug}`,
    _type: 'blogCategory',
    name: c.name,
    slug: {_type: 'slug', current: c.slug},
  })
}

const portfolioCategories = [
  {slug: 'portrait',  name: 'Portrait'},
  {slug: 'lifestyle', name: 'Lifestyle'},
  {slug: 'detail',    name: 'Detail'},
  {slug: 'family',    name: 'Family'},
]
for (const c of portfolioCategories) {
  docs.push({
    _id: `portfolioCategory-${c.slug}`,
    _type: 'portfolioCategory',
    name: c.name,
    slug: {_type: 'slug', current: c.slug},
  })
}

// ── Run ──────────────────────────────────────────────────────────────
async function main() {
  const mode = replace ? 'createOrReplace (REPLACE mode)' : 'createIfNotExists (additive)'
  console.log(`\nSeeding ${docs.length} documents using ${mode}...\n`)

  let created = 0
  let skipped = 0
  for (const doc of docs) {
    try {
      if (replace) {
        await client.createOrReplace(doc)
        console.log(`  ↻ ${doc._type}: ${doc._id}`)
        created++
      } else {
        const result = await client.createIfNotExists(doc)
        if (result?._createdAt && result._createdAt === result._updatedAt) {
          console.log(`  + ${doc._type}: ${doc._id}`)
          created++
        } else {
          console.log(`  · ${doc._type}: ${doc._id} (already exists, skipped)`)
          skipped++
        }
      }
    } catch (err) {
      console.error(`  ✗ ${doc._type}: ${doc._id} — ${err.message}`)
      throw err
    }
  }

  console.log(`\nDone. ${replace ? 'Replaced' : 'Created'}: ${created}, Skipped: ${skipped}\n`)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
