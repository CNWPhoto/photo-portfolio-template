import {sectionBaseFields} from '../_shared/sectionBase'

// Blog teaser section. Pulls posts from the blog collection.
// See docs/page-builder-spec.md §2 (blogTeaserSection).

export default {
  name: 'blogTeaserSection',
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
      name: 'source',
      title: 'Source',
      type: 'string',
      options: {
        list: [
          {title: 'Latest posts', value: 'latest'},
          {title: 'Pick specific', value: 'pickSpecific'},
        ],
        layout: 'radio',
      },
      initialValue: 'latest',
    },
    {
      name: 'postCount',
      title: 'Post Count',
      type: 'number',
      initialValue: 3,
      hidden: ({parent}) => parent?.source !== 'latest',
    },
    {
      name: 'specificPosts',
      title: 'Posts',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'blogPost'}]}],
      hidden: ({parent}) => parent?.source !== 'pickSpecific',
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
