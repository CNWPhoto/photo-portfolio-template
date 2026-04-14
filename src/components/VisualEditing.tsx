import { VisualEditing as SanityVisualEditing } from '@sanity/visual-editing/react'

// Debounce reloads so autosaves that fire while the editor is still typing
// don't yank the iframe mid-keystroke. Each incoming mutation resets the
// timer; we only reload once the editor has been quiet for QUIET_MS.
const QUIET_MS = 1500
let reloadTimer: ReturnType<typeof setTimeout> | null = null

export default function VisualEditing() {
  return (
    <SanityVisualEditing
      refresh={async (payload) => {
        if (payload.source !== 'mutation') return
        if (reloadTimer) clearTimeout(reloadTimer)
        reloadTimer = setTimeout(() => window.location.reload(), QUIET_MS)
      }}
    />
  )
}
