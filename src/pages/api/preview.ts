import type { APIRoute } from 'astro'
// Astro 6 / @astrojs/cloudflare v13: runtime secrets via this virtual
// module (request-scoped), replacing the removed Astro.locals.runtime.env.
import { env as cloudflareEnv } from 'cloudflare:workers'

// Sanity Presentation generates an ephemeral `sanity-preview-secret` per open
// and we validate it by round-tripping to the Sanity API with our viewer token.
// Imports are deferred to request time so the route still registers even if
// @sanity/preview-url-secret or the Sanity client fails at module-load time
// (which on Cloudflare Workers causes the whole route to be unavailable).

export const GET: APIRoute = async ({ request }) => {
  // Read token from multiple sources in priority order:
  // 1. Cloudflare Workers runtime env (secrets, set via CF dashboard)
  // 2. import.meta.env (build-time bundled, for local dev)
  // 3. process.env (Node fallback)
  const token =
    (cloudflareEnv as any)?.SANITY_API_READ_TOKEN ||
    import.meta.env.SANITY_API_READ_TOKEN ||
    (typeof process !== 'undefined' ? process.env?.SANITY_API_READ_TOKEN : undefined)

  if (!token) {
    return new Response(
      'Preview mode is not configured. SANITY_API_READ_TOKEN is not set on this deployment. ' +
        'On Cloudflare Workers, upload it via `wrangler secret` (the deploy workflow does this) and redeploy.',
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

  // Presentation runs the site as a cross-site iframe inside Studio, so
  // __sanity_preview is a THIRD-PARTY cookie. Chrome / Safari ITP / Firefox
  // all block plain SameSite=None third-party cookies now, which silently
  // turns off draft rendering (isPreview=false) in the iframe — no overlays,
  // no "Documents on this page". `Partitioned` (CHIPS) opts the cookie into
  // partitioned storage so it's allowed in the iframe while staying isolated
  // per top-level site. Requires Secure + SameSite=None (both set).
  //
  // Astro's cookie helper has no `partitioned` option yet, so the Set-Cookie
  // header is written manually and the response returned directly (can't use
  // the `redirect()` helper, which would emit its own headers).
  const cookie =
    `__sanity_preview=true; Path=/; Max-Age=3600; HttpOnly; Secure; ` +
    `SameSite=None; Partitioned`
  return new Response(null, {
    status: 307,
    headers: { Location: safeRedirect, 'Set-Cookie': cookie },
  })
}
