import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'
import {map} from 'rxjs'
import {assist} from '@sanity/assist'
import {schemaTypes} from './schemaTypes'
import PresentationNavigator from './components/PresentationNavigator'
// Shared with the embedded Studio (root sanity.config.ts) — single source for
// the Presentation URL⇄document mapping.
import {mainDocuments, locations} from './presentation/resolve'

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
      // URL⇄document mapping (mainDocuments + locations) is single-sourced in
      // ./presentation/resolve and shared with the embedded Studio. Update
      // routes/doctypes there.
      resolve: {mainDocuments, locations},
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
