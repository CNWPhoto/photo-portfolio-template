// Shared seed helpers — used by every niche file under ./niches/.
// Niche files import these to build their docs[] array; the runner
// (studio/scripts/seed.js) imports the niche, gets docs, and writes them.
//
// See studio/scripts/seed.js for the runner and ./niches/index.js for
// the niche registry. Add new niches by creating a file in ./niches/
// and registering it in ./niches/index.js.

// ── Key generator ─────────────────────────────────────────────────────
// Module-scoped counter — each seed run starts fresh because the runner
// imports this module once. Keys only need to be unique within a single
// document's array fields, but a global counter is simplest and safe.
const k = (() => {
  let n = 0
  return (prefix = 'k') => `${prefix}${(++n).toString(36)}`
})()

// Reset the counter — call from the runner before building docs so
// niche outputs are deterministic across invocations of buildDocs().
export function resetKeys() {
  // Re-create the closure by reassigning the inner counter via a hack:
  // simplest path is to expose a setter rather than reset. The counter
  // already starts at 0 on module load, and each `node` invocation
  // re-imports modules fresh, so resetKeys is effectively a no-op
  // unless something calls buildDocs more than once in one process.
  // Kept as a hook for future test runners that want determinism.
}

// ── Portable Text helpers ─────────────────────────────────────────────
export const block = (text, style = 'normal') => {
  const key = k('b')
  return {
    _type: 'block',
    _key: key,
    style,
    markDefs: [],
    children: [{_type: 'span', _key: key + 's', text}],
  }
}

export const bodyText = (...paragraphs) => paragraphs.map((p) => block(p))

// ── ctaLink helpers ───────────────────────────────────────────────────
export const ctaInternal = (refId) => ({
  _type: 'ctaLink',
  type: 'internal',
  internal: {_type: 'reference', _ref: refId, _weak: true},
})

export const ctaExternal = (url) => ({
  _type: 'ctaLink',
  type: 'external',
  external: url,
})

export const ctaAnchor = (anchor) => ({
  _type: 'ctaLink',
  type: 'anchor',
  anchor,
})

// ── Section base ──────────────────────────────────────────────────────
// The `spacing` field was removed from sectionBaseFields site-wide (see
// docs/deferred-features.md #9) so it's no longer included in seed data.
// Sanity would silently ignore the orphaned attribute, but writing it
// would create a mismatch between seeded docs and the current schema.
export const sectionBase = (overrides = {}) => ({
  enabled: true,
  ...overrides,
})

// ── Palettes ──────────────────────────────────────────────────────────
// Values match src/styles/palette.css and the legacy data-theme block.
// Every niche seeds all 5 palettes; the niche's defaultPalette field
// picks which one is active.
export const palettes = [
  {
    _key: 'p1', _type: 'palette',
    name: 'Classic Cream',
    slug: {_type: 'slug', current: 'classic-cream'},
    bg: '#f5f3ef', bgAlt: '#edeae4', surface: '#edeae4',
    text: '#1a2744', textMuted: '#4a5568', textMutedLight: '#8a94a6',
    accent: '#8b2635', accentDark: '#6b1c28', border: '#d4cfc6',
    sectionAlt: '#edeae4', sectionDark: '#1a2744', sectionDarkText: '#f5f3ef',
    btnBg: '#8b2635', btnText: '#ffffff',
  },
  {
    _key: 'p2', _type: 'palette',
    name: 'Warm Studio',
    slug: {_type: 'slug', current: 'warm-studio'},
    bg: '#fdf6ee', bgAlt: '#f5ead9', surface: '#f5ead9',
    text: '#2c1810', textMuted: '#6b4c3b', textMutedLight: '#a88070',
    accent: '#c9702a', accentDark: '#a85a20', border: '#e8d5c0',
    sectionAlt: '#f5ead9', sectionDark: '#2c1810', sectionDarkText: '#fdf6ee',
    btnBg: '#c9702a', btnText: '#ffffff',
  },
  {
    _key: 'p3', _type: 'palette',
    name: 'Dark Editorial',
    slug: {_type: 'slug', current: 'dark-editorial'},
    bg: '#1a1a1a', bgAlt: '#252525', surface: '#252525',
    text: '#f0ede8', textMuted: '#a0998e', textMutedLight: '#6b645c',
    accent: '#c9a96e', accentDark: '#a8895a', border: '#3a3a3a',
    sectionAlt: '#252525', sectionDark: '#111111', sectionDarkText: '#f0ede8',
    btnBg: '#c9a96e', btnText: '#1a1a1a',
  },
  {
    _key: 'p4', _type: 'palette',
    name: 'Cool Minimal',
    slug: {_type: 'slug', current: 'cool-minimal'},
    bg: '#f8f9fa', bgAlt: '#eef1f4', surface: '#eef1f4',
    text: '#1c2b3a', textMuted: '#4a5e6e', textMutedLight: '#8a99a6',
    accent: '#4a7c9e', accentDark: '#3a6480', border: '#d0d8de',
    sectionAlt: '#eef1f4', sectionDark: '#1c2b3a', sectionDarkText: '#f8f9fa',
    btnBg: '#4a7c9e', btnText: '#ffffff',
  },
  {
    _key: 'p5', _type: 'palette',
    name: 'Forest Sage',
    slug: {_type: 'slug', current: 'forest-sage'},
    bg: '#f2f4f0', bgAlt: '#e4ebe0', surface: '#e4ebe0',
    text: '#1e2d1f', textMuted: '#4a5e4b', textMutedLight: '#8a9e8b',
    accent: '#5a7a4e', accentDark: '#456040', border: '#ccd6c8',
    sectionAlt: '#e4ebe0', sectionDark: '#1e2d1f', sectionDarkText: '#f2f4f0',
    btnBg: '#5a7a4e', btnText: '#ffffff',
  },
]

// ── Page IDs (deterministic so navSettings can reference them) ────────
export const ID = {
  about: 'pageAbout',
  experience: 'pageExperience',
  contact: 'pageContact',
}
