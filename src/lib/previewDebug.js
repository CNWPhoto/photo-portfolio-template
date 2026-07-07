// TEMP DIAGNOSTIC — remove once the Presentation navigation race is pinned.
//
// Records nav events across MPA reloads (sessionStorage survives the reload) and
// paints a small, click-through overlay inside the preview iframe so the exact
// sequence + timing can be screenshotted. The bridge only loads inside the
// Presentation iframe, so this never reaches public visitors.
const KEY = '__pv_debuglog'
const CAP = 40

function read() {
  try {
    const a = JSON.parse(sessionStorage.getItem(KEY) || '[]')
    return Array.isArray(a) ? a : []
  } catch {
    return []
  }
}

export function pvlog(kind, detail) {
  let a = read()
  a.push({ t: Date.now(), k: kind, d: detail })
  a = a.slice(-CAP)
  try {
    sessionStorage.setItem(KEY, JSON.stringify(a))
  } catch {
    /* ignore */
  }
  render(a)
}

function render(a) {
  if (typeof document === 'undefined' || !document.body) return
  let el = document.getElementById('__pv_debug')
  if (!el) {
    el = document.createElement('div')
    el.id = '__pv_debug'
    el.style.cssText = [
      'position:fixed',
      'left:8px',
      'bottom:8px',
      'z-index:2147483647',
      'max-width:min(92vw,600px)',
      'max-height:46vh',
      'overflow:auto',
      'background:rgba(10,12,16,.93)',
      'color:#8fef9f',
      'font:11px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace',
      'padding:8px 10px',
      'border-radius:8px',
      'white-space:pre-wrap',
      'pointer-events:none',
      'box-shadow:0 4px 20px rgba(0,0,0,.45)',
    ].join(';')
    document.body.appendChild(el)
  }
  const t0 = a.length ? a[0].t : Date.now()
  // NEWEST first so the snap-back line is always visible at the top (the panel
  // is click-through and can't be scrolled).
  const lines = a.map((e) => `+${String(e.t - t0).padStart(6)}ms  ${e.k}  ${e.d}`).reverse()
  el.textContent = 'pv-nav trace (NEWEST first)\n' + lines.join('\n')
}

// Paint whatever we already have as soon as this page loads.
if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(() => render(read()))
