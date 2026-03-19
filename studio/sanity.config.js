import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
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

  projectId: 'hx5xgigp',
  dataset: 'production',

  plugins: [
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
                    singleton(S, 'homepageSettings', 'Homepage Layout', 'homepageSettings'),
                    singleton(S, 'footerSettings', 'Footer', 'footerSettings'),
                    singleton(S, 'socialSettings', 'Social', 'socialSettings'),
                    singleton(S, 'codeSettings', 'Code', 'codeSettings'),
                    S.documentTypeListItem('pageSection').title('Section Colours'),
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
                    singleton(S, 'aboutPage', 'About Page', 'aboutPage'),
                    singleton(S, 'portfolio', 'Portfolio', 'portfolio'),
                  ]),
              ),

            S.divider(),

            // ── Testimonials ──────────────────────────────────────────────
            S.documentTypeListItem('testimonial').title('⭐ Testimonials'),

            // ── Blog ─────────────────────────────────────────────────────
            S.listItem()
              .title('📝 Blog')
              .id('blogGroup')
              .child(
                S.list()
                  .title('Blog')
                  .items([S.documentTypeListItem('blogPost').title('Blog Posts')]),
              ),

            // ── FAQs ─────────────────────────────────────────────────────
            S.listItem()
              .title('❓ FAQs')
              .id('faqsGroup')
              .child(
                S.list()
                  .title('FAQs')
                  .items([S.documentTypeListItem('faq').title('FAQs')]),
              ),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
