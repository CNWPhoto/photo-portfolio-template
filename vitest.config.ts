import { defineConfig } from 'vitest/config'

// Unit tests cover the pure, framework-agnostic functions — the logic most
// likely to break silently under an Astro / adapter / Sanity upgrade. They
// run in plain Node (no jsdom, no Astro runtime) so they're fast and stable.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
