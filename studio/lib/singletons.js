// Singleton document types — the docs that exist exactly once per dataset
// (seeded as stubs on onboarding). Shared by BOTH Studios (embedded root
// sanity.config.ts + hosted studio/sanity.config.js) so they agree on which
// types are single-instance.
export const SINGLETON_TYPES = [
  // Settings singletons
  'siteSettings',
  'navSettings',
  'footerSettings',
  'socialSettings',
  'seoSettings',
  'codeSettings',
  // Page singletons
  'homepagePage',
  'notFoundPage',
  'blogPage',
  'portfolio',
  'termsAndConditionsPage',
  'privacyPolicyPage',
]

// Types that must never be creatable from the global "+" (New document) menu:
// the singletons above (only one allowed — you edit the existing one via the
// structure) plus plugin-managed internal docs. Collections stay creatable
// (page, testimonial, blogPost, blogCategory, portfolioCategory, and
// htmlEmbedSection — reusable embeds are intentionally multi-instance).
const HIDDEN_FROM_CREATE = new Set([
  ...SINGLETON_TYPES,
  'assist.instruction.context', // AI Assist internal — managed by the plugin
])

// Drop-in for `document.newDocumentOptions`: removes the hidden types from the
// "+" create menu. Default template ids equal the schema type name.
export const filterNewDocumentOptions = (prev) =>
  prev.filter((item) => !HIDDEN_FROM_CREATE.has(item.templateId))
