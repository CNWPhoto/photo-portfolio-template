import {sectionBaseFields} from '../_shared/sectionBase'
import {sectionIcon} from '../../components/SectionIcons'
import {imageField, BULK_UPLOAD_TIP} from '../_shared/imageField'
import {emptyImagesWarning} from '../_shared/imageValidation'

// Manual image grid (not pulled from portfolio).
// See docs/page-builder-spec.md §2 (galleryGridSection).

export default {
  name: 'galleryGridSection',
  icon: sectionIcon('galleryGridSection'),
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
      description: BULK_UPLOAD_TIP,
      validation: emptyImagesWarning,
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
          {title: 'Carousel (slider)', value: 'carousel'},
        ],
        layout: 'radio',
      },
      initialValue: 'grid-3',
    },
    {
      name: 'carouselHeight',
      title: 'Carousel — Height',
      type: 'string',
      description: 'Only used when Layout is Carousel.',
      options: {
        list: [
          {title: 'Standard (480px)', value: 'standard'},
          {title: 'Tall (640px)', value: 'tall'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'standard',
      hidden: ({parent}) => parent?.layout !== 'carousel',
    },
    {
      // Grid mode crops every tile to a square, which is right for a photo
      // wall and wrong when the image's shape IS the content — Chaltron
      // Photography's three numbered process cards are 2.12:1 graphics.
      // Justified rows keep the shape but reflow by width, so three cards
      // became 2 + 1 on a narrower screen. A grid holds its column count at
      // any width; this lets it do that without cropping.
      name: 'imageFit',
      title: 'Image Fit',
      type: 'string',
      description:
        'Crop to squares gives the uniform photo-wall grid. Show whole image keeps each picture’s real shape — use it for artwork, graphics or anything where cropping loses the point. Ignored when Justified rows is on, which never crops.',
      options: {
        list: [
          {title: 'Crop to squares (default)', value: 'crop'},
          {title: 'Show whole image', value: 'whole'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'crop',
      hidden: ({parent}) => parent?.layout === 'carousel' || parent?.layout === 'masonry',
    },
    {
      name: 'justified',
      title: 'Justified rows',
      type: 'boolean',
      description:
        'Keep each photo\u2019s real shape instead of cropping it to a square, and stretch every row to the full width \u2014 the layout most photography sites use. The column count above becomes a guide rather than a rule, so a row may hold more or fewer images depending on how wide they are.',
      initialValue: false,
      // Carousel is a single scrolling row, so rows can't be justified.
      hidden: ({parent}) => parent?.layout === 'carousel',
    },
    {
      name: 'rowHeight',
      title: 'Row height',
      type: 'string',
      description:
        'How tall each justified row runs. Short suits logos and badges; Tall suits full-bleed photography.',
      options: {
        list: [
          {title: 'Short', value: 'short'},
          {title: 'Medium', value: 'medium'},
          {title: 'Tall', value: 'tall'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'medium',
      // Only justified rows have a row height to set — grid crops to square
      // cells sized by the column count, masonry flows at natural heights.
      hidden: ({parent}) => !parent?.justified || parent?.layout === 'carousel',
    },
    {
      name: 'gap',
      title: 'Gap',
      type: 'string',
      description: 'Spacing between images. Applies to grid, masonry, and carousel layouts.',
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
      description: 'Ignored for the Carousel layout.',
      initialValue: true,
    },
  ],
}
