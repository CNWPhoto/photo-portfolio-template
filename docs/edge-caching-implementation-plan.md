# Edge caching implementation plan

Cloudflare Cache API in Astro middleware, so visitor HTML serves from the CF edge instead of invoking the Worker on every request. Cuts Worker invocations by ~99% for typical traffic patterns, eliminates cold-start glitches, and improves Core Web Vitals (LCP / TTFB) which matters for SEO. **No cost change — Workers Free covers it.**

Two prior ship attempts crashed the demo Worker with `HTTP 404 + 0-byte body` (commits `cce5aba` and `0dd1872`, both reverted). This plan exists because we don't yet know the root cause and the retry needs to be diagnostic-first.

## Context pickup for the implementing session

Read this first before touching code:

- **Authorized approach**: provision a second Worker named `cnw-photo-cache-test` in Connor's existing CF account (same account as `cnw-photo-demo`). Deploy the experimental code there via local `wrangler deploy --name cnw-photo-cache-test`, NOT via GH Actions. Use `wrangler tail --name cnw-photo-cache-test` to capture the actual runtime error from the prior failed attempts. **Demo and all 5 clients stay untouched the entire time.**
- **Cache API does not work on `*.workers.dev`** per Cloudflare docs and our empirical verification. The test worker URL will be `cnw-photo-cache-test.connor-213.workers.dev` which is workers.dev → caching will be a no-op there. **Final verification must happen on a custom domain** — only Coola (`coolacreative.com`) qualifies today. Plan: use `cnw-photo-cache-test` to diagnose the crash; once the crash is fixed, do a one-off `workflow_dispatch only_client=coola-creative` deploy from the experimental branch to verify caching actually activates. Roll back instantly if anything goes wrong.
- **What we already know**: setting `Cache-Control` or `Cloudflare-CDN-Cache-Control` headers alone does NOT activate edge caching for Worker SSR responses. Cache API (`caches.default.match` / `put`) is required. The previous two crashes were both inside the `next()`-to-cache plumbing, not in the cache lookup itself. The likely root cause class is response-body / header reconstruction — see Step 1.
- **Worktree off `main`** so all experiments are isolated. Don't push the experimental branch to `main` until verification passes.
- **`wrangler tail` is the key tool** that wasn't used in the prior attempts. It surfaces the actual thrown error from the deployed Worker. The instant the test deploy 404s, `tail` will tell you why.

## Pre-flight checklist

Before any code changes:

- [ ] `wrangler` is installed locally and you can `wrangler login` to the demo CF account
- [ ] You can run `wrangler tail --name cnw-photo-demo` and see live request logs from the deployed demo
- [ ] You have a custom-domain client to test against. **Coola (`coolacreative.com`) is the only candidate today** — workers.dev does NOT support Cache API per CF docs, verified empirically. Testing on Karen's workers.dev URL would always show "no caching" regardless of code correctness.
- [ ] Create a worktree off `main` so the experimental code can't break the demo:
  ```sh
  git worktree add ../photo-portfolio-template-cache-experiment -b cache-experiment
  cd ../photo-portfolio-template-cache-experiment
  ```

## Step 1 — Reproduce the failure with logging on cnw-photo-cache-test

Before writing the fix, see the actual error. Copy the attempt #2 middleware from commit `0dd1872` (the buffer-and-reconstruct version), but wrap the body-handling block in instrumentation:

```ts
// Inside src/middleware.ts, after `const response = await next()`:
try {
  const body = await response.arrayBuffer()
  console.log('[mw] body bytes', body.byteLength, 'status', response.status)
  // ... rest of construction logic
} catch (err) {
  console.error('[mw] arrayBuffer threw:', err)
  throw err
}
```

Deploy the worktree branch to the `cnw-photo-cache-test` Worker via direct local wrangler — bypassing GH Actions, which is hard-coded to `cnw-photo-demo`:

```sh
# From the worktree directory, after npm install and npm run build:
cd dist
CLOUDFLARE_API_TOKEN=<demo-cf-token> CLOUDFLARE_ACCOUNT_ID=<demo-account-id> \
  npx wrangler deploy --name cnw-photo-cache-test
# The wrangler-action used by CI uses --name override, so this works.
```

Once deployed, tail it in a separate terminal:

```sh
CLOUDFLARE_API_TOKEN=<demo-cf-token> CLOUDFLARE_ACCOUNT_ID=<demo-account-id> \
  npx wrangler tail --name cnw-photo-cache-test
```

Then curl `https://cnw-photo-cache-test.connor-213.workers.dev/` and watch `tail` print the actual error. The CF tokens for the demo account live in the `demo` GH Environment — fetch via:

```sh
# Tokens never leave your local shell. They're not committed anywhere.
gh secret list --env demo
# Read the values from GitHub Settings → Environments → demo when prompted.
```

**Do not push the worktree branch to `main`.** The `main` push triggers the production demo deploy on `cnw-photo-demo`; we keep that stable. The experimental branch lives only locally + on `cnw-photo-cache-test`.

Then `wrangler tail --name <test-worker>` and curl the URL. The console.log/error lines tell you what's actually happening — likely candidates:

- `arrayBuffer threw: TypeError: Body is unusable` → Astro returned a streamed response that was already partially consumed somewhere upstream. **Fix**: don't read the body; use `response.clone()` for the cache copy and a fresh `Response(response.body, {headers, status})` for the browser, never `await`-ing the body.
- `body bytes 0 status 200` → SSR returned an empty body. Probably an Astro behavior change in v6 or an interaction with our existing middleware-modifies-response pattern. **Fix**: see Step 3.
- Error from the `new Response(body, {...})` line → a header in `response.headers` is forbidden when reconstructing. **Fix**: strip `content-encoding`, `content-length`, `transfer-encoding` from the copied headers.

## Step 2 — Read the working reference implementations

While `wrangler tail` is open, skim how other Astro-on-CF projects do this. Two known-good references:

1. **Astro's `@astrojs/cloudflare` docs** under "Headers" — they document the recommended caching pattern. Mirror their structure.
2. **The CF Workers Cache API recipe** at <https://developers.cloudflare.com/workers/examples/cache-using-fetch/> — even though it's a `fetch()` handler example, the body-handling pattern (`response.clone()` for cache, original to client, **never `await`** on the original's body) is the canonical reference.

Don't trust my prior attempts — both used patterns I synthesized rather than copied from a working reference. The retry should start from a copy of a documented working example and adapt it to Astro middleware, not the other way around.

## Step 3 — The implementation, expected shape

Once Step 1 tells you the actual failure cause, the corrected middleware should:

```ts
import { defineMiddleware } from 'astro:middleware'

const HTML = ['text/html', 'application/xhtml+xml']
const TTL = 300

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.isPreview =
    context.cookies.get('__sanity_preview')?.value === 'true'

  const runtime: any = (context.locals as any).runtime
  const cache = runtime?.caches?.default
  const waitUntil = runtime?.ctx?.waitUntil
  const cacheable =
    context.request.method === 'GET' &&
    !context.locals.isPreview &&
    !!cache

  // ── Lookup ──
  if (cacheable) {
    const hit = await cache.match(context.request).catch(() => undefined)
    if (hit) {
      const headers = new Headers(hit.headers)
      headers.set('Cache-Control', 'no-store, must-revalidate')
      headers.set('X-Cache-Status', 'HIT')
      return new Response(hit.body, {
        status: hit.status,
        statusText: hit.statusText,
        headers,
      })
    }
  }

  // ── Render ──
  const response = await next()
  const ct = response.headers.get('content-type') || ''
  if (!HTML.some((t) => ct.includes(t))) return response

  response.headers.set('Cache-Control', 'no-store, must-revalidate')
  response.headers.set('X-Cache-Status', 'MISS')

  // ── Cache write (clone, don't await body) ──
  if (cacheable && response.status === 200) {
    const clone = response.clone()
    const cacheHeaders = new Headers(clone.headers)
    cacheHeaders.set(
      'Cache-Control',
      `public, s-maxage=${TTL}, must-revalidate`,
    )
    cacheHeaders.delete('X-Cache-Status')
    // STRIP THESE — they describe the streamed encoding, which won't
    // match what CF actually stores after we hand it the clone:
    cacheHeaders.delete('content-encoding')
    cacheHeaders.delete('content-length')
    cacheHeaders.delete('transfer-encoding')
    const toCache = new Response(clone.body, {
      status: clone.status,
      statusText: clone.statusText,
      headers: cacheHeaders,
    })
    const put = cache.put(context.request, toCache).catch(() => {})
    if (waitUntil) waitUntil(put)
  }

  return response
})
```

The key changes from my failed attempts:

1. **Never `await response.arrayBuffer()`** on the response that's going back to the browser. The clone is what the cache.put consumes; the original streams straight to the client.
2. **Strip encoding headers** from the cached copy. They describe a stream we no longer own; CF will set the right ones on re-serve.
3. **`cache.put` returns a Promise but we don't `await` it inline.** `waitUntil` extends the Worker's lifetime to finish the write after the response has flushed.

## Step 4 — Verify before merging to main

On your test deploy (NOT main):

```sh
# First GET — should MISS
curl -sI https://<test-deploy>/ | grep -i 'x-cache\|cache-control'
# Expect:
#   x-cache-status: MISS
#   cache-control: no-store, must-revalidate

# Second GET, within 5 min — should HIT and be much faster
sleep 3
curl -sI -w 'time: %{time_total}\n' https://<test-deploy>/ | grep -i 'x-cache\|cache-control\|time'
# Expect:
#   x-cache-status: HIT
#   time: substantially less than the MISS request

# Preview-cookie GET — should bypass cache, always MISS
curl -sI -H 'Cookie: __sanity_preview=true' https://<test-deploy>/ | grep -i 'x-cache'
# Expect: x-cache-status: MISS
```

If all three lines match, the cache is working. Don't merge to main without seeing HIT on a real custom domain.

## Step 5 — Ship it

```sh
# In the worktree:
git checkout main
git merge cache-experiment
git push origin main   # triggers demo deploy
```

Watch the demo deploy:

```sh
gh run watch --workflow=deploy.yml
```

After demo success, verify the demo on its workers.dev URL — should show `X-Cache-Status: MISS` on every request (Cache API is a no-op on workers.dev, but no regression). If demo holds, fan out:

```sh
git checkout production
git merge main
git push origin production
```

Watch the matrix, verify Coola (the one custom-domain client) shows `cf-cache-status: HIT` on repeat requests. The four workers.dev clients won't show caching but won't be broken either.

Finally, clean up the worktree:

```sh
git worktree remove ../photo-portfolio-template-cache-experiment
git branch -d cache-experiment
```

## Future enhancement — Sanity webhook → CF cache purge

With caching active, a publish in Studio is invisible to visitors for up to 5 min (the TTL). Acceptable for most clients but obvious next-step polish:

- Set up a Sanity webhook on each client's project, fired on document publish
- Webhook target: a Worker route that calls CF's `purge_cache` API for that account
- Result: publishes are visible to visitors within seconds, not minutes

Cost: ~15 min per client during onboarding to set up the webhook. Not blocking; add when a client asks "why doesn't my publish show up immediately?"

## SEO impact note

Cache API doesn't directly affect SEO score, but the downstream effects do:

- **TTFB drops from ~150ms (warm SSR) → ~30ms (cached)** for visitor traffic. Google Core Web Vitals weighs TTFB → cached responses score better.
- **LCP improves** because cached HTML reaches the browser faster, so the largest image starts decoding sooner.
- **No cold-start glitches** — uncached cold-start requests can take 500ms+; cached requests are immune.
- **Same HTML content** delivered either way — no SEO content concern.

For a photographer's site with infrequent visitors, the per-visitor cold-start was the worst-case experience. Caching makes the worst case the same as the best case.
