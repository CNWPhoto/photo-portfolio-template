export default {
  name: 'aboutPersonal',
  title: 'Deeper Dive Section',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  preview: {
    prepare() {
      return {title: 'Deeper Dive Section'}
    },
  },
  fields: [
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
      placeholder: "That sense of attention is something I bring to every session…",
    },
  ],
}
