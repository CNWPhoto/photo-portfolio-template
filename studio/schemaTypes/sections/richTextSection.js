import {linkAnnotation} from '../_shared/linkAnnotation'
import {sectionBaseFields} from '../_shared/sectionBase'
import {headingSizeField} from '../_shared/headingSizeField'
import {sectionIcon} from '../../components/SectionIcons'

// Standalone rich text body, no image. For about blurbs, policies,
// long-form copy on any page. See docs/page-builder-spec.md §2.

export default {
  name: 'richTextSection',
  icon: sectionIcon('richTextSection'),
  title: 'Rich Text',
  type: 'object',
  preview: {
    select: {heading: 'heading'},
    prepare({heading}) {
      return {title: 'Rich Text', subtitle: heading || ''}
    },
  },
  fields: [
    ...sectionBaseFields(),
    headingSizeField(),
    {
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
    },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      description:
        'Long-form rich text. Supports headings, lists, blockquotes, bold, italic, and links.',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
            ],
            annotations: [
              linkAnnotation(),
            ],
          },
        },
      ],
    },
    {
      name: 'ctaText',
      title: 'Button Text',
      type: 'string',
      description: 'Optional. Adds a rectangular button below the body. Leave blank to hide.',
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
      name: 'textAlignment',
      title: 'Text Alignment',
      type: 'string',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'left',
    },
    {
      name: 'maxWidth',
      title: 'Max Width',
      type: 'string',
      options: {
        list: [
          {title: 'Narrow (600px)', value: 'narrow'},
          {title: 'Default (760px)', value: 'default'},
          {title: 'Wide (1100px)', value: 'wide'},
        ],
        layout: 'radio',
      },
      initialValue: 'default',
    },
  ],
}
