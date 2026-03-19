export default {
  name: 'experienceNextSteps',
  title: 'Next Steps',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Next Steps'}
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
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      description: 'Full-bleed background image. Landscape orientation recommended.',
      options: {hotspot: true},
      fields: [{name: 'alt', title: 'Alt text', type: 'string'}],
    },
    {
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'Small uppercase label above the heading.',
      placeholder: 'Next Steps',
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      placeholder: 'Get in touch',
    },
    {
      name: 'bodyFirst',
      title: 'Body — Paragraph 1',
      type: 'text',
      rows: 3,
      placeholder:
        'If this experience feels like the right fit for you and your dog, the next step is simply reaching out to start the conversation.',
    },
    {
      name: 'bodySecond',
      title: 'Body — Paragraph 2',
      type: 'text',
      rows: 3,
      placeholder:
        "I'm happy to answer questions, talk through options, and help you decide if this is the right experience for you.",
    },
    {
      name: 'ctaText',
      title: 'Button Text',
      type: 'string',
      placeholder: 'Get in touch',
    },
    {
      name: 'ctaLink',
      title: 'Button Link',
      type: 'string',
      description: 'URL or path the button links to.',
      placeholder: '/contact',
    },
  ],
}
