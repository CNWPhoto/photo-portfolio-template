# Update & Maintenance Guide
## Pushing Updates to Care Plan Clients Safely

---

## How It Works

Your private GitHub repo is the single source of truth for all care plan client sites. A single GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the site once per client (with their Sanity env vars) and uploads the result directly to their Cloudflare account via Direct Upload (not Git-connected).

```
Push to main            → Demo canary only (cnw-photo-demo.pages.dev)
                           Verify it looks right before promoting.

Push to production      → Demo canary + fan-out to every care plan client
(git merge main then      in the matrix. Each build uses per-client env vars
 push origin production)  from a scoped GitHub Environment.
```

One-time clients (not on a care plan) are unaffected — they either have their own fork or they left the platform on their last deployed state.

---

## Branch Strategy

```
main          ← Demo canary. Every push deploys only to cnw-photo-demo.
                Your iteration + QA branch. Safe to break.

production    ← Client fan-out branch. Merging main → production triggers
                deploys to every care plan client. Only merge when demo is
                confirmed healthy.

feature/*     ← Individual feature branches. Test locally, merge to main.
                (There is no CF preview URL for feature branches now that
                 deploys are Direct Upload rather than Git-connected.)
```

**Rules:**
- `main` is always the latest thing you want on the demo. Push freely.
- `production` is the gate before client sites update. Merge explicitly, deliberately.
- Never push a schema migration to `production` without dataset snapshots of affected clients first (see `docs/emergency-playbook.md` → "Dataset corrupted").
- One merge to `production` = all care plan clients update together.

---

## Day-to-Day Development Workflow

### Step 1 — Branch off main

```sh
git checkout main
git pull origin main
git checkout -b feature/new-section
```

### Step 2 — Build and test locally

```sh
./start.sh     # Astro dev server + Sanity Studio
npm run build  # catch build errors before pushing
```

### Step 3 — Merge to main → demo deploys automatically

```sh
git checkout main
git merge feature/new-section
git push origin main
```

GitHub Actions fires the `demo` job. Watch at `https://github.com/CNWPhoto/photo-portfolio-template/actions`. The workflow builds, deploys to `cnw-photo-demo.pages.dev` via Direct Upload, then runs a smoke test (200 status, non-empty body, `<title>` present). Typical run: ~90 seconds.

### Step 4 — Verify demo

Visit `https://cnw-photo-demo.pages.dev` and check:
- Homepage loads with expected content
- Navigation works
- No browser console errors
- Mobile layout at 375px and 768px

If anything looks wrong, iterate on `main` until it's clean. Clients are not affected yet.

### Step 5 — Promote to clients

```sh
git checkout production
git merge main
git push origin production
```

GH Actions re-runs the demo canary, and on its success fans out to every matrix entry in parallel. Each matrix job:
1. Checks out the code.
2. Builds with that client's env vars from `client-<slug>` Environment secrets.
3. Uploads to that client's CF Pages project via `wrangler pages deploy`.
4. Smoke-tests the deployed URL.

Clients are independent — one failure doesn't stop the others (`fail-fast: false`).

### Step 6 — Monitor

1. GH Actions run page — each matrix entry is a separate job; hover for timing.
2. If any client's smoke test fails, that client's site is still on its PREVIOUS deploy (wrangler's Direct Upload is atomic — new version or no change). Investigate via `docs/emergency-playbook.md` → "One client broken, others fine".
3. Cloudflare dashboard shows deployment history per client project if you want per-version detail.

---

## Safety Checks Before Promoting `main → production`

Run through this list before merging `main` to `production` (i.e. before clients update):

**Build**
- [ ] `npm run build` passes locally with no errors
- [ ] Tested on a Cloudflare preview URL (not just localhost)
- [ ] No hardcoded client-specific values anywhere in the code
- [ ] No `.env` file accidentally staged (`git status` before committing)

**Visual**
- [ ] Desktop layout correct
- [ ] Mobile layout correct (375px and 768px)
- [ ] All color themes still render correctly if theme-related changes were made

**Functional**
- [ ] Navigation links work
- [ ] Contact form submits
- [ ] Blog list and individual post render
- [ ] Portfolio images load
- [ ] No JavaScript console errors

**Sanity schema changes (extra care required)**
- [ ] New fields have safe `null`/`undefined` fallbacks in frontend code
- [ ] Removed fields are also removed from all GROQ queries
- [ ] Studio redeployed for all care plan clients (see below)

---

## What Is Safe vs. What Needs Care

### Safe — deploy anytime, no client content impact

- CSS and styling changes
- New components not yet wired to pages
- SEO improvements
- Performance optimizations
- Bug fixes that don't touch the Sanity schema

### Requires care — Sanity schema changes

New fields won't exist in client documents until the client publishes in their
Studio. Always write frontend code to handle missing values:

```js
// Always use fallbacks
const heading = section?.heading || 'Default Heading';
const faqs    = section?.faqs    ?? null;
```

When removing a field: remove it from GROQ queries at the same time. The data
stays in Sanity (clients can recover it) — it just stops being fetched.

When renaming a field: treat as add new + remove old. Migrate content before
removing.

### High risk — coordinate with clients first

- Changing page URL structure (slugs, routes) — breaks bookmarks and SEO
- Removing a section type a client is actively using
- Changing Sanity singleton document IDs (`siteSettings`, `homepagePage`, etc.)

---

## Deploying Sanity Studio Updates

The Studio (`studio/`) is separate from the Astro frontend and must be
redeployed manually whenever you change a schema file. Clients won't see
new fields in their CMS until you do this.

### Quick deploy script per client

Keep a small script for each care plan client so you can swap the project ID
without touching git:

```sh
# scripts/deploy-studio-smith.sh
cd studio
SANITY_STUDIO_PROJECT_ID=abc123xy npm run deploy
```

This requires `studio/sanity.config.js` to read from the env var:
```js
projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'your-template-id',
```

### Studio update workflow

1. Update schema files in `studio/schemaTypes/`
2. Test locally: `cd studio && npm run dev`
3. Run each client's deploy script
4. Commit schema changes to the main repo
5. Push to `main` — the frontend deploy follows automatically

---

## Rolling Back

Full scenarios + step-by-step recovery commands live in `docs/emergency-playbook.md`. Quick reference:

**Roll back one client (10 seconds)**:
CF dashboard → client's account → Workers & Pages → their project → Deployments → last known-good → ⋯ → **Rollback to this deployment**.

**Roll back all care plan clients (2–5 minutes, automatic)**:
```sh
git checkout production
git revert HEAD
git push origin production
# Workflow fires, clients redeploy to previous good state
```

Use `git revert` (not `git reset --hard`) — keeps history clean and avoids force-pushing. See `docs/emergency-playbook.md` for force-push and other recovery scenarios.

---

## Adding a New Care Plan Client

1. Complete the full setup in `docs/client-setup-guide.md` (Sanity + CF Pages + domain + Web3Forms).
2. Add their entry to the `matrix.client` list in `.github/workflows/deploy.yml`:
   ```yaml
   - slug: <client-slug>
     sanity_project_id: <sanity-id>
     studio_url: https://<slug>.sanity.studio
     pages_url: https://<slug>.pages.dev
   ```
3. Create GitHub Environment `client-<slug>` (Settings → Environments → New) with 4 secrets:
   - `CF_API_TOKEN` (scoped to client's CF account)
   - `CF_ACCOUNT_ID`
   - `SANITY_API_READ_TOKEN`
   - `SANITY_PREVIEW_SECRET`
4. Commit the workflow change, merge `main → production`, push — their first deploy runs alongside everyone else's.
5. Add to your uptime monitor (see Monitoring section below).

---

## Off-Boarding a Care Plan Client (They Cancel)

Their site keeps running on whatever the last deploy was. You stop deploying new updates. Everything else was always theirs.

1. **Transfer Sanity project ownership** to the client's Sanity account (sanity.io/manage → project → Members → Transfer Ownership).
2. **Remove their matrix entry** from `.github/workflows/deploy.yml`.
3. **Delete their GitHub Environment** (`client-<slug>`) — Settings → Environments → Delete. This cleans up the secrets too.
4. **Commit + push** the workflow change to `main` then promote to `production`. Future production deploys skip them.
5. **Client revokes the CF API token** that your workflow was using — their CF dashboard → My Profile → API Tokens → Delete. Immediate cut-off of your deploy access.
6. **Client removes you as Super Admin** from her CF account (optional but recommended) — her CF account → Members → remove your email.
7. **Hand off the site code**: either fork the repo and transfer the fork to her GitHub account at the last-deployed commit, OR `git archive --format=zip HEAD > client-site.zip` and email the zip. Fork is cleaner if she or her next developer uses GitHub.
8. **Confirm her site is still live** (hit the custom domain in a browser) before considering the offboard complete.

**What she owns at handoff:**
- The source code (fork or zip)
- Her Sanity project and all content
- Her Cloudflare account, Pages project, custom domain, DNS
- Her Web3Forms account
- Her domain registration

**What she doesn't get:** future template updates after the cancellation date. That's the value of the care plan — ongoing template improvements merged into her site. Everything else is already hers.

---

## Monitoring

Set up free uptime monitoring for each care plan client. You should know
before they do.

**Recommended:** [UptimeRobot](https://uptimerobot.com) — free for up to 50
monitors, checks every 5 minutes, email/Slack alerts.

**Monitor per client:**
- `https://clientdomain.com` — homepage (HTTP 200)
- `https://clientdomain.com/contact` — confirms SSR is working
- `https://clientdomain.com/sitemap.xml` — confirms last build succeeded

---

## Periodic Maintenance

### Monthly
- [ ] Check GitHub Action run history for any recurring failures
- [ ] Spot-check one care plan client's contact form is delivering email
- [ ] Review Cloudflare build minutes usage (500/month free limit)

### Quarterly (per care plan client)
- [ ] SSL certificate valid (Cloudflare auto-renews, but verify)
- [ ] Domain not expiring within 60 days — remind client if so
- [ ] Check-in: any content help needed?
- [ ] Renewal reminder if on annual plan

### Quarterly — build-pipeline sanity check

Once a quarter, confirm the build still works from a clean checkout before you need it in a hurry. Deployed sites keep running on their last build regardless of upstream drift, but the ability to *rebuild* depends on Node, npm, the pinned dependency tree, and the CF wrangler action all still playing nicely together. Catching breakage during calm waters is cheap; catching it during a client emergency isn't.

- [ ] Fresh clone or `git clean -fdx && npm ci` at the repo root. Install must succeed with no resolver errors.
- [ ] Run `npm run build` — it should complete with "Complete!" and no type errors.
- [ ] Same for the studio: `cd studio && npm ci && npm run build`.
- [ ] Trigger a demo deploy via `workflow_dispatch` on GitHub Actions. Smoke test must pass.
- [ ] Skim the CF Pages changelog ([developers.cloudflare.com/pages/changelog](https://developers.cloudflare.com/pages/changelog/)) and the Sanity changelog for breaking-change headers since last check.
- [ ] Check Node LTS status ([nodejs.org/en/about/previous-releases](https://nodejs.org/en/about/previous-releases/)). If the pinned version is within 6 months of EOL, plan a bump.

Any failure here gets fixed in a branch, tested on demo, and merged during normal work — never under pressure.

### Per major Astro or Sanity version release
- [ ] Read the migration guide for breaking changes
- [ ] Test upgrade on a feature branch, merge to `main` (demo-only deploy)
- [ ] Let the demo site bake for at least a week — spot-check pages, watch CF + Sanity error logs
- [ ] Only then merge `main → production` to roll out to all care plan clients

---

## Emergency Contacts Per Client

Keep in your password manager (1Password, etc.):

| Item | Notes |
|---|---|
| Domain registrar | Where to update nameservers if needed |
| CF Account ID + API token | For manual deploys or debugging |
| Sanity project ID + Studio URL | For CMS access |
| Web3Forms email | For form troubleshooting |
| Client name, email, phone | For coordination |
| Tier | Care Plan / One-Time |
| Go-live date | For anniversary check-ins + renewals |
| Care plan renewal date | For invoicing |
