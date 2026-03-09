export default {
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  orderings: [
    {
      title: 'Manual Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  fields: [
    {
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 4,
    },
    {
      name: 'clientName',
      title: 'Client Name',
      type: 'string',
    },
    {
      name: 'clientSubjectName',
      title: "Subject's Name",
      type: 'string',
      description: 'The name of the subject photographed (dog, child, family name, etc.)',
    },
    {
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: {
        hotspot: true,
        crop: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
        },
      ],
    },
    {
      name: 'order',
      title: 'Order',
      type: 'number',
    },
  ],
  preview: {
    select: {
      title: 'clientName',
      subtitle: 'clientSubjectName',
      media: 'photo',
    },
  },
}
