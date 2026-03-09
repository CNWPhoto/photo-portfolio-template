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
  name: 'pageSection',
  title: 'Page Section',
  type: 'document',
  orderings: [
    {
      title: 'Page Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  fields: [
    {
      name: 'sectionType',
      title: 'Section',
      type: 'string',
      options: {
        list: [
          { title: 'Hero', value: 'hero' },
          { title: 'Intro', value: 'intro' },
          { title: 'Testimonials', value: 'testimonials' },
          { title: 'Portfolio', value: 'portfolio' },
          { title: 'How It Works', value: 'howItWorks' },
          { title: 'Why Choose', value: 'whyChoose' },
          { title: 'FAQ', value: 'faq' },
          { title: 'Newsletter', value: 'newsletter' },
        ],
      },
    },
    {
      name: 'variant',
      title: 'Layout Variant',
      type: 'string',
      description:
        'testimonials: slider | grid  ·  portfolio: grid | masonry  ·  intro: split | centered  ·  howItWorks: columns | stacked',
      options: {
        list: [
          { title: 'Slider', value: 'slider' },
          { title: 'Grid', value: 'grid' },
          { title: 'Masonry', value: 'masonry' },
          { title: 'Split', value: 'split' },
          { title: 'Centered', value: 'centered' },
          { title: 'Columns', value: 'columns' },
          { title: 'Stacked', value: 'stacked' },
        ],
      },
    },
    {
      name: 'colorTheme',
      title: 'Colour Theme',
      type: 'string',
      options: { list: colorThemeList },
      initialValue: 'classic-cream',
      description: 'Overrides the site-wide colour theme for this section',
    },
    {
      name: 'fontTheme',
      title: 'Font Theme',
      type: 'string',
      options: { list: fontThemeList },
      description: 'Overrides the site-wide font theme for this section (optional)',
    },
    {
      name: 'order',
      title: 'Order',
      type: 'number',
    },
  ],
  preview: {
    select: {
      title: 'sectionType',
      subtitle: 'colorTheme',
    },
  },
}
