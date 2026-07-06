import { describe, it, expect } from 'vitest';
import { buildFontHead, restHash, FONT_FIELDS, FONT_THEMES } from '../src/lib/fontHead.js';

describe('buildFontHead', () => {
  it('emits the default theme when settings are empty', () => {
    const out = buildFontHead(null);
    expect(out.fontTheme).toBe('classic-editorial');
    expect(out.fontUrl).toContain('Cormorant+Garamond');
    expect(out.fontUrl).toContain('Jost');
    expect(out.customFontCss).toBe('');
    expect(out.typographyOverrideCss).toBe('');
  });

  it('emits the selected theme pair', () => {
    const out = buildFontHead({ fontTheme: 'bold-editorial' });
    expect(out.fontUrl).toContain('Libre+Baskerville');
    expect(out.fontUrl).toContain('Libre+Franklin');
  });

  it('falls back to the default theme for unknown theme slugs', () => {
    const out = buildFontHead({ fontTheme: 'not-a-theme' });
    expect(out.fontUrl).toContain('Cormorant+Garamond');
  });

  it('a heading pick overrides only the heading half and adds a var override', () => {
    const out = buildFontHead({ fontTheme: 'romantic-script', headingFont: 'fraunces' });
    expect(out.fontUrl).toContain('Fraunces');
    expect(out.fontUrl).not.toContain('Playfair'); // theme heading replaced
    expect(out.fontUrl).toContain('Lato'); // theme body kept
    expect(out.customFontCss).toContain("--font-heading:'Fraunces'");
    expect(out.customFontCss).toContain('!important');
  });

  it("an unknown pick slug (or 'default') leaves the theme untouched", () => {
    for (const pick of ['default', 'no-such-font', undefined]) {
      const out = buildFontHead({ fontTheme: 'romantic-script', headingFont: pick });
      expect(out.fontUrl).toContain('Playfair');
      expect(out.customFontCss).toBe('');
    }
  });

  it('an uploaded heading file wins over pick and theme, and drops the heading css2 half', () => {
    const out = buildFontHead({
      fontTheme: 'romantic-script',
      headingFont: 'fraunces',
      headingFontFile: { url: 'https://cdn.sanity.io/files/x/production/abc.woff2', extension: 'woff2' },
    });
    expect(out.fontUrl).not.toContain('Playfair');
    expect(out.fontUrl).not.toContain('Fraunces');
    expect(out.fontUrl).toContain('Lato'); // body half still from theme
    expect(out.customFontCss).toContain("font-family:'Custom Heading Font'");
    expect(out.customFontCss).toContain("format('woff2')");
    // Heading face declared for both styles across the weight range
    expect(out.customFontCss).toContain('font-weight:100 900;font-style:normal');
    expect(out.customFontCss).toContain('font-weight:100 900;font-style:italic');
  });

  it('uploads on both sides emit no Google Fonts URL at all', () => {
    const file = { url: 'https://cdn.sanity.io/files/x/production/abc.woff2', extension: 'woff2' };
    const out = buildFontHead({ headingFontFile: file, bodyFontFile: file });
    expect(out.fontUrl).toBeNull();
  });

  it('body upload keeps default descriptors (synthetic bold/italic stay available)', () => {
    const out = buildFontHead({
      bodyFontFile: { url: 'https://cdn.sanity.io/files/x/production/b.ttf', extension: 'ttf' },
    });
    expect(out.customFontCss).toContain("font-family:'Custom Body Font'");
    expect(out.customFontCss).toContain("format('truetype')");
    expect(out.customFontCss).not.toContain("Custom Body Font';src:url('https://cdn.sanity.io/files/x/production/b.ttf') format('truetype');font-weight:100 900");
  });

  it('validated weights emit the typography override; junk weights do not', () => {
    expect(buildFontHead({ headingWeight: '600' }).typographyOverrideCss).toContain('--heading-weight: 600');
    expect(buildFontHead({ headingWeight: '950' }).typographyOverrideCss).toBe('');
    expect(buildFontHead({ bodyWeight: '300' }).typographyOverrideCss).toContain('--body-weight: 300');
  });

  it('every theme in the catalog builds a well-formed css2 URL', () => {
    for (const slug of Object.keys(FONT_THEMES)) {
      const out = buildFontHead({ fontTheme: slug });
      expect(out.fontUrl).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?family=.+&display=swap$/);
    }
  });
});

describe('restHash', () => {
  const base = {
    _id: 'siteSettings',
    _type: 'siteSettings',
    _rev: 'aaa',
    _updatedAt: '2026-07-05T00:00:00Z',
    siteName: 'Pet Photographer',
    fontTheme: 'bold-editorial',
    headingFont: 'default',
    palettes: [{ slug: 'classic-cream', bg: '#f5f3ef' }],
  };

  it('ignores volatile keys (_rev/_updatedAt change on every edit)', () => {
    expect(restHash(base)).toBe(restHash({ ...base, _rev: 'bbb', _updatedAt: '2027-01-01T00:00:00Z' }));
  });

  it('ignores every font field — that is the whole point of the fast path', () => {
    const changedFonts: Record<string, unknown> = { ...base };
    for (const f of FONT_FIELDS) changedFonts[f] = 'something-else';
    expect(restHash(base)).toBe(restHash(changedFonts));
  });

  it('changes when a non-font field changes', () => {
    expect(restHash(base)).not.toBe(restHash({ ...base, siteName: 'Renamed Studio' }));
    expect(restHash(base)).not.toBe(
      restHash({ ...base, palettes: [{ slug: 'classic-cream', bg: '#000000' }] }),
    );
  });

  it('is insensitive to key order', () => {
    const reordered = Object.fromEntries(Object.entries(base).reverse());
    expect(restHash(base)).toBe(restHash(reordered));
  });
});
