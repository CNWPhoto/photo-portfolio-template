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
      name: 'menu',
      title: 'Menu Links',
      type: 'object',
      description: 'Control which pages appear in the footer menu and how they are labelled.',
      options: {collapsible: true, collapsed: false},
      fields: [
        {
          name: 'home',
          title: 'Home',
          type: 'object',
          options: {collapsible: false},
          fields: [
            {name: 'enabled', title: 'Show in footer', type: 'boolean', initialValue: true},
            {name: 'label', title: 'Label', type: 'string', placeholder: 'Home'},
          ],
        },
        {
          name: 'about',
          title: 'About',
          type: 'object',
          options: {collapsible: false},
          fields: [
            {name: 'enabled', title: 'Show in footer', type: 'boolean', initialValue: true},
            {name: 'label', title: 'Label', type: 'string', placeholder: 'About'},
          ],
        },
        {
          name: 'experience',
          title: 'Experience',
          type: 'object',
          options: {collapsible: false},
          fields: [
            {name: 'enabled', title: 'Show in footer', type: 'boolean', initialValue: true},
            {name: 'label', title: 'Label', type: 'string', placeholder: 'Experience'},
          ],
        },
        {
          name: 'portfolio',
          title: 'Portfolio',
          type: 'object',
          options: {collapsible: false},
          fields: [
            {name: 'enabled', title: 'Show in footer', type: 'boolean', initialValue: true},
            {name: 'label', title: 'Label', type: 'string', placeholder: 'Portfolio'},
          ],
        },
        {
          name: 'blog',
          title: 'Blog',
          type: 'object',
          options: {collapsible: false},
          fields: [
            {name: 'enabled', title: 'Show in footer', type: 'boolean', initialValue: true},
            {name: 'label', title: 'Label', type: 'string', placeholder: 'Blog'},
          ],
        },
        {
          name: 'contact',
          title: 'Contact',
          type: 'object',
          options: {collapsible: false},
          fields: [
            {name: 'enabled', title: 'Show in footer', type: 'boolean', initialValue: true},
            {name: 'label', title: 'Label', type: 'string', placeholder: 'Contact'},
          ],
        },
      ],
    },
    {
      name: 'middleColumn',
      title: 'Middle Column',
      type: 'object',
      description:
        'Optional column that appears between the menu and the logo/social column. Fill in either the embed code or the text note — not both. Leave both blank to hide this column.',
      options: {collapsible: true, collapsed: false},
      fields: [
        {
          name: 'label',
          title: 'Column Heading',
          type: 'string',
          description: 'Optional label shown above the content (e.g. "Newsletter", "Stay in Touch").',
          placeholder: 'Newsletter',
        },
        {
          name: 'embedCode',
          title: 'Embed Code',
          type: 'text',
          rows: 8,
          description:
            'Paste a newsletter embed code here (Mailchimp, ConvertKit, Klaviyo, etc.). If filled, this takes priority over the text note below.',
        },
        {
          name: 'note',
          title: 'Text Note',
          type: 'array',
          description:
            'Write a short note or message instead of an embed (e.g. contact info, a tagline, a short bio). Used only if Embed Code above is left blank.',
          of: [
            {
              type: 'block',
              styles: [{title: 'Normal', value: 'normal'}],
              lists: [],
              marks: {
                decorators: [
                  {title: 'Strong', value: 'strong'},
                  {title: 'Emphasis', value: 'em'},
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
  ],
}
