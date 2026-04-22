import { createClient } from '@sanity/client'
import { createClient as createStegaClient } from '@sanity/client/stega'
import imageUrlBuilder from '@sanity/image-url'

// Base config — project ID and dataset come from PUBLIC_ env vars so they
// can be inlined at build time without leaking secrets (they are safe for
// the browser bundle).
const baseConfig = {
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'hx5xgigp',
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
}

// Published-content client — no token needed, safe to pre-build and reuse
// across requests. useCdn: true routes fetches through Sanity's CDN edge
// (~30–80ms vs ~200–400ms hitting api.sanity.io directly) and doesn't
// consume the project's API request quota. Trade-off is up to ~10s of
// staleness on published content, which is invisible in practice and
// fully sidestepped when the Sanity → CF deploy webhook rebuilds the
// site on publish. Visual editing is unaffected: the preview client
// below keeps useCdn: false + perspective: 'drafts' so Presentation
// always sees real-time draft content.
export const sanityClient = createClient({
  ...baseConfig,
  useCdn: true,
  token: undefined,
  ignoreBrowserTokenWarning: true,
})

// Reads a secret env var from multiple sources in priority order:
// 1. runtimeEnv — Cloudflare Pages runtime bindings (Astro.locals.runtime.env)
// 2. import.meta.env — Vite build-time bundled values (local dev, Vercel)
// 3. process.env — Node fallback
// This layered lookup means the same code works on Cloudflare (runtime-only
// secrets), Vercel (build-time env), and local dev (.env file) without any
// per-platform configuration.
function readEnv(runtimeEnv, key) {
  return (
    runtimeEnv?.[key] ||
    import.meta.env[key] ||
    (typeof process !== 'undefined' ? process.env?.[key] : undefined)
  )
}

// Preview client factory — creates a new Sanity client per request using
// whatever runtime env is available. This is the only way to get secrets
// working on Cloudflare Pages, where env vars set via the dashboard are
// runtime-only by default.
const PREVIEW_FETCH_TIMEOUT_MS = 6000

function createPreviewClient(runtimeEnv) {
  const token = readEnv(runtimeEnv, 'SANITY_API_READ_TOKEN')
  const studioUrl = readEnv(runtimeEnv, 'SANITY_STUDIO_URL') || 'http://localhost:3333'

  // Use the stega-enabled subpath export (@sanity/client/stega) so rendered
  // text is encoded with invisible markers that link back to the source
  // document. Without this subpath, stega config in the main createClient
  // is silently ignored and visual editing overlays don't appear.
  const client = createStegaClient({
    ...baseConfig,
    useCdn: false,
    token,
    perspective: 'drafts',
    ignoreBrowserTokenWarning: true,
    stega: {
      enabled: true,
      studioUrl,
    },
  })

  // Wrap .fetch with a per-query timeout. Preview pages run a parallel
  // Promise.all of many uncached drafts queries; if one stalls (Sanity
  // rate-limit, network blip, slow GROQ), the whole page hangs and editors
  // see 30s+ refresh delays. On timeout we resolve to null so callers fall
  // back to their existing optional-chaining defaults instead of erroring.
  const originalFetch = client.fetch.bind(client)
  client.fetch = async (query, params, options = {}) => {
    const signal = options.signal || AbortSignal.timeout(PREVIEW_FETCH_TIMEOUT_MS)
    try {
      return await originalFetch(query, params, { ...options, signal })
    } catch (err) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        console.warn('[sanity] preview fetch timed out:', String(query).slice(0, 80))
        return null
      }
      throw err
    }
  }
  return client
}

// Returns a client for either preview or published mode.
//
// For preview mode to work on Cloudflare Pages, pass the runtime env from
// your page: `getClient(Astro.locals.isPreview, Astro.locals.runtime?.env)`.
// Omitting runtimeEnv still works (falls back to build-time env vars), but
// on CF Pages that means the token won't be available and stega will be
// disabled — so overlays and click-to-edit won't function in Presentation.
export function getClient(isPreview = false, runtimeEnv = undefined) {
  if (isPreview) return createPreviewClient(runtimeEnv)
  return sanityClient
}

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source) {
  return builder.image(source)
}
