export default {
  name: 'homepageFaqs',
  title: 'Homepage FAQs',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Homepage FAQs'}
    },
  },
  fields: [
    {
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      description: 'Questions and answers displayed in the FAQ section on the homepage.',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'question',
              title: 'Question',
              type: 'string',
              description: 'The question as a client would ask it.',
            },
            {
              name: 'answer',
              title: 'Answer',
              type: 'text',
              rows: 4,
              description: 'Your answer in plain, friendly language.',
            },
          ],
          preview: {
            select: {title: 'question'},
          },
        },
      ],
    },
  ],
}
