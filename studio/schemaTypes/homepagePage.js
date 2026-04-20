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
  // "All Fields" is a built-in Sanity tab shown whenever groups are
  // defined — adding a custom "all" group here would duplicate it.
  groups: [
    {name: 'sections', title: 'Sections'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    {
      name: 'pageTitle',
      title: 'Page Title',
      type: 'string',
      description: 'Used in the browser tab and as the SEO title fallback.',
      group: 'seo',
      initialValue: 'Home',
    },
    {
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    },
    {
      name: 'hero',
      title: 'Hero',
      type: 'heroSection',
      description: 'The hero at the very top of the homepage. Always rendered first; cannot be reordered.',
      group: 'sections',
    },
    {
      name: 'sections',
      title: 'Sections',
      type: 'array',
      description: 'Add, remove, and drag to reorder sections on the Homepage.',
      group: 'sections',
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
