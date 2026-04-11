/**
 * Shared image utilities — single source of truth for all Sanity image rendering.
 * Import buildSrc, buildSrcset, and getDimensions here rather than constructing
 * image URLs manually in components.
 */
import { urlFor } from './sanity';

const DEFAULT_WIDTHS = [400, 800, 1200, 1600, 2000, 2400];

// Default quality for body images. Hero / cover images bump to 85 via the
// `quality` param so above-fold imagery looks visibly sharper. ~5% larger
// payload, but only on the few images visitors see first.
export function buildSrc(image: any, width = 1200, quality = 80): string {
  if (!image?.asset) return '';
  return urlFor(image).width(width).auto('format').quality(quality).url();
}

export function buildSrcset(
  image: any,
  widths: number[] = DEFAULT_WIDTHS,
  quality = 80,
): string {
  if (!image?.asset) return '';
  return widths
    .map((w) => `${urlFor(image).width(w).auto('format').quality(quality).url()} ${w}w`)
    .join(', ');
}

export function getDimensions(image: any): { width: number; height: number; aspectRatio: number } {
  return image?.asset?.metadata?.dimensions ?? { width: 1200, height: 800, aspectRatio: 1.5 };
}
