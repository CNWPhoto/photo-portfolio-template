// Resolve a CTA link object (or nav link object) to an href string.
// See docs/page-builder-spec.md §8.
//
// The optional second argument accepts a list of hostnames considered
// "self" — if an external link's hostname matches any entry, the link is
// rewritten to a relative path. Defense against absolute-URL CTAs that
// got pasted into the "External URL" field when they should have been
// internal links. Keeps generated HTML portable across domains
// (cnw-photo-demo.pages.dev, client.com, www.client.com, etc.).
//
// Callers typically pass `[Astro.url.hostname]`; pages with access to
// `seoSettings.siteUrl` can add its hostname too for coverage when the
// request host differs from the canonical host.

function stripSelfOrigin(url, selfHostnames) {
  if (!url || !selfHostnames?.length) return url
  try {
    const u = new URL(url)
    if (selfHostnames.includes(u.hostname)) {
      return u.pathname + u.search + u.hash
    }
  } catch {
    /* not an absolute URL — leave as-is */
  }
  return url
}

// Map a dereferenced internal doc to its public URL. The slugless
// singletons each have a fixed route (homepagePage → '/', portfolio →
// '/portfolio', blogPage → '/blog'); only `page` docs carry a slug. The
// doc must have been fetched with `_type` projected, e.g.
// `internal->{ _type, "slug": slug.current }`.
// Paths are emitted slashed to match astro.config `trailingSlash: 'always'`
// so internal CTAs don't eat a 308 redirect hop on every click.
function pathForInternal(doc) {
  if (!doc) return null
  if (doc._type === 'homepagePage') return '/'
  if (doc._type === 'portfolio') return '/portfolio/'
  if (doc._type === 'blogPage') return '/blog/'
  const slug = doc.slug?.current || doc.slug
  if (!slug) return null
  return slug === 'home' ? '/' : `/${slug}/`
}

export function resolveLink(link, selfHostnames = null) {
  if (!link) return null

  // Nav-link shape: { linkType, url, internalRef }
  if (link.linkType) {
    if (link.linkType === 'external') return stripSelfOrigin(link.url || null, selfHostnames)
    if (link.linkType === 'internal') {
      const path = pathForInternal(link.internalRef)
      if (!path) return stripSelfOrigin(link.url || null, selfHostnames)
      return path
    }
    return stripSelfOrigin(link.url || null, selfHostnames)
  }

  // ctaLink shape: { type, internal, external, anchor }
  // The `type` radio and the target sub-field are separate controls, so
  // editors routinely pick a page / paste a URL but leave type at its
  // 'none' default — the link then silently never renders. When type is
  // unset/'none' but exactly one target is populated, infer it. A true
  // "no link" still resolves to null because no target is populated.
  let type = link.type
  if (!type || type === 'none') {
    if (link.internal) type = 'internal'
    else if (link.external) type = 'external'
    else if (link.anchor) type = 'anchor'
    else return null
  }
  if (type === 'external') return stripSelfOrigin(link.external || null, selfHostnames)
  if (type === 'anchor') {
    const a = link.anchor
    if (!a) return null
    return a.startsWith('#') ? a : `#${a}`
  }
  if (type === 'internal') return pathForInternal(link.internal)
  return null
}
