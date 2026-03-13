export default {
  name: 'heroSlider',
  title: 'Homepage Top Slider',
  type: 'document',
  __experimental_actions: ['create', 'update', 'publish'],
  preview: {
    prepare() {
      return {title: 'Homepage Top Slider'}
    },
  },
  fields: [
    {
      name: 'images',
      title: 'Slider Images',
      type: 'array',
      description: 'Images that scroll across the homepage hero slider. Upload 4–8 photos. The first image loads first.',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
            crop: true,
          },
          fields: [
            {
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
              description: 'Describe the image for accessibility (e.g. "Golden retriever running on a mountain trail").',
            },
          ],
        },
      ],
    },
  ],
}
