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
  fields: [
    {
      name: 'pageTitle',
      title: 'Page Title',
      type: 'string',
      description: 'Used in the browser tab and as the SEO title fallback. E.g. "Dog Photography | Denver, CO".',
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
      description: 'Add, remove, and drag to reorder sections on the Homepage.',
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
