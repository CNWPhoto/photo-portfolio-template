export default {
  name: 'codeSettings',
  title: 'Code',
  type: 'document',
  __experimental_actions: ['create', 'update', 'publish'],
  preview: {
    prepare() {
      return {title: 'Code'}
    },
  },
  fields: [
    {
      name: 'headScripts',
      title: 'Head Scripts',
      type: 'text',
      rows: 8,
      description:
        'Paste any code that belongs inside <head>: Google Analytics (GA4), Google Tag Manager, Facebook Pixel, Pinterest Tag, etc. Leave blank if not needed.',
    },
    {
      name: 'bodyScripts',
      title: 'Body Scripts',
      type: 'text',
      rows: 8,
      description:
        'Paste any code that should go just before </body>: Google Tag Manager noscript, live chat widgets, etc. Leave blank if not needed.',
    },
  ],
}
