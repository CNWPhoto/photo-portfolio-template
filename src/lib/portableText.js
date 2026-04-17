import { toHTML } from '@portabletext/to-html';

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const safeHref = (href) => (/^(https?:|mailto:|tel:|\/|#)/i.test(href) ? href : '#');

const defaultComponents = {
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
    link: ({ children, value }) =>
      `<a href="${esc(safeHref(value?.href || ''))}" target="_blank" rel="noopener noreferrer">${children}</a>`,
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
  return Array.isArray(value) && value.length > 0 && value.some((b) => b && b._type === 'block');
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
