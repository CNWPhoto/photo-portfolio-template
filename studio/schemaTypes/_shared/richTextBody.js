import {linkAnnotation} from './linkAnnotation'
// Shared rich text body field definition. Used anywhere we want a
// multi-paragraph body with basic formatting (bold, italic, links).
// `images: true` also allows inline images in the body. Opt-in rather than
// on everywhere: most body fields are prose beside their own image field, and
// an image block there is usually a mistake. src/lib/portableText.js renders
// the `image` type — without that this would insert blocks that display
// nothing.
export const richTextBody = ({images = false, ...overrides} = {}) => ({
  name: 'body',
  title: 'Body',
  type: 'array',
  description: 'Rich text. Press Enter twice to start a new paragraph.',
  of: [
    {
      type: 'block',
      styles: [{title: 'Normal', value: 'normal'}],
      lists: [],
      marks: {
        decorators: [
          {title: 'Bold', value: 'strong'},
          {title: 'Italic', value: 'em'},
        ],
        annotations: [
          linkAnnotation(),
        ],
      },
    },
    ...(images
      ? [
          {
            type: 'image',
            options: {hotspot: true},
            fields: [
              {
                name: 'alt',
                type: 'string',
                title: 'Alt text',
                description:
                  'Describe the image for screen readers and search engines. Leave blank only if it is purely decorative.',
              },
              {
                name: 'caption',
                type: 'string',
                title: 'Caption',
                description: 'Optional line shown beneath the image.',
              },
            ],
          },
        ]
      : []),
  ],
  ...overrides,
})
