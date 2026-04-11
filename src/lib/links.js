// Resolve a CTA link object (or nav link object) to an href string.
// See docs/page-builder-spec.md §8.

export function resolveLink(link) {
  if (!link) return null

  // Nav-link shape: { linkType, url, internalRef }
  if (link.linkType) {
    if (link.linkType === 'external') return link.url || null
    if (link.linkType === 'internal') {
      const slug = link.internalRef?.slug?.current || link.internalRef?.slug
      if (!slug) return link.url || null
      return slug === 'home' ? '/' : `/${slug}`
    }
    return link.url || null
  }

  // ctaLink shape: { type, internal, external, anchor }
  if (link.type === 'none' || !link.type) return null
  if (link.type === 'external') return link.external || null
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
