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
    },
    {
      name: 'style',
      title: 'Style',
      type: 'string',
      options: {
        list: [
          {title: 'Line', value: 'line'},
          {title: 'Dots', value: 'dots'},
          {title: 'Ornament', value: 'ornament'},
        ],
        layout: 'radio',
      },
      initialValue: 'line',
    },
  ],
}
