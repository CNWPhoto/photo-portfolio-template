import type { APIRoute } from 'astro'

// Clears the __sanity_preview cookie and bounces back to where the editor
// was (or `/` if no safe return path is supplied). Used by the preview
// banner's "View as visitor" link.
//
// Open-redirect guard: the `return` param must be a same-site path —
// starts with a single `/`, never `//evil.com` or `https://...`. Anything
// that doesn't match falls back to `/`.
export const GET: APIRoute = ({ cookies, url, redirect }) => {
  cookies.delete('__sanity_preview', { path: '/' })
  const ret = url.searchParams.get('return')
  const safe = ret && ret.startsWith('/') && !ret.startsWith('//') ? ret : '/'
  return redirect(safe, 307)
}
