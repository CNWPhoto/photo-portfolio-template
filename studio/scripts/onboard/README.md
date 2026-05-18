# Client onboarding runbook

Composable, re-runnable scripts that encode the manual onboarding we did
by hand for Coola / Lavon / Blackbird. Each step is independent — if one
fails, fix and re-run just that one. Numbered for order.

## Prerequisites (the client does these — cannot be automated)

1. Creates a Sanity org in their name → invites `connor@singletrackseo.com` as **Administrator**, then creates a project (dataset `production`) in that org.
2. Creates / logs into Cloudflare → invites Connor as **Super Administrator**.
3. Signs up at web3forms.com, clicks the verification email within 90s, sends Connor the access key.

You provide, from the above: the **Sanity project id**, a **Sanity Viewer API token** (sanity.io/manage → API → Tokens), a **scoped CF API token** + **CF account id**, and the **Web3Forms key**.

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
node studio/scripts/onboard/80-cf-provision.js --slug=<slug> \
  --cf-token=… --cf-account=… --sanity-read-token=… --preview-secret=…

git add .github/workflows/deploy.yml studio/.env.<slug>-backup
git commit -m "chore: onboard <slug>"
git push origin main                       # demo canary
git checkout production && git merge main --no-ff && git push origin production
git checkout main                          # back to dev

# ── Web3Forms (whenever the key arrives) ──────────────────────────────
#   Studio → Site & Theme → Web3Forms Access Key → paste → publish
```

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
- Custom domain / DNS (Phase 3) — separate, infrequent, per-client.
