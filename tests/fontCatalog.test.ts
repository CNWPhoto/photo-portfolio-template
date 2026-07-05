import { describe, it, expect } from 'vitest';
import { fontCatalog, fontBySlug, fontDisplayName } from '../src/lib/fontCatalog.js';

// Structural guards for the curated Google Fonts catalog. Network-level
// verification (every css2 URL returns 200) lives in
// scripts/verify-font-catalog.mjs — run that after any catalog edit.
describe('fontCatalog', () => {
  it('has unique slugs', () => {
    const slugs = fontCatalog.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('slugs are kebab-case (safe as Sanity list values)', () => {
    for (const f of fontCatalog) expect(f.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('families are +-separated css2 names (no spaces, no colon)', () => {
    for (const f of fontCatalog) expect(f.family).toMatch(/^[A-Za-z0-9+]+$/);
  });

  it('axes strings match css2 tuple syntax when present', () => {
    const AXES = /^(ital@0;1|wght@\d{3}(;\d{3})*|ital,wght@[01],\d{3}(;[01],\d{3})*)$/;
    for (const f of fontCatalog) {
      if (f.axes !== null) expect(f.axes, `${f.slug} axes`).toMatch(AXES);
    }
  });

  it('use values are heading/body and non-empty', () => {
    for (const f of fontCatalog) {
      expect(f.use.length).toBeGreaterThan(0);
      for (const u of f.use) expect(['heading', 'body']).toContain(u);
    }
  });

  it('fallback stacks are one of the two supported values', () => {
    for (const f of fontCatalog)
      expect(['Georgia,serif', 'system-ui,sans-serif']).toContain(f.fallback);
  });

  it('every use bucket has a healthy number of options', () => {
    expect(fontCatalog.filter((f) => f.use.includes('heading')).length).toBeGreaterThanOrEqual(25);
    expect(fontCatalog.filter((f) => f.use.includes('body')).length).toBeGreaterThanOrEqual(20);
  });

  it('fontBySlug and fontDisplayName behave', () => {
    expect(fontBySlug['playfair-display'].family).toBe('Playfair+Display');
    expect(fontDisplayName('Playfair+Display')).toBe('Playfair Display');
    expect(fontBySlug['default']).toBeUndefined();
  });
});
