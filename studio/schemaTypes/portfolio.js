export default {
  name: 'portfolio',
  title: 'Portfolio',
  type: 'document',
  __experimental_actions: ['update', 'publish'], // singleton — no create/delete
  preview: {
    prepare() {
      return {title: 'Portfolio Images'}
    },
  },
  fields: [
    {
      name: 'sizingNote',
      title: '📐 Image Sizing Requirement',
      type: 'string',
      readOnly: true,
      initialValue:
        'Resize all images to 2500–3000px on the long edge before uploading. Export as high-quality JPEG (85–95%) or PNG. Sanity handles further optimisation and delivery automatically.',
      description:
        'Resize all images to 2500–3000px on the long edge before uploading. Export as high-quality JPEG (85–95%) or PNG. Sanity handles further optimisation and delivery automatically.',
    },
    {
      name: 'images',
      title: 'Portfolio Images',
      type: 'array',
      description:
        'Drag to reorder. When the upload dialog opens you can select multiple files at once to bulk-upload.',
      of: [
        {
          type: 'image',
          options: {hotspot: true, crop: true},
          preview: {
            select: {title: 'title', subtitle: 'category', media: 'asset'},
            prepare({title, subtitle, media}) {
              return {title: title || 'Untitled', subtitle: subtitle || '', media}
            },
          },
          fields: [
            {
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
              description:
                'Describe the image for accessibility and SEO (e.g. "Black lab splashing through a mountain stream").',
            },
            {
              name: 'title',
              title: 'Internal Label',
              type: 'string',
              description:
                'Optional. Only visible in the Studio — used to identify this image (e.g. "Luna at Red Rocks").',
            },
            {
              name: 'category',
              title: 'Category',
              type: 'string',
              description: 'Used to filter images on the Portfolio page.',
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
          ],
        },
      ],
    },
  ],
}
