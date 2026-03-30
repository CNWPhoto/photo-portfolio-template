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
      initialValue: [
        {_type: 'heroSlider',         _key: 'heroSlider'},
        {_type: 'heroCaption',        _key: 'heroCaption'},
        {_type: 'welcomeSection',     _key: 'welcomeSection'},
        {_type: 'testimonialsSection',_key: 'testimonialsSection'},
        {_type: 'featuredSection',    _key: 'featuredSection'},
        {_type: 'processSection',     _key: 'processSection'},
        {_type: 'soloHeroImage',      _key: 'soloHeroImage'},
        {_type: 'whyChooseSection',   _key: 'whyChooseSection'},
        {_type: 'homepageFaqs',       _key: 'homepageFaqs'},
      ],
      of: [
        {type: 'heroSlider'},
        {type: 'heroCaption'},
        {type: 'welcomeSection'},
        {type: 'testimonialsSection'},
        {type: 'featuredSection'},
        {type: 'processSection'},
        {type: 'soloHeroImage'},
        {type: 'whyChooseSection'},
        {type: 'homepageFaqs'},
      ],
    },
  ],
}
