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
      description: 'Used in the browser tab and as the SEO title fallback.',
      group: ['all', 'seo'],
      initialValue: 'Home',
    },
    {
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: ['all', 'seo'],
    },
    {
      name: 'hero',
      title: 'Hero',
      type: 'heroSection',
      description: 'The hero at the very top of the homepage. Always rendered first; cannot be reordered.',
      group: 'all',
    },
    {
      name: 'sections',
      title: 'Sections',
      type: 'array',
      description: 'Add, remove, and drag to reorder sections on the Homepage.',
      group: 'all',
      initialValue: [
        {_type: 'welcomeSection',      _key: 'welcomeSection'},
        {_type: 'testimonialsSection', _key: 'testimonialsSection'},
        {_type: 'featuredSection',     _key: 'featuredSection'},
        {_type: 'processSection',      _key: 'processSection'},
        {_type: 'whyChooseSection',    _key: 'whyChooseSection'},
        {_type: 'homepageFaqs',        _key: 'homepageFaqs'},
      ],
      of: [
        {type: 'welcomeSection'},
        {type: 'testimonialsSection'},
        {type: 'featuredSection'},
        {type: 'processSection'},
        {type: 'whyChooseSection'},
        {type: 'homepageFaqs'},
      ],
    },
  ],
}
