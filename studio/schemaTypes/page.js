import {validatePageSlug} from './_shared/slugValidator'
import {sectionsOf, sectionsInsertMenu} from './_shared/sectionsArrayConfig'

// Unified page document for the page builder rewrite. Replaces aboutPage,
// experiencePage, contactPage, and any future free-form page.
// See docs/page-builder-spec.md §1.

export default {
  name: 'page',
  title: 'Page',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
    {name: 'navigation', title: 'Navigation'},
    {name: 'theme', title: 'Theme'},
  ],
  fields: [
    {
      name: 'title',
      title: 'Internal Title',
      type: 'string',
      description: 'Used in the Studio list and as a fallback for SEO title.',
      group: 'content',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      description:
        'The URL for this page (e.g. "about" → /about). Reserved words like "api", "blog", "portfolio", "studio", "admin" are not allowed.',
      options: {source: 'title', maxLength: 96},
      group: 'content',
      validation: (Rule) =>
        Rule.required().custom((slug) => validatePageSlug(slug)),
    },
    {
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    },
    {
      name: 'sections',
      title: 'Sections',
      type: 'array',
      description: 'Add, remove, and drag to reorder sections on this page.',
      group: 'content',
      of: sectionsOf,
      options: {insertMenu: sectionsInsertMenu},
    },
    {
      name: 'navigation',
      title: 'Navigation',
      type: 'object',
      group: 'navigation',
      options: {collapsible: false},
      fields: [
        {
          name: 'showInNav',
          title: 'Show in main nav',
          type: 'boolean',
          initialValue: false,
          description:
            'When enabled, this page will be auto-listed in the main nav. Most clients prefer to manage nav links manually in Navigation settings — leave this off and add the link there.',
        },
        {
          name: 'navLabel',
          title: 'Nav Label',
          type: 'string',
          description: 'Optional. Falls back to the internal title.',
        },
        {
          name: 'navOrder',
          title: 'Nav Order',
          type: 'number',
          description: 'Lower numbers appear first.',
        },
      ],
    },
    {
      name: 'defaultPalette',
      title: 'Default Palette',
      type: 'string',
      description:
        'Optional palette slug (e.g. "warm-studio") to override the site default for sections on this page.',
      group: 'theme',
    },
    {
      name: 'navThemeOverHero',
      title: 'Nav Theme Over Hero',
      type: 'string',
      description:
        'Controls nav text color when overlaid on the first section. "Auto" picks based on the first section\'s background.',
      options: {
        list: [
          {title: 'Auto', value: 'auto'},
          {title: 'Light', value: 'light'},
          {title: 'Dark', value: 'dark'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'auto',
      group: 'theme',
    },
  ],
  preview: {
    select: {title: 'title', subtitle: 'slug.current'},
    prepare({title, subtitle}) {
      return {title: title || 'Untitled', subtitle: subtitle ? `/${subtitle}` : 'no slug'}
    },
  },
}
