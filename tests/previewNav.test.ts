import { describe, it, expect } from 'vitest'
// @ts-expect-error — plain JS module, no types
import { navDecision } from '../src/lib/previewNav.js'

const TTL = 20000
const NOW = 100000

describe('navDecision — supersession-aware preview navigation', () => {
  it('organic load (no marker) → report', () => {
    expect(navDecision(null, '/about/', NOW, TTL)).toEqual({ report: true })
  })

  it('intended page (marker matches where we landed) → report + consume', () => {
    const marker = { url: '/about/', t: NOW - 500 }
    expect(navDecision(marker, '/about/', NOW, TTL)).toEqual({ report: true })
  })

  it('THE BOUNCE: a stale page mounts late while marker moved on → catch up, do NOT report', () => {
    // Studio's latest target is /contact/, but this slow /about/ page just
    // mounted. Reporting /about/ would drag Studio back → instead catch up.
    const marker = { url: '/contact/', t: NOW - 800 }
    expect(navDecision(marker, '/about/', NOW, TTL)).toEqual({ catchUp: '/contact/' })
  })

  it('THE DESYNC: intended page reports so Studio learns the real landing spot', () => {
    // Mirror case — the page Studio actually wants DOES report (fixes the
    // "settings change but the page doesn't" desync).
    const marker = { url: '/contact/', t: NOW - 800 }
    expect(navDecision(marker, '/contact/', NOW, TTL)).toEqual({ report: true })
  })

  it('stale marker past TTL is ignored → report (no hijack of a later load)', () => {
    const marker = { url: '/contact/', t: NOW - (TTL + 1) }
    expect(navDecision(marker, '/about/', NOW, TTL)).toEqual({ report: true })
  })

  it('malformed marker → report (never throws, never catches up to junk)', () => {
    expect(navDecision({ url: 123, t: NOW }, '/about/', NOW, TTL)).toEqual({ report: true })
    expect(navDecision({ url: '/x/' }, '/about/', NOW, TTL)).toEqual({ report: true })
    expect(navDecision({}, '/about/', NOW, TTL)).toEqual({ report: true })
  })

  it('catch-up converges: once we reach the target, it reports (no loop)', () => {
    const marker = { url: '/contact/', t: NOW - 800 }
    // stale page → catch up
    expect(navDecision(marker, '/about/', NOW, TTL)).toEqual({ catchUp: '/contact/' })
    // arrived at /contact/ → report (marker no longer points elsewhere)
    expect(navDecision(marker, '/contact/', NOW, TTL)).toEqual({ report: true })
  })
})
