// Navigation settings — extended for the page builder rewrite per spec §9.
// Each top-level link can be internal (reference to a page doc) or external,
// and can carry an optional children[] array (max 8) to render as a dropdown.

const childLinkFields = [
  {
    name: 'label',
    title: 'Label',
    type: 'string',
    validation: (Rule) => Rule.required(),
  },
  {
    name: 'linkType',
    title: 'Link Type',
    type: 'string',
    options: {
      list: [
        {title: 'Internal page', value: 'internal'},
        {title: 'External URL', value: 'external'},
      ],
      layout: 'radio',
    },
    initialValue: 'external',
  },
  {
    name: 'internalRef',
    title: 'Page',
    type: 'reference',
    to: [
      {type: 'page'},
      {type: 'homepagePage'},
      {type: 'portfolio'},
      {type: 'blogPage'},
    ],
    weak: true,
    hidden: ({parent}) => parent?.linkType !== 'internal',
  },
  {
    name: 'url',
    title: 'URL',
    type: 'string',
    description: 'Use /page-name for internal pages, or a full URL for external links.',
    hidden: ({parent}) => parent?.linkType === 'internal',
  },
  {
    name: 'openInNewTab',
    title: 'Open in new tab',
    type: 'boolean',
    initialValue: false,
  },
]

export default {
  name: 'navSettings',
  title: 'Navigation',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  preview: {
    prepare() {
      return {title: 'Navigation'}
    },
  },
  fields: [
    {
      name: 'navVariant',
      title: 'Navigation Style',
      type: 'string',
      description: 'Choose the layout style for the navigation bar.',
      options: {
        list: [
          {title: 'Classic — logo left, links right', value: 'classic'},
          {title: 'Centered — logo centered, links below', value: 'centered'},
          {title: 'Split — logo centered, links balanced left and right', value: 'split'},
          {title: 'Transparent — starts transparent over hero, solidifies on scroll', value: 'transparent'},
        ],
        layout: 'radio',
      },
      initialValue: 'classic',
    },
    {
      name: 'links',
      title: 'Navigation Links',
      type: 'array',
      description:
        'Drag to reorder. Toggle "Show in navigation" to hide individual links without deleting them. Add children to a link to turn it into a dropdown menu.',
      of: [
        {
          type: 'object',
          name: 'navLink',
          title: 'Link',
          preview: {
            select: {title: 'label', subtitle: 'url', children: 'children'},
            prepare({title, subtitle, children}) {
              const childCount = Array.isArray(children) ? children.length : 0
              return {
                title: title || 'Untitled',
                subtitle: childCount > 0 ? `${subtitle || ''} • ${childCount} sub-link${childCount === 1 ? '' : 's'}` : subtitle || '',
              }
            },
          },
          fields: [
            {
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'Text shown in the navigation bar.',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'linkType',
              title: 'Link Type',
              type: 'string',
              options: {
                list: [
                  {title: 'Internal page', value: 'internal'},
                  {title: 'External URL', value: 'external'},
                ],
                layout: 'radio',
              },
              initialValue: 'external',
            },
            {
              name: 'internalRef',
              title: 'Page',
              type: 'reference',
              to: [
                {type: 'page'},
                {type: 'homepagePage'},
                {type: 'portfolio'},
                {type: 'blogPage'},
              ],
              weak: true,
              hidden: ({parent}) => parent?.linkType !== 'internal',
            },
            {
              name: 'url',
              title: 'URL',
              type: 'string',
              description: 'Use /page-name for internal pages, or a full URL for external links.',
              hidden: ({parent}) => parent?.linkType === 'internal',
            },
            {
              name: 'enabled',
              title: 'Show in navigation',
              type: 'boolean',
              initialValue: true,
            },
            {
              name: 'openInNewTab',
              title: 'Open in new tab',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'isButton',
              title: 'Style as button (CTA)',
              type: 'boolean',
              initialValue: false,
              description:
                'Renders this link as an accented CTA — ideal for the last link (e.g. "Inquire").',
            },
            {
              name: 'children',
              title: 'Dropdown Sub-Links',
              type: 'array',
              description: 'Add up to 8 sub-links to turn this link into a dropdown menu.',
              validation: (Rule) => Rule.max(8),
              of: [
                {
                  type: 'object',
                  name: 'navChildLink',
                  title: 'Sub-link',
                  preview: {
                    select: {title: 'label', subtitle: 'url'},
                    prepare({title, subtitle}) {
                      return {title: title || 'Untitled', subtitle: subtitle || ''}
                    },
                  },
                  fields: childLinkFields,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
