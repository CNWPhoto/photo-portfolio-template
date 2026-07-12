// Shared Presentation resolve map — the URL⇄document mapping used by BOTH
// Studios: the standalone hosted Studio (studio/sanity.config.js) and the
// embedded Studio served at /studio (root sanity.config.ts). Single-sourced
// here so "Documents on this page" + "Open preview" behave identically and
// cannot drift between the two. Update routes/doctypes in ONE place.

import {defineDocuments, defineLocations} from 'sanity/presentation'

// Maps the URL in the Presentation iframe to the Sanity documents responsible
// for rendering it, so the "Documents on this page" panel shows editable links
// without needing stega markers in the DOM.
export const mainDocuments = defineDocuments([
  {route: '/', type: 'homepagePage'},
  // On first load the Presentation handshake briefly points the iframe at the
  // draft-mode enable/disable API paths before redirecting to '/'. Those
  // two-segment paths otherwise fall through to the blogPost route below
  // (base='api', slug='preview'), match no post, and flash "missing main
  // document for /api/preview". Resolve them to the homepage singleton so a
  // main document is always present during the handshake.
  {route: '/api/preview', type: 'homepagePage'},
  {route: '/api/disable-preview', type: 'homepagePage'},
  {route: '/portfolio', type: 'portfolio'},
  {route: '/404', type: 'notFoundPage'},
  // Blog posts / categories live under the content-driven blog base
  // (blogPage.slug). These 2- and 3-segment routes don't collide with the
  // single-segment route below.
  {
    route: '/:base/category/:slug',
    filter: `_type == "blogCategory" && slug.current == $slug`,
    params: ({params}) => ({slug: params.slug}),
  },
  {
    route: '/:base/:slug',
    filter: `_type == "blogPost" && slug.current == $slug`,
    params: ({params}) => ({slug: params.slug}),
  },
  // Single-segment URLs are EITHER the blog index (blogPage — slug defaults to
  // 'blog' when unset) OR any slugged page. This MUST be a single route whose
  // filter matches either type: Presentation resolves the first route whose
  // PATTERN matches, so two separate '/:slug' routes would shadow each other.
  {
    route: '/:slug',
    filter: `(_type == "blogPage" && (slug.current == $slug || (!defined(slug.current) && $slug == "blog"))) || (_type == "page" && slug.current == $slug)`,
    params: ({params}) => ({slug: params.slug}),
  },
])

// Reverse mapping: from a Sanity document, compute the URL where it can be
// previewed. Clicking "Open preview" on a doc jumps the iframe to the route.
export const locations = {
  homepagePage: defineLocations({
    locations: [{title: 'Homepage', href: '/'}],
  }),
  page: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    resolve: (doc) =>
      doc?.slug
        ? {locations: [{title: doc.title || 'Page', href: `/${doc.slug}`}]}
        : {locations: []},
  }),
  portfolio: defineLocations({
    locations: [{title: 'Portfolio', href: '/portfolio'}],
  }),
  blogPage: defineLocations({
    select: {slug: 'slug.current'},
    resolve: (doc) => ({
      // Use the blog's real slug (defaults to 'blog') so "Open preview"
      // jumps straight to e.g. /lenaweepetcollective — no redirect hop.
      locations: [{title: 'Blog', href: `/${doc?.slug || 'blog'}`}],
    }),
  }),
  blogPost: defineLocations({
    select: {title: 'title', slug: 'slug.current'},
    // Posts link under the literal /blog base; when the client renamed the
    // blog, middleware.ts 301-rewrites /blog/* to the custom base.
    resolve: (doc) =>
      doc?.slug
        ? {locations: [{title: doc.title || 'Post', href: `/blog/${doc.slug}`}]}
        : {locations: []},
  }),
  notFoundPage: defineLocations({
    locations: [{title: '404 page', href: '/404'}],
  }),
  siteSettings: defineLocations({
    locations: [{title: 'Site-wide', href: '/'}],
  }),
  navSettings: defineLocations({
    locations: [{title: 'Navigation (site-wide)', href: '/'}],
  }),
  footerSettings: defineLocations({
    locations: [{title: 'Footer (site-wide)', href: '/'}],
  }),
}
