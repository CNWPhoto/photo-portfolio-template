// Blog category. Free-form, editor-created. Referenced from blogPost.categories.
// See docs/page-builder-spec.md §11.

export default {
  name: 'blogCategory',
  title: 'Blog Category',
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
      description: 'Used in the category URL: /blog/category/{slug}',
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
