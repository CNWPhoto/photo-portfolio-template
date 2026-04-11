// Common fields shared by every section in the unified page builder.
// Spread into a section schema's fields array via `...sectionBaseFields()`.

export const sectionBaseFields = ({groupName} = {}) => {
  const group = groupName ? {group: groupName} : {}
  return [
    {
      name: 'enabled',
      title: 'Enabled',
      type: 'boolean',
      description: 'Show or hide this section',
      initialValue: true,
      ...group,
    },
    {
      name: 'palette',
      title: 'Palette Override',
      type: 'string',
      description:
        'Optional: enter a palette slug from Site Settings (e.g. "warm-studio") to override the page default for this section. Leave blank to inherit.',
      ...group,
    },
    {
      name: 'spacing',
      title: 'Spacing',
      type: 'string',
      options: {
        list: [
          {title: 'Compact', value: 'compact'},
          {title: 'Normal', value: 'normal'},
          {title: 'Spacious', value: 'spacious'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'normal',
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
    {
      name: 'verticalSideLabel',
      title: 'Vertical Side Label',
      type: 'string',
      description:
        'Optional small uppercase label rendered vertically on the side of the section (e.g. "FAQs"). Leave blank to hide.',
      ...group,
    },
  ]
}

export default sectionBaseFields
