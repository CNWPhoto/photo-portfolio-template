import {richTextBody} from '../_shared/richTextBody'

export default {
  name: 'experienceIntro',
  title: 'Intro',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Intro'}
    },
  },
  fields: [
    {
      name: 'enabled',
      title: 'Show this section',
      type: 'boolean',
      initialValue: true,
    },
    richTextBody(),
    {
      name: 'bodyFirst',
      title: '(Legacy) First Paragraph',
      type: 'text',
      rows: 4,
      description: 'Legacy field. Move this content into Body above, then clear this field.',
      hidden: ({parent}) => !parent?.bodyFirst,
    },
    {
      name: 'bodySecond',
      title: '(Legacy) Second Paragraph',
      type: 'text',
      rows: 3,
      description: 'Legacy field. Move this content into Body above, then clear this field.',
      hidden: ({parent}) => !parent?.bodySecond,
    },
  ],
}
