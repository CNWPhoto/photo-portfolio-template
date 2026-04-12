import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.isPreview = context.cookies.get('__sanity_preview')?.value === 'true'
  return next()
})
