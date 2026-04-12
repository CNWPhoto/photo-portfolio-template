import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'
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
      previewUrl: {
        origin: process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:4321',
        preview: '/',
        previewMode: {
          enable: '/api/preview',
          disable: '/api/disable-preview',
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
