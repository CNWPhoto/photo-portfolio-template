// Soft warnings shared by every schema's image field. Returns an array of
// validation rules that emit warnings (not errors) so editors can save
// without being blocked but still see the nudge. Use as:
//
//   { type: 'image', validation: imageSizeWarning, ... }
//
// For image fields that need both size + alt warnings, combine via:
//
//   validation: (Rule) => [...imageSizeWarning(Rule), ...other(Rule)]

const FIVE_MB = 5 * 1024 * 1024

export const imageSizeWarning = (Rule) => [
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

// Alt text warning for the standard `alt` subfield. Spread into a field's
// validation array so editors are nudged to add alt text without being blocked.
export const altTextWarning = (Rule) =>
  Rule.custom((alt, ctx) => {
    const parent = ctx.parent
    if (!parent?.asset) return true
    if (!alt || alt.trim() === '') return 'Alt text is required for accessibility and SEO'
    return true
  }).warning()
