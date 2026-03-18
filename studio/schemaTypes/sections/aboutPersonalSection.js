export default {
  name: 'aboutPersonalSection',
  title: 'Deeper Dive Section',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Deeper Dive'}
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
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        {
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Describe the image for screen readers and SEO.',
        },
      ],
    },
    {
      name: 'bodyParagraph1',
      title: 'Body — Paragraph 1',
      type: 'text',
      rows: 3,
      placeholder: 'Photography found me at a time when I needed it most…',
    },
    {
      name: 'bodyParagraph2',
      title: 'Body — Paragraph 2',
      type: 'text',
      rows: 3,
      placeholder: 'That sense of attention is something I bring to every session…',
    },
  ],
}
