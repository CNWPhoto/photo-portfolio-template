# TODO

## ✅ Completed

### Homepage Layout & Components
- [x] Build 10 homepage components: Nav, Hero, Intro, Testimonials, FeaturedDogs, HowItWorks, WhyChoose, FAQs, Footer
- [x] Global CSS custom property design system in `Layout.astro`
  - Background `#f5f3ef`, text `#1a2744` (dark navy), accent `#8b2635` (burgundy)
  - Georgia serif throughout, italic headings, generous whitespace, thin `hr` dividers
- [x] Nav — "Pet Photography" small-caps serif logo, right-aligned links, sticky with border-bottom
- [x] Hero — infinite-loop horizontal scrolling image strip with arrow navigation
  - IDs: `1108099`, `2253275`, `825949`, `1805164`, `3726314`
  - Viewport `100% × 70vh` (`min-height: 400px`), `overflow: hidden`, `position: relative`
  - Track: `display: flex; gap: 15px; height: 100%; transition: transform 0.5s ease`
  - Images: `height: 100%; width: auto; flex-shrink: 0; max-width: unset` — inherit 70vh, natural width, never compress
  - Active image is always **centered** in the viewport: `translateX = -(imageLeft + imgW/2 - vpW/2)`
  - `imageLeft(i)` sums `offsetWidth + 15` for all preceding images (track-space, unaffected by transform)
  - **Infinite loop**: 2 clones prepended (last 2 real images) + 2 clones appended (first 2 real images); `transitionend` silently jumps to real equivalent with `transition: none` + `getBoundingClientRect()` reflow
  - Both arrows always visible (no hide at ends)
  - Debounced resize listener (100ms) recalculates on viewport height change
  - Double-fires on load for cached images
  - Below: large italic "Denver Dog Photographer" + spaced-caps subline
- [x] Intro — Edge-to-edge portrait image left, italic editorial copy right
- [x] Testimonials — Left portrait photo + right quote, JS cycling with prev/next arrows
- [x] FeaturedDogs — Vertically rotated "Featured Dogs" serif label left, 2 tall images, bordered CTA button
- [x] HowItWorks — Centered italic heading, 3-column steps with thin top rules
- [x] WhyChoose — Full-bleed landscape image, two-column heading + body below
- [x] FAQs — Vertically rotated "FAQs" serif label left, questions in italic, answers in left-bordered blockquote
- [x] Footer — Small-caps wordmark top-right, 3 columns with vertical dividers (Social / Menu / Newsletter), 6-photo Instagram strip

### Images
- [x] Hero carousel uses exact Pexels URLs specified
- [x] Real Pexels dog photo URLs on every image in every section (no placeholders remain)
- [x] All images lazy-loaded except hero (eager + fetchpriority)

### Sanity Studio
- [x] Studio initialized at `studio/` (separate app, runs independently)
- [x] Project ID `hx5xgigp`, dataset `production` configured in `studio/sanity.config.js`
- [x] `@sanity/client` and `@sanity/image-url` installed in root `package.json`

---

## ⬜ Up Next

### Sanity CMS Integration
- [x] Define schema types in `studio/schemaTypes/` (universal — no pet-specific fields)
  - `photographer` — singleton: name, location, tagline, bio, specialty, approachText ("Your Approach"), heroImages (array), profilePhoto
  - `testimonial` — quote, clientName, clientSubjectName ("Subject's Name"), photo, order
  - `galleryImage` — title, photo, category (portrait/lifestyle/detail/family/other), order
  - `blogPost` — title, slug (auto from title), publishDate, excerpt, coverImage, body (portable text)
  - `faq` — question, answer, order
  - All registered in `studio/schemaTypes/index.js`
- [x] Initialize Sanity client in `src/lib/sanity.js`
  - `createClient` with projectId `hx5xgigp`, dataset `production`, useCdn, apiVersion `2024-01-01`
  - `urlFor(source)` helper via `imageUrlBuilder`
- [x] Replace hardcoded homepage content with Sanity fetches (build-time via `Promise.all` in `index.astro`)
  - Hero carousel → `photographer.heroImages` (fallback: Pexels IDs)
  - Intro bio + approachText + profilePhoto → `photographer` document (fallback: hardcoded copy)
  - Testimonials → `testimonial` documents ordered by `order` (fallback: hardcoded)
  - FeaturedDogs → first 2 `galleryImage` documents (fallback: hardcoded)
  - FAQs → `faq` documents ordered by `order` (fallback: hardcoded)
- [x] Use `@sanity/image-url` with hotspot/crop support; `.width().height().fit('crop').auto('format').url()`
- [x] Audit all schemas and components for pet-specific copy; added `TODO:NICHE` comments throughout for easy forking
- [x] Site-wide colour + typography theme system
  - **Font themes** (6): Classic Editorial / Romantic Script / Modern Luxury / Soft Contemporary / Bold Editorial / Airy Minimal
    - Defined as `[data-font-theme="..."]` selectors setting `--font-heading` and `--font-body`
    - Applied via `data-font-theme` on `<body>` — cascades site-wide
    - Google Fonts loaded in `<head>` (all 12 families in one request with `display=swap`)
    - `--font-serif` and `--font-sans` kept as aliases (`var(--font-heading/body)`) for backward compat with component scoped styles
    - Default: `classic-editorial` (Cormorant Garamond + Jost)
  - **Colour themes** (5): Classic Cream / Warm Studio / Dark Editorial / Cool Minimal / Forest Sage
    - Defined as `[data-theme="..."]` CSS attribute selectors in `Layout.astro`
    - Each sets: `--bg`, `--text`, `--accent`, `--surface`, `--bg-alt`, `--accent-dark`, `--muted`, `--muted-light`, `--border`
    - `[data-theme]` rule scopes `background`/`color` to any themed element
    - All section components (including Footer) accept `theme` prop → `data-theme={theme}`, default `'classic-cream'`
  - **`siteSettings`** Sanity singleton: siteName, colorTheme, fontTheme, accentColor (hex override)
  - **`pageSection`** schema updated: `colorTheme` + `fontTheme` fields for per-section overrides
  - Demo: HowItWorks → `warm-studio`, WhyChoose → `dark-editorial`, Footer → `classic-cream`
- [x] Section layout variants — 2 variants per key section, swappable via Sanity `pageSection.variant`
  - **Testimonials**: `Testimonials.astro` (original — image + quote + arrows) · `TestimonialsGrid.astro` (3 cards, circular photos, small-caps name, no arrows) ✓ created
  - **Portfolio**: `FeaturedDogs.astro` (original — 2 images, rotated label) · `PortfolioMasonry.astro` (6 images, CSS columns masonry, 15px gap, centered CTA) ✓ created
  - **Intro**: `Intro.astro` (original — image left / text right) · `IntroCentered.astro` (centered text block, full-width image below) ✓ created
  - **HowItWorks**: `HowItWorks.astro` (original — 3-column grid) · `HowItWorksStacked.astro` (vertical timeline, large italic serif numbers, connector line) ✓ created
  - All variants accept identical props; all support `theme` prop
  - `pageSection.variant` field added to Sanity schema (single list covering all section types)
  - `index.astro` fetches `pageSection` docs and uses `sectionCfg()` helper to select variant + theme per section
  - Gallery GROQ query extended to 6 images (`[0..5]`) for masonry support
- [x] Fix: Hero missing from homepage — dropped from index.astro during section variants refactor; import and placement restored (first element after Nav, outside <main>)
- [x] Fix: Nav invisible after theme system refactor — added explicit fallback values to all `var()` usages in Nav.astro (`var(--bg, #f5f3ef)`, `var(--text, #1a2744)`, `var(--accent, #8b2635)`, `var(--border, #d4cfc6)`, `var(--font-serif, Georgia, serif)`). Root cause: nav lives outside `data-theme` sections and relied purely on `:root` cascade from the combined `:root, [data-theme='classic-cream']` selector.
- [ ] Add GROQ queries with TypeScript types

### Pages
- [ ] `/portfolio` — full photo grid, filterable by tag
- [ ] `/about` — extended bio, awards, press mentions
- [ ] `/experience` — full How It Works detail page
- [ ] `/blog` — post listing + individual post pages
- [ ] `/contact` / `/inquire` — contact form (Formspree or Netlify Forms)

### Nav
- [ ] Mobile hamburger menu (currently hides links on < 768px with no toggle)

### Polish
- [ ] Page `<title>` and `<meta description>` per page
- [ ] Open Graph image tags
- [ ] Sitemap (`@astrojs/sitemap`)
- [ ] Favicon swap (replace Astro default)

### Deploy
- [ ] Choose host (Netlify / Vercel / Cloudflare Pages)
- [ ] Set environment variables for Sanity project ID / dataset
- [ ] Connect custom domain
