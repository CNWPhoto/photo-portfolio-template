// Shared GROQ fragments for the page builder.
// See docs/page-builder-spec.md §7.

// Generic projection for a section: spread all fields, then deeply expand
// every known asset reference and dereference linked docs. Each section
// component picks the fields it needs from the result.
export const SECTION_PROJECTION = /* groq */ `
  ...,
  image {
    ...,
    asset->{
      _id,
      metadata { dimensions { width, height, aspectRatio }, lqip }
    }
  },
  backgroundImage {
    ...,
    asset->{
      _id,
      metadata { dimensions { width, height, aspectRatio }, lqip }
    }
  },
  images[] {
    ...,
    asset->{
      _id,
      metadata { dimensions { width, height, aspectRatio }, lqip }
    }
  },
  columns[] {
    ...,
    image {
      ...,
      asset->{
        _id,
        metadata { dimensions { width, height, aspectRatio }, lqip }
      }
    }
  },
  steps[] {
    ...,
    image {
      ...,
      asset->{
        _id,
        metadata { dimensions { width, height, aspectRatio }, lqip }
      }
    }
  },
  ctaLink {
    ...,
    internal->{ "slug": slug.current }
  },
  testimonials[]->,
  items[]->,
  specificPosts[]->,
  filterByCategory->{ "slug": slug.current, name },
  embed->
`

// Top-level palette query — returns the palettes array and the default
// palette slug from siteSettings. Used by every page so the SectionRenderer
// can resolve a section's palette correctly.
export const SITE_PALETTES_QUERY = /* groq */ `
  *[_type == "siteSettings" && _id == "siteSettings"][0]{
    "palettes": palettes[]{
      name,
      "slug": slug.current,
      bg, bgAlt, surface, text, textMuted, textMutedLight,
      accent, accentDark, border, sectionAlt, sectionDark,
      sectionDarkText, btnBg, btnText
    },
    defaultPalette
  }
`
