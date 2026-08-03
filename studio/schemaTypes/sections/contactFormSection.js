import {sectionBaseFields} from '../_shared/sectionBase'
import {sectionIcon} from '../../components/SectionIcons'
import {richTextBody} from '../_shared/richTextBody'

// Two modes: built-in Web3Forms-backed form, or an embedded third-party
// iframe form (Jotform, Typeform, Google Forms, Calendly).
// Raw HTML embeds go through htmlEmbedSection instead.
// See docs/page-builder-spec.md §2 (contactFormSection) and §13.

export default {
  name: 'contactFormSection',
  icon: sectionIcon('contactFormSection'),
  title: 'Contact Form',
  type: 'object',
  preview: {
    select: {heading: 'heading', mode: 'mode'},
    prepare({heading, mode}) {
      return {title: 'Contact Form', subtitle: heading || mode || ''}
    },
  },
  fields: [
    ...sectionBaseFields({spacing: false}),
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
    richTextBody(),
    {
      name: 'mode',
      title: 'Mode',
      type: 'string',
      options: {
        list: [
          {title: 'Built-in (Web3Forms)', value: 'built-in'},
          {title: 'Embed (iframe URL)', value: 'embed'},
        ],
        layout: 'radio',
      },
      initialValue: 'built-in',
    },

    // ── Built-in mode fields ──────────────────────────────────────
    {
      name: 'formFields',
      title: 'Form Fields',
      type: 'array',
      description: 'Configure the fields shown in the built-in form.',
      hidden: ({parent}) => parent?.mode !== 'built-in',
      of: [
        {
          type: 'object',
          name: 'formField',
          fields: [
            {
              name: 'name',
              title: 'Field Name',
              type: 'string',
              description: 'Internal name (e.g. "email"). No spaces.',
              validation: (Rule) =>
                Rule.required().regex(/^[a-zA-Z0-9_-]+$/, {name: 'identifier'}).error(
                  'Letters, digits, underscores, and dashes only',
                ),
            },
            {
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'type',
              title: 'Type',
              type: 'string',
              options: {
                list: [
                  {title: 'Text', value: 'text'},
                  {title: 'Email', value: 'email'},
                  {title: 'Phone', value: 'tel'},
                  {title: 'Textarea', value: 'textarea'},
                  {title: 'Select', value: 'select'},
                  {title: 'Checkbox', value: 'checkbox'},
                ],
              },
              initialValue: 'text',
            },
            {
              name: 'description',
              title: 'Helper Text',
              type: 'string',
              description:
                'Optional hint under the label, e.g. "Word of mouth, Instagram, Google search…". Guides the answer without cluttering the label.',
            },
            {
              name: 'required',
              title: 'Required',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'options',
              title: 'Select Options',
              type: 'array',
              of: [{type: 'string'}],
              hidden: ({parent}) => parent?.type !== 'select',
            },
          ],
          preview: {
            select: {title: 'label', subtitle: 'type'},
          },
        },
      ],
    },
    {
      name: 'submitText',
      title: 'Submit Button Text',
      type: 'string',
      initialValue: 'Send',
      hidden: ({parent}) => parent?.mode !== 'built-in',
    },
    {
      name: 'successMessage',
      title: 'Success Message',
      type: 'string',
      initialValue: "Thanks — we'll be in touch soon.",
      hidden: ({parent}) => parent?.mode !== 'built-in',
    },
    {
      name: 'errorMessage',
      title: 'Error Message',
      type: 'string',
      initialValue: 'Something went wrong. Please try again or email us directly.',
      hidden: ({parent}) => parent?.mode !== 'built-in',
    },
    // No "destination email" field here on purpose: Web3Forms fixes the
    // recipient in the access key's own settings, and its API has no
    // per-submission recipient override. Changing where messages land means
    // changing it at web3forms.com (or pasting a different key below).
    {
      name: 'web3formsKeyOverride',
      title: 'Web3Forms Key Override',
      type: 'string',
      description:
        'Optional. Use a different Web3Forms access key for this form than the site-wide one. Where submissions land is set by the key itself — in your Web3Forms account, not here.',
      hidden: ({parent}) => parent?.mode !== 'built-in',
    },

    // ── Embed mode fields ─────────────────────────────────────────
    {
      name: 'embedUrl',
      title: 'Embed URL',
      type: 'url',
      description: 'The iframe source (e.g. a Jotform share URL).',
      hidden: ({parent}) => parent?.mode !== 'embed',
    },
    {
      name: 'embedHeight',
      title: 'Embed Height (px)',
      type: 'number',
      initialValue: 600,
      hidden: ({parent}) => parent?.mode !== 'embed',
    },
    {
      name: 'embedTitle',
      title: 'Embed Title',
      type: 'string',
      description: 'Iframe title attribute for accessibility.',
      initialValue: 'Contact form',
      hidden: ({parent}) => parent?.mode !== 'embed',
    },
  ],
}
