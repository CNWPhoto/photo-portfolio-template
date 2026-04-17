# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Sibling knowledge base

This project has a shared Astro/Sanity knowledge base at `~/Projects/astro-brain/`.

At session start:
1. Read `~/Projects/astro-brain/CLAUDE.md` for wiki conventions and workflows
2. Read `~/Projects/astro-brain/index.md` to find relevant wiki pages
3. Read 3–5 wiki pages relevant to the current task before writing any code
4. Pay attention to `wiki/decisions/` for locked architectural commitments and `wiki/questions/` for known open items

At session end:
- Produce a session summary per the vault's Session Summary workflow
- Write it to `~/Projects/astro-brain/raw/sessions/YYYY-MM-DD-short-title.md`
- Do not ingest it — Connor will run the ingest from a vault session

---

## Deployment model (Path B — Direct Upload via GitHub Actions)

**One template repo → one workflow → N client sites on Cloudflare Pages, each in the client's CF account.** Direct Upload (not Git-connected) sidesteps CF's per-repo-per-account constraint that blocks the naive "Git-integrate this repo to every client's CF account" pattern.

Branch model:
- **`main`** — demo canary. Every push deploys only to `cnw-photo-demo.pages.dev`. Iterate freely here.
- **`production`** — client fan-out. Merging `main → production` triggers the workflow's matrix to deploy to every client in parallel.

Workflow file: [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)

**Before touching the workflow, a GitHub Environment secret, or the client matrix**, read:

1. [`docs/client-setup-guide.md`](./docs/client-setup-guide.md) — Phase 2 covers the Direct Upload workflow setup end to end (CF API token, GH Environment creation, matrix entry).
2. [`docs/update-and-maintenance-guide.md`](./docs/update-and-maintenance-guide.md) — branch promotion, adding/removing clients, monitoring.
3. [`docs/emergency-playbook.md`](./docs/emergency-playbook.md) — field manual for every break scenario, rollback commands, dataset restore, credential rotation.

## In-progress / recently completed

- **Page builder rewrite** — merged into `main` via `3486335`. Archive tags exist: `archive/page-builder-rewrite` (commit `cd23ec5` = Phase 13 completion) and `archive/about-page-builder` (commit `7d5c740` = spec). The rewrite branches have been deleted locally and on origin.
- **SEO audit fixes** — landed on `main` in 4 commits (`9530ba7` redirects, `fde2c7d` viewport, `11a4485` FAQ flatten, `7c3ef3e` resolveLink self-origin strip). Demo site verified post-deploy.
- **Studio config env-driven** — `studio/sanity.config.js` and `studio/sanity.cli.js` read title/allowOrigins/appId from env. Per-client deploys are now pure `.env` swaps.
- **Path B deploy workflow** — `.github/workflows/deploy.yml` with demo canary + production branch gate + smoke tests. First client (Coola Creative) onboarding in progress.

The Sanity production dataset for the demo project (`hx5xgigp`) is backed up at `~/sanity-backup-2026-04-11.tar.gz` for restore via `npx sanity dataset import`. Snapshot each client's dataset before any destructive operation.

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

## Local vs Hosted Studio — Two Studios, Different Purposes

There are effectively **two Sanity Studios** running against the same dataset,
and they have different jobs. Keeping them straight is the #1 source of
confusion when editing content or debugging Presentation.

| Studio | URL | Started by | Iframes | Purpose |
|---|---|---|---|---|
| **Local** | `localhost:3333` | `cd studio && npm run dev` | whatever `studio/.env` says (usually `localhost:4321`) | Code development — test unpushed Astro changes in Presentation before deploying |
| **Hosted** | `<project>.sanity.studio` | `cd studio && npm run deploy` | whatever `studio/.env` held at *deploy time* (baked in) | Client-facing content editing — points at the deployed Cloudflare site |

### Key rules

1. **`studio/.env` is for local Studio only.** It's gitignored. `SANITY_STUDIO_PREVIEW_URL` inside it controls which origin local Studio's iframe loads.
2. **Hosted Studio is built once per deploy.** Its preview URL is baked in from `studio/.env` at the moment `npm run deploy` runs. Editing `.env` afterwards does **not** change what the hosted Studio points at.
3. **Before running `npm run deploy`, flip `.env` to the production URL:**
   ```env
   SANITY_STUDIO_PREVIEW_URL=https://cnw-photo-demo.pages.dev
   ```
   Otherwise the hosted Studio will try to load `localhost:4321` from whoever's using it, which won't work.
4. **After `npm run deploy`, flip `.env` back to `http://localhost:4321`** so local Studio keeps iframing local Astro for continued dev.
5. **`presentationTool.allowOrigins`** in `sanity.config.js` must list every origin either Studio might iframe — local + all deployed domains. If you see "Blocked preview URL" warnings, add the origin there.

### Deploying Astro vs deploying Studio

These are **separate** deploy steps:
- **Astro** auto-deploys on `git push` via Cloudflare Pages. No manual step.
- **Sanity Studio** is deployed manually per-client via `cd studio && npm run deploy`. Only re-run when Studio code/schema/config changes — not needed for content edits.

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
