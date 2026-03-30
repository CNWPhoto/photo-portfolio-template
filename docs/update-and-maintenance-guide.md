# Update & Maintenance Guide
## Pushing Code Updates to All Client Sites Safely

---

## How Updates Work

Because every client's Cloudflare Pages project points to your GitHub `main`
branch, **any commit you push to `main` triggers a rebuild of every client site
simultaneously.** This is powerful but requires a deliberate workflow so you
never deploy broken code to live sites.

```
Your local machine
    │
    ├── feature-branch  ──►  Cloudflare Preview URL (test here)
    │                              │
    └── merge to main  ──────────►  All client sites rebuild automatically
```

---

## Branch Strategy

```
main          ← production; all clients deploy from here
│
├── dev       ← your working branch for all new features
│   │
│   └── feature/lightbox-fix    ← individual feature or fix branches
│       feature/new-section
│       fix/mobile-nav
```

**Rules:**
- Never commit directly to `main` for anything beyond typo fixes
- All work happens on `dev` or a named feature branch
- Always preview on Cloudflare before merging to `main`
- One merge to `main` = all clients update

---

## Step-by-Step: Making and Deploying a Change

### Step 1 — Create a branch

```sh
git checkout dev
git pull origin dev          # make sure you're up to date
git checkout -b fix/nav-bug  # create your working branch
```

### Step 2 — Make and test changes locally

```sh
./start.sh   # starts Astro dev server + Sanity Studio
```

Test thoroughly against your own Sanity project before touching any client
environments.

### Step 3 — Push branch and get a Cloudflare preview URL

```sh
git push origin fix/nav-bug
```

Cloudflare Pages automatically builds every pushed branch and gives it a unique
preview URL:
```
https://fix-nav-bug.<your-pages-project>.pages.dev
```

This preview uses **your own Sanity env vars** (whichever project is set as the
default in Cloudflare's preview environment variables). Use it to verify the
change looks correct in a real Cloudflare environment, not just localhost.

### Step 4 — Merge to `dev`, then to `main`

```sh
# Merge feature into dev first
git checkout dev
git merge fix/nav-bug
git push origin dev

# When confident, merge dev to main
git checkout main
git merge dev
git push origin main
```

Pushing to `main` triggers **all client rebuilds simultaneously.**
Cloudflare shows build progress in each Pages project under **Deployments.**

### Step 5 — Monitor builds

1. Open [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages
2. Check each client's Pages project — builds usually complete in 2–4 minutes
3. If any build fails, it only affects that project's deployment
   (the previous deployment stays live automatically)

---

## Safety Checks Before Merging to Main

Run through this list before every `main` merge:

**Code**
- [ ] Tested locally with `npm run build` (catches TypeScript/build errors early)
- [ ] Tested on Cloudflare preview URL (not just localhost)
- [ ] No hardcoded client-specific values (IDs, names, URLs)
- [ ] No `.env` file accidentally staged (`git status` — check before committing)

**Visual**
- [ ] Desktop layout looks correct
- [ ] Mobile layout looks correct (check at 375px and 768px)
- [ ] Dark theme tested if applicable
- [ ] Images load and are not broken

**Functional**
- [ ] Navigation links work
- [ ] Contact form submits (test against Web3Forms)
- [ ] Blog pages render (list and individual post)
- [ ] No JavaScript console errors

**Sanity**
- [ ] Any new schema fields have safe fallback values in the frontend code
  (new fields won't exist in existing client documents until they publish)
- [ ] Any removed schema fields are also removed from all GROQ queries
  (stale queries won't break anything but produce unnecessary null fields)

---

## What is Safe vs. What Can Break

### Safe to update anytime — no client impact on content

These changes deploy silently. Clients won't notice anything except
improvements:

- CSS/styling changes
- New components that aren't wired into existing pages
- SEO metadata improvements
- Performance optimizations
- Bug fixes that don't touch the Sanity schema

### Requires care — schema changes

When you add a new field to a Sanity schema:

- The field won't exist in client documents until the client visits their
  Studio and publishes
- **Always write frontend code to handle the field being `null` or `undefined`**
- Never assume a new field has a value — use fallbacks everywhere:
  ```js
  const heading = section?.heading || 'Default Heading';
  ```

When you remove a field from a Sanity schema:

- Remove it from all GROQ queries at the same time
- The content is not deleted from Sanity — it just becomes inaccessible
  (clients can recover it by re-adding the schema field)

When you rename a field:

- Treat it as: add new field + remove old field
- Migrate content in Sanity before removing the old field

### High risk — avoid or coordinate carefully

- Changing URL structure (slugs, page paths) — breaks bookmarks, search rankings
- Removing sections or section types that clients are actively using
- Changing Sanity document IDs (siteSettings, homepagePage, etc.)
- Modifying `_key` values in singleton sections

---

## Rollback: If Something Goes Wrong

Cloudflare Pages keeps all previous deployments permanently. Rolling back
takes about 30 seconds.

**To roll back a specific client:**
1. Go to Cloudflare → Workers & Pages → select the client's project
2. Click **Deployments**
3. Find the last known-good deployment
4. Click **•••** → **Rollback to this deployment**
5. That deployment goes live immediately — no rebuild needed

**To roll back all clients:**
```sh
git revert HEAD        # creates a new commit that undoes the last commit
git push origin main   # triggers rebuild of all clients with the revert
```

Using `git revert` (not `git reset`) keeps the git history clean and avoids
force-pushing.

---

## Handling Client-Specific Customizations

Since all clients share the same codebase, client-specific content (copy,
colors, images) lives entirely in Sanity. Occasionally a client may need a
truly unique feature that other clients don't want.

**Preferred approach: Sanity toggle**
Add an on/off toggle in Sanity so the feature can be enabled per client.
This keeps one codebase and lets each client opt in/out.

**If a feature is genuinely one-off:**
Create a client-specific branch in GitHub:
```
main           ← all shared clients
client-smith   ← branch with Smith's unique addition, merged from main
```
That client's Cloudflare Pages project deploys from `client-smith` instead of
`main`. Updates still flow: merge `main` into `client-smith` when needed.

---

## Keeping the Sanity Studio Up to Date

The Studio (`studio/`) is deployed separately from the Astro frontend.
When you change a schema file, **you must redeploy the Studio** for clients
to see the new fields in their CMS.

**Workflow for schema changes:**

1. Update schema files in `studio/schemaTypes/`
2. Test locally: `cd studio && npm run dev`
3. For each client:
   - Temporarily update `studio/sanity.config.js` with their project ID
   - Run `npm run deploy` from the `studio/` directory
   - Revert the config change
4. Commit the schema changes to the main repo

> **Tip:** Keep a small shell script per client to swap the project ID and
> deploy without touching git:
> ```sh
> # deploy-studio-smith.sh
> SANITY_PROJECT_ID=abc123 npm run deploy
> ```
> (Requires the studio config to read from `process.env.SANITY_PROJECT_ID`)

---

## Monitoring Client Sites

Set up a free uptime monitor for each live client site so you know before
they tell you if something is down.

**Recommended free options:**
- [UptimeRobot](https://uptimerobot.com) — monitors every 5 minutes, free for up to 50 sites
- [Better Stack](https://betterstack.com) — 10-second checks, good alerting

**What to monitor per client:**
- `https://clientdomain.com` — homepage (200 OK)
- `https://clientdomain.com/contact` — contact page
- `https://clientdomain.com/sitemap.xml` — confirms build succeeded

Set alerts to go to your email or Slack so you catch issues immediately.

---

## Periodic Maintenance Checklist

### Monthly
- [ ] Check for npm dependency updates: `npm outdated` in root and `studio/`
- [ ] Review Cloudflare Pages build logs for any warnings
- [ ] Confirm all client contact forms are still delivering email (spot-check)
- [ ] Check Google Search Console for any crawl errors on active client sites

### Per Astro or Sanity major version release
- [ ] Test the upgrade on a feature branch and preview deployment first
- [ ] Read the migration guide for breaking changes
- [ ] Update one client site first; monitor for a week before rolling out to all

### Per client — quarterly check-in
- [ ] Is the SSL certificate still valid? (Cloudflare auto-renews, but confirm)
- [ ] Is the domain still registered and not expiring? (remind clients 60 days out)
- [ ] Are contact form submissions being received?
- [ ] Any content updates the client needs help with?

---

## Emergency Contacts & Access

Keep a secure record (1Password or similar) for each client containing:

| Item | Notes |
|---|---|
| Domain registrar login | Where to change nameservers if needed |
| Cloudflare account | If client has their own CF account |
| Sanity project ID + studio URL | For CMS access |
| Web3Forms email + access key | For form troubleshooting |
| Client's email + phone | For coordinating domain changes |
| Date site went live | For anniversary check-ins |
