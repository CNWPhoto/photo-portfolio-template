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

export function resolveLink(link, selfHostnames = null) {
  if (!link) return null

  // Nav-link shape: { linkType, url, internalRef }
  if (link.linkType) {
    if (link.linkType === 'external') return stripSelfOrigin(link.url || null, selfHostnames)
    if (link.linkType === 'internal') {
      const slug = link.internalRef?.slug?.current || link.internalRef?.slug
      if (!slug) return stripSelfOrigin(link.url || null, selfHostnames)
      return slug === 'home' ? '/' : `/${slug}`
    }
    return stripSelfOrigin(link.url || null, selfHostnames)
  }

  // ctaLink shape: { type, internal, external, anchor }
  if (link.type === 'none' || !link.type) return null
  if (link.type === 'external') return stripSelfOrigin(link.external || null, selfHostnames)
  if (link.type === 'anchor') {
    const a = link.anchor
    if (!a) return null
    return a.startsWith('#') ? a : `#${a}`
  }
  if (link.type === 'internal') {
    const slug = link.internal?.slug?.current || link.internal?.slug
    if (!slug) return null
    return slug === 'home' ? '/' : `/${slug}`
  }
  return null
}
