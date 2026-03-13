const colorThemeList = [
  { title: 'Classic Cream', value: 'classic-cream' },
  { title: 'Warm Studio', value: 'warm-studio' },
  { title: 'Dark Editorial', value: 'dark-editorial' },
  { title: 'Cool Minimal', value: 'cool-minimal' },
  { title: 'Forest Sage', value: 'forest-sage' },
]

const fontThemeList = [
  { title: 'Classic Editorial', value: 'classic-editorial' },
  { title: 'Romantic Script', value: 'romantic-script' },
  { title: 'Modern Luxury', value: 'modern-luxury' },
  { title: 'Soft Contemporary', value: 'soft-contemporary' },
  { title: 'Bold Editorial', value: 'bold-editorial' },
  { title: 'Airy Minimal', value: 'airy-minimal' },
]

export default {
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  description: '⏱ After saving changes, wait 1-2 minutes for the site to rebuild, then do a hard refresh of your site in the browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows) to see your updates.',
  __experimental_actions: ['update', 'publish'], // singleton — no create/delete
  preview: {
    prepare() {
      return {title: 'Website Theme Settings'}
    },
  },
  fields: [
    {
      name: 'rebuildNote',
      title: '⏱ After saving changes',
      type: 'string',
      readOnly: true,
      initialValue:
        'Wait 1-2 minutes for your site to rebuild, then do a hard refresh of your site in the browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows) to see your updates.',
      description:
        'Wait 1-2 minutes for your site to rebuild, then do a hard refresh of your site in the browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows) to see your updates.',
    },
    {
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
      description: 'Studio or photographer name used in the nav logo, footer, and page title',
    },
    {
      name: 'photographerName',
      title: 'Photographer Name',
      type: 'string',
      description: 'Your display name shown in the About page and site copy.',
    },
    {
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'City or region shown in site copy (e.g. "Denver, CO" or "Pacific Northwest").',
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'A short phrase shown in the hero (e.g. "Capturing the bond between dogs and their people").',
    },
    {
      name: 'specialty',
      title: 'Specialty',
      type: 'string',
      description: 'What you photograph (e.g. "pet photography", "newborn & family", "wedding"). Used in page copy and SEO.',
    },
    {
      name: 'logoType',
      title: 'Logo Type',
      type: 'string',
      options: {list: ['text', 'image']},
      initialValue: 'text',
    },
    {
      name: 'logoImage',
      title: 'Logo Image',
      type: 'image',
      description:
        'Upload your logo. Recommended size: 400 × 120px or similar horizontal format, 2× resolution for retina. PNG with transparent background preferred.',
      hidden: ({document}) => document?.logoType !== 'image',
    },
    {
      name: 'colorTheme',
      title: 'Default Colour Theme',
      type: 'string',
      options: { list: colorThemeList },
      initialValue: 'classic-cream',
      description: 'Site-wide colour theme; individual sections can override this',
    },
    {
      name: 'fontTheme',
      title: 'Font Theme',
      type: 'string',
      options: { list: fontThemeList },
      initialValue: 'classic-editorial',
      description: 'Applies site-wide — sets heading and body typefaces',
    },
    {
      name: 'typographyOverrides',
      title: '⚙️ Typography Overrides',
      description: 'Optional font size adjustments for clients with unusually long or short text. Leave blank to use template defaults. Values must be valid CSS units, e.g. "0.875rem" or "1.1rem".',
      type: 'object',
      options: {collapsible: true, collapsed: true},
      fields: [
        // ── Welcome / Intro section ──
        {name: 'isplitBodySize', title: 'Welcome — Body Text Size', description: 'Default: 1rem', type: 'string'},
        {name: 'isplitEyebrowSize', title: 'Welcome — Eyebrow Label Size', description: 'Default: 0.65rem', type: 'string'},
        {name: 'isplitLinkSize', title: 'Welcome — CTA Link Size', description: 'Default: 0.875rem', type: 'string'},
        // ── Hero section ──
        {name: 'heroHeadingSize', title: 'Hero — Heading Size', description: 'Default: clamp(2.5rem, 5.5vw, 4.25rem)', type: 'string'},
        {name: 'heroSubSize', title: 'Hero — Subline Size', description: 'Default: 0.75rem', type: 'string'},
        // ── Testimonials section ──
        {name: 'tsliderQuoteSize', title: 'Testimonials — Quote Text Size', description: 'Default: 1.25rem', type: 'string'},
        // ── Why Choose section ──
        {name: 'whyHeadingSize', title: 'Why Choose — Heading Size', description: 'Default: clamp(2rem, 4vw, 3.25rem)', type: 'string'},
        {name: 'whyBodySize', title: 'Why Choose — Body Text Size', description: 'Default: 1.0625rem', type: 'string'},
        // ── FAQs section ──
        {name: 'faqsQuestionSize', title: 'FAQs — Question Size', description: 'Default: 1.25rem', type: 'string'},
        {name: 'faqsAnswerSize', title: 'FAQs — Answer Text Size', description: 'Default: 0.9375rem', type: 'string'},
      ],
    },
    {
      name: 'accentColorOverride',
      title: 'Custom Accent Colour',
      type: 'string',
      description: 'Optional hex color to override the theme accent color e.g. #8b2635',
      validation: (Rule) =>
        Rule.regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
          name: 'hex color',
          invert: false,
        }).warning('Must be a valid hex colour, e.g. #8b2635'),
    },
  ],
}
