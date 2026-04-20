import {sectionBaseFields} from '../_shared/sectionBase'
import {sectionIcon} from '../../components/SectionIcons'

// Blog teaser section. Pulls posts from the blog collection.
// See docs/page-builder-spec.md §2 (blogTeaserSection).

export default {
  name: 'blogTeaserSection',
  icon: sectionIcon('blogTeaserSection'),
  title: 'Blog Teaser',
  type: 'object',
  preview: {
    select: {heading: 'heading'},
    prepare({heading}) {
      return {title: 'Blog Teaser', subtitle: heading || ''}
    },
  },
  fields: [
    ...sectionBaseFields(),
    // `layout` (grid-3 / horizontal-list / cards) was removed. horizontal-list
    // didn't fit the design, `cards` rendered identically to grid-3, and the
    // choice had no practical value. The section always renders as a 3-column
    // grid. Legacy docs may still carry a stored `layout` value — harmless,
    // component ignores it.
    {
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
    },
    {
      name: 'postCount',
      title: 'Post Count',
      type: 'number',
      description: 'How many latest posts to show.',
      initialValue: 3,
    },
    {
      name: 'showCategory',
      title: 'Show category',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'showExcerpt',
      title: 'Show excerpt',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'showDate',
      title: 'Show date',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'ctaText',
      title: 'Button Text',
      type: 'string',
    },
    {
      name: 'ctaLink',
      title: 'Button Link',
      type: 'ctaLink',
    },
  ],
}
