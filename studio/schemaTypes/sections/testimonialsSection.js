import {testimonialsVariants} from '../pageLayouts'

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
      name: 'variant',
      title: 'Layout Style',
      type: 'string',
      description: 'Choose how client testimonials are displayed.',
      options: {list: testimonialsVariants, layout: 'radio'},
      initialValue: 'slider',
    },
  ],
}
