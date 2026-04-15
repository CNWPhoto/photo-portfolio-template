// Wireframe icons for each section type in the page-builder insert menu.
// Rendered in both grid view (~80px) and list view (~24px) — viewBox 120×80
// with stroke-2 / currentColor so the family reads consistently at any size
// and inherits Studio's light/dark theme automatically.
//
// Consumed by every schema in studio/schemaTypes/sections/* (plus
// _shared/htmlEmbedRef) via `icon: sectionIcon('sectionName')`.

const svgProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 120 80',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  style: {width: '100%', height: '100%'},
}

const ICONS = {
  heroSection: (
    <svg {...svgProps}>
      <rect x="8" y="8" width="104" height="64" fill="currentColor" stroke="none" />
      <line x1="16" y1="50" x2="48" y2="50" />
      <line x1="16" y1="58" x2="80" y2="58" />
      <line x1="16" y1="64" x2="72" y2="64" />
      <rect x="16" y="68" width="24" height="8" rx="3" />
    </svg>
  ),

  splitSection: (
    <svg {...svgProps}>
      <rect x="8" y="8" width="48" height="64" fill="currentColor" stroke="none" />
      <rect x="64" y="8" width="48" height="64" />
      <line x1="68" y1="20" x2="100" y2="20" />
      <line x1="68" y1="28" x2="112" y2="28" />
      <line x1="68" y1="36" x2="104" y2="36" />
    </svg>
  ),

  fullBleedImageSection: (
    <svg {...svgProps}>
      <rect x="8" y="8" width="104" height="64" fill="currentColor" stroke="none" />
      <rect x="30" y="44" width="60" height="20" />
      <line x1="36" y1="52" x2="68" y2="52" />
      <line x1="36" y1="58" x2="80" y2="58" />
    </svg>
  ),

  richTextSection: (
    <svg {...svgProps}>
      <line x1="44" y1="16" x2="76" y2="16" />
      <line x1="28" y1="28" x2="92" y2="28" />
      <line x1="28" y1="36" x2="92" y2="36" />
      <line x1="28" y1="44" x2="92" y2="44" />
      <line x1="28" y1="52" x2="92" y2="52" />
    </svg>
  ),

  pullQuoteSection: (
    <svg {...svgProps}>
      <line x1="20" y1="20" x2="20" y2="60" />
      <path d="M28 24 q-6 6 0 12" />
      <line x1="36" y1="30" x2="100" y2="30" />
      <line x1="36" y1="38" x2="92" y2="38" />
      <line x1="60" y1="54" x2="100" y2="54" />
    </svg>
  ),

  threeColumnSection: (
    <svg {...svgProps}>
      <rect x="8" y="8" width="32" height="64" />
      <rect x="44" y="8" width="32" height="64" />
      <rect x="80" y="8" width="32" height="64" />
      <rect x="12" y="12" width="24" height="14" fill="currentColor" stroke="none" />
      <rect x="48" y="12" width="24" height="14" fill="currentColor" stroke="none" />
      <rect x="84" y="12" width="24" height="14" fill="currentColor" stroke="none" />
    </svg>
  ),

  stepsSection: (
    <svg {...svgProps}>
      <line x1="8" y1="40" x2="112" y2="40" />
      <rect x="12" y="24" width="24" height="24" />
      <rect x="48" y="24" width="24" height="24" />
      <rect x="84" y="24" width="24" height="24" />
    </svg>
  ),

  galleryGridSection: (
    <svg {...svgProps}>
      <rect x="8" y="8" width="32" height="28" fill="currentColor" stroke="none" />
      <rect x="44" y="8" width="32" height="28" fill="currentColor" stroke="none" />
      <rect x="80" y="8" width="32" height="28" fill="currentColor" stroke="none" />
      <rect x="8" y="40" width="32" height="28" fill="currentColor" stroke="none" />
      <rect x="44" y="40" width="32" height="28" fill="currentColor" stroke="none" />
      <rect x="80" y="40" width="32" height="28" fill="currentColor" stroke="none" />
    </svg>
  ),

  dividerSection: (
    <svg {...svgProps}>
      <line x1="8" y1="40" x2="112" y2="40" />
      <circle cx="60" cy="40" r="3" fill="currentColor" stroke="none" />
    </svg>
  ),

  ctaBandSection: (
    <svg {...svgProps}>
      <rect x="8" y="16" width="104" height="48" />
      <line x1="44" y1="32" x2="76" y2="32" />
      <line x1="36" y1="40" x2="84" y2="40" />
      <rect x="48" y="48" width="24" height="8" rx="3" fill="currentColor" stroke="none" />
    </svg>
  ),

  contactFormSection: (
    <svg {...svgProps}>
      <rect x="28" y="16" width="64" height="10" />
      <rect x="28" y="30" width="64" height="10" />
      <rect x="28" y="44" width="64" height="10" />
      <rect x="48" y="60" width="24" height="8" rx="3" fill="currentColor" stroke="none" />
    </svg>
  ),

  contactInfoSection: (
    <svg {...svgProps}>
      <rect x="12" y="18" width="10" height="8" />
      <line x1="28" y1="22" x2="96" y2="22" />
      <circle cx="17" cy="36" r="4" />
      <line x1="28" y1="36" x2="96" y2="36" />
      <path d="M17 50 l4 6 l4 -6 a4 4 0 1 0 -8 0" />
      <line x1="28" y1="50" x2="96" y2="50" />
    </svg>
  ),

  testimonialsSection: (
    <svg {...svgProps}>
      <rect x="20" y="16" width="80" height="40" />
      <circle cx="28" cy="24" r="4" />
      <line x1="36" y1="24" x2="92" y2="24" />
      <line x1="36" y1="32" x2="84" y2="32" />
      <circle cx="56" cy="64" r="2" fill="currentColor" stroke="none" />
      <circle cx="64" cy="64" r="2" fill="currentColor" stroke="none" />
    </svg>
  ),

  faqSection: (
    <svg {...svgProps}>
      <line x1="16" y1="20" x2="92" y2="20" />
      <polyline points="96,18 100,22 96,26" />
      <line x1="16" y1="40" x2="92" y2="40" />
      <polyline points="96,38 100,42 96,46" />
      <line x1="16" y1="60" x2="92" y2="60" />
      <polyline points="96,58 100,62 96,66" />
    </svg>
  ),

  featuredPortfolioSection: (
    <svg {...svgProps}>
      <rect x="8" y="8" width="60" height="64" fill="currentColor" stroke="none" />
      <rect x="72" y="8" width="40" height="28" fill="currentColor" stroke="none" />
      <rect x="72" y="40" width="40" height="32" fill="currentColor" stroke="none" />
    </svg>
  ),

  blogTeaserSection: (
    <svg {...svgProps}>
      <rect x="8" y="8" width="32" height="64" />
      <rect x="44" y="8" width="32" height="64" />
      <rect x="80" y="8" width="32" height="64" />
      <rect x="10" y="10" width="28" height="32" fill="currentColor" stroke="none" />
      <rect x="46" y="10" width="28" height="32" fill="currentColor" stroke="none" />
      <rect x="82" y="10" width="28" height="32" fill="currentColor" stroke="none" />
    </svg>
  ),

  htmlEmbedRef: (
    <svg {...svgProps}>
      <rect x="16" y="16" width="88" height="48" />
      <polyline points="44,30 36,40 44,50" />
      <line x1="52" y1="50" x2="60" y2="30" />
      <polyline points="68,30 76,40 68,50" />
    </svg>
  ),
}

// Schema `icon` expects a React component, not a JSX element. Return a
// stable named component per section so React DevTools / Studio error
// boundaries show something useful instead of "Anonymous".
export function sectionIcon(name) {
  function SectionIcon() {
    return ICONS[name] || null
  }
  SectionIcon.displayName = `SectionIcon(${name})`
  return SectionIcon
}
