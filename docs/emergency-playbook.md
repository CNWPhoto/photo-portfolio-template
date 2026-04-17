# Emergency Playbook

Field manual for when something goes wrong. Structured for fast scanning during
the 5 minutes when you're panicking and need an answer. If you have time to
read an explanation, see the end-of-section "Why this works" notes.

## TL;DR quick reference

| Symptom | Fastest stabilization |
|---|---|
| Client site is down / broken after a push | [Git revert + push](#all-client-sites-broken-after-a-push) — automatic, 2–5 min |
| Single client broken, others fine | [CF dashboard rollback for that client](#one-client-broken-others-fine) — 10 seconds |
| Blank page / "Internal Error" from CF | [Check env vars](#blank-page-or-500-error) — usually a missing secret |
| Studio preview shows blank | [Check `SANITY_API_READ_TOKEN`](#studio-preview-blank) |
| Studio itself loads but errors | [Check Sanity dashboard](#studio-inaccessible) |
| Contact form not delivering | [Web3Forms key + check spam](#contact-form-broken) |
| Custom domain "not serving" | [SSL provisioning + DNS check](#custom-domain-not-serving) |
| Dataset appears corrupted | [Restore from snapshot](#dataset-corrupted) |
| Sanity MCP can't auth | [`sanity login` from terminal](#sanity-mcp-auth-failure) |
| GH Actions workflow failing | [Check job logs for missing secret](#workflow-failing) |

---

## Site incidents

### All client sites broken after a push

**Symptom**: You merged `main → production`, all clients broke.

**Stabilize (pick one)**:

```sh
# Option A — Git revert + push. Clean, ~2–5 min.
git checkout production
git revert HEAD --no-edit
git push origin production
# Workflow fans out, clients redeploy to the previous good state.
```

```sh
# Option B — CF dashboard rollback per client. Faster (~10 s/client)
# but your git and CF get out of sync until you revert too. Do this if
# you need the sites restored RIGHT NOW and don't have 5 minutes.
# For each client: CF dashboard → account switcher → their account →
# Workers & Pages → <client-slug> → Deployments → previous good one
# → "⋯" → "Rollback to this deployment".
# Then revert in git when you have time.
```

**Diagnose**: Visit `https://github.com/CNWPhoto/photo-portfolio-template/actions` — the failing workflow run shows which step broke. Common causes:

- Build error → TypeScript/Astro compilation issue; fix locally, re-push.
- Env var missing → client environment doesn't have a required secret.
- Smoke test failure → site deployed but HTML is blank or under 5 KB — usually missing `SANITY_API_READ_TOKEN`.
- Schema/data incompatibility → a new field the site expects doesn't exist in the client's Sanity dataset yet.

**Prevention**: Always let `main` sit on the demo for at least a few minutes before merging to `production`. Demo is the canary — if it's broken there, don't promote.

### One client broken, others fine

**Symptom**: `coola-creative.pages.dev` is down but `cnw-photo-demo.pages.dev` and other client sites are fine.

Indicates a client-specific regression — different env vars, different Sanity schema state, different custom domain config.

**Stabilize**: CF dashboard rollback on just that client (10 seconds). Do NOT git revert — the other clients are fine.

```
CF dashboard → Carla's account → Workers & Pages → coola-creative →
Deployments tab → previous known-good deploy → ⋯ → Rollback to this deployment.
```

**Diagnose**: Look at GH Actions log for that matrix entry. Common causes:

- That client's Sanity dataset has schema drift — a document type or field the build expects doesn't exist. Fix in Studio or via MCP patch, then re-run workflow (re-push or dispatch).
- That client's CF API token expired or was rotated. Regenerate and update the GH environment secret.
- That client's dataset has `useCdn` caching a stale version. `SANITY_PREVIEW_SECRET` mismatch causes preview mode to fall through to fallback code.

**Permanent fix**: address the root cause. If it was schema drift, update that client's dataset first (MCP patch or Studio edit), THEN merge to production.

### Blank page or 500 error

**Symptom**: Site loads, but page is empty or shows a CF error.

Almost always a missing or wrong env var. Check in this order:

1. **CF Pages → project → Settings → Environment Variables — Production**. Must have:
   - `PUBLIC_SANITY_PROJECT_ID` (exact match: `tl3zj8iz` for Coola Creative, `hx5xgigp` for demo)
   - `PUBLIC_SANITY_DATASET=production`
   - `SANITY_API_READ_TOKEN` (Encrypted — "read"-scope token for the project)
   - `SANITY_PREVIEW_SECRET` (Encrypted — 32-byte hex)
   - `SANITY_STUDIO_URL` (full URL including `https://`)
   - `NODE_VERSION=20`

2. After any env var change: **Deployments → latest → ⋯ → Retry deployment**. Env vars are baked at build time; editing them without redeploying does nothing.

3. If values look right but it's still broken, check the **deploy log** for errors. Often reveals a CORS issue or a typo in the project ID.

### Studio preview blank

**Symptom**: `coola-creative.sanity.studio/presentation` shows the iframe but nothing renders (or you see "can't edit" / no click overlays).

**Most common cause**: `SANITY_API_READ_TOKEN` missing on the CF Pages env vars. Without it, the preview client falls back to no-token mode which can't see drafts.

**Fix**:

1. CF Pages → client project → Settings → Environment Variables → confirm `SANITY_API_READ_TOKEN` is set.
2. If missing: generate a new one at `https://www.sanity.io/manage/project/<project-id>/api`. Copy the value once (shown only on creation). Paste into CF as **Encrypted** env var.
3. Retry deploy.

**Other causes**:

- `SANITY_STUDIO_PREVIEW_URL` baked into the hosted Studio doesn't match the actual site URL. Flip `studio/.env`, `cd studio && npm run deploy`.
- `presentationTool.allowOrigins` in `studio/sanity.config.js` doesn't include the site's origin. Check the `ALLOW_ORIGINS` logic there (template auto-includes localhost, `*.pages.dev`, and `SANITY_STUDIO_PREVIEW_URL` — should cover all cases).

### Studio inaccessible

**Symptom**: `coola-creative.sanity.studio` itself is down, returns error, or redirects oddly.

**Check**:

1. `https://status.sanity.io` — is Sanity having an incident?
2. `https://www.sanity.io/manage/project/<project-id>` — is the project active, not suspended?
3. Studio deploy is healthy: `cd studio && npx sanity projects list` — confirm project still shows.

**If Studio was working and just stopped**: usually not a Studio-side issue. Re-deploy Studio:

```sh
cd studio
# confirm .env has correct values for this client
npm run deploy
```

### Contact form broken

**Symptom**: Users submit the contact form but nothing arrives.

**Check in order**:

1. Submit a test yourself with an obvious subject. Check the client's inbox spam folder.
2. `siteSettings.web3formsKey` in Sanity — is it set? Published? Correct value?
3. web3forms.com dashboard with the client's email. Is the account active? Access key valid?
4. Open browser DevTools → Network tab → submit form → check the POST to `api.web3forms.com/submit`. Look at response body for the actual error.

**Common causes**:

- Key was regenerated at web3forms.com but Sanity wasn't updated.
- Client's domain isn't on the web3forms account's allowed origins (check in web3forms dashboard).
- Browser extension (uBlock, Privacy Badger) blocked the request.

### Custom domain not serving

**Symptom**: `coolacreative.com` doesn't resolve, shows CF error page, or SSL warning.

**Checklist**:

1. **DNS propagation**: `dig coolacreative.com +short` from terminal — should return Cloudflare IPs. If not, nameservers haven't fully switched yet; wait up to 2 hr after DNS change.
2. **Custom domain added to Pages project**: CF Pages → client project → Custom Domains → both `coolacreative.com` and `www.coolacreative.com` listed with "Active" status.
3. **SSL certificate**: same screen shows SSL status. "Provisioning" can take 5–15 min on a fresh domain.
4. **CF's DNS A/CNAME**: CF dashboard → DNS → verify the `@` or `www` record points at the CF Pages project (CF auto-creates this).
5. **Apex vs. www canonical**: if `www` is canonical but you expect apex, or vice-versa, the redirect direction is wrong. See [www-canonical-host-decision](../../astro-brain/wiki/patterns/www-canonical-host-decision.md).

**Fastest verification command**:

```sh
curl -sIL https://coolacreative.com | grep -iE 'HTTP|location|server'
# Should show 200 on canonical, 301 redirect on non-canonical
```

### Dataset corrupted

**Symptom**: Documents missing, schema fields wiped, wrong data showing up — usually right after a schema migration or bulk update.

**Stabilize**: restore from the most recent snapshot.

```sh
cd studio
# For Coola Creative
SANITY_STUDIO_PROJECT_ID=tl3zj8iz \
  npx sanity dataset import ~/sanity-backups/<date>-coola-creative.tar.gz production --replace

# The --replace flag overwrites the current dataset with the snapshot.
# Takes ~3 seconds for a small dataset.
```

**CRITICAL**: Before running `--replace`, check which project you're targeting. `SANITY_STUDIO_PROJECT_ID` or `studio/.env` determines the target. Restoring one client's snapshot to another client's dataset is catastrophic.

**Prevention**: take a snapshot before every destructive operation.

```sh
cd studio
SANITY_STUDIO_PROJECT_ID=tl3zj8iz \
  npx sanity dataset export production \
  ~/sanity-backups/$(date -u +%Y-%m-%dT%H%M)-coola-creative.tar.gz
```

See also: `docs/rewrite-rollback.md`.

### Sanity MCP auth failure

**Symptom**: Claude Code's Sanity MCP tools return auth errors.

**Fix**: re-authenticate Sanity CLI.

```sh
cd studio
npx sanity login
# follow browser prompts
```

Then restart Claude Code / reload MCP. Tokens are session-scoped.

### Workflow failing

**Symptom**: GitHub Actions run is red.

**Diagnose**: `https://github.com/CNWPhoto/photo-portfolio-template/actions` → click the failing run → expand the red step → read the error.

**Common causes + fixes**:

- **`Error: Input required and not supplied: apiToken`** → the environment secret isn't set. Settings → Environments → `demo` or `client-<slug>` → add `CF_API_TOKEN` as an environment secret.
- **`Project not found`** → `--project-name=<slug>` in the workflow doesn't match an existing CF Pages project. Either create the project in the client's CF account or fix the matrix slug.
- **`Unauthorized`** → CF API token is invalid or expired. Regenerate at CF dashboard → My Profile → API Tokens (in the CORRECT CF account — client's, not yours). Update the GH environment secret.
- **`ENOENT: no such file or directory, open 'dist/...'`** → build failed upstream. Scroll up for the actual Astro/Vite error.
- **Smoke test failure with 200 status but short body** → deploy "succeeded" but the site renders empty. Check `SANITY_API_READ_TOKEN` on the CF Pages env vars (not the GitHub secret, the runtime env var). Go to CF Pages → project → Settings → Environment Variables.

---

## Credentials + access incidents

### CF API token compromised

**Immediate**:

1. CF dashboard → **correct account** → My Profile → API Tokens → find the compromised token → "Roll" (rotates the secret) or "Delete".
2. Generate replacement: "Create Token" → "Edit Cloudflare Pages — Account" template → scope to that account's Pages → copy new token.
3. Update GH environment secret: Settings → Environments → `<env-name>` → `CF_API_TOKEN` → paste new value.
4. Re-run failed workflow or push a no-op to re-fire.

### Lost access to a client's CF account

**Scenario**: Client removed you as Super Admin or you lost your CF login.

- **If you still have the API token**: deploys still work because the token was generated by that account. You lose dashboard access but the token still authenticates API calls. Use this time to ask the client to re-invite you.
- **If you lost the API token too**: you can't deploy until restored. Client must invite you back or generate a new API token themselves and hand it over.

### Sanity read token rotated or lost

The initial tokens were printed once during `mcp__Sanity__create_project`. If lost:

1. Sanity dashboard → `project-id` → API → Tokens.
2. Create a new Viewer token. Copy once.
3. Update:
   - GitHub environment secret `SANITY_API_READ_TOKEN` for that client
   - CF Pages env var `SANITY_API_READ_TOKEN` for that client's project
4. Retry the deploy in both places (GH workflow + CF Pages retry deploy).

### Offboarding (emergency or planned)

**Trigger**: client leaves, wants full ownership transferred.

1. **Sanity**: `sanity.io/manage/project/<id>` → Members → find yourself → Transfer Ownership to the client's Sanity account. They must have a Sanity account first. After transfer, remove yourself as admin.
2. **Cloudflare**: client revokes your Super Admin role via Manage Account → Members. They revoke the CF API token you were using to deploy (kills the GH Actions workflow's ability to push).
3. **GitHub Actions**: remove the client's matrix entry from `.github/workflows/deploy.yml`, delete their GitHub environment (Settings → Environments → `client-<slug>` → Delete). Commit + push.
4. **Web3Forms**: client keeps the account (was created in their email). Transfer any account settings if needed.
5. **Domain + DNS**: client keeps (already in their Cloudflare or their registrar).
6. **Repo**: if they want their site code, give them a zip of the template repo at the tag/commit matching their last deploy. Or transfer a fork if one was created.

Client's site stays live indefinitely on whatever the last deploy was, because it's already running on their CF Pages project with their env vars.

---

## Deploy flow incidents

### Bad commit landed on `production`

**You merged `main → production` and wish you hadn't.**

```sh
git checkout production
git reset --hard HEAD~1     # careful: destroys the bad commit locally
git push origin production --force-with-lease
```

Workflow fires on the force-push, clients redeploy to the pre-bad state.

**Or use revert (safer — preserves history)**:

```sh
git checkout production
git revert HEAD --no-edit
git push origin production
```

### `main` and `production` diverged

**Symptom**: `git log main..production` shows commits, or vice-versa.

**Expected**: `production` is always at or behind `main`. `main` can have commits ahead. **If `production` has commits not on `main`, something went sideways.**

**Fix**:

```sh
git checkout main
git merge production      # bring the out-of-band production commits back to main
git push origin main
```

Then the branches reconcile. Useful when someone hotfixed on `production` directly.

### Demo deploy succeeds but production fan-out fails for all

**Symptom**: Demo is green, all client jobs are red with the same error.

Almost always a shared secret that's missing across environments. The template uses the same `SANITY_API_READ_TOKEN` variable name in each environment but each environment's secret value is different. If you forgot to set one in a specific environment, that one fails.

**Fix**: Settings → Environments → check each client environment has all 4 secrets: `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `SANITY_API_READ_TOKEN`, `SANITY_PREVIEW_SECRET`. Missing any one = failed build for that client.

---

## Prevention checklists

### Before merging `main → production`

- [ ] Demo site at `cnw-photo-demo.pages.dev` renders correctly
- [ ] Sitemap loads: `curl -sI https://cnw-photo-demo.pages.dev/sitemap.xml`
- [ ] Contact form works on demo (submit a test)
- [ ] Browser console is clean (no errors) on at least 2 demo pages
- [ ] No schema migration in the batch without snapshotting affected client datasets first
- [ ] Commit messages describe intent (future-you will thank present-you at revert time)

### Before any schema migration

- [ ] Snapshot every affected dataset:
      `cd studio && SANITY_STUDIO_PROJECT_ID=<id> npx sanity dataset export production ~/sanity-backups/<date>-<slug>.tar.gz`
- [ ] Test the migration script locally against a staging dataset first
- [ ] Document rollback steps in the commit message
- [ ] Merge to `production` only after demo has ingested the new schema cleanly

### Before deploying a new client

- [ ] Sanity project created, dataset seeded, Studio deployed
- [ ] GitHub Environment `client-<slug>` created with all 4 secrets
- [ ] CF Pages project created in client's account (Direct Upload mode)
- [ ] Matrix entry added to `.github/workflows/deploy.yml`
- [ ] First deploy triggered via `workflow_dispatch` → smoke passes
- [ ] DNS + custom domain wired, SSL active
- [ ] `seoSettings.siteUrl` set, canonical verified
- [ ] Web3Forms key in Sanity + test submission delivered
- [ ] Client invited as Sanity Editor (do this LAST, after everything else verified)

---

## Commands reference

### Current branches + tags

```sh
git branch -a                                    # all branches
git log origin/main..origin/production           # commits promoted to clients
git log origin/production..origin/main           # commits staged on demo, not yet promoted
git tag -l 'archive/*'                           # archived branches
```

### Redeploy a single client without a code push

```sh
# Trigger the workflow manually from GitHub UI:
# Actions → Deploy → "Run workflow" → branch: production → Run
# Only works for all clients; to deploy just one, see wrangler fallback below.
```

### Wrangler CLI fallback (deploy from your laptop)

Useful when the workflow is broken or you need an urgent out-of-band deploy.

```sh
cd /Users/connorwalberg/Projects/photo-portfolio-template

# Build with the client's env vars
PUBLIC_SANITY_PROJECT_ID=tl3zj8iz \
  PUBLIC_SANITY_DATASET=production \
  SANITY_API_READ_TOKEN=<read-token> \
  SANITY_PREVIEW_SECRET=<preview-secret> \
  SANITY_STUDIO_URL=https://coola-creative.sanity.studio \
  npm run build

# Deploy with the client's CF credentials
CF_API_TOKEN=<client-token> \
  CLOUDFLARE_ACCOUNT_ID=<client-account-id> \
  npx wrangler pages deploy dist --project-name=coola-creative --branch=production
```

### Restore a Sanity dataset

```sh
cd studio
SANITY_STUDIO_PROJECT_ID=tl3zj8iz \
  npx sanity dataset import ~/sanity-backups/<snapshot>.tar.gz production --replace
```

### Re-authenticate Sanity CLI

```sh
cd studio
npx sanity login
```

### Verify a live site

```sh
URL="https://coolacreative.com"
curl -sI "$URL" | grep -iE 'HTTP|location'      # status + redirects
curl -sL "$URL" | grep -oE '<title>[^<]*</title>'  # title tag
curl -sL "$URL/sitemap.xml" | head -20            # sitemap
curl -sL "$URL" | grep -c 'application/ld+json'  # count of JSON-LD blocks
```

---

## Escalation

If none of the above resolves the issue within 30 minutes and a client site is still down:

1. Enable CF Pages rollback manually for all affected clients (Deployments tab → previous → Rollback).
2. Notify the client briefly: "I'm aware of the issue and rolling back now; the site is restored and I'm investigating the root cause."
3. Open a postmortem note somewhere (session notes in astro-brain is fine) documenting what went wrong and why it wasn't caught on demo.
4. Fix, test on demo, promote cautiously.

Silence while you debug is worse than a 30-second acknowledgment with a restored site.
