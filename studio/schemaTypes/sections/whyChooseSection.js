export default {
  name: 'whyChooseSection',
  title: 'Why Choose Section',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Why Choose Section'}
    },
  },
  fields: [
    {
      name: 'heading',
      title: 'Section Heading',
      type: 'string',
      description: 'Main H2 heading for the Why Choose section (e.g. "Why Choose Pet Photography?").',
    },
    {
      name: 'bodyFirst',
      title: 'Body — First Paragraph',
      type: 'text',
      rows: 4,
      description: 'First body paragraph explaining your value proposition.',
    },
    {
      name: 'bodySecond',
      title: 'Body — Second Paragraph',
      type: 'text',
      rows: 4,
      description: 'Second body paragraph. Leave blank to show only one paragraph.',
    },
    {
      name: 'ctaText',
      title: 'Button Text',
      type: 'string',
      description: 'Label for the call-to-action button (e.g. "Get in Touch").',
    },
    {
      name: 'ctaLink',
      title: 'Button Link',
      type: 'string',
      description: 'URL the button links to (e.g. "/contact").',
    },
    {
      name: 'caption',
      title: 'Below-Button Caption',
      type: 'string',
      description: 'Small text displayed beneath the button (e.g. "Serving Denver, Boulder, and surrounding areas.").',
    },
  ],
}
