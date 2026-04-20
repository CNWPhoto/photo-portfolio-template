import {sectionsOf, sectionsInsertMenu} from './_shared/sectionsArrayConfig'

// 404 page. Migrated from flat fields (image/heading/subheading/ctaText/ctaLink)
// to the unified sections shape so it shares the same renderer as the rest
// of the site. The seed script populates a single fullBleedImageSection
// matching the previous default. See docs/page-builder-spec.md §1, §15 Phase 11.

export default {
  name: 'notFoundPage',
  title: '404 Page',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  preview: {
    prepare() {
      return {title: '404 Page'}
    },
  },
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'sections', title: 'Sections'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    {
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    },
    {
      name: 'sections',
      title: 'Sections',
      type: 'array',
      description:
        'The 404 page is built from sections like any other page. The default seed contains a single full-bleed image with a heading, subheading, and a "Back to home" button.',
      group: ['content', 'sections'],
      initialValue: [
        {_type: 'fullBleedImageSection', _key: 'notFoundFullBleed'},
      ],
      of: sectionsOf,
      options: {insertMenu: sectionsInsertMenu},
    },
  ],
}
