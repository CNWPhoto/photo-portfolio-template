import {Button, Stack, Text} from '@sanity/ui'

// Custom input rendered inside the testimonialsSection field list. The
// schema field it's attached to has no actual value — this component
// just renders a button that navigates to the Studio's testimonials
// list. Relative href so it works across every deployed Studio
// (localhost:3333, cnw-photo-demo.sanity.studio, coola-creative.sanity.studio,
// etc.) without hardcoding a host.

export default function ManageTestimonialsLink() {
  return (
    <Stack space={2}>
      <Button
        as="a"
        href="/structure/testimonial"
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
