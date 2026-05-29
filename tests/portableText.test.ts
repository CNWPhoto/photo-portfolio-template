import { describe, it, expect } from 'vitest'
import { portableTextToString, isPortableText } from '../src/lib/portableText.js'

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
