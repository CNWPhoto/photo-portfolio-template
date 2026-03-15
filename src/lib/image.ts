/**
 * Shared image utilities — single source of truth for all Sanity image rendering.
 * Import buildSrc, buildSrcset, and getDimensions here rather than constructing
 * image URLs manually in components.
 */
import { urlFor } from './sanity';

const DEFAULT_WIDTHS = [400, 800, 1200, 1600, 2000];

export function buildSrc(image: any, width = 1200): string {
  if (!image?.asset) return '';
  return urlFor(image).width(width).auto('format').quality(80).url();
}

export function buildSrcset(image: any, widths: number[] = DEFAULT_WIDTHS): string {
  if (!image?.asset) return '';
  return widths
    .map(w => `${urlFor(image).width(w).auto('format').quality(80).url()} ${w}w`)
    .join(', ');
}

export function getDimensions(image: any): { width: number; height: number; aspectRatio: number } {
  return image?.asset?.metadata?.dimensions ?? { width: 1200, height: 800, aspectRatio: 1.5 };
}
