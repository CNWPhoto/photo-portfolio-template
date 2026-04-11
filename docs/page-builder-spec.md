# Page Builder Spec

A unified, section-based page builder for the photo portfolio template. One library of reusable sections, usable on any page, authored in Sanity, rendered by a single dispatcher in Astro. This doc is the implementation spec — Claude Code (or a human) should be able to follow it end-to-end.

## Goals

- One section library shared by every editable page.
- Clients can create new pages with arbitrary slugs and arrange any sections they want.
- Palette/theme is data-driven — new color schemes don't require code changes.
- Mobile-first, accessible, consistent vertical rhythm.
- Clean rewrite: no legacy compatibility needed (no live clients yet).
- Preserve existing site content as base template that shows up at launch.

## Non-Goals

- Sanity migrations (blank slate).
- Multi-language.
- A/B variants.
- E-commerce.
- Visual drag-and-drop page preview (Sanity Presentation stays, but we're not writing a custom page-builder UI — just using the standard section array editor).

---

## 1. Page Model

### Unified `page` document

Replaces: `aboutPage`, `experiencePage`, `contactPage`, `notFoundPage` (404 stays as a special singleton, see below), and any future page.

Fields:
- `title` (string, required) — internal editor title
- `slug` (slug, required, unique, validated)
  - **Reserved slugs** (must reject): `api`, `blog`, `portfolio`, `preview`, `admin`, `studio`, `404`, `category`, any slug starting with `_` (leading underscore), empty string. Validator runs on save and shows "Slug is reserved — pick a different one" error.
- `seo` (object) — reuses existing `seo` schema (seoTitle, seoDescription, socialImage, noIndex)
- `sections[]` (array of all section types — see section catalog below)
- `navigation` (object)
  - `showInNav` (boolean, default false)
  - `navLabel` (string, optional — falls back to `title`)
  - `navOrder` (number)
- `defaultPalette` (reference to a palette in siteSettings, optional — falls back to site default)
- `navThemeOverHero` (string: `light | dark | auto`, default `auto`) — controls nav color when overlaid on the first section. `auto` reads the first section's palette.

### Singletons kept

- **`homepagePage`** — singleton, known ID, routed at `/`. Has TWO content fields:
  - **`hero: heroSection`** — top-level field, always first, **cannot be reordered**. Editors edit the hero in a dedicated form section. Matches today's structure exactly.
  - **`sections[]`** — array of any section types, drag-to-reorder. Initial seed value matches today's order: `[welcomeSection (split), testimonialsSection, featuredPortfolioSection, stepsSection, fullBleedImageSection (whyChoose), faqSection (list)]` translated into the new section catalog.
  - Editor `groups: [all, seo]` for split UI between content + SEO fields.
- **`portfolioPage`** — singleton, index of portfolio items. Not a free-form page. Has its own gallery layout config (`galleryColumns: 2|3|4`, `byline`, `pageTitle`, `seo`, `images[]`).
- **`blogPage`** — singleton, index of blog posts. Not a free-form page. Has `blogEnabled` toggle that hides blog from nav/footer/sitemap when off.
- **`notFoundPage`** — singleton, renders at the 404 route. Currently has flat fields (`image, heading, subheading, ctaText, ctaLink`). **Migrated to use `sections[]` shape** for consistency with the unified page model. The seed script translates today's 5 flat fields into a single `fullBleedImageSection` (full-bleed background image with overlay text card containing heading + subheading + CTA).
- **`siteSettings`** — extended with `palettes[]`, `defaultPalette` reference, `web3formsKey`. Existing fields preserved: `siteName`, `photographerName`, `logoType`, `logoImage`, `favicon`, `colorTheme` (deprecated alias to `defaultPalette.slug`), `fontTheme`, `textColorPreset`, `accentColorOverride`.
- **`navSettings`** — extended per §9 with dropdown support (`children[]` per link, `linkType`, `internalRef`).
- **`footerSettings`** — restructured per §1a (free-form `links[]` replacing key-based menu, `htmlEmbedSection` reference replacing raw `embedCode`).
- **`socialSettings`** — unchanged. Fields: `instagram`, `facebook`, `youtube`, `tiktok`, `custom: {label, url}`.
- **`seoSettings`** — unchanged. Drives schema.org generation (see §7b).
- **`codeSettings`** — unchanged. `headScripts` + `bodyScripts` raw HTML injection.

### What gets deleted

- `aboutPage`, `experiencePage`, `contactPage` document types (replaced by `page`)
- All `sections/about*`, `sections/experience*`, `sections/welcomeSection`, `sections/whyChooseSection`, `sections/heroSection` (the experienceHero / aboutIntroSection etc. — the niche-named variants). Replaced by the unified catalog.
- All `src/components/intro/`, `src/components/howitworks/`, `src/components/portfolio/` (the variant-split components get merged into single palette-aware versions)
- All 13 dead top-level `src/components/*.astro` files listed in §14
- All legacy `bodyParagraph1`/`bodyFirst`/`bodySecond` fields (already redundant; this task kills them completely)

---

## 1a. Footer Model

The footer is **NOT section-based**. It's a dedicated `<Footer>` component with its own schema and its own link list. Editors manage footer content independently from page sections and from the main nav.

### Schema (replaces current `footerSettings.js`)

```
footerSettings (singleton)
  links[]: footerLink[]    (free-form, identical shape to navSettings.links[] minus children — no dropdowns in footer)
  middleColumn: object {
    enabled: boolean
    label: string                           (e.g. "Newsletter", "Stay in Touch")
    embed: reference(htmlEmbedSection)      (replaces current raw embedCode field)
    note: portableText                      (used when embed is not set)
  }
  legalLinks: object {
    privacyPolicy: { enabled, label, url }
    terms:         { enabled, label, url }
  }
```

### Migration from current schema

The current `footerSettings.menu` is a rigid object with hardcoded keys (`menu.home.enabled`, `menu.about.enabled`, etc.). It's replaced by the free-form `links[]` array. The seed script populates the new `links[]` with the same default labels (Home, About, Experience, Portfolio, Blog, Contact) so first-load behavior matches today's site.

The current `footerSettings.middleColumn.embedCode` raw HTML field is **deleted**. Replaced by a `reference` to a `htmlEmbedSection` document (see §13a). Editors create one or more reusable HTML embed documents (e.g. "Mailchimp Newsletter Signup") and reference them from the footer or from a page section. This centralizes raw-HTML risk to a single document type with explicit warning copy.

### Why footer is separate from nav

Per spec decision: clients want different/additional links in the footer vs nav. The footer often includes secondary links (Privacy Policy, Terms, sitemap, RSS) that don't belong in the main nav. Keeping them as independent link lists matches editor expectations.

### Rendering

`<Footer>` component (`src/components/Footer.astro`) survives largely intact. It already does its own data fetch — preserved. Only the `menu` query and the embedCode rendering paths change (to read from the new `links[]` and `embed` reference). Inline SVG icon system for social platforms preserved verbatim.

---

## 2. Section Catalog

All sections share a common base shape:

```
common fields (on every section):
  enabled: boolean (default true)                — show/hide toggle
  palette: reference to siteSettings.palettes[]  — optional override
  spacing: 'compact' | 'normal' | 'spacious'     — default 'normal'
  sectionId: string                              — optional anchor (e.g. "contact" → #contact)
```

These are implemented via a shared fieldset or spread helper in `studio/schemaTypes/_shared/sectionBase.js`.

### Heading multi-line convention

Several existing components support **literal `\n` in heading strings** to render as `<br/>` line breaks. For example, the current `whyChooseSection.heading` has the initial value `'Why Choose\nOur Studio?'` which renders as two lines on the page. This is implemented in `WhyChoose.astro` line 13: `headingRaw.replace(/\n/g, '<br />')` after escaping HTML entities.

**The new section components must preserve this convention.** Any section with a `heading: string` field that supports multi-line rendering (heroSection, fullBleedImageSection, splitSection, threeColumnSection, faqSection, ctaBandSection) renders `\n` as `<br/>` in the output. Document this in the schema field `description`: "Use a line break (Enter) to split onto two lines."

Implementation pattern (shared helper `src/lib/heading.js`):
```js
export function renderHeading(raw) {
  if (!raw) return '';
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />');
}
```
Used via `<h1 set:html={renderHeading(heading)} />` in section components.

### Layout blocks

#### `heroSection`
Full-width hero. Replaces all current hero variants.

Fields:
- `variant`: `image-full` | `image-right` | `slider`
- `images[]`: array of images with alt (used by slider; falls back to first for non-slider)
- `eyebrow`: string, small uppercase label
- `heading`: string (supports line breaks)
- `subheading`: string
- `ctaText`: string
- `ctaLink`: object `{ type: 'internal' | 'external', internal: ref to page, external: url }`
- `textAlignment`: `left` | `center` | `right`
- `textPosition`: `top-left` | `top-center` | `top-right` | `center-left` | `center-center` | `center-right` | `bottom-left` | `bottom-center` | `bottom-right`
- `heightMode`: `auto` | `tall` | `fullscreen` (55vh / 75vh / 100vh)
- `overlayOpacity`: number 0–100 (default 30)
- `nicheKeyword`: string (optional, for image alt fallback — preserved from current hero)

#### `splitSection` — the workhorse
Two-column image + rich text. Replaces `aboutIntroSection`, `aboutPersonalSection`, `welcomeSection`, `experienceIntro`.

Fields:
- `imageLayout`: `image-left` | `image-right` | `image-left-full-bleed` | `image-right-full-bleed`
- `eyebrow`: string
- `heading`: string
- `body`: portable text (bold, italic, links)
- `ctaText`: string
- `ctaLink`: `{ type, internal, external }`
- `image`: image with alt + hotspot
- `imageAspectRatio`: `square` | `portrait-4-5` | `landscape-3-2` | `auto`
- `textAlignment`: `left` | `center` | `right`
- `verticalAlignment`: `top` | `center` | `bottom`
- `mobileOrder`: `image-first` | `text-first` (default `image-first`)

#### `fullBleedImageSection`
Full-width background image with overlaid text card or inline text. Replaces `experienceNextSteps` background, `whyChooseSection` background.

Fields:
- `image`: image with alt
- `eyebrow`: string
- `heading`: string
- `body`: portable text
- `ctaText`: string
- `ctaLink`: `{ type, internal, external }`
- `caption`: string (small text below CTA)
- `textContainer`: `overlay-card` | `inline-overlay` (card = white box floated on image; inline = text directly on image with overlay)
- `textPosition`: nine-point grid (`top-left` … `bottom-right`)
- `overlayOpacity`: number 0–100
- `height`: `medium` | `tall` | `viewport`
- `parallax`: boolean (default false)

#### `richTextSection`
Standalone body of text, no image. For about blurbs, policies, long-form copy on any page.

Fields:
- `eyebrow`: string
- `heading`: string
- `body`: portable text (all marks, h2/h3, lists, blockquote, links)
- `textAlignment`: `left` | `center`
- `maxWidth`: `narrow` (600px) | `default` (760px) | `wide` (1100px)

#### `pullQuoteSection`
Single featured quote. Replaces `aboutQuoteSection`.

Fields:
- `quote`: text
- `attribution`: string (optional)
- `variant`: `centered` | `bordered-left` | `italic-large`

#### `threeColumnSection`
Three side-by-side cards. Replaces `aboutWhatToExpectSection`, `processSection` (columns variant).

Fields:
- `eyebrow`: string (vertical side label, optional)
- `heading`: string
- `columns[]` (exactly 3; validation min 3 max 3): each
  - `image`: image with alt (optional)
  - `icon`: string (optional, if using icon variant)
  - `title`: string
  - `body`: portable text
- `variant`: `image-cards` | `icon-cards` | `numbered-steps`
- `alignment`: `left` | `center`

#### `stepsSection`
Vertical or horizontal step-by-step list. Replaces `processSection` (which has both stacked and columns variants today). The current `processSection` uses 3 hardcoded flat fields (`step1Title/step1Body`, etc.) — the new schema uses an `array` so editors can have any number of steps.

Fields:
- `eyebrow`: string
- `heading`: string
- `steps[]`: each
  - `stepNumber`: string (optional, e.g. "01")
  - `title`: string
  - `body`: portable text
  - `image`: image (optional)
- `variant`: `stacked` | `timeline` | `horizontal-cards`
- `ctaText`: string (optional — current processSection has a CTA at the bottom; preserved here)
- `ctaLink`: `{ type, internal, external }` (optional)

#### `galleryGridSection`
Image grid. Separate from `featuredPortfolioSection` — this is a manual list of arbitrary images, not pulled from portfolio.

Fields:
- `eyebrow`: string
- `heading`: string
- `images[]`: images with alt + optional caption
- `layout`: `grid-2` | `grid-3` | `grid-4` | `masonry`
- `gap`: `tight` | `normal` | `loose`
- `lightbox`: boolean (default true)

#### `ctaBandSection`
Horizontal call-to-action strip.

Fields:
- `heading`: string
- `body`: string (short, one or two sentences)
- `ctaText`: string
- `ctaLink`: `{ type, internal, external }`
- `backgroundImage`: image (optional)
- `layout`: `centered` | `split-text-left-cta-right`

#### `dividerSection`
Visual break between sections. Subtle but useful.

Fields:
- `label`: string (optional, small italic text in the middle of the line)
- `style`: `line` | `dots` | `ornament`

### Purpose blocks

#### `testimonialsSection`
Fields:
- `heading`: string
- `eyebrow`: string
- `layout`: `slider` | `grid` | `single-featured`
- `source`: `all` | `pickSpecific`
- `testimonials[]`: references to testimonial docs (when `pickSpecific`)
- `maxCount`: number (when `all`, limits count)

#### `faqSection`
Fields:
- `heading`: string
- `eyebrow`: string
- `layout`: `accordion` | `two-column` | `flat-list`
- `faqs[]`: inline objects, each `{ question: string, answer: portable text }`
- `showSchema`: boolean (emit FAQ schema.org markup, default true)

#### `featuredPortfolioSection`
Pulls from portfolio collection.

Fields:
- `eyebrow`: string
- `heading`: string
- `layout`: `grid-3` | `grid-4` | `masonry` | `carousel`
- `source`: `latest` | `pickSpecific`
- `itemCount`: number (when `latest`)
- `items[]`: references to portfolio docs (when `pickSpecific`)
- `filterByCategory`: string (optional, when `latest`)
- `showCategory`: boolean
- `ctaText`: string (e.g. "View all")
- `ctaLink`: `{ type, internal, external }`

#### `blogTeaserSection`
Fields:
- `eyebrow`: string
- `heading`: string
- `layout`: `grid-3` | `horizontal-list` | `cards`
- `source`: `latest` | `pickSpecific`
- `postCount`: number (when `latest`)
- `specificPosts[]`: references to blog docs (when `pickSpecific`)
- `showCategory`: boolean
- `showExcerpt`: boolean
- `showDate`: boolean
- `ctaText`: string
- `ctaLink`: `{ type, internal, external }`

#### `contactFormSection`
Supports two modes: the built-in Cloudflare-backed form, or an embedded third-party form (Jotform, Typeform, Google Forms, etc.).

Fields:
- `eyebrow`: string
- `heading`: string
- `body`: portable text (short intro)
- `mode`: `built-in` | `embed` (default `built-in`)

**Built-in mode fields** (shown when `mode === 'built-in'`):
- `formFields[]`: configurable field list, each `{ name: string, label: string, type: text|email|tel|textarea|select, required: boolean, options[]: for select }`
  - Default-seeded with: name (text, required), email (email, required), message (textarea, required)
- `submitText`: string (default "Send")
- `successMessage`: string (default "Thanks — we'll be in touch soon.")
- `errorMessage`: string (default "Something went wrong. Please try again or email us directly.")
- `destinationEmail`: string (optional; falls back to site-wide default in `siteSettings.contactDestinationEmail`)

**Embed mode fields** (shown when `mode === 'embed'`):
- `embedUrl`: url, validated — the iframe source (e.g. a Jotform share URL)
- `embedHeight`: number, in pixels (default 600)
- `embedTitle`: string — iframe `title` attribute for a11y (default "Contact form")

The frontend renders a sandboxed `<iframe>` in embed mode. Raw HTML/script embeds are deliberately not supported — only URL-based iframes — to avoid injection risk via compromised datasets.

Backend implementation for built-in mode: see §14 Contact Form Backend.

#### `contactInfoSection`
Fields:
- `heading`: string
- `body`: portable text (short)
- `showEmail`: boolean
- `emailOverride`: string (optional, else falls back to socialSettings)
- `showPhone`: boolean
- `phoneOverride`: string
- `showSocial`: boolean
- `showMap`: boolean
- `mapEmbedUrl`: url (optional)
- `layout`: `inline` | `card`

#### `htmlEmbedSection`
A reusable raw-HTML embed for newsletter signups (Mailchimp / ConvertKit / Klaviyo), calendar widgets (Calendly), maps, or any third-party widget that needs raw HTML/script. **This is the only place in the entire schema where raw HTML is accepted from the editor** — concentrating the trust requirement to a single document type with explicit warnings.

Stored as its own document type (not just a section) so it can be created once and referenced from multiple places (a section on a page, the footer middle column, etc.).

Schema:
- `name`: string, required — internal label (e.g. "Mailchimp Newsletter")
- `description`: text, optional — internal note about what this embed does
- `rawHtml`: text, required — the actual embed code
- `containerWidth`: `narrow | default | wide | full` — controls max-width of the rendered embed
- `containerHeight`: number, in pixels, optional — fixes height (useful for iframe widgets)

Schema-level description (shown above the `rawHtml` field in Studio):

> ⚠️ **Trust required.** This field accepts raw HTML and scripts that will run on your live site. Only paste embed code from services you trust (Mailchimp, ConvertKit, Calendly, Google Maps, etc.). Pasting code from untrusted sources can break your site or expose visitors to malicious scripts.

Used as a section directly in `sections[]`, AND referenced from `footerSettings.middleColumn.embed`. The Footer component and the SectionRenderer both render via the same `<HtmlEmbedSection>` Astro component which wraps the content in a properly-sized container.

### Category groupings (for Studio UX)

When exposed in the `sections[]` array type, group them:

- **Hero**: `heroSection`
- **Layout**: `splitSection`, `fullBleedImageSection`, `richTextSection`, `pullQuoteSection`, `threeColumnSection`, `stepsSection`, `galleryGridSection`, `dividerSection`
- **CTA**: `ctaBandSection`, `contactFormSection`, `contactInfoSection`
- **Dynamic**: `testimonialsSection`, `faqSection`, `featuredPortfolioSection`, `blogTeaserSection`
- **Embed**: `htmlEmbedSection`

Sanity's `of: []` array type allows grouping via the `insertMenu` configuration in schema v3. Use `insertMenu.groups` to categorize.

---

## 3. Color Palette System

The 5 existing color themes hardcoded in `src/layouts/Layout.astro` (lines ~310–403) are migrated **as data** into `siteSettings.palettes[]`. Same names, same values, same CSS variable structure. Clients can edit them in Studio. New themes can be added without code changes.

### The 5 default palettes (seeded from current values)

The seed script copies the existing CSS values verbatim:

| Name | Slug | bg | text | accent | accent-dark |
|---|---|---|---|---|---|
| Classic Cream | `classic-cream` | `#f5f3ef` | `#1a2744` | `#8b2635` | `#6b1c28` |
| Warm Studio | `warm-studio` | `#fdf6ee` | `#2c1810` | `#c9702a` | `#a85a20` |
| Dark Editorial | `dark-editorial` | `#1a1a1a` | `#f0ede8` | `#c9a96e` | `#a8895a` |
| Cool Minimal | `cool-minimal` | `#f8f9fa` | `#1c2b3a` | `#4a7c9e` | `#3a6480` |
| Forest Sage | `forest-sage` | `#f2f4f0` | `#1e2d1f` | `#5a7a4e` | `#456040` |

Plus the secondary tokens (`bg-alt`, `surface`, `muted`, `muted-light`, `border`, `section-alt`, `section-dark`, `section-dark-text`, `btn-bg`, `btn-text`) which all match the current Layout.astro definitions exactly. Full values live in the seed script.

### Schema shape

`siteSettings.palettes[]` — array of palette objects. Each palette has:

```
{
  name: string                  (e.g. "Classic Cream")
  slug: slug                    (auto from name; used to reference)
  bg: color                     (hex string, validated)
  bgAlt: color
  text: color
  textMuted: color              → emits as --muted
  textMutedLight: color         → emits as --muted-light
  accent: color
  accentDark: color
  border: color
  surface: color
  sectionAlt: color
  sectionDark: color
  sectionDarkText: color
  btnBg: color
  btnText: color
}
```

Plus a top-level `siteSettings.defaultPalette: reference` pointing to one of the palettes (replaces the current `siteSettings.colorTheme` string field — but seeded with the same value).

### Default resolution order

Per-section: explicit `palette` reference field → page `defaultPalette` → site default (`siteSettings.defaultPalette`) → `:root` fallback CSS.

### Rendering — inline CSS custom properties

Each section's Astro component wraps itself in a root `<section>` element with inline CSS custom properties:

```astro
<section
  class="section heroSection"
  data-spacing={spacing}
  style={paletteToStyle(palette)}
>
  ...
</section>
```

`paletteToStyle()` returns:

```
--bg:#f5f3ef; --bg-alt:#edeae4; --text:#1a2744; --muted:#4a5568;
--muted-light:#8a94a6; --accent:#8b2635; --accent-dark:#6b1c28;
--border:#d4cfc6; --surface:#edeae4; --section-alt:#edeae4;
--section-dark:#1a2744; --section-dark-text:#f5f3ef;
--btn-bg:#8b2635; --btn-text:#ffffff;
```

All section CSS references `var(--bg)` / `var(--text)` / etc. and inherits the right values automatically. This is the same exact var contract Layout.astro has today — no naming changes, no rewrites of section CSS that already uses these vars.

### Legacy `data-theme` fallback

The current site uses `data-theme="..."` attribute on `<html>` AND on individual sections. This mechanism is **kept as a fallback during the rewrite** so any un-migrated component still themes correctly. The block of CSS at lines ~310–403 of Layout.astro stays in place (matching the seeded palette values). New sections set inline custom properties; legacy sections (until ported) read the `[data-theme="..."]` cascade. After Phase 12 cleanup, the hardcoded `data-theme` block in Layout.astro is removed and the inline-custom-prop mechanism is the only one.

### Per-client overrides — preserved

Two existing fields stay exactly as-is:

- **`siteSettings.accentColorOverride`**: hex color string, validated. When set, overrides every palette's accent. Currently emitted as a `<style set:html>` block in Layout.astro head — preserve that mechanism.
- **`siteSettings.textColorPreset`**: enum (`charcoal | black | warm-gray | cool-gray`), only applied on light themes. Same emission pattern. Preserve.

Both are documented in §3b.

### Global defaults

A new `src/styles/palette.css` defines fallback values on `:root` matching the Classic Cream palette so un-wrapped contexts (e.g. error pages, preview banner, modal overlays) still render correctly without inline props.

### Helper

`src/lib/palette.js` exports:
- `paletteToStyle(palette: Palette): string` — returns the inline CSS custom property string for use as the `style` attribute
- `resolvePalette(sectionPalette, pagePalette, sitePalette, allPalettes): Palette` — walks the resolution order
- `parseLegacyTheme(themeName: string): Palette | null` — converts a legacy `data-theme` value to a palette object for the fallback path

---

## 3a. Font Theme System

The 6 existing font themes in `Layout.astro` (lines ~261–293) stay **mostly hardcoded** in code. Reason: each theme drives a unique Google Fonts URL string that needs to be assembled at build time, with the active theme's two font families selectively loaded (the current optimization). Migrating to data would require runtime Google Fonts URL generation and would break selective loading.

### The 6 font themes

| Name | Heading | Body |
|---|---|---|
| Classic Editorial | Cormorant Garamond | Jost |
| Romantic Script | Playfair Display | Lato |
| Modern Luxury | DM Serif Display | DM Sans |
| Soft Contemporary | Fraunces | Nunito Sans |
| Bold Editorial | Libre Baskerville | Libre Franklin |
| Airy Minimal | Tenor Sans | Raleway |

### Schema field

`siteSettings.fontTheme: string` — enum picklist of the 6 values above. Already exists in `siteSettings.js`. Preserved as-is.

### Rendering

Layout.astro reads `siteSettings.fontTheme`, sets `<html data-font={fontTheme}>`, and generates the Google Fonts `<link>` URL via the existing `FONT_MAP` table. Section CSS references `var(--font-heading)` and `var(--font-body)` (also `--font-serif` / `--font-sans` legacy aliases). All preserved.

### Adding a new font theme

A future code change required:
1. Add an entry to `FONT_MAP` in Layout.astro (Google Fonts URL params)
2. Add a `html[data-font='new-name']` block defining `--font-heading` and `--font-body`
3. Add the option to `siteSettings.js` `fontThemeList`

Documented in `docs/extending-themes.md` for future maintenance (defer creating this doc — flag for later).

---

## 3b. Site-Wide Brand Overrides (preserved)

Two existing fields in `siteSettings` give clients quick brand customization without touching palette data:

### `accentColorOverride`

- Type: `string`, hex color, validated against `/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/`
- Already exists. Preserve schema and rendering logic.
- When set, Layout.astro emits an inline `<style set:html>` block in `<head>` that overrides `--accent`, `--accent-dark` (computed via `color-mix`), and `--btn-bg` site-wide.
- This wins over palette values and section overrides.

### `textColorPreset`

- Type: `string`, enum: `'' | charcoal | black | warm-gray | cool-gray`
- Already exists. Preserve.
- Only applied on light themes (`LIGHT_THEMES = ['classic-cream', 'warm-studio', 'cool-minimal', 'forest-sage']` — equivalent: any palette where `bg` luminance > 0.5).
- Layout.astro emits an inline `<style set:html>` block overriding `--text`, `--muted`, `--muted-light`.
- Used by clients who want a specific text tone (charcoal/black/warm-gray/cool-gray) regardless of palette.

Both override mechanisms must survive the rewrite verbatim. The Layout.astro head emission code stays the same.

---

## 3c. Universal CSS Tokens

Every section component MUST reference these custom properties (set globally or inherited from the section's inline palette). Document them in code as a single source of truth:

### Palette tokens (set per-section via inline style)
```
--bg, --bg-alt, --surface, --text, --muted, --muted-light, --accent, --accent-dark,
--border, --section-alt, --section-dark, --section-dark-text, --btn-bg, --btn-text,
--white (always #ffffff, set on :root)
```

### Font tokens (set on `<html>` via `data-font`)
```
--font-heading  (e.g. 'Cormorant Garamond', Georgia, serif)
--font-body     (e.g. 'Jost', system-ui, sans-serif)
--font-serif    (alias for --font-heading)
--font-sans     (alias for --font-body)
```

### Easing tokens (set on `:root` in palette.css)
```
--ease-image:  cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-reveal: cubic-bezier(0.22, 1, 0.36, 1);
```

These replace the 8+ hardcoded `cubic-bezier(...)` values currently scattered across components.

### Spacing tokens (set on `:root` in palette.css)
```
--section-pad-compact:  3rem;   /* desktop */
--section-pad-normal:   6rem;
--section-pad-spacious: 9rem;
```

Mobile (≤900px) overrides:
```
--section-pad-compact:  2rem;
--section-pad-normal:   4rem;
--section-pad-spacious: 6rem;
```

### Layout tokens (set by JS at runtime)
```
--nav-height  (set on :root by Nav.astro JS — equals nav offsetHeight)
```

### Body typography tokens (preserved verbatim from current Layout.astro)
```
body { font-size: 1.328rem; line-height: 1.8; -webkit-font-smoothing: antialiased; }
h1, h2, h3, h4 { font-style: italic; line-height: 1.2; }  /* italic by default — signature look */
html { scroll-behavior: smooth; }
```

These are NOT custom properties — they're base styles in Layout.astro that must survive verbatim.

---

## 4. Spacing System

Each section has a `spacing` field (`compact` | `normal` | `spacious`). Default `normal` matches today's behavior (current `Layout.astro` line 489: `section { padding-top: 100px; padding-bottom: 100px; }`).

CSS uses the tokens defined in §3c:
```
section[data-spacing="compact"]  { padding-block: var(--section-pad-compact); }
section[data-spacing="normal"]   { padding-block: var(--section-pad-normal); }
section[data-spacing="spacious"] { padding-block: var(--section-pad-spacious); }
```

The current global `section { padding-top: 100px; padding-bottom: 100px; }` rule in Layout.astro is removed in favor of the per-section data-spacing attribute. The default `normal` resolves to `6rem` ≈ 96px ≈ today's 100px.

---

## 5. Responsive Rules

- Mobile-first CSS.
- Breakpoints: `640px` (small), `900px` (medium), `1200px` (large).
- Split sections stack below `900px`, order controlled by `mobileOrder` field.
- Grids: `grid-4` → 2 cols below 900px → 1 col below 640px. `grid-3` → 2 cols below 900px → 1 col below 640px. `grid-2` → 1 col below 640px.
- Typography: all headings use `clamp(min, preferred, max)` so they scale without media queries.
- Images: always `sizes` attribute set correctly, `loading="lazy"` except for first section (see §7).

---

## 6. Accessibility

### Heading hierarchy

- `SectionRenderer` passes an `isFirstSection` prop to the component rendering the first section on a page.
- First section uses `<h1>` for its heading.
- All other sections use `<h2>` for their top-level heading.
- Subheadings within a section (column titles, step titles, card titles) use `<h3>`.
- Body rich text uses `<h3>`/`<h4>` only.

### Other

- All images require alt text (Sanity validation).
- CTA buttons must have discernible text (validate `ctaText` non-empty if `ctaLink` is set).
- Form fields need labels (validated in schema).
- Focus visible styles on all interactive elements.
- FAQ accordion buttons use `aria-expanded` and `aria-controls` (already correct in current FAQ component).

---

## 7. Frontend Architecture

### Routing

- `src/pages/index.astro` — fetches `homepagePage` singleton, renders hero + sections via SectionRenderer.
- `src/pages/[...slug].astro` — dynamic route, fetches `page` doc by slug, renders sections via SectionRenderer. Catches `/about`, `/services`, `/contact`, any new page.
- `src/pages/portfolio/...` — unchanged.
- `src/pages/blog/...` — unchanged.
- `src/pages/404.astro` — fetches `notFoundPage` singleton, renders via SectionRenderer.

### SectionRenderer

`src/components/SectionRenderer.astro`:

```astro
---
import SplitSection from './sections/SplitSection.astro';
import HeroSection from './sections/HeroSection.astro';
// ... all section components

const { section, isFirst, pagePalette, palettes } = Astro.props;

const componentMap = {
  heroSection: HeroSection,
  splitSection: SplitSection,
  fullBleedImageSection: FullBleedImageSection,
  richTextSection: RichTextSection,
  pullQuoteSection: PullQuoteSection,
  threeColumnSection: ThreeColumnSection,
  stepsSection: StepsSection,
  galleryGridSection: GalleryGridSection,
  ctaBandSection: CtaBandSection,
  dividerSection: DividerSection,
  testimonialsSection: TestimonialsSection,
  faqSection: FaqSection,
  featuredPortfolioSection: FeaturedPortfolioSection,
  blogTeaserSection: BlogTeaserSection,
  contactFormSection: ContactFormSection,
  contactInfoSection: ContactInfoSection,
};

const Component = componentMap[section._type];
const resolvedPalette = resolvePalette(section.palette, pagePalette, palettes);
---

{Component && section.enabled !== false && (
  <Component section={section} isFirst={isFirst} palette={resolvedPalette} />
)}
```

### Page shell

Pages become:

```astro
---
const page = await client.fetch(groq`*[_type == "page" && slug.current == $slug][0]{
  ..., sections[]{ ..., image{..., asset->}, backgroundImage{..., asset->}, ... }
}`, { slug });

const palettes = await client.fetch(groq`*[_type == "siteSettings"][0].palettes`);
const pagePalette = page.defaultPalette || null;
---

<Layout pageTitle={page.seo?.seoTitle} ...>
  {page.sections.map((section, i) => (
    <SectionRenderer
      section={section}
      isFirst={i === 0}
      pagePalette={pagePalette}
      palettes={palettes}
    />
  ))}
</Layout>
```

### GROQ query shape

Don't list every field of every section type in one projection. Instead, project all fields generically and expand known asset references:

```groq
sections[] {
  ...,
  image { ..., asset->{ _id, metadata { dimensions { width, height } } } },
  backgroundImage { ..., asset->{ _id, metadata { dimensions { width, height } } } },
  images[] { ..., asset->{ _id, metadata { dimensions { width, height } } } },
  ctaLink {
    ...,
    internal->{ "slug": slug.current }
  },
  testimonials[]->,
  items[]->,
  specificPosts[]->
}
```

Each section component destructures what it needs from `section`.

### Image loading

`isFirst` flag propagates down. First section's primary image uses `loading="eager"` and `fetchpriority="high"`. Everything else lazy.

---

## 7a. Image Optimization Standards (MUST PRESERVE + EXTEND)

Image quality is core to a photographer template. Every image rendered on the site MUST go through these layers, no exceptions.

### Existing infrastructure (preserved verbatim)

`src/lib/image.ts`:
- `buildSrc(image, width=1200)` — single URL: `urlFor(image).width(width).auto('format').quality(80).url()`
- `buildSrcset(image, widths=[400,800,1200,1600,2000,2400])` — 6-width responsive srcset, all `.auto('format').quality(80)`
- `getDimensions(image)` — extracts `image.asset.metadata.dimensions` with fallback `{width: 1200, height: 800, aspectRatio: 1.5}`

`src/components/SanityImage.astro`:
- Required `sizes` prop
- Renders `srcset` from `buildSrcset()`
- `width` / `height` attrs from metadata (CLS prevention)
- `loading='lazy'` default; can be `'eager'`
- `fetchpriority='high'` automatic when `loading='eager'`
- `decoding='sync'` for eager, `'async'` for lazy
- Alt text from `image.alt` field

### Hard rules for the rewrite

1. **Every Sanity image MUST be rendered via `<SanityImage>`.** Never use raw `<img>` tags for CMS images. The lint rule should grep `src/components/sections/` for `<img src=` and fail if any reference Sanity URLs directly.
2. **Every image field in every schema MUST have hotspot enabled and an alt-text subfield with description copy.** Pattern (used as a shared helper in `studio/schemaTypes/_shared/imageField.js`):
   ```js
   {
     type: 'image',
     options: {hotspot: true, crop: true},
     fields: [
       {
         name: 'alt',
         title: 'Alt Text',
         type: 'string',
         description: 'Describe the image for accessibility and SEO (e.g. "Black lab splashing through a mountain stream").',
         validation: (Rule) => Rule.warning('Add alt text for accessibility and SEO.'),
       },
     ],
   }
   ```
   The `Rule.warning()` (not `Rule.required()`) flags missing alt text in Studio without blocking save — keeps editors moving while nudging good practice.
3. **The portfolio sizing note must be surfaced on every image field.** Add a `description` line: "📐 Resize to 2500–3000px on the long edge before uploading. Export as JPEG (85–95%) or PNG. Sanity handles the rest."
4. **Every section component must declare a per-variant fallback image URL constant** at the top of the file (current Pexels URLs). Used when the CMS image field is empty.
5. **GROQ queries must always expand the asset metadata for dimensions:**
   ```groq
   image { ..., asset->{ _id, metadata { dimensions { width, height, aspectRatio }, lqip } } }
   ```
   `lqip` is the new addition (see below).

### NEW: LQIP (blur-up placeholder) — best-practice upgrade

Sanity automatically generates a base64 `lqip` (Low Quality Image Placeholder) data URL in `image.asset.metadata.lqip`. The rewrite uses it for hero and cover images:

```astro
---
const lqip = section.image?.asset?.metadata?.lqip;
---
<div
  class="image-wrap"
  style={lqip ? `background-image: url('${lqip}'); background-size: cover; background-position: center;` : ''}
>
  <SanityImage image={section.image} sizes="100vw" loading="eager" />
</div>
```

While the real image loads, the blurred LQIP shows as a CSS background. Once the `<img>` paints over it, the blur disappears. Big perceived performance win on hero sections and any above-fold image.

Apply LQIP to:
- `heroSection` (always)
- `splitSection` when first section on a page
- `fullBleedImageSection` (always)
- `featuredPortfolioSection` first row of images
- `blogPost` cover image on `/blog/[slug]`

Skip LQIP on small thumbnails, gallery grids past the first row, and already-fast image-card sections (the latency win isn't worth the extra bytes).

### NEW: Quality bump for hero/cover images

`buildSrc()` defaults to `quality(80)`. For hero and cover images (the ones the visitor sees first), bump to `quality(85)`:

```ts
export function buildSrc(image, width = 1200, quality = 80) {
  return urlFor(image).width(width).auto('format').quality(quality).url();
}
```

Section components that render hero/cover images call `buildSrc(image, w, 85)`. Rest of the site stays at 80. ~5% larger files for visibly sharper above-fold imagery.

### NEW: Soft upload size warning in Studio

Add a Sanity validation hook on every image field:

```js
validation: (Rule) => Rule.custom((value) => {
  const size = value?.asset?.size;
  if (size && size > 5_000_000) {
    return 'Image is larger than 5 MB. Consider compressing before upload — Sanity serves optimized variants automatically.';
  }
  return true;
}).warning(),
```

Soft warning, doesn't block. Encourages editors to pre-compress without forcing it.

### NEW: Sticky right-click image protection

Preserve the existing `Layout.astro` script:
```js
document.addEventListener('contextmenu', (e) => {
  if (e.target instanceof HTMLImageElement) e.preventDefault();
});
```

Basic anti-save measure for photographer portfolios. Not bulletproof but discourages casual right-click-save. Add a small note in `docs/client-setup-guide.md` that this is a deterrent only, not real DRM.

### Format selection

Sanity's `auto('format')` serves AVIF when supported, WebP otherwise, JPEG/PNG fallback. Already in place. No code changes needed — but worth documenting that's how it works for client trust.

### Aspect ratio reservation (CLS prevention)

`<SanityImage>` already sets intrinsic `width` and `height` attrs. Browsers compute aspect ratio from these and reserve space before the image loads → zero layout shift. Preserve this — never strip the width/height attrs in the rewrite.

### Section image fields summary

| Section | Image field | Aspect ratio | Loading | LQIP |
|---|---|---|---|---|
| heroSection | `images[]` | preserved | eager (first) | yes |
| splitSection | `image` | square / 4:5 / 3:2 / auto (configurable) | eager if first | yes if first |
| fullBleedImageSection | `image` | preserved | eager if first | yes |
| threeColumnSection | `columns[].image` | square | lazy | no |
| galleryGridSection | `images[]` | preserved | lazy | first row only |
| featuredPortfolioSection | `items[].coverImage` | preserved | lazy | first row only |
| blogTeaserSection | `posts[].coverImage` | 4:3 | lazy | no |
| testimonialsSection | `testimonials[].photo` | square (small) | lazy | no |

---

## 7b. SEO Infrastructure (MUST PRESERVE — every line)

The current site has substantial SEO investment. The rewrite touches the page model so several files need updating, but **no SEO feature gets deleted or weakened**. This section documents everything that must survive.

### Schema.org structured data (JSON-LD `@graph` in Layout.astro)

Generated server-side per page in `src/layouts/Layout.astro` lines ~82–153. Auto-emitted when `seoSettings.siteUrl` is set. Components:

1. **`WebSite`** — always present. `@id: ${base}/#website`, name = siteName, url = siteUrl.
2. **`ProfessionalService`** — the photographer business. Includes:
   - `@id: ${base}/#business`, name, url, image (when ogImage set)
   - `telephone` (from `seoSettings.businessPhone`)
   - `email` (from `seoSettings.businessEmail`)
   - `address` (PostalAddress with `addressLocality` from `businessCity`, `addressRegion` from `businessState`)
   - `priceRange` (from `seoSettings.priceRange`)
   - `areaServed` (comma-split from `seoSettings.areaServed`)
   - `sameAs` (filtered array of social URLs from `socialSettings`)
3. **`Person`** — the photographer (E-A-T signal). `@id: ${base}/#photographer`, name = photographerName, url = `${base}/about`, jobTitle: 'Photographer', `worksFor: { @id: ${base}/#business }`, sameAs.
4. **`BreadcrumbList`** — auto-generated from `Astro.url.pathname` + `breadcrumb` prop. One-level (`Home > [breadcrumb]`) or two-level (`Home > Section > [breadcrumb]`) depending on URL depth.
5. **Page-specific append** via `schemaData` prop on `<Layout>`:
   - `BlogPosting` — added by `src/pages/blog/[slug].astro` lines 37–50 with headline, datePublished, dateModified, description, image, author (Person), publisher (Organization with logo).
   - `FAQPage` — added by index.astro and experience.astro (currently) when faqs are present. New `faqSection` component must continue emitting this when `showSchema === true`.

**All this generation logic stays in Layout.astro verbatim.** The new `[...slug].astro` page passes `schemaData` for any page-specific nodes (e.g. category pages might emit nothing extra; pages with FAQ sections emit FAQPage).

### Meta tags (Layout.astro lines ~160–189)

All preserved. Title format: `${pageTitle} | ${siteName}`. Tags emitted:
- `<meta charset="UTF-8">`
- `<meta name="viewport" content="width=device-width">`
- `<title>`, `<meta name="description">`
- `<link rel="canonical">` (when `seoSettings.siteUrl` is set)
- `<link rel="prev">` / `<link rel="next">` (blog pagination)
- `<meta name="robots" content="noindex, nofollow">` when in preview mode
- Open Graph: `og:title`, `og:description`, `og:image`, `og:type` (article/website), `og:url`, `og:site_name`, `og:locale="en_US"`
- Article-specific: `article:published_time`, `article:modified_time`
- Twitter Cards: `twitter:card` (summary_large_image when image present), `twitter:title`, `twitter:description`, `twitter:image`, `twitter:site`, `twitter:creator`
- `<meta name="theme-color">` (synced to active palette bg)
- `<link rel="manifest" href="/manifest.json">`
- `<link rel="icon">` (custom favicon from siteSettings, fallback to /favicon.svg + /favicon.ico)
- Google Fonts preconnect + selective loading

**Plus**: category pages (§11) emit `<meta name="robots" content="noindex, follow">` so thin filter pages don't get indexed.

### Server-rendered SEO routes

Three TypeScript route handlers in `src/pages/`:

#### `sitemap.xml.ts` — REWRITE NEEDED
Current implementation queries hardcoded doc types (`aboutPage`, `experiencePage`, `contactPage`, `blogPage`, `portfolio`). **Rewrite to query the unified `page` doc model:**

```ts
const [seo, homepage, pages, blogPosts] = await Promise.all([
  client.fetch(`*[_type == "seoSettings"][0]{ siteUrl }`),
  client.fetch(`*[_type == "homepagePage"][0]{ _updatedAt }`),
  client.fetch(`*[_type == "page" && defined(slug.current)] | order(slug.current asc){ slug, _updatedAt }`),
  client.fetch(`*[_type == "blogPost" && defined(slug.current)] | order(publishDate desc){ slug, publishDate, _updatedAt }`),
]);
```

Output format stays the same (XML with loc/lastmod/changefreq/priority). Homepage gets priority 1.0, top-level pages 0.8, blog index 0.7, blog posts 0.6, category pages 0.4. **Category pages SHOULD appear in the sitemap** (they're crawlable for SEO discovery) but emit `noindex` in their meta — this is fine, sitemap is for crawl signaling, not indexing demands.

#### `robots.txt.ts` — keep as-is
Allow all, disallow `/api/`, sitemap link. Falls back to request URL when siteUrl not set. Preserve verbatim.

#### `manifest.json.ts` — UPDATE NEEDED
Currently hardcodes the same 5 theme bg colors as Layout.astro:
```ts
const THEME_BG: Record<string, string> = {
  'classic-cream': '#f5f3ef', /* ... */
};
```
**Rewrite to read from the new `siteSettings.palettes` data**: query the active palette and use its `bg` value as `theme_color` and `background_color`. If palettes are migrated to data, this file must be updated alongside or it'll silently fall out of sync.

### Cloudflare security headers (`public/_headers`)

Preserve verbatim:
```
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  X-XSS-Protection: 1; mode=block
  Content-Security-Policy: frame-ancestors 'self' https://*.sanity.studio http://localhost:3333

/api/*
  X-Robots-Tag: noindex
```

CSP `frame-ancestors` allows Sanity Studio to iframe the site (Visual Editing requirement). Don't tighten this without testing Visual Editing still works.

### Code injection (`codeSettings`)

`codeSettings.headScripts` and `codeSettings.bodyScripts` get injected via `<Fragment set:html>` in Layout.astro for analytics (Google, Plausible, Cloudflare Web Analytics), pixel verification, and similar. **Preserve verbatim.** Document in client onboarding that this field accepts raw HTML and should only be used for trusted analytics snippets.

### Per-page SEO

Every page document uses the existing `seo` object type (`seoTitle`, `seoDescription`, `socialImage`). The new unified `page` doc reuses this exact field. The `<Layout>` component already accepts `pageTitle`, `seoDescription`, `ogImage` props and wires them to all the meta tags above. **No changes to that contract.**

### Reference: SEO files inventory

Files that contain SEO-relevant code that the rewrite must touch carefully:

| File | Status | Notes |
|---|---|---|
| `src/layouts/Layout.astro` | Preserve schema.org + meta logic verbatim. Adjust palette/font reading to use new data model. |
| `src/pages/sitemap.xml.ts` | **REWRITE** for unified `page` doc + add category routes |
| `src/pages/robots.txt.ts` | Preserve as-is |
| `src/pages/manifest.json.ts` | **UPDATE** to read from `siteSettings.palettes` |
| `src/pages/blog/[slug].astro` | Preserve BlogPosting JSON-LD generation |
| `public/_headers` | Preserve verbatim |
| `studio/schemaTypes/seoSettings.js` | Preserve all 8 fields |
| `studio/schemaTypes/seo.js` | Preserve as reusable per-page object |
| `studio/schemaTypes/codeSettings.js` | Preserve |

---

## 8. Internal Link Resolution

`ctaLink` object:
```
{
  type: 'internal' | 'external' | 'anchor' | 'none'
  internal: reference to page doc
  external: url
  anchor: string (e.g. #contact)
}
```

Helper `src/lib/links.js`:
```js
export function resolveLink(link) {
  if (!link || link.type === 'none') return null;
  if (link.type === 'external') return link.external;
  if (link.type === 'anchor') return link.anchor.startsWith('#') ? link.anchor : `#${link.anchor}`;
  if (link.type === 'internal') {
    const slug = link.internal?.slug;
    if (!slug) return null;
    return slug === 'home' ? '/' : `/${slug}`;
  }
  return null;
}
```

Used by every CTA rendering.

---

## 9. Navigation Integration

The existing `navSettings` schema (with `navVariant` and free-form `links[]`) is preserved and **extended with dropdown support**. Editors continue to manage nav links manually — new pages do NOT automatically appear in nav.

### Schema additions to `navSettings.links[]`

Each `navLink` object stays as today (`label`, `url`, `enabled`, `openInNewTab`, `isButton`) and gains:

- **`linkType`**: `internal` | `external` (default `external` for back-compat with the current free-form `url` string)
- **`internalRef`**: `reference` to a `page` doc (shown when `linkType === internal`). When set, the rendered href resolves to the referenced page's slug — so renaming a slug updates the link automatically.
- **`children[]`**: optional array of sub-link objects for dropdown menus. Each child has `label`, `linkType`, `url`/`internalRef`, `openInNewTab`. Max 8 children per parent. When `children.length > 0`, the parent renders as a dropdown trigger.

```
navLink {
  label: string
  linkType: 'internal' | 'external'
  url: string                    (when external)
  internalRef: reference(page)   (when internal)
  enabled: boolean
  openInNewTab: boolean
  isButton: boolean
  children[]: navChildLink[]     (optional — enables dropdown)
}

navChildLink {
  label: string
  linkType: 'internal' | 'external'
  url: string
  internalRef: reference(page)
  openInNewTab: boolean
}
```

The current `url: string` field is preserved as a fallback so existing seeded data still works.

### Dropdown rendering

- Desktop: hover or click reveals a dropdown panel below the parent link. Standard pattern: `aria-haspopup="true"`, `aria-expanded` toggle, ESC closes, click-outside closes, focus trap inside the panel when open.
- Mobile (in the hamburger overlay): children render as indented sub-items with a small chevron, no separate panel.
- Animation: fade + slide-down on open (200ms ease), respects `prefers-reduced-motion`.
- The 4 nav variants (classic / centered / split / transparent) all support dropdowns.

### `resolveLink` helper extension

`src/lib/links.js` `resolveLink()` is extended to also handle the navLink shape (returning the right href whether `linkType` is internal or external).

### Nav theme on hero overlap

`page.navThemeOverHero`: `auto` | `light` | `dark` — controls nav color when overlaid on the first section.

- `auto`: compute from first section's palette — if background is dark (luminance < 0.5), use light nav. Helper `src/lib/palette.js` `isDarkPalette(palette): boolean` does the math.
- Explicit `light` / `dark` override.

Nav component receives a `variant` prop and applies appropriate colors. The transparent variant's existing scroll-solidify behavior is preserved.

### Footer is independent (see §1a)

The footer menu is **separate** from the main nav menu. Different settings, different links. Editors can put different/additional links in the footer. The schema and shape of the footer's link list mirrors `navSettings.links[]` (so editors get the same UX) but is stored under `footerSettings.links[]` and edited independently. Footer links **do not support dropdowns** — only the main nav does.

---

## 10. Sanity Studio Configuration

### Page desk structure

Update `studio/sanity.config.js` structure:

```
- ⚙️ Site Settings (unchanged)
- 📄 Pages
  - Homepage (singleton)
  - All Pages (document type list for `page`, allows create/delete)
  - 404 Page (singleton)
- 🖼️ Portfolio (singleton, unchanged)
- 📝 Blog (blog post doc type list, unchanged)
- ⭐ Testimonials (unchanged)
```

### Starter templates

Sanity initial value templates:
- `page` doc type has templates: `blank`, `aboutStarter`, `servicesStarter`, `contactStarter`.
- Each starter pre-populates `sections[]` with a sensible opening lineup.

Defer this to phase 2 if time is tight — blank `page` creation still works.

### Section insert menu grouping

Use `insertMenu` config on the `sections[]` array field in both `page` and `homepagePage` to group section types by category (Hero / Layout / CTA / Dynamic).

---

## 11. Content Categories (Blog & Portfolio)

Free-form, user-defined categories — editors create their own, no pre-defined picklist.

### Schema

Two new document types: `blogCategory` and `portfolioCategory`. Kept separate (even though identical shape) so Studio editors see clean, scoped category lists when editing blog posts vs portfolio items.

Fields on both:
- `name`: string, required
- `slug`: slug, required, auto-generated from name
- `description`: text, optional — shown on the category page header

### Reference fields on content

`blogPost.categories`: array of references to `blogCategory`
- Validation: `min(1).max(3)`
- Field `description` (shown in Studio above the picker):
  > Keep categories minimal. 1–2 per post is best. Don't use categories for keyword stuffing — it dilutes SEO and confuses readers.
- Reference picker has "create new" enabled so editors can add categories inline while writing a post.

`portfolio.categories`: same shape for `portfolioCategory`.

### Category pages

Two new routes:
- `src/pages/blog/category/[slug].astro` — lists all blog posts referencing the category
- `src/pages/portfolio/category/[slug].astro` — lists all portfolio items referencing the category

Both pages:
- Render a heading (category name), optional description, and the filtered content grid.
- **Emit `<meta name="robots" content="noindex, follow">`** — `follow` so link equity flows, `noindex` so Google doesn't index thin category-filter pages.
- Get a fallback 404 if the category slug doesn't exist.

The canonical `/blog/[slug]` and `/portfolio/[slug]` post pages remain indexable normally.

### Category filtering on index pages

`/blog` and `/portfolio` accept an optional `?category=slug` query string for client-side or server-side filtering. This is a nice-to-have and can ship in a follow-up commit if tight on time.

### Display of categories on posts

Each blog post renders its category names as small chips linking to the category page. Portfolio items similarly. Existing `post.category` string field (if present) gets replaced by the new reference array — delete the old field as part of cleanup.

---

## 12. Starter Template & Image Fallbacks

This is how the current site's content shows up pre-populated in every new Sanity dashboard deployment.

### Seed script

Location: `studio/scripts/seed.js`. Run via `cd studio && npm run seed` (add to `studio/package.json` scripts).

What it creates:
1. **siteSettings** — default palettes (the ones currently in use in the template, copied into palette data), default contact destination email placeholder, default SEO fallbacks.
2. **navSettings / footerSettings / socialSettings / seoSettings / codeSettings** — initial values matching current defaults.
3. **homepagePage** — pre-populated with the current homepage section lineup (hero + welcome + featured + process + why-choose + testimonials + faqs), all body copy as portable text.
4. **pages** — one `page` document per current page: About, Experience, Contact, plus 404. Each has its section lineup matching today's layout, with all current body copy translated into the new schema shapes.
5. **blogCategory / portfolioCategory** — a small starter list: e.g. "Sessions", "Behind the Scenes" for blog; "Portraits", "Events" for portfolio. Editors can rename/delete immediately.

### Non-destructive behavior

The seed script must be idempotent and non-destructive:
- Check for existing documents by `_id` before creating.
- Skip any document that already exists (don't overwrite client edits).
- Print a summary: "created X, skipped Y existing."

### When it runs

- **Template development**: manually via `npm run seed` when setting up a fresh dataset for testing.
- **Client onboarding**: part of the "new client" script — after creating their Sanity project and deploying Studio, run `npm run seed` pointing at their dataset (via `SANITY_STUDIO_*` env vars per §project_deployment_model). Client logs into Studio for the first time and sees the full template ready to edit.

### Image fallbacks (no binary seeding)

The seed script **does not upload images**. Image fields in seeded documents stay empty.

Instead, every section component has per-variant fallback image URLs hardcoded in the component (the existing Pexels URLs from today's template). When the CMS image field is empty, the fallback URL renders. When the client uploads an image, the Sanity asset renders instead.

Implementation pattern:

```astro
---
const { section } = Astro.props;
const FALLBACK_IMAGE = 'https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg?auto=compress&cs=tinysrgb&w=900';
const FALLBACK_ALT = 'Photographer portrait';

const imageSrc = section.image
  ? urlFor(section.image).width(900).url()
  : FALLBACK_IMAGE;
const imageAlt = section.image?.alt || FALLBACK_ALT;
---
```

Each section component file declares its own fallbacks as constants at the top — easy to find and update. Current Pexels URLs scattered throughout `about.astro` / `experience.astro` / `index.astro` all get consolidated into the component that uses them.

### Outcome

On first deploy for a new client:
- They install Studio, run seed, open the dashboard.
- All pages exist, all text is pre-written, all sections are configured.
- Every image slot is empty but the live frontend still looks complete via Pexels fallbacks.
- Client uploads their real images one by one, replacing fallbacks as they go. Nothing looks broken at any point in the process.

---

## 13. Contact Form Backend (Web3Forms)

The built-in form mode uses **Web3Forms** (https://web3forms.com), the same provider already wired up in `src/pages/contact.astro`. Free tier: 250 submissions/month per access key. **Zero backend code required** — submissions POST directly from the browser to `https://api.web3forms.com/submit`. No env vars on Cloudflare. No email service to set up.

### Per-client setup

1. Client signs up at web3forms.com (free, no credit card).
2. They receive an access key tied to their email.
3. They paste the key into Sanity at `siteSettings.web3formsKey` (site-wide default).
4. Optionally override per section via `contactFormSection.web3formsKeyOverride`.
5. Submissions go directly to the email address tied to the key.

That's the entire setup. No DNS verification, no Resend account, no Cloudflare env vars, no API route to maintain.

### Schema additions

- **`siteSettings.web3formsKey`** (NEW): string, optional. Site-wide default access key. Set once per client.
- **`contactFormSection.web3formsKeyOverride`** (NEW): string, optional. Per-section override (rare; useful if a client wants different forms going to different inboxes).

The section's effective key is `web3formsKeyOverride || siteSettings.web3formsKey`. If neither is set, the form renders a friendly "Form is not configured yet — please email us directly at [businessEmail]" message instead of submitting.

### Field configuration (per section)

`contactFormSection.formFields[]` already in §2 catalog. Sensible defaults seeded: name (text, required), email (email, required), message (textarea, required).

The form POSTs as standard `multipart/form-data` (Web3Forms expects this). Hidden fields:
- `access_key`: from siteSettings/section
- `subject`: configurable, default "New enquiry from [siteName]"
- `botcheck`: hidden honeypot checkbox (Web3Forms native — bots fill it, humans don't)

### Client-side submission flow

`ContactFormSection.astro` includes inline JS (vanilla, no framework) that:
1. Intercepts form submit, prevents default
2. Validates required fields client-side via native `form.checkValidity()`
3. POSTs `new FormData(form)` to `https://api.web3forms.com/submit`
4. On success: hides form, shows success message
5. On error: re-enables submit, shows error message
6. Disables submit button + shows "Sending…" during in-flight

This flow already exists verbatim in `src/pages/contact.astro` lines ~146–194. The new `ContactFormSection.astro` ports it directly.

### Embed mode (alternative to built-in)

For clients who prefer Jotform / Typeform / Google Forms etc., the section's `mode` field switches to `embed` and reveals iframe URL fields. See §2 `contactFormSection`. Iframe URL only — raw HTML embeds go through `htmlEmbedSection` instead, which is a separate document type with explicit trust warnings.

### Recap of all three form options

| Mode | When to use | How |
|---|---|---|
| `built-in` | Default. Photographer wants a simple form, submissions to email. | Web3Forms key in siteSettings; section configures fields. |
| `embed` (iframe) | Client uses Jotform / Typeform / Google Forms / Calendly. | Section has `embedUrl: url` field, renders sandboxed iframe. |
| `htmlEmbedSection` | Client needs Mailchimp / ConvertKit signup widget with custom HTML/JS. | Editor creates an `htmlEmbedSection` document with raw HTML, references it from a page section or footer middle column. |

### Spam mitigation

- Honeypot `botcheck` field (already supported by Web3Forms)
- Native HTML5 `required` attributes on required fields
- Web3Forms also runs its own server-side spam filter — works out of the box

### Web3Forms key seeding

The seed script does NOT pre-fill `web3formsKey` with a placeholder — that field is left blank. The form renders the "not configured" fallback message until the client pastes their key. Onboarding docs (`docs/client-setup-guide.md`) get a step: "Sign up at web3forms.com and paste your access key into Site Settings → Contact Form Key."

---

## 14. Legacy Cleanup

Delete after the new system is verified working and the dataset is wiped/reseeded.

### Schemas to delete (`studio/schemaTypes/`)
- `aboutPage.js`, `experiencePage.js`, `contactPage.js`
- `aboutCta.js`, `aboutQuote.js`, `aboutWhatToExpect.js` (top-level legacy)
- `pageLayouts.js` (replaced by unified page model)
- `sections/aboutIntroSection.js`, `aboutPersonalSection.js`, `aboutCtaSection.js`, `aboutQuoteSection.js`, `aboutWhatToExpectSection.js`
- `sections/experienceHero.js`, `experienceIntro.js`, `experienceSessions.js`, `experienceArtwork.js`, `experienceNextSteps.js`, `experienceFaqs.js`
- `sections/welcomeSection.js`, `whyChooseSection.js`, `featuredSection.js`, `processSection.js`, `homepageFaqs.js`
- `sections/heroSection.js` (current one — rebuilt as unified schema)
- `sections/testimonialsSection.js` (current one — rebuilt in new shape)

### Page files to delete (`src/pages/`)
- `about.astro`, `experience.astro`, `contact.astro` (replaced by `[...slug].astro`)

### Top-level dead components — DELETE ALL (confirmed unused by Explore agent)
- `src/components/About.astro`
- `src/components/CTA.astro`
- `src/components/FeaturedDogs.astro`
- `src/components/FeaturedWork.astro`
- `src/components/HowItWorks.astro`
- `src/components/Intro.astro`
- `src/components/IntroCentered.astro`
- `src/components/Packages.astro`
- `src/components/PortfolioMasonry.astro`
- `src/components/Process.astro`
- `src/components/Services.astro`
- `src/components/Testimonials.astro`
- `src/components/TestimonialsGrid.astro`

### Active variant components to delete (replaced by new section components)
- `src/components/intro/IntroSplit.astro` → replaced by `sections/SplitSection.astro`
- `src/components/intro/IntroCentered.astro` → same
- `src/components/howitworks/HowItWorksColumns.astro` → replaced by `sections/ThreeColumnSection.astro` (numbered-steps variant)
- `src/components/howitworks/HowItWorksStacked.astro` → replaced by `sections/StepsSection.astro` (timeline variant)
- `src/components/portfolio/PortfolioGrid.astro` → replaced by `sections/FeaturedPortfolioSection.astro` (grid variant)
- `src/components/portfolio/PortfolioMasonry.astro` → replaced by `sections/FeaturedPortfolioSection.astro` (masonry variant)
- `src/components/testimonials/TestimonialsSlider.astro` → replaced by `sections/TestimonialsSection.astro` (slider variant)
- `src/components/testimonials/TestimonialsGrid.astro` → replaced by `sections/TestimonialsSection.astro` (grid variant)
- `src/components/Hero.astro` → replaced by `sections/HeroSection.astro`
- `src/components/WhyChoose.astro` → replaced by `sections/FullBleedImageSection.astro` (with text card)
- `src/components/FAQs.astro` → replaced by `sections/FaqSection.astro` (list variant)

### Components to keep (not replaced)
- `src/components/Nav.astro` — extended with dropdown support, but core structure stays
- `src/components/Footer.astro` — schema-fed only changes
- `src/components/SanityImage.astro` — used by every new section component
- `src/components/VisualEditing.tsx` — preview/edit infrastructure
- `src/layouts/Layout.astro` — core layout, palette/font system stays

### Library cleanup
- `src/lib/portableText.js` — drop the legacy string-paragraph fallback path. Keep `renderBody` (now only handling portable text).

### After deletion
Run an unused-export check (`npx knip` or grep for `import.*from.*components/X`) to catch any leftover references.

---

## 15. Implementation Phases

Ordered for Claude Code execution. Each phase is a commit.

**Before starting: read [`docs/rewrite-rollback.md`](./rewrite-rollback.md)** for the safety net (Sanity dataset backup location, branch model, restore commands). The rewrite happens on the `page-builder-rewrite` branch — do not push to a deploying branch until Phase 13 passes.

### Phase 1 — Foundation (est. 1–2 hours)
1. Palette schema in `siteSettings` (data shape only; actual values come from the current CSS variables in §16).
2. `src/lib/palette.js` helper (`paletteToStyle`, `resolvePalette`).
3. `src/lib/links.js` helper (`resolveLink`).
4. `src/styles/palette.css` — global fallbacks using current default palette values.
5. Shared `studio/schemaTypes/_shared/sectionBase.js` for common section fields (enabled, palette, spacing, sectionId).
6. Shared `studio/schemaTypes/_shared/ctaLink.js` object type.

### Phase 1 — Foundation (est. 2 hours)
1. Palette schema in `siteSettings` — array of palette objects with all 14 token fields per palette. Plus a `defaultPalette` reference field on siteSettings.
2. Add the Universal CSS Tokens (§3c) to `src/styles/palette.css` — easing constants, spacing tokens, fallback `:root` values for Classic Cream.
3. `src/lib/palette.js` helpers: `paletteToStyle`, `resolvePalette`, `isDarkPalette`, `parseLegacyTheme` (for the data-theme fallback).
4. `src/lib/links.js` helper: `resolveLink` (handles internal/external/anchor + nav child links).
5. Shared schema helpers: `studio/schemaTypes/_shared/sectionBase.js` (enabled, palette, spacing, sectionId, verticalSideLabel), `ctaLink.js`, `imageField.js` (the standardized image field with hotspot, alt, sizing-note description, soft 5MB warning, alt-text validation).
6. Move `astro.config.mjs` projectId+dataset to env vars (`PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET`) for client portability. **Note**: `src/lib/sanity.js` already reads these env vars with the same hex fallback — `astro.config.mjs` is the only remaining file with hardcoded `hx5xgigp`/`production` strings on the Astro side. Studio side (`studio/sanity.config.js` + `studio/sanity.cli.js`) was migrated to env vars in commit `cfa5ba9`.

### Phase 2 — Page model + categories + footer (est. 2 hours)
1. New unified `page` document schema with slug, SEO (reuses existing `seo.js` object), sections, navigation, palette ref, navThemeOverHero.
2. Slug validator with reserved-route list (`api`, `blog`, `portfolio`, `preview`, `admin`, `studio`).
3. `blogCategory` and `portfolioCategory` document types per §11.
4. Update `blogPost` schema: replace old `category` string with `categories[]` reference array (validation min 1 max 3), description warning about minimal use.
5. Update `portfolio` doc: add `categories[]` reference array for portfolioCategory.
6. `notFoundPage` schema rewritten to use the new sections shape.
7. `homepagePage` schema updated to use the new sections shape.
8. **`footerSettings.js` rewritten** per §1a: free-form `links[]` array (mirrors navSettings.links shape, no children/dropdowns), `middleColumn.embed` reference to `htmlEmbedSection` (replacing raw `embedCode`), legalLinks preserved.
9. `htmlEmbedSection` document type per §13a (used by both pages and footer).
10. Update Studio desk structure for the new layout. Show all the singletons (siteSettings, navSettings, footerSettings, socialSettings, seoSettings, codeSettings, homepagePage, notFoundPage, blogPage, portfolioPage), plus the `page` document type list, plus the categories.

### Phase 3 — Section schemas (est. 2–2.5 hours)
Write all section schemas in the catalog (§2). No frontend yet. Include `insertMenu.groups` config to categorize types in the section picker. Section types:
- `heroSection` (with `stickyBackground` field per §17)
- `splitSection` (with `verticalSideLabel`, `mobileOrder` fields)
- `fullBleedImageSection` (with `parallax` field)
- `richTextSection`
- `pullQuoteSection`
- `threeColumnSection` (with `verticalSideLabel`)
- `stepsSection` (with `columns` and `timeline` variants)
- `galleryGridSection` (with `lightbox` field)
- `dividerSection`
- `ctaBandSection`
- `contactFormSection` (Web3Forms-backed, with `mode: built-in | embed` + `web3formsKeyOverride`)
- `contactInfoSection`
- `htmlEmbedSection` (its own document type, referenced from sections array)
- `testimonialsSection` (slider/grid/single-featured variants)
- `faqSection` (`accordion` and `list` variants per §17)
- `featuredPortfolioSection`
- `blogTeaserSection`

### Phase 4 — SectionRenderer + dynamic routing (est. 1 hour)
1. `src/components/SectionRenderer.astro` — dispatcher mapping every `_type` to its component (initially stubs that render `<section>{type}</section>`).
2. `src/pages/[...slug].astro` — dynamic route fetching `page` doc by slug, passing sections to SectionRenderer.
3. `src/pages/index.astro` — simplified to fetch `homepagePage` and use SectionRenderer.
4. `src/pages/404.astro` — fetch `notFoundPage` and render via SectionRenderer.
5. Generic GROQ projection per §7 with all known asset references and `lqip` metadata.

### Phase 5 — Section components (est. 5–7 hours, longest phase)
Build each section component, one per file in `src/components/sections/`. Port CSS from existing components where relevant. Every component:
- Wraps in a `<section>` root with inline palette CSS vars via `paletteToStyle()`.
- Supports `spacing` via `data-spacing` attr.
- Uses `isFirst` to pick heading level (h1 vs h2, see §6).
- Honors reserved CSS var names only — no hex literals in CSS.
- Mobile-first, tested at 375px / 768px / 1280px / 1920px.
- Uses `<SanityImage>` for all CMS images. No raw `<img>` tags for Sanity content.
- Declares per-variant fallback image URL constants at the top (current Pexels URLs — see §12).
- Renders body content via the portable text helper (no string-paragraph fallback).
- Applies LQIP (background image from `metadata.lqip`) to hero/cover images per §7a.
- **Follows BEM naming with the required suffix tokens** (`__cta`, `__btn`, `__link`, `__card`, `__item-inner`, `__arrow`) so the global hover system from §17 applies automatically.
- **Sprinkles `reveal` / `reveal-fade` / `reveal-delay-N` classes** on content elements per the rules in §17.
- **Does NOT define local `:hover` CSS on buttons / links / cards / arrows** — those are handled globally in Layout.astro.
- Uses `var(--ease-image)` for image hover transitions (universal pattern).
- Implements `verticalSideLabel` field where applicable (split, threeColumn, faq list, featuredPortfolio).

### Phase 6 — Nav extension + Footer migration (est. 1.5 hours)
1. Extend `navSettings.links[]` schema with `linkType`, `internalRef`, `children[]` for dropdown support per §9.
2. Update `Nav.astro` to render dropdowns: hover/click panel, ARIA attributes, ESC + click-outside close, focus trap, mobile indented sub-items.
3. Preserve all existing nav behaviors per §17: scroll-solidify, dynamic compact mode, ResizeObserver, --nav-height var, hamburger overlay focus management, link underline animation, `__inquire` button hover.
4. **Update `Footer.astro`** to read from new `footerSettings.links[]` (free-form list) and render `htmlEmbedSection` reference for middleColumn instead of raw HTML.
5. Verify the four nav variants (classic/centered/split/transparent) all support dropdowns.

### Phase 7 — Category routes (est. 1 hour)
1. `src/pages/blog/category/[slug].astro` — filtered blog list, `<meta name="robots" content="noindex, follow">`.
2. `src/pages/portfolio/category/[slug].astro` — filtered portfolio list, same noindex.
3. Update `/blog/[slug].astro` and individual portfolio item rendering to display category chips linking to the category pages.

### Phase 8 — Contact form (Web3Forms wiring) (est. 0.5 hour)
1. `siteSettings` schema gets new `web3formsKey: string` field (with description linking to web3forms.com signup).
2. `contactFormSection.web3formsKeyOverride: string` per-section override.
3. `ContactFormSection.astro`:
   - `built-in` mode: ports the existing form submission JS from `src/pages/contact.astro` lines ~146–194 verbatim. Honeypot, status messages, submit button states.
   - `embed` mode: renders sandboxed iframe from `embedUrl` field.
4. No backend code, no API route, no env vars on Cloudflare. The form POSTs directly to `https://api.web3forms.com/submit`.
5. If `web3formsKey` is empty, render fallback "not configured" message instead of broken form.

### Phase 9 — SEO infrastructure migration (est. 1–1.5 hours)
**Critical phase — every SEO feature MUST survive.**
1. **Rewrite `src/pages/sitemap.xml.ts`** for the unified `page` doc model. Query all `page` docs dynamically, plus homepage, blog index, portfolio index, blog posts, AND category pages. Preserve XML output format.
2. **Update `src/pages/manifest.json.ts`** to read theme color from `siteSettings.palettes` data instead of the hardcoded `THEME_BG` map.
3. **Verify Layout.astro** schema.org JSON-LD generation still works against the new page model — `breadcrumb` prop, `seoSettings` queries, `socialSettings` queries, `siteSettings` queries all need to map to the new schemas.
4. **Verify all meta tags** (canonical, og:, twitter:, article:, theme-color, manifest, prev/next, robots noindex on preview) still render on the new `[...slug].astro` route.
5. **Preserve `seo.js`** object type — used as the per-page SEO field on the new `page` doc.
6. **Preserve `seoSettings.js`** schema verbatim — drives ProfessionalService schema.
7. **Preserve `codeSettings.js`** — headScripts/bodyScripts injection.
8. **Preserve `public/_headers`** verbatim — Cloudflare security headers + CSP.
9. **Preserve `src/pages/blog/[slug].astro`** BlogPosting JSON-LD generation.
10. **Preserve `robots.txt.ts`** — no changes needed.
11. Smoke test: load every page type, view-source, confirm `<script type="application/ld+json">` is present and valid (use a JSON-LD validator).
12. Confirm sitemap.xml lists all expected URLs.

### Phase 10 — Image optimization upgrades (est. 1 hour)
1. Add `lqip` to all GROQ image projections.
2. Implement LQIP background pattern in: `HeroSection`, `SplitSection` (when first), `FullBleedImageSection`, `FeaturedPortfolioSection` (first row), `BlogTeaserSection` (when card-style), blog post cover.
3. Add `quality(85)` for above-fold hero/cover images (extend `buildSrc()` to accept quality param).
4. Add the `imageField.js` helper to all image fields across all schemas — soft 5MB warning, alt-text warning validation, sizing-note description.
5. Preserve right-click image protection in Layout.astro.
6. Document image optimization in `docs/client-setup-guide.md`.

### Phase 11 — Seed script (est. 2 hours)
Write `studio/scripts/seed.js` that creates (non-destructively, via `_id` checks):
- **siteSettings** with all 5 default palettes seeded from current CSS values, default `colorTheme: 'classic-cream'`, default `fontTheme: 'classic-editorial'`, blank `web3formsKey`, blank `accentColorOverride`/`textColorPreset`.
- **navSettings** with default link list matching current `Nav.astro` defaults (Experience, Portfolio, About, Blog, Inquire), `navVariant: 'classic'`. Each link configured with `linkType: 'internal'` and an `internalRef` pointing at the matching seeded `page` document so renames cascade automatically.
- **footerSettings** with default link list (Home, About, Experience, Portfolio, Blog, Contact), no middleColumn embed, no legal links by default.
- **socialSettings** with empty placeholder URLs (Instagram, Facebook, YouTube, TikTok, custom).
- **seoSettings** with placeholder fields (no siteUrl until client adds theirs — sitemap and schema.org fall back gracefully).
- **codeSettings** empty.
- **homepagePage** with:
  - `hero` (top-level heroSection field, NOT in sections array) — slider variant with 5 Pexels fallback hero images, default heading + subtext from current `Hero.astro`
  - `sections[]` lineup translated from current order: `[splitSection (welcome), testimonialsSection (slider variant), featuredPortfolioSection (masonry variant), stepsSection (columns variant), fullBleedImageSection (whyChoose), faqSection (list variant)]`
- **`page` documents** for About, Experience, Contact — each with section lineups + copy matching today's site exactly (see field mapping table below).
- **`notFoundPage`** translated from current 5 flat fields (`image, heading, subheading, ctaText, ctaLink`) into a single `fullBleedImageSection` in its `sections[]` array.
- **Starter `blogCategory`** entries: "Sessions", "Behind the Scenes" (matches current blogPost category list defaults).
- **Starter `portfolioCategory`** entries: "Portrait", "Lifestyle", "Detail", "Family" (matches current portfolio category list defaults).
Add `npm run seed` script to `studio/package.json`. Image fields stay empty — component fallbacks handle visuals via Pexels URLs hardcoded in each section component.

#### Field migration mapping (current → new)

The seed script must translate every legacy section's fields into the new schema shapes. Reference table:

**`welcomeSection` → `splitSection`**
```
welcomeSection.enabled       → splitSection.enabled
welcomeSection.eyebrow       → splitSection.eyebrow
welcomeSection.bodyRich      → splitSection.body              (already portable text)
welcomeSection.body          → splitSection.body              (legacy text — convert to portable text)
welcomeSection.bodySecondary → append as additional paragraph in splitSection.body
welcomeSection.ctaText       → splitSection.ctaText
welcomeSection.ctaLink       → splitSection.ctaLink           (string → resolveLink object: type=internal/external)
welcomeSection.image         → splitSection.image             (preserve hotspot/crop/alt)
                             → splitSection.imageLayout = 'image-right'  (matches current Welcome layout)
                             → splitSection.imageAspectRatio = 'auto'
```

**`whyChooseSection` → `fullBleedImageSection`**
```
whyChooseSection.enabled         → fullBleedImageSection.enabled
whyChooseSection.backgroundImage → fullBleedImageSection.image
whyChooseSection.heading         → fullBleedImageSection.heading        (preserves \n line breaks)
whyChooseSection.body            → fullBleedImageSection.body
whyChooseSection.bodyFirst/Second→ merged into fullBleedImageSection.body
whyChooseSection.ctaText         → fullBleedImageSection.ctaText
whyChooseSection.ctaLink         → fullBleedImageSection.ctaLink
whyChooseSection.caption         → fullBleedImageSection.caption
                                 → fullBleedImageSection.textContainer = 'overlay-card'
                                 → fullBleedImageSection.height = 'tall'
```

**`processSection` → `stepsSection`**
```
processSection.enabled  → stepsSection.enabled
processSection.heading  → stepsSection.heading
processSection.tagline  → stepsSection.eyebrow
processSection.step1Title/Body → stepsSection.steps[0] = { stepNumber: '01', title, body }
processSection.step2Title/Body → stepsSection.steps[1] = { stepNumber: '02', title, body }
processSection.step3Title/Body → stepsSection.steps[2] = { stepNumber: '03', title, body }
processSection.ctaText  → stepsSection.ctaText
processSection.ctaLink  → stepsSection.ctaLink
                        → stepsSection.variant = 'columns'    (or 'timeline' to match HowItWorksStacked)
```

**`featuredSection` → `featuredPortfolioSection`** (variant: masonry, 6 items, layout: masonry)

**`testimonialsSection` (current)** → **`testimonialsSection` (new)** (variant: slider; 1:1 except adding palette/spacing/sectionId common fields)

**`homepageFaqs` → `faqSection`** (layout: list — matches current FAQs.astro non-clickable variant; preserves vertical side label "FAQs")

**`aboutIntroSection` → `splitSection`** (imageLayout: image-left; eyebrow ← subtext; heading ← heading; body ← bodyParagraph1+bodyParagraph2 merged)

**`aboutPersonalSection` → `splitSection`** (imageLayout: image-right; body ← bodyParagraph1+bodyParagraph2 merged)

**`aboutWhatToExpectSection` → `threeColumnSection`** (variant: image-cards; columns[].title/body/image preserved; verticalSideLabel: 'What to Expect')

**`aboutQuoteSection` → `pullQuoteSection`** (quote ← quoteText; variant: 'centered')

**`aboutCtaSection` → `ctaBandSection`** (or split-section style depending on layout; preserves heading/body/buttonText/buttonLink/caption/imageBackground/imageForeground)

**`experienceHero` → `heroSection`** (heightMode: 'tall'; stickyBackground: true to preserve current sticky-hero behavior)

**`experienceIntro` → `richTextSection`** (body ← bodyFirst+bodySecond merged; maxWidth: narrow)

**`experienceSessions` → `splitSection`** (image+heading+sub+includesList+price+caption rendered in body; imageLayout: image-left)

**`experienceArtwork` → `splitSection`** (imageLayout: image-right; body includes optionsList rendered as portable text list; statement appended)

**`experienceNextSteps` → `fullBleedImageSection`** (background image, label as eyebrow, heading, body, ctaText, ctaLink; textContainer: 'overlay-card')

**`experienceFaqs` → `faqSection`** (layout: accordion; faqs[] preserved as inline objects)

**`notFoundPage` flat fields → `fullBleedImageSection`**
```
notFoundPage.image      → fullBleedImageSection.image
notFoundPage.heading    → fullBleedImageSection.heading
notFoundPage.subheading → fullBleedImageSection.body          (single paragraph portable text)
notFoundPage.ctaText    → fullBleedImageSection.ctaText
notFoundPage.ctaLink    → fullBleedImageSection.ctaLink
                        → fullBleedImageSection.height = 'viewport'
                        → fullBleedImageSection.textContainer = 'inline-overlay'
```

The seed script doesn't actually need to migrate live data (this is a fresh-deploy template) — but it DOES need to know the current copy text for each field so it can populate the new schemas with the same starter content. Pull the current `initialValue` strings from the legacy schema files plus the fallback strings from current `.astro` page files (e.g. `about.astro` lines ~85–94 for the personal section fallbacks).

### Phase 12 — Legacy cleanup (est. 0.75 hour)
Delete all files listed in §14. Run build. Run `npx knip` or grep for unused imports. Confirm no broken references. Hardcoded `data-theme` block in Layout.astro is removed (replaced by inline palette CSS custom props from §3).

### Phase 13 — Integration test (est. 1.5–2 hours)
1. Wipe dataset, run `npm run seed`, verify site renders identically to pre-rewrite state at desktop, tablet, mobile.
2. Test creating a new page via Studio: pick template (or blank), add each section type, verifying rendering.
3. Test category filtering and `noindex, follow` headers on category pages (curl + grep).
4. Submit a built-in contact form with a real Web3Forms key, verify email arrives.
5. Swap to embed mode with a test form URL, verify iframe renders.
6. Test the htmlEmbedSection by referencing it from a page section AND the footer middle column.
7. Toggle palette on a section, verify color swap works (preview mode).
8. Test nav dropdowns: desktop hover, click, ESC, click-outside, mobile hamburger overlay sub-items.
9. Mobile check at 375px across every page.
10. **Animation regression sweep (per §17):**
    - Scroll every page top-to-bottom: every section's content elements fade up with the cascade delays.
    - Hover every button (bottom-crop inset, no lift), link (opacity + letter-spacing widen), card (lift 3px + shadow), arrow (scale 1.08).
    - Toggle `prefers-reduced-motion: reduce` in DevTools — all animations go static, no errors.
    - Side-by-side compare with a recording of the current site. Motion must feel identical.
11. Verify the transparent nav scroll-solidify still works.
12. Verify the dynamic compact-mode nav still triggers based on content width.
13. **SEO verification:**
    - Load every page type, view-source, confirm JSON-LD is present and valid (use https://validator.schema.org).
    - Curl `/sitemap.xml` and verify all expected URLs.
    - Curl `/robots.txt` and verify sitemap link.
    - Curl `/manifest.json` and verify theme color matches active palette.
    - Open browser dev tools → Lighthouse → SEO audit → expect 100.
    - Verify category pages emit `noindex, follow` in their `<meta>`.
14. **Image optimization verification:**
    - Network tab → confirm hero images load with LQIP background showing first
    - Confirm AVIF/WebP served (check Content-Type)
    - Confirm `srcset` attribute present on every Sanity image
    - Confirm `width`/`height` attrs prevent CLS (Core Web Vitals)
    - Right-click an image → confirm contextmenu prevented

**Total realistic estimate: 18–22 hours of focused build time.** This is the comprehensive build with all SEO + image optimization + animation preservation + nav dropdowns + footer migration + Web3Forms wiring + seeded starter content. ~1 long focused day for execution if Claude Code, plus another for review and polish.

---

## 16. Locked Decisions

All previously open questions have been decided. Recorded here for reference.

1. **Contact form backend**: **Web3Forms** (https://web3forms.com), free, no backend code, no env vars on Cloudflare. The current `src/pages/contact.astro` already wires this — submission flow is ported into the new `ContactFormSection.astro`. Per-client setup: paste their access key into `siteSettings.web3formsKey`. Per-section override available via `web3formsKeyOverride`. See §13.
2. **Default palettes**: Use the **5 existing palettes already hardcoded in `src/layouts/Layout.astro`** (Classic Cream, Warm Studio, Dark Editorial, Cool Minimal, Forest Sage). Migrated as data into `siteSettings.palettes[]` by the seed script — same names, same hex values, same CSS variable contract. Clients can edit, add, or remove palettes via Studio after install — no code changes needed. See §3.
3. **Starter template**: The seed script populates every current page (Homepage, About, Experience, Contact, 404) with today's layout and copy as editable `page` documents. Images are left empty; section components fall back to the current Pexels URLs hardcoded per component. See §12.
4. **Nav opt-in**: Editors manually add nav links (no auto-populate from page docs). The existing free-form `navSettings.links[]` model is preserved and **extended with dropdown support** (each link can have a `children[]` array of sub-links). See §9.
5. **Blog/portfolio index pages**: Stay as dedicated singletons (`blogPage`, `portfolioPage`). They aren't free-form `page` documents. Reusing their content on other pages is handled by `blogTeaserSection` and `featuredPortfolioSection`. Blog/portfolio item docs (`blogPost`, `portfolio` items) remain collections.
6. **Categories**: Free-form, editor-created, max 3 per item, reference-based for deduplication. Category pages emit `noindex, follow`. Editors see a "keep minimal" warning above the picker. See §11.
7. **Embed forms**:
   - **iframe URL** (Jotform/Typeform/Google Forms/Calendly) → handled by `contactFormSection.mode = 'embed'` with sandboxed iframe. No raw HTML.
   - **Raw HTML widgets** (Mailchimp/ConvertKit/Klaviyo signups, custom embeds) → handled by the new `htmlEmbedSection` document type, which is the ONLY place in the schema that accepts raw HTML, with explicit trust warning copy. Used as a section AND referenced from footer middle column. See §13a.
8. **Footer is independent from main nav**: separate free-form link list (`footerSettings.links[]`), editors put different/additional links in the footer vs nav. Footer does NOT support dropdowns — only the main nav does. See §1a.
9. **Main nav dropdowns**: each `navLink` can have a `children[]` array of sub-links, max 8 per parent. Dropdown panel on hover/click with full a11y (ARIA, ESC, click-outside, focus trap). Mobile hamburger overlay shows children as indented sub-items. See §9.
10. **Section theme override mechanism**: inline CSS custom properties on each section's root element (preferred), with the existing `data-theme="..."` attribute mechanism kept as a temporary fallback during migration. The hardcoded `[data-theme="..."]` block in Layout.astro stays in place until Phase 12 when all sections have been ported, then it's removed and inline custom props are the only mechanism. See §3.
11. **Web3Forms key storage**: site-wide default in `siteSettings.web3formsKey` with optional per-section override `contactFormSection.web3formsKeyOverride`. Keeps clients DRY (one key for all forms) while allowing per-form routing for advanced cases.
12. **Footer middleColumn raw HTML**: replaced with a `reference` to `htmlEmbedSection`. The current `footerSettings.middleColumn.embedCode` text field is deleted. Editors create reusable `htmlEmbedSection` documents (e.g. "Mailchimp Newsletter") and reference them from the footer or page sections. Concentrates raw-HTML risk to a single document type with explicit warnings.
13. **CTA button hover behavior — HYBRID (option 3)**:
    - Bordered solid buttons (`__cta`, `__btn`, `__submit`, `__button`) → **bottom-crop inset** via `box-shadow: inset 0 -2px 0 var(--accent)`. Button does NOT translate or grow.
    - Borderless text/arrow links (`__link`) → keep current `opacity + letter-spacing widening`.
    - Cards (`__card`, `__item-inner`) → keep current 3px lift + shadow.
    - Arrows (`__arrow`) → keep current 1.08 scale.
    - The current global `transform: translateY(-2px)` rule on all `__cta`/`__btn` selectors is REPLACED. The lift-up was a regression. See §17.
14. **Memory file `feedback_button_animation.md` is updated** to reflect the hybrid model — bordered = bottom-crop inset, borderless = letter-spacing — and notes that the previous global lift-up was a regression being corrected in this rewrite.

---

## 17. Animation & Interaction System (MUST PRESERVE)

The current site's "feel" comes largely from a set of global animation systems defined in `src/layouts/Layout.astro`. The rewrite **must keep these exact systems intact** and every new section component must hook into them. This section is a hard requirement, not polish — losing these animations is a regression.

### What exists today and must be preserved verbatim

All of the following live in `src/layouts/Layout.astro` inside the global `<style>` block and `<script>` tag. Do **not** remove, rename, or relocate them during the rewrite. Copy them forward as-is.

**1. Scroll-reveal IntersectionObserver**
```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal, .reveal-fade').forEach(el => observer.observe(el));
```

**2. Reveal keyframes + classes**
```css
@keyframes fadeUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.reveal { opacity: 0; transform: translateY(22px); will-change: transform, opacity; }
.reveal.revealed { animation: fadeUp 0.65s cubic-bezier(0.22, 1, 0.36, 1) both; }

.reveal-fade { opacity: 0; will-change: opacity; }
.reveal-fade.revealed { animation: fadeIn 0.8s ease both; }

.reveal-delay-1 { animation-delay: 0.08s; }
.reveal-delay-2 { animation-delay: 0.16s; }
.reveal-delay-3 { animation-delay: 0.24s; }
.reveal-delay-4 { animation-delay: 0.32s; }
.reveal-delay-5 { animation-delay: 0.40s; }

@media (prefers-reduced-motion: reduce) {
  .reveal, .reveal-fade { opacity: 1 !important; transform: none !important; }
  .reveal.revealed, .reveal-fade.revealed { animation: none !important; }
}
```

**3. Global hover micro-interactions (BEM suffix selectors) — REVISED for hybrid model**

The global stylesheet targets interactive elements by class-name suffix. Any element whose class contains the right BEM suffix automatically gets the right hover effect — no per-component hover CSS needed.

**The current `Layout.astro` rule that lifts every button via `transform: translateY(-2px)` is REPLACED with the hybrid model below.** Bordered solid buttons get a bottom-crop inset, borderless text/arrow links keep the existing letter-spacing widening.

```css
/* ── BORDERED / SOLID BUTTONS — bottom-crop inset hover ─────────
   Matches any element using __cta, __btn, __submit, __button.
   Button does NOT translate, grow, or change size — only the
   bottom edge crops up via an inset shadow drawn from inside. */
[class*="__cta"],
[class*="__btn"],
[class*="__submit"],
[class*="__button"] {
  transition: background 0.25s, color 0.25s, box-shadow 0.25s;
  box-shadow: inset 0 0 0 0 var(--accent);
}
[class*="__cta"]:hover,
[class*="__btn"]:hover,
[class*="__submit"]:hover,
[class*="__button"]:hover {
  box-shadow: inset 0 -2px 0 0 var(--accent);
  /* No transform. No size change. Only the bottom edge crops. */
}

/* ── ITALIC / ARROW TEXT LINKS — opacity + letter-spacing ───────
   Matches any element using __link. Borderless inline links. */
[class*="__link"] {
  transition: opacity 0.2s, letter-spacing 0.25s;
}
[class*="__link"]:hover {
  opacity: 1;
  letter-spacing: 0.04em;
}

/* ── CARD / ITEM HOVER — lift + shadow ──────────────────────────
   Matches blog post cards, portfolio items, gallery tiles. */
[class*="__item-inner"],
[class*="__card"] {
  transition: transform 0.2s, box-shadow 0.25s;
}
[class*="__item-inner"]:hover,
[class*="__card"]:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* ── SLIDER / CAROUSEL ARROWS — scale ───────────────────────────
   Matches testimonial arrows, hero prev/next arrows. */
[class*="__arrow"] {
  transition: border-color 0.2s, color 0.2s, transform 0.18s;
}
[class*="__arrow"]:hover:not(:disabled) {
  transform: scale(1.08);
}

/* ── REDUCED MOTION ─────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  [class*="__cta"], [class*="__btn"], [class*="__submit"], [class*="__button"],
  [class*="__link"], [class*="__item-inner"], [class*="__card"], [class*="__arrow"] {
    transition: none !important;
    transform: none !important;
    box-shadow: none !important;
  }
}
```

**Why bottom-crop inset for bordered buttons:** Per user direction, bordered CTA buttons should feel solid and stable — no lift, no grow. The bottom edge crops up 2px on hover via an inset shadow drawn from inside the button. This is a visual "press down" affordance that doesn't move the button at all. The current global rule (lift up + outer shadow) was a regression and is being corrected as part of this rewrite.

**Bordered vs borderless distinction:** The selectors above split correctly:
- `__cta`, `__btn`, `__submit`, `__button` → bordered or solid buttons → bottom-crop inset
- `__link` → inline italic / arrow text links → letter-spacing + opacity
- `__card`, `__item-inner` → clickable cards → translate up + shadow
- `__arrow` → slider arrows → scale

**4. Transparent nav hero pull-up**
```css
body[data-nav-variant='transparent'] main > .hero:first-child {
  margin-top: calc(-1 * var(--nav-height, 80px));
}
```
This makes the hero section extend edge-to-edge under the sticky nav. The `--nav-height` var is set by `Nav.astro` JS on load/resize. The new `HeroSection.astro` must keep a `.hero` class on its root element and live as `main > .hero:first-child` for this to work.

### Naming rules for new section components

Every new section component in `src/components/sections/*.astro` **must follow BEM naming conventions that include the suffix tokens** the global stylesheet targets. This is how new components inherit the hover system for free:

| Interactive element | Required class suffix | Example |
|---|---|---|
| Primary filled/bordered button | `__cta` or `__btn` | `<a class="split__cta">`, `<button class="contact__submit">` |
| Inline italic/arrow text link | `__link` | `<a class="welcome__link">` |
| Clickable card or grid tile | `__card` or `__item-inner` | `<article class="blog-teaser__card">` |
| Slider navigation arrow | `__arrow` | `<button class="testimonials__arrow">` |

**Do not** define per-component hover CSS on these elements. The global stylesheet handles all of it. Defining local `:hover` styles on them will override the global and cause inconsistency.

### Reveal class placement

Every new section component must sprinkle `reveal` / `reveal-delay-N` classes on meaningful content elements so the IntersectionObserver animates them on scroll. Pattern (from the current `about.astro` intro section):

```astro
<section class="split">
  <div class="split__image reveal-fade">
    <img ... />
  </div>
  <div class="split__content">
    <h2 class="split__heading">{heading}</h2>
    <p class="split__eyebrow reveal reveal-delay-1">{eyebrow}</p>
    <div class="split__body reveal reveal-delay-2" set:html={bodyHTML} />
    <a class="split__cta reveal reveal-delay-3" href={ctaHref}>{ctaText}</a>
  </div>
</section>
```

Rules:
- Headings typically don't take a reveal (they read first; delay feels off).
- Subsequent elements use `reveal reveal-delay-1`, `reveal-delay-2`, `reveal-delay-3` in order. Cap at 5.
- Images use `reveal-fade` (opacity only), not `reveal` (which also translates — can fight with image aspect ratios).
- Grid/column items use staggered delays: first column `reveal-delay-1`, second `reveal-delay-2`, third `reveal-delay-3`.
- Never apply reveal classes to structural wrappers — only to content elements.

### Section-level animations to preserve

The following are signature visual behaviors found in specific components. Each must be re-implemented in its new section component, byte-for-byte where the existing version is solid.

#### Universal image-zoom on card hover
Found on: `.expect__img-wrap`, `.featured__img-wrap`, `.portfolio__item`, `.pmasonry__item`, `.pgrid__img`, `.work__item`, `.posts__item-inner`, `.card__img-link`, `.sessions__img-wrap` — every image card on the site.

Pattern (now uses the shared `--ease-image` token):
```css
.foo__img-wrap :global(.foo__img) {
  transition: transform 0.6s var(--ease-image);
}
.foo__img-wrap:hover :global(.foo__img) {
  transform: scale(1.04); /* or 1.03–1.05 per visual taste */
}
```

Apply to: `splitSection`, `threeColumnSection`, `featuredPortfolioSection`, `blogTeaserSection`, `galleryGridSection`, `testimonialsSection`. Skip on full-bleed images and the standalone hero (which has its own behavior).

Reduced-motion override per component.

#### Hero slider — full carousel implementation
The current `Hero.astro` is an infinite-loop multi-image carousel with cloned wraparound. Full requirements for the new `HeroSection.astro` slider variant:

- **Cloned image strategy**: clone the last `NUM_CLONE` (=2) real images and prepend them; clone the first 2 and append them. Total array: `[...clones, ...real, ...clones]`. Start at index `NUM_CLONE` (first real image).
- **Variable image widths**: each image preserves its natural aspect ratio at fixed height (`height: 100%; width: auto; flex-shrink: 0; max-width: unset; object-fit: unset;`). Images are NOT compressed to a uniform aspect ratio.
- **Custom translateX positioning**: the slider does NOT use CSS scroll-snap. JS computes the cumulative left edge of each image (sum of widths + gaps) and applies `translateX(-centerOffset)` to center the active image in the viewport.
- **15px gap between images** via flex `gap: 15px`.
- **Transition**: `transform 0.5s ease`.
- **transitionend handler**: when the active index reaches the clone zone (`current >= NUM_CLONE + NUM_REAL` or `current < NUM_CLONE`), silently jump (transition: none → reflow → restore) to the equivalent real index. Creates seamless infinite loop.
- **ResizeObserver / debounced resize**: image widths change with viewport (60vh height means images get wider on landscape). On resize, recompute centerOffset and re-apply translateX. Debounce 100ms.
- **Initial positioning**: run `goTo(NUM_CLONE)` immediately AND on `window.load` (immediate handles cached images, load handles uncached so offsetWidth is accurate).
- **Arrow buttons**: `.hero__arrow--prev` and `.hero__arrow--next` with `&#8249;` and `&#8250;`. ARIA labels. Hover: `background: rgba(0,0,0,0.55); transform: translateY(-1px);` (NOT the global scale-1.08 — hero arrows are different).
- **Viewport**: `height: 60vh; min-height: 400px; overflow: hidden`.
- **Caption below**: optional `<h1>` heading + uppercase `<p>` subtitle, centered, with top border.

The current `src/components/Hero.astro` script (lines 144–224) is the reference implementation. Port directly into the new component, only renaming class prefixes.

#### Lightbox sub-system (galleryGridSection + featuredPortfolioSection)
Current implementation in `src/pages/portfolio.astro` lines 90–158. Must be ported into the new `GalleryGridSection.astro` and `FeaturedPortfolioSection.astro` (when `lightbox: true`).

Behaviors:
- Click any image to open fullscreen overlay with `rgba(0, 0, 0, 0.92)` background
- Image fades in on load (set `opacity: 0`, then `'1'` on `onload`); handles cached images via `complete && naturalWidth` check
- Adjacent image preloading: when showing image `current`, preload `current ± 1` via `new Image()` with src set
- Close button (`.lb__close`) in top-right with `&times;`, scale(1.15) on hover
- Prev/next arrow buttons hidden when only 1 image
- Body scroll lock during open (`document.body.style.overflow = 'hidden'`)
- Click outside the image to close (`e.target === lb`)
- Keyboard: Escape closes, ArrowLeft prev, ArrowRight next
- Cursor on portfolio images: `cursor: zoom-in`
- After close, clear `lbImg.src` after 300ms timeout to avoid flash on re-open

#### FAQ — two layouts

**`accordion` layout** (currently in `experience.astro`):
- Each item is a `<button class="faqs__question">` with `aria-expanded` toggle
- Single-open behavior: opening one item closes all others (loop through all questions, set aria-expanded false, then open the clicked one if it was previously closed)
- `.faqs__item--open` class controls visibility via CSS `display: none → block` on `.faqs__answer`
- Plus icon (`.faqs__icon`) is `+` text; rotates 45deg on `.faqs__item--open` to become `×`
- Question button hover: color change to accent
- Each item gets `reveal reveal-delay-N` capped at 5: `Math.min(i + 1, 5)`

**`list` layout** (currently in homepage `FAQs.astro`):
- All questions and answers visible at once, no clicking
- Each `.faqs__answer` has a `border-left: 2px solid var(--accent); padding-left: 1.75rem`
- Each item separated by `border-bottom: 1px solid var(--border)`, padding 2.5rem 0
- Optional vertical writing-mode side label "FAQs" on the left (see decorative pattern below)

The new `FaqSection.astro` reads `layout` from the schema and renders accordingly. Both layouts share the same fields (`heading`, `eyebrow`, `faqs[]`).

#### Sticky hero (experience page pattern)
Currently in `experience.astro` lines 254–256:
```css
.hero {
  position: sticky;
  top: 0;
  z-index: 0;
  height: 75vh;
}
.intro, .sessions, .artwork, .next, .faqs {
  position: relative;
  z-index: 1;
  background: var(--bg);
}
```

This creates a parallax-like effect: the hero stays pinned at the top of the viewport while subsequent sections scroll up over it (like a curtain rising).

Move into `HeroSection.astro` as a `stickyBackground: boolean` field on the hero schema. When true, the hero gets `position: sticky; top: 0; z-index: 0; height: 75vh;`. The SectionRenderer detects this and adds `position: relative; z-index: 1; background: var(--bg);` to all subsequent sections on the same page (CSS rule scoped via a body class or data attribute).

#### Background-attachment fixed (parallax)
Currently in `WhyChoose.astro` `.why__image-full`:
```css
background-attachment: fixed;
background-size: cover;
background-position: center;
```

Subtle parallax: image stays put while page scrolls past. **Note: broken on iOS Safari** (known limitation — Safari falls back to non-parallax). Acceptable tradeoff.

Move into `FullBleedImageSection.astro` as a `parallax: boolean` field. When true, apply `background-attachment: fixed`. When false, normal scroll.

#### Vertical writing-mode side labels (decorative pattern)
Found on: `.featured__label` ("Featured Dogs"), `.faqs__label` ("FAQs" — both homepage and experience), `.expect__label` ("What to Expect"). A signature visual element of the site.

Pattern:
```css
.foo__label {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: clamp(1.5rem, 2.5vw–3.5vw, 2.25–3.25rem);
  letter-spacing: 0.1–0.12em;
  color: var(--border);
  writing-mode: vertical-rl;  /* or vertical-lr */
  transform: rotate(180deg);
  white-space: nowrap;
  user-select: none;
}

@media (max-width: 768px) {
  .foo__label {
    writing-mode: horizontal-tb;
    transform: none;
    /* shrink + center */
  }
}
```

Several section types support an optional `verticalSideLabel: string` field that renders this decorative label in a 100px-wide left column. Sections with the field: `splitSection`, `threeColumnSection`, `faqSection` (list variant), `featuredPortfolioSection`. Mobile: collapses to horizontal label above the content.

#### Stacked timeline (StepsSection timeline variant)
Currently in `HowItWorksStacked.astro`. Visual: vertical list with circular number badges and connecting line between them.

Pattern:
- Grid: `grid-template-columns: 56px 1fr; gap: 0 2.5rem;`
- Number circle: `width: 56px; height: 56px; border: 1px solid var(--border); border-radius: 50%; background: var(--bg);` with the step number centered
- Connector: `width: 1px; flex: 1; min-height: 3rem; background: var(--border);` between number wraps
- Right column: step label (uppercase) + body text
- Last step has no connector, no padding-bottom
- Mobile: shrink circle to 44px

The new `StepsSection.astro` `timeline` variant must reproduce this exactly. The `columns` variant (numbered cards in a 3-column grid) is the alternative visual.

#### Testimonials slider crossfade
Currently in `TestimonialsSlider.astro`. Quote and image fade out (opacity 0), wait 280ms, swap content, fade in (opacity 1). NOT a slide animation. Maintains a single visible item at a time.

Port into `TestimonialsSection.astro` slider variant. Preserve the 280ms timing.

#### Smooth anchor scroll
`html { scroll-behavior: smooth; }` in Layout.astro. Preserve. Anchor links (#contact, #faqs) smooth-scroll.

#### Italic-by-default headings
`h1, h2, h3, h4 { font-family: var(--font-heading); font-weight: normal; font-style: italic; line-height: 1.2; }` in Layout.astro. **This is a signature typographic choice — every heading on the site is italic by default.** Preserve verbatim. Section components that want non-italic headings (rare) override locally.

#### Right-click image protection
```js
document.addEventListener('contextmenu', (e) => {
  if (e.target instanceof HTMLImageElement) e.preventDefault();
});
```
In Layout.astro `<script>` block. Basic anti-save measure for photographer portfolios. Preserve.

#### Reveal-delay cap at 5
There are only 5 delay tokens: `reveal-delay-1` through `reveal-delay-5`. Long lists use `Math.min(index + 1, 5)` so items past the 5th use the same delay (0.40s) as the 5th. New components follow the same cap pattern.

#### Nav scroll-solidify (transparent variant)
Currently in `Nav.astro` lines 534–545:
```js
if (variant === 'transparent') {
  const onScroll = () => {
    if (window.scrollY > 60) navHeader.classList.add('nav--scrolled');
    else navHeader.classList.remove('nav--scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
```
At `scrollY > 60`, the transparent nav adds `.nav--scrolled` which switches background from transparent to `var(--bg)` and flips text color from white to text. Preserve verbatim.

#### Nav dynamic compact mode
Currently in `Nav.astro` `checkLayout()` function. NOT a media query — uses ResizeObserver to measure the actual gap between logo and links, switches to hamburger (`.nav--compact`) when gap < 50px. Adapts to long site names that crowd the nav. Also sets `--nav-height` on `:root` from actual nav `offsetHeight` (used by the transparent hero pull-up calculation).

Preserve the entire `checkLayout()` function and ResizeObserver setup verbatim.

#### Nav hamburger overlay
Open/close with focus management:
- On open: focus moves to close button, body scroll locked
- On close: focus returns to hamburger button, body scroll unlocked
- Escape key closes
- Click any overlay link closes
- `aria-expanded`, `aria-hidden` toggles
- Overlay close button rotates 90deg on hover
- Overlay links indent (`padding-left: 0.5rem`) on hover

Preserve the entire interaction model.

#### Nav link underline animation
Desktop nav links have an `::after` pseudo-element that grows from `width: 0` to `width: 100%` on hover. Position absolute, bottom-aligned to the link. Preserve.

#### `.nav__inquire` button
The CTA-styled nav link (when `link.isButton === true`). On hover: `transform: translateY(-1px); letter-spacing: 0.08em;`. Subtle, distinct from the global button hover. Preserve.

### Reduced motion respect

Every animation must respect `@media (prefers-reduced-motion: reduce)`. The global system already does this for reveal and hover. Any per-component animation (image zoom, accordion) must add its own reduced-motion override.

### How to verify animations survive the rewrite

Part of Phase 11 (Integration test):

1. Open the rewritten site with DevTools open → Rendering → check "Emulate CSS prefers-reduced-motion: no-preference".
2. Scroll every page top-to-bottom slowly. Every section's content elements should fade up with a slight delay cascade.
3. Hover every button / CTA / link. Buttons lift 2px with shadow. Links change opacity and widen letter-spacing. Cards lift 3px with shadow. Arrows scale to 1.08.
4. Toggle reduced-motion. All animations must immediately go static — no error, no flash, no half-animated state.
5. Compare side-by-side with a screenshot/recording of the current site. Motion should feel identical.

If any of these fail, it's a regression and blocks the rewrite merge.

---

## 18. Out of Scope (explicit deferrals)

- Drag-to-reorder custom UI in Studio (standard array editor is fine).
- Section templates/presets library (copy sections between pages) — Sanity has duplicate-doc but not duplicate-section natively.
- Internationalization.
- Dark-mode auto toggle based on user preference.
- Live-editing / inline editing beyond what Sanity Presentation provides.
- Complex animation choreography beyond the existing `reveal` classes.
