import { defineMiddleware } from 'astro:middleware'
import { getClient } from './lib/sanity.js'

// Configurable blog base path. Source of truth: blogPage.slug (the sitemap
// reads the same field). Cached per Worker isolate so this costs at most one
// Sanity read per cold isolate, not one per request. Default 'blog' → the
// routing block in onRequest is a no-op, so every other client is unaffected.
let _blogBase: string | undefined
// On fetch failure we fall back to 'blog' but only for 60s — permanently
// memoizing the error pinned a client's custom blog base to '/blog' for the
// whole isolate lifetime (an editor's slug change silently stopped routing).
let _blogBaseErrAt = 0
async function getBlogBase(): Promise<string> {
  if (_blogBase !== undefined) return _blogBase
  if (Date.now() - _blogBaseErrAt < 60_000) return 'blog'
  try {
    const slug = await getClient(false).fetch<string | null>(`*[_id=="blogPage"][0].slug.current`)
    _blogBase = ((slug || 'blog').replace(/^\/+|\/+$/g, '')) || 'blog'
    return _blogBase
  } catch {
    _blogBaseErrAt = Date.now()
    return 'blog'
  }
}

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

// Security headers for SSR HTML responses. `public/_headers` only applies to
// statically-served assets on Cloudflare — server-rendered pages bypass it
// entirely, so without this the pages ship with none of these.
//
// NOTE: deliberately NO `Content-Security-Policy: frame-ancestors` here.
// Presentation frames the SSR page inside the Sanity Studio, which is itself
// embedded in the Sanity dashboard — so the ancestor chain includes Sanity
// origins beyond *.sanity.studio. A frame-ancestors allowlist blocked the
// preview (regression, 2026-06-28). The SSR pages send no X-Frame-Options
// either, so framing stays unrestricted exactly as it was before security
// headers were added. (Clickjacking on draft-preview pages is low-value.)
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'X-XSS-Protection': '1; mode=block',
}
function applySecurityHeaders(headers: Headers): void {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v)
}

// Branded last-resort page for render failures (Sanity outage/timeout, or
// any uncaught exception during SSR). Deliberately static and fetch-free —
// when rendering is broken, this must not depend on anything that can also
// break. Served with 503 + Retry-After and never cached; the meta refresh
// retries for the visitor automatically once the blip passes.
const RENDER_FALLBACK_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="20">
<meta name="robots" content="noindex">
<title>Temporarily unavailable</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;background:#f5f3ef;color:#1a2744;text-align:center;padding:2rem}p{font-family:system-ui,sans-serif;color:#4a5568;line-height:1.6}</style>
</head><body><div><h1>We&rsquo;ll be right back</h1>
<p>This site is briefly unavailable while it reconnects.<br>It retries automatically &mdash; or refresh in a few seconds.</p>
</div></body></html>`

export const onRequest = defineMiddleware(async (context, next) => {
  // Preview mode: set by /api/preview after a valid Sanity preview-secret
  // handshake. Presentation runs the site in a third-party iframe, so the
  // cookie must survive that context — a value-only check keeps the
  // editor session working across iframe loads and the bridge's in-place
  // refreshes. (A prior signed-token version broke in-flight Presentation
  // sessions; see the 2026-06-01 session notes before reintroducing it.)
  const isPreview = context.cookies.get('__sanity_preview')?.value === 'true'
  context.locals.isPreview = isPreview

  // ── Embedded Sanity Studio (/studio) ──────────────────────────────────
  // The Studio SPA shell is served by @sanity/astro's injected
  // /studio/[...params] route. Render it straight through, but keep it out of
  // the search index (real X-Robots-Tag, since the injected route's <head>
  // carries no robots meta) and out of the edge cache (auth-bearing SPA, not
  // public content). Bypasses the blog-base rewrite + caching below entirely;
  // still gets the standard security headers.
  {
    const p = context.url.pathname
    if (p === '/studio' || p.startsWith('/studio/')) {
      const res = await next()
      res.headers.set('X-Robots-Tag', 'noindex, nofollow')
      res.headers.set('Cache-Control', 'no-store, must-revalidate')
      applySecurityHeaders(res.headers)
      return res
    }
  }

  // ── Legal-page aliases ────────────────────────────────────────────────
  // The Terms / Privacy pages physically live at /terms-and-conditions/ and
  // /privacy-policy/. A recurring footer-link mistake (and old-platform habit)
  // is /terms or /privacy, which 404s — seen on multiple client sites. 301 the
  // common short aliases to the real pages so every site's legal links work
  // regardless of what the editor pasted.
  {
    const p = context.url.pathname.replace(/\/+$/, '')
    if (p === '/terms' || p === '/terms-of-service' || p === '/tos') {
      return context.redirect('/terms-and-conditions/' + context.url.search, 301)
    }
    if (p === '/privacy') {
      return context.redirect('/privacy-policy/' + context.url.search, 301)
    }
  }

  // ── Configurable blog base path ───────────────────────────────────────
  // When blogPage.slug !== 'blog' (e.g. 'lenaweepetcollective'):
  //   • /<base>/…  renders the physical /blog/… routes (internal rewrite)
  //   • /blog/…    301s to /<base>/…  (canonical; no duplicate content)
  // locals.canonicalPath carries the public path so canonical tags +
  // breadcrumbs emit /<base>/… instead of the internal /blog/… .
  const blogBase = await getBlogBase()
  ;(context.locals as any).blogBase = blogBase
  let rewritePath: string | undefined
  if (blogBase !== 'blog') {
    const p = context.url.pathname
    if (p === '/blog' || p.startsWith('/blog/')) {
      return context.redirect(p.replace(/^\/blog/, `/${blogBase}`) + context.url.search, 301)
    }
    if (p === `/${blogBase}` || p.startsWith(`/${blogBase}/`)) {
      ;(context.locals as any).canonicalPath = p
      // Keep the query string — the blog listing paginates via ?page=N,
      // and next(pathname-only) silently dropped it, pinning every page
      // of a custom-base blog listing to page 1.
      rewritePath =
        p.replace(new RegExp(`^/${blogBase}`), '/blog') + context.url.search
    }
  }

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
      applySecurityHeaders(headers)
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      })
    }
  }

  // ── Fresh render path ─────────────────────────────────────────────────
  // Render guard: a Sanity outage/timeout (or any uncaught render error)
  // previously bubbled to Cloudflare's raw error page. Serve the branded
  // fallback instead — production only, so dev keeps Astro's error overlay.
  let response: Response
  try {
    response = rewritePath ? await next(rewritePath) : await next()
  } catch (err) {
    if (!import.meta.env.PROD) throw err
    console.error(
      '[ssr] render failed, serving fallback:',
      err instanceof Error ? err.stack || err.message : String(err),
    )
    const headers = new Headers({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, must-revalidate',
      'Retry-After': '30',
    })
    applySecurityHeaders(headers)
    return new Response(RENDER_FALLBACK_HTML, { status: 503, headers })
  }
  const contentType = response.headers.get('content-type') || ''
  const isHtml = HTML_CONTENT_TYPES.some((t) => contentType.includes(t))
  if (!isHtml) return response

  response.headers.set('Cache-Control', 'no-store, must-revalidate')
  response.headers.set('X-Cache-Status', 'MISS')
  applySecurityHeaders(response.headers)

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
