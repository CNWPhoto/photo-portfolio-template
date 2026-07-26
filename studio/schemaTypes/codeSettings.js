// Clients set analytics up themselves with no hand-holding, so these fields
// take a bare ID (not a pasted snippet) and validate the two realistic
// mistakes: pasting the whole <script> block, and swapping GA4/GTM IDs.
const idValidation =
  ({prefix, label, example, otherPrefix, otherLabel}) =>
  (Rule) =>
    Rule.custom((value) => {
      if (typeof value !== 'string') return true
      const id = value.trim()
      if (!id) return true // optional

      if (/<\s*script|googletagmanager\.com|gtag\(/i.test(id)) {
        return `Paste only the ID (${example}) — not the whole code snippet. The ID is near the top of the snippet.`
      }
      if (id.toUpperCase().startsWith(otherPrefix)) {
        return `That looks like a ${otherLabel} ID. Put it in the ${otherLabel} field instead.`
      }
      if (!new RegExp(`^${prefix}[A-Z0-9]+$`, 'i').test(id)) {
        return `${label} IDs look like ${example}.`
      }
      return true
    })

export default {
  name: 'codeSettings',
  title: 'Code',
  type: 'document',
  __experimental_actions: ['create', 'update', 'publish'],
  preview: {
    prepare() {
      return {title: 'Code'}
    },
  },
  groups: [
    {name: 'analytics', title: 'Analytics', default: true},
    {name: 'advanced', title: 'Advanced'},
  ],
  fields: [
    {
      name: 'ga4MeasurementId',
      title: 'Google Analytics Measurement ID',
      type: 'string',
      group: 'analytics',
      description:
        'Tracks how many people visit your site and which pages they view. In Google Analytics: Admin → Data Streams → click your website, then copy the Measurement ID at the top right. It starts with "G-". Paste just that ID here — nothing else is needed.',
      placeholder: 'G-XXXXXXXXXX',
      validation: idValidation({
        prefix: 'G-',
        label: 'Measurement',
        example: 'G-XXXXXXXXXX',
        otherPrefix: 'GTM-',
        otherLabel: 'Google Tag Manager',
      }),
    },
    {
      name: 'gtmContainerId',
      title: 'Google Tag Manager ID (optional)',
      type: 'string',
      group: 'analytics',
      description:
        'Only needed if you use Google Tag Manager to manage marketing tags. Most people can leave this blank — the Measurement ID above is all you need for visitor stats. It starts with "GTM-" and is at the top of your Tag Manager workspace.',
      placeholder: 'GTM-XXXXXXX',
      validation: idValidation({
        prefix: 'GTM-',
        label: 'Container',
        example: 'GTM-XXXXXXX',
        otherPrefix: 'G-',
        otherLabel: 'Google Analytics',
      }),
    },
    {
      name: 'headScripts',
      title: 'Head Scripts',
      type: 'text',
      rows: 8,
      group: 'advanced',
      description:
        'For any other code that belongs inside <head> — Facebook Pixel, Pinterest Tag, site verification, etc. Google Analytics and Tag Manager are handled by the fields above, so you do not need to paste them here.',
    },
    {
      name: 'bodyScripts',
      title: 'Body Scripts',
      type: 'text',
      rows: 8,
      group: 'advanced',
      description:
        'For any other code that should go just before </body> — live chat widgets, etc. Leave blank if not needed.',
    },
  ],
}
