import { portableTextToString } from './portableText.js'

// Build FAQPage structured data from a page's sections array. Returns a
// single-element schema array (for Layout's schemaData prop) or undefined
// when there's no FAQ section, no questions, or schema output is opted out.
//
// `acceptedAnswer.text` must be a plain string, not a Portable Text block
// array — Google ignores rich-object answers — so the answer is flattened
// via portableTextToString.
export function buildFaqSchema(sections) {
  const faqSection = (sections || []).find((s) => s?._type === 'faqSection')
  const faqs = faqSection?.faqs
  if (!faqs?.length || faqSection?.showSchema === false) return undefined
  return [
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: portableTextToString(f.answer) },
      })),
    },
  ]
}
