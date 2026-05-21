import { defineMiddleware } from 'astro:middleware'

// HTML responses are the only thing this middleware caches at the edge —
// static assets, images, and API responses are untouched.
const HTML_CONTENT_TYPES = ['text/html', 'application/xhtml+xml']

// 5 min on the edge. Long enough that even a busy site barely invokes the
// worker for visitor traffic; short enough that a publish appears live
// within a few minutes without needing a webhook → cache-purge integration.
const CACHE_TTL_SECONDS = 300

export const onRequest = defineMiddleware(async (context, next) => {
  const isPreview = context.cookies.get('__sanity_preview')?.value === 'true'
  context.locals.isPreview = isPreview

  // Cloudflare runtime handles — exposed by @astrojs/cloudflare v13. Outside
  // the worker (local Astro dev, unit tests) `runtime` is undefined and the
  // cache block short-circuits, so the same middleware works in every env.
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
        // Stored entries have `Cache-Control: public, s-maxage=...` (CF
        // refuses to cache no-store responses). Rewrite to no-store on
        // the way out so the browser doesn't disk-cache the HTML.
        // Buffer the body to a fresh ArrayBuffer — passing cached.body
        // (a ReadableStream) directly works, but the buffer is the
        // safer pattern with explicit ownership.
        const body = await cached.arrayBuffer()
        const headers = new Headers(cached.headers)
        headers.set('Cache-Control', 'no-store, must-revalidate')
        headers.set('X-Cache-Status', 'HIT')
        return new Response(body, {
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

  // Buffer the response body ONCE so we can return a clean Response to
  // the browser AND store a separate Response in the edge cache without
  // contending on the stream. Cloudflare's ReadableStream implementation
  // for cloned Response objects can lock the original when one branch is
  // consumed — symptom is an empty-body response to the client. The fix
  // is to read into a buffer once and construct fresh Responses from it.
  const body = response.status === 200 ? await response.arrayBuffer() : null

  if (body === null) {
    // Non-200 HTML response (e.g. our 404 page). Just stamp the
    // browser-facing Cache-Control and pass through unchanged.
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    return response
  }

  // Browser-facing Response: no-store so editors and visitors always pull
  // a fresh render (or edge-cached HTML if CF delivers it before the
  // worker is invoked).
  const browserHeaders = new Headers(response.headers)
  browserHeaders.set('Cache-Control', 'no-store, must-revalidate')
  browserHeaders.set('X-Cache-Status', 'MISS')
  const browserResponse = new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: browserHeaders,
  })

  // ── Cache write ───────────────────────────────────────────────────────
  // caches.default.put refuses responses with no-store / no-cache /
  // private Cache-Control, so the cache copy gets a public/s-maxage
  // variant. waitUntil keeps the worker alive long enough to finish the
  // write after the browser response is already on its way out, so the
  // write never delays the visitor's first request.
  if (cacheEligible) {
    try {
      const cacheHeaders = new Headers(response.headers)
      cacheHeaders.set(
        'Cache-Control',
        `public, s-maxage=${CACHE_TTL_SECONDS}, must-revalidate`,
      )
      cacheHeaders.delete('X-Cache-Status') // would mis-label the next HIT
      const cacheableResponse = new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: cacheHeaders,
      })
      const putPromise = edgeCache.put(context.request, cacheableResponse)
      if (waitUntil) waitUntil(putPromise)
      else putPromise.catch(() => {})
    } catch {
      // Cache write failure must not surface to the user.
    }
  }

  return browserResponse
})
