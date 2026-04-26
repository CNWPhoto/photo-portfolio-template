import {sectionBaseFields} from '../_shared/sectionBase'
import {sectionIcon} from '../../components/SectionIcons'
import {imageField} from '../_shared/imageField'
import {richTextBody} from '../_shared/richTextBody'

// Three side-by-side cards. Replaces aboutWhatToExpectSection and the
// columns variant of processSection.
// See docs/page-builder-spec.md §2 (threeColumnSection).

export default {
  name: 'threeColumnSection',
  icon: sectionIcon('threeColumnSection'),
  title: 'Three Columns',
  type: 'object',
  preview: {
    select: {heading: 'heading'},
    prepare({heading}) {
      return {title: 'Three Columns', subtitle: heading || ''}
    },
  },
  fields: [
    ...sectionBaseFields({withVerticalSideLabel: true}),
    {
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'text',
      rows: 2,
      description: 'Use a line break (Enter) to split onto two lines.',
    },
    {
      name: 'columns',
      title: 'Columns',
      type: 'array',
      description: 'Exactly three columns required.',
      validation: (Rule) => Rule.length(3).error('Three columns required'),
      of: [
        {
          type: 'object',
          name: 'columnItem',
          fields: [
            imageField({}),
            {
              name: 'icon',
              title: 'Icon',
              type: 'string',
              description: 'Optional. Used by the icon-cards variant.',
            },
            {
              name: 'hideMedia',
              title: 'Hide image / icon / number',
              type: 'boolean',
              description:
                'When checked, this column renders text-only (no image, no icon, no number). Useful for an image-text-image layout where the middle column is all copy.',
              initialValue: false,
            },
            {
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            richTextBody(),
            {
              name: 'ctaText',
              title: 'Button Text',
              type: 'string',
              description: 'Optional. Renders as an accent-colored link with arrow.',
            },
            {
              name: 'ctaLink',
              title: 'Button Link',
              type: 'ctaLink',
            },
          ],
          preview: {
            select: {title: 'title', media: 'image'},
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
          {title: 'Image cards', value: 'image-cards'},
          {title: 'Icon cards', value: 'icon-cards'},
          {title: 'Numbered steps', value: 'numbered-steps'},
        ],
        layout: 'radio',
      },
      initialValue: 'image-cards',
    },
    {
      name: 'columnWidths',
      title: 'Column Widths',
      type: 'string',
      description:
        'Equal gives three matching columns. Wide middle and wide outer change the proportions for editorial layouts (e.g. portrait + rich text + portrait).',
      options: {
        list: [
          {title: 'Equal', value: 'equal'},
          {title: 'Wide middle (1 / 2 / 1)', value: 'wide-middle'},
          {title: 'Wide outer (2 / 1 / 2)', value: 'wide-outer'},
        ],
        layout: 'radio',
      },
      initialValue: 'equal',
    },
    {
      name: 'alignment',
      title: 'Alignment',
      type: 'string',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'left',
    },
  ],
}
