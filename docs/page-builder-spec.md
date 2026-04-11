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
  - **Reserved slugs** (must reject): `api`, `blog`, `portfolio`, `preview`, `admin`, `studio`, `_` (leading underscore), empty
- `seo` (object) — reuses existing `seo` schema (seoTitle, seoDescription, socialImage, noIndex)
- `sections[]` (array of all section types — see section catalog below)
- `navigation` (object)
  - `showInNav` (boolean, default false)
  - `navLabel` (string, optional — falls back to `title`)
  - `navOrder` (number)
- `defaultPalette` (reference to a palette in siteSettings, optional — falls back to site default)
- `navThemeOverHero` (string: `light | dark | auto`, default `auto`) — controls nav color when overlaid on the first section. `auto` reads the first section's palette.

### Singletons kept

- `homepagePage` — singleton, known ID, routed at `/`. Uses the same `sections[]` shape as `page`. Has hero config outside `sections[]` (stays as-is structurally).
- `portfolioPage` — singleton, index of portfolio items. Not a free-form page.
- `blogPage` — singleton, index of blog posts. Not a free-form page.
- `notFoundPage` — singleton, renders at the 404 route. Same `sections[]` shape.
- `siteSettings`, `navSettings`, `footerSettings`, `socialSettings`, `seoSettings`, `codeSettings` — all unchanged.

### What gets deleted

- `aboutPage`, `experiencePage`, `contactPage` document types (replaced by `page`)
- All `sections/about*`, `sections/experience*`, `sections/welcomeSection`, `sections/whyChooseSection`, `sections/heroSection` (the experienceHero / aboutIntroSection etc. — the niche-named variants). Replaced by the unified catalog.
- All `src/components/intro/`, `src/components/howitworks/`, `src/components/portfolio/` (the variant-split components get merged into single palette-aware versions)
- All legacy `bodyParagraph1`/`bodyFirst`/`bodySecond` fields (already redundant; this task kills them completely)

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
Vertical or horizontal step-by-step list. Replaces `processSection` (stacked variant).

Fields:
- `eyebrow`: string
- `heading`: string
- `steps[]`: each
  - `stepNumber`: string (optional, e.g. "01")
  - `title`: string
  - `body`: portable text
  - `image`: image (optional)
- `variant`: `stacked` | `timeline` | `horizontal-cards`

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

### Category groupings (for Studio UX)

When exposed in the `sections[]` array type, group them:

- **Hero**: `heroSection`
- **Layout**: `splitSection`, `fullBleedImageSection`, `richTextSection`, `pullQuoteSection`, `threeColumnSection`, `stepsSection`, `galleryGridSection`, `dividerSection`
- **CTA**: `ctaBandSection`, `contactFormSection`, `contactInfoSection`
- **Dynamic**: `testimonialsSection`, `faqSection`, `featuredPortfolioSection`, `blogTeaserSection`

Sanity's `of: []` array type allows grouping via the `insertMenu` configuration in schema v3. Use `insertMenu.groups` to categorize.

---

## 3. Color Palette System

### Storage

`siteSettings.palettes[]` — array of palette objects. Each palette:

```
{
  name: string (e.g. "Warm Cream")
  slug: slug (for referencing)
  bg: color
  bgAlt: color
  text: color
  textMuted: color
  accent: color
  accentDark: color
  border: color
  white: color (usually #fff)
}
```

Ship with 3–5 default palettes: Warm Cream (current default), Charcoal Editorial, Soft Blush, Monochrome, Sage.

### Default resolution order

Per-section: explicit `palette` field → page `defaultPalette` → site default (`siteSettings.defaultPalette`).

### Rendering

Each section's Astro component wraps itself in a root element with inline CSS custom properties:

```astro
<section
  class="section-wrap"
  style={`--bg:${p.bg}; --bg-alt:${p.bgAlt}; --text:${p.text}; --text-muted:${p.textMuted}; --accent:${p.accent}; --accent-dark:${p.accentDark}; --border:${p.border}; --white:${p.white};`}
>
  ...
</section>
```

All section CSS references `var(--bg)` / `var(--text)` / etc. and gets the right values automatically. This is the one mechanism — no `data-theme` attribute, no class-based themes, no cascade overrides.

### Global defaults

`src/styles/palette.css` defines fallback values on `:root` so un-wrapped contexts still work.

### Helper

`src/lib/palette.js` — exports `paletteToStyle(palette)` that returns the inline style string. Used by every section component via a single import.

---

## 4. Spacing System

Each section has a `spacing` field (`compact` | `normal` | `spacious`).

CSS:
```
:root {
  --section-pt-compact: 3rem;
  --section-pt-normal: 6rem;
  --section-pt-spacious: 9rem;
}

section[data-spacing="compact"] { padding-block: var(--section-pt-compact); }
section[data-spacing="normal"]  { padding-block: var(--section-pt-normal); }
section[data-spacing="spacious"] { padding-block: var(--section-pt-spacious); }
```

On mobile, scale down proportionally (`2rem`, `4rem`, `6rem`).

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

`navSettings` gains a new field: `autoPopulate` (boolean, default true). When true, nav items are pulled at query time from `*[_type == "page" && navigation.showInNav == true] | order(navigation.navOrder asc)`. When false, editors manage a manual list.

Nav component fetches pages with `showInNav: true`, renders them as links using `resolveLink`.

### Nav theme on hero overlap

`page.navThemeOverHero`: `auto` | `light` | `dark`

- `auto`: compute from first section's palette — if background is dark (luminance < 0.5), use light nav.
- Explicit `light` / `dark` override.

Nav component receives a `variant` prop and applies appropriate colors.

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

## 13. Contact Form Backend

For built-in mode (embed mode needs no backend).

### Architecture

- POST endpoint at `/api/contact` implemented as a Cloudflare route in the existing Astro Cloudflare adapter setup.
- Route file: `src/pages/api/contact.ts`.
- Handler: parse JSON body, validate required fields, send email via Resend API, return JSON response.

### Email provider

**Resend** (https://resend.com):
- Free tier: 3,000 emails/month, 100/day. Sufficient for a photographer portfolio.
- Simple REST API, single POST call.
- Domain verification optional but recommended for deliverability — until verified, emails come `from: onboarding@resend.dev`.

### Environment variables (per client)

Added to Cloudflare Pages env vars for each client deployment:
- `RESEND_API_KEY` — from their Resend dashboard
- `CONTACT_FORM_FROM_EMAIL` — the `from:` address (e.g. `website@clientdomain.com`, needs verified domain)
- `CONTACT_FORM_DEFAULT_DESTINATION` — fallback destination email if a section doesn't specify one

Template `.env.example` updated to document these.

### Request shape

```
POST /api/contact
Content-Type: application/json

{
  "sectionKey": "abc123",           // Sanity _key of the form section (for destination lookup)
  "fields": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "message": "Interested in a session"
  }
}
```

### Response shape

```
200 OK { "ok": true }
400 Bad Request { "ok": false, "error": "Missing required field: email" }
500 Internal { "ok": false, "error": "Failed to send. Try again." }
```

### Validation

Server-side:
- Reject if any declared-required field is missing or empty.
- Email fields validated with a simple regex (not exhaustive — email validation is a rabbit hole).
- Basic honeypot: reject if a hidden `_gotcha` field is non-empty.
- Rate limit: Cloudflare Workers KV or Durable Objects — optional for v1, add if spam becomes an issue.

### Client-side

`ContactFormSection.astro` includes inline JS that:
1. Intercepts form submit
2. POSTs as JSON to `/api/contact`
3. Shows success / error message from the section's configured strings
4. Disables submit button during in-flight request

No framework dependency — vanilla JS in a `<script>` block.

### Deliverability note for client onboarding docs

Until the client verifies their domain in Resend, emails send from `onboarding@resend.dev` and may go to spam. Domain verification is a one-time DNS step per client. Include in the onboarding docs.

---

## 14. Legacy Cleanup

Delete after new system is working and dataset is reset/cleared:

- `studio/schemaTypes/aboutPage.js`
- `studio/schemaTypes/experiencePage.js`
- `studio/schemaTypes/contactPage.js`
- `studio/schemaTypes/sections/aboutIntroSection.js`
- `studio/schemaTypes/sections/aboutPersonalSection.js`
- `studio/schemaTypes/sections/aboutCtaSection.js`
- `studio/schemaTypes/sections/aboutQuoteSection.js`
- `studio/schemaTypes/sections/aboutWhatToExpectSection.js`
- `studio/schemaTypes/sections/experienceHero.js`
- `studio/schemaTypes/sections/experienceIntro.js`
- `studio/schemaTypes/sections/experienceSessions.js`
- `studio/schemaTypes/sections/experienceArtwork.js`
- `studio/schemaTypes/sections/experienceNextSteps.js`
- `studio/schemaTypes/sections/experienceFaqs.js`
- `studio/schemaTypes/sections/welcomeSection.js`
- `studio/schemaTypes/sections/whyChooseSection.js`
- `studio/schemaTypes/sections/featuredSection.js`
- `studio/schemaTypes/sections/processSection.js`
- `studio/schemaTypes/sections/homepageFaqs.js`
- `studio/schemaTypes/sections/heroSection.js` (current one — rebuilt)
- `studio/schemaTypes/sections/testimonialsSection.js` (current one — rebuilt in new shape)
- `src/pages/about.astro`
- `src/pages/experience.astro`
- `src/pages/contact.astro`
- `src/components/intro/IntroSplit.astro`
- `src/components/intro/IntroCentered.astro`
- `src/components/howitworks/HowItWorksColumns.astro`
- `src/components/howitworks/HowItWorksStacked.astro`
- `src/components/portfolio/PortfolioGrid.astro` (if not reused by actual portfolio page)
- `src/components/portfolio/PortfolioMasonry.astro` (same)
- `src/components/Hero.astro` (replaced by sections/HeroSection.astro)
- `src/components/WhyChoose.astro`
- `src/components/FAQs.astro`
- `src/components/Testimonials.astro`
- `src/components/FeaturedDogs.astro`
- `src/components/Intro.astro`, `src/components/About.astro`, `src/components/IntroCentered.astro`, `src/components/PortfolioMasonry.astro`, `src/components/TestimonialsGrid.astro`, `src/components/Packages.astro` (any stale duplicates)
- `src/lib/portableText.js` legacy-fallback helpers — keep `renderBody`, drop the string-paragraph fallback path (not needed anymore)

Run an unused-export check after cleanup to catch leftovers.

---

## 15. Implementation Phases

Ordered for Claude Code execution. Each phase is a commit.

### Phase 1 — Foundation (est. 1–2 hours)
1. Palette schema in `siteSettings` (data shape only; actual values come from the current CSS variables in §16).
2. `src/lib/palette.js` helper (`paletteToStyle`, `resolvePalette`).
3. `src/lib/links.js` helper (`resolveLink`).
4. `src/styles/palette.css` — global fallbacks using current default palette values.
5. Shared `studio/schemaTypes/_shared/sectionBase.js` for common section fields (enabled, palette, spacing, sectionId).
6. Shared `studio/schemaTypes/_shared/ctaLink.js` object type.

### Phase 2 — Page model + categories (est. 1–1.5 hours)
1. New `page` document schema with slug, SEO, sections, navigation, palette.
2. Slug validator with reserved-route list.
3. `blogCategory` and `portfolioCategory` document types (§11).
4. Update `blogPost` schema: replace old `category` string with `categories[]` reference array (max 3) + editor description warning.
5. Update `portfolio` item schema: add `categories[]` reference array for portfolioCategory.
6. `notFoundPage` rewritten to use new sections shape.
7. `homepagePage` updated to use new sections shape.
8. Studio desk structure updated for the new layout (Pages with singletons + Pages list + 404, Categories list).

### Phase 3 — Section schemas (est. 1.5–2 hours)
Write all section schemas in the catalog. No frontend yet. Include the `insertMenu.groups` config on the `sections[]` array to categorize types.

### Phase 4 — SectionRenderer + dynamic routing (est. 1 hour)
1. `src/components/SectionRenderer.astro` (initially maps to stub components).
2. `src/pages/[...slug].astro` dynamic route.
3. `src/pages/index.astro` simplified to use SectionRenderer.
4. `src/pages/404.astro` updated.

### Phase 5 — Section components (est. 4–6 hours, longest phase)
Build each section component, one per file in `src/components/sections/`. Port CSS from existing components where relevant. Every component:
- Wraps in a `<section>` root with inline palette CSS vars.
- Supports `spacing` via `data-spacing` attr.
- Uses `isFirst` to pick heading level.
- Honors reserved CSS var names only.
- Mobile-first, tested at 375px / 768px / 1280px / 1920px.
- Renders body content via the portable text helper.
- Declares its own fallback image URL constants at the top (current Pexels URLs — see §12 Image Fallbacks).

### Phase 6 — Nav + navigation query (est. 0.5 hour)
1. Nav query reads `page` docs with `showInNav: true`, ordered by `navOrder`.
2. Nav theme variant handling (light/dark based on first-section palette).

### Phase 7 — Category routes (est. 1 hour)
1. `src/pages/blog/category/[slug].astro` — filtered blog list, noindex meta.
2. `src/pages/portfolio/category/[slug].astro` — filtered portfolio list, noindex meta.
3. Update `/blog/[slug].astro` and `/portfolio/[slug].astro` to render category chips linking to the category pages.

### Phase 8 — Contact form backend (est. 1–1.5 hours)
1. `src/pages/api/contact.ts` — POST handler, Resend integration.
2. Env var setup in `.env.example` (`RESEND_API_KEY`, `CONTACT_FORM_FROM_EMAIL`, `CONTACT_FORM_DEFAULT_DESTINATION`).
3. Built-in form submission JS in `ContactFormSection.astro`.
4. Embed-mode iframe rendering path in `ContactFormSection.astro`.

### Phase 9 — Seed script (est. 1.5–2 hours)
Write `studio/scripts/seed.js` that creates (non-destructively):
- Default palettes in `siteSettings`, copied from current CSS values.
- Nav/footer/social/SEO/code settings defaults.
- Homepage with the current section lineup and copy.
- `page` documents for About, Experience, Contact — section lineups + copy matching today's site.
- `notFoundPage` with friendly error content.
- Starter `blogCategory` and `portfolioCategory` entries.
Add `npm run seed` script to `studio/package.json`. Image fields stay empty — component fallbacks handle visuals.

### Phase 10 — Legacy cleanup (est. 0.5 hour)
Delete all files listed in §14. Verify build passes. Run unused-export check.

### Phase 11 — Integration test (est. 0.5–1 hour)
1. Wipe dataset, run `npm run seed`, verify site renders identically to pre-rewrite state.
2. Test creating a new page via Studio, adding each section type, verifying rendering.
3. Test category filtering and noindex headers.
4. Submit a built-in contact form, verify email arrives.
5. Swap to embed mode with a test form URL, verify iframe renders.
6. Toggle palette on a section, verify color swap works without page reload.
7. Mobile check at 375px across every page.

**Total realistic estimate: 13–17 hours of focused build time.** The category work + seed script + contact form backend add ~4 hours over the previous estimate because they're now first-class requirements, not optional polish.

---

## 16. Locked Decisions

All previously open questions have been decided. Recorded here for reference.

1. **Contact form backend**: Cloudflare Pages API route (`src/pages/api/contact.ts`) + Resend API. Dual-mode section supports iframe embed as an alternative. See §13.
2. **Default palettes**: Use the existing template palettes (the CSS variable values currently defined in global styles). Copied verbatim into `siteSettings.palettes[]` by the seed script. Clients can edit, add, or remove palettes via Studio after install — no code changes needed.
3. **Starter template**: The seed script populates every current page (Homepage, About, Experience, Contact, 404) with today's layout and copy as editable `page` documents. Images are left empty; section components fall back to the current Pexels URLs hardcoded per component. See §12.
4. **Nav auto-populate**: Opt-in only. New pages default to `showInNav: false`. Editors explicitly toggle it per page. Nav never gets accidental entries.
5. **Blog/portfolio index pages**: Stay as dedicated singletons (`blogPage`, `portfolioPage`). They aren't free-form `page` documents. Reusing their content on other pages is handled by `blogTeaserSection` and `featuredPortfolioSection`. Blog/portfolio item docs (`blogPost`, `portfolio`) remain collections.
6. **Categories**: Free-form, editor-created, max 3 per item, reference-based for deduplication. Category pages emit `noindex, follow`. Editors see a "keep minimal" warning above the picker. See §11.
7. **Embed forms**: Supported via iframe URL only (not raw HTML/script) to avoid injection risk. See §13 `contactFormSection`.

---

## 17. Out of Scope (explicit deferrals)

- Drag-to-reorder custom UI in Studio (standard array editor is fine).
- Section templates/presets library (copy sections between pages) — Sanity has duplicate-doc but not duplicate-section natively.
- Internationalization.
- Dark-mode auto toggle based on user preference.
- Live-editing / inline editing beyond what Sanity Presentation provides.
- Complex animation choreography beyond the existing `reveal` classes.
