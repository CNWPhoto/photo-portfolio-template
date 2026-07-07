// Decide what a freshly-mounted Presentation preview page should do, given the
// Studio-navigation marker `update` left in sessionStorage.
//
// Studio's own handler sets its URL to whatever location the iframe reports, so:
//   - the intended page (or an organic load) must REPORT, so Studio syncs to
//     where the iframe actually is;
//   - a STALE page that mounted late — after a newer Studio nav superseded it —
//     must instead CATCH UP to that newer target, because reporting its stale
//     URL is exactly what drags Studio back (the "jump back" bounce).
//
// Pure so it can be unit-tested; the bridge performs the side effects (navigate,
// location.replace, marker removal) based on the returned decision.
//
// `marker` is {url, t} or null. Returns {catchUp: <url>} or {report: true}.
export function navDecision(marker, here, now, ttl) {
  const fresh =
    marker && typeof marker.url === 'string' && typeof marker.t === 'number' && now - marker.t < ttl
  if (fresh && marker.url !== here) return { catchUp: marker.url }
  return { report: true }
}
