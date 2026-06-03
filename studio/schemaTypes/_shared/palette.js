// Palette object type. Each palette is a named set of CSS-token color values
// that gets emitted as inline custom properties on a section's root element.
// Field names mirror the CSS variable contract in src/styles/palette.css and
// the legacy [data-theme] block in src/layouts/Layout.astro.

import HexColorInput from '../../components/HexColorInput'

const hexColor = (Rule) =>
  Rule.regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    name: 'hex color',
    invert: false,
  }).error('Must be a hex color, e.g. #8b2635')

const colorField = (name, title, description) => ({
  name,
  title,
  type: 'string',
  description,
  validation: hexColor,
  components: {input: HexColorInput},
})

export const palette = {
  name: 'palette',
  title: 'Palette',
  type: 'object',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Display name (e.g. "Classic Cream")',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description:
        'Unique id used to reference this palette. New palettes get a unique slug automatically; click "Generate" to derive a clean one from the name. Each palette must be unique.',
      options: {source: 'name', maxLength: 64},
      // New palettes (incl. duplicated ones) default to a unique slug so they
      // can't silently inherit an existing palette's slug — the bug that let a
      // "Michelle" palette collide with the stock "warm-studio".
      initialValue: () => ({
        _type: 'slug',
        current: `palette-${Math.random().toString(36).slice(2, 8)}`,
      }),
      validation: (Rule) => [
        Rule.required(),
        // Non-blocking warning if two palettes share a slug (e.g. after a
        // duplicate) — the active palette is matched by slug, so collisions
        // shadow one another. Regenerate to resolve.
        Rule.custom((slug, context) => {
          const current = slug?.current
          if (!current) return true
          const palettes = context?.document?.palettes || []
          const count = palettes.filter((p) => p?.slug?.current === current).length
          return count > 1
            ? 'Another palette already uses this slug — regenerate so each palette is unique.'
            : true
        }).warning(),
      ],
    },
    colorField('bg', 'Background', 'Page background'),
    colorField('bgAlt', 'Background Alt', 'Alternate background (cards, surfaces)'),
    colorField('surface', 'Surface', 'Raised surface (usually same as bgAlt)'),
    colorField('text', 'Text', 'Primary text color'),
    colorField('textMuted', 'Muted Text', 'Secondary text — emits as --muted'),
    colorField('textMutedLight', 'Muted Light Text', 'Tertiary text — emits as --muted-light'),
    colorField('accent', 'Accent', 'Primary accent (buttons, links)'),
    colorField('accentDark', 'Accent Dark', 'Hover/pressed accent'),
    colorField('border', 'Border', 'Hairline borders, dividers'),
    colorField('sectionAlt', 'Section Alt', 'Alternate section background'),
    colorField('sectionDark', 'Section Dark', 'Dark section background'),
    colorField('sectionDarkText', 'Section Dark Text', 'Text color on dark sections'),
    colorField('btnBg', 'Button Background', 'Button background color'),
    colorField('btnText', 'Button Text', 'Button text color'),
  ],
  preview: {
    select: {title: 'name', subtitle: 'slug.current', bg: 'bg', accent: 'accent'},
    prepare({title, subtitle}) {
      return {title: title || 'Unnamed palette', subtitle}
    },
  },
}

export default palette
