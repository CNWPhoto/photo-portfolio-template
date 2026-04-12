# Deferred Features

Section features that exist in the Sanity schema but are not yet implemented (or only partially implemented) in the Astro components. These are safe to leave in place — unused schema fields and CSS variants have zero impact on site speed or bundle size because Astro renders server-side and only ships what each page actually uses.

When you want a feature turned on, point Claude Code at the relevant entry below.

---

## How to use this doc

- **Status: schema-only** — the field exists in Sanity but the component ignores it. Editors can set the value; it just won't render.
- **Status: partial** — some variants or options work, others don't.
- **Status: placeholder** — the component outputs a stub or fallback instead of the real feature.

To enable a feature, tell Claude Code: *"Enable [feature name] from deferred-features.md"* — it has enough context to find the files and implement it.

---

## 1. Gallery Lightbox

**Status:** schema-only
**Section:** `galleryGridSection`
**Schema field:** `lightbox` (boolean, default: true)
**Schema file:** `studio/schemaTypes/sections/galleryGridSection.js`
**Component:** `src/components/sections/GalleryGridSection.astro`

The field is stored and passed as `data-lightbox` on the section element, but no click-to-enlarge JavaScript exists. Needs: a lightbox script (overlay, image scaling, prev/next navigation, ESC/click-outside close, focus trap).

---

## 2. Steps Section — Layout Variants

**Status:** partial (only `horizontal-cards` renders)
**Section:** `stepsSection`
**Schema field:** `variant` (radio: `stacked` / `timeline` / `horizontal-cards`)
**Schema file:** `studio/schemaTypes/sections/stepsSection.js`
**Component:** `src/components/sections/StepsSection.astro`

The component always renders a horizontal 3-column card grid regardless of the variant value. Missing implementations:
- **`stacked`** — vertical layout, one step per row, full-width
- **`timeline`** — vertical timeline with connecting line and alternating left/right content

The `image` field on each step item is also defined in the schema but never rendered.

---

## 3. Testimonials — Grid and Single-Featured Layouts

**Status:** partial (only `slider` renders)
**Section:** `testimonialsSection`
**Schema field:** `layout` (radio: `slider` / `grid` / `single-featured`)
**Schema file:** `studio/schemaTypes/sections/testimonialsSection.js`
**Component:** `src/components/sections/TestimonialsSection.astro`

Only the slider carousel is implemented. Missing:
- **`grid`** — multi-column grid of testimonial cards (2 or 3 columns)
- **`single-featured`** — large single testimonial with prominent image and quote

---

## 4. FAQ — Two-Column Layout

**Status:** partial (`accordion` and `flat-list` work; `two-column` does not)
**Section:** `faqSection`
**Schema field:** `layout` (radio: `accordion` / `two-column` / `flat-list`)
**Schema file:** `studio/schemaTypes/sections/faqSection.js`
**Component:** `src/components/sections/FaqSection.astro`

Missing:
- **`two-column`** — questions and answers laid out in a two-column grid instead of a single list

---

## 5. Featured Portfolio — Full Layout System

**Status:** placeholder (renders hardcoded 2-image layout)
**Section:** `featuredPortfolioSection`
**Schema fields:** `layout` (radio: `grid-3` / `grid-4` / `masonry` / `carousel`), `source`, `itemCount`, `filterByCategory`, `showCategory`, `items[]`
**Schema file:** `studio/schemaTypes/sections/featuredPortfolioSection.js`
**Component:** `src/components/sections/FeaturedPortfolioSection.astro`

The schema is fully built out for a rich portfolio showcase, but the component ignores nearly all of it. Missing:
- All 4 grid/layout modes
- Source selection (latest vs. hand-picked)
- Category filtering
- Item count limits
- Category badge display
- CTA button

This is the largest gap between schema and component.

---

## 6. Split Section — Image Aspect Ratio

**Status:** schema-only
**Section:** `splitSection`
**Schema field:** `imageAspectRatio` (radio: `square` / `portrait-4-5` / `landscape-3-2` / `auto`)
**Schema file:** `studio/schemaTypes/sections/splitSection.js`
**Component:** `src/components/sections/SplitSection.astro`

The field is stored but the component uses hardcoded aspect ratios per variant (`3/4` for image-left, `1/1` for image-right, stretch for full-bleed). Implementing this would let editors control image crop per section.

---

## 7. FAQ — Schema.org Markup Toggle

**Status:** schema-only
**Section:** `faqSection`
**Schema field:** `showSchema` (boolean, default: true)
**Schema file:** `studio/schemaTypes/sections/faqSection.js`
**Component:** `src/components/sections/FaqSection.astro`

The field exists but the component doesn't emit `<script type="application/ld+json">` FAQ structured data. Note: the `[...slug].astro` page route *does* generate FAQ schema.org markup by scanning for faqSection in the sections array, so this partially works at the page level — but the per-section toggle is ignored.

---

## 8. Contact Form — Destination Email Override

**Status:** schema-only
**Section:** `contactFormSection`
**Schema field:** `destinationEmail` (string)
**Schema file:** `studio/schemaTypes/sections/contactFormSection.js`
**Component:** `src/components/sections/ContactFormSection.astro`

Web3Forms routing is configured via the access key, not a destination email field. This field could be wired to a hidden `to` form field if Web3Forms supports it, or used in the email subject line.

---

## 9. Full-Bleed Image — Parallax Schema Description

**Status:** working (but docs are wrong)
**Section:** `fullBleedImageSection`
**Schema field:** `parallax` (boolean)
**Schema file:** `studio/schemaTypes/sections/fullBleedImageSection.js`
**Component:** `src/components/sections/FullBleedImageSection.astro`

The schema description says "background-attachment: fixed" but the actual implementation uses JavaScript `requestAnimationFrame` scroll-based parallax with `translateY`. The feature works — only the schema description text is inaccurate. The overlay-card variant always uses parallax; the default variant uses `background-attachment: fixed` on `.why__image-full`. The `parallax` boolean field is not currently read by the component — it's either always-on (overlay-card) or always CSS-fixed (default).

---

## Quick reference: what's fully working

These sections have complete schema-to-component parity:

| Section | Variants | Notes |
|---|---|---|
| Hero | slider, image-full, image-right | All text positions, sticky, overlay |
| Split | image-left, image-right, both full-bleed | All layout/alignment options |
| Full-Bleed Image | default (parallax), overlay-card | Both text containers |
| Rich Text | — | All widths, alignment |
| Pull Quote | centered, bordered-left, italic-large | All 3 variants |
| Three Column | image-cards, icon-cards, numbered-steps | Side label, alignment |
| Divider | line, dots, ornament | Label option |
| CTA Band | centered, split, overlapping-images | All 3 layouts |
| Contact Form | built-in, embed | Custom fields, Web3Forms |
| Contact Info | inline, card | Email, phone, social, map |
| Blog Teaser | grid-3, horizontal-list, cards | Source selection, toggles |
| HTML Embed | — | Reusable document refs |
| Gallery Grid | grid-2/3/4, masonry | All layouts (no lightbox) |
