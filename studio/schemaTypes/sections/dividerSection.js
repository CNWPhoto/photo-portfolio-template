import {sectionBaseFields} from '../_shared/sectionBase'
import {sectionIcon} from '../../components/SectionIcons'

// Visual break between sections. See docs/page-builder-spec.md §2.

export default {
  name: 'dividerSection',
  icon: sectionIcon('dividerSection'),
  title: 'Divider',
  type: 'object',
  preview: {
    select: {label: 'label', style: 'style'},
    prepare({label, style}) {
      return {title: 'Divider', subtitle: label || style || ''}
    },
  },
  fields: [
    ...sectionBaseFields(),
    {
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'Optional small italic text in the middle of the line.',
      hidden: ({parent}) => parent?.style === 'blank',
    },
    {
      name: 'style',
      title: 'Style',
      type: 'string',
      options: {
        list: [
          {title: 'Line', value: 'line'},
          {title: 'Dots', value: 'dots'},
          {title: 'Blank — spacer (no line)', value: 'blank'},
        ],
        layout: 'radio',
      },
      initialValue: 'line',
    },
    {
      name: 'heightPx',
      title: 'Height (px)',
      type: 'number',
      description:
        'Optional fixed height, 1–125px. For "Blank" this is the empty spacer height; ' +
        'for Line/Dots the line (and label) is centered within it. Leave empty to use ' +
        'the section spacing instead.',
      validation: (Rule) => Rule.min(1).max(125).integer(),
    },
  ],
}
