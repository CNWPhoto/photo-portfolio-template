import { defineMiddleware } from 'astro:middleware'

// Match the document responses we never want browsers to disk-cache.
// Everything else (static assets, images, API routes) is untouched so they
// can still cache aggressively.
const NO_CACHE_CONTENT_TYPES = ['text/html', 'application/xhtml+xml']

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.isPreview = context.cookies.get('__sanity_preview')?.value === 'true'
  const response = await next()

  // SSR pages pull draft/published content from Sanity per request, so stale
  // browser cache means editors see their own publish as unchanged — and
  // every support call starts with "try incognito." We force no-store on HTML
  // responses so both the direct tab and the Studio Presentation iframe
  // always fetch the latest render.
  const contentType = response.headers.get('content-type') || ''
  if (NO_CACHE_CONTENT_TYPES.some((ct) => contentType.includes(ct))) {
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
  }

  return response
})
