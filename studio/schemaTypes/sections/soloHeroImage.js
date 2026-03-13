export default {
  name: 'soloHeroImage',
  title: 'Solo Hero Image',
  type: 'document',
  __experimental_actions: ['create', 'update', 'publish'],
  preview: {
    prepare() {
      return {title: 'Solo Hero Image'}
    },
  },
  fields: [
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
