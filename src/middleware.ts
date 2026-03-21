import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (context, next) => {
  const previewSecret = import.meta.env.SANITY_PREVIEW_SECRET
  const cookieSecret = context.cookies.get('__sanity_preview_secret')?.value

  context.locals.isPreview = !!(previewSecret && cookieSecret === previewSecret)

  return next()
})
