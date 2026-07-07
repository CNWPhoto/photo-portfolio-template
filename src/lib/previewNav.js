// Decide whether an incoming Studio navigation is a STALE BOUNCE that should be
// ignored, using the marker `update` writes before each navigation.
//
// The marker records the page we're currently navigating TO (`url`) and the page
// we came FROM (`from`). While that navigation is still pending (the new page is
// slow to load and hasn't reported yet), Studio can re-assert the URL we just
// left — its `params.preview` reverted because our new location hadn't synced.
// Obeying that snaps the editor back (the "jump back"). So: if an update targets
// the page we're navigating away from, while the forward nav is still pending
// and fresh, it's that bounce — ignore it. When the new page finally loads it
// reports and Studio re-syncs forward.
//
// Pure so it can be unit-tested. `marker` is {url, from, t} or null.
export function isStaleBounce(marker, target, now, ttl) {
  return !!(
    marker &&
    typeof marker.url === 'string' &&
    typeof marker.from === 'string' &&
    typeof marker.t === 'number' &&
    now - marker.t < ttl &&
    marker.from === target && // Studio wants us back at the page we're leaving
    marker.url !== target // and it isn't just confirming where we're headed
  )
}
