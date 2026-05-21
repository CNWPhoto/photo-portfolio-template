import { defineMiddleware } from 'astro:middleware'

// Match the document responses we want to treat as cacheable HTML.
// Static assets / images / API routes are untouched.
const HTML_CONTENT_TYPES = ['text/html', 'application/xhtml+xml']

export const onRequest = defineMiddleware(async (context, next) => {
  const isPreview = context.cookies.get('__sanity_preview')?.value === 'true'
  context.locals.isPreview = isPreview
  const response = await next()

  const contentType = response.headers.get('content-type') || ''
  const isHtml = HTML_CONTENT_TYPES.some((ct) => contentType.includes(ct))
  const isGet = context.request.method === 'GET'
  if (!isHtml) return response

  // Browser-facing Cache-Control: never disk-cache HTML. SSR pages pull
  // draft/published content from Sanity per request, so a browser-cached
  // copy would hide the editor's own publish until a hard refresh — every
  // support ticket would start with "try incognito." This header keeps
  // both the direct tab and Studio's Presentation iframe always fresh
  // against the worker.
  response.headers.set('Cache-Control', 'no-store, must-revalidate')

  // Edge cache via Cloudflare's CDN-Cache-Control header (independent of
  // the browser Cache-Control above). On a custom domain, CF's edge keeps
  // the rendered HTML for 5 min, so visitor traffic largely never invokes
  // the worker — keeping per-client sites comfortably under the Workers
  // Free CPU + invocation limits. On *.workers.dev subdomains this is a
  // no-op (CF doesn't cache workers.dev responses), so the header is
  // dormant until each client migrates DNS.
  //
  // Three guards keep the cache safe:
  //   1. GET only — mutations and form posts always run.
  //   2. Skip when the __sanity_preview cookie is set — Studio's preview
  //      iframe must see the latest drafts on every render, never a
  //      cached snapshot.
  //   3. Only the directives Cloudflare honors per their docs (public /
  //      s-maxage / must-revalidate). stale-while-revalidate isn't on
  //      the allow-list and would BYPASS the whole header.
  if (isGet && !isPreview) {
    response.headers.set(
      'Cloudflare-CDN-Cache-Control',
      'public, s-maxage=300, must-revalidate',
    )
  }

  return response
})
