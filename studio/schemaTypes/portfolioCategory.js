// Portfolio category. Free-form, editor-created. Referenced from
// portfolio image entries. See docs/page-builder-spec.md §11.

export default {
  name: 'portfolioCategory',
  title: 'Portfolio Category',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Used in the category URL: /portfolio/category/{slug}',
      options: {source: 'name', maxLength: 64},
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Optional. Shown at the top of the category page.',
    },
  ],
  preview: {
    select: {title: 'name', subtitle: 'slug.current'},
  },
}
