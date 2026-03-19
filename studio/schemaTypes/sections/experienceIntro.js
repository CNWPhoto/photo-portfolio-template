export default {
  name: 'experienceIntro',
  title: 'Intro',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Intro'}
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
      name: 'bodyFirst',
      title: 'First Paragraph',
      type: 'text',
      rows: 4,
      placeholder:
        'Every dog photography session is designed to feel relaxed, dog-led, and pressure-free…',
    },
    {
      name: 'bodySecond',
      title: 'Second Paragraph',
      type: 'text',
      rows: 3,
      description: 'Displayed slightly bolder than the first paragraph.',
      placeholder:
        "There's no need for perfect behavior or posing — the focus is on creating space for natural moments to unfold.",
    },
  ],
}
