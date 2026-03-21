// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
// Note: swap the adapter for your hosting platform (Netlify, Vercel, Cloudflare, etc.)
// See https://docs.astro.build/en/guides/on-demand-rendering/
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
});
