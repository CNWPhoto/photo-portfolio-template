# Client Site Setup Guide
## Deploying a New Photography Portfolio to Cloudflare Workers

This guide covers everything needed to launch a new client site from scratch —
from Sanity to Cloudflare to live domain. Follow the steps in order.

---

## New Client Quick Checklist

Fast-path summary of the full guide below. Follow in order; detail for each step
is in the linked phase.

- [ ] **Pre-session (client does async before kickoff call):**
  - Signs up at [sanity.io/manage](https://sanity.io/manage) with their inbox email and creates a new organization named after their business (e.g. "Smith Photography"). Sends you the organization name so you can create the project in it during the kickoff call ([Phase 1.0](#phase-1--sanity-cms)). This is required for ToS compliance and clean billing — the client's project must live in the client's organization, not yours.
  - Signs up at [web3forms.com](https://web3forms.com) with their inbox email and sends you the access key ([Phase 4](#phase-4--contact-form-web3forms)). Do this **before** the setup session — Web3Forms' verification email has a ~90-second click window and you don't want to hit it mid-call.
- [ ] **Client invites you to their Sanity organization as Administrator** ([Phase 1.0](#phase-1--sanity-cms))
- [ ] **Sanity project created in client's organization** — new project, `production` dataset ([Phase 1.1](#phase-1--sanity-cms))
- [ ] **`studio/.env` set to client values** — project ID, dataset, host, **prod preview URL** ([Phase 1.2](#phase-1--sanity-cms))
- [ ] **`sanity.config.js` updated** — `title` and `presentationTool.allowOrigins` (localhost + prod domain) ([Phase 1.2](#phase-1--sanity-cms))
- [ ] **Studio deployed** — `cd studio && npm run deploy` (bakes preview URL at build time) ([Phase 1.2](#phase-1--sanity-cms))
- [ ] **API read token created** ([Phase 1.3](#phase-1--sanity-cms))
- [ ] **Preview secret generated** ([Phase 1.4](#phase-1--sanity-cms))
- [ ] **CORS origins added** — localhost, `*.pages.dev`, client domain ([Phase 1.5](#phase-1--sanity-cms))
- [ ] **Dataset seeded** — `cd studio && npm run seed` populates template content ([Phase 1.6](#phase-1--sanity-cms))
- [ ] **AI Assist instructions seeded** — `npm run seed:ai-instructions` pre-populates sparkle prompts ([Phase 1.7](#phase-1--sanity-cms))
- [ ] **Cloudflare admin access granted** — client invites you as Super Administrator on her CF account ([Phase 2.1](#phase-2--cloudflare-workers-deploy-via-github-actions))
- [ ] **CF API token generated** — "Edit Cloudflare Workers" template scoped to client's account ([Phase 2.2](#phase-2--cloudflare-workers-deploy-via-github-actions))
- [ ] **Matrix entry added to `.github/workflows/deploy.yml`** ([Phase 2.3](#phase-2--cloudflare-workers-deploy-via-github-actions))
- [ ] **GH Environment `client-<slug>` created with 4 secrets** ([Phase 2.4](#phase-2--cloudflare-workers-deploy-via-github-actions))
- [ ] **First single-client deploy via `workflow_dispatch only_client=<slug>` (Worker created, secrets pushed, smoke passed)** ([Phase 2.5](#phase-2--cloudflare-workers-deploy-via-github-actions))
- [ ] **Custom domain attached to Worker** (apex + www if applicable) ([Phase 3](#phase-3--domain-setup))
- [ ] **`seoSettings.siteUrl` set in Studio to canonical host** — drives canonical tag, sitemap, JSON-LD ([Phase 3.3](#phase-3--domain-setup))
- [ ] **`SANITY_STUDIO_PREVIEW_URL` flipped to canonical host** — re-run `npm run deploy` ([Phase 3.4](#phase-3--domain-setup))
- [ ] **Web3Forms contact key added** ([Phase 4](#phase-4--contact-form-web3forms))
- [ ] **Client content added** — photos, copy, palette, nav, SEO ([Phase 5](#phase-5--initial-content-setup))
- [ ] **Pre-launch checklist passed** — SEO, favicons, analytics, forms ([Phase 6](#phase-6--pre-launch-checklist))
- [ ] **`studio/.env` flipped back to `http://localhost:4321`** — so your local dev keeps working

> **Critical rule:** `SANITY_STUDIO_PREVIEW_URL` in `studio/.env` is baked into the hosted Studio at build time. Before every `npm run deploy`, make sure it's set to the **client's production URL** (not your localhost). After deploying, flip it back to `http://localhost:4321` so your local Studio continues iframing your local Astro dev. See `CLAUDE.md` → "Local vs Hosted Studio" for the full explanation.

---

## Deployment Model

> **Applies equally to niche demo sites.** When you spin up an internal demo (e.g. `family-demo`, `wedding-demo`), follow the same phases — the only difference is that the "client's Cloudflare account" and "client's Sanity org" are both your own accounts, so the "admin invite" and "account switching" steps are no-ops. **Every other step still applies.**

**One template repo, many Cloudflare Workers — one GitHub Actions workflow deploys to all of them.**

This is the default model for all clients. Cloudflare's GitHub Git integration is single-account, so a "connect via Git" approach can't serve multiple clients whose accounts differ. Cloudflare's own recommendation for multi-account: use the Wrangler CLI from GitHub Actions with a per-account API token. That's what this workflow does.

### How it works

- The template lives in your private GitHub repo (`photo-portfolio-template`). **One repo, shared by every client.** No forking.
- Each client gets their own **Sanity project**, created in *their* Sanity organization (the client is the owner / Admin; you're invited as Administrator for support). Sanity ToS-compliant and clean billing.
- Each client gets their own **Cloudflare Worker** (`<client-slug>`), deployed via `wrangler deploy` from GitHub Actions into *their* Cloudflare account. Astro 6 + `@astrojs/cloudflare` v13 emits the Worker entry + static-asset bundle; `wrangler` uploads both. Runtime secrets are pushed as Worker secrets by the same workflow (no separate CF-dashboard env-var step).
- You're invited as Super Administrator on the client's CF account (for support / domain attach), or she generates the scoped CF API token herself.
- **Branch promotion model**:
  - Push to `main` → deploys only to the demo Worker (canary).
  - Merge `main → production` and push → matrix fans out to every client Worker in parallel.
  - `workflow_dispatch` with `only_client=<slug>` → deploys exactly one client (staged cutover / per-client redeploy without a fan-out).
- Her **domain** is attached as a Worker Custom Domain (Phase 3) — Cloudflare auto-manages DNS + cert.
- Her **Studio** is deployed to `<clientslug>.sanity.studio` via `npm run deploy` from your terminal, baked with her values from `studio/.env`.

### Release flow at a glance

```
# iterate
git push origin main                  → Demo Worker rebuilds + smoke test
# verify demo
git checkout production
git merge main
git push origin production            → Demo + every client Worker rebuild in parallel
# one-off redeploy of a single client
gh workflow run deploy.yml --ref main -f only_client=<slug>
# break glass (full revert)
git revert HEAD && git push           → Workers redeploy previous good version
```

For instant per-client rollback to a previous version without a git revert, see `wrangler rollback` in `docs/emergency-playbook.md`.

### What she owns

- The Cloudflare account (billing, DNS, Worker, domain)
- The Sanity project + organization (her org; you're Admin for support)
- The Web3Forms account for contact form submissions
- Her domain and registrar

### What you own

- The template code in the private GitHub repo
- The GitHub Actions workflow and per-client environment secrets
- Administrative access to her Sanity project (for support; remove on offboarding)
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

**1.0 — Sanity organization (client creates, you join as admin)**

> **Why this matters.** Per Sanity's Spring 2025 changes ([Agencies guide](https://www.sanity.io/docs/developer-guides/agencies-navigating-the-spring-2025-organization-changes)), client projects should live in the client's own organization, not yours. This keeps billing, asset storage, and any future paid-tier upgrades on the client's side, and it's the ToS-compliant pattern. Admin role on a client's project is **not counted against any user quota** (only non-admin users count toward Sanity's free-tier user cap), so being admin on every client's project is free indefinitely.

1. **Client creates their organization** — a one-time async task before kickoff:
   - Sign up at [sanity.io/manage](https://sanity.io/manage) with the email they want as the billing/admin address.
   - Click **Create new organization** (or accept the default personal organization that's auto-created on signup and rename it).
   - Name it after their business (e.g. "Smith Photography"). No payment method needed — free tier covers everything below ~10K documents / 100K CDN requests / 5GB assets.
   - Send you the organization name (it'll appear in the org switcher dropdown).

2. **Client invites you as administrator** to their organization:
   - Their org settings → **Members** → Invite by email → role **Administrator**.
   - You accept the invite via the email link.
   - You'll now see their org in the manage.sanity.io org switcher, and any project you create there will be owned by their org.

3. **For demo niches you build for yourself** (e.g. `family-demo`, `wedding-demo`): step 1 means *you* create the org under your own Sanity account, named for the demo. The rest is identical.

**1.1 — Create a new Sanity project (in the client's organization)**

1. Go to [sanity.io/manage](https://sanity.io/manage)
2. **Switch to the client's organization** in the top-bar org switcher (this is the critical step — projects always inherit ownership from the currently-selected org)
3. Click **Create new project**
4. Name it: `Smith Photography`
5. Dataset: `production` (created by default)
6. Copy the **Project ID** from the project dashboard
7. Confirm the project's organization on the project Settings page. If it's not the client's org, transfer it now (see "Transferring an existing project" at the bottom of this phase)

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
   # AI Assist on by default during the client's free Sanity Growth trial.
   # If they opt out after the trial, remove this line and redeploy their Studio.
   SANITY_STUDIO_AI_ASSIST=true
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

**1.7 — Seed AI Assist instructions**

Pre-populates the sparkle (✨) icons in the client's Studio with starter
prompts for SEO titles, SEO descriptions, hero subheadings, section body
copy, pull quotes, FAQ answers, blog body, and testimonial polish. Without
this step, editors clicking a sparkle see an empty "Add instructions" UI
instead of ready-to-run prompts.

1. With `studio/.env` still set to the client's project (from 1.5/1.6):
   ```sh
   cd studio
   npm run seed:ai-instructions
   ```
2. The script writes 9 annotation documents (one per affected document type)
   under `sanity.assist.schemaType.<docType>` IDs. Idempotent — safe to
   re-run anytime to push prompt updates from `studio/scripts/ai-instructions/starter-prompts.js`.
3. To customize prompts for a specific client (rare), edit
   `studio/scripts/ai-instructions/starter-prompts.js` and re-run the seed
   against that client only.

> **AI Assist toggle reminder:** Sparkles appear only when
> `SANITY_STUDIO_AI_ASSIST=true` is set in the client's `studio/.env.<slug>-backup`
> AND the hosted Studio has been redeployed since. Default is ON for new
> clients (see `.env.example` and the AI Assist section of
> `docs/update-and-maintenance-guide.md`).

**1.8 — Transferring an existing project to the client's organization**

> **Use this for clients who came aboard before this guide existed and whose project is still in your organization.** New clients should follow Phase 1.0 + 1.1 above so the project is created in their org from day one — no transfer needed.

The transfer is a built-in Sanity feature, takes ~5 minutes total, and doesn't change the project's plan, schema, content, members, datasets, or deployed Studio. The only thing that changes is which organization is responsible for billing if the project ever crosses into paid-tier territory (Carla and other photography clients almost never will — typical traffic stays well within the free tier).

**Pre-transfer (the client does this once)**

1. Client signs up at [sanity.io/manage](https://sanity.io/manage) and creates an organization named after their business (Phase 1.0 step 1).
2. Client invites you as administrator on the new organization (Phase 1.0 step 2).

**You initiate the transfer**

1. Log into [sanity.io/manage](https://sanity.io/manage), select the client's project (e.g. `Coola Creative`).
2. Project **Settings** → **General** → find the **Organization** section → click change/transfer.
3. Pick the client's new organization from the dropdown.
4. Sanity prorates the current month's plan cost between the two orgs (irrelevant on free tier; fully automatic if the project is paid).
5. If you have admin role on both orgs, the transfer happens instantly. Otherwise the receiving org's billing manager (the client) approves it from their manage page.

**After the transfer**

- The project is now owned by the client's org. You remain a member at the project level with admin role — every workflow keeps working unchanged (`npm run deploy`, GitHub Actions matrix, GROQ fetches, Studio Presentation).
- The client controls billing identity. If their site ever spikes traffic and exceeds free tier, Sanity bills them, not you.
- If the client offboards in the future, you simply remove yourself from the project; they keep full ownership of their data and Studio with no extra coordination.

---

### PHASE 2 — Cloudflare Workers (deploy via GitHub Actions)

The site deploys to a Cloudflare Worker in the client's account. Astro 6 + `@astrojs/cloudflare` v13 produces a Worker (`dist/server/`) + static assets (`dist/client/`); the GitHub Actions workflow runs `wrangler secret bulk` + `wrangler deploy --name <slug>` using a scoped CF API token. (Cloudflare's GitHub Git integration is single-account, so CI + per-account API token is the recommended multi-account pattern. **Runtime secrets are pushed as Worker secrets by the workflow — there is no separate "CF dashboard env vars" step like the legacy Pages model had.**)

**2.1 — Admin access to the client's Cloudflare account**

Have the client invite you as Super Administrator so you can manage her Worker / domain from your dashboard:

1. Client → her CF account → **Manage Account → Members → Invite**
2. Your email, role: **Super Administrator - All Privileges**
3. You accept the invite, use the account switcher whenever you need to work on her site

(Super Admin is optional if she'll generate the CF API token herself and hand it to you — but it makes troubleshooting and the domain cutover much easier.)

**2.2 — Create a scoped CF API token for the workflow**

This token lets GitHub Actions deploy the Worker, push secrets, and (later) attach the custom domain.

1. In CF dashboard, **while switched to the client's account**, click your profile → **My Profile → API Tokens → Create Token**.
2. Select the template: **Edit Cloudflare Workers**. (Not "Edit Cloudflare Pages" — that's the legacy template and will fail with error code `9106` / `10000` on the first deploy.)
3. **Account Resources → Include → the client's account only** (one account).
4. **Zone Resources → Include → All zones** (this is bounded by the account scope above, so it really means "all zones in this client's account" — needed for the custom-domain attach in Phase 3).
5. Leave other settings at defaults. Continue → Create Token.
6. **Copy the entire token immediately** (shown once). Don't include surrounding whitespace — invalid/mis-pasted tokens fail with error code `9109`.

Also grab the **Account ID** from the CF dashboard URL or sidebar (32-char hex). This is the same value used for legacy Pages deploys; if the `client-<slug>` GitHub Environment already exists with `CF_ACCOUNT_ID` set, leave it as-is.

**2.3 — Add the client to the workflow matrix**

Edit `.github/workflows/deploy.yml` in the template repo. Inside the `clients` job → `strategy.matrix.client` list, add:

```yaml
- slug: <client-slug>                              # e.g. coola-creative
  sanity_project_id: <client-sanity-project-id>    # e.g. tl3zj8iz
  studio_url: https://<client-slug>.sanity.studio
```

Also add the same `slug → sanity_project_id, studio_url` mapping to the `client-one` job's `case` block in the same file (single-client dispatch path uses it). *Top-of-mind TODO:* consolidate these to a single client registry — they live in two places today.

Commit + push the change. (No `production` push needed yet — Phase 2.5 uses single-client dispatch.)

**2.4 — Create the `client-<slug>` GitHub Environment with secrets**

GitHub template repo → Settings → **Environments** → **New environment** → name it `client-<slug>` (must match the matrix entry — e.g. `client-coola-creative`).

Add these 4 **Environment secrets**:

| Secret | Value |
|---|---|
| `CF_API_TOKEN` | CF API token from 2.2 ("Edit Cloudflare Workers" scope) |
| `CF_ACCOUNT_ID` | Client's CF Account ID |
| `SANITY_API_READ_TOKEN` | Viewer token from Phase 1.3 |
| `SANITY_PREVIEW_SECRET` | Preview secret from Phase 1.4 |

Environment secrets are scoped per-client — one client's workflow run can only see its own environment's secrets. The Sanity secrets are read at deploy time and uploaded as Worker secrets by the workflow's `wrangler secret bulk` step; no separate CF-dashboard env-var step is needed.

**2.5 — Deploy the client (single-client dispatch)**

Use the staged single-client dispatch (no production fan-out — only this client deploys):

GitHub → repo → **Actions → Deploy → Run workflow** → branch `main` → **`only_client`** input → `<client-slug>` → Run.

Or via CLI:

```sh
gh workflow run deploy.yml --ref main -f only_client=<client-slug>
```

The job runs from a clean checkout:

1. Build the Astro site with the client's PUBLIC Sanity vars.
2. `wrangler secret bulk --name <slug>` — uploads `SANITY_API_READ_TOKEN`, `SANITY_PREVIEW_SECRET`, `SANITY_STUDIO_URL` as **Worker secrets** (creates the Worker on first run).
3. `wrangler deploy --name <slug>` — uploads the Worker + static assets. Cloudflare auto-provisions a `SESSION` KV namespace per Worker — no manual step.
4. Smoke test — hits the deployed `*.workers.dev` URL: 200, body > 5 KB, `<title>` present, trailing-slash 308.

Watch at `https://github.com/CNWPhoto/photo-portfolio-template/actions`. Typical run: 1–2 minutes.

**2.6 — Verify the first deploy**

The smoke step prints the deployed URL — `https://<client-slug>.<account-subdomain>.workers.dev` (the account subdomain is per-CF-account, e.g. `kelly-8f1`, `melanie-d31`). Visit it; you should see the seeded template content from Phase 1.6.

If it's blank or broken, see `docs/emergency-playbook.md`. Common first-deploy failures:

- **Secret-step error `9106` or `10000`** — Pages-scoped CF token. Re-create with the "Edit Cloudflare Workers" template (Phase 2.2).
- **Secret-step error `9109`** — invalid token (often a mis-paste with trailing whitespace, or saved blank). Recreate and re-paste cleanly.
- **Deploy succeeds, page 500s with "Preview mode is not configured"** — `SANITY_API_READ_TOKEN` wasn't in the `client-<slug>` GH Environment when the secret-bulk step ran. Fix the env secret and re-dispatch — the Worker re-uses its existing KV namespace.

**2.7 — Promote to production matrix (optional)**

Single-client dispatch is sufficient for first-deploy and per-client redeploys. To get the client into the normal `main → production` fan-out as well, just ensure the matrix entry from 2.3 is on `main` and merge `main → production` whenever you want a full-fleet redeploy (covered in `docs/update-and-maintenance-guide.md`).

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

- **Default to apex** unless the client's existing branding uses `www`. Shorter, cleaner in share links, matches how most clients think about their domain.
- Once picked, four settings have to align with the choice — see 3.3 and 3.4 below. If any of them drift, canonicals/sitemap/JSON-LD will advertise the non-canonical host, which Google treats as a soft signal to ignore the canonical.

**3.3 — Attach the custom domain(s) to the Worker**

For a **brand-new** client (Worker is the first thing on the hostname — no existing DNS records):

1. In CF dashboard (switched to client's account) → **Workers & Pages → `<client-slug>` (the Worker) → Settings → Domains & Routes → Add → Custom Domain**.
2. Enter the **canonical host first** (e.g. `smithphotography.com`). Cloudflare creates the proxied DNS record + issues the cert (~minutes).
3. Add `www.smithphotography.com` (or whichever non-canonical) the same way. By default Workers serves both directly — apply a **www↔apex Redirect Rule at the zone level** if you want one to 301 to the other (see *www-canonical redirect* in `docs/update-and-maintenance-guide.md`).
4. Verify:

   ```sh
   curl -sI https://smithphotography.com/ | head -1                  # HTTP/2 200
   curl -sI https://www.smithphotography.com/ | grep -i location     # 301 → apex (if redirect rule set)
   ```

For a **client being migrated from the legacy Pages model** (existing Pages project owns the hostname's DNS records):

The Worker "Add Custom Domain" dialog will refuse with `Hostname already has externally managed DNS records (A, CNAME, etc). Delete them first.` — Cloudflare won't silently swap them. Sequence (brief bounded downtime; pick a low-traffic moment):

1. Old Pages project → **Custom domains → remove** the hostname. This drops the Pages-managed CNAME.
2. (If a manual A/CNAME for the hostname remains in the zone's DNS → DNS → Records, note it for rollback then delete it. Pages-managed records auto-clear in step 1.)
3. Immediately add the hostname as a **Custom Domain on the Worker** — it'll accept it now (no conflict), create the record, issue the cert (~minute or two).
4. Repeat for `www` if it was also on Pages. Doing apex first keeps `www` serving via Pages during apex transition (and vice versa) — one host always available.
5. Rollback if anything's wrong before the cert activates: re-add the hostname on the old Pages project (it recreates its record) — back on the old site in minutes.
6. **Local DNS negative-cache gotcha:** your machine may continue showing NXDOMAIN for `www` for a few minutes after the move — public resolvers (1.1.1.1, 8.8.8.8) and the authoritative NS will show the truth. `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder` clears local cache.

**3.4 — Align canonical host across Sanity + Studio + Search Console**

1. **Sanity CORS** — confirm **both** hosts are listed (Phase 1.5: `https://smithphotography.com` **and** `https://www.smithphotography.com`). Redirect still requires both to be allowed during the TLS handshake window.
2. **`seoSettings.siteUrl` in Studio** — open the client's Sanity Studio → SEO Settings → set `Site URL` to the canonical host, no trailing slash (e.g. `https://smithphotography.com`). This drives:
   - `<link rel="canonical">` on every page (`src/layouts/Layout.astro`)
   - `/sitemap.xml` base URL (`src/pages/sitemap.xml.ts`)
   - `/robots.txt` sitemap line (`src/pages/robots.txt.ts`)
   - JSON-LD `@id` values for every structured-data node

   If left blank, canonicals are omitted and sitemap falls back to request origin — fine for pre-launch, **not acceptable for production**.
3. **`SANITY_STUDIO_PREVIEW_URL`** — update `studio/.env` to the canonical host, then re-run `cd studio && npm run deploy`. Baked into the hosted Studio at build time; must match the canonical host so Presentation iframes the canonical origin (not the redirect source).
4. **Redeploy the Worker** so the new `siteUrl` is baked into rendered pages. Either push any commit on `main` (re-runs the demo Worker) or `gh workflow run deploy.yml -f only_client=<client-slug>` for just that client.
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

1. **Remove yourself from their Sanity project.** With the per-client-org model (Phase 1.0), the client *already* owns their organization and project — off-boarding is just leaving as a member. Go to sanity.io/manage → their project → **Members** → find yourself → **Remove**. The client retains everything; you retain nothing.
   - **Legacy path:** if the project is still in your organization (older client, never transferred), follow Phase 1.8 (Transferring an existing project) first to move it into the client's organization, then remove yourself from the project.
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
