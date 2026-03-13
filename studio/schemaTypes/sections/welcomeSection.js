export default {
  name: 'welcomeSection',
  title: 'Welcome Section',
  type: 'document',
  __experimental_actions: ['create', 'update', 'publish'], // singleton — create allowed for first-time init; structure builder prevents duplicates
  preview: {
    prepare() {
      return {title: 'Welcome Section'}
    },
  },
  fields: [
    {
      name: 'eyebrow',
      title: 'Eyebrow Label',
      type: 'string',
      description: 'Small label above the body text (e.g. "Welcome"). Leave blank to hide.',
    },
    {
      name: 'body',
      title: 'Body — First Paragraph',
      type: 'text',
      rows: 4,
      description: 'Main introductory paragraph shown on the left side of the homepage Welcome section.',
    },
    {
      name: 'bodySecondary',
      title: 'Body — Second Paragraph',
      type: 'text',
      rows: 4,
      description: 'Second paragraph shown below the first.',
    },
    {
      name: 'ctaText',
      title: 'CTA Link Text',
      type: 'string',
      description: 'Text for the call-to-action link (e.g. "Learn about the experience"). Leave blank to hide.',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      description: 'Photo shown on the right side of the Welcome section.',
      options: {
        hotspot: true,
        crop: true,
      },
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
