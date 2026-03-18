export default {
  name: 'aboutCtaSection',
  title: 'Get in Touch Section',
  type: 'object',
  preview: {
    prepare() {
      return {title: 'Get in Touch'}
    },
  },
  fields: [
    {
      name: 'enabled',
      title: 'Show this section',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'imageBackground',
      title: 'Background Image (landscape)',
      type: 'image',
      description: 'The wide horizontal image that spans across the top of the section.',
      options: {hotspot: true},
      fields: [
        {name: 'alt', title: 'Alt text', type: 'string'},
      ],
    },
    {
      name: 'imageForeground',
      title: 'Foreground Image (portrait)',
      type: 'image',
      description: 'The tall vertical image on the left side, overlapping the background image.',
      options: {hotspot: true},
      fields: [
        {name: 'alt', title: 'Alt text', type: 'string'},
      ],
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      placeholder: "Let's Do This!",
    },
    {
      name: 'body',
      title: 'Body Text',
      type: 'text',
      rows: 3,
      placeholder: "If you're ready to have photographs that actually look and feel like you, I'd love to hear from you.",
    },
    {
      name: 'buttonText',
      title: 'Button Text',
      type: 'string',
      placeholder: 'Get In Touch',
    },
    {
      name: 'buttonLink',
      title: 'Button Link',
      type: 'string',
      description: 'URL or path the button links to. E.g. /contact',
      placeholder: '/contact',
    },
    {
      name: 'caption',
      title: 'Sub-button Text',
      type: 'string',
      placeholder: 'Serving [City] and surrounding areas.',
    },
  ],
}
