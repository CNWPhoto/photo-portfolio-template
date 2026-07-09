import { describe, it, expect } from 'vitest'
// @ts-expect-error — plain JS module, no types
import { canonPath } from '../src/lib/previewPath.js'

const BASE = 'https://cnw-photo-demo.connor-213.workers.dev/about/'

describe('canonPath — trailing-slash canonicalization', () => {
  it('adds a trailing slash to a bare page path', () => {
    expect(canonPath('/about', BASE)).toBe('/about/')
  })

  it('leaves an already-slashed path unchanged', () => {
    expect(canonPath('/about/', BASE)).toBe('/about/')
  })

  it('leaves the root path as "/"', () => {
    expect(canonPath('/', BASE)).toBe('/')
  })

  it('THE BUG: a slash-less echo equals the slashed browser location', () => {
    // Studio echoes "/about"; the browser sits at "/about/" (301 canonical).
    // These MUST compare equal or the anti-bounce guard silently misses.
    expect(canonPath('/about', BASE)).toBe(canonPath(BASE, BASE))
  })

  it('reduces a full URL to its canonical path', () => {
    expect(canonPath('https://x.dev/contact', BASE)).toBe('/contact/')
    expect(canonPath('https://x.dev/contact/', BASE)).toBe('/contact/')
  })

  it('keeps the slash before query and hash', () => {
    expect(canonPath('/blog/post?page=2', BASE)).toBe('/blog/post/?page=2')
    expect(canonPath('/blog/post#top', BASE)).toBe('/blog/post/#top')
  })

  it('handles nested paths', () => {
    expect(canonPath('/blog/my-first-post', BASE)).toBe('/blog/my-first-post/')
  })

  it('does not append a slash to file-like segments', () => {
    expect(canonPath('/sitemap.xml', BASE)).toBe('/sitemap.xml')
    expect(canonPath('/rss.xml', BASE)).toBe('/rss.xml')
  })

  it('is idempotent', () => {
    const once = canonPath('/about', BASE)
    expect(canonPath(once, BASE)).toBe(once)
  })

  it('strips Sanity preview control params (perspective churn)', () => {
    expect(canonPath('/portfolio/?sanity-preview-perspective=drafts', BASE)).toBe('/portfolio/')
    expect(canonPath('/portfolio?sanity-preview-perspective=drafts', BASE)).toBe('/portfolio/')
    // a bare page and its perspective-qualified twin canonicalize equal
    expect(canonPath('/portfolio/?sanity-preview-perspective=drafts', BASE)).toBe(
      canonPath('/portfolio/', BASE),
    )
  })

  it('keeps NON-sanity query params while dropping sanity ones', () => {
    expect(canonPath('/blog/post?page=2&sanity-preview-perspective=drafts', BASE)).toBe(
      '/blog/post/?page=2',
    )
  })
})
