// Field groups for every section — the tabs across the top of a section form.
//
// Sections had grown 10–20 fields in one flat list, so an editor scrolled past
// layout radios and spacing controls to reach the heading they came to change.
// Groups split that into: what it looks like, what it says, and the settings
// you rarely touch.
//
// Applied programmatically in index.js rather than hand-edited into 16 schemas.
// Every hand-maintained list in this repo has drifted the moment someone added
// a field — the scratch-copy allowlist, the runbook steps, the fleet spacing
// audit. Classifying by field name means a NEW field lands in a sensible tab on
// its own, and the rule lives in one place instead of sixteen.
//
// Anything unmatched falls to CONTENT deliberately: a stray field is visible
// next to the copy rather than buried under Settings where nobody looks.

export const SECTION_GROUPS = [
  {name: 'layout', title: 'Style', default: true},
  {name: 'content', title: 'Content'},
  {name: 'settings', title: 'Settings'},
]

// Look/shape of the section — the "which variant is this" decisions.
const LAYOUT_FIELDS = new Set([
  'variant',
  'layout',
  'imageLayout',
  'imageFit',
  'galleryLayout',
  'textContainer',
  'cardPlacement',
  'columnWidths',
  'gridColumns',
  'galleryColumns',
  'alignment',
  'textAlignment',
  'textPosition',
  'verticalAlignment',
  'backgroundTone',
  'heightMode',
  'height',
  'centeredHeight',
  'carouselHeight',
  'overlayOpacity',
  'parallax',
  'stickyBackground',
  'mobileFlipOrder',
  'mobileTextBelow',
  'headingSize',
  'maxWidth',
  'gap',
  'lightbox',
  'columnAlignment',
])

// Plumbing an editor sets once and forgets.
const SETTINGS_FIELDS = new Set([
  'enabled',
  'spacing',
  'spacingOverride',
  'sectionId',
  'verticalSideLabel',
  'showSchema',
  'maxCount',
  'manageLink',
  'source',
  'mode',
  'web3formsKeyOverride',
  'embedUrl',
  'embedHeight',
  'embedTitle',
  'submitText',
  'successMessage',
  'errorMessage',
])

export function groupForField(name) {
  if (LAYOUT_FIELDS.has(name)) return 'layout'
  if (SETTINGS_FIELDS.has(name)) return 'settings'
  return 'content'
}

// Field order WITHIN the form: style first, then the copy, then settings —
// so the flat view (and the Style tab) opens on "what kind of section is this"
// rather than halfway down a list of toggles.
const ORDER = {layout: 0, content: 1, settings: 2}

// Inside Style, the variant picker comes first: "Image left / Image right" is
// the decision that changes what every other control means, and it arrives via
// each section's own fields — which sort after sectionBaseFields' backgroundTone
// unless it's promoted.
const PRIMARY = new Set(['variant', 'layout', 'imageLayout', 'galleryLayout', 'textContainer'])

/**
 * Return `schema` with groups attached, every field assigned to one, and the
 * fields sorted style → content → settings. Stable within each group, so a
 * schema's own ordering is preserved. Non-destructive: returns a new object.
 */
export function withSectionGroups(schema) {
  if (!schema || !Array.isArray(schema.fields)) return schema
  const fields = schema.fields.map((f) => ({
    ...f,
    group: f.group || groupForField(f.name),
  }))
  const rank = (f) => (PRIMARY.has(f.name) ? 0 : 1)
  const sorted = fields
    .map((f, i) => ({f, i}))
    .sort(
      (a, b) =>
        ORDER[a.f.group] - ORDER[b.f.group] ||
        rank(a.f) - rank(b.f) ||
        a.i - b.i,
    )
    .map(({f}) => f)

  // Only offer tabs that actually have fields — a section with no layout
  // controls (pullQuote, htmlEmbed) shouldn't show an empty Style tab.
  const present = new Set(sorted.map((f) => f.group))
  const groups = SECTION_GROUPS.filter((g) => present.has(g.name))
  // `default: true` on a tab that no longer exists leaves Sanity with no
  // default, so promote the first surviving tab.
  const withDefault = groups.map((g, i) => ({...g, default: i === 0}))

  return {...schema, groups: withDefault, fields: sorted}
}
