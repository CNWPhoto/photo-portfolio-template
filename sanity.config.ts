import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
// Single-sourced schema: the SAME definitions the standalone hosted Studio
// (studio/) deploys. One schema, no drift. See the embedded-studio pilot.
import {schemaTypes} from './studio/schemaTypes'

// Config for the embedded Studio served by @sanity/astro at /studio.
//
// - The route path and `basePath` come from `studioBasePath` in
//   astro.config.mjs, which OVERRIDES any basePath set here — so none is set
//   (setting one just logs a warning and is ignored).
// - projectId/dataset read the same PUBLIC_ env vars as the @sanity/astro
//   integration in astro.config.mjs, with the demo project as fallback, so
//   forks parameterize both from one place.
// - Deliberately minimal: structureTool only. Presentation/visual editing
//   (browser-history SPA can't host it) and AI Assist stay in the standalone
//   hosted Studio (studio/sanity.config.js).
// - The shared schema pulls in custom React input components from
//   studio/components; a `vite.resolve.dedupe` in astro.config.mjs forces a
//   single sanity / @sanity/ui / styled-components / react instance so they
//   render inside this embedded build (the integration's own dedupe plugin
//   only runs in dev, not in `astro build`).
const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'hx5xgigp'
const dataset = import.meta.env.PUBLIC_SANITY_DATASET || 'production'

export default defineConfig({
  name: 'default',
  title: 'Pet Photographer Demo',
  projectId,
  dataset,
  plugins: [structureTool()],
  schema: {types: schemaTypes},
})
