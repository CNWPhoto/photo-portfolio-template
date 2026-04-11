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
      name: 'enabled',
      title: 'Show Section',
      type: 'boolean',
      description: 'Toggle this section on or off on the homepage.',
      initialValue: true,
    },
    {
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      description: 'Questions and answers displayed in the FAQ section on the homepage.',
      initialValue: [
        {
          _key: 'faq1',
          _type: 'object',
          question: 'What should I expect from a session?',
          answer:
            'Sessions are relaxed, unhurried, and tailored to you. I will guide you through everything — no experience in front of a camera required.',
        },
        {
          _key: 'faq2',
          _type: 'object',
          question: 'How long does a typical session last?',
          answer:
            'Most sessions run about 90 minutes, giving us plenty of time to settle in, explore the location, and capture a wide range of images without feeling rushed.',
        },
        {
          _key: 'faq3',
          _type: 'object',
          question: 'When will I receive my photos?',
          answer:
            'Your private online gallery will be ready within three weeks of your session. Rush delivery is available on request for an additional fee.',
        },
        {
          _key: 'faq4',
          _type: 'object',
          question: 'Where are you based and do you travel?',
          answer:
            'I am based locally and happily travel for sessions. Travel fees may apply beyond a certain radius — just ask.',
        },
      ],
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
