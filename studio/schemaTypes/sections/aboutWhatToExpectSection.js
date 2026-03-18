export default {
  name: 'aboutWhatToExpectSection',
  title: 'What to Expect Section',
  type: 'object',
  preview: {
    select: {label: 'sectionLabel'},
    prepare({label}) {
      return {title: 'What to Expect', subtitle: label || ''}
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
                {name: 'alt', title: 'Alt text', type: 'string'},
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
}
