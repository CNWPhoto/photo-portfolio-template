export default {
  name: 'galleryImage',
  title: 'Gallery Image',
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
      name: 'title',
      title: 'Title',
      type: 'string',
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
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Portrait', value: 'portrait' },
          { title: 'Lifestyle', value: 'lifestyle' },
          { title: 'Detail', value: 'detail' },
          { title: 'Family', value: 'family' },
          { title: 'Other', value: 'other' },
        ],
      },
    },
    {
      name: 'order',
      title: 'Order',
      type: 'number',
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      media: 'photo',
    },
  },
}
