// Footer settings — restructured per docs/page-builder-spec.md §1a.
// The footer is independent of the main nav: free-form links[] (mirroring
// navSettings.links shape, no dropdowns), an htmlEmbedSection reference for
// the middle column, and the existing legalLinks block preserved.

export default {
  name: 'footerSettings',
  title: 'Footer',
  type: 'document',
  __experimental_actions: ['create', 'update', 'publish'],
  preview: {
    select: {title: 'internalTitle'},
    prepare({title}) {
      return {title: title || 'Footer'}
    },
  },
  fields: [
    {
      name: 'internalTitle',
      title: 'Title',
      type: 'string',
      readOnly: true,
      initialValue: 'Footer',
      hidden: true,
    },
    {
      name: 'links',
      title: 'Footer Links',
      type: 'array',
      description:
        'Drag to reorder. Toggle "Show in footer" to hide individual links without deleting them. Footer links are independent of the main nav — you can include extra links here like Privacy Policy or RSS.',
      of: [
        {
          type: 'object',
          name: 'footerLink',
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
              description: 'Text shown in the footer.',
            },
            {
              name: 'url',
              title: 'URL',
              type: 'string',
              description: 'Use /page-name for internal pages, or a full URL for external links.',
            },
            {
              name: 'enabled',
              title: 'Show in footer',
              type: 'boolean',
              initialValue: true,
            },
            {
              name: 'openInNewTab',
              title: 'Open in new tab',
              type: 'boolean',
              initialValue: false,
            },
          ],
        },
      ],
    },
    {
      name: 'middleColumn',
      title: 'Middle Column',
      type: 'object',
      description:
        'Optional column shown between the menu and the logo/social column. Pick an HTML Embed (e.g. a newsletter signup) OR write a short text note. Leave both blank to hide this column.',
      options: {collapsible: true, collapsed: false},
      fields: [
        {
          name: 'enabled',
          title: 'Show middle column',
          type: 'boolean',
          initialValue: false,
        },
        {
          name: 'label',
          title: 'Column Heading',
          type: 'string',
          description: 'Optional label shown above the content (e.g. "Newsletter", "Stay in Touch").',
          placeholder: 'Newsletter',
        },
        {
          name: 'embed',
          title: 'HTML Embed',
          type: 'reference',
          to: [{type: 'htmlEmbedSection'}],
          description:
            'Reference an HTML Embed document (e.g. a Mailchimp newsletter signup). If set, this takes priority over the text note below.',
        },
        {
          name: 'note',
          title: 'Text Note',
          type: 'array',
          description:
            'Write a short note instead of an embed (e.g. contact info, a tagline, a short bio). Used only if HTML Embed above is left blank.',
          of: [
            {
              type: 'block',
              styles: [{title: 'Normal', value: 'normal'}],
              lists: [],
              marks: {
                decorators: [
                  {title: 'Bold', value: 'strong'},
                  {title: 'Italic', value: 'em'},
                ],
                annotations: [
                  {
                    name: 'link',
                    type: 'object',
                    title: 'Link',
                    fields: [{name: 'href', type: 'url', title: 'URL'}],
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      name: 'legalLinks',
      title: 'Legal Links',
      type: 'object',
      description:
        'Optional Privacy Policy and Terms links shown at the bottom of the footer. Toggle each on and paste in the URL.',
      options: {collapsible: true, collapsed: false},
      fields: [
        {
          name: 'privacyPolicy',
          title: 'Privacy Policy',
          type: 'object',
          options: {collapsible: false},
          fields: [
            {name: 'enabled', title: 'Show link', type: 'boolean', initialValue: false},
            {name: 'label', title: 'Label', type: 'string', initialValue: 'Privacy Policy'},
            {name: 'url', title: 'URL', type: 'string', placeholder: '/privacy-policy'},
          ],
        },
        {
          name: 'terms',
          title: 'Terms of Service',
          type: 'object',
          options: {collapsible: false},
          fields: [
            {name: 'enabled', title: 'Show link', type: 'boolean', initialValue: false},
            {name: 'label', title: 'Label', type: 'string', initialValue: 'Terms'},
            {name: 'url', title: 'URL', type: 'string', placeholder: '/terms'},
          ],
        },
      ],
    },
  ],
}
