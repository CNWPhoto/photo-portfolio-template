import type { APIRoute } from 'astro';
import { sanityClient } from '../lib/sanity.js';

export const GET: APIRoute = async () => {
  const settings = await sanityClient.fetch(
    `*[_type == "siteSettings" && _id == "siteSettings"][0]{ siteName, colorTheme }`
  );

  const THEME_BG: Record<string, string> = {
    'classic-cream':  '#f5f3ef',
    'warm-studio':    '#fdf6ee',
    'dark-editorial': '#1a1a1a',
    'cool-minimal':   '#f8f9fa',
    'forest-sage':    '#f2f4f0',
  };

  const siteName   = settings?.siteName   || 'Photo Portfolio';
  const colorTheme = settings?.colorTheme || 'classic-cream';
  const themeColor = THEME_BG[colorTheme] ?? '#f5f3ef';

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
