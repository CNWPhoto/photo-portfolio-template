export default {
  name: 'testimonialsSection',
  title: 'Testimonials Section',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Testimonials Section'}
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
      title: 'Section Heading',
      type: 'string',
      description: 'Optional heading shown above the testimonials. Leave blank to hide.',
      placeholder: 'What Our Clients Say',
    },
  ],
}
