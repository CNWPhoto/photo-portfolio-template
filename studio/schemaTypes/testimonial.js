import {imageSizeWarning, altTextWarning} from './_shared/imageValidation'

export default {
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  orderings: [
    {
      title: 'Manual Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
  fields: [
    {
      name: 'testimonial',
      title: 'Testimonial',
      type: 'text',
      rows: 4,
      description: 'The full testimonial text from your client. Do not include quotation marks — they are added automatically.',
    },
    {
      name: 'client',
      title: 'Client',
      type: 'string',
      description: "The client's name shown below the quote (e.g. 'Sarah M.' or 'The Johnson Family').",
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      description: 'A portrait photo of the client or their subject. Vertical images work best. Keep file size under 5MB for best load times.',
      options: {
        hotspot: true,
        crop: true,
        aiAssist: {imageDescriptionField: 'alt'},
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Describe the photo for accessibility.',
          validation: altTextWarning,
        },
      ],
      validation: imageSizeWarning,
    },
    {
      name: 'starRating',
      title: 'Star rating',
      type: 'number',
      description: 'Optional. 1–5 stars shown above the quote. Leave blank to hide the rating row entirely.',
      validation: (Rule) => Rule.min(1).max(5).integer(),
      options: {
        list: [
          {title: '★★★★★ (5)', value: 5},
          {title: '★★★★☆ (4)', value: 4},
          {title: '★★★☆☆ (3)', value: 3},
          {title: '★★☆☆☆ (2)', value: 2},
          {title: '★☆☆☆☆ (1)', value: 1},
        ],
        layout: 'radio',
      },
    },
    {
      name: 'source',
      title: 'Source',
      type: 'string',
      description:
        'Where this review came from. "Direct" hides the source badge entirely. Pick a platform to show a small "via [Platform]" line under the client name.',
      options: {
        list: [
          {title: 'Direct submission (no badge)', value: 'direct'},
          {title: 'Google', value: 'google'},
          {title: 'Facebook', value: 'facebook'},
          {title: 'Yelp', value: 'yelp'},
          {title: 'Other / Online review', value: 'other'},
        ],
        layout: 'radio',
      },
      initialValue: 'direct',
    },
    {
      name: 'sourceUrl',
      title: 'Source URL',
      type: 'url',
      description:
        'Optional. Link to the original review (e.g. the Google review URL). When set, the source badge becomes a small external link.',
      hidden: ({parent}) => !parent?.source || parent.source === 'direct',
    },
    {
      name: 'reviewDate',
      title: 'Review date',
      type: 'date',
      description:
        'Optional. Shown next to the source as "Google · May 2024". Use the date the review was originally posted.',
      hidden: ({parent}) => !parent?.source || parent.source === 'direct',
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Controls the order testimonials appear. Lower numbers appear first (e.g. 1, 2, 3).',
    },
  ],
  preview: {
    select: {
      title: 'client',
      subtitle: 'testimonial',
      media: 'image',
      starRating: 'starRating',
      source: 'source',
    },
    prepare({title, subtitle, media, starRating, source}) {
      const ratingStr = starRating ? '★'.repeat(starRating) + ' ' : ''
      const sourceStr = source && source !== 'direct' ? ` · ${source}` : ''
      return {
        title: `${ratingStr}${title || 'Untitled'}${sourceStr}`,
        subtitle,
        media,
      }
    },
  },
}
