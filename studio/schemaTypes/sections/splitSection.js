import {sectionBaseFields} from '../_shared/sectionBase'
import {imageField} from '../_shared/imageField'
import {ctaLink} from '../_shared/ctaLink'
import {richTextBody} from '../_shared/richTextBody'

// Two-column image + rich text. The workhorse layout — replaces all the
// niche-named intro / welcome / personal sections.
// See docs/page-builder-spec.md §2 (splitSection).

export default {
  name: 'splitSection',
  title: 'Split (Image + Text)',
  type: 'object',
  preview: {
    select: {heading: 'heading', image: 'image'},
    prepare({heading, image}) {
      return {title: 'Split', subtitle: heading || '', media: image}
    },
  },
  fields: [
    ...sectionBaseFields({withVerticalSideLabel: true}),
    {
      name: 'imageLayout',
      title: 'Image Layout',
      type: 'string',
      options: {
        list: [
          {title: 'Image left', value: 'image-left'},
          {title: 'Image right', value: 'image-right'},
          {title: 'Image left, full bleed', value: 'image-left-full-bleed'},
          {title: 'Image right, full bleed', value: 'image-right-full-bleed'},
        ],
      },
      initialValue: 'image-right',
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
      description: 'Use a line break (Enter) to split onto two lines.',
    },
    richTextBody(),
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
    imageField({}),
    {
      name: 'imageAspectRatio',
      title: 'Image Aspect Ratio',
      type: 'string',
      options: {
        list: [
          {title: 'Square', value: 'square'},
          {title: 'Portrait (4:5)', value: 'portrait-4-5'},
          {title: 'Landscape (3:2)', value: 'landscape-3-2'},
          {title: 'Auto (image native)', value: 'auto'},
        ],
        layout: 'radio',
      },
      initialValue: 'auto',
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
      name: 'verticalAlignment',
      title: 'Vertical Alignment',
      type: 'string',
      options: {
        list: [
          {title: 'Top', value: 'top'},
          {title: 'Center', value: 'center'},
          {title: 'Bottom', value: 'bottom'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'center',
    },
    {
      name: 'mobileOrder',
      title: 'Mobile Order',
      type: 'string',
      description: 'Which column appears first on mobile.',
      options: {
        list: [
          {title: 'Image first', value: 'image-first'},
          {title: 'Text first', value: 'text-first'},
        ],
        layout: 'radio',
      },
      initialValue: 'image-first',
    },
  ],
}
