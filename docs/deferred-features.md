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

**Status:** removed (was partial — only `horizontal-cards` was implemented)
**Section:** `stepsSection`
**Schema field:** `variant` (was: radio `stacked` / `timeline` / `horizontal-cards`)
**Schema file:** `studio/schemaTypes/sections/stepsSection.js`
**Component:** `src/components/sections/StepsSection.astro`

The component always rendered a horizontal 3-column card grid regardless of the variant value, so picking "Stacked" or "Timeline" did nothing. Removed the field entirely. The component keeps rendering horizontal cards unconditionally. To restore, re-add the `variant` field and implement:
- **`stacked`** — vertical layout, one step per row, full-width
- **`timeline`** — vertical timeline with connecting line and alternating left/right content

The `image` field on each step item is also defined in the schema but never rendered.

---

## 3. Testimonials — Grid and Single-Featured Layouts

**Status:** removed (was partial — only `slider` was ever implemented)
**Section:** `testimonialsSection`
**Schema field:** `layout` (was: radio `slider` / `grid` / `single-featured`)
**Schema file:** `studio/schemaTypes/sections/testimonialsSection.js`
**Component:** `src/components/sections/TestimonialsSection.astro`

The schema used to offer three layouts but the Astro component hardcodes the slider carousel and ignored the field — picking "Grid" or "Single featured" silently fell back to the slider, confusing editors. Removed the `layout` field entirely. The component still renders a slider unconditionally. To restore, re-add the `layout` field to the schema and implement:
- **`grid`** — multi-column grid of testimonial cards (2 or 3 columns)
- **`single-featured`** — large single testimonial with prominent image and quote

---

## 4. FAQ — Two-Column Layout

**Status:** removed (was partial — `two-column` was never implemented)
**Section:** `faqSection`
**Schema field:** `layout` (now: radio `accordion` / `flat-list`; previously also offered `two-column`)
**Schema file:** `studio/schemaTypes/sections/faqSection.js`
**Component:** `src/components/sections/FaqSection.astro`

Picking "Two column" silently rendered as a flat list. Removed the option from the layout dropdown to stop offering a broken choice. To restore, re-add `{title: 'Two column', value: 'two-column'}` to the layout dropdown and implement the two-column grid layout in `FaqSection.astro`.

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

**Status:** removed (was schema-only)
**Section:** `splitSection`
**Schema field:** `imageAspectRatio` (was: radio `square` / `portrait-4-5` / `landscape-3-2` / `auto`)
**Schema file:** `studio/schemaTypes/sections/splitSection.js`
**Component:** `src/components/sections/SplitSection.astro`

The component uses hardcoded aspect ratios per variant (`3/4` for image-left, `1/1` for image-right, stretch for full-bleed) and was ignoring the field entirely. Removed from the schema to reduce editor confusion. To restore, re-add the field to `splitSection.js` and wire `section.imageAspectRatio` into the CSS per variant.

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

## 9. Section Spacing — removed site-wide

**Status:** removed (was a no-op on most sections)
**Section:** every section that used `sectionBaseFields()` (hero, split, full-bleed image, rich text, three-column, steps, gallery, divider, CTA band, contact form, contact info, testimonials, FAQ, featured portfolio, pull quote, blog teaser, HTML embed)
**Schema field:** `spacing` (was: radio `compact` / `normal` / `spacious`, defined on `sectionBaseFields`)
**Schema file:** `studio/schemaTypes/_shared/sectionBase.js`
**Components:** `src/components/sections/*.astro` (many read `data-spacing` but the CSS effect was inconsistent and invisible on most variants)

Most components either had `padding: 0 !important` to reach for their own layout system or rendered spacing via fixed-height sections, which made "Compact / Normal / Spacious" a silent no-op — editors would set "Spacious" and nothing would change. Removed the field entirely from `sectionBaseFields` and removed the `withSpacing` parameter. The Astro components still emit `data-spacing="normal"` via their fallback default, so the existing `section[data-spacing='normal']` CSS in `src/styles/palette.css` keeps producing the same default rhythm. To restore per-section spacing, re-add the field to `sectionBaseFields.js` and ensure every consumer component actually responds to `data-spacing` values (e.g., by moving outer padding off the base `.isplit { padding: 0 !important }` pattern).

---

## 10. Hero — Niche Keyword

**Status:** removed (was schema-only fallback)
**Section:** `heroSection`
**Schema field:** `nicheKeyword` (was: string, free text)
**Schema file:** `studio/schemaTypes/sections/heroSection.js`
**Component:** `src/components/sections/HeroSection.astro`

Originally intended as an image alt-text fallback and SEO keyword hint (e.g. "Denver dog photographer") for template forks. In practice the component only used it as a last-resort fallback for the `heading` field, which is confusing — editors couldn't tell whether it controlled copy or SEO, and it duplicated functionality of the seo/heading fields. Removed from the schema and the `section?.heading || section?.nicheKeyword` fallback in the Astro component. To restore, pick one clear use case (alt text for hero images OR automatic H1 fallback) and wire it explicitly.

---

## 11. Split Section — Vertical Side Label

**Status:** removed
**Section:** `splitSection`
**Schema field:** `verticalSideLabel` (was: string, inherited from `sectionBaseFields({withVerticalSideLabel: true})`)
**Schema file:** `studio/schemaTypes/sections/splitSection.js`
**Component:** `src/components/sections/SplitSection.astro`

A small rotated uppercase label ("INTRO", "ABOUT", etc.) pinned to the left edge of the section. Looked fine on the contained image-left variant but collided with the image column on image-right and the full-bleed variants, and never landed visually correctly across all four layouts. Removed from Split only — other sections that use it (`threeColumnSection`, `faqSection` list variant, `featuredPortfolioSection`) still have the option. To restore on Split, pass `{withVerticalSideLabel: true}` in the `sectionBaseFields` call, re-add the `{sideLabel && <div class="isplit__side-label">...</div>}` JSX, and re-add the `.isplit__side-label` CSS block with per-variant positioning fixes.

---

## 12. Full-Bleed Image — Parallax (wired to field)

**Status:** working — the Parallax checkbox now actually gates the behavior
**Section:** `fullBleedImageSection`
**Schema field:** `parallax` (boolean, default: false)
**Schema file:** `studio/schemaTypes/sections/fullBleedImageSection.js`
**Component:** `src/components/sections/FullBleedImageSection.astro`

Previously the schema boolean was silently ignored — the overlay-card variant always used JS `translateY` parallax and the default variant always used CSS `background-attachment: fixed`. The component now reads `section.parallax`, emits `data-parallax="true|false"` on the section root, gates the CSS `background-attachment: fixed` on `[data-parallax='true']`, and short-circuits the overlay-card rAF scroll handler when the attribute is false. Set Parallax in the Sanity field to enable the effect; leave it off for static backgrounds. `prefers-reduced-motion: reduce` still disables the rAF handler regardless. Mobile (< 900px) disables `background-attachment: fixed` because iOS Safari doesn't support it — this is expected.

---

## 13. Full-Bleed Image — Hero/Text Stack variant

**Status:** removed
**Section:** `fullBleedImageSection`
**Schema field:** `textContainer` (removed value: `inline-overlay`), `textPosition` (removed entirely)
**Schema file:** `studio/schemaTypes/sections/fullBleedImageSection.js`
**Component:** `src/components/sections/FullBleedImageSection.astro`

A layout where the background image sat on top and a two-column heading+body text block rendered directly below in the same section (the former `.why__*` block — heading col with accent left-border, content col with body/cta/caption). Removed from the `textContainer` dropdown because the visual outcome overlapped with an image-only `fullBleedImageSection` stacked above a `splitSection` or `richTextSection`, so editors had two ways to do the same thing. The `textPosition` field (9-point grid) was only read by this variant and has also been removed. To restore: re-add `{title: 'Hero/Text Stack (image on top, text below)', value: 'inline-overlay'}` to the `textContainer` options list, re-add the `textPosition` field, and restore the third branch in `FullBleedImageSection.astro` (the `.why` section + `.why__image-full` + `.why__inner` grid) along with its CSS block.

---

## Quick reference: what's fully working

These sections have complete schema-to-component parity:

| Section | Variants | Notes |
|---|---|---|
| Hero | slider, image-full, image-right | All text positions, sticky, overlay |
| Split | image-left, image-right, both full-bleed | All layout/alignment options |
| Full-Bleed Image | overlay-card, image-only | Parallax on both via `background-attachment: fixed` |
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
