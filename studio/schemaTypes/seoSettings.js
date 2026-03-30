export default {
  name: 'seoSettings',
  title: 'SEO',
  type: 'document',
  __experimental_actions: ['update', 'publish'], // singleton — no create/delete
  preview: {
    prepare() {
      return {title: 'SEO Settings'}
    },
  },
  fields: [
    {
      name: 'siteUrl',
      title: 'Site URL',
      type: 'url',
      description: "Your site's full URL e.g. https://yourstudio.com — used in SEO schema and sitemap. No trailing slash.",
    },
    {
      name: 'businessPhone',
      title: 'Business Phone',
      type: 'string',
      description: 'Phone number included in your business schema e.g. +1-303-555-0100',
    },
    {
      name: 'businessEmail',
      title: 'Business Email',
      type: 'string',
      description: 'Contact email included in your business schema',
    },
    {
      name: 'businessCity',
      title: 'City',
      type: 'string',
      description: 'City your business is based in — used in local SEO schema',
    },
    {
      name: 'businessState',
      title: 'State / Province',
      type: 'string',
      description: 'State or province abbreviation e.g. CO, CA, NY',
    },
  ],
}
