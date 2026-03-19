export default {
  name: 'experienceArtwork',
  title: 'Artwork / Images',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Artwork / Images'}
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
      name: 'heading',
      title: 'Section Heading',
      type: 'string',
      placeholder: 'Artwork/Images',
    },
    {
      name: 'bodyText',
      title: 'Body Text',
      type: 'text',
      rows: 4,
      placeholder:
        "After your session, you'll select your favorite images from an online gallery…",
    },
    {
      name: 'optionsList',
      title: '"Options may include" List',
      type: 'array',
      description: 'Drag to reorder.',
      of: [
        {
          type: 'object',
          name: 'listItem',
          fields: [{name: 'text', title: 'Item', type: 'string'}],
          preview: {
            select: {title: 'text'},
          },
        },
      ],
    },
    {
      name: 'statement',
      title: 'Closing Statement',
      type: 'text',
      rows: 2,
      description: 'Displayed bold at the bottom of the text column.',
      placeholder:
        "You're never locked into a one-size-fits-all package — selections are flexible and based on what matters most to you.",
    },
    {
      name: 'image',
      title: 'Section Image',
      type: 'image',
      description: 'Full-height image on the right side of the section.',
      options: {hotspot: true},
      fields: [{name: 'alt', title: 'Alt text', type: 'string'}],
    },
  ],
}
