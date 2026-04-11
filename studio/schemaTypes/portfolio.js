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
  groups: [
    {name: 'all', title: 'All', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    {
      name: 'pageTitle',
      title: 'Page Title',
      type: 'string',
      description: 'Used in the browser tab and as the SEO title fallback. E.g. "Portfolio | Denver Dog Photographer".',
      group: ['all', 'seo'],
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The URL for this page (e.g. /about). ⚠️ Avoid changing this once the page is live — it will break existing links and hurt your search rankings. If you must change it, set up a 301 redirect from the old URL to the new one in your hosting settings.',
      options: {source: 'pageTitle'},
      group: ['all', 'seo'],
    },
    {
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: ['all', 'seo'],
    },
    {
      name: 'title',
      title: 'Page Label',
      type: 'string',
      description: 'Large label shown top-right of the portfolio page. E.g. "Portfolio" or "Work".',
      initialValue: 'Portfolio',
      group: 'all',
    },
    {
      name: 'byline',
      title: 'Byline',
      type: 'string',
      description: 'Small text shown to the left of the page label. E.g. "A collection of recent dog photography sessions".',
      initialValue: 'A collection of recent dog photography sessions',
      group: 'all',
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
      group: 'all',
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
      group: 'all',
    },
    {
      name: 'images',
      title: 'Portfolio Images',
      type: 'array',
      description:
        'Drag to reorder. When the upload dialog opens you can select multiple files at once to bulk-upload.',
      group: 'all',
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
              name: 'categories',
              title: 'Categories',
              type: 'array',
              description:
                'Keep categories minimal. 1–2 per image is best. Used to filter images on the Portfolio page and to drive category landing pages.',
              of: [{type: 'reference', to: [{type: 'portfolioCategory'}]}],
              validation: (Rule) => Rule.max(3),
            },
          ],
        },
      ],
    },
  ],
}
