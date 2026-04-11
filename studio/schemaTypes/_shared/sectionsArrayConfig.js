// Shared `of[]` and `insertMenu` config for any document with a unified
// page-builder sections array. See docs/page-builder-spec.md §2 (groupings).

const HERO = ['heroSection']
const LAYOUT = [
  'splitSection',
  'fullBleedImageSection',
  'richTextSection',
  'pullQuoteSection',
  'threeColumnSection',
  'stepsSection',
  'galleryGridSection',
  'dividerSection',
]
const CTA = ['ctaBandSection', 'contactFormSection', 'contactInfoSection']
const DYNAMIC = [
  'testimonialsSection',
  'faqSection',
  'featuredPortfolioSection',
  'blogTeaserSection',
]
const EMBED = ['htmlEmbedSection']

// Order matters: this is what editors see in the section picker.
export const SECTION_TYPES = [...HERO, ...LAYOUT, ...CTA, ...DYNAMIC, ...EMBED]

export const sectionsOf = SECTION_TYPES.map((name) => ({type: name}))

export const sectionsInsertMenu = {
  views: [{name: 'grid'}, {name: 'list'}],
  groups: [
    {name: 'hero', title: 'Hero', of: HERO},
    {name: 'layout', title: 'Layout', of: LAYOUT},
    {name: 'cta', title: 'CTA', of: CTA},
    {name: 'dynamic', title: 'Dynamic', of: DYNAMIC},
    {name: 'embed', title: 'Embed', of: EMBED},
  ],
}
