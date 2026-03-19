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
          // {title: 'Transparent — starts transparent over hero, solidifies on scroll', value: 'transparent'},
        ],
        layout: 'radio',
      },
      initialValue: 'classic',
    },
    {
      name: 'links',
      title: 'Navigation Links',
      type: 'array',
      description: 'Drag to reorder. Toggle "Show in navigation" to hide individual links without deleting them.',
      of: [
        {
          type: 'object',
          name: 'navLink',
          title: 'Link',
          preview: {
            select: {title: 'label', subtitle: 'url'},
            prepare({title, subtitle}) {
              return {title: title || 'Untitled', subtitle: subtitle || ''}
            },
          },
          fields: [
            {
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'Text shown in the navigation bar.',
            },
            {
              name: 'url',
              title: 'URL',
              type: 'string',
              description: 'Use /page-name for internal pages, or a full URL for external links.',
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
          ],
        },
      ],
    },
  ],
}
