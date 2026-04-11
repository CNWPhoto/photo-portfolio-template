import {sectionBaseFields} from '../_shared/sectionBase'
import {imageField} from '../_shared/imageField'
import {richTextBody} from '../_shared/richTextBody'

// Step-by-step list. Replaces processSection (which had hardcoded step1/2/3
// fields) — the new schema uses an array so editors can have any number.
// See docs/page-builder-spec.md §2 (stepsSection).

export default {
  name: 'stepsSection',
  title: 'Steps',
  type: 'object',
  preview: {
    select: {heading: 'heading'},
    prepare({heading}) {
      return {title: 'Steps', subtitle: heading || ''}
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
    },
    {
      name: 'steps',
      title: 'Steps',
      type: 'array',
      validation: (Rule) => Rule.min(1),
      of: [
        {
          type: 'object',
          name: 'stepItem',
          fields: [
            {
              name: 'stepNumber',
              title: 'Step Number',
              type: 'string',
              description: 'Optional label like "01".',
            },
            {
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            richTextBody(),
            imageField({}),
          ],
          preview: {
            select: {title: 'title', subtitle: 'stepNumber', media: 'image'},
          },
        },
      ],
    },
    {
      name: 'variant',
      title: 'Variant',
      type: 'string',
      options: {
        list: [
          {title: 'Stacked', value: 'stacked'},
          {title: 'Timeline', value: 'timeline'},
          {title: 'Horizontal cards', value: 'horizontal-cards'},
        ],
        layout: 'radio',
      },
      initialValue: 'stacked',
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
  ],
}
