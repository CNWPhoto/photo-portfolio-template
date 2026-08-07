import {sectionBaseFields} from '../_shared/sectionBase'
import {headingSizeField} from '../_shared/headingSizeField'
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
    headingSizeField(),
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
          {title: 'Justified rows (even rows, uncropped)', value: 'justified-rows'},
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
      // Carousel slides are height-driven by default, so how many fit is
      // whatever the images' aspect ratios allow — usually one and a bit.
      // Picking a number makes each slide an equal fraction of the width so
      // exactly that many show at once.
      name: 'imagesPerView',
      title: 'Images Per View',
      type: 'string',
      description:
        'How many images the carousel shows at once. Automatic sizes each slide by its own shape. Picking a number fits exactly that many across, stepping down on smaller screens so they never become thumbnails.',
      options: {
        list: [
          {title: 'Automatic (default)', value: 'auto'},
          {title: '2 across', value: '2'},
          {title: '3 across', value: '3'},
          {title: '4 across', value: '4'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'auto',
      hidden: ({parent}) => parent?.layout !== 'carousel',
    },
    {
      // The gallery caps at 1400px like every other section, which is right
      // for text but leaves photography boxed in on a wide screen. Full width
      // runs the images edge to edge; the heading stays within the readable
      // measure so it doesn't strand itself against the viewport edge.
      name: 'contentWidth',
      title: 'Width',
      type: 'string',
      description:
        'Contained keeps the gallery within the page’s normal reading width. Full width runs the images edge to edge across the screen — strong for a photo wall, and the heading stays centred either way.',
      options: {
        list: [
          {title: 'Contained (default)', value: 'contained'},
          {title: 'Full screen width', value: 'full'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'contained',
    },
    {
      name: 'justified',
      // Title says what it overrides. The description already explained that
      // the column count becomes "a guide rather than a rule", and that still
      // wasn't enough — a grid-4 gallery rendering 3 across reads as a broken
      // column picker, not as this toggle doing its job.
      title: 'Justified rows (legacy)',
      type: 'boolean',
      description:
        'Stretches every row to the full width and sizes each photo by its own shape \u2014 the layout most photography sites use. IMPORTANT: this ignores the column count above; rows hold however many images fit. To keep a fixed number of columns AND uncropped images, leave this off and set Image Fit to \u201cShow whole image\u201d.',
      initialValue: false,
      // DEPRECATED — superseded by the 'justified-rows' Layout option.
      // Kept and still honoured so the galleries already using it keep
      // working, but hidden so it can't be set on anything new: a boolean
      // that silently overrode the column picker is what made a grid-4
      // gallery render three across with no explanation.
      hidden: true,
      readOnly: true,
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
