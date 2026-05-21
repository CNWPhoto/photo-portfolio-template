// Karen Conrad Photography — single-client custom niche.
//
// Built from karenconradphotography.com (WordPress, 2026-05-20). Content
// scraped from her live pages and composed into the page-builder section
// catalog. Image fields left empty across the board — components fall back
// to Pexels stock until Karen uploads her own assets in Studio.
//
// Run: cp studio/.env.karen-conrad-photography-backup studio/.env
//      cd studio && npm run seed -- --niche=karen-conrad

import {block, bodyText, ctaInternal, ctaExternal, sectionBase, palettes} from '../_shared.js'

export const slug = 'karen-conrad'
export const name = 'Karen Conrad Photography (one-off)'

// Per-page IDs — referenced by navSettings and CTA buttons.
const KID = {
  home: 'homepagePage',
  portfolio: 'portfolio',
  about: 'pageAbout',
  contact: 'pageContact',
  family: 'pageFamily',
  seniors: 'pageSeniors',
  pets: 'pagePets',
  headshots: 'pageHeadshots',
  newborns: 'pageNewborns',
}

export function buildDocs() {
  const docs = []

  // ── Settings docs ───────────────────────────────────────────────────

  docs.push({
    _id: 'siteSettings',
    _type: 'siteSettings',
    siteName: 'Karen Conrad Photography',
    photographerName: 'Karen Conrad',
    logoType: 'text',
    fontTheme: 'classic-editorial',
    palettes,
    defaultPalette: 'warm-studio',
    web3formsKey: '0face925-f521-49f4-97d5-5f7229d83b96',
    textColorPreset: '',
  })

  docs.push({
    _id: 'navSettings',
    _type: 'navSettings',
    navVariant: 'classic',
    links: [
      navInternal('navSeniors', 'Seniors', KID.seniors),
      navInternal('navPets', 'Pets', KID.pets),
      navInternal('navFamily', 'Family', KID.family),
      navInternal('navHeadshots', 'Headshots', KID.headshots),
      navInternal('navNewborns', 'Newborns', KID.newborns),
      navInternal('navAbout', 'About', KID.about),
      navInternal('navContact', 'Contact', KID.contact, {isButton: true}),
    ],
  })

  docs.push({
    _id: 'footerSettings',
    _type: 'footerSettings',
    internalTitle: 'Footer',
    links: [
      footerLink('fl1', 'Home', '/'),
      footerLink('fl2', 'Seniors', '/seniors'),
      footerLink('fl3', 'Pets', '/pets'),
      footerLink('fl4', 'Family', '/family'),
      footerLink('fl5', 'Headshots', '/headshots'),
      footerLink('fl6', 'Newborns', '/newborns'),
      footerLink('fl7', 'About', '/about'),
      footerLink('fl8', 'Contact', '/contact'),
    ],
    middleColumn: {enabled: false, label: 'Newsletter'},
    legalLinks: {
      privacyPolicy: {enabled: false, label: 'Privacy Policy', url: '/privacy-policy'},
      terms: {enabled: false, label: 'Terms', url: '/terms'},
    },
  })

  docs.push({
    _id: 'socialSettings',
    _type: 'socialSettings',
    instagram: 'https://www.instagram.com/karen_conrad_photography/',
    facebook: 'https://www.facebook.com/KarenConradPhotography',
    youtube: '',
    tiktok: '',
    contactEmail: 'info@karenconradphotography.com',
    contactPhone: '719-210-3651',
  })

  docs.push({_id: 'seoSettings', _type: 'seoSettings', siteUrl: ''})
  docs.push({_id: 'codeSettings', _type: 'codeSettings'})

  // ── Singletons (portfolio, blog, legal) ─────────────────────────────

  docs.push({
    _id: 'portfolio',
    _type: 'portfolio',
    pageTitle: 'Portfolio',
    title: 'Portfolio',
    byline: 'A selection of recent sessions across the Front Range',
    galleryColumns: 3,
    images: [],
  })

  docs.push({_id: 'blogPage', _type: 'blogPage', blogEnabled: false, pageTitle: 'Blog', layout: 'list', postsPerPage: 12})
  docs.push({_id: 'termsAndConditionsPage', _type: 'termsAndConditionsPage', title: 'Terms and Conditions'})
  docs.push({_id: 'privacyPolicyPage', _type: 'privacyPolicyPage', title: 'Privacy Policy'})

  // ── Homepage ────────────────────────────────────────────────────────

  docs.push({
    _id: KID.home,
    _type: 'homepagePage',
    pageTitle: 'Home',
    sections: [
      sectionBase({
        _key: 'homeHero', _type: 'heroSection',
        variant: 'slider',
        heading: 'Karen Conrad\nPhotography',
        subheading: 'Capturing your most precious moments to create heirloom quality wall art.',
        ctaText: 'Get In Touch',
        ctaLink: ctaInternal(KID.contact),
        textAlignment: 'center',
        textPosition: 'center-center',
        headingSize: 'large',
        heightMode: 'tall',
        overlayOpacity: 30,
        images: [],
      }),
      sectionBase({
        _key: 'homeIntro', _type: 'splitSection',
        imageLayout: 'image-right-full-bleed',
        eyebrow: 'About Karen',
        heading: 'Twenty years\nbehind the lens.',
        body: bodyText(
          "Karen is a native Coloradan with over twenty years of portrait experience. Her knowledge of the Front Range gives her an acute awareness of prime photo locations from Denver to Colorado Springs.",
          "Every session is built around the people (and pets) in front of the camera — not a rigid pose list. The goal is photographs that feel like you, made to live on your walls as heirloom-quality art.",
        ),
        ctaText: 'About Karen',
        ctaLink: ctaInternal(KID.about),
        textAlignment: 'left',
      }),
      sectionBase({
        _key: 'homeServices', _type: 'threeColumnSection',
        eyebrow: 'What I Photograph',
        heading: 'A photographer for every chapter',
        variant: 'image-cards',
        alignment: 'left',
        columns: [
          column('c1', 'Family Portraits', 'Outdoor sessions and extended family groups, built around your family\'s pace.', ctaInternal(KID.family)),
          column('c2', 'Senior Photos', 'A fun, personality-led approach to the senior year your student will actually want to remember.', ctaInternal(KID.seniors)),
          column('c3', 'Newborns & Maternity', 'Calm sessions celebrating the start of one of life\'s biggest adventures.', ctaInternal(KID.newborns)),
        ],
      }),
      sectionBase({
        _key: 'homeServices2', _type: 'threeColumnSection',
        backgroundTone: 'alt',
        variant: 'image-cards',
        alignment: 'left',
        columns: [
          column('c4', 'Pet Portraits', 'Custom portraits of dogs, cats, and horses by a photographer with four dogs of her own.', ctaInternal(KID.pets)),
          column('c5', 'Headshots', 'Professional headshots for job seekers, business owners, realtors, and creatives.', ctaInternal(KID.headshots)),
        ],
      }),
      sectionBase({
        _key: 'homeTestimonials', _type: 'testimonialsSection',
        heading: 'Kind Words',
        layout: 'slider',
        source: 'all',
      }),
      sectionBase({
        _key: 'homeCta', _type: 'ctaBandSection',
        backgroundTone: 'alt',
        heading: 'Ready to book your session?',
        body: 'Get in touch and we\'ll talk through the right session for you.',
        ctaText: 'Get In Touch',
        ctaLink: ctaInternal(KID.contact),
        caption: 'Serving Denver and Colorado Springs.',
      }),
    ],
  })

  // ── Service pages (5) ───────────────────────────────────────────────

  docs.push(servicePage({
    id: KID.seniors, slug: 'seniors', title: 'Seniors',
    heading: 'Fun Senior Photos',
    eyebrow: 'Senior Portraits',
    introHeading: 'A senior session worth remembering.',
    introBody: [
      "There weren't such things as fun senior pictures when Karen was in high school. Instead, each student sat in the same chair with the same backdrop and the same black combs — no matter the grade level. There was nothing to make this year stand out and be shown as the special year that it was.",
      "Fortunately, seniors today can have the opportunity to enjoy their last photography session as a student in any way they choose.",
    ],
    servicesEyebrow: "What's Included",
    servicesHeading: 'A session built around your senior',
    services: [
      ['Unique Locations', 'Choose anywhere along the Front Range that fits your senior\'s personality.'],
      ['Personal Yearbook', 'A capture of memories from throughout senior year, not just one session.'],
      ['Sports & Stage', 'Game-day photography and stage performance coverage on request.'],
      ['Special Events', 'Homecoming, prom, and other once-in-a-lifetime moments.'],
    ],
  }))

  docs.push(servicePage({
    id: KID.pets, slug: 'pets', title: 'Pets',
    heading: 'Cherished Pet Photos',
    eyebrow: 'Pet Portraits',
    introHeading: 'Custom portraits of the dogs, cats, and horses we love.',
    introBody: [
      "Two of Karen's greatest joys are photographing the family pup and providing custom dog portraits to her clients. Karen has always had dogs in her life and currently has four dogs at home. She treasures the affection and emotional support that each one adds to her family.",
      "Living in the country gives her animals plenty of room to explore the outside world — and gives her plenty of practice photographing pets in their happiest element.",
    ],
    servicesEyebrow: 'What I Photograph',
    servicesHeading: 'Portraits for every kind of companion',
    services: [
      ['Dog Portraits', 'Outdoor or in-home sessions designed around your dog\'s pace and personality.'],
      ['Cat Portraits', 'Calm, patient sessions that work around the way cats actually behave.'],
      ['Horse Portraits', 'On-location sessions at your stable, ranch, or favorite trail.'],
    ],
  }))

  docs.push(servicePage({
    id: KID.family, slug: 'family', title: 'Family',
    heading: 'Unforgettable Family Photos',
    eyebrow: 'Family Portraits',
    introHeading: 'Family portraits that actually look like your family.',
    introBody: [
      "Karen has been a family portrait photographer for over twenty years. During this time, she's learned how to create poses and photograph each family in a way that brings out their true spirit.",
      "There's no rigid formula. Karen supports the individuality of each family and knows that what's best for one may not be for another.",
    ],
    servicesEyebrow: 'Session Types',
    servicesHeading: 'Sessions for every season',
    services: [
      ['Outdoor Family Portraits', 'On-location sessions throughout the Front Range, scheduled around the best light.'],
      ['Extended Family Groups', 'Multi-generation sessions that capture parents, grandparents, and grandchildren together.'],
      ['Christmas Photoshoots', 'Holiday sessions designed for cards and gifts — book early in fall to make the print deadline.'],
      ['Custom Christmas Cards', 'Take your favorite frame and turn it into a one-of-a-kind family card.'],
    ],
  }))

  docs.push(servicePage({
    id: KID.headshots, slug: 'headshots', title: 'Headshots',
    heading: 'Professional Headshots',
    eyebrow: 'Headshots',
    introHeading: 'Headshots that help you stand out.',
    introBody: [
      "Karen understands the importance of quality professional headshots. In today's world, professional portraits help you stand out in an ever-growing digital landscape.",
      "Whether you're job-hunting, building a business, or marking a new chapter, the right headshot signals exactly who you are before anyone has met you.",
    ],
    servicesEyebrow: 'Who I Photograph',
    servicesHeading: 'Headshots for every role',
    services: [
      ['Job Seekers', 'Polished portraits for LinkedIn, resumes, and applications.'],
      ['Business Owners', 'Branded headshots for your website and team page.'],
      ['Realtors', 'Real estate marketing portraits that match your brokerage\'s style.'],
      ['KCP Creators', 'Branded packages for content creators — individual headshots, event sessions, and ongoing subscriptions.'],
    ],
  }))

  docs.push(servicePage({
    id: KID.newborns, slug: 'newborns', title: 'Newborns',
    heading: 'Newborn Photography',
    eyebrow: 'Newborns & Maternity',
    introHeading: 'Celebrating the start of the next adventure.',
    introBody: [
      "Newborn photography celebrates the conclusion of a long and memorable adventure for you and your child. The first few weeks pass impossibly quickly — these sessions are designed to slow them down just enough to remember.",
    ],
    servicesEyebrow: 'Sessions',
    servicesHeading: 'From bump to first birthday',
    services: [
      ['Maternity Photography', 'Studio or outdoor sessions celebrating the months before baby arrives.'],
      ['Newborn Photography', 'Calm, gentle sessions during baby\'s first two weeks at home.'],
      ['Cake Smash Photoshoot', 'The big first-birthday session — messy, joyful, and absolutely worth framing.'],
    ],
  }))

  // ── About ───────────────────────────────────────────────────────────

  docs.push({
    _id: KID.about,
    _type: 'page',
    title: 'About',
    slug: {_type: 'slug', current: 'about'},
    navThemeOverHero: 'auto',
    sections: [
      sectionBase({
        _key: 'aboutHero', _type: 'heroSection',
        variant: 'image-right',
        eyebrow: 'About',
        heading: 'Karen Conrad',
        subheading: 'A native Coloradan who has had a camera in her hand for as long as she can remember.',
        ctaText: 'Get In Touch',
        ctaLink: ctaInternal(KID.contact),
        textAlignment: 'left',
        heightMode: 'auto',
        images: [],
      }),
      sectionBase({
        _key: 'aboutBio', _type: 'splitSection',
        imageLayout: 'image-left',
        eyebrow: 'Her Story',
        heading: 'From zoo trips with a film camera\nto twenty years behind the lens.',
        body: bodyText(
          "Karen Conrad has had a camera in her hand for as long as she can remember. From taking photos at the zoo as a child to pictures of your family today, Karen has always loved capturing moments from behind the lens.",
          "Karen is a native Coloradan, having spent her life in and around the Colorado Springs area. Her knowledge of the Front Range gives her an acute awareness of many prime photo locations throughout the area.",
          "Karen has two grown children that have willingly (and sometimes unwillingly) been her subjects throughout their lives. With over two decades of practice, Karen excels at capturing the true essence of each child and young adult.",
        ),
        textAlignment: 'left',
      }),
      sectionBase({
        _key: 'aboutPets', _type: 'splitSection',
        imageLayout: 'image-right',
        eyebrow: 'Off the clock',
        heading: 'Pets are a favorite subject.',
        body: bodyText(
          "Pets are one of Karen's favorite subjects to photograph, and her dogs and cats frequently model for her. Currently she has four sweet dogs at home, as well as four adorable cats. Living in 'the country' gives her animals plenty of room to explore the outside world — and gives Karen endless natural backdrops when her animals double as models.",
        ),
        textAlignment: 'left',
        mobileFlipOrder: true,
      }),
      sectionBase({
        _key: 'aboutJoe', _type: 'pullQuoteSection',
        quote: "Karen's business and life partner Joe Plaia is a special tool in her toolkit. Together they make every client's experience both enjoyable and memorable.",
        variant: 'centered',
      }),
      sectionBase({
        _key: 'aboutCta', _type: 'ctaBandSection',
        backgroundTone: 'alt',
        heading: "Let's create something to keep.",
        body: 'Get in touch and we\'ll talk through the right session for you.',
        ctaText: 'Contact Karen',
        ctaLink: ctaInternal(KID.contact),
      }),
    ],
  })

  // ── Contact ─────────────────────────────────────────────────────────

  docs.push({
    _id: KID.contact,
    _type: 'page',
    title: 'Contact',
    slug: {_type: 'slug', current: 'contact'},
    navThemeOverHero: 'auto',
    sections: [
      sectionBase({
        _key: 'contactHero', _type: 'heroSection',
        variant: 'image-full',
        eyebrow: 'Get In Touch',
        heading: 'Let\'s plan your session.',
        subheading: 'Have a question about Karen Conrad Photography? Send a message and Karen will get back to you within one business day.',
        heightMode: 'auto',
        textAlignment: 'center',
        textPosition: 'center-center',
        overlayOpacity: 35,
        images: [],
      }),
      sectionBase({
        _key: 'contactInfo', _type: 'contactInfoSection',
        heading: 'Get In Touch',
        layout: 'card',
        showEmail: true,
        showPhone: true,
        showSocial: true,
        showMap: false,
        body: bodyText(
          'Studio hours: Monday–Friday, 9:00am – 5:00pm. Weekend sessions available by appointment.',
          'Serving clients along the Front Range from Denver to Colorado Springs.',
        ),
      }),
      sectionBase({
        _key: 'contactForm', _type: 'contactFormSection',
        eyebrow: 'Send A Message',
        heading: 'Tell Karen about your session.',
        submitButtonText: 'Send Message',
        successMessage: 'Thanks for reaching out! Karen will get back to you within one business day.',
      }),
    ],
  })

  return docs
}

// ── Local helpers ─────────────────────────────────────────────────────

function navInternal(key, label, refId, extra = {}) {
  return {
    _key: key, _type: 'navLink',
    label, linkType: 'internal',
    internalRef: {_type: 'reference', _ref: refId, _weak: true},
    enabled: true, openInNewTab: false, isButton: false,
    ...extra,
  }
}

function footerLink(key, label, url) {
  return {_key: key, _type: 'footerLink', label, url, enabled: true, openInNewTab: false}
}

function column(key, title, bodyStr, ctaLink) {
  return {
    _key: key, _type: 'columnItem',
    title,
    body: bodyText(bodyStr),
    ...(ctaLink ? {ctaText: 'Learn More', ctaLink} : {}),
  }
}

// Common section composition for the five service pages. Keeps each
// service doc declarative — just data, no section wiring per-page.
function servicePage({id, slug, title, heading, eyebrow, introHeading, introBody, servicesEyebrow, servicesHeading, services}) {
  return {
    _id: id,
    _type: 'page',
    title,
    slug: {_type: 'slug', current: slug},
    navThemeOverHero: 'auto',
    sections: [
      sectionBase({
        _key: `${slug}Hero`, _type: 'heroSection',
        variant: 'image-full',
        eyebrow,
        heading,
        heightMode: 'tall',
        textAlignment: 'left',
        textPosition: 'bottom-left',
        overlayOpacity: 35,
        images: [],
      }),
      sectionBase({
        _key: `${slug}Intro`, _type: 'splitSection',
        imageLayout: 'image-right',
        eyebrow: 'About this session',
        heading: introHeading,
        body: bodyText(...introBody),
      }),
      sectionBase({
        _key: `${slug}Steps`, _type: 'stepsSection',
        eyebrow: servicesEyebrow,
        heading: servicesHeading,
        variant: 'horizontal-cards',
        steps: services.map(([t, b], i) => ({
          _key: `step${i + 1}`, _type: 'stepItem',
          stepNumber: String(i + 1).padStart(2, '0'),
          title: t,
          body: bodyText(b),
        })),
      }),
      sectionBase({
        _key: `${slug}Gallery`, _type: 'galleryGridSection',
        eyebrow: 'Recent Work',
        heading: `${title} Sessions`,
        layout: 'grid-3',
        gap: 'normal',
        lightbox: true,
        images: [],
      }),
      sectionBase({
        _key: `${slug}Cta`, _type: 'ctaBandSection',
        backgroundTone: 'alt',
        heading: 'Ready to book?',
        body: `Get in touch to plan your ${title.toLowerCase()} session.`,
        ctaText: 'Get In Touch',
        ctaLink: ctaInternal(KID.contact),
        caption: 'Call 719-210-3651 or send a message.',
      }),
    ],
  }
}

export default {slug, name, buildDocs}
