import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'
import {assist} from '@sanity/assist'
import {schemaTypes} from './schemaTypes'
import PresentationNavigator from './components/PresentationNavigator'
import StudioTopBar from './components/StudioTopBar'
// Shared with the embedded Studio (root sanity.config.ts): single source for
// the Presentation URL⇄document mapping, the curated structure, and the
// singleton "+" filter.
import {mainDocuments, locations} from './presentation/resolve'
import {deskStructure} from './structure/deskStructure'
import {filterNewDocumentOptions} from './lib/singletons'

// AI Assist toggle — controlled by SANITY_STUDIO_AI_ASSIST in studio/.env
// per client. We tried fetching siteSettings.aiAssistEnabled at config
// load time so clients could self-serve, but Sanity's deploy pipeline
// runs a manifest-extraction worker that doesn't support top-level
// await (config worked fine for `dev` and `build`, failed for
// `deploy`). The build-time env var is the working compromise.
//
// Operator workflow when a client toggles aiAssistEnabled in Studio:
//   1. Update their studio/.env.<slug>-backup to set SANITY_STUDIO_AI_ASSIST=true
//      (or remove the line to disable).
//   2. Run `npm run deploy` against that client's Studio.
// The siteSettings.aiAssistEnabled boolean still lives in the schema
// as the signal channel — clients flip it to communicate intent.
const aiAssistEnabled = process.env.SANITY_STUDIO_AI_ASSIST === 'true'

const PREVIEW_ORIGIN = process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:4321'

// Every origin that might iframe the deployed Studio. Baked at build time.
// - localhost for local Astro dev
// - *.pages.dev wildcard covers every Cloudflare Pages preview subdomain
// - *.workers.dev wildcard covers Cloudflare Workers deploys (Astro 6 +
//   adapter v13 — the deploy target the fleet is migrating to)
// - PREVIEW_ORIGIN covers whatever we're currently pointing the hosted
//   Studio at (client domain after DNS, the platform URL before).
// Dedup at the bottom so a localhost PREVIEW_ORIGIN doesn't double-list.
const ALLOW_ORIGINS = [
  'http://localhost:4321',
  'https://*.pages.dev',
  'https://*.workers.dev',
  PREVIEW_ORIGIN,
].filter((v, i, arr) => v && arr.indexOf(v) === i)

export default defineConfig({
  name: 'default',
  title: process.env.SANITY_STUDIO_TITLE || 'photo-portfolio-template',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'hx5xgigp',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [
    presentationTool({
      allowOrigins: ALLOW_ORIGINS,
      // Page-selector panel (toggled by the list icon next to the URL bar).
      // Editors click pages/posts to move the preview instead of typing
      // paths — new pages appear in the list automatically.
      components: {
        unstable_navigator: {
          component: PresentationNavigator,
          minWidth: 180,
          maxWidth: 320,
        },
      },
      previewUrl: {
        origin: PREVIEW_ORIGIN,
        preview: '/',
        previewMode: {
          // Slashed paths: the site runs trailingSlash:'always', so the
          // un-slashed forms 308-redirect. Pointing Presentation straight
          // at the slashed paths removes the redirect hop entirely.
          enable: '/api/preview/',
          disable: '/api/disable-preview/',
        },
      },
      // URL⇄document mapping (mainDocuments + locations) is single-sourced in
      // ./presentation/resolve and shared with the embedded Studio. Update
      // routes/doctypes there.
      resolve: {mainDocuments, locations},
    }),
    structureTool({structure: deskStructure}),
    // AI Assist — gated on siteSettings.aiAssistEnabled. When off (default
    // for new clients), the plugin doesn't load and no sparkle icons render.
    ...(aiAssistEnabled ? [assist()] : []),
  ],

  schema: {
    types: schemaTypes,
  },

  // Hide singletons (and AI Assist's internal doc) from the global "+" create
  // menu — they exist once and are edited via the structure, not re-created.
  document: {
    newDocumentOptions: (prev) => filterNewDocumentOptions(prev),
  },

  // Trim default Studio upsell features (kept in sync with the embedded Studio,
  // root sanity.config.ts): Releases (Enterprise) and Tasks (Growth). The
  // Releases nav tab persists under `releases.enabled:false` in this version,
  // so also filter it out of `tools`.
  releases: {enabled: false},
  tasks: {enabled: false},
  tools: (prev) => prev.filter((tool) => tool.name !== 'releases'),

  // Agency top bar (Singletrack Sites tag + Heartbeat "Get help" link) —
  // shared with the embedded Studio (root sanity.config.ts).
  studio: {
    components: {
      navbar: StudioTopBar,
    },
  },
})
