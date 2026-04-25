import {sectionBaseFields} from '../_shared/sectionBase'
import {sectionIcon} from '../../components/SectionIcons'
import {imageField} from '../_shared/imageField'

// Featured portfolio section. Defaults to pulling images from the Portfolio
// singleton (first portrait + first landscape it finds). Editors can
// optionally override by uploading two images directly on the section.
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
    // verticalSideLabel is intentionally NOT included — this section uses
    // its own `eyebrow` field as the rotated label, so the shared field
    // would just duplicate and confuse editors.
    ...sectionBaseFields(),
    {
      name: 'showVerticalLabel',
      title: 'Show Vertical Label',
      type: 'boolean',
      description:
        'Toggle the rotated decorative label on the left edge of the section.',
      initialValue: true,
    },
    {
      name: 'eyebrow',
      title: 'Vertical Label',
      type: 'string',
      description:
        'Short word rendered rotated 90° down the left edge of the section (e.g. "Featured", "Gallery", "Work"). Defaults to "Featured" if left blank. Short single words read best at this size.',
      hidden: ({parent}) => parent?.showVerticalLabel === false,
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Optional heading rendered above the images.',
    },
    {
      name: 'images',
      title: 'Images (override)',
      type: 'array',
      description:
        'Optional. Upload up to 2 images to override what this section shows. First image fills the left (narrower) slot; second fills the right (wider) slot. Leave empty to auto-pull from the Portfolio gallery (first portrait + first landscape).',
      validation: (Rule) => Rule.max(2),
      of: [imageField({})],
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
