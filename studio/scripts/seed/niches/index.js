// Niche registry. Add a new niche by:
//   1. Creating a file in this directory (e.g. families.js) that exports
//      { slug, name, buildDocs }.
//   2. Importing and registering it here.
//
// The runner (../../seed.js) reads --niche=<slug> from the CLI and
// looks the slug up in this map. If no niche is specified, it falls
// back to 'pets' for backward compatibility with the original seed.js.

import pets from './pets.js'

export const niches = {
  [pets.slug]: pets,
  // [families.slug]: families,
  // [weddings.slug]: weddings,
}

export const DEFAULT_NICHE = 'pets'
