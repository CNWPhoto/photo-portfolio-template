import {sectionBaseFields} from '../_shared/sectionBase'

// Single featured quote. Replaces aboutQuoteSection.
// See docs/page-builder-spec.md §2 (pullQuoteSection).

export default {
  name: 'pullQuoteSection',
  title: 'Pull Quote',
  type: 'object',
  preview: {
    select: {quote: 'quote', attribution: 'attribution'},
    prepare({quote, attribution}) {
      return {title: 'Pull Quote', subtitle: quote ? `"${quote.slice(0, 60)}"` : attribution || ''}
    },
  },
  fields: [
    ...sectionBaseFields(),
    {
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'attribution',
      title: 'Attribution',
      type: 'string',
      description: 'Optional. e.g. "— Jane Doe"',
    },
    {
      name: 'variant',
      title: 'Variant',
      type: 'string',
      options: {
        list: [
          {title: 'Centered', value: 'centered'},
          {title: 'Bordered left', value: 'bordered-left'},
          {title: 'Italic large', value: 'italic-large'},
        ],
        layout: 'radio',
      },
      initialValue: 'centered',
    },
  ],
}
