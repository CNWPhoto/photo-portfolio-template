import {richTextBody} from '../_shared/richTextBody'

export default {
  name: 'welcomeSection',
  title: 'Welcome Section',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Welcome Section'}
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
      name: 'eyebrow',
      title: 'Eyebrow Label',
      type: 'string',
      description: 'Small label above the body text. Leave blank to hide.',
      initialValue: 'Every Session is Unique',
    },
    richTextBody({name: 'bodyRich'}),
    {
      name: 'body',
      title: '(Legacy) Body — First Paragraph',
      type: 'text',
      rows: 4,
      description: 'Legacy field. Move this content into Body above, then clear this field.',
      hidden: ({parent}) => !parent?.body,
    },
    {
      name: 'bodySecondary',
      title: '(Legacy) Body — Second Paragraph',
      type: 'text',
      rows: 4,
      description: 'Legacy field. Move this content into Body above, then clear this field.',
      hidden: ({parent}) => !parent?.bodySecondary,
    },
    {
      name: 'ctaText',
      title: 'CTA Link Text',
      type: 'string',
      description: 'Text for the call-to-action link. Leave blank to hide the link entirely.',
      initialValue: 'See the Experience →',
    },
    {
      name: 'ctaLink',
      title: 'CTA Link URL',
      type: 'string',
      description: 'Where the link points. Only used if CTA Link Text is set.',
      initialValue: '/experience',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      description: 'Photo shown beside the Welcome section text.',
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
  ],
}
