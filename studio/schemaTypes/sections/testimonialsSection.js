import {sectionBaseFields} from '../_shared/sectionBase'
import {sectionIcon} from '../../components/SectionIcons'
import ManageTestimonialsLink from '../../components/ManageTestimonialsLink'

// Testimonials section. Pulls from testimonial documents.
// See docs/page-builder-spec.md §2 (testimonialsSection).

export default {
  name: 'testimonialsSection',
  icon: sectionIcon('testimonialsSection'),
  title: 'Testimonials',
  type: 'object',
  preview: {
    select: {heading: 'heading'},
    prepare({heading}) {
      return {title: 'Testimonials', subtitle: heading || ''}
    },
  },
  fields: [
    ...sectionBaseFields(),
    {
      name: 'manageLink',
      title: 'Manage testimonials',
      type: 'string',
      readOnly: true,
      components: {input: ManageTestimonialsLink},
    },
    {
      name: 'layout',
      title: 'Layout',
      type: 'string',
      description:
        '"Image + slider" shows one testimonial at a time with a photo on the left and prev/next arrows. "2-column text only" shows two testimonials side by side without photos.',
      options: {
        list: [
          {title: 'Image + slider', value: 'image-slider'},
          {title: '2-column text only', value: 'two-col-text'},
        ],
        layout: 'radio',
      },
      initialValue: 'image-slider',
    },
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
      name: 'maxCount',
      title: 'Max Count',
      type: 'number',
      description: 'Optional. Limits how many testimonials to show. Leave blank to show all. (2-column text only uses just the first 2.)',
    },
  ],
}
