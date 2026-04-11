import {richTextBody} from '../_shared/richTextBody'

export default {
  name: 'whyChooseSection',
  title: 'Why Choose Section',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Why Choose Section'}
    },
  },
  fields: [
    {
      name: 'enabled',
      title: 'Show Section',
      type: 'boolean',
      description: 'Toggle this section on or off on the homepage.',
      initialValue: true,
    },
    {
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      description: 'Full-bleed background image displayed above the text block.',
      options: {hotspot: true, crop: true},
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Describe the image for accessibility.',
        },
      ],
    },
    {
      name: 'heading',
      title: 'Section Heading',
      type: 'string',
      description: 'Main H2 heading. Use a line break to split onto two lines.',
      initialValue: 'Why Choose\nOur Studio?',
    },
    richTextBody(),
    {
      name: 'bodyFirst',
      title: '(Legacy) Body — First Paragraph',
      type: 'text',
      rows: 4,
      description: 'Legacy field. Move this content into Body above, then clear this field.',
      hidden: ({parent}) => !parent?.bodyFirst,
    },
    {
      name: 'bodySecond',
      title: '(Legacy) Body — Second Paragraph',
      type: 'text',
      rows: 4,
      description: 'Legacy field. Move this content into Body above, then clear this field.',
      hidden: ({parent}) => !parent?.bodySecond,
    },
    {
      name: 'ctaText',
      title: 'Button Text',
      type: 'string',
      description: 'Label for the call-to-action button.',
      initialValue: 'Get in Touch',
    },
    {
      name: 'ctaLink',
      title: 'Button Link',
      type: 'string',
      description: 'URL the button links to.',
      initialValue: '/contact',
    },
    {
      name: 'caption',
      title: 'Below-Button Caption',
      type: 'string',
      description: 'Small text displayed beneath the button.',
      initialValue: 'Serving your city and surrounding areas.',
    },
  ],
}
