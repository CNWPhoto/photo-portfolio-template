import {sectionBaseFields} from '../_shared/sectionBase'
import {headingSizeField} from '../_shared/headingSizeField'
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
      // The contained variants pin the image to a fixed 400px column, which
      // suits a portrait beside a paragraph and nothing else. A wide landscape
      // or a short caption both want a different balance, and until now the
      // only way to get one was the full-bleed variant's fixed 55/45.
      //
      // Ratio and cropping are separate decisions, so this composes with
      // Image Fit rather than replacing it. Default keeps today's exact
      // layout so no existing Split moves.
      name: 'columnRatio',
      title: 'Column Balance',
      type: 'string',
      description:
        'How the image and text divide the row. Default is the standard narrow image column. The others give the image or the text two thirds of the width — useful for wide photos, or for a long block of copy beside a small picture.',
      options: {
        list: [
          {title: 'Default', value: 'auto'},
          {title: 'Equal halves', value: '50-50'},
          {title: 'Image two thirds', value: 'image-major'},
          {title: 'Text two thirds', value: 'text-major'},
        ],
        layout: 'radio',
      },
      initialValue: 'auto',
    },
    {
      // Split has always rendered its CTA as an italic text link with an
      // arrow. That reads well inside prose and disappears when the section
      // is the page's main call to action.
      name: 'ctaStyle',
      title: 'Button Style',
      type: 'string',
      description:
        'Text link is the understated inline style this section has always used. Button gives it the same solid button as the CTA Band — better when this section is the main thing you want clicked.',
      options: {
        list: [
          {title: 'Text link (default)', value: 'link'},
          {title: 'Button', value: 'button'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'link',
      hidden: ({parent}) => !parent?.ctaText,
    },
    headingSizeField(),
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
