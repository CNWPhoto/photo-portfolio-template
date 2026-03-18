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
