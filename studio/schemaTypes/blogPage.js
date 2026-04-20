export default {
  name: 'blogPage',
  title: 'Blog Page',
  type: 'document',
  __experimental_actions: ['update', 'publish', 'create'],
  preview: {
    prepare() {
      return {title: 'Blog Page'}
    },
  },
  groups: [
    {name: 'all', title: 'All', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    {
      name: 'blogEnabled',
      title: 'Blog Enabled',
      type: 'boolean',
      description: 'Turn off to hide the blog from the navigation and footer site-wide.',
      initialValue: true,
      group: 'all',
    },
    {
      name: 'pageTitle',
      title: 'Page Title',
      type: 'string',
      description: 'Used in the browser tab and as the SEO title fallback. E.g. "Blog | Denver Dog Photographer".',
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

    // ── Hero ────────────────────────────────────────────────────
    {
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      options: {hotspot: true, crop: true},
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

    // ── Layout ───────────────────────────────────────────────────
    {
      name: 'layout',
      title: 'Post Layout',
      type: 'string',
      description: 'How posts are displayed below the hero.',
      options: {
        list: [
          {title: 'List — editorial rows with image and excerpt', value: 'list'},
          {title: 'Cards — 3-column card grid', value: 'cards'},
        ],
        layout: 'radio',
      },
      initialValue: 'list',
      group: 'all',
    },
    {
      name: 'postsPerPage',
      title: 'Posts to Show',
      type: 'number',
      description: 'How many posts to display on the page. Defaults to 12.',
      initialValue: 12,
      validation: (Rule) => Rule.min(1).max(100).integer(),
      group: 'all',
    },

    // ── Blog post defaults (applied to every individual blog post) ─────
    {
      name: 'postDefaultsNote',
      title: '── Blog post defaults ──',
      type: 'string',
      readOnly: true,
      initialValue:
        'Settings below apply to every individual blog post. Configure once; shows on all posts.',
      description:
        'Settings below apply to every individual blog post. Configure once; shows on all posts.',
      group: 'all',
    },
    {
      name: 'showPostCta',
      title: 'Show CTA at bottom of posts',
      type: 'boolean',
      description:
        'If enabled, every blog post renders the CTA configured below at the bottom (above pagination).',
      initialValue: false,
      group: 'all',
    },
    {
      name: 'postCta',
      title: 'Post CTA',
      type: 'fullBleedImageSection',
      description:
        'The same section type used on the Experience page "Next Steps" block — configure a heading, body copy, button, and background image.',
      hidden: ({parent}) => parent?.showPostCta === false,
      group: 'all',
    },
    {
      name: 'showPagination',
      title: 'Show prev/next post pagination',
      type: 'boolean',
      description:
        'If enabled, every blog post shows a short previous/next link pair at the very bottom, ordered by publish date.',
      initialValue: false,
      group: 'all',
    },
  ],
}
