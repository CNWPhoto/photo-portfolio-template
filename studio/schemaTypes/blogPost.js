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
      description: 'The URL for this post (e.g. "morning-in-the-studio" → /blog/morning-in-the-studio). Click "Generate" to create from the title.',
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
      description: 'The main image for this post. Shown at the top of the post page and on the blog listing. Landscape images work best.',
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
        },
      ],
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Choose the category that best fits this post. Shown as a label above the title.',
      options: {
        list: [
          {title: 'On Location', value: 'On Location'},
          {title: 'Portraits', value: 'Portraits'},
          {title: 'Behind the Scenes', value: 'Behind the Scenes'},
          {title: 'Tips & Advice', value: 'Tips & Advice'},
          {title: 'Client Stories', value: 'Client Stories'},
        ],
        allowInput: true,
      },
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
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alt text',
              description: 'Describe the image for accessibility and SEO',
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
