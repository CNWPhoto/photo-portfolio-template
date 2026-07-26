import type { APIRoute } from 'astro';
import { sanityClient } from '../lib/sanity.js';

// XML sitemap. Updated for the unified page model: queries the new `page`
// doc list plus the singletons (homepage, blog index, portfolio index) and
// every blog post + every category landing page. Category pages are listed
// for crawl discovery even though they emit noindex,follow — sitemaps are
// crawl signals, not indexing demands.
//
// See docs/page-builder-spec.md §7b.

type Entry = { loc: string; lastmod: string; changefreq: string; priority: string };

const fmt = (iso?: string) => (iso ? iso.slice(0, 10) : new Date().toISOString().slice(0, 10));

// Escape the five XML predefined entities — `loc` is built from
// editor-controlled siteUrl + slugs, and a stray `&` produces a sitemap
// that fails to parse entirely.
const xmlEscape = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Canonical URLs are slashed (astro.config trailingSlash: 'always'), so the
// sitemap must list slashed locs too — otherwise every entry 308-redirects
// and advertises a non-canonical URL. Root stays bare.
//
// Also collapses duplicate slashes in the path. Every loc below is built by
// interpolating editor-supplied slugs, and a slug saved with a stray leading
// slash ("/blog") yielded "https://site.com//blog/" — which resolves 200, so
// Google can index the whole blog a second time at a path the pages
// themselves canonicalise away from. Normalising centrally means no future
// loc can reintroduce it. The "://" in the origin is preserved.
const slashed = (loc: string) => {
	const normalized = loc.replace(/([^:])\/{2,}/g, '$1/');
	return normalized.endsWith('/') ? normalized : `${normalized}/`;
};

export const GET: APIRoute = async () => {
  const [seo, singletons, pages, blogPosts, blogCats, portfolioCats] = await Promise.all([
    sanityClient.fetch(`*[_type == "seoSettings" && _id == "seoSettings"][0]{ siteUrl }`),
    sanityClient.fetch(`{
      "homepage":  *[_type == "homepagePage"  && _id == "homepagePage"][0]{ _updatedAt },
      "blog":      *[_type == "blogPage"      && _id == "blogPage"][0]    { slug, blogEnabled, _updatedAt },
      "portfolio": *[_type == "portfolio"     && _id == "portfolio"][0]   { slug, _updatedAt, "additionalGallerySlugs": additionalGalleries[defined(slug.current)].slug.current },
    }`),
    sanityClient.fetch(
      // `seo.hideFromSearch != true` drops pages the editor has flagged
      // "hide from search" — they emit noindex, so they must not be in the sitemap.
      `*[_type == "page" && defined(slug.current) && seo.hideFromSearch != true] | order(slug.current asc){
        "slug": slug.current,
        _updatedAt
      }`,
    ),
    sanityClient.fetch(
      `*[_type == "blogPost" && defined(slug.current)] | order(publishDate desc){
        slug, publishDate, _updatedAt
      }`,
    ),
    sanityClient.fetch(
      `*[_type == "blogCategory" && defined(slug.current)] | order(slug.current asc){
        "slug": slug.current,
        _updatedAt
      }`,
    ),
    sanityClient.fetch(
      `*[_type == "portfolioCategory" && defined(slug.current)] | order(slug.current asc){
        "slug": slug.current,
        _updatedAt
      }`,
    ),
  ]);

  const base = (seo?.siteUrl || '').replace(/\/$/, '');
  if (!base) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
    );
  }

  const urls: Entry[] = [];

  // ── Homepage ────────────────────────────────────────────────────────
  urls.push({
    loc: base,
    lastmod: fmt(singletons?.homepage?._updatedAt),
    changefreq: 'weekly',
    priority: '1.0',
  });

  // ── Portfolio singleton ─────────────────────────────────────────────
  // The portfolio route is FIXED at /portfolio (src/pages/portfolio.astro;
  // Presentation hardcodes it too) — unlike the blog, there is no middleware
  // rewrite honouring a custom base. Deriving the sitemap path from
  // portfolio.slug therefore advertised URLs the site does not serve: a client
  // whose slug was "Portfolio" had every portfolio URL in their sitemap 404
  // (5 of 9 entries). Use the real route; keep the slug out of it.
  const portfolioSlug = 'portfolio';
  urls.push({
    loc: `${base}/${portfolioSlug}`,
    lastmod: fmt(singletons?.portfolio?._updatedAt),
    changefreq: 'weekly',
    priority: '0.9',
  });

  // Additional galleries (tab-linked secondary galleries)
  for (const gSlug of singletons?.portfolio?.additionalGallerySlugs ?? []) {
    if (!gSlug) continue;
    urls.push({
      loc: `${base}/${portfolioSlug}/${gSlug}`,
      lastmod: fmt(singletons?.portfolio?._updatedAt),
      changefreq: 'weekly',
      priority: '0.7',
    });
  }

  // ── Unified page docs (about, contact, experience, anything custom) ─
  for (const page of pages ?? []) {
    if (!page?.slug) continue;
    urls.push({
      loc: `${base}/${page.slug}`,
      lastmod: fmt(page._updatedAt),
      changefreq: 'monthly',
      priority: '0.8',
    });
  }

  // ── Blog index + posts ──────────────────────────────────────────────
  if (singletons?.blog?.blogEnabled !== false) {
    // Strip stray leading/trailing slashes exactly as the middleware does
    // (src/middleware.ts) — a slug saved as "/blog" produced "//blog/" locs,
    // a crawlable duplicate of every blog URL that the pages themselves
    // canonicalise away from.
    const blogSlug = (singletons?.blog?.slug?.current || 'blog').replace(/^\/+|\/+$/g, '') || 'blog';
    urls.push({
      loc: `${base}/${blogSlug}`,
      lastmod: fmt(singletons?.blog?._updatedAt),
      changefreq: 'weekly',
      priority: '0.7',
    });

    for (const post of blogPosts ?? []) {
      if (!post?.slug?.current) continue;
      urls.push({
        loc: `${base}/${blogSlug}/${post.slug.current}`,
        lastmod: fmt(post._updatedAt || post.publishDate),
        changefreq: 'monthly',
        priority: '0.6',
      });
    }

    for (const cat of blogCats ?? []) {
      if (!cat?.slug) continue;
      urls.push({
        loc: `${base}/${blogSlug}/category/${cat.slug}`,
        lastmod: fmt(cat._updatedAt),
        changefreq: 'monthly',
        priority: '0.4',
      });
    }
  }

  // ── Portfolio category pages ────────────────────────────────────────
  for (const cat of portfolioCats ?? []) {
    if (!cat?.slug) continue;
    urls.push({
      loc: `${base}/${portfolioSlug}/category/${cat.slug}`,
      lastmod: fmt(cat._updatedAt),
      changefreq: 'monthly',
      priority: '0.4',
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, lastmod, changefreq, priority }) => `  <url>
    <loc>${xmlEscape(slashed(loc))}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
