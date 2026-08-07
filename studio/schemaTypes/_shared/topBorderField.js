// Shared "Top divider line" toggle.
//
// Three sections — Contact Form, CTA Band and Steps — render an <hr> as their
// first child. It reads as a divider between this section and whatever comes
// before it, which is right in the middle of a page and wrong in two common
// cases: when the section above already ends in a rule (two lines stacked), or
// when this section opens the page (a line hanging under the nav).
//
// Shared rather than copied into each schema, because three identical field
// definitions are exactly what drifts the first time one of them is edited.
//
// Defaults to shown, and the renderer treats undefined as shown, so every
// existing section on every site keeps its rule until someone turns it off.
export const topBorderField = (overrides = {}) => ({
  name: 'showTopBorder',
  title: 'Top divider line',
  type: 'boolean',
  description:
    'Shows a thin rule across the top of this section. Turn it off when the section above already ends in a line, or when this is the first thing on the page.',
  initialValue: true,
  ...overrides,
})
