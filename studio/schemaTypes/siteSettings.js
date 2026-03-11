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
