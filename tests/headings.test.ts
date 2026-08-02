import { describe, it, expect } from 'vitest';
import { firstHeadingIndex } from '../src/lib/headings.js';

// Every /about/ page on every client site shipped with no <h1>. Two causes,
// both encoded below: an image-only hero at position 0 renders no h1 and
// nothing downstream promotes, and Split/FullBleed/Steps/FeaturedPortfolio
// used to emit h2 even when they were the first section on the page.
describe('firstHeadingIndex', () => {
  it('gives the h1 to a hero that has a heading', () => {
    expect(
      firstHeadingIndex([
        { _type: 'heroSection', heading: 'Contact Heidi' },
        { _type: 'richTextSection', heading: 'Details' },
      ]),
    ).toBe(0);
  });

  it('skips an image-only hero and promotes the next section with a heading', () => {
    expect(
      firstHeadingIndex([
        { _type: 'heroSection' },
        { _type: 'splitSection', heading: 'Heidi and Jack here,' },
      ]),
    ).toBe(1);
  });

  it('promotes a splitSection that opens the page', () => {
    expect(firstHeadingIndex([{ _type: 'splitSection', heading: 'About' }])).toBe(0);
  });

  it('skips sections that render no heading at all', () => {
    expect(
      firstHeadingIndex([
        { _type: 'dividerSection' },
        { _type: 'pullQuoteSection', quote: 'not a heading' },
        { _type: 'testimonialsSection', heading: 'Reviews' },
        { _type: 'faqSection', heading: 'FAQs' },
      ]),
    ).toBe(3);
  });

  it('skips a disabled section', () => {
    expect(
      firstHeadingIndex([
        { _type: 'richTextSection', heading: 'Hidden', enabled: false },
        { _type: 'richTextSection', heading: 'Shown' },
      ]),
    ).toBe(1);
  });

  it('treats blank and whitespace-only headings as absent', () => {
    expect(
      firstHeadingIndex([
        { _type: 'richTextSection', heading: '' },
        { _type: 'richTextSection', heading: '   ' },
        { _type: 'richTextSection', heading: 'Real' },
      ]),
    ).toBe(2);
  });

  it('ignores stega markers, which make an empty string truthy', () => {
    // zero-width chars the preview client injects into every editable string
    expect(firstHeadingIndex([{ _type: 'richTextSection', heading: '​‌‍﻿' }])).toBe(-1);
  });

  it('returns -1 when nothing on the page can own an h1', () => {
    expect(firstHeadingIndex([{ _type: 'heroSection' }, { _type: 'dividerSection' }])).toBe(-1);
    expect(firstHeadingIndex([])).toBe(-1);
    expect(firstHeadingIndex(null as any)).toBe(-1);
  });

  it('never returns more than one owner (exactly one h1 per page)', () => {
    const sections = [
      { _type: 'heroSection', heading: 'One' },
      { _type: 'splitSection', heading: 'Two' },
      { _type: 'faqSection', heading: 'Three' },
    ];
    const owner = firstHeadingIndex(sections);
    const owners = sections.filter((_, i) => i === owner);
    expect(owners).toHaveLength(1);
    expect(owner).toBe(0);
  });
});
