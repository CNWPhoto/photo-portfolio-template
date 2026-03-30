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
      name: 'enabled',
      title: 'Show Section',
      type: 'boolean',
      description: 'Toggle this section on or off on the homepage.',
      initialValue: true,
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
