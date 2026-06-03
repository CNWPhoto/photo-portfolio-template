// Shared GROQ fragments for the page builder.
// See docs/page-builder-spec.md §7.

// Generic projection for a section: spread all fields, then deeply expand
// every known asset reference and dereference linked docs. Each section
// component picks the fields it needs from the result.
//
// `metadata.dimensions` only projects width + height. `aspectRatio` is on
// the dimensions object too but no component reads it; `getDimensions()`
// destructures `{ width, height }` only. `lqip` is similarly fetched-but-
// unused on every section image — `SanityImage` doesn't render it. Blog
// post hero (`blog/[slug].astro`) uses lqip and keeps its own projection.
//
// Referenced docs (`testimonials[]->`, etc.) get explicit projections
// rather than bare `->` because a bare deref pulls the entire target doc
// — every field, `_rev`, `_createdAt`, and (in preview) stega markers on
// each editable string. Section components only consume a known subset.
export const SECTION_PROJECTION = /* groq */ `
  ...,
  image {
    ...,
    asset->{
      _id,
      metadata { dimensions { width, height } }
    }
  },
  backgroundImage {
    ...,
    asset->{
      _id,
      metadata { dimensions { width, height } }
    }
  },
  foregroundImage {
    ...,
    asset->{
      _id,
      metadata { dimensions { width, height } }
    }
  },
  images[] {
    ...,
    asset->{
      _id,
      metadata { dimensions { width, height } }
    }
  },
  columns[] {
    ...,
    image {
      ...,
      asset->{
        _id,
        metadata { dimensions { width, height } }
      }
    },
    ctaLink {
      ...,
      internal->{ _type, "slug": slug.current }
    }
  },
  steps[] {
    ...,
    image {
      ...,
      asset->{
        _id,
        metadata { dimensions { width, height } }
      }
    }
  },
  ctaLink {
    ...,
    internal->{ _type, "slug": slug.current }
  },
  testimonials[]->{
    _id, testimonial, client, starRating, source, sourceUrl, reviewDate,
    image {
      ...,
      asset->{ _id, metadata { dimensions { width, height } } }
    }
  },
  specificPosts[]->{
    _id, title, "slug": slug.current, publishDate, excerpt,
    coverImage {
      ...,
      asset->{ _id, metadata { dimensions { width, height } } }
    },
    "categories": categories[]->{ name, "slug": slug.current }
  },
  filterByCategory->{ "slug": slug.current, name },
  embed->{ rawHtml, containerWidth, containerHeight }
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
      sectionDarkText, vibrant, btnBg, btnText
    },
    defaultPalette
  }
`
