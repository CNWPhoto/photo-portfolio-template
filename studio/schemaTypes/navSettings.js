// Navigation settings — extended for the page builder rewrite per spec §9.
// Each top-level link can be internal (reference to a page doc) or external,
// and can carry an optional children[] array (max 8) to render as a dropdown.

import HexColorInput from '../components/HexColorInput'

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
          {title: 'Transparent — overlays the hero; becomes opaque on scroll when Sticky is on', value: 'transparent'},
          {title: 'Transparent Split — split layout overlays the hero; becomes opaque on scroll when Sticky is on', value: 'transparent-split'},
        ],
        layout: 'radio',
      },
      initialValue: 'classic',
    },
    {
      name: 'stickyNav',
      title: 'Sticky navigation',
      type: 'boolean',
      description:
        'When on, the nav bar stays pinned at the top of the page as visitors scroll. Leave off for a nav that scrolls out of view with the rest of the page. For Transparent and Transparent Split variants, turning Sticky on also enables the scroll-to-opaque effect (the bar starts clear over the hero, then fills in with the page background once the visitor scrolls past it). With Sticky off, transparent variants stay clear and simply scroll away with the hero.',
      initialValue: false,
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
              name: 'ctaColor',
              title: 'CTA color override',
              type: 'string',
              description:
                'Optional color for this CTA link only. Useful with the transparent nav variant when the accent color blends into the hero background image. Leave blank to use the site accent color.',
              hidden: ({parent}) => !parent?.isButton,
              components: {input: HexColorInput},
              validation: (Rule) =>
                Rule.custom((value) => {
                  if (!value) return true
                  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
                    ? true
                    : 'Must be a hex color like #ffcc00 or #fc0'
                }),
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
