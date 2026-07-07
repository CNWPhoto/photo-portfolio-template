// Canonicalize any URL or path to the site's trailing-slash convention.
//
// The site runs `trailingSlash: 'always'` (the server 301s "/about" →
// "/about/"), but Sanity Presentation echoes the slash-LESS form produced by
// the mainDocuments resolver. Comparing that raw form against the canonical
// browser location ("/about/") silently missed on every non-root page, so the
// preview bridge's same-URL and anti-bounce guards never fired — the root of
// the intermittent "jump back to the previous page" in Presentation.
//
// Returns pathname + search + hash, with a trailing slash on the pathname
// unless it's the root or a file-like last segment (has an extension). Works
// with a bare path ("/about"), a full URL, or in a non-browser test env (pass
// `base` explicitly; falls back to window.location or a localhost origin).
export function canonPath(u, base) {
  const fallbackBase =
    typeof window !== 'undefined' && window.location ? window.location.href : 'http://localhost/'
  let pathname, rest
  try {
    const url = new URL(u, base || fallbackBase)
    pathname = url.pathname
    rest = `${url.search}${url.hash}`
  } catch {
    // u wasn't parseable as a URL (and no usable base) — treat it as a path.
    const m = /^([^?#]*)([?#].*)?$/.exec(u || '/')
    pathname = (m && m[1]) || '/'
    rest = (m && m[2]) || ''
  }
  if (pathname !== '/' && !pathname.endsWith('/') && !/\.[^/]+$/.test(pathname)) {
    pathname += '/'
  }
  return `${pathname}${rest}`
}
