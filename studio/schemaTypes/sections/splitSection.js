import {sectionBaseFields} from '../_shared/sectionBase'
import {imageField} from '../_shared/imageField'
import {ctaLink} from '../_shared/ctaLink'
import {richTextBody} from '../_shared/richTextBody'
import {sectionIcon} from '../../components/SectionIcons'

// Two-column image + rich text. The workhorse layout — replaces all the
// niche-named intro / welcome / personal sections.
// See docs/page-builder-spec.md §2 (splitSection).

export default {
  name: 'splitSection',
  title: 'Split (Image + Text)',
  type: 'object',
  icon: sectionIcon('splitSection'),
  preview: {
    select: {heading: 'heading', image: 'image'},
    prepare({heading, image}) {
      return {title: 'Split', subtitle: heading || '', media: image}
    },
  },
  fields: [
    // Split opts out of the shared vertical side label — the rail rarely
    // landed visually correctly across all four Split variants. Tracked
    // in docs/deferred-features.md for possible future rework.
    ...sectionBaseFields(),
    {
      name: 'imageLayout',
      title: 'Image Layout',
      type: 'string',
      options: {
        list: [
          {title: 'Image left', value: 'image-left'},
          {title: 'Image right', value: 'image-right'},
          {title: 'Image left, full bleed', value: 'image-left-full-bleed'},
          {title: 'Image right, full bleed', value: 'image-right-full-bleed'},
        ],
      },
      initialValue: 'image-right',
    },
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
    imageField({}),
    {
      name: 'textAlignment',
      title: 'Text Alignment',
      type: 'string',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'left',
    },
  ],
}
