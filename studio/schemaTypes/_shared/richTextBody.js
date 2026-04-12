// Shared rich text body field definition. Used anywhere we want a
// multi-paragraph body with basic formatting (bold, italic, links).
export const richTextBody = (overrides = {}) => ({
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
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [{name: 'href', type: 'url', title: 'URL'}],
          },
        ],
      },
    },
  ],
  ...overrides,
})
