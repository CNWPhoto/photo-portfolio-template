export default {
  name: 'soloHeroImage',
  title: 'Solo Hero Image',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Solo Hero Image'}
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
      name: 'image',
      title: 'Image',
      type: 'image',
      description: 'Full-width hero image displayed between the Process and Why Choose sections.',
      options: {hotspot: true, crop: true},
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Describe the image for accessibility.',
        },
      ],
    },
  ],
}
