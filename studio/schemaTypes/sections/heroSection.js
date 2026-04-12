import {sectionBaseFields} from '../_shared/sectionBase'
import {imageField} from '../_shared/imageField'
import {ctaLink} from '../_shared/ctaLink'

// Unified hero section. Replaces all the niche-named hero variants.
// See docs/page-builder-spec.md §2 (heroSection) and §17 (stickyBackground).

export default {
  name: 'heroSection',
  title: 'Hero',
  type: 'object',
  preview: {
    select: {heading: 'heading', eyebrow: 'eyebrow'},
    prepare({heading, eyebrow}) {
      return {title: 'Hero', subtitle: heading || eyebrow || ''}
    },
  },
  fields: [
    ...sectionBaseFields(),
    {
      name: 'variant',
      title: 'Variant',
      type: 'string',
      options: {
        list: [
          {title: 'Single full-width image', value: 'image-full'},
          {title: 'Image right, text left', value: 'image-right'},
          {title: 'Multi-image slider', value: 'slider'},
        ],
        layout: 'radio',
      },
      initialValue: 'slider',
    },
    {
      name: 'images',
      title: 'Images',
      type: 'array',
      description:
        'For the slider variant, upload 4–8 photos. For other variants only the first image is used.',
      of: [imageField({required: false})],
    },
    {
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description: 'Small uppercase label above the heading.',
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'The H1 for this hero. Use a line break (Enter) to split onto two lines.',
    },
    {
      name: 'subheading',
      title: 'Subheading',
      type: 'string',
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
    {
      name: 'textAlignment',
      title: 'Text Alignment',
      type: 'string',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'left',
    },
    {
      name: 'textPosition',
      title: 'Text Position',
      type: 'string',
      description: 'Where the text block sits over the hero image (nine-point grid).',
      options: {
        list: [
          'top-left', 'top-center', 'top-right',
          'center-left', 'center-center', 'center-right',
          'bottom-left', 'bottom-center', 'bottom-right',
        ],
      },
      initialValue: 'center-left',
    },
    {
      name: 'heightMode',
      title: 'Height',
      type: 'string',
      options: {
        list: [
          {title: 'Auto (55vh)', value: 'auto'},
          {title: 'Tall (75vh)', value: 'tall'},
          {title: 'Fullscreen (100vh)', value: 'fullscreen'},
        ],
        layout: 'radio',
      },
      initialValue: 'auto',
    },
    {
      name: 'overlayOpacity',
      title: 'Overlay Opacity (%)',
      type: 'number',
      description: 'Darken the image behind the text. 0 = no overlay, 100 = solid black.',
      initialValue: 30,
      validation: (Rule) => Rule.min(0).max(100),
    },
    {
      name: 'stickyBackground',
      title: 'Sticky Background',
      type: 'boolean',
      description:
        'When enabled, the hero stays pinned at the top of the viewport while subsequent sections scroll up over it (curtain effect). Used by the Experience page.',
      initialValue: false,
    },
    {
      name: 'nicheKeyword',
      title: 'Niche Keyword',
      type: 'string',
      description: 'Optional. Used as a fallback for image alt text (e.g. "Denver dog photographer").',
    },
  ],
}
