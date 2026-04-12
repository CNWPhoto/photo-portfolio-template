import {imageSizeWarning, altTextWarning} from './_shared/imageValidation'

export default {
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Post Title',
      type: 'string',
      description: 'The headline for this blog post. Keep it clear and compelling — it appears on the blog listing page and at the top of the post. Also used as the SEO title for this post.',
    },
    {
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      description: 'The URL for this post (e.g. "morning-in-the-studio" → /blog/morning-in-the-studio). Click "Generate" to create from the title. ⚠️ Avoid changing this once the post is live — it will break existing links and hurt your search rankings. If you must change it, set up a 301 redirect from the old URL to the new one in your hosting settings.',
      options: {
        source: 'title',
        maxLength: 96,
      },
    },
    {
      name: 'publishDate',
      title: 'Publish Date',
      type: 'date',
      description: 'The date shown on the post. Posts are sorted newest-first on the blog page.',
    },
    {
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'A 1–2 sentence summary shown on the blog listing page below the post title. Write something that makes readers want to click. Also used as the SEO meta description for this post.',
    },
    {
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      description: 'The main image for this post. Shown at the top of the post page and on the blog listing. Landscape images work best. Resize to 2500–3000px on the long edge before uploading; keep file size under 5MB.',
      options: {
        hotspot: true,
        crop: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Describe the image for accessibility and SEO (e.g. "Two dogs playing fetch at Wash Park in Denver").',
          validation: altTextWarning,
        },
      ],
      validation: imageSizeWarning,
    },
    {
      name: 'categories',
      title: 'Categories',
      type: 'array',
      description:
        'Keep categories minimal. 1–2 per post is best. Don\'t use categories for keyword stuffing — it dilutes SEO and confuses readers.',
      of: [{type: 'reference', to: [{type: 'blogCategory'}]}],
      options: {
        // allow inline creation of new categories from the picker
        disableNew: false,
      },
      validation: (Rule) => Rule.min(1).max(3),
    },
    {
      name: 'body',
      title: 'Post Body',
      type: 'array',
      description: 'The full content of your post. Use H2/H3 for section headings, Quote for pull quotes, and the image button to insert photos inline.',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'Quote', value: 'blockquote'},
          ],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                  },
                ],
              },
            ],
          },
        },
        {
          type: 'object',
          name: 'videoEmbed',
          title: 'Video Embed',
          fields: [
            {
              name: 'url',
              title: 'Video URL',
              type: 'url',
              description: 'Paste a YouTube or Vimeo URL (e.g. https://www.youtube.com/watch?v=...).',
            },
            {
              name: 'caption',
              title: 'Caption',
              type: 'string',
              description: 'Optional caption displayed below the video.',
            },
          ],
          preview: {
            select: {title: 'url', subtitle: 'caption'},
            prepare({title, subtitle}) {
              return {title: subtitle || 'Video', subtitle: title}
            },
          },
        },
        {
          type: 'image',
          options: {hotspot: true},
          validation: imageSizeWarning,
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alt text',
              description: 'Describe the image for accessibility and SEO',
              validation: altTextWarning,
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
              description: 'Optional caption displayed below the image',
            },
          ],
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'publishDate',
      media: 'coverImage',
    },
  },
}
