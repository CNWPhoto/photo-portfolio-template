export default {
  name: 'aboutSettings',
  title: 'About Page',
  type: 'document',
  __experimental_actions: ['update', 'publish'], // singleton — no create/delete
  preview: {
    prepare() {
      return {title: 'About Page'}
    },
  },
  fields: [
    {
      name: 'intro',
      title: 'Intro Section',
      type: 'object',
      options: {collapsible: false},
      fields: [
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
    },
    {
      name: 'whatToExpect',
      title: 'What to Expect Section',
      type: 'object',
      options: {collapsible: true, collapsed: false},
      fields: [
        {
          name: 'sectionLabel',
          title: 'Section Label',
          type: 'string',
          description: 'The rotated label on the left side of the section.',
          placeholder: 'What to Expect',
        },
        {
          name: 'columns',
          title: 'Columns',
          type: 'array',
          description: 'Each column has an image, a title, and a short paragraph. Add up to 3.',
          validation: (Rule) => Rule.max(3),
          of: [
            {
              type: 'object',
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
                    },
                  ],
                },
                {
                  name: 'title',
                  title: 'Title',
                  type: 'string',
                  placeholder: 'Subject-Led Sessions',
                },
                {
                  name: 'body',
                  title: 'Body',
                  type: 'text',
                  rows: 3,
                  placeholder: 'Every session moves at your pace…',
                },
              ],
              preview: {
                select: {title: 'title'},
                prepare({title}) {
                  return {title: title || 'Untitled column'}
                },
              },
            },
          ],
        },
      ],
    },
  ],
}
