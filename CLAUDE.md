# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A photo portfolio website built with **Astro 5** (frontend) and **Sanity v5** (CMS/content backend). The two parts are developed independently in separate directories with separate `package.json` files.

## Commands

### Astro Frontend (root directory)
```sh
npm install        # Install dependencies
npm run dev        # Start dev server at localhost:4321
npm run build      # Build to ./dist/
npm run preview    # Preview production build
```

### Sanity Studio (`studio/` directory)
```sh
cd studio
npm install        # Install dependencies
npm run dev        # Start Sanity Studio dev server
npm run build      # Build Studio
npm run deploy     # Deploy Studio to Sanity's hosted URL
```

## Architecture

### Two-App Structure
- **Root**: Astro 5 site — the public-facing photo portfolio
- **`studio/`**: Sanity Studio v5 — the CMS for managing portfolio content

The Astro frontend fetches content from Sanity using `@sanity/client` and `@sanity/image-url` (already installed in root `package.json`).

### Sanity Configuration
- Project ID: `hx5xgigp`
- Dataset: `production`
- Config: `studio/sanity.config.js`
- Schema types: `studio/schemaTypes/index.js` — registers `photographer`, `testimonial`, `galleryImage`, `blogPost`, `faq`

### Astro Source Layout
- `src/pages/` — File-based routing; each `.astro` file is a route
- `src/layouts/` — Page shell components (currently `Layout.astro`)
- `src/components/` — Reusable UI components
- `src/assets/` — Images and SVGs processed by Astro
- `public/` — Static files served as-is

### Connecting Astro to Sanity
The Sanity client should be initialized using the project ID and dataset from `studio/sanity.config.js`. Use `@sanity/client` in Astro page frontmatter or data-fetching utilities to query content, and `@sanity/image-url` to generate optimized image URLs from Sanity's image assets.

### Studio Prettier Config
The `studio/` directory uses its own Prettier config (no semicolons, single quotes, `printWidth: 100`, no bracket spacing).

## Niche Forking

This template is built for pet photography but designed to be forked for any photographer niche. Search for `TODO:NICHE` comments to find copy that needs updating per client. Key locations:
- Studio name/logo: `Nav.astro`, `Footer.astro`
- Hero fallback images: `Hero.astro`
- Intro bio/approach fallback: `Intro.astro`
- Testimonial fallback quotes: `Testimonials.astro`
- Featured section label ("Featured Dogs"): `FeaturedDogs.astro`
- How It Works heading + step copy: `HowItWorks.astro`
- Why Choose heading + body: `WhyChoose.astro`
- FAQ fallback questions: `FAQs.astro`
