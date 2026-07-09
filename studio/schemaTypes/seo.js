export default {
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    {
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description: 'Overrides the page title in search results. Your site name is appended automatically — write just the page-specific title here (e.g. "Riverside Family Photographer", not "Riverside Family Photographer | Lavon Photography"). Leave blank to use the Page Title. Ideal length: 50–60 characters.',
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
    {
      name: 'hideFromSearch',
      title: 'Hide this page from search engines',
      type: 'boolean',
      initialValue: false,
      description:
        '⚠️ WARNING: turning this ON removes the page from Google and every other search engine — it adds a "noindex" tag and drops the page from your sitemap. The page still works and stays reachable by its direct link; it just won\'t appear in search results. Only use this for pages you deliberately want unlisted (a private product guide, a thank-you page, etc.). Leave OFF for anything you want people to find in search.',
      // Fires an unmissable ⚠ in the Studio every time it's on — an explicit
      // reconfirmation before each publish, without blocking.
      validation: (Rule) =>
        Rule.custom((val) =>
          val === true
            ? 'This page is set to HIDDEN from search engines — it will NOT appear on Google. Confirm this is intended before publishing.'
            : true,
        ).warning(),
    },
  ],
}
