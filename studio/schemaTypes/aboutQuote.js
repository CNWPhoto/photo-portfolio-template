export default {
  name: 'aboutQuote',
  title: 'Quote Section',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  preview: {
    prepare() {
      return {title: 'Quote Section'}
    },
  },
  fields: [
    {
      name: 'enabled',
      title: 'Show this section',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'quoteText',
      title: 'Quote',
      type: 'text',
      rows: 2,
      placeholder: 'I believe photographs should feel honest, timeless, and personal.',
    },
  ],
}
