// Common fields shared by every section in the unified page builder.
// Spread into a section schema's fields array via `...sectionBaseFields()`.
// Pass `withVerticalSideLabel: true` for the four section types that
// support the optional vertical side-rail label (see spec §17): splitSection,
// threeColumnSection, faqSection (list variant), featuredPortfolioSection.

export const sectionBaseFields = ({groupName, withVerticalSideLabel = false} = {}) => {
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
    {
      name: 'backgroundTone',
      title: 'Background Tone',
      type: 'string',
      description:
        'Which background shade from the site palette this section uses. Light is the default page background; Alt is a slightly darker shade; Dark is the full dark section color.',
      options: {
        list: [
          {title: 'Light (default)', value: 'default'},
          {title: 'Alt (subtle darker)', value: 'alt'},
          {title: 'Dark', value: 'dark'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'default',
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
  ]
  if (withVerticalSideLabel) {
    fields.push({
      name: 'verticalSideLabel',
      title: 'Vertical Side Label',
      type: 'string',
      description:
        'Optional small uppercase label rendered vertically on the side of the section (e.g. "FAQs"). Leave blank to hide.',
      ...group,
    })
  }
  return fields
}

export default sectionBaseFields
