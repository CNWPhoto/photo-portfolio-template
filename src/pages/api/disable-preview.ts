import type { APIRoute } from 'astro'

// Clears the __sanity_preview cookie and bounces back to where the editor
// was (or `/` if no safe return path is supplied). Used by the preview
// banner's "View as visitor" link.
//
// Open-redirect guard: the `return` param must be a same-site path —
// starts with a single `/`, never `//evil.com` or `https://...`. Anything
// that doesn't match falls back to `/`.
export const GET: APIRoute = ({ url }) => {
  const ret = url.searchParams.get('return')
  const safe = ret && ret.startsWith('/') && !ret.startsWith('//') ? ret : '/'
  // Clear with the SAME attributes the cookie was set with in /api/preview
  // (Partitioned/Secure/SameSite=None) — a partitioned cookie won't be
  // cleared by a plain delete that omits those, so expire it explicitly.
  const expired =
    `__sanity_preview=; Path=/; Max-Age=0; HttpOnly; Secure; ` +
    `SameSite=None; Partitioned`
  return new Response(null, {
    status: 307,
    headers: { Location: safe, 'Set-Cookie': expired },
  })
}
