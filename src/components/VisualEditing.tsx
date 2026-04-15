import { useRef } from 'react'
import { VisualEditing as SanityVisualEditing } from '@sanity/visual-editing/react'
import type { HistoryAdapter } from '@sanity/visual-editing'

// Debounce reloads so autosaves that fire while the editor is still typing
// don't yank the iframe mid-keystroke. Each incoming mutation resets the
// timer; we only reload once the editor has been quiet for QUIET_MS.
const QUIET_MS = 1500
let reloadTimer: ReturnType<typeof setTimeout> | null = null

// Astro is a multi-page app (every link is a full document request), so the
// visual-editing package can't detect URL changes via pushState/popstate like
// it would in a SPA. We provide an explicit HistoryAdapter so it can:
//  1. Report the current URL back to Studio on every page mount → this is
//     what populates "Documents on this page" in Presentation.
//  2. Handle Studio-initiated navigations (editor clicks "Open preview" on
//     a different doc) by assigning window.location.
function useHistoryAdapter(): HistoryAdapter {
  const adapterRef = useRef<HistoryAdapter | null>(null)
  if (!adapterRef.current) {
    adapterRef.current = {
      subscribe: (navigate) => {
        // Report the current URL immediately so Studio knows where we are
        // the moment the bridge comes up.
        navigate({
          type: 'push',
          url: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        })
        // No further updates — Astro does full reloads, so the next URL
        // change happens in a brand new page mount and a brand new adapter.
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
  return adapterRef.current
}

export default function VisualEditing() {
  const history = useHistoryAdapter()
  return (
    <SanityVisualEditing
      history={history}
      refresh={async (payload) => {
        if (payload.source !== 'mutation') return
        if (reloadTimer) clearTimeout(reloadTimer)
        reloadTimer = setTimeout(() => window.location.reload(), QUIET_MS)
      }}
    />
  )
}
