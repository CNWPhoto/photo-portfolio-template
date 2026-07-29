import { createClient } from '@sanity/client'
import { createClient as createStegaClient } from '@sanity/client/stega'
import imageUrlBuilder from '@sanity/image-url'
// Astro 6 / @astrojs/cloudflare v13 removed `Astro.locals.runtime.env`.
// Runtime secrets now come from this virtual module (request-scoped on
// workerd — only read it inside request handlers, never at module init).
import { env as cloudflareEnv } from 'cloudflare:workers'

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
// staleness on published content.
//
// Note: this is an SSR site (astro.config output: 'server'), so there is
// NO build-time rebuild on publish — pages render on demand. Visitor-facing
// freshness after a publish is therefore governed by this ~10s CDN lag PLUS
// the edge-cache TTL in src/middleware.ts. A future Sanity-webhook → CF
// cache-purge would make publishes appear within seconds (see the
// edge-caching plan). Visual editing is unaffected: the preview client
// below keeps useCdn: false + perspective: 'drafts' so Presentation always
// sees real-time draft content.
export const sanityClient = createClient({
  ...baseConfig,
  useCdn: true,
  token: undefined,
  ignoreBrowserTokenWarning: true,
  // Abort published-content fetches that stall (Sanity blip, network) after
  // 8s instead of hanging the render indefinitely. The rejection surfaces to
  // the middleware's render guard, which serves the branded 503 fallback.
  // (The preview client has its own 6s per-fetch timeout below that resolves
  // null instead — editors' parallel draft queries degrade per-field.)
  timeout: 8000,
})

// Reads a secret env var from multiple sources in priority order:
// 1. cloudflareEnv — Cloudflare Workers runtime bindings (Astro 6 / adapter
//    v13; replaces the removed Astro.locals.runtime.env)
// 2. import.meta.env — Vite build-time bundled values (local dev)
// 3. process.env — Node fallback
// Same code works on Cloudflare (runtime-only secrets) and local dev
// (.env file) without per-platform configuration.
function readEnv(key) {
  return (
    cloudflareEnv?.[key] ||
    import.meta.env[key] ||
    (typeof process !== 'undefined' ? process.env?.[key] : undefined)
  )
}

// Preview client factory — creates a new Sanity client per request using
// whatever runtime env is available. On Cloudflare Workers the read token
// is a runtime-only secret (uploaded via `wrangler secret`), so the client
// must be built per-request rather than at module load.
const PREVIEW_FETCH_TIMEOUT_MS = 6000

// Stega encodes every string it can, and its overhead is per-string rather
// than per-character — so many short values inflate worst. Measured on the
// demo's Layout query (which runs on EVERY page): 3.4 KB of data became
// 156 KB encoded, a 46x inflation costing ~2ms, dominated by the palette's
// fifteen hex values per palette.
//
// None of it was ever used. Every consumer of these documents calls
// stegaClean() on them first — Layout for settings/seo/code/social/nav, Footer
// for its own — because invisible markers inside a hex value break CSS
// parsing. So the encoding was work we paid for and immediately threw away.
//
// Skipping them takes that query to ~18 KB and ~0.3ms. On the Workers Free
// plan's 10ms CPU-per-request budget that headroom is the difference between
// a preview render landing and a 1102.
//
// Safe by construction: these are form-edited in the Studio, never
// click-to-edit on the rendered page, so no overlay is lost. Page CONTENT —
// sections, headings, body, blog, testimonials — is untouched and still fully
// encoded, which is where visual editing actually matters.
const STEGA_SKIP_TYPES = new Set([
  'siteSettings',
  'seoSettings',
  'codeSettings',
  'socialSettings',
  'navSettings',
  'footerSettings',
])
const HEX_COLOR = /^#[0-9a-f]{3,8}$/i

function stegaFilter(props) {
  if (STEGA_SKIP_TYPES.has(props.sourceDocument?._type)) return false
  // Safety net for colour fields on any other document type: a stega marker
  // inside a hex value is not just wasteful, it breaks CSS.
  if (typeof props.value === 'string' && HEX_COLOR.test(props.value)) return false
  return props.filterDefault(props)
}

function createPreviewClient() {
  const token = readEnv('SANITY_API_READ_TOKEN')
  const studioUrl = readEnv('SANITY_STUDIO_URL') || 'http://localhost:3333'

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
      filter: stegaFilter,
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

// Returns a client for either preview or published mode. Runtime secrets
// are read from the `cloudflare:workers` env inside readEnv(), so callers
// just pass the preview flag: `getClient(Astro.locals.isPreview)`.
export function getClient(isPreview = false) {
  if (isPreview) return createPreviewClient()
  return sanityClient
}

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source) {
  return builder.image(source)
}
