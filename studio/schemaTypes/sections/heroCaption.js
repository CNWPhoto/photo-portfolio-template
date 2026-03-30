export default {
  name: 'heroCaption',
  title: 'Homepage Hero Caption',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Hero Caption (H1 + Tagline)'}
    },
  },
  fields: [
    {
      name: 'enabled',
      title: 'Show Section',
      type: 'boolean',
      description: 'Toggle this section on or off on the homepage.',
      initialValue: true,
    },
    {
      name: 'nicheKeyword',
      title: 'Niche Keyword (H1 Heading)',
      type: 'string',
      description: 'The primary SEO keyword shown as the H1 heading below the slider. e.g. "Denver Dog Photographer"',
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'The subtitle shown beneath the H1 heading. e.g. "Natural, stress-free dog portraits for your best friend."',
    },
  ],
}
