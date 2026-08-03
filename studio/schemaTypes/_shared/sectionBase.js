// Common fields shared by every section in the unified page builder.
// Spread into a section schema's fields array via `...sectionBaseFields()`.
// Pass `withVerticalSideLabel: true` for the four section types that
// support the optional vertical side-rail label (see spec §17): splitSection,
// threeColumnSection, faqSection (list variant), featuredPortfolioSection.
//
// `spacing` lives here again. It was removed once because most components
// ignored it — editors set "Tall" and nothing happened. The four that were
// silently dropping it (FAQ, Featured Portfolio, Steps, Testimonials) now emit
// data-spacing, and the three where vertical padding is structurally
// meaningless — Hero and Full-Bleed Image are height-driven, splitSection is
// `padding: 0 !important` by design — pass `spacing: false` so the control is
// never shown rather than shown and ignored.
//
// `spacingOverride` is the advanced escape hatch: collapsed by default, and
// only needed when one edge has to differ from the other (e.g. pulling a
// heading down onto the images below it). Left on "Match padding" it does
// nothing, so the common case stays a single dropdown.

const SPACING_STEPS = [
  {title: 'Short', value: 'narrow'},
  {title: 'Medium', value: 'compact'},
  {title: 'Default', value: 'normal'},
  {title: 'Tall', value: 'spacious'},
]

export const sectionBaseFields = ({
  groupName,
  withVerticalSideLabel = false,
  spacing = true,
} = {}) => {
  const group = groupName ? {group: groupName} : {}
  const fields = [
    {
      name: 'enabled',
      title: 'Enabled',
      type: 'boolean',
      description: 'Show or hide this section',
      initialValue: true,
      ...group,
    },
    ...(spacing
      ? [
          {
            name: 'spacing',
            title: 'Vertical Padding',
            type: 'string',
            description:
              'Top & bottom padding for this section. Short ≈ 20–25px; Default matches the other sections; Tall adds extra breathing room.',
            options: {
              list: SPACING_STEPS,
              layout: 'radio',
              direction: 'horizontal',
            },
            initialValue: 'normal',
            ...group,
          },
          {
            name: 'spacingOverride',
            title: 'Fine-tune padding',
            type: 'object',
            description:
              'Optional. Set one edge independently — e.g. "None" below to sit this section directly against the next one. Leave both on "Match padding" and the Vertical Padding setting above applies to both edges.',
            options: {collapsible: true, collapsed: true},
            fields: [
              {
                name: 'top',
                title: 'Space above',
                type: 'string',
                options: {
                  list: [
                    {title: 'Match padding', value: 'inherit'},
                    {title: 'None', value: 'none'},
                    ...SPACING_STEPS,
                  ],
                },
                initialValue: 'inherit',
              },
              {
                name: 'bottom',
                title: 'Space below',
                type: 'string',
                options: {
                  list: [
                    {title: 'Match padding', value: 'inherit'},
                    {title: 'None', value: 'none'},
                    ...SPACING_STEPS,
                  ],
                },
                initialValue: 'inherit',
              },
            ],
            ...group,
          },
        ]
      : []),
    {
      name: 'backgroundTone',
      title: 'Background Tone',
      type: 'string',
      description:
        'Which background shade from the site palette this section uses. Light is the main page background; Alt is a slightly darker shade; Dark is the full dark section color; Vibrant is the palette’s bold accent band (text auto-contrasts).',
      options: {
        list: [
          {title: 'Light', value: 'default'},
          {title: 'Alt (subtle darker)', value: 'alt'},
          {title: 'Dark', value: 'dark'},
          {title: 'Vibrant', value: 'vibrant'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'default',
      ...group,
    },
    {
      name: 'sectionId',
      title: 'Anchor ID',
      type: 'string',
      description:
        'Optional anchor for in-page links (e.g. "contact" → linkable as #contact). Lowercase letters, digits, and dashes only.',
      validation: (Rule) =>
        Rule.regex(/^[a-z0-9-]*$/, {name: 'lowercase-dash', invert: false}).error(
          'Lowercase letters, digits, and dashes only',
        ),
      ...group,
    },
  ]
  if (withVerticalSideLabel) {
    fields.push({
      name: 'verticalSideLabel',
      title: 'Vertical Side Label',
      type: 'string',
      description:
        'Optional label rendered vertically on the side of the section (e.g. "FAQs"). Leave blank to hide.',
      ...group,
    })
  }
  return fields
}

export default sectionBaseFields
