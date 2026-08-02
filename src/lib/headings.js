// Which section owns the page's <h1>.
//
// The old rule was positional: `isFirst={i === 0}`, and section 0 rendered an
// h1. That breaks in two ways, and both were live across the fleet:
//
//   1. A hero renders its h1 only when it HAS a heading. A hero with just an
//      image produced no h1, and section 1 still rendered h2 because it wasn't
//      first — so the page had no h1 at all.
//   2. Split / FullBleedImage / Steps / FeaturedPortfolio always rendered h2,
//      even at position 0. A page opening with a Split had no h1 even though
//      the Split had a heading.
//
// Every /about/ page on every client site hit one of these.
//
// So the h1 goes to the first section that will actually RENDER a heading,
// wherever it happens to sit. Returns -1 when no section has one, in which
// case the page legitimately has no h1 and 68-verify-pages will say so.
//
// Deliberately separate from `isFirst`, which still means "section 0" and
// drives eager image loading for LCP. Conflating them would make a hero
// lazy-load whenever it had no heading.

// Section types whose component can render the page heading. Anything not
// listed here either has no heading field (dividerSection, htmlEmbedRef) or
// renders its text as something other than a heading (pullQuoteSection's
// quote, testimonialsSection's slider).
const HEADING_SECTIONS = new Set([
  'heroSection',
  'splitSection',
  'richTextSection',
  'threeColumnSection',
  'ctaBandSection',
  'faqSection',
  'galleryGridSection',
  'contactFormSection',
  'contactInfoSection',
  'blogTeaserSection',
  'fullBleedImageSection',
  'stepsSection',
  'featuredPortfolioSection',
])

// stega markers are invisible but make an "empty" string truthy, so strip
// anything that isn't a real character before deciding a heading exists.
function hasText(value) {
  if (typeof value !== 'string') return false
  return value.replace(/[​-‍﻿]/g, '').trim().length > 0
}

export function firstHeadingIndex(sections) {
  if (!Array.isArray(sections)) return -1
  return sections.findIndex(
    (s) =>
      s &&
      s.enabled !== false &&
      HEADING_SECTIONS.has(s._type) &&
      hasText(s.heading),
  )
}
