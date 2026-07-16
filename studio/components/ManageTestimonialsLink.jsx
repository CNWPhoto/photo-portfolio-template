import {Button, Stack, Text} from '@sanity/ui'
import {useWorkspace} from 'sanity'

// Custom input rendered inside the testimonialsSection field list. The
// schema field it's attached to has no actual value — this component
// just renders a button that navigates to the Studio's testimonials list.
//
// The href is built from the workspace's basePath rather than hardcoded.
// Sanity resolves basePath as joinBasePath(studioBasePath, workspaceBasePath),
// so it is '/' on a Studio served at the domain root (localhost:3333,
// <project>.sanity.studio) and '/studio' on the embedded Studio. A hardcoded
// '/structure/testimonial' escapes the embedded Studio entirely and lands on
// the Astro site's routes, which 404.
//
// The trailing slash is required, not cosmetic: the embedded Studio's route is
// injected by @sanity/astro and is subject to the site's trailingSlash:'always',
// so a full page load of '/studio/structure/testimonial' 404s while
// '/studio/structure/testimonial/' resolves. The Sanity-hosted Studio serves its
// SPA for both forms, so the slash is safe there too.

export default function ManageTestimonialsLink() {
  const {basePath} = useWorkspace()
  const href = `${basePath.replace(/\/+$/, '')}/structure/testimonial/`

  return (
    <Stack space={2}>
      <Button
        as="a"
        href={href}
        text="Manage testimonials →"
        tone="primary"
        mode="ghost"
        fontSize={1}
        padding={3}
        style={{textDecoration: 'none'}}
      />
      <Text muted size={1}>
        Opens the testimonials list in Studio where you can add, edit, or remove individual testimonials.
      </Text>
    </Stack>
  )
}
