export default {
  name: 'experienceHero',
  title: 'Hero',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Hero'}
    },
  },
  fields: [
    {
      name: 'enabled',
      title: 'Show this section',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'image',
      title: 'Background Image',
      type: 'image',
      description: 'Full-bleed hero image. Landscape orientation recommended.',
      options: {hotspot: true},
      fields: [{name: 'alt', title: 'Alt text', type: 'string'}],
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      placeholder: 'The Experience & Investment',
    },
    {
      name: 'subtext',
      title: 'Subtext',
      type: 'string',
      description: 'Small uppercase line displayed below the heading.',
      placeholder: 'What working together looks like, from your session to finished artwork.',
    },
  ],
}
