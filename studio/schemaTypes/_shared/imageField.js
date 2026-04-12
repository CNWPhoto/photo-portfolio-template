// Standardized image field. All section schemas should use this so editors
// get consistent alt-text validation, sizing guidance, and a soft warning
// when uploads exceed 5MB.

const FIVE_MB = 5 * 1024 * 1024

export const imageField = ({
  name = 'image',
  title = 'Image',
  description = 'Recommended: at least 1600px on the long edge. Keep file size under 5MB for best load times.',
  required = false,
} = {}) => ({
  name,
  title,
  type: 'image',
  description,
  options: {hotspot: true},
  fields: [
    {
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description:
        'Describe the image for screen readers and SEO. Required unless the image is purely decorative.',
      validation: (Rule) =>
        Rule.custom((alt, ctx) => {
          const parent = ctx.parent
          if (!parent?.asset) return true
          if (!alt || alt.trim() === '') return 'Alt text is required for non-decorative images'
          return true
        }).warning(),
    },
  ],
  validation: (Rule) => {
    const rules = [
      Rule.custom((value) => {
        if (!value?.asset?._ref) return true
        const sizeStr = value.asset._ref.split('-').pop()
        const size = Number.parseInt(sizeStr, 10)
        if (Number.isFinite(size) && size > FIVE_MB) {
          return 'Image is larger than 5MB — consider compressing it before upload for faster page loads.'
        }
        return true
      }).warning(),
    ]
    if (required) rules.push(Rule.required())
    return rules
  },
})

export default imageField
