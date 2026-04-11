import {richTextBody} from '../_shared/richTextBody'

export default {
  name: 'experienceNextSteps',
  title: 'Next Steps',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Next Steps'}
    },
  },
  fields: [
    {
      name: 'enabled',
      title: 'Show this section',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      description: 'Full-bleed background image. Landscape orientation recommended.',
      options: {hotspot: true},
      fields: [{name: 'alt', title: 'Alt text', type: 'string'}],
    },
    {
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'Small uppercase label above the heading.',
      placeholder: 'Next Steps',
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      placeholder: 'Get in touch',
    },
    richTextBody(),
    {
      name: 'bodyFirst',
      title: '(Legacy) Body — Paragraph 1',
      type: 'text',
      rows: 3,
      description: 'Legacy field. Move this content into Body above, then clear this field.',
      hidden: ({parent}) => !parent?.bodyFirst,
    },
    {
      name: 'bodySecond',
      title: '(Legacy) Body — Paragraph 2',
      type: 'text',
      rows: 3,
      description: 'Legacy field. Move this content into Body above, then clear this field.',
      hidden: ({parent}) => !parent?.bodySecond,
    },
    {
      name: 'ctaText',
      title: 'Button Text',
      type: 'string',
      placeholder: 'Get in touch',
    },
    {
      name: 'ctaLink',
      title: 'Button Link',
      type: 'string',
      description: 'URL or path the button links to.',
      placeholder: '/contact',
    },
  ],
}
