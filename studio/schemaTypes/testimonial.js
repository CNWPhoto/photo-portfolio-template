export default {
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  orderings: [
    {
      title: 'Manual Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
  fields: [
    {
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 4,
      description: 'The full testimonial text from your client. Do not include quotation marks — they are added automatically.',
    },
    {
      name: 'clientName',
      title: 'Client Name',
      type: 'string',
      description: "The client's name shown below the quote (e.g. 'Sarah M.' or 'The Johnson Family').",
    },
    {
      name: 'clientSubjectName',
      title: "Subject's Name",
      type: 'string',
      description: 'The name of the subject photographed (e.g. dog name, child name, family name). Shown as a subtitle.',
    },
    {
      name: 'photo',
      title: 'Client Photo',
      type: 'image',
      description: 'A portrait photo of the client or their subject. Shown beside the quote. Square or portrait crops work best.',
      options: {
        hotspot: true,
        crop: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Describe the photo for accessibility (e.g. "Sarah smiling with her golden retriever Biscuit").',
        },
      ],
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Controls the order testimonials appear. Lower numbers appear first (e.g. 1, 2, 3).',
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
