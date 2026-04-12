import {sectionsOf, sectionsInsertMenu} from './_shared/sectionsArrayConfig'

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
        {_type: 'splitSection',            _key: 'splitSection'},
        {_type: 'testimonialsSection',     _key: 'testimonialsSection'},
        {_type: 'featuredPortfolioSection', _key: 'featuredPortfolioSection'},
        {_type: 'stepsSection',            _key: 'stepsSection'},
        {_type: 'fullBleedImageSection',   _key: 'fullBleedImageSection'},
        {_type: 'faqSection',              _key: 'faqSection'},
      ],
      of: sectionsOf,
      options: {insertMenu: sectionsInsertMenu},
    },
  ],
}
