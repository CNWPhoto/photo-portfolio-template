export default {
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  __experimental_actions: ['update', 'publish', 'create'],
  preview: {
    prepare() {
      return {title: 'About Page'}
    },
  },
  fields: [
    {
      name: 'pageTitle',
      title: 'Page Title',
      type: 'string',
      description: 'Used in the browser tab and as the SEO title fallback. E.g. "About | Denver Dog Photographer".',
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
      name: 'sections',
      title: 'Sections',
      type: 'array',
      description: 'Add, remove, and drag to reorder sections on the About page.',
      of: [
        {type: 'aboutIntroSection'},
        {type: 'aboutWhatToExpectSection'},
        {type: 'aboutPersonalSection'},
        {type: 'aboutQuoteSection'},
        {type: 'aboutCtaSection'},
      ],
    },
  ],
}
