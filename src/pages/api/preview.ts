import type { APIRoute } from 'astro'
import { validatePreviewUrl } from '@sanity/preview-url-secret'
import { getClient } from '../../lib/sanity.js'

// Sanity Presentation generates an ephemeral `sanity-preview-secret` per open
// and we validate it by round-tripping to the Sanity API with our viewer token.
const tokenClient = getClient(false).withConfig({
  token: import.meta.env.SANITY_API_READ_TOKEN,
  useCdn: false,
})

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const { isValid, redirectTo = '/' } = await validatePreviewUrl(
    tokenClient,
    request.url,
  )

  if (!isValid) {
    return new Response('Invalid preview secret', { status: 401 })
  }

  // Only allow relative paths — block open-redirect to external URLs
  const safeRedirect =
    redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/'

  cookies.set('__sanity_preview', 'true', {
    path: '/',
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    maxAge: 60 * 60,
  })

  return redirect(safeRedirect, 307)
}
