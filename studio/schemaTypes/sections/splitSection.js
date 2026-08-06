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
    ...sectionBaseFields({spacing: false}),
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
      type: 'text',
      rows: 2,
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
      // Every component renders the button as {ctaText && ...}, so a link
      // with no label is inert. Ask for the label first.
      hidden: ({parent}) => !parent?.ctaText,
    },
    {
      // Mirrors ctaBandSection's pair. Added because migrated sites routinely
      // run two buttons under a feature block — Chaltron Photography's homepage
      // has "More Senior Portrait Photography" beside "Book Your Session" on
      // all three. Without this the specific link wins and the booking link is
      // lost, which is the CTA that actually converts.
      name: 'secondaryCtaText',
      title: 'Second Button Text',
      type: 'string',
      description:
        'Optional. Adds a second button beside the first — e.g. "Book your session" next to "See the gallery". Leave blank for a single button.',
      hidden: ({parent}) => !parent?.ctaText,
    },
    {
      name: 'secondaryCtaLink',
      title: 'Second Button Link',
      type: 'ctaLink',
      hidden: ({parent}) => !parent?.secondaryCtaText,
    },
    {
      // Split's image column is a fixed 400x500 portrait well with
      // object-fit: cover, which is right for a person or a vertical
      // portrait and wrong for anything landscape — Chaltron Photography's
      // Wanderlust prints are wide lighthouse and aurora shots and lost
      // most of their frame. Opt-in so every existing Split is untouched.
      name: 'imageFit',
      title: 'Image Fit',
      type: 'string',
      description:
        'Crop to fill gives the tall editorial column — best for portraits and people. Show whole image keeps the full frame uncropped and evens the columns, which is what wide landscape photos and artwork need.',
      options: {
        list: [
          {title: 'Crop to fill (default)', value: 'crop'},
          {title: 'Show whole image', value: 'whole'},
        ],
        layout: 'radio',
      },
      initialValue: 'crop',
    },
    {
      // Mirrors heroSection's control. Split's heading runs up to 3.78rem,
      // which swallows a long title like "Springtime at the Ludington North
      // Breakwall Lighthouse 16APR26".
      name: 'headingSize',
      title: 'Heading Size',
      type: 'string',
      description:
        'Large is the default editorial size. Pick Standard for longer headings or a more restrained look.',
      options: {
        list: [
          {title: 'Large (default)', value: 'large'},
          {title: 'Standard (~20% smaller)', value: 'standard'},
        ],
        layout: 'radio',
      },
      initialValue: 'large',
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
    {
      name: 'mobileFlipOrder',
      title: 'Flip image/text order on mobile',
      type: 'boolean',
      description:
        'When on, swap the stacking order of the image and text on mobile (≤900px). Off by default — the section keeps its current mobile order.',
      initialValue: false,
    },
  ],
}
