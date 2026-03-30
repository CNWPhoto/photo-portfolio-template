# Update & Maintenance Guide
## Pushing Updates to Care Plan Clients Safely

---

## How It Works

Your private GitHub repo is the single source of truth for all care plan
client sites. When you push to `main`, a GitHub Action builds the site once
per client (with their Sanity env vars) and uploads the result directly to
their Cloudflare account via the CF API.

```
You push to main
    │
    └── GitHub Action runs in parallel for each care plan client
            ├── builds with Smith's Sanity project ID → uploads to Smith's CF account
            ├── builds with Jones's Sanity project ID → uploads to Jones's CF account
            └── builds with ...

One-time clients are unaffected — they have their own fork, their own repo,
their own CF connection. You have no access to their deployments.
```

---

## Branch Strategy

```
main        ← live; every push redeploys all care plan clients
staging     ← your personal testing branch; gets a CF preview URL
feature/*   ← individual feature branches; also get preview URLs
```

**Rules:**
- Never commit directly to `main` for anything beyond a typo fix
- All work starts on `staging` or a `feature/*` branch
- Test on a Cloudflare preview URL before merging to `main`
- One merge to `main` = all care plan clients update simultaneously

---

## Day-to-Day Development Workflow

### Step 1 — Branch off staging

```sh
git checkout staging
git pull origin staging
git checkout -b feature/new-section
```

### Step 2 — Build and test locally

```sh
./start.sh   # Astro dev server + Sanity Studio
npm run build  # catch build errors before pushing
```

### Step 3 — Push and get a Cloudflare preview URL

```sh
git push origin feature/new-section
```

Cloudflare Pages (your own demo project) automatically builds every pushed
branch at a unique preview URL:
```
https://feature-new-section.<your-demo-project>.pages.dev
```

This is a real Cloudflare build — not localhost. Verify it looks correct here
before touching `main`.

### Step 4 — Merge to staging, then to main

```sh
# Merge feature into staging and verify once more
git checkout staging
git merge feature/new-section
git push origin staging

# When confident — this deploys to ALL care plan clients
git checkout main
git merge staging
git push origin main
```

### Step 5 — Monitor builds

1. Open your GitHub repo → Actions → the running workflow
2. Each client is a matrix job — watch for failures
3. Cloudflare also shows deployment history in each client's Pages project
4. If a build fails, the previous deployment stays live automatically

---

## Safety Checks Before Merging to Main

Run through this list before every push to `main`:

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

Cloudflare keeps every deployment permanently. Rollback takes ~30 seconds.

**Roll back one client:**
1. Client's Cloudflare account → Workers & Pages → their project
2. Deployments → find the last known-good build
3. `•••` → **Rollback to this deployment** — goes live instantly

**Roll back all care plan clients:**
```sh
git revert HEAD        # new commit that undoes the last commit
git push origin main   # triggers Action, all clients get the reverted build
```

Use `git revert` (not `git reset --hard`) — it keeps history clean and avoids
force-pushing.

---

## Adding a New Care Plan Client

1. Complete the full setup in `client-setup-guide.md`
2. Add their entry to the `matrix.client` list in
   `.github/workflows/deploy-clients.yml`
3. Add their GitHub Secrets (CF account ID, CF API token, Sanity token, etc.)
4. Push any commit to `main` to trigger their first Action deploy
5. Add to your uptime monitor

---

## Off-Boarding a Care Plan Client (They Cancel)

Their site keeps running. They get the code. Clean handoff.

1. **Fork the repo** to their GitHub account at its current state
   - GitHub UI: your repo → Use this template, or manually fork to their account
   - Make it private in their account
2. **Reconnect their CF Pages** to their fork
   - In their CF account: delete the Direct Upload project
   - Create a new Pages project connected to their GitHub fork
   - Re-add env vars (they already have these from initial setup)
3. **Remove them from your GitHub Action**
   - Delete their entry from `matrix.client` in the workflow file
   - Commit and push
4. **Remove their GitHub Secrets** from your repo
5. **Confirm their site is still live** from their own fork before closing out
6. **Hand off documentation:**
   - Their GitHub repo URL and login
   - Their Sanity Studio URL (sanity.io/manage for their project)
   - Their Web3Forms login (they already own this — it's on their email)
   - A brief note: *"Your site now deploys from your own GitHub repo. Future
     Cloudflare builds are triggered automatically when you push to main.
     Contact your developer for future changes."*

**What they own at handoff:**
- The source code (their GitHub fork)
- Their Sanity project and all content
- Their Cloudflare account and DNS
- Their Web3Forms account
- Their domain

**What they don't get:** future updates you make to the template after their
cancellation date. That is the sole value of the care plan — ongoing
improvements. Everything else was always theirs.

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

### Per major Astro or Sanity version release
- [ ] Read the migration guide for breaking changes
- [ ] Test upgrade on `staging` branch and preview deployment
- [ ] Deploy to your own demo site first, monitor for one week
- [ ] Then merge to `main` to roll out to all care plan clients

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
