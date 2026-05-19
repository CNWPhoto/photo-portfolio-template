import type { APIRoute } from 'astro'

// Sanity Presentation generates an ephemeral `sanity-preview-secret` per open
// and we validate it by round-tripping to the Sanity API with our viewer token.
// Imports are deferred to request time so the route still registers even if
// @sanity/preview-url-secret or the Sanity client fails at module-load time
// (which on Cloudflare Workers causes the whole route to be unavailable).

export const GET: APIRoute = async ({ request, cookies, redirect, locals }) => {
  // Read token from multiple sources in priority order:
  // 1. Cloudflare runtime env (secrets, set via CF Pages dashboard)
  // 2. import.meta.env (build-time bundled, for local dev and Vercel)
  // 3. process.env (Node fallback)
  const runtimeEnv = (locals as any)?.runtime?.env ?? {}
  const token =
    runtimeEnv.SANITY_API_READ_TOKEN ||
    import.meta.env.SANITY_API_READ_TOKEN ||
    (typeof process !== 'undefined' ? process.env?.SANITY_API_READ_TOKEN : undefined)

  if (!token) {
    return new Response(
      'Preview mode is not configured. SANITY_API_READ_TOKEN is not set on this deployment. ' +
        'On Cloudflare Pages, make sure it is set as a runtime env var or secret and the site has been redeployed.',
      { status: 500 },
    )
  }

  let validatePreviewUrl, getClient
  try {
    ;({ validatePreviewUrl } = await import('@sanity/preview-url-secret'))
    ;({ getClient } = await import('../../lib/sanity.js'))
  } catch (err) {
    return new Response(
      `Preview mode module load failed: ${err instanceof Error ? err.message : String(err)}`,
      { status: 500 },
    )
  }

  const tokenClient = getClient(false).withConfig({ token, useCdn: false })

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
