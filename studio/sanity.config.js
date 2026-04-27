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

const PREVIEW_ORIGIN = process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:4321'

// Every origin that might iframe the deployed Studio. Baked at build time.
// - localhost for local Astro dev
// - *.pages.dev wildcard covers every Cloudflare Pages preview subdomain
// - PREVIEW_ORIGIN covers whatever we're currently pointing the hosted
//   Studio at (client domain after DNS, the .pages.dev URL before).
// Dedup at the bottom so a localhost PREVIEW_ORIGIN doesn't double-list.
const ALLOW_ORIGINS = [
  'http://localhost:4321',
  'https://*.pages.dev',
  PREVIEW_ORIGIN,
].filter((v, i, arr) => v && arr.indexOf(v) === i)

export default defineConfig({
  name: 'default',
  title: process.env.SANITY_STUDIO_TITLE || 'photo-portfolio-template',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'hx5xgigp',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [
    presentationTool({
      allowOrigins: ALLOW_ORIGINS,
      previewUrl: {
        origin: PREVIEW_ORIGIN,
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
      structure: (S, context) =>
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
            // Flat list: every `page` doc (About, Experience, Contact, and
            // any custom pages) is inlined under the singletons, not hidden
            // behind a second "Pages" click. The async fetch returns a
            // fresh list on each open of the group.
            S.listItem()
              .title('📄 Pages')
              .id('pagesGroup')
              .child(async () => {
                const client = context.getClient({apiVersion: '2024-01-01'})
                const pages = await client.fetch(
                  `*[_type == "page" && defined(slug.current)]{_id, title, "slug": slug.current}`,
                )
                // Raw perspective returns both `drafts.<id>` and `<id>` when
                // a page has an unpublished draft. Collapse to one entry per
                // logical document (prefer published; fall back to draft if
                // the page was never published).
                const byBaseId = new Map()
                for (const p of pages) {
                  const baseId = p._id.replace(/^drafts\./, '')
                  const existing = byBaseId.get(baseId)
                  const thisIsDraft = p._id.startsWith('drafts.')
                  if (!existing || (existing._id.startsWith('drafts.') && !thisIsDraft)) {
                    byBaseId.set(baseId, {...p, _id: baseId})
                  }
                }
                const unique = Array.from(byBaseId.values()).sort((a, b) =>
                  (a.title || '').localeCompare(b.title || ''),
                )
                return S.list()
                  .title('Pages')
                  .items([
                    singleton(S, 'homepagePage', 'Homepage', 'homepagePage'),
                    singleton(S, 'portfolio', 'Portfolio', 'portfolio'),
                    singleton(S, 'blogPage', 'Blog', 'blogPage'),
                    singleton(S, 'notFoundPage', '404 Page', 'notFoundPage'),
                    S.divider(),
                    singleton(S, 'termsAndConditionsPage', 'Terms & Conditions', 'termsAndConditionsPage'),
                    singleton(S, 'privacyPolicyPage', 'Privacy Policy', 'privacyPolicyPage'),
                    S.divider(),
                    ...unique.map((p) =>
                      S.listItem()
                        .id(p._id)
                        .title(p.title || 'Untitled')
                        .child(
                          S.document()
                            .documentId(p._id)
                            .schemaType('page')
                            .title(p.title || 'Page'),
                        ),
                    ),
                  ])
              }),

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
