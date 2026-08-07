import { describe, it, expect } from 'vitest'
import { portableTextToString, isPortableText, renderLink, renderBody } from '../src/lib/portableText.js'

const block = (...texts: string[]) => ({
  _type: 'block',
  children: texts.map((text) => ({ _type: 'span', text })),
})

describe('isPortableText', () => {
  it('true for a non-empty array containing a block', () => {
    expect(isPortableText([block('hi')])).toBe(true)
  })
  it('false for empty array, strings, and non-block arrays', () => {
    expect(isPortableText([])).toBe(false)
    expect(isPortableText('hello')).toBe(false)
    expect(isPortableText([{ _type: 'span', text: 'x' }])).toBe(false)
    expect(isPortableText(null)).toBe(false)
  })
})

describe('portableTextToString', () => {
  // This drives JSON-LD fields that MUST be plain strings (FAQ answers,
  // article descriptions) — a regression here is a silent SEO break.
  it('trims a plain string', () => {
    expect(portableTextToString('  hello  ')).toBe('hello')
  })

  it('returns "" for empty / non-PT input', () => {
    expect(portableTextToString(null)).toBe('')
    expect(portableTextToString(undefined)).toBe('')
    expect(portableTextToString([])).toBe('')
    expect(portableTextToString(123 as any)).toBe('')
  })

  it('joins spans within a block with no separator', () => {
    expect(portableTextToString([block('Hel', 'lo')])).toBe('Hello')
  })

  it('joins separate blocks with a single space', () => {
    expect(portableTextToString([block('First'), block('Second')])).toBe('First Second')
  })

  it('ignores non-span children', () => {
    const mixed = {
      _type: 'block',
      children: [
        { _type: 'span', text: 'keep' },
        { _type: 'image', text: 'drop' },
        { _type: 'span', text: 'this' },
      ],
    }
    expect(portableTextToString([mixed])).toBe('keepthis')
  })

  it('drops empty blocks rather than emitting stray spaces', () => {
    expect(portableTextToString([block('A'), block(''), block('B')])).toBe('A B')
  })
})

describe('renderLink', () => {
  it('opens external http(s) links in a new tab with rel', () => {
    const html = renderLink('https://example.com', 'x')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('href="https://example.com"')
  })

  it('keeps INTERNAL links in the same tab (no target)', () => {
    for (const href of ['/lenaweepetcollective/category/business-spotlights', '/about', '#contact']) {
      const html = renderLink(href, 'x')
      expect(html).not.toContain('target="_blank"')
      expect(html).toContain(`href="${href}"`)
    }
  })

  it('tel: and mailto: stay in the same tab (they invoke apps, not tabs)', () => {
    expect(renderLink('tel:5551234567', 'call')).not.toContain('target="_blank"')
    expect(renderLink('mailto:a@b.com?subject=Hi&body=Yo', 'mail')).not.toContain('target="_blank"')
    // ampersand in a mailto query stays a single &amp; (not double-encoded)
    expect(renderLink('mailto:a@b.com?subject=Hi&body=Yo', 'mail')).toContain('subject=Hi&amp;body=Yo')
  })

  it('neutralizes javascript: and other unsafe schemes', () => {
    expect(renderLink('javascript:alert(1)', 'x')).toContain('href="#"')
  })
})

const inlineImage = {
  _type: 'image',
  _key: 'i1',
  asset: { _ref: 'image-abc123def456abc123def456abc123def456abcd-2000x1500-jpg' },
  alt: 'A test photo',
  caption: 'Caption here',
}

describe('inline images in rich text', () => {
  // The schema can offer an image block, but until the renderer handled the
  // `image` type it produced nothing at all — the exact "control that does
  // nothing" failure this codebase keeps hitting.
  it('renders an image block as a figure', () => {
    const html = renderBody([inlineImage])
    expect(html).toContain('<figure')
    expect(html).toContain('alt="A test photo"')
    expect(html).toContain('Caption here')
  })

  it('sets width/height from the asset ref so the page does not shift', () => {
    // Body images are not dereferenced by the section projection, so the
    // dimensions have to come from the ref string itself.
    const html = renderBody([inlineImage])
    expect(html).toContain('width="2000"')
    expect(html).toContain('height="1500"')
  })

  it('treats an image-only body as portable text', () => {
    // The old guard required at least one `block`, so a body containing just
    // an image rendered as an empty string.
    expect(isPortableText([inlineImage])).toBe(true)
  })

  it('ignores an image with no asset rather than emitting a broken tag', () => {
    expect(renderBody([{ _type: 'image', _key: 'x' }])).not.toContain('<img')
  })
})
