import { toHTML } from '@portabletext/to-html';

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const safeHref = (href) => (/^(https?:|mailto:|tel:|\/|#)/i.test(href) ? href : '#');

// Render a prose link. Internal targets — relative paths (/…), in-page
// anchors (#…), tel: and mailto: — open in the SAME tab; forcing a new tab
// on internal navigation (e.g. migrated category links) is a UX bug. Only
// genuinely external http(s) links get target=_blank + rel. Shared with the
// blog post renderer so both behave identically.
export function renderLink(href, children) {
  const safe = safeHref(href || '');
  const external = /^https?:\/\//i.test(safe);
  const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<a href="${esc(safe)}"${attrs}>${children}</a>`;
}


// Sanity asset refs encode their pixel dimensions —
// image-<hash>-2000x1500-jpg — so width/height can be set without
// dereferencing the asset in GROQ. That matters here: the section
// projection dereferences `image` and `images[]`, but not assets nested
// inside a rich-text body, so an inline image would otherwise render with
// no dimensions and shift the page as it loads.
function dimsFromRef(ref) {
  const m = /-(\d+)x(\d+)-[a-z]+$/i.exec(String(ref || ''));
  if (!m) return null;
  return { width: Number(m[1]), height: Number(m[2]) };
}

// Build the CDN URL straight from the asset ref rather than importing
// buildSrc. lib/image imports the Sanity client, which imports the
// Workers-only `cloudflare:workers` module — pulling that into this pure
// renderer breaks it everywhere it isn't running on workerd, tests included.
// The ref carries everything needed: image-<id>-<w>x<h>-<ext>.
const PROJECT_ID = import.meta.env?.PUBLIC_SANITY_PROJECT_ID || 'hx5xgigp';
const DATASET = import.meta.env?.PUBLIC_SANITY_DATASET || 'production';

function cdnUrl(ref, width) {
  const m = /^image-([a-f0-9]+)-(\d+x\d+)-([a-z]+)$/i.exec(String(ref || ''));
  if (!m) return '';
  const base = `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${m[1]}-${m[2]}.${m[3]}`;
  return `${base}?w=${width}&auto=format&q=80`;
}

const defaultComponents = {
  // Inline images in a rich-text body. Without this the schema could offer
  // an image block that rendered as nothing at all.
  types: {
    image: ({ value }) => {
      if (!value?.asset) return '';
      const src = cdnUrl(value.asset._ref, 1200);
      if (!src) return '';
      const d = dimsFromRef(value.asset._ref);
      const dims = d ? ` width="${d.width}" height="${d.height}"` : '';
      const caption = value.caption
        ? `<figcaption class="pt-figure__caption">${esc(value.caption)}</figcaption>`
        : '';
      return (
        `<figure class="pt-figure">` +
        `<img src="${esc(src)}" srcset="${esc([400, 800, 1200, 1600].map((w) => `${cdnUrl(value.asset._ref, w)} ${w}w`).join(', '))}" ` +
        `sizes="(max-width: 900px) 100vw, 760px" alt="${esc(value.alt || '')}" ` +
        `loading="lazy" decoding="async"${dims} />` +
        caption +
        `</figure>`
      );
    },
  },
  block: {
    normal: ({ children }) => `<p>${children}</p>`,
    h2: ({ children }) => `<h2>${children}</h2>`,
    h3: ({ children }) => `<h3>${children}</h3>`,
    h4: ({ children }) => `<h4>${children}</h4>`,
    blockquote: ({ children }) => `<blockquote>${children}</blockquote>`,
  },
  marks: {
    strong: ({ children }) => `<strong>${children}</strong>`,
    em: ({ children }) => `<em>${children}</em>`,
    underline: ({ children }) => `<u>${children}</u>`,
    link: ({ children, value }) => renderLink(value?.href || '', children),
  },
  list: {
    bullet: ({ children }) => `<ul>${children}</ul>`,
    number: ({ children }) => `<ol>${children}</ol>`,
  },
  listItem: {
    bullet: ({ children }) => `<li>${children}</li>`,
    number: ({ children }) => `<li>${children}</li>`,
  },
};

export function isPortableText(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.some((b) => b && (b._type === 'block' || b._type === 'image'))
  );
}

/**
 * Render portable text to HTML. If `value` is a plain string, each blank-line
 * separated chunk becomes a <p>. Returns '' for empty input.
 */
export function renderBody(value, options = {}) {
  const className = options.className ? ` class="${esc(options.className)}"` : '';
  if (isPortableText(value)) {
    const html = toHTML(value, { components: defaultComponents });
    if (!className) return html;
    return html.replace(/<p>/g, `<p${className}>`);
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/\n{2,}/)
      .map((chunk) => `<p${className}>${esc(chunk.trim()).replace(/\n/g, '<br />')}</p>`)
      .join('');
  }
  return '';
}

/**
 * Flatten Portable Text (or a plain string) to a single plain string.
 * Used for JSON-LD fields that MUST be strings per schema.org spec
 * (e.g. FAQPage Answer.text, Article.description). Passing a raw
 * Portable Text array here produces invalid structured data that
 * Google's Rich Results Test will reject — silent SEO regression.
 *
 * Spans within a block are joined with no separator; blocks are joined
 * with a single space. Empty input returns ''.
 */
export function portableTextToString(value) {
  if (typeof value === 'string') return value.trim();
  if (!isPortableText(value)) return '';
  return value
    .map((block) =>
      (block.children || [])
        .filter((c) => c && c._type === 'span' && typeof c.text === 'string')
        .map((c) => c.text)
        .join(''),
    )
    .filter(Boolean)
    .join(' ')
    .trim();
}

/**
 * Render an array of fallback paragraph strings as <p> elements (used when
 * Sanity has no content yet). Skips empty strings.
 */
export function renderParagraphs(paragraphs, options = {}) {
  const className = options.className ? ` class="${esc(options.className)}"` : '';
  return paragraphs
    .filter((p) => typeof p === 'string' && p.trim())
    .map((p) => `<p${className}>${esc(p)}</p>`)
    .join('');
}
