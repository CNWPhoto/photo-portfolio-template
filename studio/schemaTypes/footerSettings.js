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
      name: 'newsletterEmbed',
      title: 'Newsletter Embed',
      type: 'text',
      rows: 8,
      description:
        'Paste your newsletter embed code here (Mailchimp, ConvertKit, Klaviyo, etc.). A Newsletter column will appear in the footer when this is filled in. Leave blank to keep the footer as two columns.',
    },
  ],
}
