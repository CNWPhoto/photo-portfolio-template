export default {
  name: 'seoSettings',
  title: 'SEO',
  type: 'document',
  __experimental_actions: ['update', 'publish'], // singleton — no create/delete
  preview: {
    select: {title: 'internalTitle'},
    prepare({title}) {
      return {title: title || 'SEO Settings'}
    },
  },
  fields: [
    {
      name: 'internalTitle',
      title: 'Title',
      type: 'string',
      readOnly: true,
      initialValue: 'SEO Settings',
      hidden: true,
    },
    {
      name: 'seoNote',
      title: 'SEO Settings',
      type: 'string',
      readOnly: true,
      initialValue: 'These fields power your structured data (Google rich results), sitemap, and local SEO. Fill in as much as you can — the more complete, the better.',
      description: 'These fields power your structured data (Google rich results), sitemap, and local SEO. Fill in as much as you can — the more complete, the better.',
    },
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
    {
      name: 'areaServed',
      title: 'Area Served',
      type: 'string',
      description: 'Cities or regions you photograph in, comma-separated. Used in local SEO schema. e.g. Denver, Boulder, Fort Collins',
    },
    {
      name: 'priceRange',
      title: 'Price Range',
      type: 'string',
      description: 'Approximate price tier shown in Google local results.',
      options: {list: [{title: 'Budget ($)', value: '$'}, {title: 'Moderate ($$)', value: '$$'}, {title: 'Premium ($$$)', value: '$$$'}, {title: 'Luxury ($$$$)', value: '$$$$'}], layout: 'radio'},
    },
    {
      name: 'twitterHandle',
      title: 'Twitter / X Handle',
      type: 'string',
      description: 'Your Twitter/X handle without the @ symbol, e.g. yourstudio — used for Twitter Card attribution.',
    },
    {
      name: 'googleSiteVerification',
      title: 'Google Search Console Verification Code',
      type: 'string',
      description:
        'Proves to Google that you own this site, so you can see how people find you in search. In Search Console choose the "HTML tag" verification method, then copy ONLY the long code from inside content="..." and paste it here. Publish, then click Verify in Search Console.',
      placeholder: 'AbC123dEf456...',
      validation: (Rule) =>
        Rule.custom((value) => {
          if (typeof value !== 'string') return true
          const code = value.trim()
          if (!code) return true

          if (/<\s*meta|content\s*=/i.test(code)) {
            return 'Paste only the code from inside content="..." — not the whole <meta> tag.'
          }
          if (!/^[A-Za-z0-9_-]+$/.test(code)) {
            return 'That doesn\'t look like a verification code — it should be letters, numbers, dashes and underscores only.'
          }
          return true
        }),
    },
  ],
}
