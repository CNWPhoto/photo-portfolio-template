import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { resolveLink } from '../src/lib/links.js'

// astro.config sets trailingSlash: 'always', so any internal link written
// WITHOUT a trailing slash costs a 301 on every click and advertises a
// non-canonical URL. This kept regressing — first in nav/footer links (fixed in
// resolveLink), then in the portfolio gallery tabs, which build hrefs inline
// and so never went through resolveLink at all.
//
// Rather than fixing each site as it's found, this fails the build for any new
// one. It scans source for hard-coded internal hrefs and asserts every path is
// slashed.
//
// Exempt, deliberately: file paths with an extension (/resume.pdf), bare
// anchors and queries, protocol-relative and absolute URLs, and the site root.
//
// Scope, honestly: this matches href= shapes only. A path assigned to a
// variable first — `const privacyUrl = '/privacy-policy'` — slips past it, as
// the footer's legal links did. Widening the pattern to any string literal
// beginning with "/" produced too many false positives to be useful. The
// runtime assertion in health-check.yml is the backstop for that gap, and for
// paths that only exist in editor-entered content.

const SRC = join(__dirname, '..', 'src')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(astro|ts|js|jsx|tsx)$/.test(entry)) out.push(p)
  }
  return out
}

// Matches href="/x" / href={`/x`} / href: '/x' — the three shapes used in this
// codebase for a hard-coded internal path.
const PATTERNS = [
  /href=["'](\/[^"'#?]*)["']/g,
  /href=\{`(\/[^`$]*)`\}/g,
  /href:\s*["'`](\/[^"'`#?$]*)["'`]/g,
]

const isExempt = (path: string) =>
  path === '/' ||
  path.startsWith('/api/') || // endpoints, not pages — trailingSlash doesn't apply

  path.endsWith('/') ||
  path.startsWith('//') ||
  /\.[a-z0-9]{2,8}$/i.test(path) || // a file, not a page
  path.includes('${') // interpolated — the template decides, checked below

describe('internal links are slashed (trailingSlash: always)', () => {
  it('no hard-coded internal href in src/ is missing its trailing slash', () => {
    const offenders: string[] = []

    for (const file of walk(SRC)) {
      const text = readFileSync(file, 'utf8')
      for (const re of PATTERNS) {
        for (const m of text.matchAll(re)) {
          const path = m[1]
          if (!isExempt(path)) {
            offenders.push(`${relative(SRC, file)}: href "${path}" → should be "${path}/"`)
          }
        }
      }
    }

    expect(offenders, `\n${offenders.join('\n')}\n`).toEqual([])
  })

  it('interpolated internal hrefs end with a slash after the expression', () => {
    // `/portfolio/${g.slug}` is the exact shape that broke the gallery tabs:
    // it looks fine, but resolves unslashed at runtime.
    const offenders: string[] = []
    const re = /href=\{`(\/[^`]*\$\{[^`]*)`\}|href:\s*`(\/[^`]*\$\{[^`]*)`/g

    for (const file of walk(SRC)) {
      for (const m of readFileSync(file, 'utf8').matchAll(re)) {
        const tpl = m[1] ?? m[2]
        if (!tpl.endsWith('/') && !tpl.startsWith('/api/')) {
          offenders.push(`${relative(SRC, file)}: href \`${tpl}\` → should end with "/"`)
        }
      }
    }

    expect(offenders, `\n${offenders.join('\n')}\n`).toEqual([])
  })
})

describe('resolveLink normalises editor-supplied paths', () => {
  // Editors paste bare paths into the External URL field; those bypass
  // pathForInternal, which was the only place emitting slashes.
  it.each([
    ['/portfolio', '/portfolio/'],
    ['/blog', '/blog/'],
    ['/contact?ref=nav', '/contact/?ref=nav'],
    ['/faq#pricing', '/faq/#pricing'],
  ])('%s → %s', (input, expected) => {
    expect(resolveLink({ linkType: 'external', url: input })).toBe(expected)
  })

  it.each([
    ['/resume.pdf'],
    ['#anchor'],
    ['https://example.com/page'],
    ['mailto:hi@example.com'],
    ['tel:+15551234'],
    ['//cdn.example.com/x'],
  ])('leaves %s alone', (input) => {
    expect(resolveLink({ linkType: 'external', url: input })).toBe(input)
  })

  it('reduces an absolute self-origin URL to a slashed path', () => {
    expect(
      resolveLink({ linkType: 'external', url: 'https://mysite.com/portfolio' }, ['mysite.com']),
    ).toBe('/portfolio/')
  })
})
