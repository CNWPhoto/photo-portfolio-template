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
- [ ] **Cloudflare admin access granted** — client invites you as Super Administrator on her CF account ([Phase 2.1](#phase-2--cloudflare-pages))
- [ ] **Cloudflare Pages project connected via Git** — in her CF account, pointed at your template repo ([Phase 2.2](#phase-2--cloudflare-pages))
- [ ] **Cloudflare env vars set** — project ID, dataset, token, preview secret, studio URL ([Phase 2.3](#phase-2--cloudflare-pages))
- [ ] **Canonical host picked (apex vs www) + custom domains wired + DNS propagated** ([Phase 3](#phase-3--domain-setup))
- [ ] **`seoSettings.siteUrl` set in Studio to canonical host** — drives canonical tag, sitemap, JSON-LD ([Phase 3.3](#phase-3--domain-setup))
- [ ] **`SANITY_STUDIO_PREVIEW_URL` flipped to canonical host** — re-run `npm run deploy` ([Phase 3.4](#phase-3--domain-setup))
- [ ] **Web3Forms contact key added** ([Phase 4](#phase-4--contact-form-web3forms))
- [ ] **Client content added** — photos, copy, palette, nav, SEO ([Phase 5](#phase-5--initial-content-setup))
- [ ] **Pre-launch checklist passed** — SEO, favicons, analytics, forms ([Phase 6](#phase-6--pre-launch-checklist))
- [ ] **`studio/.env` flipped back to `http://localhost:4321`** — so your local dev keeps working

> **Critical rule:** `SANITY_STUDIO_PREVIEW_URL` in `studio/.env` is baked into the hosted Studio at build time. Before every `npm run deploy`, make sure it's set to the **client's production URL** (not your localhost). After deploying, flip it back to `http://localhost:4321` so your local Studio continues iframing your local Astro dev. See `CLAUDE.md` → "Local vs Hosted Studio" for the full explanation.

---

## Deployment Model

**One template repo, many Cloudflare Pages projects — each with its own env vars.** This is the default and recommended model for all clients.

### How it works

- The template lives in your private GitHub repo (`photo-portfolio-template`). **One repo, shared by every client.** No forking.
- Each client gets their own **Sanity project**, created in *your* Sanity account so schema updates and deploys go through you. The client is added as an **Editor** (Sanity's free tier includes 3 users per project, so adding one client editor is free).
- Each client gets their own **Cloudflare Pages project**, created in *her* Cloudflare account. You're invited as **Super Administrator** on her account, so you can manage deploys from your Cloudflare dashboard via the account switcher without owning her billing.
- Her Cloudflare Pages project **connects via Git** to your template repo. When you push to `main`, Cloudflare's Git webhook triggers a rebuild of every connected project. Each one injects its own `PUBLIC_SANITY_PROJECT_ID`, `SANITY_API_READ_TOKEN`, `SANITY_STUDIO_URL`, etc. at build time, so one push deploys the latest template to every client automatically.
- Her **domain** lives on her Cloudflare account, wired to her Pages project via Custom Domains.
- Her **Studio** is deployed to `<clientslug>.sanity.studio` via `npm run deploy` from your terminal, with the `SANITY_STUDIO_*` env vars set in `studio/.env` and baked into the hosted bundle at build time.

### What she owns

- The Cloudflare account (billing, DNS, Pages project, domain)
- The Sanity project (she's added as Editor; if the engagement ever ends, you can transfer ownership in one click)
- The Web3Forms account for contact form submissions
- Her domain and registrar

### What you own

- The template code in the private GitHub repo
- The deploy workflow (via `git push` to `main`)
- Administrative access to her Sanity project and Cloudflare account (until/unless she removes you)

### When to fork the template instead

Only if a client needs custom code that shouldn't ship to other clients (a one-off feature, a unique section type, etc.). At that point, fork the template to a dedicated repo, reconnect their Cloudflare Pages project to the fork, and merge template updates manually from there on. Most clients don't need this — the template is fully configurable via Sanity content alone.

---

## Architecture

```
Your private GitHub repo (photo-portfolio-template — one repo)
    │  (push to main)
    │
    ├─ Cloudflare Pages project "coola-creative"   (in Carla's CF account)
    │    └ env: PUBLIC_SANITY_PROJECT_ID=abc123xy → coolacreative.com
    │
    ├─ Cloudflare Pages project "smith-photography"   (in Smith's CF account)
    │    └ env: PUBLIC_SANITY_PROJECT_ID=def456ab → smithphotography.com
    │
    └─ Cloudflare Pages project "cnw-photo-demo"   (in your CF account)
         └ env: PUBLIC_SANITY_PROJECT_ID=hx5xgigp → cnw-photo-demo.pages.dev
```

Each Cloudflare Pages project runs its own build with its own env vars and queries its own Sanity project — the code is identical, the data is completely isolated.

---

## Template Prep (Do This Once)

These are already done in the current repo. Listed here for reference.

- `src/lib/sanity.js` reads `PUBLIC_SANITY_PROJECT_ID` and
  `PUBLIC_SANITY_DATASET` from environment variables — no hardcoded IDs
- Adapter is `@astrojs/cloudflare` (v12, compatible with Astro 5)
- `.env.example` documents all required variables

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

Default flow: the client's Cloudflare Pages project lives in *her* Cloudflare account, connected via Git to your (unforked) template repo. You manage deploys from your terminal by pushing to `main`.

**2.1 — Get admin access to the client's Cloudflare account**

Have the client invite you as a Super Administrator so you can manage the Pages project from your own Cloudflare dashboard without owning her billing.

1. Client logs in to her Cloudflare account → **Manage Account → Members → Invite**
2. She enters your email, role: **Super Administrator - All Privileges**
3. You accept the invite from the email
4. In your Cloudflare dashboard, use the **account switcher** (top-left or in your profile menu) to select her account whenever you need to work on her site

If she ever removes you later, she retains full ownership with zero migration. Nothing you set up has to move.

**2.2 — Create a Pages project via Git connection**

1. In your Cloudflare dashboard, **switch to the client's account** via the account picker
2. Workers & Pages → Create application → Pages → **Connect to Git**
3. Authorize GitHub — use **your** GitHub account, so Cloudflare can see your private template repo
4. Select the template repo: `photo-portfolio-template`
5. Build settings:
   - Project name: `<client-slug>` (e.g., `coola-creative`)
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `dist`
6. Click **Save and Deploy** — the first deploy will fail or show a blank site because env vars aren't set yet. That's expected; move to 2.3.

**2.3 — Set environment variables**

In the CF Pages project → Settings → Environment Variables → Production:

| Variable | Value |
|---|---|
| `PUBLIC_SANITY_PROJECT_ID` | Client's Sanity project ID (from Phase 1.1) |
| `PUBLIC_SANITY_DATASET` | `production` |
| `SANITY_API_READ_TOKEN` | Viewer token from Phase 1.3 — required for preview mode to validate Presentation's ephemeral secret |
| `SANITY_PREVIEW_SECRET` | Secret from Phase 1.4 |
| `SANITY_STUDIO_URL` | `https://<client-slug>.sanity.studio` — tells the Astro site which Studio origin can iframe it (enables click-to-edit overlays via stega) |

> **Important:** `SANITY_API_READ_TOKEN` must be set, or Sanity Presentation
> mode will not activate — clicking edit overlays in Studio won't work,
> drafts won't render, and images referenced from unpublished docs won't
> load. If the client complains "Studio preview shows nothing" or "I can't
> edit from the preview", check this env var first.

> After setting env vars, trigger a redeploy in CF Pages (Deployments →
> latest → Retry deployment) so the new values bake into the bundle.

**2.4 — Verify the first deploy**

After the redeploy, visit `https://<client-slug>.pages.dev` — you should see the seeded template content from Phase 1.6 (populated homepage, about, experience, contact pages with real palettes and section layouts). If it's blank, check: (a) env vars are set, (b) the redeploy actually ran with those env vars (check the deploy log for `PUBLIC_SANITY_PROJECT_ID`), (c) the Sanity dataset is seeded (Phase 1.6).

### When to fork the template (alternative)

Only fork when a specific client needs custom code that shouldn't ship to all clients. At that point:

1. Create a new private repo by forking `photo-portfolio-template` on GitHub
2. In Cloudflare Pages → the client's project → Settings → Builds & deployments, disconnect the current Git source and reconnect to the fork
3. Future template updates for that client require manual `git merge` from the template repo into their fork

---

### PHASE 3 — Domain Setup

**3.1 — Add domain to Cloudflare (if not already there)**

1. Client's Cloudflare account → Add a site → enter domain
2. Choose Free plan
3. Cloudflare scans existing DNS — review and confirm
4. Give client the two Cloudflare nameservers
5. Client updates nameservers at their registrar (GoDaddy, Namecheap, etc.)
6. Propagation: 15 minutes to 2 hours

**3.2 — Pick the canonical host (apex vs www)**

Before wiring domains, decide which host is canonical — `smithphotography.com` (apex) or `www.smithphotography.com`. The other becomes a 301 redirect to it.

- **No SEO difference on Cloudflare Pages** — redirect is 301, flows PageRank fully.
- **Default to apex** unless the client's existing branding (logo, print material, email signature) uses `www`. Shorter, cleaner in share links, matches how most clients think about their domain.
- Once picked, four settings have to align with the choice — see 3.3 and 3.4 below. If any of them drift, canonicals/sitemap/JSON-LD will advertise the non-canonical host, which Google treats as a soft signal to ignore the canonical.

**3.3 — Connect custom domains to Pages**

1. Pages project → **Custom Domains → Set up a custom domain**
2. Enter the **canonical host first** — whichever is added first becomes canonical; the other auto-redirects to it. To flip later, remove both and re-add in the desired order.
3. Cloudflare adds the CNAME automatically.
4. Add the non-canonical host as a second custom domain — Cloudflare auto-creates a 301 redirect to the canonical.
5. SSL certificates provision automatically for both (5–15 minutes).
6. Verify redirect direction with `curl`:

   ```sh
   curl -sI https://smithphotography.com | grep -i location        # should be empty (canonical)
   curl -sI https://www.smithphotography.com | grep -i location    # should 301 → apex
   ```

   Reverse expected behavior if `www` is canonical.

**3.4 — Align canonical host across Sanity + Studio + Search Console**

1. **Sanity CORS** — confirm **both** hosts are listed (Phase 1.5: `https://smithphotography.com` **and** `https://www.smithphotography.com`). Redirect still requires both to be allowed during the TLS handshake window.
2. **`seoSettings.siteUrl` in Studio** — open the client's Sanity Studio → SEO Settings → set `Site URL` to the canonical host, no trailing slash (e.g. `https://smithphotography.com`). This drives:
   - `<link rel="canonical">` on every page (`src/layouts/Layout.astro`)
   - `/sitemap.xml` base URL (`src/pages/sitemap.xml.ts`)
   - `/robots.txt` sitemap line (`src/pages/robots.txt.ts`)
   - JSON-LD `@id` values for every structured-data node

   If left blank, canonicals are omitted and sitemap falls back to request origin — fine for pre-launch, **not acceptable for production**.
3. **`SANITY_STUDIO_PREVIEW_URL`** — update `studio/.env` to the canonical host, then re-run `cd studio && npm run deploy`. Baked into the hosted Studio at build time; must match the canonical host so Presentation iframes the canonical origin (not the redirect source).
4. **Redeploy the Astro site** so the new `siteUrl` is picked up — push a no-op commit or retry latest deployment in CF Pages.
5. **Google Search Console** (can be done at pre-launch, Phase 6) — add the canonical host as the **primary property** and submit `https://<canonical>/sitemap.xml`. Adding the non-canonical host as a second property is optional but useful for catching stray inbound links.

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

- [ ] Site loads on canonical host with valid SSL (e.g. `https://clientdomain.com`)
- [ ] Non-canonical host 301-redirects to canonical:
      `curl -sI https://www.clientdomain.com | grep -i location` → points at canonical
      (reverse if `www` is canonical)
- [ ] View-source on a live page: `<link rel="canonical">` points at the canonical
      host and matches `seoSettings.siteUrl`
- [ ] `/sitemap.xml` URLs all use the canonical host (no mix of apex + www)
- [ ] Contact form delivers email to client's inbox
- [ ] All nav links work
- [ ] Portfolio images load
- [ ] Mobile layout correct (test on real device)
- [ ] Google Search Console — add **canonical host** as primary property,
      submit sitemap: `https://<canonical>/sitemap.xml`
- [ ] Verify `robots.txt` and `manifest.json` are accessible
- [ ] Share Studio URL with client, walk them through editing

---

## Off-boarding a Client

When a client leaves (they want full ownership, you're winding down, etc.):

1. **Fork the template repo** to a new private GitHub repo that they own, capturing the code at its current state. Add them as an admin on that fork if they want to edit it directly.
2. **Reconnect their Cloudflare Pages project to the fork** — Cloudflare → their Pages project → Settings → Builds & deployments → disconnect the current Git source, reconnect to the new fork. Cloudflare keeps all env vars and custom domains intact, so no rebuild needed beyond the next push.
3. **Transfer Sanity project ownership** — Sanity → their project → Members → find yourself, click Transfer Ownership to the client. Or have them create their own Sanity account first and invite them, then transfer. Either way, you can then remove yourself as admin.
4. **Remove yourself from their Cloudflare account** — their CF Account → Members → remove your email.
5. Hand off the credentials package:
   - Their GitHub repo URL (the fork)
   - Their Sanity Studio URL
   - Their Web3Forms login
   - A note that future template updates won't auto-propagate to them — they'd need to manually `git merge` from your template if they want new features

Their site stays up indefinitely. They own the domain, the code, the Sanity content, the Cloudflare account, the Web3Forms account. You retain nothing but your template repo (which continues serving other clients).

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
| Start date | For renewal reminders |
| Fork? | `No` if using the default template repo; fork URL if the client has custom code |
