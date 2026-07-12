import {map} from 'rxjs'

// Curated Studio structure, shared by the hosted Studio
// (studio/sanity.config.js) and the embedded Studio (root sanity.config.ts) so
// both show the same organized tree instead of the raw default type list.

// Singleton helper — links directly to a specific document by ID.
const singleton = (S, id, title, schemaType) =>
  S.listItem()
    .title(title)
    .id(id)
    .child(S.document().documentId(id).schemaType(schemaType).title(title))

export const deskStructure = (S, context) =>
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
    ])
