export default {
  name: 'photographer',
  title: 'Photographer',
  type: 'document',
  __experimental_actions: ['update', 'publish'], // singleton — no create/delete
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
    },
    {
      name: 'location',
      title: 'Location',
      type: 'string',
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
    },
    {
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 4,
    },
    {
      name: 'specialty',
      title: 'Specialty',
      type: 'string',
      description: 'What you photograph (e.g. "pet photography", "newborn & family", "wedding")',
    },
    {
      name: 'approachText',
      title: 'Your Approach',
      type: 'text',
      rows: 4,
    },
    {
      name: 'heroImages',
      title: 'Hero Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
            crop: true,
          },
          fields: [
            {
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
            },
          ],
        },
      ],
    },
    {
      name: 'profilePhoto',
      title: 'Profile Photo',
      type: 'image',
      options: {
        hotspot: true,
        crop: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
        },
      ],
    },
  ],
}
