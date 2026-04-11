import {sectionBaseFields} from '../_shared/sectionBase'
import {imageField} from '../_shared/imageField'

// Horizontal call-to-action strip. Replaces aboutCtaSection.
// See docs/page-builder-spec.md §2 (ctaBandSection).

export default {
  name: 'ctaBandSection',
  title: 'CTA Band',
  type: 'object',
  preview: {
    select: {heading: 'heading'},
    prepare({heading}) {
      return {title: 'CTA Band', subtitle: heading || ''}
    },
  },
  fields: [
    ...sectionBaseFields(),
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Use a line break (Enter) to split onto two lines.',
    },
    {
      name: 'body',
      title: 'Body',
      type: 'string',
      description: 'A short one or two sentences.',
    },
    {
      name: 'ctaText',
      title: 'Button Text',
      type: 'string',
    },
    {
      name: 'ctaLink',
      title: 'Button Link',
      type: 'ctaLink',
    },
    imageField({name: 'backgroundImage', title: 'Background Image'}),
    {
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: 'Centered', value: 'centered'},
          {title: 'Split (text left, CTA right)', value: 'split-text-left-cta-right'},
        ],
        layout: 'radio',
      },
      initialValue: 'centered',
    },
  ],
}
