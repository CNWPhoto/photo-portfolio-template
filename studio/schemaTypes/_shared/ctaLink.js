// Shared CTA link object. Supports internal page references, external URLs,
// in-page anchors, and an explicit "no link" state. Resolved at render time
// by src/lib/links.js resolveLink().

export const ctaLink = {
  name: 'ctaLink',
  title: 'CTA Link',
  type: 'object',
  // Non-blocking nudge when the sibling ctaText is filled in but the link
  // has nowhere to go — the button either won't render or won't navigate,
  // which editors otherwise only discover on the live site.
  validation: (Rule) =>
    Rule.custom((value, context) => {
      const ctaText = context.parent?.ctaText
      if (!ctaText) return true
      const type = value?.type
      if (!type || type === 'none') {
        return 'Button text is set but Link Type is "No link" — pick where the button should go, or clear the button text.'
      }
      if (type === 'internal' && !value?.internal?._ref) {
        return 'Button text is set but no page is chosen — pick the page this button should go to.'
      }
      return true
    }).warning(),
  fields: [
    {
      name: 'type',
      title: 'Link Type',
      type: 'string',
      // Internal-first: linking to your own pages is the common case, and
      // the page picker beats pasted absolute URLs (those break when the
      // site moves domains — resolveLink strips self-origins defensively,
      // but not needing the paste at all is better).
      options: {
        list: [
          {title: 'Internal page', value: 'internal'},
          {title: 'External URL', value: 'external'},
          {title: 'Anchor on this page', value: 'anchor'},
          {title: 'No link', value: 'none'},
        ],
        layout: 'radio',
      },
      initialValue: 'internal',
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
      // Validate only when this is actually an external link. Sanity runs
      // validation on hidden fields too, so an unconditional Rule.uri here
      // would block publish whenever a stale external value lingers after
      // the editor switched the link type to internal/anchor/none.
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.parent?.type !== 'external') return true
          if (!value) return 'Add a URL for the external link'
          let parsed
          try {
            parsed = new URL(value)
          } catch {
            return 'Enter a full URL including https:// (relative paths are not allowed for external links)'
          }
          if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
            return 'URL must start with http://, https://, mailto:, or tel:'
          }
          return true
        }),
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
