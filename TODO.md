# TODO

## Dev Setup

Run `./start.sh` from the project root to start all three dev services at once (Astro, Sanity Studio, and Claude Code) — each opens in its own Terminal window.

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
  - `blogPost` — title, slug (auto from title), publishDate, excerpt, coverImage, category (list: On Location / Portraits / Behind the Scenes / Tips & Advice / Client Stories), body (portable text: normal/h2/h3/blockquote styles, bold/italic/link marks, inline images with alt + caption)
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
- [x] Custom Sanity Studio structure — content organized by page (🎨 Website Theme / 🏠 Homepage / 📄 About / 💼 Experience / 📝 Blog / 🖼️ Portfolio) with dividers; singletons open directly (no list view); `structureTool` structure callback in `sanity.config.js`
- [x] Descriptive field titles and descriptions across all 5 schema types (`photographer`, `testimonial`, `faq`, `blogPost`, `galleryImage`) so clients understand every field
- [x] `siteSettings` singleton wired to site — `Layout.astro` fetches `colorTheme`, `fontTheme`, `siteName` at build time; `data-theme` + `data-font` applied to `<html>`; `siteName` passed to `Nav` as prop; font theme CSS updated from `data-font-theme` → `data-font`; Nav moved into `Layout.astro` (alongside Footer) and removed from all individual page files
- [x] Fix theme CSS specificity — all theme selectors prefixed with `html[data-theme='...']` / `html[data-font='...']` (specificity 0,1,1) so they beat `:root` (0,1,0) regardless of stylesheet injection order; plain `[data-theme='...']` kept alongside via comma for section-level overrides; removed duplicate `:root` color/font variable declarations that were shadowing theme blocks (`:root` now only owns `--white`, `--font-serif`, `--font-sans`)
- [ ] Add GROQ queries with TypeScript types

### Pages
- [x] `/portfolio` — CSS masonry grid, 3-col desktop / 2 tablet / 1 mobile, 12 Pexels placeholder images, 12px gap, natural heights
- [x] `/about` — 5-section page: intro split, "What to Expect" 3-col with rotated label, personal split (text/image), pull quote, stacked-image CTA
- [x] `/experience` — 6-section page: full-bleed hero image with overlay text, centered intro, sessions (image+content), artwork (content+image), next-steps full-bleed background with content box, FAQ accordion (7 questions, vanilla JS)
- [x] `/blog` — hero image (no overlay, serif title in accent color), alternating post list (odd: image left / even: image right), Sanity-fetched posts, warm-studio theme; falls back to "No posts yet" empty state
- [x] `/blog/[slug]` — dynamic blog post page: category label, large italic h1, publish date, cover image (max 1100px, no caption), portable text body rendered via `@portabletext/to-html`; styled paragraphs, h2/h3, blockquotes, inline images (caption-only, not alt), lists, links
- [x] `/contact` — hero image with overlay, two-column layout (serif accent heading + email/Instagram links left, minimal bottom-border form right), method POST action="#"

### Nav & Internal Links
- [x] Nav links updated to real page URLs (`/experience`, `/portfolio`, `/about`, `/blog`, `/contact`)
- [x] Footer menu links updated to real page URLs
- [x] All `#about`, `#blog`, `#contact`, `#featured`, `#how-it-works` anchor hrefs replaced across all components
- [ ] Mobile hamburger menu (currently hides links on < 768px with no toggle)

### Documentation
- [x] `CLIENT-GUIDE.md` — non-technical guide: Sanity Studio login, editing bio/testimonials/gallery/blog, hosting costs ($0/month), important links, developer contact
- [x] `DEVELOPER-HANDOFF.md` — technical guide: stack summary, local dev setup, project structure, Sanity schema/client, theme system, Cloudflare Pages deploy (build command, output dir, Node version, custom domain, Web3Forms note), Sanity webhook setup (client sites via Cloudflare; preview sites via Vercel; per-client isolation notes), common change recipes

### Polish
- [x] Footer moved into `Layout.astro` — renders automatically on every page; removed individual import from `index.astro`
- [ ] Page `<title>` and `<meta description>` per page
- [ ] Open Graph image tags
- [ ] Sitemap (`@astrojs/sitemap`)
- [ ] Favicon swap (replace Astro default)

### Deploy
- [ ] Connect GitHub repo to Cloudflare Pages (build: `npm run build`, output: `dist`, Node 18+)
- [x] Fix Sanity build caching — `useCdn: false` + `token: undefined` + `ignoreBrowserTokenWarning: true` in `src/lib/sanity.js`; `Layout.astro`, `blog/index.astro`, `blog/[slug].astro` converted from `sanityClient.fetch()` to direct `fetch()` calls to `hx5xgigp.api.sanity.io` HTTP API with `{ cache: 'no-store' }`; parameterized queries use `JSON.stringify` + `encodeURIComponent` for `$slug` URL param
- [ ] Set environment variables for Sanity project ID / dataset
- [ ] Connect custom domain via Cloudflare Pages settings
- [ ] Set up Web3Forms API key in `contact.astro`
- [ ] (Optional) Configure Sanity deploy webhook → Cloudflare Pages deploy hook
