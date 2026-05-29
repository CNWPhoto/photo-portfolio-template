import { describe, it, expect } from 'vitest'
import { buildFaqSchema } from '../src/lib/faqSchema.js'

const faqSection = (faqs: any[], extra: Record<string, any> = {}) => ({
  _type: 'faqSection',
  faqs,
  ...extra,
})

describe('buildFaqSchema', () => {
  it('returns undefined when there is no FAQ section', () => {
    expect(buildFaqSchema([{ _type: 'heroSection' }])).toBeUndefined()
    expect(buildFaqSchema([])).toBeUndefined()
    expect(buildFaqSchema(undefined as any)).toBeUndefined()
  })

  it('returns undefined when the FAQ section has no questions', () => {
    expect(buildFaqSchema([faqSection([])])).toBeUndefined()
  })

  it('returns undefined when schema output is opted out', () => {
    expect(
      buildFaqSchema([faqSection([{ question: 'Q', answer: 'A' }], { showSchema: false })]),
    ).toBeUndefined()
  })

  it('builds a FAQPage with string answers', () => {
    const result = buildFaqSchema([
      faqSection([
        { question: 'Do you travel?', answer: 'Yes, regionally.' },
        { question: 'Turnaround?', answer: 'Two weeks.' },
      ]),
    ])
    expect(result).toEqual([
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Do you travel?',
            acceptedAnswer: { '@type': 'Answer', text: 'Yes, regionally.' },
          },
          {
            '@type': 'Question',
            name: 'Turnaround?',
            acceptedAnswer: { '@type': 'Answer', text: 'Two weeks.' },
          },
        ],
      },
    ])
  })

  it('flattens a Portable Text answer to a plain string', () => {
    const ptAnswer = [{ _type: 'block', children: [{ _type: 'span', text: 'Flattened.' }] }]
    const result = buildFaqSchema([faqSection([{ question: 'Q', answer: ptAnswer }])])
    expect(result?.[0].mainEntity[0].acceptedAnswer.text).toBe('Flattened.')
  })
})
