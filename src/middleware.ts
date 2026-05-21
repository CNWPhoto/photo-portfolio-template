import { defineMiddleware } from 'astro:middleware'

// HTML responses are the only thing this middleware caches at the edge —
// static assets, images, and API responses are untouched.
const HTML_CONTENT_TYPES = ['text/html', 'application/xhtml+xml']

// 5 min on the edge. Long enough that even a busy site barely invokes the
// worker for visitor traffic; short enough that a publish appears live
// within a few minutes without needing a webhook → cache-purge integration.
// If we add that later, we can bump this much higher.
const CACHE_TTL_SECONDS = 300

export const onRequest = defineMiddleware(async (context, next) => {
  const isPreview = context.cookies.get('__sanity_preview')?.value === 'true'
  context.locals.isPreview = isPreview

  // Cloudflare runtime handles — exposed by @astrojs/cloudflare v13. Outside
  // the worker (local Astro `npm run dev`, unit tests) `runtime` is undefined
  // and the cache block below short-circuits, so the same middleware works
  // in every environment without a branch.
  const runtime: any = (context.locals as any).runtime
  const edgeCache = runtime?.caches?.default
  const waitUntil: ((p: Promise<unknown>) => void) | undefined = runtime?.ctx?.waitUntil

  // Three guards on what's safe to serve from cache:
  //   1. GET only — mutations and form posts always run.
  //   2. No __sanity_preview cookie — editors in Studio's Presentation
  //      iframe must hit the worker every time so drafts show up.
  //   3. Cache API is reachable. On *.workers.dev subdomains, CF's docs
  //      say Cache API operations are no-ops (silently). Cache.match()
  //      always returns undefined, Cache.put() silently drops — so the
  //      logic still runs, just degrades cleanly to "no edge caching"
  //      until a client migrates to a real domain.
  const cacheEligible = context.request.method === 'GET' && !isPreview && !!edgeCache

  // ── Cache lookup ──────────────────────────────────────────────────────
  if (cacheEligible) {
    try {
      const cached: Response | undefined = await edgeCache.match(context.request)
      if (cached) {
        // The stored entry has `Cache-Control: public, s-maxage=...` (CF
        // refuses to cache no-store responses). Rewrite to no-store on the
        // way out so the browser doesn't disk-cache the HTML — editors
        // must always pull a fresh worker render when they leave preview
        // mode, never a stale local copy.
        const headers = new Headers(cached.headers)
        headers.set('Cache-Control', 'no-store, must-revalidate')
        headers.set('X-Cache-Status', 'HIT')
        return new Response(cached.body, {
          status: cached.status,
          statusText: cached.statusText,
          headers,
        })
      }
    } catch {
      // A failed lookup must never bubble up; fall through to a fresh render.
    }
  }

  // ── Fresh render path ─────────────────────────────────────────────────
  const response = await next()

  const contentType = response.headers.get('content-type') || ''
  const isHtml = HTML_CONTENT_TYPES.some((ct) => contentType.includes(ct))
  if (!isHtml) return response

  // Browser-facing: HTML is never disk-cached, so editors and visitors
  // always pull the latest worker render (or edge-cached HTML when CF
  // delivers it before the worker is invoked).
  response.headers.set('Cache-Control', 'no-store, must-revalidate')
  response.headers.set('X-Cache-Status', 'MISS')

  // ── Cache write ───────────────────────────────────────────────────────
  // caches.default.put refuses responses whose Cache-Control includes
  // no-store / no-cache / private. We clone the response, rewrite the
  // Cache-Control to a public/s-maxage variant for the cache copy, and
  // store that. The browser still gets the no-store original.
  if (cacheEligible && response.status === 200) {
    try {
      const cacheBody = await response.clone().arrayBuffer()
      const cacheHeaders = new Headers(response.headers)
      cacheHeaders.set(
        'Cache-Control',
        `public, s-maxage=${CACHE_TTL_SECONDS}, must-revalidate`,
      )
      cacheHeaders.delete('X-Cache-Status') // would mis-label the next HIT
      const cacheableResponse = new Response(cacheBody, {
        status: response.status,
        statusText: response.statusText,
        headers: cacheHeaders,
      })

      // Fire-and-forget. waitUntil lets the worker stay alive long enough
      // to finish the write after the response is already on its way back
      // to the client — so the cache write never delays the visitor's
      // first request.
      const putPromise = edgeCache.put(context.request, cacheableResponse)
      if (waitUntil) waitUntil(putPromise)
      else putPromise.catch(() => {})
    } catch {
      // Cache write failure must not surface to the user.
    }
  }

  return response
})
