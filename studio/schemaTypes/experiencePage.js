export default {
  name: 'experiencePage',
  title: 'Experience Page',
  type: 'document',
  __experimental_actions: ['update', 'publish', 'create'],
  preview: {
    prepare() {
      return {title: 'Experience Page'}
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
      description:
        'Used in the browser tab and as the SEO title fallback. E.g. "Experience & Investment | Denver Dog Photographer".',
      group: ['all', 'seo'],
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL path for this page.',
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
      description: 'Add, remove, and drag to reorder sections on the Experience page.',
      group: 'all',
      of: [
        {type: 'experienceHero'},
        {type: 'experienceIntro'},
        {type: 'experienceSessions'},
        {type: 'experienceArtwork'},
        {type: 'experienceNextSteps'},
        {type: 'experienceFaqs'},
      ],
    },
  ],
}
