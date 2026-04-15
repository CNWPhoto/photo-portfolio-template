import {sectionBaseFields} from '../_shared/sectionBase'
import {sectionIcon} from '../../components/SectionIcons'
import {richTextBody} from '../_shared/richTextBody'

// FAQ section. Replaces homepageFaqs and experienceFaqs.
// See docs/page-builder-spec.md §2 (faqSection).

export default {
  name: 'faqSection',
  icon: sectionIcon('faqSection'),
  title: 'FAQs',
  type: 'object',
  preview: {
    select: {heading: 'heading'},
    prepare({heading}) {
      return {title: 'FAQs', subtitle: heading || ''}
    },
  },
  fields: [
    ...sectionBaseFields({withVerticalSideLabel: true}),
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Use a line break (Enter) to split onto two lines.',
      initialValue: 'Frequently Asked Questions',
    },
    {
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: 'Accordion (click to expand)', value: 'accordion'},
          {title: 'Flat list (always open)', value: 'flat-list'},
        ],
        layout: 'radio',
      },
      initialValue: 'accordion',
    },
    {
      name: 'faqs',
      title: 'Questions',
      type: 'array',
      validation: (Rule) => Rule.min(1),
      of: [
        {
          type: 'object',
          name: 'faqItem',
          fields: [
            {
              name: 'question',
              title: 'Question',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              ...richTextBody(),
              name: 'answer',
              title: 'Answer',
            },
          ],
          preview: {
            select: {title: 'question'},
          },
        },
      ],
    },
    {
      name: 'showSchema',
      title: 'Emit FAQ schema.org markup',
      type: 'boolean',
      description: 'Recommended. Helps Google show this section as a rich result.',
      initialValue: true,
    },
  ],
}
