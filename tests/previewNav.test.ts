import { describe, it, expect } from 'vitest'
// @ts-expect-error — plain JS module, no types
import { isStaleBounce } from '../src/lib/previewNav.js'

const TTL = 20000
const NOW = 100000
// We're mid-navigation portfolio → wedding; marker records that pending hop.
const pending = { url: '/wedding-photography/', from: '/portfolio/', t: NOW - 800 }

describe('isStaleBounce — pending-navigation aware anti-bounce', () => {
  it('THE BOUNCE: Studio re-asserts the page we are leaving while the nav is pending → ignore', () => {
    expect(isStaleBounce(pending, '/portfolio/', NOW, TTL)).toBe(true)
  })

  it('a NEW forward navigation (not the page we left) is honored', () => {
    expect(isStaleBounce(pending, '/team/', NOW, TTL)).toBe(false)
  })

  it('an update confirming where we are HEADED is honored (not a bounce)', () => {
    expect(isStaleBounce(pending, '/wedding-photography/', NOW, TTL)).toBe(false)
  })

  it('no marker (settled / arrived) → nothing to bounce, honor', () => {
    expect(isStaleBounce(null, '/portfolio/', NOW, TTL)).toBe(false)
  })

  it('stale marker past TTL → honor (a genuine later back-click works)', () => {
    const old = { ...pending, t: NOW - (TTL + 1) }
    expect(isStaleBounce(old, '/portfolio/', NOW, TTL)).toBe(false)
  })

  it('malformed markers never throw and never falsely ignore', () => {
    expect(isStaleBounce({ from: '/portfolio/', t: NOW }, '/portfolio/', NOW, TTL)).toBe(false)
    expect(isStaleBounce({ url: '/w/', from: 5, t: NOW }, '/portfolio/', NOW, TTL)).toBe(false)
    expect(isStaleBounce({}, '/portfolio/', NOW, TTL)).toBe(false)
  })
})
