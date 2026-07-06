// Font <head> emission — single source of truth shared by:
//   - Layout.astro (server render of the font link/style markers)
//   - /api/preview-style (JSON for the preview bridge's style fast path)
//   - tests/fontHead.test.ts
//
// Per-side precedence: uploaded custom font > curated pick > font theme.
// Extracted from Layout.astro so the bridge's client-side fast path can't
// drift from what the server renders.

import { fontBySlug, fontDisplayName } from './fontCatalog.js';

// Font themes split into heading + body params so custom fonts can override
// either side individually — when an editor uploads a custom heading font,
// we skip the heading half of the Google Fonts URL (no wasted bytes), and
// the same for body. If both are overridden, no Google Fonts URL is emitted.
export const FONT_THEMES = {
  'classic-editorial': {heading: 'Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700', body: 'Jost:wght@300;400;500;600;700'},
  'romantic-script':   {heading: 'Playfair+Display:ital,wght@0,400;0,700;1,400;1,700', body: 'Lato:wght@300;400;700'},
  'modern-luxury':     {heading: 'DM+Serif+Display:ital@0;1', body: 'DM+Sans:wght@300;400;500;600;700'},
  'soft-contemporary': {heading: 'Fraunces:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700', body: 'Nunito+Sans:ital,wght@0,300;0,400;0,600;0,700'},
  'bold-editorial':    {heading: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400', body: 'Libre+Franklin:wght@300;400;500;600;700'},
  'airy-minimal':      {heading: 'Tenor+Sans', body: 'Raleway:wght@300;400;500;600;700'},
};

const ALLOWED_WEIGHTS = new Set(['300', '400', '500', '600', '700']);
const FORMAT_MAP = {woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype'};
const CUSTOM_HEADING_FAMILY = 'Custom Heading Font';
const CUSTOM_BODY_FAMILY = 'Custom Body Font';

const css2Param = (f) => `family=${f.family}${f.axes ? `:${f.axes}` : ''}`;
const fontSrc = (f) =>
  `src:url('${f.url}') format('${FORMAT_MAP[(f.extension || '').toLowerCase()] || 'woff2'}')`;

// The siteSettings fields that feed this module. The preview bridge's fast
// path may only skip the full refetch when the mutation touched nothing
// outside this list (checked via restHash below).
export const FONT_FIELDS = [
  'fontTheme',
  'headingFont',
  'bodyFont',
  'headingWeight',
  'bodyWeight',
  'headingFontFile',
  'bodyFontFile',
];

/**
 * Build the font-related <head> output from (stega-cleaned) siteSettings.
 * Returns plain data — the caller renders/applies it.
 */
export function buildFontHead(settings) {
  const fontTheme = settings?.fontTheme || 'classic-editorial';
  const headingWeight = ALLOWED_WEIGHTS.has(settings?.headingWeight) ? settings.headingWeight : null;
  const bodyWeight = ALLOWED_WEIGHTS.has(settings?.bodyWeight) ? settings.bodyWeight : null;

  const typographyCss = [
    headingWeight ? `  --heading-weight: ${headingWeight};` : null,
    bodyWeight ? `  --body-weight: ${bodyWeight};` : null,
  ]
    .filter(Boolean)
    .join('\n');
  const typographyOverrideCss = typographyCss ? `:root {\n${typographyCss}\n}` : '';

  // Uploaded brand fonts — deliberately file-only (no family/weight/style
  // declarations for editors to get wrong; the Kris lesson). Family names
  // are fixed internal identifiers; @font-face descriptors are derived.
  const headingFontFile = settings?.headingFontFile ?? null;
  const bodyFontFile = settings?.bodyFontFile ?? null;
  const useCustomHeading = !!headingFontFile?.url;
  const useCustomBody = !!bodyFontFile?.url;

  const activeTheme = FONT_THEMES[fontTheme] ?? FONT_THEMES['classic-editorial'];

  // Curated picks: values are catalog slugs; 'default' or anything unknown
  // resolves to undefined and the theme side applies untouched. The catalog
  // is pre-verified against Google's css2 API (scripts/verify-font-catalog.mjs).
  const headingPick = !useCustomHeading ? fontBySlug[settings?.headingFont] : undefined;
  const bodyPick = !useCustomBody ? fontBySlug[settings?.bodyFont] : undefined;

  const googleFontParams = [];
  if (!useCustomHeading) googleFontParams.push(headingPick ? css2Param(headingPick) : `family=${activeTheme.heading}`);
  if (!useCustomBody) googleFontParams.push(bodyPick ? css2Param(bodyPick) : `family=${activeTheme.body}`);
  const fontUrl = googleFontParams.length > 0
    ? `https://fonts.googleapis.com/css2?${googleFontParams.join('&')}&display=swap`
    : null;

  // @font-face + CSS variable override block. The var overrides carry
  // !important deliberately: fontTheme is always defaulted, so
  // <html data-font='…'> always matches a theme rule at specificity 0,1,1 —
  // a plain :root override (0,1,0) loses in every configuration.
  const customFontCssParts = [];
  if (useCustomHeading && headingFontFile) {
    // Heading face: single file declared for BOTH styles across the full
    // weight range — no synthetic bold on display faces, no double-slant
    // when the uploaded face is itself an italic cut.
    const src = fontSrc(headingFontFile);
    customFontCssParts.push(
      `@font-face{font-family:'${CUSTOM_HEADING_FAMILY}';${src};font-weight:100 900;font-style:normal;font-display:swap;}` +
      `@font-face{font-family:'${CUSTOM_HEADING_FAMILY}';${src};font-weight:100 900;font-style:italic;font-display:swap;}`,
    );
    customFontCssParts.push(`:root{--font-heading:'${CUSTOM_HEADING_FAMILY}',Georgia,serif !important;}`);
  }
  if (useCustomBody && bodyFontFile) {
    // Body face: default descriptors (400/normal) on purpose — body text
    // NEEDS synthetic bold/italic for <strong>/<em> from a single file.
    customFontCssParts.push(
      `@font-face{font-family:'${CUSTOM_BODY_FAMILY}';${fontSrc(bodyFontFile)};font-display:swap;}`,
    );
    customFontCssParts.push(`:root{--font-body:'${CUSTOM_BODY_FAMILY}',system-ui,sans-serif !important;}`);
  }
  // Curated picks reuse the identical override mechanism — no @font-face
  // needed; the Google css2 stylesheet supplies the faces.
  if (headingPick) {
    customFontCssParts.push(`:root{--font-heading:'${fontDisplayName(headingPick.family)}',${headingPick.fallback} !important;}`);
  }
  if (bodyPick) {
    customFontCssParts.push(`:root{--font-body:'${fontDisplayName(bodyPick.family)}',${bodyPick.fallback} !important;}`);
  }
  const customFontCss = customFontCssParts.join('');

  return { fontTheme, fontUrl, customFontCss, typographyOverrideCss };
}

// ── restHash: change detection for everything OUTSIDE the font fields ──────
// The preview bridge may only skip the full page refetch when a siteSettings
// mutation left every non-font field untouched. Volatile bookkeeping keys
// change on every edit and must not count.
const VOLATILE_KEYS = new Set(['_rev', '_updatedAt', '_createdAt', '_id', '_type', '_system', '_originalId']);

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export function restHash(settings) {
  if (!settings || typeof settings !== 'object') return 'empty';
  const rest = {};
  for (const key of Object.keys(settings)) {
    if (VOLATILE_KEYS.has(key) || FONT_FIELDS.includes(key)) continue;
    rest[key] = settings[key];
  }
  // djb2 over a deterministic serialization.
  const str = stableStringify(rest);
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return String(h >>> 0);
}
