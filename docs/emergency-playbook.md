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
# Option B — `wrangler rollback` per client (seconds each, no rebuild).
# Faster than a git revert but your git and CF get out of sync until
# you revert too. Use this when sites must be back RIGHT NOW.
# For each client (with that client's API token + account ID):
CLOUDFLARE_API_TOKEN=<client-token> CLOUDFLARE_ACCOUNT_ID=<acct> \
  npx wrangler rollback --name <client-slug>
# Or dashboard: client's CF account → Workers & Pages → <slug>
# → Deployments → previous Version ID → Rollback.
# Then `git revert` on production when you have time so they stay in sync.
```

**Diagnose**: Visit `https://github.com/CNWPhoto/photo-portfolio-template/actions` — the failing workflow run shows which step broke. Common causes:

- Build error → TypeScript/Astro compilation issue; fix locally, re-push.
- Env var missing → client environment doesn't have a required secret.
- Smoke test failure → site deployed but HTML is blank or under 5 KB — usually missing `SANITY_API_READ_TOKEN`.
- Schema/data incompatibility → a new field the site expects doesn't exist in the client's Sanity dataset yet.

**Prevention**: Always let `main` sit on the demo for at least a few minutes before merging to `production`. Demo is the canary — if it's broken there, don't promote.

### One client broken, others fine

**Symptom**: Coola's `coolacreative.com` is down (or another client's site) but other clients and the demo are fine.

Indicates a client-specific regression — different secrets, different Sanity schema state, different custom domain config.

**Stabilize**: `wrangler rollback` on just that client (seconds, no rebuild). Do NOT git revert — the other clients are fine.

```sh
CLOUDFLARE_API_TOKEN=<client-token> CLOUDFLARE_ACCOUNT_ID=<acct> \
  npx wrangler rollback --name <client-slug>
# Or dashboard: client's CF account → Workers & Pages → <slug>
# → Deployments → previous Version ID → Rollback.
```

**Diagnose**: Look at the GH Actions log for that client's last dispatch / matrix run. Common causes:

- That client's Sanity dataset has schema drift — a document type or field the build expects doesn't exist. Fix in Studio or via MCP patch, then re-dispatch (`gh workflow run deploy.yml --ref main -f only_client=<slug>`).
- That client's CF API token expired / was rotated / lost Workers scope. Regenerate ("Edit Cloudflare Workers" template) and update the GH environment secret.
- A Worker secret is missing or wrong. `npx wrangler secret list --name <slug>` to verify; re-dispatch to re-upload from the GH Environment.
- Live debug from the Worker itself: `npx wrangler tail --name <slug>` while reproducing the bad request.

**Permanent fix**: address the root cause. If it was schema drift, update that client's dataset first (MCP patch or Studio edit), THEN merge to production.

### Blank page or 500 error

**Symptom**: Site loads, but page is empty or shows a CF error.

On the Workers model, runtime secrets are Worker secrets — pushed by the workflow's `wrangler secret bulk` step from the `client-<slug>` GitHub Environment. Check in this order:

1. **GitHub → repo → Settings → Environments → `client-<slug>`** has all four secrets set:
   - `CF_API_TOKEN` ("Edit Cloudflare Workers" scope on that account)
   - `CF_ACCOUNT_ID`
   - `SANITY_API_READ_TOKEN`
   - `SANITY_PREVIEW_SECRET`
   The `PUBLIC_SANITY_PROJECT_ID` / `_DATASET` / `SANITY_STUDIO_URL` aren't environment secrets — they live in the workflow matrix and are inlined at build time. Confirm the matrix entry's `sanity_project_id` and `studio_url` are correct.

2. **Inspect the Worker's secrets directly:**
   ```sh
   CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<acct> \
     npx wrangler secret list --name <client-slug>
   ```
   You should see `SANITY_API_READ_TOKEN`, `SANITY_PREVIEW_SECRET`, `SANITY_STUDIO_URL`. Missing → re-dispatch:
   ```sh
   gh workflow run deploy.yml --ref main -f only_client=<client-slug>
   ```
   The workflow's secret-bulk step re-uploads them.

3. **Worker live logs** for the actual error:
   ```sh
   CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<acct> \
     npx wrangler tail --name <client-slug>
   ```
   Hit the site in a browser; you'll see request errors / thrown exceptions in real time.

4. **Quick rollback** while diagnosing:
   ```sh
   npx wrangler rollback --name <client-slug>
   # pick a previous Version ID
   ```

### Studio preview blank

**Symptom**: `<client-slug>.sanity.studio/presentation` shows the iframe but nothing renders (no click overlays / "can't edit").

**Most common cause**: `SANITY_API_READ_TOKEN` Worker secret not set / not the right token. Without a valid read token the preview client can't see drafts.

**Fix**:

1. Verify the secret is present on the Worker (see step 2 in the section above).
2. If missing or wrong: rotate at `https://www.sanity.io/manage/project/<project-id>/api`, update `SANITY_API_READ_TOKEN` in the `client-<slug>` GitHub Environment, re-dispatch (`gh workflow run deploy.yml --ref main -f only_client=<slug>`) — the workflow re-uploads it.

**Other causes**:

- `SANITY_STUDIO_PREVIEW_URL` baked into the hosted Studio doesn't match the actual site origin. Edit `studio/.env.<slug>-backup`, then `node studio/scripts/onboard/30-studio-deploy.js --slug=<slug>`.
- `presentationTool.allowOrigins` in `studio/sanity.config.js` doesn't include the site's origin. Template auto-includes localhost, `*.pages.dev`, `*.workers.dev`, and `SANITY_STUDIO_PREVIEW_URL` — should cover all cases; add the specific origin if it's a non-matching custom domain.
- **Sanity project CORS** missing the site origin → Sanity → Manage → Project → API → CORS Origins → add `https://<site-origin>` with credentials allowed. (Required for visual-editing fetches from the browser.)

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

**Always check against public resolvers first** — your local stub may be cached. Use `dig @1.1.1.1` or test from cellular/incognito before assuming an outage.

**Checklist**:

1. **Public DNS resolves**: `dig +short @1.1.1.1 coolacreative.com` returns Cloudflare IPs. Same for `www`. If empty, the DNS record is missing or the zone's nameservers haven't fully switched yet.
2. **Custom Domain attached to the Worker**: CF dashboard → Workers & Pages → `<client-slug>` (the Worker) → Settings → **Domains & Routes** → both hosts present and "Active". (NOT on the old Pages project — if the domain still shows there, it never moved.)
3. **SSL certificate**: same screen shows cert status. "Provisioning" can take a minute or two on a fresh attach.
4. **Zone DNS record**: CF → DNS → Records → the `@` / `www` record is a Cloudflare-managed entry created by the Worker custom-domain attach. If you see a stale A/CNAME pointing at Pages, the move didn't complete.
5. **Apex vs. www canonical**: behavior is controlled by a zone-level Redirect Rule (e.g. `www→apex`), independent of the Worker. See `astro-brain/wiki/patterns/www-canonical-host-decision.md`.

**Fastest verification commands**:

```sh
curl -sIL https://coolacreative.com/ | grep -iE 'HTTP|location|server|cf-ray'
# Apex: HTTP/2 200 + cf-ray header (served by Worker via Cloudflare)
curl -sIL https://www.coolacreative.com/ | grep -iE 'HTTP|location'
# www: 301 → apex (if redirect rule), or 200 (if both serve directly)

# If local resolver is stuck on NXDOMAIN (common after a domain move):
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
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

- **`Error: Input required and not supplied: apiToken`** → the environment secret isn't set. Settings → Environments → `demo` or `client-<slug>` → add `CF_API_TOKEN`.
- **`Authentication error [code: 10000]` / `Authentication failed [code: 9106]` on `/workers/...` or `/memberships`** → the CF API token is scoped to **Pages**, not Workers. Recreate it with the **"Edit Cloudflare Workers"** template (Account = client's account, Zone = All zones) and update the GH environment secret.
- **`Invalid access token [code: 9109]`** → the token in the GH environment is invalid — almost always a copy-paste issue (truncated / trailing whitespace / wasn't actually saved). Recreate cleanly and re-paste.
- **`Found both a user configuration file at "wrangler.json" and a deploy configuration file at "../../.wrangler/deploy/config.json"`** → the deploy step is running from `dist/server/` instead of repo root. The adapter v13 redirect needs the deploy to run from repo root with `--name <slug>` (the redirect lacks `name`).
- **`Required Worker name missing`** → `--name <slug>` flag not present on `wrangler deploy` (or `wrangler secret bulk` ran without `--name` and the redirect didn't supply it). Pass `--name` explicitly everywhere.
- **`ENOENT: no such file or directory, open 'dist/...'`** → build failed upstream. Scroll up for the actual Astro/Vite error.
- **Smoke test failure with 200 status but short body (<5 KB)** → deploy "succeeded" but the Worker is rendering empty/fallback. Likely a missing Sanity Worker secret. `npx wrangler secret list --name <slug>` to inspect; re-dispatch to re-upload from the GH Environment.

---

## Credentials + access incidents

### CF API token compromised

**Immediate**:

1. CF dashboard → **correct account** → My Profile → API Tokens → find the compromised token → "Roll" (rotates the secret) or "Delete".
2. Generate replacement: "Create Token" → **"Edit Cloudflare Workers"** template → Account Resources = that client's account; Zone Resources = All zones → copy new token.
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
3. Update GitHub Environment `client-<slug>` → `SANITY_API_READ_TOKEN`. (There is no separate CF dashboard env var to update on the Workers model — the workflow uploads the secret to the Worker on each deploy.)
4. Re-dispatch the workflow for that client:
   ```sh
   gh workflow run deploy.yml --ref main -f only_client=<client-slug>
   ```
   The `wrangler secret bulk` step pushes the new value to the Worker.

### Offboarding (emergency or planned)

**Trigger**: client leaves, wants full ownership transferred.

1. **Sanity**: `sanity.io/manage/project/<id>` → Members → find yourself → Transfer Ownership to the client's Sanity account. They must have a Sanity account first. After transfer, remove yourself as admin.
2. **Cloudflare**: client revokes your Super Admin role via Manage Account → Members. They revoke the CF API token you were using to deploy (kills the GH Actions workflow's ability to push).
3. **GitHub Actions**: remove the client's matrix entry from `.github/workflows/deploy.yml`, delete their GitHub environment (Settings → Environments → `client-<slug>` → Delete). Commit + push.
4. **Web3Forms**: client keeps the account (was created in their email). Transfer any account settings if needed.
5. **Domain + DNS**: client keeps (already in their Cloudflare or their registrar).
6. **Repo**: if they want their site code, give them a zip of the template repo at the tag/commit matching their last deploy. Or transfer a fork if one was created.

Client's site stays live indefinitely on whatever the last Worker deploy was — the Worker + its secrets live in her account and continue serving without any further deploy from your workflow.

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

- [ ] Demo Worker URL (from the latest workflow run's smoke output, e.g. `cnw-photo-demo.<acct>.workers.dev`) renders correctly
- [ ] Sitemap loads: `curl -sI <demo-url>/sitemap.xml`
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
- [ ] CF API token re-scoped for the client's account ("Edit Cloudflare Workers" template) and pasted into the `client-<slug>` GitHub Environment
- [ ] Matrix entry added to `.github/workflows/deploy.yml` (and to the `client-one` job's `case` block)
- [ ] First deploy triggered via `gh workflow run deploy.yml --ref main -f only_client=<slug>` → smoke passes
- [ ] Worker Custom Domain attached (apex + www if applicable), SSL active
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
gh workflow run deploy.yml --ref main -f only_client=<client-slug>
# The `client-one` job builds + pushes secrets + deploys the Worker for just that client.
# No production fan-out; no other client touched.
```

### Instant rollback to a previous Worker version (no rebuild)

```sh
CLOUDFLARE_API_TOKEN=<client-token> CLOUDFLARE_ACCOUNT_ID=<acct> \
  npx wrangler rollback --name <client-slug>
# Pick a previous Version ID. Reverts that one client in seconds.
```
Or via dashboard: client's CF account → Workers & Pages → `<slug>` → Deployments → choose Version ID → Rollback.

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

# Push Worker secrets (creates the Worker if needed)
node -e "require('fs').writeFileSync('/tmp/s.json',JSON.stringify({SANITY_API_READ_TOKEN:'<read-token>',SANITY_PREVIEW_SECRET:'<preview-secret>',SANITY_STUDIO_URL:'https://coola-creative.sanity.studio'}))"
CLOUDFLARE_API_TOKEN=<client-token> CLOUDFLARE_ACCOUNT_ID=<account-id> \
  npx wrangler secret bulk /tmp/s.json --name coola-creative
rm /tmp/s.json

# Deploy the Worker — run from repo root so the adapter's .wrangler/deploy
# redirect resolves dist/server/wrangler.json correctly. `--name` is required.
CLOUDFLARE_API_TOKEN=<client-token> CLOUDFLARE_ACCOUNT_ID=<account-id> \
  npx wrangler deploy --name coola-creative
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

1. Roll back each affected client to its previous Worker version via `npx wrangler rollback --name <slug>` (or dashboard → Workers & Pages → `<slug>` → Deployments → previous Version ID → Rollback).
2. Notify the client briefly: "I'm aware of the issue and rolling back now; the site is restored and I'm investigating the root cause."
3. Open a postmortem note somewhere (session notes in astro-brain is fine) documenting what went wrong and why it wasn't caught on demo.
4. Fix, test on demo, promote cautiously.

Silence while you debug is worse than a 30-second acknowledgment with a restored site.
