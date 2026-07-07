import { describe, it, expect } from 'vitest'
// @ts-expect-error — plain JS module, no types
import { recordVisit, lastVisit, isStaleEcho, TRAIL_MAX } from '../src/lib/previewTrail.js'

const WINDOW = 6000

// Build the A→B→C trail the way the bridge does (a visit per MPA page load).
function abc() {
  let t: Array<{ p: string; t: number }> = []
  t = recordVisit(t, '/', 1000) // A
  t = recordVisit(t, '/about/', 2000) // B
  t = recordVisit(t, '/contact/', 3000) // C (now here, arrived at 3000)
  return t
}

describe('recordVisit', () => {
  it('appends distinct pages in order', () => {
    const t = abc()
    expect(t.map((e) => e.p)).toEqual(['/', '/about/', '/contact/'])
  })

  it('coalesces a repeated tail entry (refresh of same page) instead of growing', () => {
    let t = recordVisit([], '/about/', 1000)
    t = recordVisit(t, '/about/', 1800) // same page again → update time, no growth
    expect(t).toEqual([{ p: '/about/', t: 1800 }])
  })

  it('caps the trail length', () => {
    let t: any[] = []
    for (let i = 0; i < TRAIL_MAX + 5; i++) t = recordVisit(t, `/p${i}/`, i)
    expect(t.length).toBe(TRAIL_MAX)
    expect(t[t.length - 1].p).toBe(`/p${TRAIL_MAX + 4}/`)
  })

  it('never mutates its input', () => {
    const orig = abc()
    const copy = JSON.parse(JSON.stringify(orig))
    recordVisit(orig, '/team/', 4000)
    expect(orig).toEqual(copy)
  })
})

describe('lastVisit', () => {
  it('returns the most recent timestamp for a revisited page', () => {
    let t = abc()
    t = recordVisit(t, '/about/', 5000) // genuine back to B
    expect(lastVisit(t, '/about/')).toBe(5000)
  })
  it('is undefined for a never-visited page', () => {
    expect(lastVisit(abc(), '/team/')).toBeUndefined()
  })
})

describe('isStaleEcho — the multi-hop bounce', () => {
  const trail = abc() // on /contact/, arrived at 3000

  it('THE BUG: echo TWO hops back (→ A) is caught, not just one', () => {
    expect(isStaleEcho(trail, '/contact/', '/', 3500, WINDOW, 3000)).toBe(true)
  })

  it('echo one hop back (→ B) is caught', () => {
    expect(isStaleEcho(trail, '/contact/', '/about/', 3500, WINDOW, 3000)).toBe(true)
  })

  it('genuine forward navigation to a NEW page passes through', () => {
    expect(isStaleEcho(trail, '/contact/', '/team/', 3500, WINDOW, 3000)).toBe(false)
  })

  it('an update to the current page is never a bounce', () => {
    expect(isStaleEcho(trail, '/contact/', '/contact/', 3500, WINDOW, 3000)).toBe(false)
  })

  it('after the window, back-navigation is allowed (nothing stays unreachable)', () => {
    expect(isStaleEcho(trail, '/contact/', '/', 3000 + WINDOW + 1, WINDOW, 3000)).toBe(false)
  })

  it('falls back to pageLoadedAt when "here" is not yet in the trail', () => {
    // Fresh load, empty trail: no prior visit to target → nothing to bounce from.
    expect(isStaleEcho([], '/x/', '/y/', 500, WINDOW, 100)).toBe(false)
  })

  it('after a genuine back-hop to B, a re-emitted C is treated as stale', () => {
    let t = abc()
    t = recordVisit(t, '/about/', 5000) // user went back to B; now here, arrived 5000
    // Presentation now re-emits the C we just left again:
    expect(isStaleEcho(t, '/about/', '/contact/', 5400, WINDOW, 5000)).toBe(true)
    // but going forward to a brand-new page still works:
    expect(isStaleEcho(t, '/about/', '/team/', 5400, WINDOW, 5000)).toBe(false)
  })
})
