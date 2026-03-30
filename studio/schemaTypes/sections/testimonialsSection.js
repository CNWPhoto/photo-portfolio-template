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
      name: 'heading',
      title: 'Section Heading',
      type: 'string',
      description: 'Optional heading shown above the testimonials. Leave blank to hide.',
      placeholder: 'What Our Clients Say',
    },
  ],
}
