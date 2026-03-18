export default {
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    {
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description: 'Overrides the page title in search results. Leave blank to use the Page Title. Ideal length: 50–60 characters.',
    },
    {
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 3,
      description: 'Shown in search result snippets. Ideal length: 150–160 characters.',
    },
    {
      name: 'socialImage',
      title: 'Social Share Image',
      type: 'image',
      description: 'Image shown when this page is shared on social media. Ideal size: 1200 × 630px.',
      options: {hotspot: true},
    },
  ],
}
