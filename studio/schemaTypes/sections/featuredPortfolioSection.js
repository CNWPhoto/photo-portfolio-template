import {sectionBaseFields} from '../_shared/sectionBase'
import {sectionIcon} from '../../components/SectionIcons'

// Featured portfolio section. Pulls items from the portfolio collection.
// See docs/page-builder-spec.md §2 (featuredPortfolioSection).

export default {
  name: 'featuredPortfolioSection',
  icon: sectionIcon('featuredPortfolioSection'),
  title: 'Featured Portfolio',
  type: 'object',
  preview: {
    select: {heading: 'heading', layout: 'layout'},
    prepare({heading, layout}) {
      return {title: 'Featured Portfolio', subtitle: heading || layout || ''}
    },
  },
  fields: [
    ...sectionBaseFields({withVerticalSideLabel: true}),
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
          {title: '4-column grid', value: 'grid-4'},
          {title: 'Masonry', value: 'masonry'},
          {title: 'Carousel', value: 'carousel'},
        ],
        layout: 'radio',
      },
      initialValue: 'masonry',
    },
    {
      name: 'source',
      title: 'Source',
      type: 'string',
      options: {
        list: [
          {title: 'Latest items', value: 'latest'},
          {title: 'Pick specific', value: 'pickSpecific'},
        ],
        layout: 'radio',
      },
      initialValue: 'latest',
    },
    {
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'portfolio'}]}],
      hidden: ({parent}) => parent?.source !== 'pickSpecific',
    },
    {
      name: 'filterByCategory',
      title: 'Filter by Category',
      type: 'reference',
      to: [{type: 'portfolioCategory'}],
      description: 'Optional. Only include items in this category.',
      hidden: ({parent}) => parent?.source !== 'latest',
    },
    {
      name: 'showCategory',
      title: 'Show category labels',
      type: 'boolean',
      initialValue: false,
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
