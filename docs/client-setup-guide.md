# Client Site Setup Guide
## Deploying a New Photography Portfolio to Cloudflare Pages

This guide covers everything needed to launch a new client site from scratch —
from Sanity to Cloudflare to live domain. Follow the steps in order.

---

## New Client Quick Checklist

Fast-path summary of the full guide below. Follow in order; detail for each step
is in the linked phase.

- [ ] **Sanity project created** — new project, `production` dataset ([Phase 1.1](#phase-1--sanity-cms))
- [ ] **`studio/.env` set to client values** — project ID, dataset, host, **prod preview URL** ([Phase 1.2](#phase-1--sanity-cms))
- [ ] **`sanity.config.js` updated** — `title` and `presentationTool.allowOrigins` (localhost + prod domain) ([Phase 1.2](#phase-1--sanity-cms))
- [ ] **Studio deployed** — `cd studio && npm run deploy` (bakes preview URL at build time) ([Phase 1.2](#phase-1--sanity-cms))
- [ ] **API read token created** ([Phase 1.3](#phase-1--sanity-cms))
- [ ] **Preview secret generated** ([Phase 1.4](#phase-1--sanity-cms))
- [ ] **CORS origins added** — localhost, `*.pages.dev`, client domain ([Phase 1.5](#phase-1--sanity-cms))
- [ ] **Dataset seeded** — `cd studio && npm run seed` populates template content ([Phase 1.6](#phase-1--sanity-cms))
- [ ] **Cloudflare Pages project connected** — care plan vs one-time path ([Phase 2](#phase-2--cloudflare-pages))
- [ ] **Cloudflare env vars set** — project ID, dataset, token, preview secret, studio URL ([Phase 2](#phase-2--cloudflare-pages))
- [ ] **Custom domain wired + DNS propagated** ([Phase 3](#phase-3--domain-setup))
- [ ] **`SANITY_STUDIO_PREVIEW_URL` flipped to custom domain** — re-run `npm run deploy` ([Phase 3.3](#phase-3--domain-setup))
- [ ] **Web3Forms contact key added** ([Phase 4](#phase-4--contact-form-web3forms))
- [ ] **Client content added** — photos, copy, palette, nav, SEO ([Phase 5](#phase-5--initial-content-setup))
- [ ] **Pre-launch checklist passed** — SEO, favicons, analytics, forms ([Phase 6](#phase-6--pre-launch-checklist))
- [ ] **`studio/.env` flipped back to `http://localhost:4321`** — so your local dev keeps working

> **Critical rule:** `SANITY_STUDIO_PREVIEW_URL` in `studio/.env` is baked into the hosted Studio at build time. Before every `npm run deploy`, make sure it's set to the **client's production URL** (not your localhost). After deploying, flip it back to `http://localhost:4321` so your local Studio continues iframing your local Astro dev. See `CLAUDE.md` → "Local vs Hosted Studio" for the full explanation.

---

## Business Model Overview

There are two client tiers. Choose before starting setup.

### Care Plan (Yearly)
- Client's Cloudflare Pages connects to **your private GitHub repo** via a
  GitHub Action you control
- Every push you make to `main` redeploys their site automatically
- If they cancel: you fork the code to their GitHub account, they reconnect
  their CF project to their own fork, and you remove them from the Action
- They keep a fully working site and own the code — they just stop receiving
  updates from you

### One-Time Setup
- At launch you fork the template to **their own GitHub account** as a private repo
- They connect their CF Pages to that fork directly
- You do the initial setup and Sanity configuration, then hand it off
- They own and maintain it from day one
- No ongoing deploys from your side

**The pitch to clients:** Either way, they own the code outright. Care plan
clients pay for ongoing improvements and new features — not for access to what
they already have.

---

## Architecture

```
Your private GitHub repo (template)
    │
    └── GitHub Action (on push to main)
            ├── deploy → client-smith CF account    (care plan)
            ├── deploy → client-jones CF account    (care plan)
            └── (client-williams left — forked to their GitHub, removed from Action)

client-williams/photo-portfolio (their fork)
    └── their CF Pages project (self-managed)       (one-time / churned)
```

---

## One-Time Template Prep (Do This Once)

These are already done in the current repo. Listed here for reference.

- `src/lib/sanity.js` reads `PUBLIC_SANITY_PROJECT_ID` and
  `PUBLIC_SANITY_DATASET` from environment variables — no hardcoded IDs
- Adapter is `@astrojs/cloudflare` (v12, compatible with Astro 5)
- `.env.example` documents all required variables

---

## Setting Up the GitHub Action

This is a one-time setup in your private repo. It deploys to every care plan
client's Cloudflare account on every push to `main`.

**Create `.github/workflows/deploy-clients.yml`:**

```yaml
name: Deploy to all care plan clients

on:
  push:
    branches: [main]
  workflow_dispatch:  # allows manual trigger from GitHub Actions UI

jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        client:
          - name: smith
            account_id_secret: CF_ACCOUNT_ID_SMITH
            api_token_secret:  CF_API_TOKEN_SMITH
            project_name:      smith-photography
            sanity_project_id: abc123xy
            sanity_dataset:    production
          - name: jones
            account_id_secret: CF_ACCOUNT_ID_JONES
            api_token_secret:  CF_API_TOKEN_JONES
            project_name:      jones-photography
            sanity_project_id: def456ab
            sanity_dataset:    production
      fail-fast: false  # if one client fails, others still deploy

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Build for ${{ matrix.client.name }}
        env:
          PUBLIC_SANITY_PROJECT_ID: ${{ matrix.client.sanity_project_id }}
          PUBLIC_SANITY_DATASET:    ${{ matrix.client.sanity_dataset }}
          SANITY_API_READ_TOKEN:    ${{ secrets[matrix.client.api_token_secret] }}
          SANITY_PREVIEW_SECRET:    ${{ secrets[format('SANITY_PREVIEW_SECRET_{0}', matrix.client.name)] }}
          SANITY_STUDIO_PREVIEW_URL: ${{ secrets[format('SITE_URL_{0}', matrix.client.name)] }}
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken:   ${{ secrets[matrix.client.api_token_secret] }}
          accountId:  ${{ secrets[matrix.client.account_id_secret] }}
          command: pages deploy dist --project-name=${{ matrix.client.project_name }}
```

**Add GitHub secrets for each client** (Settings → Secrets → Actions):

| Secret name | Value |
|---|---|
| `CF_ACCOUNT_ID_SMITH` | Client's Cloudflare Account ID |
| `CF_API_TOKEN_SMITH` | Client's CF API token (see below) |
| `SANITY_API_READ_TOKEN_SMITH` | Client's Sanity read token |
| `SANITY_PREVIEW_SECRET_SMITH` | Generated preview secret |
| `SITE_URL_SMITH` | `https://smithphotography.com` |

Repeat for each care plan client with their name suffix.

**Getting the client's Cloudflare API token:**
1. Log in to the client's Cloudflare account
2. Profile → API Tokens → Create Token
3. Use the **Edit Cloudflare Pages** template
4. Copy the token — store it in your password manager and add as a GitHub secret

---

## Per-Client Setup — Complete Launch Checklist

### PHASE 1 — Sanity (CMS)

**1.1 — Create a new Sanity project**

1. Go to [sanity.io/manage](https://sanity.io/manage)
2. Click **Create new project**
3. Name it: `Smith Photography`
4. Dataset: `production` (created by default)
5. Copy the **Project ID** from the project dashboard

**1.2 — Deploy the Sanity Studio**

Each client needs their own Studio pointed at their own Sanity project, and
its Presentation preview must be wired to their live Cloudflare URL so the
"visual editing" iframe loads the actual deployed site.

1. Create `studio/.env` locally with the client's values (this file is
   gitignored — don't commit):
   ```env
   SANITY_STUDIO_PROJECT_ID=<clientProjectId>
   SANITY_STUDIO_DATASET=production
   SANITY_STUDIO_HOST=smith-photography
   SANITY_STUDIO_PREVIEW_URL=https://smithphotography.com
   ```
   - `SANITY_STUDIO_HOST` picks the `<host>.sanity.studio` subdomain —
     must be globally unique across all Sanity Studios.
   - `SANITY_STUDIO_PREVIEW_URL` is the Astro site origin that
     Presentation mode will load in its iframe. Use the `*.pages.dev`
     URL until the custom domain is connected, then switch to the
     custom domain.
2. Update `studio/sanity.config.js`:
   - `title` to the client's brand name.
   - `presentationTool.allowOrigins` array to the client's domains. Presentation
     blocks navigation to any origin not in this list, so it must include every
     URL the iframe will ever load — typically `http://localhost:4321` (for
     local dev), the `*.pages.dev` preview URL, and the final custom domain.
     Example:
     ```js
     presentationTool({
       allowOrigins: [
         'http://localhost:4321',
         'https://smith-photography.pages.dev',
         'https://smithphotography.com',
       ],
       // ...previewUrl config
     }),
     ```
3. Deploy:
   ```sh
   cd studio
   npm run deploy
   ```
   All `npm run` scripts auto-load `studio/.env` via `dotenv-cli`, so the
   env vars above are baked into the build automatically. No shell exports
   needed.
4. Studio URL will be: `https://smith-photography.sanity.studio`
5. Share with the client

> **Heads up:** If you change `SANITY_STUDIO_PREVIEW_URL` later (e.g., switch
> from `*.pages.dev` to the final domain), you must re-run `npm run deploy`
> to rebuild and push the updated value. It's a build-time bundled value, not
> runtime.

> After deploying, revert `studio/sanity.config.js` `title` to template
> values. Do not commit client-specific env values — they live in
> `studio/.env` which is gitignored.

**1.3 — Create a Sanity API Read Token**

1. Sanity manage → the client's project → **API → Tokens**
2. Add API Token — Name: `Cloudflare`, Permissions: **Viewer**
3. Copy the token immediately (only shown once)

**1.4 — Generate a Preview Secret**

```sh
openssl rand -hex 32
```

**1.5 — Add CORS origins**

Sanity manage → **API → CORS Origins** (check "Allow credentials" on all):
- `http://localhost:4321`
- `https://*.pages.dev`
- `https://clientdomain.com`
- `https://www.clientdomain.com`

**1.6 — Seed the dataset with starter content**

New Sanity projects start empty. Run the seed script to populate the client's
dataset with the full template content: siteSettings, nav, footer, homepage,
about/experience/contact pages, and all the seeded sections with the correct
background tones, text alignment, and layout variants that match the template
design out of the box.

1. In `studio/sanity.config.js`, confirm `projectId` is still set to the
   client's project (from step 1.2)
2. Run the seed:
   ```sh
   cd studio
   npm run seed
   ```
3. The script creates documents non-destructively — it skips any doc ID that
   already exists. If you need to reset the dataset to template defaults at
   any point, use `npm run seed:replace` (overwrites existing docs).
4. Open the client's Studio and confirm you see populated homepage, about,
   experience, contact pages with all sections in the correct order.
5. Revert `studio/sanity.config.js` back to template values so client-specific
   IDs don't get committed.

> **What's in the seed:** 5 default palettes (Classic Cream, Warm Studio, Dark
> Editorial, Cool Minimal, Forest Sage), site settings pointing at the default
> palette, nav links, footer links, homepage with hero + 6 content sections,
> About page (intro, what-to-expect, personal, quote, CTA), Experience page
> (hero, intro, sessions, artwork, next steps, FAQ), Contact page (hero, form),
> 404 page, plus default blog and portfolio categories. All sections are
> pre-configured with the correct `backgroundTone` (alt/default) and
> `textAlignment` so the out-of-box look matches the template demo.

---

### PHASE 2 — Cloudflare Pages

#### For Care Plan Clients

**2.1 — Create a Pages project via Direct Upload (not Git)**

Since the Action uploads the built files directly, the CF Pages project does
not need to connect to GitHub.

1. Log in to the **client's** Cloudflare account
2. Workers & Pages → Create application → Pages → **Direct Upload**
3. Name the project: `smith-photography`
4. Upload any placeholder file for now (you'll deploy the real build via Action)
5. Note the Account ID from the URL or Profile page

**2.2 — Add GitHub secrets**

In your private GitHub repo → Settings → Secrets → Actions, add:
- `CF_ACCOUNT_ID_SMITH`
- `CF_API_TOKEN_SMITH`
- `SANITY_API_READ_TOKEN_SMITH`
- `SANITY_PREVIEW_SECRET_SMITH`
- `SITE_URL_SMITH`

**2.3 — Add client to the GitHub Action matrix**

Edit `.github/workflows/deploy-clients.yml` and add the client entry under
`matrix.client`. Commit and push to `main` — this triggers the first real
deploy.

#### For One-Time Clients

**2.1 — Fork the template to their GitHub account**

1. Create a GitHub account for the client (or use theirs)
2. Fork your private template repo into their account as a private repo
   ```sh
   # Or use GitHub UI: your repo → Fork → their account
   ```
3. The fork captures the code at this exact point in time

**2.2 — Create a Pages project via Git connection**

1. Log in to the **client's** Cloudflare account
2. Workers & Pages → Create application → Pages → **Connect to Git**
3. Authorize GitHub and select their forked repo
4. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Add environment variables (see Phase 2.3 below)
6. Deploy

**2.3 — Set environment variables** (both tiers)

In the CF Pages project → Settings → Environment Variables → Production:

| Variable | Value |
|---|---|
| `PUBLIC_SANITY_PROJECT_ID` | Client's Sanity project ID |
| `PUBLIC_SANITY_DATASET` | `production` |
| `SANITY_API_READ_TOKEN` | Viewer token from Phase 1.3 — required for preview mode to validate Presentation's ephemeral secret |
| `SANITY_PREVIEW_SECRET` | Secret from Phase 1.4 |
| `SANITY_STUDIO_URL` | `https://<client-slug>.sanity.studio` — tells the Astro site which Studio origin can iframe it (enables click-to-edit overlays via stega) |

> For care plan clients on the Action deploy, env vars are set in GitHub
> Secrets and injected at build time — you don't set them in CF directly.

> **Important:** `SANITY_API_READ_TOKEN` must be set, or Sanity Presentation
> mode will not activate — clicking edit overlays in Studio won't work,
> drafts won't render, and images referenced from unpublished docs won't
> load. If the client complains "Studio preview shows nothing" or "I can't
> edit from the preview", check this env var first.

> After setting env vars, trigger a redeploy in CF Pages (Deployments →
> latest → Retry deployment) so the new values bake into the bundle.

---

### PHASE 3 — Domain Setup

**3.1 — Add domain to Cloudflare (if not already there)**

1. Client's Cloudflare account → Add a site → enter domain
2. Choose Free plan
3. Cloudflare scans existing DNS — review and confirm
4. Give client the two Cloudflare nameservers
5. Client updates nameservers at their registrar (GoDaddy, Namecheap, etc.)
6. Propagation: 15 minutes to 2 hours

**3.2 — Connect custom domain to Pages**

1. Pages project → **Custom Domains → Set up a custom domain**
2. Enter `smithphotography.com`
3. Cloudflare adds the CNAME automatically
4. Repeat for `www` — Cloudflare redirects www → root
5. SSL certificates provision automatically (5–15 minutes)

**3.3 — Update CORS and env vars with live domain**

1. Sanity CORS — confirm live domain is listed (Phase 1.5)
2. Update `SANITY_STUDIO_PREVIEW_URL` to the live domain
3. Redeploy (push a commit or re-run the Action)

---

### PHASE 4 — Contact Form (Web3Forms)

**4.1 — Create account using client's email**

1. Go to [web3forms.com](https://web3forms.com)
2. Enter the **client's** email — submissions land directly in their inbox
3. Verify via the email link
4. Copy the **Access Key**

**4.2 — Enter key in Sanity**

1. Open the client's Sanity Studio
2. Site Settings → Contact Page (or wherever the form settings live)
3. Paste the Access Key → Publish

**4.3 — Test**

Submit a test message on the live contact page and confirm delivery.

---

### PHASE 5 — Initial Content Setup

The seed script (Phase 1.6) already populated everything with template defaults.
This phase is where you (or the client) replace the placeholder content with
real copy and images.

**Site Settings**
- [ ] Site Name, Photographer Name, Logo (text or image upload), Favicon
- [ ] **Default Palette** — pick one of the 5 built-in palettes from the
      dropdown (Classic Cream, Warm Studio, Dark Editorial, Cool Minimal,
      Forest Sage). This applies site-wide to every page and section. You
      can also edit the hex values of any palette in the Palettes array to
      create a fully custom color scheme.
- [ ] **Font Theme** — pick one of the 6 typography pairings
- [ ] **Accent Color Override** — optional single-color tweak without changing the palette

**Navigation & Footer**
- [ ] Nav Settings — links, variant (classic/centered/split/transparent), dropdown children
- [ ] Footer Settings — free-form links, optional middle column HTML embed, legal links
- [ ] Social Settings — Instagram, Facebook, YouTube, TikTok
- [ ] SEO Settings — site URL (must include `https://`), business phone, city/state, Twitter handle

**Pages** (all sections have a `Background Tone` field: Light / Alt / Dark)
- [ ] Homepage — hero images, customize welcome/testimonials/featured/steps/CTA/FAQ sections
- [ ] About page — intro copy, headshot, what-to-expect columns, personal split, quote, CTA images
- [ ] Experience page — hero, sessions, artwork, next-steps CTA, FAQs
- [ ] Contact page — hero, info heading/body, Web3Forms key
- [ ] 404 page — background image, heading, CTA
- [ ] Portfolio index — upload portfolio images, assign categories
- [ ] Blog index — enable/disable, optional page title + SEO

**Creating new pages** — editors can add custom pages via the "Pages" list in
Studio. Each new page gets the full section library (17 section types) to pick
from. Reserved slugs (`blog`, `portfolio`, `api`, etc.) are rejected by the
slug validator.

**Content**
- [ ] 3–5 testimonials
- [ ] Portfolio images uploaded (with categories assigned)
- [ ] Blog categories + portfolio categories added if custom ones needed
- [ ] First blog post drafted (optional)

> **Palette tip:** If the client wants a custom color scheme, edit the hex
> values of a palette in the Palettes array (e.g., rename "Classic Cream" to
> their brand name and change the hex values). No code changes needed — all
> sections consume palette tokens as CSS variables.

> **Background tone tip:** Every section has a `Background Tone` field with
> three options. "Default" uses the palette's main background. "Alt" uses the
> slightly darker variant (good for visual separation between adjacent
> sections). "Dark" uses the full dark section color with light text (good
> for dramatic breaks). The seed ships with several sections pre-configured
> to `alt` tone for visual rhythm out of the box.

---

### PHASE 6 — Pre-Launch Checklist

- [ ] Site loads on `https://clientdomain.com` with valid SSL
- [ ] `www` redirects correctly
- [ ] Contact form delivers email to client's inbox
- [ ] All nav links work
- [ ] Portfolio images load
- [ ] Mobile layout correct (test on real device)
- [ ] Google Search Console — add property, submit sitemap:
      `https://clientdomain.com/sitemap.xml`
- [ ] Verify `robots.txt` and `manifest.json` are accessible
- [ ] Share Studio URL with client, walk them through editing

---

## Off-boarding a Care Plan Client

When a care plan client cancels:

1. **Fork the repo** to their GitHub account at its current state
2. In their CF Pages project → Settings → switch from Direct Upload to Git,
   connect to their new fork (or create a new Pages project from the fork)
3. **Remove them from the GitHub Action** — delete their entry from the
   `matrix.client` list and push
4. **Remove their GitHub Secrets** from your repo
5. Confirm their site is still live and building from their own fork
6. Hand off:
   - Their GitHub repo URL
   - Their Sanity Studio URL
   - Their Web3Forms login
   - A note that future CF deployments come from their own repo now

Their site stays up indefinitely. They own everything. They just won't receive
future updates from your template unless they choose to pull them manually.

---

## Quick Reference — Per-Client Record

Keep this in your password manager for each client:

| Item | Where to find it |
|---|---|
| Sanity Project ID | sanity.io/manage |
| Sanity Read Token | sanity.io/manage → API → Tokens |
| Preview Secret | Generated with `openssl rand -hex 32` |
| CF Account ID | Cloudflare dashboard URL or Profile |
| CF API Token | Cloudflare → Profile → API Tokens |
| Web3Forms Key | web3forms.com dashboard |
| Studio URL | Shown after `npm run deploy` in `studio/` |
| Tier | Care Plan / One-Time |
| Start date | For renewal reminders |
