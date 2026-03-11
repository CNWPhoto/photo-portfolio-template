import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'photo-portfolio-template',

  projectId: 'hx5xgigp',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([

            // ── 🎨 Website Theme ──────────────────────────────────────
            S.listItem()
              .title('🎨 Website Theme')
              .child(
                S.document()
                  .schemaType('siteSettings')
                  .documentId('siteSettings')
                  .title('Website Theme')
              ),

            S.divider(),

            // ── 🏠 Homepage ──────────────────────────────────────────
            S.listItem()
              .title('🏠 Homepage')
              .child(
                S.list()
                  .title('Homepage')
                  .items([
                    S.listItem()
                      .title('Site Settings')
                      .schemaType('photographer')
                      .child(
                        S.document()
                          .schemaType('photographer')
                          .documentId('photographer')
                          .title('Site Settings')
                      ),
                    S.listItem()
                      .title('Hero Images')
                      .schemaType('photographer')
                      .child(
                        S.document()
                          .schemaType('photographer')
                          .documentId('photographer')
                          .title('Hero Images')
                      ),
                    S.listItem()
                      .title('Section Layouts')
                      .schemaType('homepageSettings')
                      .child(
                        S.document()
                          .schemaType('homepageSettings')
                          .documentId('homepageSettings')
                          .title('Section Layouts')
                      ),
                    S.documentTypeListItem('testimonial').title('Testimonials'),
                    S.documentTypeListItem('galleryImage').title('Portfolio Preview Images'),
                  ])
              ),

            S.divider(),

            // ── 📄 About Page ─────────────────────────────────────────
            S.listItem()
              .title('📄 About Page')
              .child(
                S.list()
                  .title('About Page')
                  .items([
                    S.listItem()
                      .title('About Content')
                      .schemaType('photographer')
                      .child(
                        S.document()
                          .schemaType('photographer')
                          .documentId('photographer')
                          .title('About Content')
                      ),
                  ])
              ),

            S.divider(),

            // ── 💼 Experience Page ────────────────────────────────────
            S.listItem()
              .title('💼 Experience Page')
              .child(
                S.list()
                  .title('Experience Page')
                  .items([
                    S.documentTypeListItem('faq').title('FAQs'),
                  ])
              ),

            S.divider(),

            // ── 📝 Blog ───────────────────────────────────────────────
            S.listItem()
              .title('📝 Blog')
              .child(
                S.list()
                  .title('Blog')
                  .items([
                    S.documentTypeListItem('blogPost').title('Blog Posts'),
                  ])
              ),

            S.divider(),

            // ── 🖼️ Portfolio ──────────────────────────────────────────
            S.listItem()
              .title('🖼️ Portfolio')
              .child(
                S.list()
                  .title('Portfolio')
                  .items([
                    S.documentTypeListItem('galleryImage').title('Gallery Images'),
                  ])
              ),

          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
