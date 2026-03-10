# Developer Handoff

## Project Overview

| Layer | Technology |
|---|---|
| Frontend | Astro 5 (static site generator) |
| CMS | Sanity Studio v5 (headless, hosted) |
| Hosting | Vercel (auto-deploy from GitHub) |
| Styling | Scoped CSS in `.astro` files + global CSS custom properties |
| Images | Pexels (placeholders) + Sanity image pipeline (`@sanity/image-url`) |

The Astro frontend fetches content from Sanity at **build time**. There is no runtime API call — the site is fully static HTML after build. Redeployment is required for content changes to go live (Vercel handles this automatically via a Sanity webhook or on every GitHub push).

---

## Local Development

### Prerequisites
- Node.js 18+
- A Sanity account with access to project `hx5xgigp`

### Astro frontend (root)
```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # output to ./dist/
npm run preview    # preview production build locally
```

### Sanity Studio (`studio/` directory)
```sh
cd studio
npm install
npm run dev        # Sanity Studio at http://localhost:3333
npm run deploy     # deploy Studio to Sanity's hosted URL
```

The two apps are completely independent. You can run either or both simultaneously.

---

## Project Structure

```
/
├── src/
│   ├── pages/          # File-based routing — each .astro file = one URL
│   │   ├── index.astro     # Homepage (/)
│   │   ├── portfolio.astro # /portfolio
│   │   ├── about.astro     # /about
│   │   ├── experience.astro# /experience
│   │   ├── blog.astro      # /blog
│   │   └── contact.astro   # /contact
│   ├── layouts/
│   │   └── Layout.astro    # Page shell: <head>, global CSS vars, Nav slot, Footer
│   ├── components/         # Reusable section components
│   │   ├── Nav.astro
│   │   ├── Footer.astro
│   │   ├── Hero.astro          # Homepage carousel
│   │   ├── Intro.astro         # Bio + approach (variant A)
│   │   ├── IntroCentered.astro # Bio + approach (variant B)
│   │   ├── Testimonials.astro      # Testimonials slider (variant A)
│   │   ├── TestimonialsGrid.astro  # Testimonials 3-up grid (variant B)
│   │   ├── FeaturedDogs.astro      # Portfolio preview (variant A)
│   │   ├── PortfolioMasonry.astro  # Portfolio preview (variant B)
│   │   ├── HowItWorks.astro        # Steps 3-column (variant A)
│   │   ├── HowItWorksStacked.astro # Steps vertical timeline (variant B)
│   │   ├── WhyChoose.astro
│   │   ├── FAQs.astro
│   │   └── intro/          # Sanity-aware intro variants (used by index.astro)
│   │       ├── IntroSplit.astro
│   │       └── IntroCentered.astro
│   └── lib/
│       └── sanity.js       # Sanity client + urlFor() helper
├── studio/                 # Sanity Studio (separate app)
│   ├── sanity.config.js    # Project ID + dataset config
│   └── schemaTypes/        # Content type definitions
│       ├── index.js        # Schema registry
│       ├── photographer.js
│       ├── testimonial.js
│       ├── galleryImage.js
│       ├── blogPost.js
│       └── faq.js
├── public/                 # Static assets served as-is
├── CLAUDE.md               # Instructions for AI coding assistants
├── CLIENT-GUIDE.md         # End-client instructions
└── TODO.md                 # Project task tracker
```

---

## Sanity CMS

**Project ID:** `hx5xgigp`
**Dataset:** `production`
**Config file:** `studio/sanity.config.js`
**Schema files:** `studio/schemaTypes/`

### Sanity client (frontend)
Initialized in `src/lib/sanity.js`:
```js
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  projectId: 'hx5xgigp',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
});

const builder = imageUrlBuilder(client);
export const urlFor = (source) => builder.image(source);
```

### Adding a new schema type
1. Create `studio/schemaTypes/myType.js` following the pattern of existing schema files.
2. Import and add it to the `types` array in `studio/schemaTypes/index.js`.
3. Query it in the relevant Astro page frontmatter using GROQ via `client.fetch(...)`.

### Image URLs
Always use `urlFor()` from `src/lib/sanity.js` to generate Sanity image URLs:
```js
urlFor(image).width(800).height(600).fit('crop').auto('format').url()
```

---

## Theme System

### Colour themes
Defined as `[data-theme="..."]` attribute selectors in `src/layouts/Layout.astro`.

Available themes: `classic-cream` · `warm-studio` · `dark-editorial` · `cool-minimal` · `forest-sage`

Apply to any section element: `<section data-theme="warm-studio">`. The selector sets these CSS custom properties scoped to that element:
`--bg` · `--text` · `--accent` · `--surface` · `--bg-alt` · `--accent-dark` · `--muted` · `--muted-light` · `--border`

**Important:** Nav lives outside any `data-theme` section. All `var()` usages in `Nav.astro` include explicit fallback values (e.g. `var(--bg, #f5f3ef)`) so it renders correctly regardless of cascade state.

### Font themes
Defined as `[data-font-theme="..."]` selectors in `Layout.astro`, applied via `data-font-theme` on `<body>`.

Available themes: `classic-editorial` · `romantic-script` · `modern-luxury` · `soft-contemporary` · `bold-editorial` · `airy-minimal`

Each sets `--font-heading` and `--font-body`. Components reference these via `var(--font-serif)` (alias for `--font-heading`) and `var(--font-sans)` (alias for `--font-body`).

To change the site-wide font: update `data-font-theme` on `<body>` in `Layout.astro`.

---

## Deployment

The site deploys to **Vercel** from the GitHub `main` branch.

- Every push to `main` triggers a full Vercel build and deploy.
- Sanity content changes require a new build to go live. Options:
  - Push a trivial commit to trigger a deploy, or
  - Set up a [Sanity deploy webhook](https://www.sanity.io/docs/webhooks) pointing at the Vercel deploy hook URL.
- Environment variables (if needed): set in the Vercel project dashboard under Settings → Environment Variables.

---

## Making Changes

### Updating nav links or logo
Edit `src/components/Nav.astro`.

### Adding a new page
Create `src/pages/new-page.astro`. It's automatically available at `/new-page`. Add a link to it in `Nav.astro` and `Footer.astro`.

### Changing section order on the homepage
Edit `src/pages/index.astro` — sections are composed in JSX order.

### Swapping a section variant (e.g. Intro → IntroCentered)
In `index.astro`, replace the component import and usage. All variants accept identical props.

### Changing colour theme for a section
Add or change the `data-theme` attribute on the `<section>` element.

### Editing global styles (fonts, colours, spacing scale)
Edit the `:root` and `[data-theme]` blocks in `src/layouts/Layout.astro`.

### Finding niche-specific copy to update for a new client
Search the codebase for `TODO:NICHE` — every piece of pet-specific copy is marked.
