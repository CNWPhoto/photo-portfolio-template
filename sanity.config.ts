import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'
import {assist} from '@sanity/assist'
// Single-sourced schema: the SAME definitions the standalone hosted Studio
// (studio/) deploys. One schema, no drift. See the embedded-studio pilot.
import {schemaTypes} from './studio/schemaTypes'
// Presentation URL⇄document map + page-picker, shared with the hosted Studio.
import {mainDocuments, locations} from './studio/presentation/resolve'
import PresentationNavigator from './studio/components/PresentationNavigator'
import StudioTopBar from './studio/components/StudioTopBar'
import StudioLayout from './studio/components/StudioLayout'
// Curated structure + singleton "+" filter, shared with the hosted Studio.
import {deskStructure} from './studio/structure/deskStructure'
import {filterNewDocumentOptions} from './studio/lib/singletons'

// Config for the embedded Studio served by @sanity/astro at /studio.
//
// - The route path and `basePath` come from `studioBasePath` in
//   astro.config.mjs, which OVERRIDES any basePath set here — so none is set
//   (setting one just logs a warning and is ignored).
// - projectId/dataset read the same PUBLIC_ env vars as the @sanity/astro
//   integration in astro.config.mjs, with the demo project as fallback, so
//   forks parameterize both from one place.
// - Presentation IS enabled here. The spec dropped it only because its
//   static/hash plan couldn't host it — our SSR browser-history embed can.
//   Because this Studio is served from the SITE'S OWN origin, Presentation
//   iframes that same origin: previewUrl.origin is omitted so it defaults to
//   the Studio's origin — auto-correct in dev, preview, and every client's
//   prod domain with zero per-env config, and no allowOrigins needed
//   (same-origin). AI Assist stays in the hosted Studio.
// - The shared schema pulls in custom React input components from
//   studio/components; a `vite.resolve.dedupe` in astro.config.mjs forces a
//   single sanity / @sanity/ui / styled-components / react instance so they
//   render inside this embedded build (the integration's own dedupe plugin
//   only runs in dev, not in `astro build`).
const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'hx5xgigp'
const dataset = import.meta.env.PUBLIC_SANITY_DATASET || 'production'
// AI Assist — gated per client, default OFF, mirroring the hosted Studio's
// SANITY_STUDIO_AI_ASSIST gate (kept parallel so the two Studios don't drift).
// Set PUBLIC_SANITY_AI_ASSIST=true in the client's build env to enable; the
// demo build sets it true. siteSettings.aiAssistEnabled stays the signal
// channel clients flip to request it. (AI Assist is a Growth-plan feature.)
const aiAssistEnabled = import.meta.env.PUBLIC_SANITY_AI_ASSIST === 'true'

export default defineConfig({
  name: 'default',
  title: 'Pet Photographer Demo',
  projectId,
  dataset,
  plugins: [
    presentationTool({
      resolve: {mainDocuments, locations},
      // Page-selector panel — same component the hosted Studio uses.
      components: {
        unstable_navigator: {
          component: PresentationNavigator,
          minWidth: 180,
          maxWidth: 320,
        },
      },
      previewUrl: {
        // origin omitted → defaults to this Studio's own origin (same-origin
        // embed). Slashed previewMode paths match trailingSlash:'always'.
        preview: '/',
        previewMode: {
          enable: '/api/preview/',
          disable: '/api/disable-preview/',
        },
      },
    }),
    // Curated structure — same organized tree as the hosted Studio (not the
    // raw default type list).
    structureTool({structure: deskStructure}),
    // AI Assist — per-field sparkle buttons; gated (see aiAssistEnabled above).
    ...(aiAssistEnabled ? [assist()] : []),
  ],
  schema: {types: schemaTypes},

  // Hide singletons (+ AI Assist's internal doc) from the global "+" menu.
  document: {
    newDocumentOptions: (prev) => filterNewDocumentOptions(prev),
  },

  // Trim default Studio features that are paid upsells this niche doesn't use.
  //   - Releases (Enterprise): `releases.enabled:false` disables the feature,
  //     but in this Studio version it LEAVES the "Releases" nav tab, so we also
  //     strip it from `tools` (it's registered as a tool at /studio/releases).
  //   - Tasks (Growth): the tasks inbox next to the avatar.
  // NOTE: no supported config flag hides the navbar "Upgrade" CTA itself.
  releases: {enabled: false},
  tasks: {enabled: false},
  tools: (prev) => prev.filter((tool) => tool.name !== 'releases'),

  // Agency top bar (Singletrack Sites tag + Heartbeat "Get help" link) +
  // Dashboard bridge (StudioLayout) so sanity.io's Dashboard opens THIS
  // embedded Studio rather than a stale hosted one.
  studio: {
    components: {
      navbar: StudioTopBar,
      layout: StudioLayout,
    },
  },
})
