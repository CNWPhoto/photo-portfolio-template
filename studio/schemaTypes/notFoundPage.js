export default {
  name: 'notFoundPage',
  title: '404 Page',
  type: 'document',
  __experimental_actions: ['update', 'publish'], // singleton — no create/delete
  preview: {
    prepare() {
      return {title: '404 Page'}
    },
  },
  fields: [
    {
      name: 'image',
      title: 'Background Image',
      type: 'image',
      description: 'Full-bleed image displayed behind the 404 text.',
      options: {hotspot: true},
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Large text displayed over the image. Defaults to "404".',
      initialValue: '404',
    },
    {
      name: 'subheading',
      title: 'Sub-headline',
      type: 'string',
      description: 'Smaller text below the heading. Defaults to "Page Not Found".',
      initialValue: 'Page Not Found',
    },
    {
      name: 'ctaText',
      title: 'Button Text',
      type: 'string',
      initialValue: 'Back to Home',
    },
    {
      name: 'ctaLink',
      title: 'Button Link',
      type: 'string',
      initialValue: '/',
    },
  ],
}
