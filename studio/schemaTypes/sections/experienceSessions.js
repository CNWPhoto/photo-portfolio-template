export default {
  name: 'experienceSessions',
  title: 'Sessions',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Sessions'}
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
      title: 'Section Image',
      type: 'image',
      description: 'Square crop recommended.',
      options: {hotspot: true},
      fields: [{name: 'alt', title: 'Alt text', type: 'string'}],
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      placeholder: 'Sessions',
    },
    {
      name: 'sub',
      title: 'Sub-headline',
      type: 'text',
      rows: 2,
      description: 'Displayed in accent colour above the list.',
      placeholder:
        "The session fee covers the time, care, and preparation that go into creating your dog's photography experience.",
    },
    {
      name: 'includesList',
      title: '"This includes" List',
      type: 'array',
      description: 'Drag to reorder. Each item appears as a line in the list.',
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
      name: 'price',
      title: 'Price Line',
      type: 'string',
      placeholder: 'Session fee begins at $XXX',
    },
    {
      name: 'caption',
      title: 'Price Caption',
      type: 'string',
      placeholder: '(Artwork and images purchased separately.)',
    },
  ],
}
