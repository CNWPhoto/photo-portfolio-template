import type { APIRoute } from 'astro';
import { sanityClient } from '../lib/sanity.js';

export const GET: APIRoute = async () => {
  const [seo, pages, blogPosts] = await Promise.all([
    sanityClient.fetch(
      `*[_type == "seoSettings" && _id == "seoSettings"][0]{ siteUrl }`
    ),
    sanityClient.fetch(`{
      "homepage": *[_type == "homepagePage" && _id == "homepagePage"][0]{ _updatedAt },
      "about":    *[_type == "aboutPage"    && _id == "aboutPage"][0]   { slug, _updatedAt },
      "exp":      *[_type == "experiencePage" && _id == "experiencePage"][0]{ slug, _updatedAt },
      "contact":  *[_type == "contactPage"  && _id == "contactPage"][0] { slug, _updatedAt },
      "blog":     *[_type == "blogPage"     && _id == "blogPage"][0]    { slug, blogEnabled, _updatedAt },
      "portfolio":*[_type == "portfolio"    && _id == "portfolio"][0]   { slug, _updatedAt },
    }`),
    sanityClient.fetch(
      `*[_type == "blogPost" && defined(slug.current)] | order(publishDate desc){ slug, publishDate, _updatedAt }`
    ),
  ]);

  const base = (seo?.siteUrl || '').replace(/\/$/, '');
  if (!base) {
    // No siteUrl configured yet — return empty sitemap rather than broken URLs
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
    );
  }

  const fmt = (iso?: string) => iso ? iso.slice(0, 10) : new Date().toISOString().slice(0, 10);

  type Entry = { loc: string; lastmod: string; changefreq: string; priority: string };
  const urls: Entry[] = [];

  // Homepage
  urls.push({
    loc: base,
    lastmod: fmt(pages?.homepage?._updatedAt),
    changefreq: 'weekly',
    priority: '1.0',
  });

  // Static pages — use slug from Sanity if set, otherwise fall back to known defaults
  const staticPages: Array<{ data: any; fallback: string; changefreq: string; priority: string }> = [
    { data: pages?.portfolio, fallback: 'portfolio', changefreq: 'weekly',  priority: '0.9' },
    { data: pages?.about,     fallback: 'about',     changefreq: 'monthly', priority: '0.8' },
    { data: pages?.exp,       fallback: 'experience',changefreq: 'monthly', priority: '0.8' },
    { data: pages?.contact,   fallback: 'contact',   changefreq: 'monthly', priority: '0.8' },
  ];

  for (const { data, fallback, changefreq, priority } of staticPages) {
    const slug = data?.slug?.current || fallback;
    urls.push({ loc: `${base}/${slug}`, lastmod: fmt(data?._updatedAt), changefreq, priority });
  }

  // Blog listing — only include when blog is enabled
  if (pages?.blog?.blogEnabled !== false) {
    const blogSlug = pages?.blog?.slug?.current || 'blog';
    urls.push({
      loc: `${base}/${blogSlug}`,
      lastmod: fmt(pages?.blog?._updatedAt),
      changefreq: 'weekly',
      priority: '0.7',
    });

    // Individual blog posts
    for (const post of blogPosts ?? []) {
      if (!post?.slug?.current) continue;
      const lastmod = fmt(post._updatedAt || post.publishDate);
      urls.push({
        loc: `${base}/${blogSlug}/${post.slug.current}`,
        lastmod,
        changefreq: 'monthly',
        priority: '0.6',
      });
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ loc, lastmod, changefreq, priority }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
