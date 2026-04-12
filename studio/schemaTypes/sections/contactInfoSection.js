import {sectionBaseFields} from '../_shared/sectionBase'
import {richTextBody} from '../_shared/richTextBody'

// Contact info card. See docs/page-builder-spec.md §2.

export default {
  name: 'contactInfoSection',
  title: 'Contact Info',
  type: 'object',
  preview: {
    select: {heading: 'heading'},
    prepare({heading}) {
      return {title: 'Contact Info', subtitle: heading || ''}
    },
  },
  fields: [
    ...sectionBaseFields(),
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
    },
    richTextBody(),
    {
      name: 'showEmail',
      title: 'Show email',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'emailOverride',
      title: 'Email Override',
      type: 'string',
      description: 'Optional. Falls back to socialSettings if blank.',
    },
    {
      name: 'showPhone',
      title: 'Show phone',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'phoneOverride',
      title: 'Phone Override',
      type: 'string',
    },
    {
      name: 'showSocial',
      title: 'Show social links',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'showMap',
      title: 'Show map',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'mapEmbedUrl',
      title: 'Map Embed URL',
      type: 'url',
      hidden: ({parent}) => !parent?.showMap,
    },
    {
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: 'Inline', value: 'inline'},
          {title: 'Card', value: 'card'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'card',
    },
  ],
}
