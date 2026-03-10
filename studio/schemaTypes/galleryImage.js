export default {
  name: 'galleryImage',
  title: 'Gallery Image',
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
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'An internal label for this image (e.g. "Luna at Red Rocks"). Not shown publicly — used to identify images in the Studio.',
    },
    {
      name: 'photo',
      title: 'Photo',
      type: 'image',
      description: 'The gallery image. Use full-resolution files — Sanity handles resizing automatically.',
      options: {
        hotspot: true,
        crop: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Describe the image for accessibility and SEO (e.g. "Black lab splashing through a mountain stream").',
        },
      ],
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Used to filter images on the Portfolio page. Choose the style that best fits this photo.',
      options: {
        list: [
          {title: 'Portrait', value: 'portrait'},
          {title: 'Lifestyle', value: 'lifestyle'},
          {title: 'Detail', value: 'detail'},
          {title: 'Family', value: 'family'},
          {title: 'Other', value: 'other'},
        ],
      },
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Controls the order images appear in the portfolio and homepage preview. Lower numbers appear first (e.g. 1, 2, 3).',
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
