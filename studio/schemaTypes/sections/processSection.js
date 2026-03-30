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
      name: 'heading',
      title: 'Main Heading (H2)',
      type: 'string',
      description: 'The primary section heading shown above the steps. e.g. "Dog Photography Sessions"',
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Subtitle shown below the heading. e.g. "Simple and relaxed sessions you and your dog will love."',
    },
    {
      name: 'step1Title',
      title: 'Step 1 — Title',
      type: 'string',
      description: 'e.g. "Reach Out"',
    },
    {
      name: 'step1Body',
      title: 'Step 1 — Paragraph',
      type: 'text',
      rows: 3,
    },
    {
      name: 'step2Title',
      title: 'Step 2 — Title',
      type: 'string',
      description: 'e.g. "Your Session"',
    },
    {
      name: 'step2Body',
      title: 'Step 2 — Paragraph',
      type: 'text',
      rows: 3,
    },
    {
      name: 'step3Title',
      title: 'Step 3 — Title',
      type: 'string',
      description: 'e.g. "The Images"',
    },
    {
      name: 'step3Body',
      title: 'Step 3 — Paragraph',
      type: 'text',
      rows: 3,
    },
    {
      name: 'ctaText',
      title: 'CTA Button Text',
      type: 'string',
      description: 'e.g. "Learn How it Works"',
    },
    {
      name: 'ctaLink',
      title: 'CTA Button Link',
      type: 'string',
      description: 'URL the CTA button links to. e.g. "/experience"',
    },
  ],
}
