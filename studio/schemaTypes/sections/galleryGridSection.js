import {sectionBaseFields} from '../_shared/sectionBase'
import {imageField} from '../_shared/imageField'

// Manual image grid (not pulled from portfolio).
// See docs/page-builder-spec.md §2 (galleryGridSection).

export default {
  name: 'galleryGridSection',
  title: 'Gallery Grid',
  type: 'object',
  preview: {
    select: {heading: 'heading'},
    prepare({heading}) {
      return {title: 'Gallery Grid', subtitle: heading || ''}
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
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        {
          ...imageField({}),
          fields: [
            {
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              validation: (Rule) =>
                Rule.custom((alt, ctx) => {
                  if (!ctx.parent?.asset) return true
                  if (!alt || alt.trim() === '') return 'Alt text is required'
                  return true
                }).warning(),
            },
            {
              name: 'caption',
              title: 'Caption',
              type: 'string',
              description: 'Optional caption shown below the image.',
            },
          ],
        },
      ],
    },
    {
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: '2 columns', value: 'grid-2'},
          {title: '3 columns', value: 'grid-3'},
          {title: '4 columns', value: 'grid-4'},
          {title: 'Masonry', value: 'masonry'},
        ],
        layout: 'radio',
      },
      initialValue: 'grid-3',
    },
    {
      name: 'gap',
      title: 'Gap',
      type: 'string',
      options: {
        list: [
          {title: 'Tight', value: 'tight'},
          {title: 'Normal', value: 'normal'},
          {title: 'Loose', value: 'loose'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'normal',
    },
    {
      name: 'lightbox',
      title: 'Click to enlarge (lightbox)',
      type: 'boolean',
      initialValue: true,
    },
  ],
}
