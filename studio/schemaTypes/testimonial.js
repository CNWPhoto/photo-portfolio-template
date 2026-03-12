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
      name: 'testimonial',
      title: 'Testimonial',
      type: 'text',
      rows: 4,
      description: 'The full testimonial text from your client. Do not include quotation marks — they are added automatically.',
    },
    {
      name: 'client',
      title: 'Client',
      type: 'string',
      description: "The client's name shown below the quote (e.g. 'Sarah M.' or 'The Johnson Family').",
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      description: 'A portrait photo of the client or their subject. Vertical images work best.',
      options: {
        hotspot: true,
        crop: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Describe the photo for accessibility.',
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
      title: 'client',
      subtitle: 'testimonial',
      media: 'image',
    },
  },
}
