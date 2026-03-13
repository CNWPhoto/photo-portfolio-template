export default {
  name: 'featuredSection',
  title: 'Featured Section',
  type: 'document',
  __experimental_actions: ['create', 'update', 'publish'],
  preview: {
    prepare() {
      return {title: 'Featured Section'}
    },
  },
  fields: [
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
