export default {
  name: 'aboutQuoteSection',
  title: 'Quote Section',
  type: 'object',
  preview: {
    select: {quote: 'quoteText'},
    prepare({quote}) {
      return {title: 'Quote', subtitle: quote ? `"${quote.slice(0, 60)}…"` : ''}
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
