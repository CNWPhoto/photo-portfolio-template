# Embedded Studio — per-client rollout runbook

How to move a client from the hosted `*.sanity.studio` to the on-domain
embedded Studio at `theirsite.com/studio`. Piloted on the demo (`cnw-photo-demo`)
2026-07-12. Do **1–2 friendly clients first**, live with it ~2 weeks, then fan out.

Model: **embedded-primary, hosted dormant.** The client-facing editor becomes
`/studio`; the old hosted Studio is *hidden* (kept as a break-glass), not deleted.
Content never moves — it stays in Sanity's Content Lake either way.

---

## Before you start (one-time, template side)
- [ ] The embedded-Studio changes are backported into the Singletrack template
      (embed + Presentation + AI Assist gate + curated structure + singleton "+"
      filter + agency top bar + Dashboard bridge/manifest).
- [ ] Pinned deps match across forks: `sanity 6.3.0`, `@sanity/ui 3.3.5`,
      `styled-components 6.3.11`, `react-is 19.2.7`, `@sanity/assist 6.1.10`, and
      the `rxjs` entry in `astro.config.mjs` `resolve.dedupe`.

## Per client

### 1. Sync the fork
- [ ] Merge the template's embedded-Studio changes into the client repo.
- [ ] Confirm they're **not frozen** from the fan-out (check `deploy.yml` /
      `FROZEN_SLUGS`) before deploying.

### 2. Build env (client's GitHub Environment `client-<slug>`)
- [ ] `PUBLIC_SANITY_PROJECT_ID` / `PUBLIC_SANITY_DATASET` — their project (usually already set).
- [ ] `PUBLIC_SANITY_AI_ASSIST=true` **only if** they're on a Growth plan/trial and want AI Assist. (It renders regardless but only *functions* on Growth.)

### 3. Deploy `/studio`
- [ ] Deploy via the normal promotion (`main → production`) or a single-client
      `workflow_dispatch` with `only_client=<slug>`. The build serves `/studio`
      and regenerates the Dashboard manifest at `/studio/static/` automatically.

### 4. CORS — **per project, per domain** (manage.sanity.io → their project → API → CORS Origins)
- [ ] Add `https://<their-domain>` with **Allow credentials** checked.
- ⚠️ This does **not** carry over from other clients or the demo. Missed/typo'd
      origin = broken login. This is the #1 thing that bites.

### 5. Register the embedded Studio with the Dashboard (manage.sanity.io → their project → **Studios**)
- [ ] Add studio URL: `https://<their-domain>/studio`.
- [ ] Run `sanity schema deploy` against their project once (or wire a
      `SANITY_AUTH_TOKEN` deploy-token secret into CI to keep schema in sync).
- Bridge script + served manifest are already in the build — no code step here.

### 6. Test on their production `/studio` (their data differs from the demo)
- [ ] Login works (CORS).
- [ ] Open a doc → edit → **publish** → change appears on their live site.
- [ ] **Presentation** previews *their* content in draft mode (spot-check custom pages, their blog base).
- [ ] Structure groups + "+" menu look right against their content.
- [ ] Homepage / galleries render and stay fast; **zero Studio JS** on public pages.
- [ ] Deep-link refresh inside `/studio` doesn't 404.

### 7. Communicate (see email template below)
- [ ] Email the client the new link **before** retiring the old one.

### 8. Retire the old hosted Studio (manage.sanity.io → their project → **Studios** → ⋯)
- [ ] **"Hide in Dashboard"** (keeps it as a hidden break-glass), or
      `npx sanity undeploy` to remove it entirely. Do this **after** they confirm
      the new link works.

### 9. Verify the funnel
- [ ] `sanity.io/welcome` (Dashboard) shows/opens the **embedded** `/studio`; the old one is not clickable.

---

## Rollback
- `/studio` broken after a deploy → `wrangler rollback` the client's Worker
  (see `docs/emergency-playbook.md`).
- Client locked out during a site outage → re-show / re-`sanity deploy` the
  hosted Studio as break-glass.

## Caveats to remember
- **`astro dev` can't preview the embedded Studio** (CF-adapter hydration bug) —
  use `npm run build && npm run preview`. Schema/component dev still uses the
  standalone `studio/` via `sanity dev`.
- **AI Assist** is a Growth-plan feature; on Free it renders but doesn't work.
- The **manifest** auto-regenerates on every `npm run build`; only `sanity schema
  deploy` needs a token (for CI).
- The **Upgrade ⚡** navbar CTA has no supported removal (usually absent on paid).
- A raw `*.sanity.studio` **bookmark** dies after undeploy — handled by comms.

## Client email template

> **Subject:** Your website editor has a new home
>
> Hi [name],
>
> Quick heads-up: your website's content editor now lives right on your own site
> at **https://[their-domain]/studio** — please use this from now on and bookmark it.
>
> Nothing about how you log in changes — it's the **same account** you already use.
> Your content, drafts, and history are all exactly where they were.
>
> The old editing link will be retired shortly, so please switch to the new one.
> Questions? Reply here or drop them in our Heartbeat community.
>
> Thanks,
> [you]
