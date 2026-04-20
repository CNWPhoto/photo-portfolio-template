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
    select: {heading: 'heading', eyebrow: 'eyebrow'},
    prepare({heading, eyebrow}) {
      return {title: 'Featured Portfolio', subtitle: heading || eyebrow || ''}
    },
  },
  fields: [
    ...sectionBaseFields({withVerticalSideLabel: true}),
    {
      name: 'eyebrow',
      title: 'Vertical Label',
      type: 'string',
      description:
        'Short word rendered rotated 90° down the left edge of the section (e.g. "Featured", "Gallery", "Work"). Defaults to "Featured" if left blank. Short single words read best at this size.',
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Optional heading rendered above the images.',
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
