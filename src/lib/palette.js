// Palette helpers for the page builder.
// See docs/page-builder-spec.md §3.

import { stegaClean } from '@sanity/client/stega'

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
  ['vibrant', '--vibrant'],
  ['btnBg', '--btn-bg'],
  ['btnText', '--btn-text'],
]

// Returns an inline `style` attribute string of CSS custom properties for the
// given palette object, or undefined when no palette is provided. Values are
// stega-cleaned because the preview client injects invisible Unicode markers
// into every string, and those markers break CSS parsing when inlined.
export function paletteToStyle(palette) {
  if (!palette) return undefined
  const clean = stegaClean(palette)
  const decls = []
  for (const [key, cssVar] of PALETTE_TO_VAR) {
    const value = clean[key]
    if (value) decls.push(`${cssVar}:${value}`)
  }
  return decls.length ? decls.join(';') : undefined
}

// Returns the site-wide palette. Palettes are site-wide only — no page or
// section overrides. Set via siteSettings.defaultPalette in Studio. The
// returned palette is stega-cleaned so downstream consumers (CSS vars,
// luminance checks, tone shifts) get plain string values.
export function resolvePalette(_unused1, _unused2, sitePaletteSlug, allPalettes) {
  if (!Array.isArray(allPalettes) || allPalettes.length === 0) return null
  const cleanSlug = stegaClean(sitePaletteSlug)
  const findBySlug = (slug) => {
    if (!slug) return null
    return allPalettes.find((p) => {
      const pSlug = stegaClean(p?.slug?.current || p?.slug)
      return pSlug === slug
    }) || null
  }
  const found = findBySlug(cleanSlug) || allPalettes[0] || null
  return found ? stegaClean(found) : null
}

// Derives a tone-shifted palette from the base palette. Sections can pick
// which background shade they want (default / alt / dark) without changing
// the underlying palette. Returns a new palette object with the relevant
// color tokens swapped so section components can keep reading var(--bg) etc.
export function applyBackgroundTone(palette, tone) {
  if (!palette || !tone || tone === 'default') return palette
  if (tone === 'alt') {
    return {
      ...palette,
      bg: palette.bgAlt || palette.bg,
      bgAlt: palette.surface || palette.bgAlt,
    }
  }
  if (tone === 'dark') {
    const bg = palette.sectionDark || palette.text
    const fg = palette.sectionDarkText || palette.bg
    // Keep the accent only if it's legible on the dark band. A palette whose
    // accent equals its sectionDark (e.g. navy-on-navy) would otherwise render
    // accent-colored elements — section titles, eyebrows, links — invisible, so
    // fall back to the light foreground. Bright accents (gold, coral) stay put.
    const accent = contrastRatio(palette.accent, bg) >= 3 ? palette.accent : fg
    const accentDark = contrastRatio(palette.accentDark, bg) >= 3 ? palette.accentDark : fg
    return {
      ...palette,
      bg,
      bgAlt: bg,
      surface: bg,
      text: fg,
      textMuted: fg,
      textMutedLight: fg,
      border: fg,
      accent,
      accentDark,
    }
  }
  if (tone === 'vibrant') {
    const bg = palette.vibrant || palette.accent || palette.sectionDark || palette.text
    // Prefer the palette's light text on the band; fall back to dark text only
    // for pale vibrants where white wouldn't be legible. No editor decision.
    const fg = prefersLightText(bg)
      ? palette.sectionDarkText || palette.bg || '#ffffff'
      : palette.text || '#1a1a1a'
    return {
      ...palette,
      bg,
      bgAlt: bg,
      surface: bg,
      text: fg,
      textMuted: fg,
      textMutedLight: fg,
      border: fg,
      // The site accent now blends into the band; remap links + buttons to a
      // contrasting inverse (e.g. a white button with vibrant-colored text) so
      // CTAs stay visible.
      accent: fg,
      accentDark: fg,
      btnBg: fg,
      btnText: bg,
    }
  }
  return palette
}

// WCAG relative luminance of a hex color (0 = black … 1 = white).
function relLuminance(hex) {
  const h = (hex || '').replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  if (full.length !== 6) return 1
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

// WCAG contrast ratio between two hex colors (1 = identical … 21 = black/white).
function contrastRatio(a, b) {
  const la = relLuminance(a)
  const lb = relLuminance(b)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

// True when a color wants LIGHT text on top — decided by WCAG contrast ratio
// (white-text contrast vs black-text contrast), not a raw luminance threshold.
// A mid-light color like gold (#c9a96e) correctly prefers dark text. Used for
// the nav-overlay color flip (isDarkPalette).
export function isDarkColor(hex) {
  const L = relLuminance(hex)
  const whiteContrast = (1 + 0.05) / (L + 0.05)
  const blackContrast = (L + 0.05) / 0.05
  return whiteContrast >= blackContrast
}

// Vibrant bands prefer LIGHT text (the convention for bold colors), falling
// back to dark only when white text would be illegible (white-on-color < 3:1,
// WCAG AA Large — e.g. a pale gold/amber vibrant). Intentionally different from
// isDarkColor's pure max-contrast pick: a saturated mid-tone (e.g. #E63772)
// reads better with white text even when dark scores marginally higher.
export function prefersLightText(hex) {
  return (1 + 0.05) / (relLuminance(hex) + 0.05) >= 3
}

// True when the palette's background is dark — callers flip nav color when the
// nav overlays the first section.
export function isDarkPalette(palette) {
  return !!palette?.bg && isDarkColor(palette.bg)
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
    vibrant: '#d8a23a',
    btnBg: '#8b2635', btnText: '#ffffff',
  },
  'warm-studio': {
    bg: '#fdf6ee', bgAlt: '#f5ead9', surface: '#f5ead9',
    text: '#2c1810', textMuted: '#6b4c3b', textMutedLight: '#a88070',
    accent: '#c9702a', accentDark: '#a85a20', border: '#e8d5c0',
    sectionAlt: '#f5ead9', sectionDark: '#2c1810', sectionDarkText: '#fdf6ee',
    vibrant: '#2e8b82',
    btnBg: '#c9702a', btnText: '#ffffff',
  },
  'dark-editorial': {
    bg: '#1a1a1a', bgAlt: '#252525', surface: '#252525',
    text: '#f0ede8', textMuted: '#a0998e', textMutedLight: '#6b645c',
    accent: '#c9a96e', accentDark: '#a8895a', border: '#3a3a3a',
    sectionAlt: '#252525', sectionDark: '#111111', sectionDarkText: '#f0ede8',
    vibrant: '#c5543c',
    btnBg: '#c9a96e', btnText: '#1a1a1a',
  },
  'cool-minimal': {
    bg: '#f8f9fa', bgAlt: '#eef1f4', surface: '#eef1f4',
    text: '#1c2b3a', textMuted: '#4a5e6e', textMutedLight: '#8a99a6',
    accent: '#4a7c9e', accentDark: '#3a6480', border: '#d0d8de',
    sectionAlt: '#eef1f4', sectionDark: '#1c2b3a', sectionDarkText: '#f8f9fa',
    vibrant: '#e76f51',
    btnBg: '#4a7c9e', btnText: '#ffffff',
  },
  'forest-sage': {
    bg: '#f2f4f0', bgAlt: '#e4ebe0', surface: '#e4ebe0',
    text: '#1e2d1f', textMuted: '#4a5e4b', textMutedLight: '#8a9e8b',
    accent: '#5a7a4e', accentDark: '#456040', border: '#ccd6c8',
    sectionAlt: '#e4ebe0', sectionDark: '#1e2d1f', sectionDarkText: '#f2f4f0',
    vibrant: '#c0613a',
    btnBg: '#5a7a4e', btnText: '#ffffff',
  },
}

// Translates a legacy `data-theme` slug into the same palette object shape
// resolvePalette() / paletteToStyle() expect. Returns null for unknown slugs.
export function parseLegacyTheme(themeName) {
  if (!themeName) return null
  return LEGACY_THEMES[themeName] || null
}
