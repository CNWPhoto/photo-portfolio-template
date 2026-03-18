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
      name: 'pageTitle',
      title: 'Page Title',
      type: 'string',
      description: 'Used in the browser tab and as the SEO title fallback. E.g. "Portfolio | Denver Dog Photographer".',
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL path for this page.',
      options: {source: 'pageTitle'},
    },
    {
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    },
    {
      name: 'title',
      title: 'Page Label',
      type: 'string',
      description: 'Large label shown top-right of the portfolio page. E.g. "Portfolio" or "Work".',
      initialValue: 'Portfolio',
    },
    {
      name: 'byline',
      title: 'Byline',
      type: 'string',
      description: 'Small text shown to the left of the page label. E.g. "A collection of recent dog photography sessions".',
      initialValue: 'A collection of recent dog photography sessions',
    },
    {
      name: 'galleryColumns',
      title: 'Gallery Columns',
      type: 'number',
      description: 'Number of columns in the masonry grid on desktop. Choose 2, 3, or 4.',
      initialValue: 3,
      options: {
        list: [
          {title: '2 columns', value: 2},
          {title: '3 columns (default)', value: 3},
          {title: '4 columns', value: 4},
        ],
        layout: 'radio',
      },
    },
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
