import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

const config = {
  projectId: 'hx5xgigp',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
}

export const sanityClient = createClient({
  ...config,
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
