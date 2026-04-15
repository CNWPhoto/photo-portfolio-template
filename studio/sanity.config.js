import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool, defineDocuments, defineLocations} from 'sanity/presentation'
import {schemaTypes} from './schemaTypes'

// Singleton helper — links directly to a specific document by ID
const singleton = (S, id, title, schemaType) =>
  S.listItem()
    .title(title)
    .id(id)
    .child(S.document().documentId(id).schemaType(schemaType).title(title))

export default defineConfig({
  name: 'default',
  title: 'photo-portfolio-template',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'hx5xgigp',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [
    presentationTool({
      allowOrigins: [
        'http://localhost:4321',
        'https://cnw-photo-demo.pages.dev',
      ],
      previewUrl: {
        origin: process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:4321',
        preview: '/',
        previewMode: {
          enable: '/api/preview',
          disable: '/api/disable-preview',
        },
      },
      // Maps the URL in the Presentation iframe to the Sanity documents
      // responsible for rendering it, so the "Documents on this page" panel
      // shows editable links without needing stega markers in the DOM.
      // Update these as new routes/doctypes are added.
      resolve: {
        mainDocuments: defineDocuments([
          {
            route: '/',
            type: 'homepagePage',
          },
          {
            route: '/portfolio',
            type: 'portfolio',
          },
          {
            route: '/blog',
            type: 'blogPage',
          },
          {
            route: '/404',
            type: 'notFoundPage',
          },
          {
            route: '/blog/:slug',
            filter: `_type == "blogPost" && slug.current == $slug`,
            params: ({params}) => ({slug: params.slug}),
          },
          // Generic page resolver (about, experience, contact, any other
          // slugged page doc). This is ordered LAST so the specific singleton
          // routes above win first.
          {
            route: '/:slug',
            filter: `_type == "page" && slug.current == $slug`,
            params: ({params}) => ({slug: params.slug}),
          },
        ]),
        // Reverse mapping: from a Sanity document, compute the URL where
        // it can be previewed. Clicking "Open preview" on a doc in the
        // Studio jumps the iframe to the right route.
        locations: {
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
            locations: [{title: 'Blog', href: '/blog'}],
          }),
          blogPost: defineLocations({
            select: {title: 'title', slug: 'slug.current'},
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
        },
      },
    }),
    structureTool({
      structure: (S) =>
        S.list()
          .title('Studio')
          .items([
            // ── Site Settings ─────────────────────────────────────────────
            S.listItem()
              .title('⚙️ Site Settings')
              .id('siteSettingsGroup')
              .child(
                S.list()
                  .title('Site Settings')
                  .items([
                    singleton(S, 'siteSettings', 'Site & Theme', 'siteSettings'),
                    singleton(S, 'navSettings', 'Navigation', 'navSettings'),
                    singleton(S, 'footerSettings', 'Footer', 'footerSettings'),
                    singleton(S, 'socialSettings', 'Social', 'socialSettings'),
                    singleton(S, 'codeSettings', 'Code', 'codeSettings'),
                    singleton(S, 'seoSettings', 'SEO', 'seoSettings'),
                  ]),
              ),

            S.divider(),

            // ── Pages ────────────────────────────────────────────────────
            S.listItem()
              .title('📄 Pages')
              .id('pagesGroup')
              .child(
                S.list()
                  .title('Pages')
                  .items([
                    singleton(S, 'homepagePage', 'Homepage', 'homepagePage'),
                    singleton(S, 'portfolio', 'Portfolio', 'portfolio'),
                    singleton(S, 'blogPage', 'Blog', 'blogPage'),
                    singleton(S, 'notFoundPage', '404 Page', 'notFoundPage'),
                    S.divider(),
                    S.documentTypeListItem('page').title('Pages'),
                  ]),
              ),

            S.divider(),

            // ── Testimonials ──────────────────────────────────────────────
            S.documentTypeListItem('testimonial').title('⭐ Testimonials'),

            // ── Blog ─────────────────────────────────────────────────────
            S.documentTypeListItem('blogPost').title('📝 Blog Posts'),

            // ── Categories ────────────────────────────────────────────────
            S.listItem()
              .title('🏷 Categories')
              .id('categoriesGroup')
              .child(
                S.list()
                  .title('Categories')
                  .items([
                    S.documentTypeListItem('blogCategory').title('Blog Categories'),
                    S.documentTypeListItem('portfolioCategory').title('Portfolio Categories'),
                  ]),
              ),

            // ── HTML Embeds ───────────────────────────────────────────────
            S.documentTypeListItem('htmlEmbedSection').title('🧩 HTML Embeds'),

          ]),
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
