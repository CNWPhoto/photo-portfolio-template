import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool, defineDocuments, defineLocations} from 'sanity/presentation'
import {map} from 'rxjs'
import {assist} from '@sanity/assist'
import {schemaTypes} from './schemaTypes'
import PresentationNavigator from './components/PresentationNavigator'

// AI Assist toggle — controlled by SANITY_STUDIO_AI_ASSIST in studio/.env
// per client. We tried fetching siteSettings.aiAssistEnabled at config
// load time so clients could self-serve, but Sanity's deploy pipeline
// runs a manifest-extraction worker that doesn't support top-level
// await (config worked fine for `dev` and `build`, failed for
// `deploy`). The build-time env var is the working compromise.
//
// Operator workflow when a client toggles aiAssistEnabled in Studio:
//   1. Update their studio/.env.<slug>-backup to set SANITY_STUDIO_AI_ASSIST=true
//      (or remove the line to disable).
//   2. Run `npm run deploy` against that client's Studio.
// The siteSettings.aiAssistEnabled boolean still lives in the schema
// as the signal channel — clients flip it to communicate intent.
const aiAssistEnabled = process.env.SANITY_STUDIO_AI_ASSIST === 'true'

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
// - *.workers.dev wildcard covers Cloudflare Workers deploys (Astro 6 +
//   adapter v13 — the deploy target the fleet is migrating to)
// - PREVIEW_ORIGIN covers whatever we're currently pointing the hosted
//   Studio at (client domain after DNS, the platform URL before).
// Dedup at the bottom so a localhost PREVIEW_ORIGIN doesn't double-list.
const ALLOW_ORIGINS = [
  'http://localhost:4321',
  'https://*.pages.dev',
  'https://*.workers.dev',
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
      // Page-selector panel (toggled by the list icon next to the URL bar).
      // Editors click pages/posts to move the preview instead of typing
      // paths — new pages appear in the list automatically.
      components: {
        unstable_navigator: {
          component: PresentationNavigator,
          minWidth: 180,
          maxWidth: 320,
        },
      },
      previewUrl: {
        origin: PREVIEW_ORIGIN,
        preview: '/',
        previewMode: {
          // Slashed paths: the site runs trailingSlash:'always', so the
          // un-slashed forms 308-redirect. Pointing Presentation straight
          // at the slashed paths removes the redirect hop entirely.
          enable: '/api/preview/',
          disable: '/api/disable-preview/',
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
            route: '/404',
            type: 'notFoundPage',
          },
          // Blog posts / categories live under the content-driven blog base
          // (blogPage.slug, e.g. '/lenaweepetcollective'). These 2- and
          // 3-segment routes don't collide with the single-segment route below.
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
          // Single-segment URLs are EITHER the blog index (blogPage — whose slug
          // is the blog base, defaulting to 'blog' when unset) OR any slugged
          // page (about, experience, contact, …). This MUST be a single route
          // whose filter matches either type: Presentation resolves the first
          // route whose PATTERN matches, so two separate '/:slug' routes would
          // shadow each other — a dedicated '/:base' blog route ahead of the
          // page route silently broke "document on this page" for EVERY page.
          {
            route: '/:slug',
            filter: `(_type == "blogPage" && (slug.current == $slug || (!defined(slug.current) && $slug == "blog"))) || (_type == "page" && slug.current == $slug)`,
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
            select: {slug: 'slug.current'},
            resolve: (doc) => ({
              // Use the blog's real slug (defaults to 'blog') so "Open preview"
              // jumps straight to e.g. /lenaweepetcollective — no redirect hop.
              locations: [{title: 'Blog', href: `/${doc?.slug || 'blog'}`}],
            }),
          }),
          blogPost: defineLocations({
            select: {title: 'title', slug: 'slug.current'},
            // Posts link under the literal /blog base; when the client renamed
            // the blog, middleware.ts 301-rewrites /blog/* to the custom base,
            // so the preview lands on the right URL (the post's own doc doesn't
            // carry the base slug, which lives on the blogPage singleton).
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
            // behind a second "Pages" click. Uses a LIVE query
            // (documentStore.listenQuery) rather than a one-shot client.fetch:
            // the fetch version was a static snapshot, so a page deleted from
            // this list stayed visible until a manual Studio refresh. The
            // listener re-emits the list on every create / delete / rename.
            S.listItem()
              .title('📄 Pages')
              .id('pagesGroup')
              .child(() =>
                context.documentStore
                  .listenQuery(
                    `*[_type == "page" && defined(slug.current)]{_id, title, "slug": slug.current}`,
                    {},
                    {perspective: 'raw'},
                  )
                  .pipe(
                    map((pages) => {
                      // Raw perspective returns both `drafts.<id>` and `<id>`
                      // when a page has an unpublished draft. Collapse to one
                      // entry per logical document (prefer published; fall back
                      // to draft if the page was never published).
                      const byBaseId = new Map()
                      for (const p of pages || []) {
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
                  ),
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
    // AI Assist — gated on siteSettings.aiAssistEnabled. When off (default
    // for new clients), the plugin doesn't load and no sparkle icons render.
    ...(aiAssistEnabled ? [assist()] : []),
  ],

  schema: {
    types: schemaTypes,
  },
})
