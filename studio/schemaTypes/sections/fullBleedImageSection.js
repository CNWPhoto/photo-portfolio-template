import {sectionBaseFields} from '../_shared/sectionBase'
import {sectionIcon} from '../../components/SectionIcons'
import {imageField} from '../_shared/imageField'
import {richTextBody} from '../_shared/richTextBody'

// Full-width background image with overlaid text card or inline text.
// Replaces the whyChoose / experienceNextSteps backgrounds.
// See docs/page-builder-spec.md §2 (fullBleedImageSection) and §17 (parallax).

export default {
  name: 'fullBleedImageSection',
  icon: sectionIcon('fullBleedImageSection'),
  title: 'Full-Bleed Image',
  type: 'object',
  preview: {
    select: {heading: 'heading', image: 'image'},
    prepare({heading, image}) {
      return {title: 'Full-Bleed Image', subtitle: heading || '', media: image}
    },
  },
  fields: [
    ...sectionBaseFields(),
    imageField({title: 'Background Image'}),
    {
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Use a line break (Enter) to split onto two lines.',
    },
    richTextBody(),
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
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional small text below the CTA.',
    },
    {
      name: 'textContainer',
      title: 'Text Container',
      type: 'string',
      options: {
        list: [
          {title: 'Overlay card (white box on the image)', value: 'overlay-card'},
          {title: 'Inline overlay (text directly on the image)', value: 'inline-overlay'},
        ],
        layout: 'radio',
      },
      initialValue: 'overlay-card',
    },
    {
      name: 'textPosition',
      title: 'Text Position',
      type: 'string',
      options: {
        list: [
          'top-left', 'top-center', 'top-right',
          'center-left', 'center-center', 'center-right',
          'bottom-left', 'bottom-center', 'bottom-right',
        ],
      },
      initialValue: 'center-center',
    },
    {
      name: 'overlayOpacity',
      title: 'Overlay Opacity (%)',
      type: 'number',
      initialValue: 30,
      validation: (Rule) => Rule.min(0).max(100),
    },
    {
      name: 'height',
      title: 'Height',
      type: 'string',
      options: {
        list: [
          {title: 'Medium', value: 'medium'},
          {title: 'Tall', value: 'tall'},
          {title: 'Full viewport', value: 'viewport'},
        ],
        layout: 'radio',
      },
      initialValue: 'tall',
    },
    {
      name: 'parallax',
      title: 'Parallax (background-attachment: fixed)',
      type: 'boolean',
      description:
        'Subtle parallax: image stays put while the page scrolls past. Note: not supported on iOS Safari (falls back to normal scroll).',
      initialValue: false,
    },
  ],
}
