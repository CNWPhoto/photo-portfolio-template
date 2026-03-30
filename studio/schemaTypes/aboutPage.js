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
  groups: [
    {name: 'all', title: 'All', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    {
      name: 'pageTitle',
      title: 'Page Title',
      type: 'string',
      description: 'Used in the browser tab and as the SEO title fallback. E.g. "About | Denver Dog Photographer".',
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
      name: 'sections',
      title: 'Sections',
      type: 'array',
      description: 'Add, remove, and drag to reorder sections on the About page.',
      group: 'all',
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
