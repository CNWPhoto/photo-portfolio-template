import {imageSizeWarning} from './_shared/imageValidation'

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
      description: 'Your display name shown in the footer copyright.',
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
        'Upload your logo. Recommended size: 400 × 120px or similar horizontal format, 2× resolution for retina. PNG with transparent background preferred. Keep file size under 5MB.',
      hidden: ({document}) => document?.logoType !== 'image',
      validation: imageSizeWarning,
    },
    {
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      description:
        'Browser tab icon. Upload a square image (recommended: 512×512px PNG). Leave blank to use the default favicon.',
      options: {accept: 'image/png,image/svg+xml,image/x-icon,image/jpeg'},
    },
    {
      name: 'palettes',
      title: 'Color Palettes',
      type: 'array',
      description:
        'Color palettes available across the site. Edit the hex values to customize, or add new palettes.',
      of: [{type: 'palette'}],
    },
    {
      name: 'defaultPalette',
      title: 'Default Palette',
      type: 'string',
      options: { list: colorThemeList },
      initialValue: 'classic-cream',
      description: 'Site-wide color theme. Applies to every section on every page.',
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
      name: 'textColorPreset',
      title: 'Text Color',
      type: 'string',
      description: 'Override the main text color on light-background themes. Leave blank to use the theme default.',
      options: {
        list: [
          {title: 'Theme Default', value: ''},
          {title: 'Charcoal',      value: 'charcoal'},
          {title: 'True Black',    value: 'black'},
          {title: 'Warm Gray',     value: 'warm-gray'},
          {title: 'Cool Gray',     value: 'cool-gray'},
        ],
      },
    },
    {
      name: 'web3formsKey',
      title: 'Web3Forms Access Key',
      type: 'string',
      description:
        'Free contact-form backend. Sign up at https://web3forms.com (no account required) and paste the access key here. Used by every Contact Form section unless one overrides it. Leave blank to disable submissions.',
    },
    {
      name: 'accentColorOverride',
      title: 'Custom Accent Color',
      type: 'string',
      description: 'Optional hex color to override the theme accent color e.g. #8b2635',
      validation: (Rule) =>
        Rule.regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
          name: 'hex color',
          invert: false,
        }).warning('Must be a valid hex color, e.g. #8b2635'),
    },
  ],
}
