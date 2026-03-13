import {introVariants, testimonialsVariants, portfolioPreviewVariants, howItWorksVariants} from './pageLayouts'

export default {
  name: 'homepageSettings',
  title: 'Homepage Layout',
  type: 'document',
  __experimental_actions: ['update', 'publish'], // singleton — no create/delete
  preview: {
    prepare() {
      return {title: 'Homepage Layout'}
    },
  },
  fields: [
    {
      name: 'introVariant',
      title: 'Intro Section Layout',
      type: 'string',
      description: 'Choose how your bio and profile photo are displayed on the homepage.',
      options: {list: introVariants},
      initialValue: 'classic',
    },
    {
      name: 'testimonialsVariant',
      title: 'Testimonials Layout',
      type: 'string',
      description: 'Choose how client testimonials are displayed.',
      options: {list: testimonialsVariants},
      initialValue: 'slider',
    },
    {
      name: 'portfolioPreviewVariant',
      title: 'Portfolio Preview Layout',
      type: 'string',
      description: 'Choose how the portfolio preview section looks on the homepage.',
      options: {list: portfolioPreviewVariants},
      initialValue: 'classic',
    },
    {
      name: 'howItWorksVariant',
      title: 'How It Works Layout',
      type: 'string',
      description: 'Choose how the "How It Works" steps section is displayed.',
      options: {list: howItWorksVariants},
      initialValue: 'columns',
    },
  ],
}
