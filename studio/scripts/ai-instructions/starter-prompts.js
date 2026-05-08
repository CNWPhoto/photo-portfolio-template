// Starter AI Assist instruction prompts for the photographer template.
//
// Annotations are stored per DOCUMENT TYPE (not per object/section type):
//   sanity.assist.schemaType.<documentType>
// with field paths in the plugin's dot/pipe notation:
//   - Object nesting: dot path (e.g. "seo.seoTitle")
//   - Array filters by _type: |_key:<typeName>| (e.g. "sections|_key:splitSection|.body")
//
// This file is the editable source of truth. Edit a prompt, re-run
// `npm run seed:ai-instructions` against any project, and the new prompt
// replaces the previously-seeded value at the same field path. Custom
// instructions added by editors via the Studio UI on paths NOT listed
// here are preserved by the seed (it merges, doesn't clobber the doc).

// ─── Reusable instruction definitions ────────────────────────────────────
// Each instruction has `title` (shown next to the sparkle) and `prompt`
// (multi-paragraph string; double newlines split into separate Portable
// Text blocks the way an editor authoring through the UI would do it).

const INSTRUCTIONS = {
  seoTitle: {
    title: 'Draft an SEO title',
    prompt: [
      "Write an SEO-friendly page title for this page in 50–60 characters.",
      "Use the page's heading and primary content as the basis. Lead with the most search-relevant phrase, not the brand name (the brand is appended automatically by the site template — do not include it).",
      "For local-service pages, include the city or region (e.g. \"Riverside\", \"Front Range\") when it's relevant to search intent.",
      "Avoid empty modifiers like \"best,\" \"premier,\" \"top,\" \"leading.\"",
      "Make it distinctly different from the SEO title of any other page on this site.",
      "Output: a clean title with proper capitalization. No quotes around the output. No trailing brand suffix.",
    ].join('\n\n'),
  },
  seoDescription: {
    title: 'Draft an SEO description',
    prompt: [
      "Write a meta description for this page in 150–160 characters.",
      "Use the page's heading and body content as the basis.",
      "Lead with the location (city + region) when it's relevant to local search; include the primary service (family photography, documentary photography, brand photography, whatever fits the page).",
      "Match the page's existing tone — conversational on About, descriptive on Portfolio, action-oriented on Contact, calm on Experience.",
      "End with a soft action verb (book, inquire, see, view) followed by a period. The output must end with proper terminal punctuation.",
      "Avoid generic words: \"best,\" \"premier,\" \"top,\" \"leading,\" \"award-winning.\"",
      "Make it distinctly different from descriptions on other pages of this site — don't reuse phrasing from sibling pages.",
      "Output: a single complete sentence (or two short sentences) with proper capitalization and a period at the end. No quotes around the output.",
    ].join('\n\n'),
  },
  heroSubheading: {
    title: 'Draft a hero subheading',
    prompt: [
      "Write a short subheading (8–14 words) that sits beneath the main hero heading.",
      "Use the heading as the anchor — the subheading should expand on or soften it, not repeat it.",
      "Tone: warm, human, specific. No marketing fluff.",
      "Avoid the words \"timeless,\" \"magical,\" \"perfect,\" \"capture,\" \"unforgettable.\"",
      "Plain language wins. If the heading is a statement, the subheading can be a quiet promise.",
    ].join('\n\n'),
  },
  splitBody: {
    title: 'Draft body copy',
    prompt: [
      "Write 1–2 short paragraphs of body copy for this section. Aim for 40–80 words total. Keep it tight — this is a sidebar-sized block of copy, not a page intro.",
      "Use the section's eyebrow and heading as the anchor. The eyebrow is the framing; the heading is the topic; the body should expand on the topic in the photographer's voice.",
      "Tone: warm, direct, conversational. Like a thoughtful friend explaining something — not a brochure.",
      "Sentences should be short to medium. Avoid em-dashes and avoid ALL CAPS.",
      "Avoid: \"timeless,\" \"capturing,\" \"magical,\" \"unforgettable,\" \"effortlessly,\" \"perfectly.\"",
      "Do not lead with a question. Do not end with a CTA — the section's CTA button handles that.",
      "Generate as portable text paragraphs.",
    ].join('\n\n'),
  },
  richTextBody: {
    title: 'Draft rich text body',
    prompt: [
      "Write 2–4 paragraphs of body copy for this section.",
      "Use the section's heading as the topic anchor. Body should expand on the topic specifically — pull in any location, niche, or service hints from elsewhere on the document if available.",
      "Tone: warm, direct, conversational. Sentences short to medium. No em-dashes. No ALL CAPS.",
      "Avoid generic photographer-marketing language: \"capturing magical moments,\" \"timeless memories,\" \"effortlessly,\" \"perfectly,\" \"unforgettable.\"",
      "If the page has a location reference, weave it in naturally rather than tacking it on.",
      "Generate as portable text paragraphs.",
    ].join('\n\n'),
  },
  pullQuote: {
    title: 'Draft a pull quote',
    prompt: [
      "Write a short pull quote (10–25 words) that captures the photographer's philosophy or approach in their own voice.",
      "First person where appropriate. Specific over general. Should sound like something someone would actually say, not marketing copy.",
      "Avoid: \"timeless,\" \"capturing,\" \"magical,\" \"unforgettable,\" \"effortlessly.\"",
      "If the document has body copy elsewhere, pull the strongest concrete idea from there and tighten it into a quote.",
    ].join('\n\n'),
  },
  ctaBandBody: {
    title: 'Draft CTA band body',
    prompt: [
      "Write 1–2 short sentences for the CTA band.",
      "Use the heading as the anchor. The body is the supporting line that nudges the reader to click.",
      "Specific, warm, low-pressure. Avoid hype. Avoid \"don't miss out,\" \"limited time,\" urgency tropes.",
      "Plain language wins.",
    ].join('\n\n'),
  },
  testimonialPolish: {
    title: 'Polish testimonial wording',
    prompt: [
      "Lightly polish this testimonial for clarity and flow without changing its meaning, voice, or specifics.",
      "Keep the client's natural cadence. Fix obvious typos. Don't add details that weren't there.",
      "Don't make it sound more marketing-y. The roughness is part of why it reads as authentic.",
      "Output the polished version, no preamble.",
    ].join('\n\n'),
  },
  blogBody: {
    title: 'Draft blog body',
    prompt: [
      "Write 3–6 paragraphs of blog body copy for this post.",
      "Use the post title and any existing intro as the anchor. Speak in the photographer's first-person voice.",
      "Tone: warm, conversational, specific. Storytelling beats listicle. Sentences short to medium.",
      "If location, season, or session-type details are present elsewhere in the post, weave them in naturally.",
      "Avoid: \"timeless,\" \"capturing magical moments,\" \"effortlessly,\" \"perfectly,\" \"unforgettable,\" \"breathtaking.\"",
      "End with a soft pivot toward inquiry without a hard sell.",
      "Generate as portable text paragraphs.",
    ].join('\n\n'),
  },
}

// ─── Field path bundles by document role ─────────────────────────────────
// Reused across multiple document types so the SEO instruction (etc.) is
// defined once and applied wherever it makes sense.

const SEO_PATH_FIELDS = [
  {path: 'seo.seoTitle', instructions: [INSTRUCTIONS.seoTitle]},
  {path: 'seo.seoDescription', instructions: [INSTRUCTIONS.seoDescription]},
]

// Section-embedded fields. Path syntax: sections|_key:<sectionType>|.<field>
const SECTION_FIELDS = [
  {path: 'sections|_key:heroSection|.subheading', instructions: [INSTRUCTIONS.heroSubheading]},
  {path: 'sections|_key:splitSection|.body', instructions: [INSTRUCTIONS.splitBody]},
  {path: 'sections|_key:richTextSection|.body', instructions: [INSTRUCTIONS.richTextBody]},
  {path: 'sections|_key:pullQuoteSection|.quote', instructions: [INSTRUCTIONS.pullQuote]},
  {path: 'sections|_key:ctaBandSection|.body', instructions: [INSTRUCTIONS.ctaBandBody]},
]

// ─── Per-document-type configuration ─────────────────────────────────────

export const annotations = [
  // Page-builder docs that have BOTH seo + sections
  {documentType: 'page', title: 'Page', fields: [...SEO_PATH_FIELDS, ...SECTION_FIELDS]},
  {documentType: 'homepagePage', title: 'Homepage', fields: [...SEO_PATH_FIELDS, ...SECTION_FIELDS]},
  {documentType: 'portfolio', title: 'Portfolio', fields: [...SEO_PATH_FIELDS, ...SECTION_FIELDS]},
  {documentType: 'blogPage', title: 'Blog', fields: [...SEO_PATH_FIELDS, ...SECTION_FIELDS]},

  // SEO-only singletons (no sections array)
  {documentType: 'notFoundPage', title: '404 Page', fields: SEO_PATH_FIELDS},
  {documentType: 'termsAndConditionsPage', title: 'Terms & Conditions', fields: SEO_PATH_FIELDS},
  {documentType: 'privacyPolicyPage', title: 'Privacy Policy', fields: SEO_PATH_FIELDS},

  // Blog post: SEO + body (Portable Text at doc root, not inside sections)
  {
    documentType: 'blogPost',
    title: 'Blog Post',
    fields: [
      ...SEO_PATH_FIELDS,
      {path: 'body', instructions: [INSTRUCTIONS.blogBody]},
    ],
  },

  // Testimonial: standalone doc with a `testimonial` text field
  {
    documentType: 'testimonial',
    title: 'Testimonial',
    fields: [{path: 'testimonial', instructions: [INSTRUCTIONS.testimonialPolish]}],
  },
]

export default annotations
