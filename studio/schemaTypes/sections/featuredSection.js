import {portfolioPreviewVariants} from '../pageLayouts'

export default {
  name: 'featuredSection',
  title: 'Featured Section',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Featured Section'}
    },
  },
  fields: [
    {
      name: 'variant',
      title: 'Layout Style',
      type: 'string',
      description: 'Choose how the portfolio preview section looks on the homepage.',
      options: {list: portfolioPreviewVariants, layout: 'radio'},
      initialValue: 'classic',
    },
    {
      name: 'imageVertical',
      title: 'Image — Vertical (left)',
      type: 'image',
      description: 'Portrait/vertical image shown on the left. Works best taller than it is wide.',
      options: {hotspot: true, crop: true},
      fields: [{name: 'alt', title: 'Alt Text', type: 'string'}],
    },
    {
      name: 'imageHorizontal',
      title: 'Image — Horizontal (right)',
      type: 'image',
      description: 'Landscape/horizontal image shown on the right. Works best wider than it is tall.',
      options: {hotspot: true, crop: true},
      fields: [{name: 'alt', title: 'Alt Text', type: 'string'}],
    },
  ],
}
