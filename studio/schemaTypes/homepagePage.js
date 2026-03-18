export default {
  name: 'homepagePage',
  title: 'Homepage',
  type: 'document',
  __experimental_actions: ['update', 'publish', 'create'],
  preview: {
    prepare() {
      return {title: 'Homepage'}
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
      description: 'Used in the browser tab and as the SEO title fallback. E.g. "Dog Photography | Denver, CO".',
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
      description: 'Add, remove, and drag to reorder sections on the Homepage.',
      group: 'all',
      of: [
        {type: 'heroSlider'},
        {type: 'heroCaption'},
        {type: 'welcomeSection'},
        {type: 'featuredSection'},
        {type: 'processSection'},
        {type: 'soloHeroImage'},
        {type: 'whyChooseSection'},
        {type: 'homepageFaqs'},
      ],
    },
  ],
}
