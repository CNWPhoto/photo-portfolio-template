import {imageSizeWarning} from './_shared/imageValidation'
import HexColorInput from '../components/HexColorInput'
import PaletteSelectInput from '../components/PaletteSelectInput'
// Curated Google Fonts catalog — shared with src/lib (single source of
// truth; the site's Layout builds the css2 URL from the same entries).
import {fontCatalog} from '../../src/lib/fontCatalog.js'

const themeDefaultOption = {title: '— Theme default —', value: 'default'}
const headingFontList = [
  themeDefaultOption,
  ...fontCatalog.filter((f) => f.use.includes('heading')).map((f) => ({title: f.label, value: f.slug})),
]
const bodyFontList = [
  themeDefaultOption,
  ...fontCatalog.filter((f) => f.use.includes('body')).map((f) => ({title: f.label, value: f.slug})),
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
  fieldsets: [
    {
      name: 'advancedFonts',
      title: 'Advanced font controls',
      description: 'Fine-tuning and brand font uploads. Most sites never need these.',
      options: {collapsible: true, collapsed: true},
    },
  ],
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
      name: 'logoLarge',
      title: 'Large logo',
      type: 'boolean',
      description:
        'Display the logo image at roughly double height in the header and footer. Only applies when Logo Type is Image.',
      initialValue: false,
      hidden: ({document}) => document?.logoType !== 'image',
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
      components: {input: PaletteSelectInput},
      initialValue: 'classic-cream',
      description: 'Site-wide color theme. Pick from the palettes defined above — new palettes appear here automatically.',
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
      name: 'headingFont',
      title: 'Heading Font',
      type: 'string',
      description:
        'Overrides just the HEADING font of the Font Theme — pick any font from the list and the site loads it automatically. Have a purchased/brand font file instead? Use Custom Fonts under Advanced.',
      options: {list: headingFontList},
      initialValue: 'default',
    },
    {
      name: 'bodyFont',
      title: 'Body Font',
      type: 'string',
      description:
        'Overrides just the BODY (paragraph) font of the Font Theme. Most sites read best keeping this on Theme default.',
      options: {list: bodyFontList},
      initialValue: 'default',
    },
    {
      name: 'headingWeight',
      title: 'Heading Weight',
      type: 'string',
      fieldset: 'advancedFonts',
      description:
        'Optional site-wide override for heading thickness. Use Theme Default unless headings look too heavy or too light. Fonts that don’t ship a chosen weight render the nearest available. (Uploaded heading font files always render exactly as designed — this setting doesn’t alter them.)',
      options: {
        list: [
          {title: 'Theme Default', value: 'default'},
          {title: 'Light', value: '300'},
          {title: 'Regular', value: '400'},
          {title: 'Medium', value: '500'},
          {title: 'Semibold', value: '600'},
          {title: 'Bold', value: '700'},
        ],
      },
      initialValue: 'default',
    },
    {
      name: 'bodyWeight',
      title: 'Body Weight',
      type: 'string',
      fieldset: 'advancedFonts',
      description:
        'Optional site-wide override for paragraph and body copy thickness. Most sites should keep Theme Default.',
      options: {
        list: [
          {title: 'Theme Default', value: 'default'},
          {title: 'Light', value: '300'},
          {title: 'Regular', value: '400'},
          {title: 'Medium', value: '500'},
        ],
      },
      initialValue: 'default',
    },
    {
      name: 'subheadingCase',
      title: 'Subheading Case',
      type: 'string',
      description:
        'Controls how hero subheadings (and any other section subheadings) are styled site-wide. Uppercase is the editorial default; Sentence case keeps the text as you type it for a more conversational feel.',
      options: {
        list: [
          {title: 'Uppercase (default)', value: 'uppercase'},
          {title: 'Sentence case', value: 'none'},
        ],
        layout: 'radio',
      },
      initialValue: 'uppercase',
    },
    {
      name: 'textColorPreset',
      title: 'Text Color',
      type: 'string',
      description:
        'Override the main text color on light-background themes. Leave on Theme Default unless body text reads too soft (pick Charcoal or True Black for more contrast) or too harsh (pick a Gray to soften it). Has no effect on dark themes.',
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
      name: 'aiAssistEnabled',
      title: 'Enable AI Assist',
      type: 'boolean',
      initialValue: true,
      description:
        "AI Assist (the sparkle ✨ icons next to fields) is on by default during your free Sanity Growth trial month. After the trial it requires the Growth plan ($15/seat/month). To turn it off, toggle this OFF and let Connor know — he'll redeploy your Studio without the AI plugin. To turn it back on later, same process.",
    },
    {
      name: 'headingFontFile',
      title: 'Heading font file',
      type: 'file',
      fieldset: 'advancedFonts',
      description:
        'Have a purchased/brand font? Just upload the file — nothing else to set. Applies to headings site-wide (overrides the Font Theme and Heading Font choices). .woff2 is smallest/fastest; .woff, .ttf and .otf also work. Only upload fonts you have a web license for.',
      options: {accept: '.woff2,.woff,.ttf,.otf'},
    },
    {
      name: 'bodyFontFile',
      title: 'Body font file',
      type: 'file',
      fieldset: 'advancedFonts',
      description:
        'Optional body-text upload — same idea: just add the file. Most sites read best with a standard body font from the Body Font list.',
      options: {accept: '.woff2,.woff,.ttf,.otf'},
    },
    {
      name: 'accentColorOverride',
      title: 'Custom Accent Color',
      type: 'string',
      description: 'Optional hex color to override the theme accent color e.g. #8b2635',
      components: {input: HexColorInput},
      validation: (Rule) =>
        Rule.regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
          name: 'hex color',
          invert: false,
        }).warning('Must be a valid hex color, e.g. #8b2635'),
    },
    {
      name: 'demo',
      title: 'Demo Showcase',
      type: 'object',
      description:
        'Internal — only used on template demo sites to show a banner linking back to the demo hub. Leave disabled on real client sites.',
      options: {collapsible: true, collapsed: true},
      fields: [
        {
          name: 'isDemo',
          title: 'This is a demo site',
          type: 'boolean',
          description:
            'When ON, a thin banner renders above the nav with a niche label and a link back to the demo hub. Leave OFF on any real client site.',
          initialValue: false,
        },
        {
          name: 'nicheLabel',
          title: 'Niche label',
          type: 'string',
          description: 'Short label shown in the banner, e.g. "Pet Photographer demo".',
          hidden: ({parent}) => !parent?.isDemo,
        },
        {
          name: 'hubUrl',
          title: 'Demo hub URL',
          type: 'url',
          description: 'Full URL of the demo showcase hub page that lists every niche.',
          hidden: ({parent}) => !parent?.isDemo,
        },
        {
          name: 'hubLinkLabel',
          title: 'Hub link text',
          type: 'string',
          description: 'Text for the link back to the hub. Defaults to "View all demos".',
          hidden: ({parent}) => !parent?.isDemo,
        },
      ],
    },
  ],
}
