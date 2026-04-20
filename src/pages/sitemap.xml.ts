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

export const GET: APIRoute = async () => {
  const [seo, singletons, pages, blogPosts, blogCats, portfolioCats] = await Promise.all([
    sanityClient.fetch(`*[_type == "seoSettings" && _id == "seoSettings"][0]{ siteUrl }`),
    sanityClient.fetch(`{
      "homepage":  *[_type == "homepagePage"  && _id == "homepagePage"][0]{ _updatedAt },
      "blog":      *[_type == "blogPage"      && _id == "blogPage"][0]    { slug, blogEnabled, _updatedAt },
      "portfolio": *[_type == "portfolio"     && _id == "portfolio"][0]   { slug, _updatedAt, "additionalGallerySlugs": additionalGalleries[defined(slug.current)].slug.current },
    }`),
    sanityClient.fetch(
      `*[_type == "page" && defined(slug.current)] | order(slug.current asc){
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
  const portfolioSlug = singletons?.portfolio?.slug?.current || 'portfolio';
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
    const blogSlug = singletons?.blog?.slug?.current || 'blog';
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
    <loc>${loc}</loc>
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
