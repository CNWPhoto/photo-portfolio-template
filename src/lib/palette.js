// Palette helpers for the page builder.
// See docs/page-builder-spec.md §3.

// Maps a palette object's field names to the CSS custom property names that
// section components consume. Order is stable for deterministic output.
const PALETTE_TO_VAR = [
  ['bg', '--bg'],
  ['bgAlt', '--bg-alt'],
  ['surface', '--surface'],
  ['text', '--text'],
  ['textMuted', '--muted'],
  ['textMutedLight', '--muted-light'],
  ['accent', '--accent'],
  ['accentDark', '--accent-dark'],
  ['border', '--border'],
  ['sectionAlt', '--section-alt'],
  ['sectionDark', '--section-dark'],
  ['sectionDarkText', '--section-dark-text'],
  ['btnBg', '--btn-bg'],
  ['btnText', '--btn-text'],
]

// Returns an inline `style` attribute string of CSS custom properties for the
// given palette object, or undefined when no palette is provided.
export function paletteToStyle(palette) {
  if (!palette) return undefined
  const decls = []
  for (const [key, cssVar] of PALETTE_TO_VAR) {
    const value = palette[key]
    if (value) decls.push(`${cssVar}:${value}`)
  }
  return decls.length ? decls.join(';') : undefined
}

// Walks the palette resolution order and returns the first match.
// 1. explicit section palette slug, 2. page default, 3. site default.
export function resolvePalette(sectionPaletteSlug, pagePaletteSlug, sitePaletteSlug, allPalettes) {
  if (!Array.isArray(allPalettes) || allPalettes.length === 0) return null
  const findBySlug = (slug) => {
    if (!slug) return null
    return allPalettes.find((p) => (p?.slug?.current || p?.slug) === slug) || null
  }
  return (
    findBySlug(sectionPaletteSlug) ||
    findBySlug(pagePaletteSlug) ||
    findBySlug(sitePaletteSlug) ||
    allPalettes[0] ||
    null
  )
}

// Relative-luminance check on the palette's background color.
// Returns true when the palette is "dark" (luminance < 0.5) so callers can
// flip nav color when overlaid on the first section.
export function isDarkPalette(palette) {
  if (!palette?.bg) return false
  const hex = palette.bg.replace('#', '')
  const full = hex.length === 3
    ? hex.split('').map((c) => c + c).join('')
    : hex
  if (full.length !== 6) return false
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return luminance < 0.5
}

// Hardcoded fallback palettes for legacy data-theme strings. Mirror the
// values in src/styles/palette.css and the legacy block in Layout.astro so
// any un-migrated section that still emits data-theme keeps rendering.
const LEGACY_THEMES = {
  'classic-cream': {
    bg: '#f5f3ef', bgAlt: '#edeae4', surface: '#edeae4',
    text: '#1a2744', textMuted: '#4a5568', textMutedLight: '#8a94a6',
    accent: '#8b2635', accentDark: '#6b1c28', border: '#d4cfc6',
    sectionAlt: '#edeae4', sectionDark: '#1a2744', sectionDarkText: '#f5f3ef',
    btnBg: '#8b2635', btnText: '#ffffff',
  },
  'warm-studio': {
    bg: '#fdf6ee', bgAlt: '#f5ead9', surface: '#f5ead9',
    text: '#2c1810', textMuted: '#6b4c3b', textMutedLight: '#a88070',
    accent: '#c9702a', accentDark: '#a85a20', border: '#e8d5c0',
    sectionAlt: '#f5ead9', sectionDark: '#2c1810', sectionDarkText: '#fdf6ee',
    btnBg: '#c9702a', btnText: '#ffffff',
  },
  'dark-editorial': {
    bg: '#1a1a1a', bgAlt: '#252525', surface: '#252525',
    text: '#f0ede8', textMuted: '#a0998e', textMutedLight: '#6b645c',
    accent: '#c9a96e', accentDark: '#a8895a', border: '#3a3a3a',
    sectionAlt: '#252525', sectionDark: '#111111', sectionDarkText: '#f0ede8',
    btnBg: '#c9a96e', btnText: '#1a1a1a',
  },
  'cool-minimal': {
    bg: '#f8f9fa', bgAlt: '#eef1f4', surface: '#eef1f4',
    text: '#1c2b3a', textMuted: '#4a5e6e', textMutedLight: '#8a99a6',
    accent: '#4a7c9e', accentDark: '#3a6480', border: '#d0d8de',
    sectionAlt: '#eef1f4', sectionDark: '#1c2b3a', sectionDarkText: '#f8f9fa',
    btnBg: '#4a7c9e', btnText: '#ffffff',
  },
  'forest-sage': {
    bg: '#f2f4f0', bgAlt: '#e4ebe0', surface: '#e4ebe0',
    text: '#1e2d1f', textMuted: '#4a5e4b', textMutedLight: '#8a9e8b',
    accent: '#5a7a4e', accentDark: '#456040', border: '#ccd6c8',
    sectionAlt: '#e4ebe0', sectionDark: '#1e2d1f', sectionDarkText: '#f2f4f0',
    btnBg: '#5a7a4e', btnText: '#ffffff',
  },
}

// Translates a legacy `data-theme` slug into the same palette object shape
// resolvePalette() / paletteToStyle() expect. Returns null for unknown slugs.
export function parseLegacyTheme(themeName) {
  if (!themeName) return null
  return LEGACY_THEMES[themeName] || null
}
