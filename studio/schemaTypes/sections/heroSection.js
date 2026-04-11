export default {
  name: 'heroSection',
  title: 'Hero Section',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Hero Section (slider + caption)'}
    },
  },
  fields: [
    {
      name: 'enabled',
      title: 'Show Section',
      type: 'boolean',
      description: 'Toggle the entire hero on or off.',
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
    },
    {
      name: 'nicheKeyword',
      title: 'Heading (H1)',
      type: 'string',
      description: 'Primary SEO keyword shown as the H1 below the slider.',
      initialValue: 'Your City Photographer',
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Subtitle beneath the H1.',
      initialValue: 'Natural, relaxed portraits that tell your story.',
    },
  ],
}
