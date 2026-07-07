// Pure navigation-trail logic for the Presentation preview bridge's multi-hop
// anti-bounce guard. Kept sessionStorage-free so it can be unit-tested; the
// bridge (visualEditingBridge.js) wraps these with the actual storage I/O.
//
// The trail is an ordered array of {p: canonicalPath, t: timestamp}, oldest
// first. Presentation re-emits URLs of pages we've already left; during a run
// of quick navigations (A→B→C) several such echoes are in flight, each pointing
// at a DIFFERENT earlier page. An `update` targeting a page we visited BEFORE
// the page we're currently on — within `windowMs` of arriving there — is one of
// those stale echoes and must be ignored, not followed.

export const TRAIL_MAX = 12

// Append a visit, coalescing a repeated tail entry so a refresh of the same
// page just updates its time (doesn't grow the trail or move it "forward").
// Returns a new capped array; never mutates the input.
export function recordVisit(trail, path, t, max = TRAIL_MAX) {
  const next = Array.isArray(trail) ? trail.slice() : []
  const last = next[next.length - 1]
  if (last && last.p === path) next[next.length - 1] = { p: path, t }
  else next.push({ p: path, t })
  return next.slice(-max)
}

// Most recent timestamp we were on `path`, or undefined if never visited.
export function lastVisit(trail, path) {
  if (!Array.isArray(trail)) return undefined
  for (let i = trail.length - 1; i >= 0; i--) if (trail[i].p === path) return trail[i].t
  return undefined
}

// True when navigating to `target` is a stale-echo bounce: we visited it before
// arriving at `here`, and we're still within `windowMs` of that arrival. Past
// the window (settled on the page) it returns false, so no page stays stuck.
export function isStaleEcho(trail, here, target, now, windowMs, pageLoadedAt) {
  if (here === target) return false
  const arrivedAt = lastVisit(trail, here) ?? pageLoadedAt
  const targetSeenAt = lastVisit(trail, target)
  return targetSeenAt !== undefined && targetSeenAt < arrivedAt && now - arrivedAt < windowMs
}
