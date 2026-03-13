/**
 * Builds a Sanity CDN image URL with transformation params.
 * Strips any existing params from the base URL before adding new ones.
 */
export function sanityImg(url: string, width: number, quality = 82): string {
  if (!url) return '';
  const base = url.split('?')[0];
  return `${base}?w=${width}&auto=format&fit=max&q=${quality}`;
}

/**
 * Builds a srcset string for a Sanity image at multiple widths.
 */
export function sanitySrcset(url: string, widths: number[], quality = 82): string {
  if (!url) return '';
  const base = url.split('?')[0];
  return widths.map(w => `${base}?w=${w}&auto=format&fit=max&q=${quality} ${w}w`).join(', ');
}
