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
      name: 'newsletterEmbed',
      title: 'Newsletter Embed',
      type: 'text',
      rows: 8,
      description:
        'Paste your newsletter embed code here (Mailchimp, ConvertKit, Klaviyo, etc.). A Newsletter column will appear in the footer when this is filled in. Leave blank to keep the footer as two columns.',
    },
  ],
}
