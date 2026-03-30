import type { APIRoute } from 'astro';
import { sanityClient } from '../lib/sanity.js';

export const GET: APIRoute = async ({ site, request }) => {
  const seo = await sanityClient.fetch(
    `*[_type == "seoSettings" && _id == "seoSettings"][0]{ siteUrl }`
  );

  const requestOrigin = new URL(request.url).origin;
  const base = (seo?.siteUrl || site?.origin || requestOrigin).replace(/\/$/, '');

  const content = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${base}/sitemap.xml
`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
