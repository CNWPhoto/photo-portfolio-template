export default {
  name: 'photographer',
  title: 'Photographer',
  type: 'document',
  __experimental_actions: ['update', 'publish'], // singleton — no create/delete
  fields: [
    {
      name: 'name',
      title: 'Your Name',
      type: 'string',
      description: 'Your display name shown in the nav, footer, and About page.',
    },
    {
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'City or region shown under your name (e.g. "Denver, CO" or "Pacific Northwest").',
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'A short phrase shown in the hero below your name (e.g. "Capturing the bond between dogs and their people").',
    },
    {
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 4,
      description: 'A 2–4 sentence introduction shown in the About/Intro section. Write in first person.',
    },
    {
      name: 'specialty',
      title: 'Specialty',
      type: 'string',
      description: 'What you photograph (e.g. "pet photography", "newborn & family", "wedding"). Used in page copy and SEO.',
    },
    {
      name: 'approachText',
      title: 'Your Approach',
      type: 'text',
      rows: 4,
      description: 'A paragraph describing your photography style and approach. Shown in the Intro section alongside your bio.',
    },
    {
      name: 'profilePhoto',
      title: 'Profile Photo',
      type: 'image',
      description: 'Your headshot or a photo of you working. Shown in the About/Intro section.',
      options: {
        hotspot: true,
        crop: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Describe the photo (e.g. "Sarah kneeling down to photograph a puppy in a field").',
        },
      ],
    },
  ],
}
