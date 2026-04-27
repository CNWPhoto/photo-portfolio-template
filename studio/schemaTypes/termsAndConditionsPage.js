// Terms & Conditions singleton. Reachable at /terms-and-conditions on the
// rendered site. Footer.astro auto-shows a link to this page when its body
// has content, unless the editor has manually configured
// footerSettings.legalLinks.terms with a URL (e.g. iubenda) — in which case
// the manual override wins. See src/pages/terms-and-conditions.astro for
// the route and Footer.astro for the link-resolution logic.

export default {
  name: 'termsAndConditionsPage',
  title: 'Terms & Conditions',
  type: 'document',
  __experimental_actions: ['update', 'publish'], // singleton — no create/delete
  preview: {
    prepare() {
      return {title: 'Terms & Conditions'}
    },
  },
  fields: [
    {
      name: 'title',
      title: 'Page Title',
      type: 'string',
      description: 'Heading shown at the top of the page and used as the auto-link label in the footer.',
      initialValue: 'Terms and Conditions',
    },
    {
      name: 'body',
      title: 'Content',
      type: 'array',
      description: 'Rich text. Press Enter twice to start a new paragraph. Use H2/H3 for section headings.',
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
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [{name: 'href', type: 'url', title: 'URL'}],
              },
            ],
          },
        },
      ],
    },
  ],
}
