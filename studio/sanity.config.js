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
            // ── Portfolio ─────────────────────────────────────────────────
            singleton(S, 'portfolio', '📷 Portfolio', 'portfolio'),

            S.divider(),

            // ── Site Settings ─────────────────────────────────────────────
            S.listItem()
              .title('⚙️ Site Settings')
              .id('siteSettingsGroup')
              .child(
                S.list()
                  .title('Site Settings')
                  .items([
                    singleton(S, 'siteSettings', 'Site & Theme', 'siteSettings'),
                    singleton(S, 'homepageSettings', 'Homepage Layout', 'homepageSettings'),
                    singleton(S, 'footerSettings', 'Footer', 'footerSettings'),
                    singleton(S, 'socialSettings', 'Social', 'socialSettings'),
                    singleton(S, 'codeSettings', 'Code', 'codeSettings'),
                    S.documentTypeListItem('pageSection').title('Section Colours'),
                  ]),
              ),

            S.divider(),

            // ── Homepage ─────────────────────────────────────────────────
            S.listItem()
              .title('🏠 Homepage')
              .id('homepageGroup')
              .child(
                S.list()
                  .title('Homepage')
                  .items([
                    singleton(S, 'heroSlider', 'Homepage Top Slider', 'heroSlider'),
                    singleton(S, 'heroCaption', 'Hero Caption (H1 + Tagline)', 'heroCaption'),
                    singleton(S, 'welcomeSection', 'Welcome Section', 'welcomeSection'),
                    S.documentTypeListItem('testimonial').title('Testimonials Section'),
                    singleton(S, 'featuredSection', 'Featured Section', 'featuredSection'),
                    singleton(S, 'processSection', 'Process Section', 'processSection'),
                    singleton(S, 'soloHeroImage', 'Solo Hero Image', 'soloHeroImage'),
                    singleton(S, 'whyChooseSection', 'Why Choose Section', 'whyChooseSection'),
                    singleton(S, 'homepageFaqs', 'FAQs Section', 'homepageFaqs'),
                  ]),
              ),

            // ── About ────────────────────────────────────────────────────
            S.listItem()
              .title('👤 About')
              .id('aboutGroup')
              .child(
                S.list()
                  .title('About')
                  .items([
                    singleton(S, 'aboutIntro', 'Intro Section', 'aboutIntro'),
                    singleton(S, 'aboutWhatToExpect', 'What to Expect Section', 'aboutWhatToExpect'),
                    singleton(S, 'aboutPersonal', 'Deeper Dive Section', 'aboutPersonal'),
                  ]),
              ),

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
