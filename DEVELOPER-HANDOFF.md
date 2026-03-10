# Developer Handoff

## Project Overview

| Layer | Technology |
|---|---|
| Frontend | Astro 5 (static site generator) |
| CMS | Sanity Studio v5 (headless, hosted) |
| Hosting | Cloudflare Pages (auto-deploy from GitHub) |
| Styling | Scoped CSS in `.astro` files + global CSS custom properties |
| Images | Pexels (placeholders) + Sanity image pipeline (`@sanity/image-url`) |

The Astro frontend fetches content from Sanity at **build time**. There is no runtime API call — the site is fully static HTML after build. Redeployment is required for content changes to go live (Cloudflare Pages handles this automatically on every GitHub push).

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

The site deploys to **Cloudflare Pages** from the GitHub `main` branch.

### Initial setup
1. Go to [pages.cloudflare.com](https://pages.cloudflare.com) and connect your GitHub account.
2. Select the repository and configure the build:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Node version:** 18 or higher (set via environment variable `NODE_VERSION = 18`)
3. Click **Save and Deploy**.

### Ongoing deploys
Every push to `main` triggers a full build and deploy automatically. No action needed.

### Custom domain
1. In the Cloudflare Pages project, go to **Custom domains** and add the client's domain.
2. Update the domain's DNS records as instructed (Cloudflare manages DNS if the domain is registered or transferred there, making this one-click).

### Environment variables
Set in the Cloudflare Pages project dashboard under **Settings → Environment variables**.

### Contact form
Form submissions on `/contact` are handled by **Web3Forms** (free, no monthly fee). The API key is set directly in `src/pages/contact.astro` — update it per client.

---

## Sanity Webhook Setup (Required for Live Content Updates)

Without this, content changes in Sanity will NOT appear on the live site until a manual redeploy. This must be set up for every client site.

### For Client Sites (Cloudflare Pages)

Step 1 — Get Cloudflare deploy hook URL:
1. Go to dash.cloudflare.com → Pages → select client project
2. Settings → Builds & Deployments → Deploy Hooks
3. Click "Add deploy hook"
4. Name: "Sanity Content Update" — Branch: main
5. Copy the webhook URL

Step 2 — Add webhook in Sanity:
1. Go to sanity.io → client's project → API → Webhooks
2. Click "Create webhook"
3. Name: "Cloudflare Deploy"
4. URL: paste Cloudflare deploy hook URL
5. Dataset: production
6. Trigger on: Create, Update, Delete
7. Save

Step 3 — Test:
- Publish any content change in Sanity
- Check Cloudflare Pages dashboard — new build should trigger within seconds
- Build takes approximately 60 seconds
- Content appears on live site automatically after build

### For Your Own Preview Site (Vercel)

Step 1 — Get Vercel deploy hook URL:
1. Go to vercel.com → your project → Settings → Git → Deploy Hooks
2. Create hook named "Sanity Update" on branch "main"
3. Copy the webhook URL

Step 2 — Add webhook in Sanity:
1. Go to sanity.io → your project → API → Webhooks
2. Same steps as above but paste Vercel URL instead

### Important Notes
- Each client gets their own Sanity project with their own webhook
- Each client gets their own Cloudflare Pages site with their own deploy hook
- Never share Sanity projects between clients
- Webhook setup takes about 5 minutes per client site — add it to your client onboarding checklist

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
