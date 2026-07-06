import type { APIRoute } from 'astro'
import { stegaClean } from '@sanity/client/stega'
import { getClient } from '../../lib/sanity.js'
import { buildFontHead, restHash } from '../../lib/fontHead.js'

// Style snapshot for the preview bridge's font fast path (see
// visualEditingBridge.js). Returns the computed font <head> payload plus a
// hash of every NON-font siteSettings field, so the bridge can tell "only
// fonts changed — apply client-side" apart from "something else changed —
// full refetch". A JSON fetch + one small GROQ is far cheaper than a full
// page render, which is the point: font-picker churn on Workers Free was
// costing an uncached SSR render per change.
//
// Preview-only: outside a preview session this 404s (the payload derives
// from drafts).
export const GET: APIRoute = async ({ locals }) => {
  if (!locals.isPreview) return new Response('Not found', { status: 404 })

  const client = getClient(true)
  // `...` carries every non-font field into restHash; the font-file
  // projections match Layout.astro's shape exactly (buildFontHead reads
  // {url, extension}).
  const raw = await client.fetch(
    `*[_type == "siteSettings" && _id == "siteSettings"][0]{
      ...,
      "headingFontFile": headingFontFile.asset->{url, extension},
      "bodyFontFile": bodyFontFile.asset->{url, extension}
    }`,
  )
  const settings = raw ? stegaClean(raw) : null

  const body = {
    ...buildFontHead(settings),
    restHash: restHash(settings),
  }
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}
