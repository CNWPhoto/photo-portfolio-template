import {imageSizeWarning, altTextWarning} from './_shared/imageValidation'
import {validatePageSlug} from './_shared/slugValidator'

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
          validation: imageSizeWarning,
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
              validation: altTextWarning,
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
    {
      name: 'additionalGalleries',
      title: 'Additional Galleries',
      type: 'array',
      description:
        'Optional secondary galleries. They appear as tab links at the top of the portfolio page. Each gets its own URL: /portfolio/<slug> — linkable from anywhere on the site. Max 2.',
      group: 'all',
      validation: (Rule) => Rule.max(2),
      of: [
        {
          type: 'object',
          name: 'additionalGallery',
          title: 'Gallery',
          fields: [
            {
              name: 'name',
              title: 'Gallery Name',
              type: 'string',
              description: 'Displayed as the tab label at the top of the portfolio page.',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'slug',
              title: 'URL Slug',
              type: 'slug',
              description:
                'The URL for this gallery: /portfolio/<slug>. Click "Generate" to create from the name.',
              options: {source: 'name', maxLength: 64},
              validation: (Rule) => Rule.required().custom(validatePageSlug),
            },
            {
              name: 'byline',
              title: 'Byline Override',
              type: 'string',
              description: 'Optional. Overrides the portfolio byline for this gallery only.',
            },
            {
              name: 'galleryColumns',
              title: 'Gallery Columns Override',
              type: 'number',
              description:
                'Optional. Overrides the portfolio column count for this gallery only.',
              options: {
                list: [
                  {title: '2 columns', value: 2},
                  {title: '3 columns', value: 3},
                  {title: '4 columns', value: 4},
                ],
                layout: 'radio',
              },
            },
            {
              name: 'seo',
              title: 'SEO',
              type: 'seo',
              description: 'Optional per-gallery SEO. Falls back to the portfolio page SEO.',
            },
            {
              name: 'images',
              title: 'Gallery Images',
              type: 'array',
              description:
                'Drag to reorder. Bulk-upload supported. Categories on these images are not used — categories only filter the main portfolio gallery.',
              of: [
                {
                  type: 'image',
                  options: {hotspot: true, crop: true},
                  validation: imageSizeWarning,
                  preview: {
                    select: {title: 'title', media: 'asset'},
                    prepare({title, media}) {
                      return {title: title || 'Untitled', media}
                    },
                  },
                  fields: [
                    {
                      name: 'alt',
                      title: 'Alt Text',
                      type: 'string',
                      description:
                        'Describe the image for accessibility and SEO.',
                      validation: altTextWarning,
                    },
                    {
                      name: 'title',
                      title: 'Internal Label',
                      type: 'string',
                      description:
                        'Optional. Only visible in the Studio.',
                    },
                  ],
                },
              ],
            },
          ],
          preview: {
            select: {title: 'name', subtitle: 'slug.current', media: 'images.0'},
            prepare({title, subtitle, media}) {
              return {
                title: title || 'Untitled Gallery',
                subtitle: subtitle ? `/portfolio/${subtitle}` : 'No slug set',
                media,
              }
            },
          },
        },
      ],
    },
  ],
}
