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
  // "All Fields" is a built-in Sanity tab shown whenever groups are
  // defined — adding a custom "all" group here would duplicate it.
  groups: [
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    {
      name: 'blogEnabled',
      title: 'Blog Enabled',
      type: 'boolean',
      description: 'Turn off to hide the blog from the navigation and footer site-wide.',
      initialValue: true,
    },
    {
      name: 'pageTitle',
      title: 'Page Title',
      type: 'string',
      description: 'Used in the browser tab and as the SEO title fallback. E.g. "Blog | Denver Dog Photographer".',
      group: 'seo',
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The URL for this page (e.g. /about). ⚠️ Avoid changing this once the page is live — it will break existing links and hurt your search rankings. If you must change it, set up a 301 redirect from the old URL to the new one in your hosting settings.',
      options: {source: 'pageTitle'},
      group: 'seo',
    },
    {
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    },

    // ── Hero ────────────────────────────────────────────────────
    {
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      options: {hotspot: true, crop: true},
    },
    {
      name: 'heroHeading',
      title: 'Hero Heading',
      type: 'string',
    },
    {
      name: 'heroSubtext',
      title: 'Hero Subtext',
      type: 'text',
      rows: 2,
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
    },
    {
      name: 'postsPerPage',
      title: 'Posts to Show',
      type: 'number',
      description: 'How many posts to display on the page. Defaults to 12.',
      initialValue: 12,
      validation: (Rule) => Rule.min(1).max(100).integer(),
    },

    // ── Blog post defaults (applied to every individual blog post) ─────
    {
      name: 'postCtaText',
      title: 'Blog Post CTA Line',
      type: 'array',
      description:
        'A single line appended as the last paragraph of every blog post — no extra spacing, reads as the final sentence. Supports bold, italic, and links. Leave blank to disable.',
      validation: (Rule) => Rule.max(1),
      of: [
        {
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
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
    {
      name: 'showPagination',
      title: 'Show prev/next post pagination',
      type: 'boolean',
      description:
        'If enabled, every blog post shows a short previous/next link pair at the very bottom, ordered by publish date.',
      initialValue: false,
    },
  ],
}
