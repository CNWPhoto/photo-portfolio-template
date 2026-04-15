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
    select: {heading: 'heading', layout: 'layout'},
    prepare({heading, layout}) {
      return {title: 'Blog Teaser', subtitle: heading || layout || ''}
    },
  },
  fields: [
    ...sectionBaseFields(),
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
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: '3-column grid', value: 'grid-3'},
          {title: 'Horizontal list', value: 'horizontal-list'},
          {title: 'Cards', value: 'cards'},
        ],
        layout: 'radio',
      },
      initialValue: 'grid-3',
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
