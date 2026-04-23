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
      name: 'textContainer',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: 'Overlay card (white box on the image)', value: 'overlay-card'},
          {title: 'Image only (no text, no spacing below)', value: 'image-only'},
        ],
        layout: 'radio',
      },
      initialValue: 'overlay-card',
    },
    {
      name: 'cardPlacement',
      title: 'Card Placement',
      type: 'string',
      description: 'Which side the overlay card sits on. Only applies to the Overlay card layout.',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'left',
      hidden: ({parent}) => parent?.textContainer !== 'overlay-card',
    },
    {
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      hidden: ({parent}) => parent?.textContainer === 'image-only',
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Use a line break (Enter) to split onto two lines.',
      hidden: ({parent}) => parent?.textContainer === 'image-only',
    },
    richTextBody({hidden: ({parent}) => parent?.textContainer === 'image-only'}),
    {
      name: 'ctaText',
      title: 'Button Text',
      type: 'string',
      hidden: ({parent}) => parent?.textContainer === 'image-only',
    },
    {
      name: 'ctaLink',
      title: 'Button Link',
      type: 'ctaLink',
      hidden: ({parent}) => parent?.textContainer === 'image-only',
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional small text below the CTA.',
      hidden: ({parent}) => parent?.textContainer === 'image-only',
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
