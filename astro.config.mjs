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
  // adapter v13 replaced `runtime` options with `platformProxy`; enable it
  // so local dev/preview (now workerd via the CF Vite plugin) sees bindings.
  adapter: cloudflare({ platformProxy: { enabled: true } }),
  integrations: [
    sanity({
      projectId: process.env.PUBLIC_SANITY_PROJECT_ID || 'hx5xgigp',
      dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
      useCdn: false,
      apiVersion: '2024-01-01',
      stega: {
        studioUrl: process.env.SANITY_STUDIO_URL || 'http://localhost:3333',
      },
      // Embed Sanity Studio at /studio (config: root sanity.config.ts).
      // Browser history (not hash) — this site is output:'server', so the
      // integration serves /studio as an SSR shell + client:only Studio,
      // which sidesteps the CF-adapter prerender-strip bug entirely. Studio
      // JS is code-split to this route only; public pages stay Studio-free.
      studioBasePath: '/studio',
    }),
    react(),
  ],
  vite: {
    resolve: {
      // Force a SINGLE copy of each of these across the embedded-Studio build.
      // The shared schema (root sanity.config.ts → ./studio/schemaTypes) lives
      // under studio/, whose files would otherwise resolve bare imports from
      // studio/node_modules while studio-component.tsx resolves them from the
      // root — two `sanity` instances break the Studio. @sanity/astro's own
      // dedupe plugin only applies in dev (`apply:'serve'`), so `astro build`
      // needs this. Root pins these to studio's exact versions (package.json).
      dedupe: [
        'react',
        'react-dom',
        'react-is',
        'styled-components',
        'sanity',
        '@sanity/ui',
      ],
    },
  },
});
