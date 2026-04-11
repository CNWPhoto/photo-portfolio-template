import {richTextBody} from '../_shared/richTextBody'

export default {
  name: 'aboutPersonalSection',
  title: 'Deeper Dive Section',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Deeper Dive'}
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
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        {
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Describe the image for screen readers and SEO.',
        },
      ],
    },
    richTextBody(),
    {
      name: 'bodyParagraph1',
      title: '(Legacy) Body — Paragraph 1',
      type: 'text',
      rows: 3,
      description: 'Legacy field. Move this content into Body above, then clear this field.',
      hidden: ({parent}) => !parent?.bodyParagraph1,
    },
    {
      name: 'bodyParagraph2',
      title: '(Legacy) Body — Paragraph 2',
      type: 'text',
      rows: 3,
      description: 'Legacy field. Move this content into Body above, then clear this field.',
      hidden: ({parent}) => !parent?.bodyParagraph2,
    },
  ],
}
