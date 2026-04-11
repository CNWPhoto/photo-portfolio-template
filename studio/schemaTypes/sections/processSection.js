export default {
  name: 'processSection',
  title: 'Process Section',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Process Section'}
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
      name: 'heading',
      title: 'Main Heading (H2)',
      type: 'string',
      description: 'Primary section heading shown above the steps.',
      initialValue: 'How It Works',
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Subtitle shown below the heading.',
      initialValue: 'Simple, relaxed sessions from first hello to final gallery.',
    },
    {
      name: 'step1Title',
      title: 'Step 1 — Title',
      type: 'string',
      initialValue: 'Reach Out',
    },
    {
      name: 'step1Body',
      title: 'Step 1 — Paragraph',
      type: 'text',
      rows: 3,
      initialValue:
        'Tell me about what you have in mind. We will talk through location options, timing, and everything that will make your session perfect.',
    },
    {
      name: 'step2Title',
      title: 'Step 2 — Title',
      type: 'string',
      initialValue: 'Your Session',
    },
    {
      name: 'step2Body',
      title: 'Step 2 — Paragraph',
      type: 'text',
      rows: 3,
      initialValue:
        'Sessions are unhurried and natural. No stiff posing — just real moments, beautiful light, and an experience you will look forward to.',
    },
    {
      name: 'step3Title',
      title: 'Step 3 — Title',
      type: 'string',
      initialValue: 'The Images',
    },
    {
      name: 'step3Body',
      title: 'Step 3 — Paragraph',
      type: 'text',
      rows: 3,
      initialValue:
        'Within three weeks, your private online gallery arrives. Choose your favorites for fine art prints, albums, and high-resolution downloads.',
    },
    {
      name: 'ctaText',
      title: 'CTA Button Text',
      type: 'string',
      initialValue: 'Learn How it Works',
    },
    {
      name: 'ctaLink',
      title: 'CTA Button Link',
      type: 'string',
      description: 'URL the CTA button links to.',
      initialValue: '/experience',
    },
  ],
}
