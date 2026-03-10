export default {
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  orderings: [
    {
      title: 'Manual Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
  fields: [
    {
      name: 'question',
      title: 'Question',
      type: 'string',
      description: 'The question as a client would ask it (e.g. "How long does a session take?").',
    },
    {
      name: 'answer',
      title: 'Answer',
      type: 'text',
      rows: 4,
      description: 'Your answer in plain, friendly language. A few sentences is ideal — keep it scannable.',
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Controls the order FAQs appear on the Experience page. Lower numbers appear first (e.g. 1, 2, 3).',
    },
  ],
  preview: {
    select: {
      title: 'question',
    },
  },
}
