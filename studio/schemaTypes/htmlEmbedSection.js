// htmlEmbedSection — the only document type in the schema that accepts
// raw HTML/scripts. Used as a section directly inside a page's sections[]
// array, AND referenced from footerSettings.middleColumn.embed. Centralizes
// raw-HTML risk to a single document with explicit warning copy.
// See docs/page-builder-spec.md §2 (htmlEmbedSection).

export default {
  name: 'htmlEmbedSection',
  title: 'HTML Embed',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Internal Name',
      type: 'string',
      description: 'Internal label so editors can find this embed (e.g. "Mailchimp Newsletter Signup").',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Internal Notes',
      type: 'text',
      rows: 2,
      description: 'Optional notes about what this embed does.',
    },
    {
      name: 'rawHtml',
      title: 'Raw HTML / Embed Code',
      type: 'text',
      rows: 12,
      description:
        '⚠️ TRUST REQUIRED. This field accepts raw HTML and scripts that will run on your live site. Only paste embed code from services you trust (Mailchimp, ConvertKit, Calendly, Google Maps, etc.). Pasting code from untrusted sources can break your site or expose visitors to malicious scripts.',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'containerWidth',
      title: 'Container Width',
      type: 'string',
      options: {
        list: [
          {title: 'Narrow (600px)', value: 'narrow'},
          {title: 'Default (760px)', value: 'default'},
          {title: 'Wide (1100px)', value: 'wide'},
          {title: 'Full width', value: 'full'},
        ],
        layout: 'radio',
      },
      initialValue: 'default',
    },
    {
      name: 'containerHeight',
      title: 'Container Height (px)',
      type: 'number',
      description: 'Optional. Useful for fixed-height iframe widgets.',
    },
  ],
  preview: {
    select: {title: 'name', subtitle: 'description'},
    prepare({title, subtitle}) {
      return {title: title || 'HTML Embed', subtitle}
    },
  },
}
