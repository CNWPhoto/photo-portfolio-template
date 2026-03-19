export default {
  name: 'experienceFaqs',
  title: 'FAQs',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'FAQs'}
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
      name: 'faqs',
      title: 'Questions & Answers',
      type: 'array',
      description: 'Drag to reorder.',
      of: [
        {
          type: 'object',
          name: 'faqItem',
          fields: [
            {
              name: 'question',
              title: 'Question',
              type: 'string',
            },
            {
              name: 'answer',
              title: 'Answer',
              type: 'text',
              rows: 3,
            },
          ],
          preview: {
            select: {title: 'question'},
            prepare({title}) {
              return {title: title || 'Untitled question'}
            },
          },
        },
      ],
    },
  ],
}
