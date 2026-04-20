// Shared CTA link object. Supports internal page references, external URLs,
// in-page anchors, and an explicit "no link" state. Resolved at render time
// by src/lib/links.js resolveLink().

export const ctaLink = {
  name: 'ctaLink',
  title: 'CTA Link',
  type: 'object',
  fields: [
    {
      name: 'type',
      title: 'Link Type',
      type: 'string',
      options: {
        list: [
          {title: 'No link', value: 'none'},
          {title: 'Internal page', value: 'internal'},
          {title: 'External URL', value: 'external'},
          {title: 'Anchor on this page', value: 'anchor'},
        ],
        layout: 'radio',
      },
      initialValue: 'none',
    },
    {
      name: 'internal',
      title: 'Page',
      type: 'reference',
      // Every page-like document except the 404. resolveLink in
      // src/lib/links.js handles each _type — homepagePage → '/',
      // others use their slug field.
      to: [
        {type: 'page'},
        {type: 'homepagePage'},
        {type: 'portfolio'},
        {type: 'blogPage'},
      ],
      hidden: ({parent}) => parent?.type !== 'internal',
      weak: true,
    },
    {
      name: 'external',
      title: 'URL',
      type: 'url',
      validation: (Rule) =>
        Rule.uri({allowRelative: false, scheme: ['http', 'https', 'mailto', 'tel']}),
      hidden: ({parent}) => parent?.type !== 'external',
    },
    {
      name: 'anchor',
      title: 'Anchor',
      type: 'string',
      description: 'In-page anchor, e.g. "contact" or "#contact"',
      hidden: ({parent}) => parent?.type !== 'anchor',
    },
  ],
}

export default ctaLink
