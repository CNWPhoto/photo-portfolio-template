import { VisualEditing as SanityVisualEditing } from '@sanity/visual-editing/react'

export default function VisualEditing() {
  return (
    <SanityVisualEditing
      refresh={async (payload) => {
        // Astro is SSR — a full reload is the only way to re-render with fresh drafts
        if (payload.source === 'mutation') {
          window.location.reload()
        }
      }}
    />
  )
}
