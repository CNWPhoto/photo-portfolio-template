import { describe, it, expect } from 'vitest'
import { resolveLink } from '../src/lib/links.js'

// resolveLink resolves both nav-link and ctaLink shapes to an href, infers
// the link type when an editor leaves the radio at its default, maps the
// slugless singletons to their fixed routes, and rewrites absolute
// self-origin URLs to relative paths. All slashed to match trailingSlash.

describe('resolveLink — nav-link shape', () => {
  it('returns null for nullish input', () => {
    expect(resolveLink(null)).toBe(null)
    expect(resolveLink(undefined)).toBe(null)
  })

  it('external link passes through', () => {
    expect(resolveLink({ linkType: 'external', url: 'https://example.com/' })).toBe(
      'https://example.com/',
    )
  })

  it('external link to a self hostname is rewritten relative', () => {
    expect(
      resolveLink({ linkType: 'external', url: 'https://mysite.com/about/' }, ['mysite.com']),
    ).toBe('/about/')
  })

  it('internal ref to a page slug → slashed path', () => {
    expect(
      resolveLink({ linkType: 'internal', internalRef: { _type: 'page', slug: 'about' } }),
    ).toBe('/about/')
  })

  it('internal ref to singletons → fixed routes', () => {
    expect(resolveLink({ linkType: 'internal', internalRef: { _type: 'homepagePage' } })).toBe('/')
    expect(resolveLink({ linkType: 'internal', internalRef: { _type: 'portfolio' } })).toBe(
      '/portfolio/',
    )
    expect(resolveLink({ linkType: 'internal', internalRef: { _type: 'blogPage' } })).toBe('/blog/')
  })

  it('internal ref with no resolvable slug falls back to url', () => {
    expect(
      resolveLink({ linkType: 'internal', internalRef: { _type: 'page' }, url: 'https://x.com/' }),
    ).toBe('https://x.com/')
  })

  it('handles slug given as an object {current}', () => {
    expect(
      resolveLink({ linkType: 'internal', internalRef: { _type: 'page', slug: { current: 'team' } } }),
    ).toBe('/team/')
  })
})

describe('resolveLink — ctaLink shape with type inference', () => {
  it('infers internal when only internal target is set', () => {
    expect(resolveLink({ internal: { _type: 'page', slug: 'contact' } })).toBe('/contact/')
  })

  it('infers external when only external is set', () => {
    expect(resolveLink({ external: 'https://booking.com/' })).toBe('https://booking.com/')
  })

  it('infers anchor and prefixes #', () => {
    expect(resolveLink({ anchor: 'pricing' })).toBe('#pricing')
    expect(resolveLink({ anchor: '#pricing' })).toBe('#pricing')
  })

  it('type "none" with no targets resolves to null', () => {
    expect(resolveLink({ type: 'none' })).toBe(null)
    expect(resolveLink({})).toBe(null)
  })

  it('explicit type wins', () => {
    expect(resolveLink({ type: 'external', external: 'https://z.com/' })).toBe('https://z.com/')
  })

  it('internal "home" slug maps to /', () => {
    expect(resolveLink({ type: 'internal', internal: { _type: 'page', slug: 'home' } })).toBe('/')
  })
})
