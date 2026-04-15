import {Select} from '@sanity/ui'
import {set, unset, useFormValue} from 'sanity'

// Dynamic dropdown for siteSettings.defaultPalette. Reads the parent
// document's `palettes` array via useFormValue and lists every palette
// by name. Replaces the previous hardcoded `options.list` so newly
// created palettes are immediately selectable as the site default —
// no schema edit required.
//
// The stored value is still the palette slug (a plain string), so
// downstream Astro consumers (Layout.astro, palette lookups) keep
// working unchanged.

export default function PaletteSelectInput(props) {
  const {value, onChange, elementProps} = props
  const palettes = useFormValue(['palettes']) || []

  const handleChange = (event) => {
    const next = event.currentTarget.value
    onChange(next ? set(next) : unset())
  }

  return (
    <Select {...elementProps} value={value || ''} onChange={handleChange}>
      <option value="">— Select a palette —</option>
      {palettes.map((palette, i) => {
        const slug = palette?.slug?.current
        if (!slug) return null
        return (
          <option key={palette?._key || slug || i} value={slug}>
            {palette?.name || slug}
          </option>
        )
      })}
    </Select>
  )
}
