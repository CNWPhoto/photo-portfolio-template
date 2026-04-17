import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'hx5xgigp',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  studioHost: process.env.SANITY_STUDIO_HOST || 'cnw-photo-demo',
  deployment: {
    // appId is pinned per-client after the first deploy to skip the
    // "Create new / attach existing" prompt on subsequent deploys. First
    // deploy for a fresh project: leave SANITY_STUDIO_APP_ID unset so
    // Sanity creates a new application. Then paste the returned appId
    // into the client's studio/.env for future non-interactive deploys.
    appId: process.env.SANITY_STUDIO_APP_ID || undefined,
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: false,
  }
})
