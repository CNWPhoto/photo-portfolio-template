// Page-selector panel for the Presentation tool (the "navigator" slot).
// Lists every routable page — singletons, custom pages, blog posts — so
// editors click to jump the preview iframe instead of typing paths into
// the address bar. Live-updates when pages/posts are created or renamed.
//
// Hrefs are emitted slashed to match the site's trailingSlash:'always'
// (same rule as src/lib/links.js pathForInternal).

import {useCallback, useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'
import {usePresentationNavigate, usePresentationParams} from 'sanity/presentation'
import {Box, Button, Label, Spinner, Stack} from '@sanity/ui'

const QUERY = `{
  "pages": *[_type == "page" && defined(slug.current)]{_id, title, "slug": slug.current},
  "posts": *[_type == "blogPost" && defined(slug.current)]{_id, title, "slug": slug.current, publishDate},
  "blogBase": coalesce(*[_id == "blogPage"][0].slug.current, "blog")
}`

// Studio clients read the raw perspective: a doc with an unpublished draft
// comes back twice (`drafts.<id>` + `<id>`). Collapse to one entry per
// logical document, preferring published (same dedupe as the structure's
// Pages list).
function dedupeDrafts(docs) {
  const byBaseId = new Map()
  for (const d of docs) {
    const baseId = d._id.replace(/^drafts\./, '')
    const existing = byBaseId.get(baseId)
    const thisIsDraft = d._id.startsWith('drafts.')
    if (!existing || (existing._id.startsWith('drafts.') && !thisIsDraft)) {
      byBaseId.set(baseId, {...d, _id: baseId})
    }
  }
  return Array.from(byBaseId.values())
}

function NavItem({href, title, active, navigate}) {
  const onClick = useCallback(() => navigate(href), [navigate, href])
  return (
    <Button
      mode="bleed"
      tone={active ? 'primary' : 'default'}
      selected={active}
      justify="flex-start"
      fontSize={1}
      padding={2}
      text={title}
      onClick={onClick}
    />
  )
}

export default function PresentationNavigator() {
  const client = useClient({apiVersion: '2026-01-01'})
  const navigate = usePresentationNavigate()
  const params = usePresentationParams()
  const [data, setData] = useState(null)

  const load = useCallback(() => {
    client.fetch(QUERY).then(setData).catch(() => setData({pages: [], posts: [], blogBase: 'blog'}))
  }, [client])

  useEffect(() => {
    load()
    // Refresh the list when pages/posts change (new page, rename, delete).
    // Debounced — mutation bursts (e.g. publish) fire several events.
    let timer
    const sub = client
      .listen(`*[_type in ["page", "blogPost", "blogPage"]]`, {}, {visibility: 'query', events: ['mutation']})
      .subscribe(() => {
        clearTimeout(timer)
        timer = setTimeout(load, 1500)
      })
    return () => {
      clearTimeout(timer)
      sub.unsubscribe()
    }
  }, [client, load])

  // Current iframe path for highlighting. The preview param is a relative
  // path right after navigate(), but a full URL (origin + query) after a
  // reload — parse the pathname either way, and normalize the trailing
  // slash so /about and /about/ both highlight the About entry.
  let current = params?.preview || '/'
  try {
    current = new URL(current, 'http://relative.invalid').pathname
  } catch {
    current = '/'
  }
  current = current.replace(/\/+$/, '') || '/'
  const isActive = (href) => (href.replace(/\/+$/, '') || '/') === current

  const items = useMemo(() => {
    if (!data) return null
    const blogBase = (data.blogBase || 'blog').replace(/^\/+|\/+$/g, '') || 'blog'
    const pages = dedupeDrafts(data.pages)
      .filter((p) => p.slug !== 'home')
      .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    const posts = dedupeDrafts(data.posts).sort((a, b) =>
      (b.publishDate || '').localeCompare(a.publishDate || ''),
    )
    return {
      main: [
        {href: '/', title: 'Homepage'},
        ...pages.map((p) => ({href: `/${p.slug}/`, title: p.title || p.slug})),
        {href: '/portfolio/', title: 'Portfolio'},
        {href: `/${blogBase}/`, title: 'Blog'},
        {href: '/404', title: '404 page'},
      ],
      posts: posts.map((p) => ({href: `/${blogBase}/${p.slug}/`, title: p.title || p.slug})),
    }
  }, [data])

  if (!items) {
    return (
      <Box padding={4}>
        <Spinner muted />
      </Box>
    )
  }

  return (
    <Box padding={2} style={{overflowY: 'auto'}}>
      <Stack space={1}>
        <Box padding={2} paddingBottom={1}>
          <Label size={0} muted>
            Pages
          </Label>
        </Box>
        {items.main.map((item) => (
          <NavItem key={item.href} {...item} active={isActive(item.href)} navigate={navigate} />
        ))}
        {items.posts.length > 0 && (
          <>
            <Box padding={2} paddingBottom={1} paddingTop={3}>
              <Label size={0} muted>
                Blog posts
              </Label>
            </Box>
            {items.posts.map((item) => (
              <NavItem key={item.href} {...item} active={isActive(item.href)} navigate={navigate} />
            ))}
          </>
        )}
      </Stack>
    </Box>
  )
}
