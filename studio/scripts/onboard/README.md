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

# REQUIRED after the seed — strips the donor's drafts, demo badge, and
# seoSettings.siteUrl. Skipping it leaves the client's siteUrl pointing at the
# DEMO, which is how blackbird + kelly-mac shipped claiming the demo's domain
# (found + repaired fleet-wide 2026-07-26). This step used to be missing from
# this runbook; that omission was the bug.
cd studio && npx dotenv -e .env.<slug>-backup -- \
  npx sanity exec scripts/onboard/55-post-seed-clean.js --with-user-token -- \
  --slug=<slug> --apply
cd ..

# Overlay reads its project from the env dotenv supplies at launch — pass the
# client's backup directly. Do NOT copy it over studio/.env: that mutates
# global state for every later command, and studio/sanity.config.js falls back
# to the DEMO project when SANITY_STUDIO_PROJECT_ID is unset, so a failed or
# interrupted restore silently points subsequent writes at cnw-photo-demo.
# (60/65/67 also call assertProject() and refuse to run on a mismatch.)
cd studio && npx dotenv -e .env.<slug>-backup -- \
  npx sanity exec scripts/onboard/60-overlay.js --with-user-token -- \
  --slug=<slug> --palette=<forest-sage|classic-cream|warm-studio|dark-editorial|cool-minimal>
cd ..

# REQUIRED after anything that creates sections by script — and BEFORE the
# client is given Studio access. It rewrites documents, so run it while the
# dataset is still yours. Do NOT retro-run it on an established client: their
# sections predate it and rewriting live documents to fix cosmetic blanks is
# not worth the risk to content someone is actively editing. `initialValue` is a
# Studio-client concept — it is NOT applied server-side, so every section a
# script writes stores those fields as undefined. The site renders (components
# carry their own fallbacks) but in Studio the controls come up BLANK: no
# Background Tone selected, no Image Layout, and the editor can't tell what a
# section does without changing it to find out. Harvests initialValue from the
# real schema, so it can never drift. Verified non-destructive: 220 fields on
# heidi-adler-photography, 7/9 rendered pages byte-identical afterwards.
cd studio && npx dotenv -e .env.<slug>-backup -- \
  npx sanity exec scripts/onboard/78-apply-schema-defaults.js --with-user-token -- \
  --slug=<slug> --apply
cd ..

# SIGN-OFF GATE — the last thing you run. Asserts the OUTCOME of every step
# above by reading the dataset, this repo and GitHub, so a step that was
# skipped, half-run, or later undone by an editor all fail the same way.
# Exit 1 = not ready. See "Why a gate, not a checklist" below.
cd studio && npx dotenv -e .env.<slug>-backup -- \
  npx sanity exec scripts/onboard/79-signoff.js --with-user-token -- --slug=<slug>
cd ..

# PAGE FIDELITY GATE — run before telling anyone the migration is done.
# Diffs the LIVE rendered pages against the ORIGINAL site (not the staged
# scrape, which is itself suspect — it discovers from sitemap.xml, and
# Squarespace routinely under-lists). Hard-fails on: missing/duplicate <h1>,
# donor copy, text coverage below --min-text, images far below the source's
# count, empty hrefs. Exit 1 blocks sign-off. See "Page migration fidelity"
# below for what each check catches and why it exists.
cd studio && npx dotenv -e .env.<slug>-backup -- \
  npx sanity exec scripts/onboard/68-verify-pages.js --with-user-token -- \
  --slug=<slug> --live=<new site url> --source=<old site url> \
  --map=/investment/:/productsandpricing        # only where paths differ
cd ..

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

# REQUIRED after the first deploy. 55-post-seed-clean BLANKED seoSettings
# .siteUrl so the client couldn't inherit the demo's domain — but nothing set
# their own until 90-domain-cutover, which doesn't run until the domain moves.
# Result: every pre-cutover client shipped with NO CANONICAL TAG on any page.
# Found on heidi-adler-photography 2026-08-01; the fleet health check had been
# failing every run since her launch. Derives the origin from the env-backup,
# so it needs nothing new. 90-domain-cutover overwrites it at cutover.
cd studio && npx dotenv -e .env.<slug>-backup -- \
  npx sanity exec scripts/onboard/75-siteurl.js --with-user-token -- \
  --slug=<slug> --apply
cd ..

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

## Why a gate, not a checklist — `79-signoff.js`

**A runbook is a document, and documents get skipped.** Three separate live bugs
in this repo trace to exactly that, and each stayed invisible for weeks:

| what was skipped | what shipped |
|---|---|
| `55-post-seed-clean` was missing from this flow entirely | every client from that runbook inherited the DEMO's `siteUrl` (blackbird, kelly-mac) |
| nothing set a client's own `siteUrl` before cutover | pre-cutover clients had **no canonical tag on any page** (heidi — the nightly health check failed from launch) |
| script-created sections never got schema defaults | every Studio control blank; editors can't see what a section does |

So the answer to "how do I make sure every step is followed" is **not** a
tick-list, and not a "step N completed" flag — a flag is just one more thing
that can be wrong. `79-signoff.js` asserts the OUTCOME each step is supposed to
produce, read back from the dataset, this repo and GitHub. A step that was
never run, half-run, run against the wrong project, or later undone by an
editor all fail identically, because it never asks what happened — only what is
true now.

Run it last, and treat exit 1 as "not ready to hand over". Two gates total:
`79-signoff` (was the plumbing done) and `68-verify-pages` (does the content
match the source).

It is also an **audit tool for existing clients** — run it against any slug to
see what a client is missing today, not just at onboarding.

Keep it honest: a gate that cries wolf gets ignored. The typography check
originally demanded `headingFont` + `bodyFont` and flagged every established
client, all of which legitimately use a preset `fontTheme` instead. If a check
fires on a healthy site, fix the check.

## Page migration fidelity — `68-verify-pages.js`

**Run before sign-off on every migration.** The blog side got `66-verify-blog.js`
after the PIF import "ran clean" while silently losing content. Pages had no
equivalent, and the same class of failure duly recurred on the Heidi Adler
migration (2026-07-31): donor copy still rendering, two pages missing ~75% of
their text, per-section images never placed, **six of nine pages shipped with no
`<h1>` at all**, and a meta description written to a field the schema doesn't
define. Every one of those is mechanically detectable — none were caught by
eyeballing, because eyeballing is what produced them.

It compares against the **original site**, not the staged scrape, because the
scrape is a suspect: it discovers pages and images from `sitemap.xml`, and
Squarespace routinely omits real pages from it (Heidi's `/portfolio` and
`/productsandpricing` were both absent, taking 138 of 184 images with them).

Hard fails (exit 1 — resolve before sign-off):

- [ ] **Exactly one `<h1>`** per page. Full-bleed banners and split sections
      render `<h2>`; a page that opens with one has no `h1` at all.
- [ ] **No donor copy.** Matches a marker list — extend `DONOR_MARKERS` whenever
      a new one slips through. A false positive costs a glance; a false negative
      ships to a client.
- [ ] **Text coverage ≥ `--min-text`** (default 0.9), measured as word-level
      coverage of the source's body copy. Word-level, not sentence-level: a
      faithful migration re-splits sections constantly, which breaks sentence
      boundaries while losing nothing.
- [ ] **Image count** not far below the source's. Catches the specific failure
      where pages get the right words and one token image each.
- [ ] **No empty `href`.** Catches nav/footer links stored in the wrong shape —
      Heidi's three footer links were `navLink`-shaped in a `footerLink` field,
      so they rendered as nothing at all.
- [ ] **Canonical tag present, pointing at this site.** Absent means
      `seoSettings.siteUrl` is unset — run `75-siteurl.js`. This is the check
      that would have caught the pre-cutover canonical gap immediately instead
      of via a nightly health-check email.

Warnings (eyeball, don't block): missing meta description, internal links
without a trailing slash, empty quotation marks (an unpopulated testimonial),
`href="#"` counts, and uploaded images referenced by nothing.

`--json` emits a machine-readable report. Chrome is stripped from both sides
before diffing, so a deliberately restructured nav never fails the run.

## Blog migration fidelity checklist (Squarespace/WordPress → Sanity)

**Run this AFTER `65-blog-import`, BEFORE telling the client the blog is done.** A migration
that "imported without errors" is NOT one that matches the source. The PIF Squarespace
migration (2026-07) ran clean but silently lost content that surfaced as complaints weeks
later — nine distinct bugs, every one invisible unless you diff the imported result against the
live source. The scraper/importer now fix all nine; this checklist catches regressions and
platform quirks the tooling doesn't yet know about.

> **Cross-platform:** the full, platform-agnostic audit (Squarespace / WordPress / Wix / SPA)
> lives in the vault at `wiki/patterns/migration-audit-checklist.md`. The items below are the
> Squarespace-flavored subset. Run the audit on EVERY migration, any source platform.

**Automate most of it with `66-verify-blog.js`** — it diffs the live dataset against the staged
scrape and asserts the mechanical items below (post/image/video counts, alt + excerpt coverage,
no title-duplicate leading heading, **no consecutive duplicate images**, category refs resolve,
no old-domain link leaks, no inline category-nav remnant). Read-only; exits non-zero on any hard
fail. Run it in the swapped client env, same dance as the import:

```sh
cd studio && npx sanity exec scripts/onboard/66-verify-blog.js --with-user-token -- --slug=<slug>
```

**Page SEO** — `67-page-seo.js` backfills each `page` doc's meta description + title tag from the
scrape (`pages-text.json`), FILL-ONLY so curated SEO survives:

```sh
cd studio && npx sanity exec scripts/onboard/67-page-seo.js --with-user-token -- --slug=<slug>
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
