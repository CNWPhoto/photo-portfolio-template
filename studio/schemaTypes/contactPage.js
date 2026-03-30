export default {
  name: 'contactPage',
  title: 'Contact Page',
  type: 'document',
  __experimental_actions: ['update', 'publish', 'create'],
  preview: {
    prepare() {
      return {title: 'Contact Page'}
    },
  },
  groups: [
    {name: 'all', title: 'All', default: true},
    {name: 'form', title: 'Form'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    {
      name: 'pageTitle',
      title: 'Page Title',
      type: 'string',
      description: 'Used in the browser tab and as the SEO title fallback.',
      group: ['all', 'seo'],
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The URL for this page (e.g. /about). ⚠️ Avoid changing this once the page is live — it will break existing links and hurt your search rankings. If you must change it, set up a 301 redirect from the old URL to the new one in your hosting settings.',
      options: {source: 'pageTitle'},
      group: ['all', 'seo'],
    },
    {
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: ['all', 'seo'],
    },

    // ── Hero ────────────────────────────────────────────────
    {
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      options: {hotspot: true},
      group: 'all',
    },
    {
      name: 'heroHeading',
      title: 'Hero Heading',
      type: 'string',
      group: 'all',
    },
    {
      name: 'heroSubtext',
      title: 'Hero Subtext',
      type: 'text',
      rows: 2,
      group: 'all',
    },

    // ── Info panel (left column) ─────────────────────────────
    {
      name: 'infoHeading',
      title: 'Info Heading',
      type: 'string',
      description: 'The heading displayed to the left of the form.',
      group: 'all',
    },
    {
      name: 'infoBody',
      title: 'Info Body Text',
      type: 'text',
      rows: 3,
      description: 'Supporting text displayed below the info heading.',
      group: 'all',
    },

    // ── Embed override ───────────────────────────────────────
    {
      name: 'embedCode',
      title: 'Form Embed Code',
      type: 'text',
      rows: 6,
      description:
        'Optional. Paste embed code from Typeform, JotForm, HubSpot, etc. If filled, this replaces the built-in form entirely.',
      group: ['all', 'form'],
    },

    // ── Built-in form settings ───────────────────────────────
    {
      name: 'formSettings',
      title: 'Built-in Form Settings',
      type: 'object',
      description: 'Used when no Embed Code is set above.',
      group: 'form',
      fields: [
        {
          name: 'web3formsKey',
          title: 'Web3Forms Access Key',
          type: 'string',
          description:
            'Get a free key at web3forms.com — form submissions will be emailed to the address on that account.',
        },
        {
          name: 'submitButtonText',
          title: 'Submit Button Text',
          type: 'string',
          initialValue: 'Send Message',
        },
        {
          name: 'successMessage',
          title: 'Success Message',
          type: 'string',
          description: 'Shown after the form is submitted successfully.',
          initialValue: "Thank you! I'll be in touch soon.",
        },
        // ── Custom fields ──────────────────────────────────
        {
          name: 'customField1',
          title: 'Custom Field 1',
          type: 'object',
          fields: [
            {
              name: 'enabled',
              title: 'Show this field',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'label',
              title: 'Field Label',
              type: 'string',
              description: 'e.g. Phone Number, Event Date, Location',
            },
          ],
        },
        {
          name: 'customField2',
          title: 'Custom Field 2',
          type: 'object',
          fields: [
            {
              name: 'enabled',
              title: 'Show this field',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'label',
              title: 'Field Label',
              type: 'string',
            },
          ],
        },
        {
          name: 'customField3',
          title: 'Custom Field 3',
          type: 'object',
          fields: [
            {
              name: 'enabled',
              title: 'Show this field',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'label',
              title: 'Field Label',
              type: 'string',
            },
          ],
        },
      ],
    },
  ],
}
