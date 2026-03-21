import type { APIRoute } from 'astro'

export const GET: APIRoute = ({ request, cookies, redirect }) => {
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')
  const redirectTo = url.searchParams.get('redirect') || '/'

  const previewSecret = import.meta.env.SANITY_PREVIEW_SECRET

  if (!previewSecret || secret !== previewSecret) {
    return new Response('Invalid preview secret', { status: 401 })
  }

  cookies.set('__sanity_preview_secret', secret, {
    path: '/',
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    maxAge: 60 * 60,
  })

  return redirect(redirectTo, 307)
}
