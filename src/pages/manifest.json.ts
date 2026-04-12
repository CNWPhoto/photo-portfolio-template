import type { APIRoute } from 'astro';
import { sanityClient } from '../lib/sanity.js';

// Web app manifest. Reads the active palette's bg color from the new
// siteSettings.palettes data and uses it as theme_color / background_color.
// Falls back to the legacy hardcoded Classic Cream value when palettes
// haven't been seeded yet (Phase 11) or are misconfigured.
//
// See docs/page-builder-spec.md §7b.

const FALLBACK_BG = '#f5f3ef';

export const GET: APIRoute = async () => {
  const settings = await sanityClient.fetch(
    `*[_type == "siteSettings" && _id == "siteSettings"][0]{
      siteName,
      defaultPalette,
      "palettes": palettes[]{ "slug": slug.current, bg }
    }`,
  );

  const siteName = settings?.siteName || 'Photo Portfolio';
  const palettes: Array<{ slug?: string; bg?: string }> = settings?.palettes || [];
  const activeSlug = settings?.defaultPalette || null;

  let themeColor = FALLBACK_BG;
  if (activeSlug && palettes.length) {
    const match = palettes.find((p) => p?.slug === activeSlug);
    if (match?.bg) themeColor = match.bg;
  } else if (palettes[0]?.bg) {
    themeColor = palettes[0].bg;
  }

  const manifest = {
    name: siteName,
    short_name: siteName,
    description: `${siteName} — Professional Photography`,
    start_url: '/',
    display: 'standalone',
    background_color: themeColor,
    theme_color: themeColor,
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
