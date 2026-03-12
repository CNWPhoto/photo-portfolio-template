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
      name: 'sizingNote',
      title: '📐 Image Sizing Requirement',
      type: 'string',
      readOnly: true,
      initialValue:
        'Resize all images to 2500–3000px on the long edge before uploading. This ensures fast load times without sacrificing print quality. Export as high-quality JPEG (85–95%) or PNG. Sanity handles further optimisation and delivery automatically.',
      description:
        'Resize all images to 2500–3000px on the long edge before uploading. This ensures fast load times without sacrificing print quality. Export as high-quality JPEG (85–95%) or PNG. Sanity handles further optimisation and delivery automatically.',
    },
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
      description: 'Upload at 2500–3000px on the long edge. Sanity handles resizing and delivery automatically.',
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
