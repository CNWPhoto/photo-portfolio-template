import {Flex, TextInput} from '@sanity/ui'
import {set, unset} from 'sanity'

// Custom string input that pairs a native <input type="color"> swatch
// with the standard Sanity TextInput. Both share the same underlying value
// (a hex string), so editors can pick from the OS color picker OR paste a
// hex code they already have. Stays a plain string in Content Lake — no
// schema migration required, downstream Astro code keeps reading the raw
// hex value the same way it always has.
//
// Native <input type="color"> only round-trips 6-character hex (#RRGGBB).
// If the stored value is shorthand (#RGB) or empty, the swatch falls back
// to black so it's not visually missing — but editing the swatch always
// commits a 6-char hex.

const HEX6 = /^#[0-9a-fA-F]{6}$/

export default function HexColorInput(props) {
  const {value, onChange, elementProps} = props

  const commit = (event) => {
    const next = event.currentTarget.value
    onChange(next ? set(next) : unset())
  }

  const swatchValue = HEX6.test(value || '') ? value : '#000000'

  return (
    <Flex gap={2} align="center">
      <input
        type="color"
        value={swatchValue}
        onChange={commit}
        aria-label="Color picker"
        style={{
          width: 36,
          height: 36,
          padding: 0,
          border: '1px solid var(--card-border-color)',
          borderRadius: 3,
          background: 'transparent',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      />
      <div style={{flex: 1, minWidth: 0}}>
        <TextInput {...elementProps} value={value || ''} onChange={commit} placeholder="#8b2635" />
      </div>
    </Flex>
  )
}
