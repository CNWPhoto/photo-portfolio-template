// Vanilla Sanity Visual Editing bridge.
//
// Loaded only when the page is inside the Studio Presentation iframe (gated
// by an inline script in Layout.astro). This keeps the @sanity/visual-editing
// bundle (and its transitive deps) out of public visitors' bundles entirely.
//
// Two jobs:
//   1. Provide a HistoryAdapter so Studio knows what URL we're on (Astro is
//      MPA, so the package can't observe pushState/popstate).
//   2. On mutation events, swap <main> in place via fetch instead of doing
//      a full window.location.reload(). Avoids re-running CSS/JS, re-decoding
//      images, scroll resets, and the full Astro SSR cold-path round-trip.

import { enableVisualEditing } from '@sanity/visual-editing'

// Sanity Studio autosaves drafts on idle (~1s of no keystrokes). We add a
// small additional debounce on top so that a pause mid-sentence doesn't fire
// a refresh showing the half-typed state. 1500ms matches the prior behavior
// that was tuned to feel right while editing prose.
const QUIET_MS = 1500
let refreshTimer = null
let inflight = null

function buildHistoryAdapter() {
  return {
    subscribe: (navigate) => {
      navigate({
        type: 'push',
        url: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      })
      return () => {}
    },
    update: (update) => {
      if (update.type === 'push' || update.type === 'replace') {
        window.location.href = update.url
      } else if (update.type === 'pop') {
        window.history.back()
      }
    },
  }
}

// Selectors swapped on every refresh. Order matters only for readability —
// each is independent. <main> is the page content; nav/footer reflect edits
// to siteSettings/navSettings/footerSettings (and carry the data-sanity
// attributes that register those docs with Presentation); the preview
// banner is meta-UI.
// Note: 'header.nav' (not 'nav') because Nav.astro outputs <header class="nav">
// as the root with inner <nav aria-label> elements for the link lists. A bare
// 'nav' selector would match (and swap) the wrong element.
const SWAP_SELECTORS = ['main', 'header.nav', 'footer.footer', '.preview-banner']

// Fetch the current URL and swap a known set of body-level elements in
// place. Falls back to a full page reload on any failure so editors never
// get stuck on stale content.
async function swapInPlace() {
  if (inflight) inflight.abort()
  const controller = new AbortController()
  inflight = controller
  try {
    const res = await fetch(window.location.href, {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'X-Visual-Editing-Refresh': '1' },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`refresh fetch ${res.status}`)
    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')

    let swappedMain = false
    for (const selector of SWAP_SELECTORS) {
      const newEl = doc.querySelector(selector)
      const oldEl = document.querySelector(selector)
      if (newEl && oldEl) {
        oldEl.replaceWith(newEl)
        if (selector === 'main') swappedMain = true
      } else if (newEl && !oldEl) {
        // New element appeared on the server (e.g. doc-marker added by a
        // recent code change) but isn't in the live DOM yet. Append it to
        // body so visual-editing's MutationObserver picks it up on this
        // refresh instead of waiting for the next full page load.
        document.body.appendChild(newEl)
      }
    }
    if (!swappedMain) throw new Error('refresh: <main> missing')

    if (doc.title && doc.title !== document.title) document.title = doc.title

    // Let Layout's reveal observer rebind to the freshly-swapped nodes.
    document.dispatchEvent(new CustomEvent('visual-editing:swapped'))
  } catch (err) {
    if (err?.name === 'AbortError') return
    console.warn('[visual-editing] in-place refresh failed, falling back to reload:', err)
    window.location.reload()
  } finally {
    if (inflight === controller) inflight = null
  }
}

export function mount() {
  enableVisualEditing({
    history: buildHistoryAdapter(),
    refresh: (payload) => {
      if (payload.source !== 'mutation') return false
      if (refreshTimer) clearTimeout(refreshTimer)
      refreshTimer = setTimeout(swapInPlace, QUIET_MS)
      // Returning a promise tells visual-editing we're handling refresh
      // ourselves (don't fall back to its default reload behavior).
      return new Promise((resolve) => {
        setTimeout(resolve, QUIET_MS + 50)
      })
    },
  })
}
