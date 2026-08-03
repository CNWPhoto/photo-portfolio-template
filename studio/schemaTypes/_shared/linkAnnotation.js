// The `link` annotation for every rich-text field.
//
// Sanity's `url` type allows ONLY http/https unless told otherwise, so a
// tel: or mailto: link failed validation and blocked publishing the whole
// document — with the error on the field, not on the page, which makes it look
// like the page itself is broken. Reported on Heidi's FAQs 2026-08-02 after
// adding a phone and email link to an answer.
//
// The renderer already handled both: src/lib/portableText.js `safeHref` permits
// tel:, mailto:, relative paths and anchors, and deliberately keeps them in the
// same tab. Only the schema was rejecting them.
//
// Defined once and shared because this annotation was copy-pasted into seven
// schemas; fixing them individually guarantees the next one drifts.

export const linkAnnotation = () => ({
  name: 'link',
  type: 'object',
  title: 'Link',
  fields: [
    {
      name: 'href',
      type: 'url',
      title: 'URL',
      description:
        'A web address (https://…), an email (mailto:you@example.com), a phone number (tel:+15551234567), a page on this site (/contact/), or an anchor (#section).',
      validation: (Rule) =>
        Rule.uri({
          scheme: ['http', 'https', 'mailto', 'tel'],
          allowRelative: true,
        }),
    },
  ],
})
