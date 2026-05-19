// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sanity from '@sanity/astro';
import react from '@astrojs/react';

export default defineConfig({
  output: 'server',
  // Every URL ends in a trailing slash, site-wide, for every client.
  // Astro redirects non-slashed requests to the slashed canonical.
  trailingSlash: 'always',
  adapter: cloudflare(),
  integrations: [
    sanity({
      projectId: process.env.PUBLIC_SANITY_PROJECT_ID || 'hx5xgigp',
      dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
      useCdn: false,
      apiVersion: '2024-01-01',
      stega: {
        studioUrl: process.env.SANITY_STUDIO_URL || 'http://localhost:3333',
      },
    }),
    react(),
  ],
});
