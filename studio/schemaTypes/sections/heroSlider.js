export default {
  name: 'heroSlider',
  title: 'Homepage Top Slider',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Homepage Top Slider'}
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
