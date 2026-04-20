# Client Site Setup Guide
## Deploying a New Photography Portfolio to Cloudflare Pages

This guide covers everything needed to launch a new client site from scratch —
from Sanity to Cloudflare to live domain. Follow the steps in order.

---

## New Client Quick Checklist

Fast-path summary of the full guide below. Follow in order; detail for each step
is in the linked phase.

- [ ] **Pre-session (client does async before kickoff call):**
  - Signs up at [web3forms.com](https://web3forms.com) with their inbox email and sends you the access key ([Phase 4](#phase-4--contact-form-web3forms)). Do this **before** the setup session — Web3Forms' verification email has a ~90-second click window and you don't want to hit it mid-call.
- [ ] **Sanity project created** — new project, `production` dataset ([Phase 1.1](#phase-1--sanity-cms))
- [ ] **`studio/.env` set to client values** — project ID, dataset, host, **prod preview URL** ([Phase 1.2](#phase-1--sanity-cms))
- [ ] **`sanity.config.js` updated** — `title` and `presentationTool.allowOrigins` (localhost + prod domain) ([Phase 1.2](#phase-1--sanity-cms))
- [ ] **Studio deployed** — `cd studio && npm run deploy` (bakes preview URL at build time) ([Phase 1.2](#phase-1--sanity-cms))
- [ ] **API read token created** ([Phase 1.3](#phase-1--sanity-cms))
- [ ] **Preview secret generated** ([Phase 1.4](#phase-1--sanity-cms))
- [ ] **CORS origins added** — localhost, `*.pages.dev`, client domain ([Phase 1.5](#phase-1--sanity-cms))
- [ ] **Dataset seeded** — `cd studio && npm run seed` populates template content ([Phase 1.6](#phase-1--sanity-cms))
- [ ] **Cloudflare admin access granted** — client invites you as Super Administrator on her CF account ([Phase 2.1](#phase-2--cloudflare-pages-direct-upload-via-github-actions))
- [ ] **Cloudflare Pages project created (Direct Upload mode)** — in her CF account, empty project ([Phase 2.2](#phase-2--cloudflare-pages-direct-upload-via-github-actions))
- [ ] **Cloudflare env vars set on Pages project** — project ID, dataset, token, preview secret, studio URL, Node version ([Phase 2.2](#phase-2--cloudflare-pages-direct-upload-via-github-actions))
- [ ] **CF API token generated** — scoped to client's account, given to workflow via GH secret ([Phase 2.3](#phase-2--cloudflare-pages-direct-upload-via-github-actions))
- [ ] **Matrix entry added to `.github/workflows/deploy.yml`** ([Phase 2.4](#phase-2--cloudflare-pages-direct-upload-via-github-actions))
- [ ] **GH Environment `client-<slug>` created with 4 secrets** ([Phase 2.5](#phase-2--cloudflare-pages-direct-upload-via-github-actions))
- [ ] **First workflow deploy triggered via `main → production` merge** ([Phase 2.6](#phase-2--cloudflare-pages-direct-upload-via-github-actions))
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

**One template repo, many Cloudflare Pages projects — one GitHub Actions workflow deploys to all of them via Direct Upload.**

This is the default model for all clients. It works around a Cloudflare Pages constraint: a single GitHub account can only Git-integrate its repos to one Cloudflare account at a time, so the "connect via Git" approach can't serve multiple clients whose Pages projects live in different Cloudflare accounts. Direct Upload via GitHub Actions sidesteps that constraint entirely while preserving the single-template-repo model.

### How it works

- The template lives in your private GitHub repo (`photo-portfolio-template`). **One repo, shared by every client.** No forking.
- Each client gets their own **Sanity project**, created in *your* Sanity account so schema updates and deploys go through you. The client is added as an **Editor** (Sanity's free tier includes 3 users per project).
- Each client gets their own **Cloudflare Pages project** (**Direct Upload mode — not Git-connected**), created in *her* Cloudflare account. You're invited as Super Administrator on her account, or you use a scoped CF API token she generated for you.
- A single GitHub Actions workflow in the template repo (`.github/workflows/deploy.yml`) builds and deploys via `wrangler pages deploy` using each client's CF API token (stored as a per-client GitHub Environment secret).
- **Branch promotion model**: pushing to `main` deploys only to the demo (canary). To push to clients, merge `main → production` and push — GH Actions fans out to every client in the matrix.
- Her **domain** lives on her Cloudflare account, wired to her Pages project via Custom Domains.
- Her **Studio** is deployed to `<clientslug>.sanity.studio` via `npm run deploy` from your terminal, baked with her values from `studio/.env`.

### Release flow at a glance

```
# iterate
git push origin main                  → Demo rebuilds + smoke test
# verify demo
git checkout production
git merge main
git push origin production            → Demo + every client rebuild in parallel
# break glass
git revert HEAD && git push           → Clients roll back automatically
```

See `docs/emergency-playbook.md` for break-glass scenarios and rollback procedures.

### What she owns

- The Cloudflare account (billing, DNS, Pages project, domain)
- The Sanity project (she's added as Editor; transfer to her on offboarding)
- The Web3Forms account for contact form submissions
- Her domain and registrar

### What you own

- The template code in the private GitHub repo
- The GitHub Actions workflow and per-client environment secrets
- Administrative access to her Sanity project (until transfer)
- A scoped CF API token in her CF account that allows the workflow to deploy

### Forking for one-off client customization

Only if a client needs custom code that must not ship to other clients. Fork the template to a dedicated repo, add a separate deploy path for that fork, and merge template updates manually. Most clients never need this — the template is fully configurable via Sanity content alone.

---

## Architecture

```
Your private GitHub repo (photo-portfolio-template — one repo)
    │
    │  push to main       → workflow: deploy to demo only
    │  push to production → workflow: deploy to demo + every client
    │
    ▼
GitHub Actions runner
    │
    ├─ builds with demo env   → wrangler pages deploy → cnw-photo-demo
    │                              (uses CF_API_TOKEN from `demo` environment)
    │
    ├─ builds with Carla env  → wrangler pages deploy → coola-creative
    │                              (uses CF_API_TOKEN from `client-coola-creative` environment,
    │                               scoped to Carla's Cloudflare account)
    │
    └─ builds with Smith env  → wrangler pages deploy → smith-photography
                                   (uses CF_API_TOKEN from `client-smith-photography` environment,
                                    scoped to Smith's Cloudflare account)
```

Each deploy step in the matrix uses per-client environment secrets, so one workflow file deploys to N Cloudflare accounts. Adding a client: one matrix entry + one new GitHub Environment with 4 secrets.

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

Each client needs their own Studio pointed at their own Sanity project, and its Presentation preview must be wired to their live Cloudflare URL so the "visual editing" iframe loads the actual deployed site.

Everything is controlled by `studio/.env`. No source edits needed — `studio/sanity.config.js` and `studio/sanity.cli.js` read every per-client value from environment variables (title, allowOrigins, preview URL, appId, studio hostname).

1. Back up your current `studio/.env` if it's pointed at another client:
   ```sh
   cp studio/.env studio/.env.<previous-client>-backup
   ```

2. Overwrite `studio/.env` with the new client's values (this file is gitignored — never commit):
   ```env
   SANITY_STUDIO_PROJECT_ID=<clientProjectId>
   SANITY_STUDIO_DATASET=production
   SANITY_STUDIO_HOST=smith-photography
   SANITY_STUDIO_TITLE=Smith Photography
   SANITY_STUDIO_PREVIEW_URL=https://smith-photography.pages.dev
   # Leave SANITY_STUDIO_APP_ID unset on the first deploy — Sanity will
   # create a new application and print the generated appId.
   ```

   - `SANITY_STUDIO_HOST` picks the `<host>.sanity.studio` subdomain — must be globally unique across all Sanity Studios.
   - `SANITY_STUDIO_TITLE` is the brand name shown in Studio's navbar.
   - `SANITY_STUDIO_PREVIEW_URL` is the Astro site origin that Presentation mode will iframe. Use the `.pages.dev` URL initially; flip to the canonical domain after Phase 3 and redeploy.

3. Deploy:
   ```sh
   cd studio
   npm run deploy
   ```

   All `npm run` scripts auto-load `studio/.env` via `dotenv-cli`. The build output will include something like:
   > `Add appId: 'a2zsj4jpbc1xb0kijfsdq595' to the deployment section in sanity.cli.js or sanity.cli.ts`

4. Paste that appId back into the client's `studio/.env` so future deploys are non-interactive:
   ```env
   SANITY_STUDIO_APP_ID=a2zsj4jpbc1xb0kijfsdq595
   ```

5. Studio is live at `https://smith-photography.sanity.studio` — share with the client.

> **Heads up:** Changing `SANITY_STUDIO_PREVIEW_URL` later (e.g. flipping from `.pages.dev` to the canonical domain) requires re-running `npm run deploy` — it's a build-time bundled value, not runtime.

> After deploying, restore your previous `.env` if you want to resume local dev against a different client:
> ```sh
> cp studio/.env.<previous-client>-backup studio/.env
> ```

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

### PHASE 2 — Cloudflare Pages (Direct Upload via GitHub Actions)

The client's CF Pages project lives in her CF account but is **not Git-connected**. Instead, the template's GitHub Actions workflow builds and uploads to it using a scoped CF API token.

**2.1 — Admin access to the client's Cloudflare account**

Have the client invite you as Super Administrator so you can manage her Pages project from your dashboard. Same as before:

1. Client → her CF account → **Manage Account → Members → Invite**
2. Your email, role: **Super Administrator - All Privileges**
3. You accept the invite, use the account switcher whenever you need to work on her site

(Super Admin is optional if she'll generate the CF API token herself and hand it to you — but it makes troubleshooting easier.)

**2.2 — Create a Cloudflare Pages project (Direct Upload mode)**

1. In your CF dashboard, **switch to the client's account** via the account picker.
2. Workers & Pages → Create application → Pages → **Upload assets**.
3. Project name: `<client-slug>` (e.g. `coola-creative` — this becomes `coola-creative.pages.dev`).
4. Don't actually upload anything yet — CF will create an empty project. The first real deploy will come from GitHub Actions in step 2.6.
5. Settings → Environment Variables → Production — add these 6 (values below):

| Variable | Value | Encryption |
|---|---|---|
| `NODE_VERSION` | `20` | Plaintext |
| `PUBLIC_SANITY_PROJECT_ID` | Client's Sanity project ID | Plaintext |
| `PUBLIC_SANITY_DATASET` | `production` | Plaintext |
| `SANITY_API_READ_TOKEN` | Viewer token from Phase 1.3 | **Encrypt** |
| `SANITY_PREVIEW_SECRET` | Secret from Phase 1.4 | **Encrypt** |
| `SANITY_STUDIO_URL` | `https://<client-slug>.sanity.studio` | Plaintext |

> `SANITY_API_READ_TOKEN` MUST be set, or Sanity Presentation mode won't activate — drafts won't render, click-to-edit overlays stay dark. Most common first-deploy failure is forgetting this.

**2.3 — Create a scoped CF API token for the workflow**

This token lets GitHub Actions push Direct Upload deploys to her account without needing Super Admin or browser login.

1. In CF dashboard, **while switched to the client's account**, click your profile → **My Profile → API Tokens → Create Token**.
2. Select the template: **Edit Cloudflare Pages — Account**.
3. Account Resources → Include → **the client's account only** (one account).
4. Leave other settings at defaults. Click Continue → Create Token.
5. Copy the token immediately (shown once). This goes into the GitHub Environment secret in step 2.5.

Also grab the **Account ID** from the CF dashboard URL or the right sidebar of the Workers & Pages overview — it's a 32-char hex string.

**2.4 — Add the client to the workflow matrix**

Edit `.github/workflows/deploy.yml` in the template repo. Inside the `clients` job → `strategy.matrix.client` list, add a new entry:

```yaml
- slug: <client-slug>                              # e.g. coola-creative
  sanity_project_id: <client-sanity-project-id>    # e.g. tl3zj8iz
  studio_url: https://<client-slug>.sanity.studio
  pages_url: https://<client-slug>.pages.dev
```

Commit the change; do NOT push to `production` yet (we'll do that after secrets are in place).

**2.5 — Create the `client-<slug>` GitHub Environment with secrets**

GitHub template repo → Settings → **Environments** → **New environment** → name it `client-<slug>` (must match the matrix entry — e.g. `client-coola-creative`).

Add these 4 **Environment secrets**:

| Secret | Value |
|---|---|
| `CF_API_TOKEN` | CF API token from 2.3 (scoped to client's account) |
| `CF_ACCOUNT_ID` | Client's CF Account ID |
| `SANITY_API_READ_TOKEN` | Viewer token from Phase 1.3 (same value as CF Pages env var) |
| `SANITY_PREVIEW_SECRET` | Preview secret from Phase 1.4 (same value as CF Pages env var) |

Environment secrets are scoped per-client — one client's workflow run can only see its own environment's secrets, never another client's.

**2.6 — Trigger the first deploy**

Now push `main → production` to fire the workflow:

```sh
git checkout production
git merge main
git push origin production
```

The workflow runs:
1. Demo canary (must succeed before clients run)
2. Fan-out to every matrix entry in parallel, including the new client
3. Smoke tests each deployed URL

Watch at `https://github.com/CNWPhoto/photo-portfolio-template/actions`. The run is typically 3–5 minutes total.

**2.7 — Verify the first deploy**

Visit `https://<client-slug>.pages.dev` — you should see the seeded template content from Phase 1.6 (homepage, about/experience/contact/404 pages with real palettes and section layouts). If it's blank or broken, see `docs/emergency-playbook.md` → "Blank page or 500 error" — almost always a missing CF Pages env var.

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

> **Do this async before the kickoff call.** Web3Forms' verification email has a ~90-second click window. Trying to complete this mid-session while switching tools is a known friction point — ask the client to do it on their own time the day before and send you the access key.

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

1. **Transfer Sanity project ownership** — sanity.io/manage → their project → Members → find yourself → **Transfer Ownership** to the client's Sanity account. They must have a Sanity account first. After transfer, remove yourself as admin.
2. **Remove their matrix entry from `.github/workflows/deploy.yml`** and delete the `client-<slug>` GitHub Environment (Settings → Environments → Delete). Commit + push. The workflow will no longer deploy to their site on future `production` pushes.
3. **Client revokes the CF API token** that you were using for deploys — their CF dashboard → My Profile → API Tokens → find the token → Delete. This immediately cuts off your deploy access.
4. **Client removes you as Super Admin** — her CF Account → Members → remove your email.
5. **Hand off the site code** — either:
   - **Fork-and-transfer**: create a fork of the template repo at the commit matching their last deploy, transfer ownership of the fork to their GitHub account.
   - **Zip-and-hand-off**: `git archive --format=zip HEAD > coola-creative-site.zip` at the matching commit, email the zip. Simpler if they don't use GitHub.
6. Hand off the credentials package (their read-only record now):
   - Their Sanity Studio URL
   - Their Web3Forms login
   - If fork was transferred: the GitHub URL; if zip was given: note that future template updates won't auto-propagate (they'd need dev help to merge updates manually).
   - A restore-from-snapshot reminder if dataset rollback ever needed: `docs/emergency-playbook.md` → "Dataset corrupted".

Their site stays up indefinitely on whatever the last deploy was. They own the domain, the code, the Sanity content, the Cloudflare account, the Web3Forms account. You retain nothing but your template repo.

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
