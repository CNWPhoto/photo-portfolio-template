import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

const config = {
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'hx5xgigp',
  dataset:   import.meta.env.PUBLIC_SANITY_DATASET    || 'production',
  apiVersion: '2024-01-01',
}

export const sanityClient = createClient({
  ...config,
  useCdn: true, // CDN-cached responses for published content — faster, no origin hit
  token: undefined,
  ignoreBrowserTokenWarning: true,
})

const previewClient = createClient({
  ...config,
  token: import.meta.env.SANITY_API_READ_TOKEN,
  perspective: 'previewDrafts',
  ignoreBrowserTokenWarning: true,
})

export function getClient(isPreview = false) {
  return isPreview ? previewClient : sanityClient
}

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source) {
  return builder.image(source)
}
