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
import { canonPath } from './previewPath.js'

// Sanity Studio autosaves drafts on idle (~1s of no keystrokes). We add a
// small additional debounce on top so that a pause mid-sentence doesn't fire
// a refresh showing the half-typed state. 1500ms matches the prior behavior
// that was tuned to feel right while editing prose.
const QUIET_MS = 1500
// siteSettings mutations get a snappier debounce — the style fast path below
// usually resolves them with a tiny JSON fetch instead of a full SSR render,
// so font/theme picks can afford to feel immediate.
const STYLE_QUIET_MS = 250
let refreshTimer = null
let styleTimer = null
let inflight = null

// ── Echo suppression at the source ───────────────────────────────────────────
// The intermittent "jump back to the previous page" was self-inflicted: on an
// MPA reload the newly-loaded page reports its location to Studio via
// navigate(push). For a navigation STUDIO itself initiated, Studio already
// knows that URL — and when the report lands late (slow preview SSR / comlink
// reconnect) AFTER the editor has clicked onward, Studio "follows" the stale
// report and snaps the iframe back to it. So we simply DON'T report Studio-
// initiated loads: `update` drops a marker before navigating, and the
// destination's subscribe() skips its report when it sees a fresh marker for
// its own URL. In-iframe link clicks and the very first load still report
// (Studio needs to learn those). With no stale reports, every `update` Studio
// sends is a genuine intent we can honor immediately — no guard, no window, so
// deliberate back-navigation works on the first click.
const STUDIO_NAV_KEY = '__pv_studio_nav'
// A Studio-initiated load should mount within this; beyond it we treat the load
// as organic and report normally, so a nav that never completed can't suppress
// a much-later, unrelated load of the same URL.
const STUDIO_NAV_TTL = 20000

function buildHistoryAdapter() {
  return {
    subscribe: (navigate) => {
      // Report our location to Studio UNLESS this load is the result of a
      // Studio-initiated navigation (marker set + fresh + matches where we
      // landed) — that report is the echo that caused the bounce.
      let studioInitiated = false
      try {
        const nav = JSON.parse(sessionStorage.getItem(STUDIO_NAV_KEY) || 'null')
        if (
          nav &&
          nav.url === canonPath(window.location.href) &&
          Date.now() - nav.t < STUDIO_NAV_TTL
        ) {
          studioInitiated = true
        }
        // Consume the marker either way — it applies to exactly one load.
        sessionStorage.removeItem(STUDIO_NAV_KEY)
      } catch {
        /* sessionStorage unavailable — fall through and report normally */
      }
      if (!studioInitiated) {
        navigate({
          type: 'push',
          title: document.title,
          url: canonPath(window.location.href),
        })
      }
      return () => {}
    },
    update: (update) => {
      if (update.type === 'pop') {
        window.history.back()
        return
      }
      // Canonicalize BOTH sides to the site's trailing-slash form. Presentation
      // sends the slash-less resolver path ("/about"); our real location is
      // "/about/" (trailingSlash:'always'). Comparing raw missed on every
      // non-root page — see src/lib/previewPath.js.
      const here = canonPath(window.location.href)
      const target = canonPath(update.url)
      // Already showing this URL → nothing to do. Also absorbs the slash-less
      // echo of the CURRENT page, so we never round-trip through a 301 back to
      // ourselves.
      if (here === target) return
      // Mark this as a Studio-initiated navigation so the destination page skips
      // reporting its location back (the echo). Studio already knows where it
      // sent us.
      try {
        sessionStorage.setItem(STUDIO_NAV_KEY, JSON.stringify({ url: target, t: Date.now() }))
      } catch {
        /* non-fatal — worst case the destination reports and Studio is fine */
      }
      // Navigate to the CANONICAL (slashed) URL so the browser doesn't eat an
      // extra 301.
      if (update.type === 'replace') window.location.replace(target)
      else window.location.assign(target)
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

// <html> attributes derived from siteSettings — synced on every refresh so
// fontTheme / defaultPalette changes take effect without a full reload.
const HTML_ATTRS_TO_SYNC = ['data-theme', 'data-font']

// <head> elements tagged with data-sanity-head in Layout.astro. Each value is
// unique per concern so we can match the same slot across old and new DOM.
// Missing-in-new = remove from live DOM; present-in-new = insert/replace.
const HEAD_MARKERS = [
  'fonts',
  'custom-fonts',
  'palette',
  'typography',
  'accent',
  'text-preset',
  'theme-color',
]

function syncHtmlAttrs(newHtml) {
  const liveHtml = document.documentElement
  for (const attr of HTML_ATTRS_TO_SYNC) {
    const next = newHtml.getAttribute(attr)
    const curr = liveHtml.getAttribute(attr)
    if (next === curr) continue
    if (next == null) liveHtml.removeAttribute(attr)
    else liveHtml.setAttribute(attr, next)
  }
}

function syncHeadMarkers(newDoc) {
  for (const marker of HEAD_MARKERS) {
    const selector = `[data-sanity-head="${marker}"]`
    const next = newDoc.querySelector(selector)
    const curr = document.head.querySelector(selector)
    // Skip identical elements: replacing an unchanged <link> makes the
    // browser re-evaluate the stylesheet (visible FOUT on every edit).
    if (next && curr && next.outerHTML !== curr.outerHTML) curr.replaceWith(next)
    else if (next && !curr) document.head.appendChild(next)
    else if (!next && curr) curr.remove()
  }
}

// Server HTML from the previous refresh, per selector + URL. Lets us skip
// body swaps whose server output didn't change — e.g. a font or palette
// pick only alters <head> markers, so replacing <main> would just flash
// every image and reset slider/scroll state for nothing. Compared against
// the PREVIOUS FETCH (not the live DOM, which client scripts mutate —
// reveal classes, slider clones — so it never matches server HTML).
let lastServerHtml = {}
let lastServerUrl = null

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

    // Navigation invalidates the baseline (different page, different HTML).
    if (lastServerUrl !== window.location.href) {
      lastServerHtml = {}
      lastServerUrl = window.location.href
    }

    let mainPresent = false
    for (const selector of SWAP_SELECTORS) {
      const newEl = doc.querySelector(selector)
      const oldEl = document.querySelector(selector)
      if (newEl && oldEl) {
        if (selector === 'main') mainPresent = true
        // Unchanged since the last refresh → the edit didn't touch this
        // region (head-only changes like fonts/palette land here). Skip
        // the swap so images don't flash and slider state survives.
        if (lastServerHtml[selector] === newEl.outerHTML) continue
        lastServerHtml[selector] = newEl.outerHTML
        oldEl.replaceWith(newEl)
      } else if (newEl && !oldEl) {
        // New element appeared on the server (e.g. doc-marker added by a
        // recent code change) but isn't in the live DOM yet. Append it to
        // body so visual-editing's MutationObserver picks it up on this
        // refresh instead of waiting for the next full page load.
        lastServerHtml[selector] = newEl.outerHTML
        document.body.appendChild(newEl)
      }
    }
    if (!mainPresent) throw new Error('refresh: <main> missing')

    syncHtmlAttrs(doc.documentElement)
    syncHeadMarkers(doc)

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

// ── Style fast path ─────────────────────────────────────────────────────────
// Font churn (theme/pick/weight/upload changes on siteSettings) only alters
// <head> output, but each mutation still cost a full uncached SSR render via
// swapInPlace — real CPU on Workers Free. /api/preview-style returns the
// computed font payload plus a hash of every NON-font siteSettings field
// (shared emission module, so it can't drift from Layout). When that hash is
// unchanged, we apply the fonts client-side and skip the page refetch
// entirely; any other siteSettings change falls through to the normal swap.
let lastStyle = null

function setHeadMarker(marker, build) {
  const selector = `[data-sanity-head="${marker}"]`
  const curr = document.head.querySelector(selector)
  const next = build()
  if (next && curr) {
    if (next.outerHTML !== curr.outerHTML) curr.replaceWith(next)
  } else if (next) {
    document.head.appendChild(next)
  } else if (curr) {
    curr.remove()
  }
}

function applyFontHead(style) {
  setHeadMarker('fonts', () => {
    if (!style.fontUrl) return null
    const link = document.createElement('link')
    // Attribute order matches Layout.astro's render so the next full swap's
    // outerHTML comparison sees them as identical.
    link.setAttribute('href', style.fontUrl)
    link.setAttribute('rel', 'stylesheet')
    link.setAttribute('data-sanity-head', 'fonts')
    return link
  })
  setHeadMarker('custom-fonts', () => {
    if (!style.customFontCss) return null
    const el = document.createElement('style')
    el.setAttribute('data-sanity-head', 'custom-fonts')
    el.textContent = style.customFontCss
    return el
  })
  setHeadMarker('typography', () => {
    if (!style.typographyOverrideCss) return null
    const el = document.createElement('style')
    el.setAttribute('data-sanity-head', 'typography')
    el.textContent = style.typographyOverrideCss
    return el
  })
  if (style.fontTheme) document.documentElement.setAttribute('data-font', style.fontTheme)
}

async function fetchStyle() {
  const res = await fetch('/api/preview-style/', {
    credentials: 'same-origin',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`preview-style ${res.status}`)
  return res.json()
}

async function styleFastPath() {
  try {
    const style = await fetchStyle()
    const prev = lastStyle
    lastStyle = style
    if (prev && prev.restHash === style.restHash) {
      applyFontHead(style)
      console.debug('[visual-editing] style fast-path applied (no page refetch)')
      return
    }
  } catch (err) {
    console.warn('[visual-editing] style fast-path failed, falling back to full refresh:', err)
  }
  // Non-font siteSettings change (or no baseline / fetch failure): the page
  // HTML may differ — fall through to the NORMAL debounced refresh, so
  // prose typing in siteSettings fields (siteName etc.) still coalesces to
  // one render per pause instead of one per autosave.
  if (refreshTimer) clearTimeout(refreshTimer)
  refreshTimer = setTimeout(swapInPlace, QUIET_MS)
}

// Pre-fetch the current page once at mount (after idle) so the very first
// edit already has a baseline to diff against — otherwise the first font
// pick still swaps everything once. Only fills slots swapInPlace hasn't
// already populated, so it can never clobber a fresher baseline.
async function seedBaseline() {
  try {
    const res = await fetch(window.location.href, {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'X-Visual-Editing-Refresh': '1' },
    })
    if (!res.ok) return
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html')
    if (lastServerUrl !== window.location.href) {
      lastServerHtml = {}
      lastServerUrl = window.location.href
    }
    for (const selector of SWAP_SELECTORS) {
      const el = doc.querySelector(selector)
      if (el && lastServerHtml[selector] === undefined) {
        lastServerHtml[selector] = el.outerHTML
      }
    }
  } catch {
    // Baseline is an optimization — swaps still work without it.
  }
  try {
    // Seed the style baseline too, so the very first font pick already has
    // a restHash to compare against and takes the fast path.
    if (!lastStyle) lastStyle = await fetchStyle()
  } catch {
    // Same: optimization only. First siteSettings edit falls back to a swap.
  }
}

export function mount() {
  if ('requestIdleCallback' in window) requestIdleCallback(() => seedBaseline())
  else setTimeout(seedBaseline, 1000)

  enableVisualEditing({
    history: buildHistoryAdapter(),
    refresh: (payload) => {
      if (payload.source !== 'mutation') return false
      // siteSettings edits route through the style fast path: usually a tiny
      // JSON fetch + client-side font apply instead of a full SSR render.
      // (The mutation event only carries doc metadata — _id/_type/_rev — so
      // the endpoint's restHash is what tells font-only changes apart.)
      if (payload.document?._type === 'siteSettings') {
        if (styleTimer) clearTimeout(styleTimer)
        styleTimer = setTimeout(styleFastPath, STYLE_QUIET_MS)
        return new Promise((resolve) => {
          setTimeout(resolve, STYLE_QUIET_MS + 50)
        })
      }
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
