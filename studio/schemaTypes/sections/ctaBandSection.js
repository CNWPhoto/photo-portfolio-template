import {sectionBaseFields} from '../_shared/sectionBase'
import {sectionIcon} from '../../components/SectionIcons'
import {imageField} from '../_shared/imageField'

// Horizontal call-to-action strip. Replaces aboutCtaSection.
// See docs/page-builder-spec.md §2 (ctaBandSection).

export default {
  name: 'ctaBandSection',
  icon: sectionIcon('ctaBandSection'),
  title: 'CTA Band',
  type: 'object',
  preview: {
    select: {heading: 'heading'},
    prepare({heading}) {
      return {title: 'CTA Band', subtitle: heading || ''}
    },
  },
  fields: [
    ...sectionBaseFields(),
    {
      name: 'heading',
      title: 'Heading',
      type: 'text',
      rows: 2,
      description: 'Use a line break (Enter) to split onto two lines.',
    },
    {
      name: 'body',
      title: 'Body',
      type: 'string',
      description: 'A short one or two sentences.',
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
    imageField({name: 'backgroundImage', title: 'Background Image'}),
    imageField({
      name: 'foregroundImage',
      title: 'Foreground Image',
      description: 'Portrait overlay photo (only used in Overlapping Images layout).',
      hidden: ({parent}) => parent?.layout !== 'overlapping-images',
    }),
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Small text below the button (e.g. "Serving Denver and surrounding areas.").',
      hidden: ({parent}) => parent?.layout !== 'overlapping-images',
    },
    {
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: 'Centered', value: 'centered'},
          {title: 'Split (text left, CTA right)', value: 'split-text-left-cta-right'},
          {title: 'Overlapping Images', value: 'overlapping-images'},
        ],
        layout: 'radio',
      },
      initialValue: 'centered',
    },
    {
      name: 'centeredHeight',
      title: 'Section Height',
      type: 'string',
      description:
        'Vertical size of the section. Default fits the content; Tall and Full viewport make the CTA feel like a hero-style banner. Only applies to the Centered layout.',
      options: {
        list: [
          {title: 'Default (fits content)', value: 'default'},
          {title: 'Tall', value: 'tall'},
          {title: 'Full viewport', value: 'viewport'},
        ],
        layout: 'radio',
      },
      initialValue: 'default',
      hidden: ({parent}) => parent?.layout && parent.layout !== 'centered',
    },
  ],
}
