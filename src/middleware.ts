import { defineMiddleware } from 'astro:middleware'
import { readEnv } from './lib/sanity.js'
import { verifyPreviewToken } from './lib/previewToken'

// HTML edge-caching at the Cloudflare Worker.
//
// SSR pages stream from the Worker on every request unless we cache them.
// On a custom domain, `caches.default` is a real CF edge cache: a `put`
// stores the rendered HTML, and the next request from the same colo skips
// the Worker entirely. On `*.workers.dev` Cache API is a documented no-op
// (match always misses, put silently drops) — the middleware still runs,
// it just degrades to "no caching."
//
// Why not `Astro.locals.runtime.caches` / `runtime.ctx`? Both removed in
// Astro v6 — those getters now throw on access. The global `caches` is
// the standard Workers API; `locals.cfContext` is Astro v6's replacement
// for `runtime.ctx` and exposes `waitUntil`.

const HTML_CONTENT_TYPES = ['text/html', 'application/xhtml+xml']
// Edge-cache lifetime for visitor HTML. Kept short so a publish appears to
// visitors within ~1 min (SSR site — no rebuild-on-publish; see sanity.js).
// Still elides ~98% of Worker invocations for typical traffic. Preview
// requests bypass the cache entirely.
const CACHE_TTL_SECONDS = 60

export const onRequest = defineMiddleware(async (context, next) => {
  // Preview mode is gated by a SIGNED cookie, not the mere presence of a
  // value. The cookie carries an HMAC token minted by /api/preview after a
  // valid Sanity preview-secret handshake; a hand-forged cookie fails
  // verification and is treated as a normal visitor. Only requests that
  // actually carry a cookie pay the verification cost — visitor traffic
  // (no cookie) short-circuits to isPreview=false.
  const previewCookie = context.cookies.get('__sanity_preview')?.value
  const isPreview = previewCookie
    ? await verifyPreviewToken(previewCookie, readEnv('SANITY_API_READ_TOKEN'))
    : false
  context.locals.isPreview = isPreview

  const cfContext: { waitUntil?: (p: Promise<unknown>) => void } | undefined =
    (context.locals as any).cfContext
  const waitUntil = cfContext?.waitUntil?.bind(cfContext)

  const edgeCache: Cache | undefined =
    typeof caches !== 'undefined' ? caches.default : undefined

  const cacheEligible =
    context.request.method === 'GET' && !isPreview && !!edgeCache

  // ── Cache lookup ──────────────────────────────────────────────────────
  if (cacheEligible) {
    const cached = await edgeCache!
      .match(context.request)
      .catch(() => undefined)
    if (cached) {
      // CF stores `public, s-maxage=...`. Rewrite to no-store on the way
      // out so browsers don't disk-cache the HTML.
      const headers = new Headers(cached.headers)
      headers.set('Cache-Control', 'no-store, must-revalidate')
      headers.set('X-Cache-Status', 'HIT')
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      })
    }
  }

  // ── Fresh render path ─────────────────────────────────────────────────
  const response = await next()
  const contentType = response.headers.get('content-type') || ''
  const isHtml = HTML_CONTENT_TYPES.some((t) => contentType.includes(t))
  if (!isHtml) return response

  response.headers.set('Cache-Control', 'no-store, must-revalidate')
  response.headers.set('X-Cache-Status', 'MISS')

  // ── Cache write ───────────────────────────────────────────────────────
  // Clone for the cache; the original streams straight to the browser.
  // Never await the body of either branch — Cloudflare's ReadableStream
  // implementation will lock the original if any branch is consumed.
  if (cacheEligible && response.status === 200) {
    const clone = response.clone()
    const cacheHeaders = new Headers(clone.headers)
    cacheHeaders.set(
      'Cache-Control',
      `public, s-maxage=${CACHE_TTL_SECONDS}, must-revalidate`,
    )
    cacheHeaders.delete('X-Cache-Status')
    // Strip headers that describe the streamed encoding we no longer own;
    // CF re-derives them when it serves the cached copy.
    cacheHeaders.delete('content-encoding')
    cacheHeaders.delete('content-length')
    cacheHeaders.delete('transfer-encoding')
    const toCache = new Response(clone.body, {
      status: clone.status,
      statusText: clone.statusText,
      headers: cacheHeaders,
    })
    const put = edgeCache!.put(context.request, toCache).catch(() => {})
    if (waitUntil) waitUntil(put)
  }

  return response
})
