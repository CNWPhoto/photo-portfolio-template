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
    ...sectionBaseFields({spacing: false}),
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
      name: 'heading',
      title: 'Heading',
      type: 'string',
      initialValue: 'What Clients Are Saying',
    },
    {
      name: 'source',
      title: 'Which testimonials?',
      type: 'string',
      description:
        'Show everything you\'ve published, or hand-pick testimonials for this section — useful when a page is about one type of session.',
      options: {
        list: [
          {title: 'All testimonials (newest order first)', value: 'all'},
          {title: 'Pick specific ones', value: 'pickSpecific'},
        ],
        layout: 'radio',
      },
      initialValue: 'all',
    },
    {
      name: 'testimonials',
      title: 'Chosen testimonials',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'testimonial'}]}],
      description:
        'Drag to reorder — this is the order they appear in. Only the ones listed here will show in this section.',
      hidden: ({parent}) => parent?.source !== 'pickSpecific',
      // A section set to "Pick specific ones" with an empty list would silently
      // fall back to showing everything, which reads as the setting being
      // broken. Block publish instead of surprising the editor.
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.parent?.source !== 'pickSpecific') return true
          return value?.length
            ? true
            : 'Pick at least one testimonial, or switch back to "All testimonials".'
        }),
    },
    {
      name: 'maxCount',
      title: 'Max Count',
      type: 'number',
      description: 'Optional. Limits how many testimonials to show. Leave blank to show all. (2-column text only uses just the first 2.)',
      // Irrelevant when the list is hand-picked — the chosen items are the limit.
      hidden: ({parent}) => parent?.source === 'pickSpecific',
    },
    {
      name: 'mobileFlipOrder',
      title: 'Flip image/text order on mobile',
      type: 'boolean',
      description:
        'When on, the quote stacks ABOVE the photo on mobile (≤900px) instead of below it. Use it when the surrounding sections make text-first flow read better. Off by default. Only applies to the Image + slider layout.',
      initialValue: false,
      hidden: ({parent}) => parent?.layout === 'two-col-text',
    },
  ],
}
