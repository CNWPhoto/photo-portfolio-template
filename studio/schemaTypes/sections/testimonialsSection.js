import {sectionBaseFields} from '../_shared/sectionBase'

// Testimonials section. Pulls from testimonial documents.
// See docs/page-builder-spec.md §2 (testimonialsSection).

export default {
  name: 'testimonialsSection',
  title: 'Testimonials',
  type: 'object',
  preview: {
    select: {heading: 'heading', layout: 'layout'},
    prepare({heading, layout}) {
      return {title: 'Testimonials', subtitle: heading || layout || ''}
    },
  },
  fields: [
    ...sectionBaseFields(),
    {
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      initialValue: 'What Clients Are Saying',
    },
    {
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: 'Slider', value: 'slider'},
          {title: 'Grid', value: 'grid'},
          {title: 'Single featured', value: 'single-featured'},
        ],
        layout: 'radio',
      },
      initialValue: 'slider',
    },
    {
      name: 'source',
      title: 'Source',
      type: 'string',
      options: {
        list: [
          {title: 'All testimonials (newest first)', value: 'all'},
          {title: 'Pick specific', value: 'pickSpecific'},
        ],
        layout: 'radio',
      },
      initialValue: 'all',
    },
    {
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'testimonial'}]}],
      hidden: ({parent}) => parent?.source !== 'pickSpecific',
    },
    {
      name: 'maxCount',
      title: 'Max Count',
      type: 'number',
      description: 'Optional. Limits how many to show when source is "All".',
      hidden: ({parent}) => parent?.source !== 'all',
    },
  ],
}
