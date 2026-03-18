export default {
  name: 'aboutIntroSection',
  title: 'Intro Section',
  type: 'object',
  preview: {
    select: {heading: 'heading'},
    prepare({heading}) {
      return {title: 'Intro Section', subtitle: heading || ''}
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
      title: 'Portrait Image',
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
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Large display heading. E.g. "Hi, I\'m Sarah"',
      placeholder: "Hi, I'm Connor",
    },
    {
      name: 'subtext',
      title: 'Subtext',
      type: 'text',
      rows: 2,
      description: 'Small uppercase tagline displayed below the heading.',
      placeholder: 'A photographer based in [City], here to help you document your story.',
    },
    {
      name: 'bodyParagraph1',
      title: 'Body — Paragraph 1',
      type: 'text',
      rows: 3,
      placeholder: "I've spent the last decade photographing the moments that matter most…",
    },
    {
      name: 'bodyParagraph2',
      title: 'Body — Paragraph 2',
      type: 'text',
      rows: 3,
      placeholder: 'What started as a personal project became a calling…',
    },
  ],
}
