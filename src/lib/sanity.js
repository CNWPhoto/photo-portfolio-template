import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const sanityClient = createClient({
  projectId: 'hx5xgigp',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: undefined,
  ignoreBrowserTokenWarning: true,
})

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source) {
  return builder.image(source)
}
