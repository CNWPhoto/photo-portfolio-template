# Page Builder Rewrite — Rollback Guide

Safety net for the page builder rewrite (see `docs/page-builder-spec.md`). If anything in Phase 1–13 breaks the site or destroys content, this doc tells you how to get back to where you started.

## Pre-rewrite snapshot (taken 2026-04-11)

**Code:**
- Last known-good commit: **`7d5c740`** — "expand page builder spec with comprehensive findings"
- Site-only baseline (before any spec work): **`ab6c593`** — "snapshot in-progress work before page builder rewrite"
- Branch with the spec: `about-page-builder`
- Branch the rewrite happens on: `page-builder-rewrite` (forked from `7d5c740`)

**Sanity dataset:**
- Backup file: `~/sanity-backup-2026-04-11.tar.gz` (7.7 MB)
- Contents: 34 documents + 33 assets from `production` dataset
- Project ID: `hx5xgigp`
- Created via: `cd studio && npx sanity dataset export production ~/sanity-backup-2026-04-11.tar.gz`

## Branch model

```
main (or wherever Cloudflare deploys from)
 │
 └── about-page-builder ─── 7d5c740 ────┐
                                          │
                                          └── page-builder-rewrite ─── (Phase 1, 2, 3, ... work happens here)
```

**Rule:** never push the `page-builder-rewrite` branch to a deploying branch (main / about-page-builder) until you've verified everything works locally. The live site stays frozen as long as you don't merge.

## Rollback scenarios

### Scenario A — "I want to abandon the rewrite entirely"

```bash
git checkout about-page-builder
git branch -D page-builder-rewrite
```

You're back exactly where you were before Phase 1 started. The Sanity dataset is unchanged because nothing destructive ran yet (no seed script, no schema deploys to clients).

### Scenario B — "Some phases worked, but a later one broke things"

Cherry-pick the working phases onto a fresh branch:

```bash
git log page-builder-rewrite --oneline
# Note the commits that are good vs broken

git checkout about-page-builder
git checkout -b page-builder-rewrite-v2
git cherry-pick <good-phase-1-commit>
git cherry-pick <good-phase-2-commit>
# ... etc
```

Then continue from where it broke, with corrections.

### Scenario C — "The seed script destroyed my Sanity content"

This only happens after Phase 11 runs. The seed script is supposed to be non-destructive (`_id` checks before creating), but if it goes wrong:

```bash
cd studio
npx sanity dataset import ~/sanity-backup-2026-04-11.tar.gz production --replace
```

The `--replace` flag overwrites the current production dataset with the snapshot. Takes ~3 seconds. **Before running, make absolutely sure the env vars point at the right project** — check `studio/.env` or whatever `SANITY_STUDIO_PROJECT_ID` is set to. You don't want to accidentally overwrite a different client's project.

### Scenario D — "I want to test the rewrite without touching production"

Create a staging dataset and point local Studio at it:

```bash
cd studio
npx sanity dataset create staging
SANITY_STUDIO_DATASET=staging npm run dev
```

Run the seed script against staging instead of production. Production stays untouched. Once verified, switch back to production and re-run the seed there.

## Pre-flight before any destructive phase

Before Phase 11 (the seed script) or Phase 12 (legacy cleanup) runs, take a fresh snapshot:

```bash
cd studio
npx sanity dataset export production ~/sanity-backup-pre-phase-11.tar.gz
```

Each phase that touches the dataset should be preceded by a snapshot. Stale snapshots are fine to delete after the phase succeeds.

## Cloudflare deployment safety

The Astro frontend deploys via Cloudflare Pages, triggered on push to whatever branch is wired up. **Do not push `page-builder-rewrite` to that branch** until:

1. All phases complete locally
2. `npm run build` passes
3. Local dev server (`npm run dev`) renders every page correctly
4. Phase 13 integration test passes

If you accidentally push and Cloudflare deploys broken code, two recovery options:

**Option 1 — Revert via git:**
```bash
git revert HEAD~1..HEAD
git push
```
Cloudflare redeploys the reverted code.

**Option 2 — Roll back via Cloudflare dashboard:**
Cloudflare Pages keeps the last N deployments. Dashboard → Pages → your project → Deployments → previous successful deploy → "Rollback to this deployment". Faster than a git revert if the dashboard is open.

## What's at risk vs what's safe

**Reversible (no permanent impact):**
- Code changes (git makes everything reversible)
- Sanity dataset state (snapshot above can fully restore)
- Cloudflare deployments (redeploy from any commit)

**Irreversible (real cost if lost):**
- Time spent on the rewrite (but the spec captures the design intent so re-attempting is straightforward)
- Sanity dataset state newer than the latest snapshot (mitigated by snapshotting before each destructive phase)

**Not at risk in this rewrite:**
- Live client sites (no live clients yet)
- Live client datasets (no live clients yet)
- Hosted Sanity Studio for any client (deployed manually per-client; this rewrite touches the template only)

## After the rewrite ships

Once the rewrite is verified and merged to `about-page-builder` / main / wherever Cloudflare deploys from, the snapshot files can be archived or deleted. Suggested archive location: `~/sanity-backups/` directory with date-stamped files.

The `7d5c740` and `ab6c593` commits stay in git history forever — they're the permanent rollback points if anything ever needs to look back at the pre-rewrite state.
