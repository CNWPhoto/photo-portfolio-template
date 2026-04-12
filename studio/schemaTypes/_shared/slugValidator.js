// Slug validator for the unified `page` document type. Rejects reserved
// route names so editors can't accidentally shadow built-in pages or
// API routes. See docs/page-builder-spec.md §1.

export const RESERVED_SLUGS = new Set([
  'api',
  'blog',
  'portfolio',
  'preview',
  'admin',
  'studio',
  '404',
  'category',
  '',
])

export function validatePageSlug(slug) {
  const value = slug?.current?.trim().toLowerCase()
  if (!value) return 'Slug is required'
  if (value.startsWith('_')) return 'Slug is reserved — pick a different one'
  if (RESERVED_SLUGS.has(value)) return 'Slug is reserved — pick a different one'
  if (!/^[a-z0-9-]+$/.test(value)) {
    return 'Use lowercase letters, digits, and dashes only'
  }
  return true
}

export default validatePageSlug
