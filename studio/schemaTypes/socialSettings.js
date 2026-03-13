export default {
  name: 'socialSettings',
  title: 'Social',
  type: 'document',
  __experimental_actions: ['create', 'update', 'publish'],
  preview: {
    prepare() {
      return {title: 'Social'}
    },
  },
  fields: [
    {
      name: 'instagram',
      title: 'Instagram',
      type: 'url',
      description: 'Full URL e.g. https://instagram.com/yourhandle — leave blank to hide.',
    },
    {
      name: 'facebook',
      title: 'Facebook',
      type: 'url',
      description: 'Full URL e.g. https://facebook.com/yourpage — leave blank to hide.',
    },
    {
      name: 'youtube',
      title: 'YouTube',
      type: 'url',
      description: 'Full URL e.g. https://youtube.com/@yourchannel — leave blank to hide.',
    },
    {
      name: 'tiktok',
      title: 'TikTok',
      type: 'url',
      description: 'Full URL e.g. https://tiktok.com/@yourhandle — leave blank to hide.',
    },
    {
      name: 'custom',
      title: 'Other',
      type: 'object',
      description: 'Add any other platform not listed above.',
      fields: [
        {
          name: 'label',
          title: 'Label',
          type: 'string',
          description: 'Name shown in the footer (e.g. "Pinterest", "LinkedIn").',
        },
        {
          name: 'url',
          title: 'URL',
          type: 'url',
          description: 'Full URL for the link.',
        },
      ],
    },
  ],
}
