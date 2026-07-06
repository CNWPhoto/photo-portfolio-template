# Client onboarding runbook

Composable, re-runnable scripts that encode the manual onboarding we did
by hand for Coola / Lavon / Blackbird. Each step is independent — if one
fails, fix and re-run just that one. Numbered for order.

## Prerequisites (the client does these — cannot be automated)

1. Creates a Sanity org in their name → invites `connor@singletrackseo.com` as **Administrator**, then creates a project (dataset `production`) in that org.
2. Creates / logs into Cloudflare → invites Connor as **Super Administrator**.
3. Signs up at web3forms.com, clicks the verification email within 90s, sends Connor the access key.

You provide, from the above: the **Sanity project id**, a **Sanity Viewer API token** (sanity.io/manage → API → Tokens), a **CF API token scoped with the "Edit Cloudflare Workers" template** (Account = client's account, Zone = All zones), the **CF account id**, and the **Web3Forms key**.

## The flow

```sh
# ── No accounts needed yet — run anytime ──────────────────────────────
node studio/scripts/onboard/10-scrape.js \
  --slug=<slug> --url=<existing-site> --niche=<pet|family|wedding|generic>

#   → .staging/<slug>/{originals,manifest,content.json,REVIEW.md}

# ══ HUMAN CHECKPOINT 1 ════════════════════════════════════════════════
#   Edit .staging/<slug>/content.json — fill every TODO (voice/copy
#   pass). Mine manifest/page-text.json + manifest/all-media.json.
#   REVIEW.md is the punch list. The overlay SKIPS unfilled TODOs, so
#   it's safe to run partial, but ship-quality = fully filled.

# ── Needs the Sanity project id (client created the project) ──────────
node studio/scripts/onboard/20-env.js \
  --slug=<slug> --project-id=<sanity-id> --title="<Display Name>"

node studio/scripts/onboard/30-studio-deploy.js --slug=<slug>
node studio/scripts/onboard/40-cors.js --slug=<slug>
node studio/scripts/onboard/50-donor-seed.js --slug=<slug> --donor=cnw-photo-demo

# overlay runs via sanity exec, so it reads studio/.env directly — swap
# to the client env around it (30/40/50 self-manage this; 60 can't
# because sanity exec needs the project id from dotenv at launch):
cp studio/.env studio/.env.dev-snapshot
cp studio/.env.<slug>-backup studio/.env
npm --prefix studio run onboard:overlay -- \
  --slug=<slug> --palette=<forest-sage|classic-cream|warm-studio|dark-editorial|cool-minimal>
cp studio/.env.dev-snapshot studio/.env && rm studio/.env.dev-snapshot

# ══ HUMAN CHECKPOINT 2 ════════════════════════════════════════════════
#   Eyeball https://<slug>.sanity.studio/. Fix anything in Studio.
#   Gather: CF API token, CF account id, Sanity Viewer read token,
#   and a fresh preview secret:  openssl rand -hex 32

# ── Needs CF + GH access ──────────────────────────────────────────────
node studio/scripts/onboard/70-gh-env.js --slug=<slug> \
  --cf-token=… --cf-account=… --sanity-read-token=… --preview-secret=…

# 80-cf-provision.js is OBSOLETE on the Workers model — Worker is created
# on first `wrangler deploy`, and runtime secrets are pushed by the
# workflow's `wrangler secret bulk` step. Skip it.

# Add the matrix entry (deploy.yml `clients` job) AND the client-one job's
# slug→config case mapping. Both still hand-edited today; consolidating
# to a shared client registry is the top scaling follow-up.

git add .github/workflows/deploy.yml studio/.env.<slug>-backup
git commit -m "chore: onboard <slug>"
git push origin main                       # demo canary rebuilds

# First deploy for the new client — staged, single-client (no fan-out):
gh workflow run deploy.yml --ref main -f only_client=<slug>
# Verify the smoke step lands green; the workflow creates the Worker on
# first deploy and uploads secrets. No production push needed yet.

# When ready to include them in the normal fleet fan-out:
git checkout production && git merge main --no-ff && git push origin production
git checkout main                          # back to dev

# ── Web3Forms (whenever the key arrives) ──────────────────────────────
#   Studio → Site & Theme → Web3Forms Access Key → paste → publish

# ── Domain cutover (whenever the client goes live on their real domain) ──
# Prereq: the domain's zone exists in the client's CF account (nameservers
# already moved). Then one command does: CF custom-domain attach, env-backup
# preview URL, CORS, seoSettings.siteUrl, Studio redeploy, smoke test —
# and prints the manual follow-ups (www redirect rule, Search Console).
CF_API_TOKEN=… node studio/scripts/onboard/90-domain-cutover.js \
  --slug=<slug> --domain=<canonical host> --account-id=<cf account id>
# Pick the canonical host deliberately (apex vs www) — see the vault's
# www-canonical-host pattern. Re-runnable; --skip-cf if the domain was
# already attached in the dashboard.
```

## Blog migration fidelity checklist (Squarespace/WordPress → Sanity)

**Run this AFTER `65-blog-import`, BEFORE telling the client the blog is done.** A migration
that "imported without errors" is NOT one that matches the source. The PIF Squarespace
migration (2026-07) ran clean but silently lost content that surfaced as complaints weeks
later — nine distinct bugs, every one invisible unless you diff the imported result against the
live source. The scraper/importer now fix all nine; this checklist catches regressions and
platform quirks the tooling doesn't yet know about.

**Automate most of it with `66-verify-blog.js`** — it diffs the live dataset against the staged
scrape and asserts the mechanical items below (post/image/video counts, alt + excerpt coverage,
no title-duplicate leading heading, category refs resolve, no old-domain link leaks, no inline
category-nav remnant). Read-only; exits non-zero on any hard fail. Run it in the swapped client
env, same dance as the import:

```sh
cd studio && npx sanity exec scripts/onboard/66-verify-blog.js --with-user-token -- --slug=<slug>
```

It reports FAILs (block sign-off) and WARNs (eyeball — e.g. a mark-count drift or an intentional
external link). Then hand-check what it can't (the visual spot-check at the bottom).

Diff the imported dataset against the live source:

- [ ] **Excerpts** — every post has one (`og:description` = the Squarespace excerpt/SEO summary;
      pulled for ALL posts, not just the beyond-RSS tail that carried it inline).
- [ ] **No title-duplicate heading** — page-scraped posts can start with the title as an `<h2>`;
      the template already renders the title, so a leading heading that EXACTLY equals the title
      is dropped (genuine subheadings survive — exact match only).
- [ ] **Internal links relativized** — body links the author wrote as full URLs back to the source
      domain are rewritten to relative paths, so they stay on the new site (same-tab) instead of
      rendering external (new tab, old Squarespace host). Genuinely external links pass through.

- [ ] **Post count** — sitemap post URLs (minus `/tag/`, `/category/`) == blogPost docs. NOT
      the RSS count: Squarespace RSS caps at 20 items, so post *existence* comes from the
      sitemap; older posts only exist via the page-scrape fallback.
- [ ] **Dates + titles** correct on beyond-RSS (page-scraped) posts (og:title on a post page
      is the SITE title — real title is `itemprop="headline"`).
- [ ] **Body images** — source `<img>` count ≈ image blocks (allowing the featured-image dedup).
- [ ] **Videos** — grep every source PAGE for `youtube|vimeo|sqs-video-wrapper|embedly`; compare
      ids to `videoEmbed` blocks. TWO embed styles: embedly `<iframe>` (in RSS) and native
      `sqs-video-wrapper` (page-only — RSS strips it; renders as a static poster, so a "video is
      just a photo" report means this one was missed).
- [ ] **No duplicate featured image** — cover source filename ∉ body image source filenames
      (cover + body copy are often different SIZES of one asset, so asset-id dedup misses it).
- [ ] **Inline formatting** — source counts of `<strong>/<b>`, `<em>/<i>`, `<a>` (http+tel+mail)
      ≈ preserved marks/markDefs. Check a formatted phrase renders WITH its surrounding spaces
      ("what *x* is", not "what*x*is") and a query-string href isn't double-encoded (`&amp;amp;`).
- [ ] **Categories** — real per-post tags (`<a class="blog-item-tag">`, NOT the body's
      all-categories nav, NOT RSS `<category>` which is empty) migrated to `blogCategory` docs +
      assigned; "browse category" footer links point at the NEW site; category pages resolve and
      list the right posts; unused donor-seed categories removed.
- [ ] **Spacing** — directory/listing content (indented `data-indent` sub-items) renders as list
      items, not a stack of full-margin paragraphs.
- [ ] **Editor-touched posts** — check `_updatedAt` > migration date before re-importing; `--skip`
      those and flag the owner. But "she edited it" ≠ "she added content" — diff her text against
      the source; if it's a subset (pure restructuring), re-import is safely additive.
- [ ] Visually spot-check 2-3 posts on the live site: formatting renders, links clickable and
      internal ones open same-tab, videos play, no duplicate image.

## Recovery / gotchas

- **Every script is re-runnable.** `20-env` won't clobber an existing
  backup; `10-scrape` won't clobber an edited content.json (writes
  `content.skeleton.json` instead); `60-overlay` is idempotent
  (createOrReplace + asset SHA-dedupe).
- **`.env` safety**: 30/40/50 use `withClientEnv` which snapshots and
  always restores `studio/.env`, even on throw. Local dev .env is never
  left pointing at a client.
- **Donor must have a `studio/.env.<donor>-backup`** for 50-donor-seed
  (the demo's is `.env.cnw-photo-demo-backup`).
- **60-overlay refuses to run against `hx5xgigp`** (the demo project) as
  a guard against a wrong active `.env`.
- **Secrets in shell history**: prefer the env-var form for 70/80
  (`CF_TOKEN=… SANITY_READ_TOKEN=… node …`). Rotate the CF token after
  onboarding if it was passed as a flag.
- Studio/schema changes still need the per-client Studio redeploy dance
  (see CLAUDE.md) — onboarding scripts don't replace that.

## What's intentionally NOT automated

- Client account signups + admin invites (human/legal step).
- The copy voice pass (Checkpoint 1) — the scrape gives raw material;
  finished prose is a human edit. This is by design.
- Nameserver moves into the client's CF account (client/registrar step).
  Everything after that is `90-domain-cutover.js`.
