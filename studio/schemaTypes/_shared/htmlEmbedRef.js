import {sectionBaseFields} from './sectionBase'

// Wrapper object used inside a page's sections[] array. Holds a reference
// to a reusable htmlEmbedSection document plus the section common fields
// (spacing, palette override, sectionId, enabled). The actual raw HTML and
// container settings live on the referenced doc so editors can create one
// embed and use it on multiple pages.
//
// See docs/page-builder-spec.md §2 (htmlEmbedSection — note about being a
// document type referenced from multiple places).

export default {
  name: 'htmlEmbedRef',
  title: 'HTML Embed',
  type: 'object',
  fields: [
    ...sectionBaseFields(),
    {
      name: 'embed',
      title: 'HTML Embed',
      type: 'reference',
      to: [{type: 'htmlEmbedSection'}],
      description: 'Pick an HTML Embed document. Create one in the HTML Embeds list if you don\'t see what you need.',
      validation: (Rule) => Rule.required(),
    },
  ],
  preview: {
    select: {title: 'embed.name'},
    prepare({title}) {
      return {title: title || 'HTML Embed', subtitle: 'Embed reference'}
    },
  },
}
