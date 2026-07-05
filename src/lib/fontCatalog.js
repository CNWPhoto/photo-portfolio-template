// Curated Google Fonts catalog — the "middle tier" between the six font
// themes and Advanced custom-font uploads. Editors pick per side
// (heading/body) from these dropdowns; free-text families are deliberately
// unsupported because Google's css2 API hard-fails the ENTIRE request when
// any family name or weight is unknown (one typo would nuke every font on
// the site).
//
// Every entry's `family:axes` pair MUST return 200 from
//   https://fonts.googleapis.com/css2?family=<family>:<axes>&display=swap
// — run `node scripts/verify-font-catalog.mjs` after ANY edit to this file.
// tests/fontCatalog.test.ts guards structure (unique slugs, axes syntax).
//
// Shape:
//   slug     — stored in siteSettings.headingFont / bodyFont
//   label    — dropdown label shown to editors
//   family   — css2 family name, +-separated (never spaces)
//   axes     — css2 tuple string after the colon, or null for single-style
//   use      — which dropdown(s) list it
//   fallback — CSS fallback stack appended after the family

export const fontCatalog = [
  // ── Classic serifs (heading; several body-worthy) ─────────────────────
  {slug: 'playfair-display', label: 'Playfair Display — serif', family: 'Playfair+Display', axes: 'ital,wght@0,400;0,500;0,600;0,700;1,400;1,700', use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'cormorant-garamond', label: 'Cormorant Garamond — serif', family: 'Cormorant+Garamond', axes: 'ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700', use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'cormorant', label: 'Cormorant — serif', family: 'Cormorant', axes: 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400', use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'eb-garamond', label: 'EB Garamond — serif', family: 'EB+Garamond', axes: 'ital,wght@0,400;0,500;0,600;0,700;1,400;1,500', use: ['heading', 'body'], fallback: 'Georgia,serif'},
  {slug: 'lora', label: 'Lora — serif', family: 'Lora', axes: 'ital,wght@0,400;0,500;0,600;0,700;1,400;1,700', use: ['heading', 'body'], fallback: 'Georgia,serif'},
  {slug: 'libre-baskerville', label: 'Libre Baskerville — serif', family: 'Libre+Baskerville', axes: 'ital,wght@0,400;0,700;1,400', use: ['heading', 'body'], fallback: 'Georgia,serif'},
  {slug: 'crimson-pro', label: 'Crimson Pro — serif', family: 'Crimson+Pro', axes: 'ital,wght@0,300;0,400;0,600;0,700;1,400', use: ['heading', 'body'], fallback: 'Georgia,serif'},
  {slug: 'spectral', label: 'Spectral — serif', family: 'Spectral', axes: 'ital,wght@0,300;0,400;0,600;0,700;1,400', use: ['heading', 'body'], fallback: 'Georgia,serif'},
  {slug: 'fraunces', label: 'Fraunces — serif', family: 'Fraunces', axes: 'ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700', use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'bodoni-moda', label: 'Bodoni Moda — serif', family: 'Bodoni+Moda', axes: 'ital,wght@0,400;0,600;0,700;1,400', use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'merriweather', label: 'Merriweather — serif', family: 'Merriweather', axes: 'ital,wght@0,300;0,400;0,700;1,400', use: ['heading', 'body'], fallback: 'Georgia,serif'},
  {slug: 'bitter', label: 'Bitter — slab serif', family: 'Bitter', axes: 'ital,wght@0,300;0,400;0,600;0,700;1,400', use: ['heading', 'body'], fallback: 'Georgia,serif'},
  {slug: 'pt-serif', label: 'PT Serif — serif', family: 'PT+Serif', axes: 'ital,wght@0,400;0,700;1,400', use: ['body'], fallback: 'Georgia,serif'},
  {slug: 'domine', label: 'Domine — serif', family: 'Domine', axes: 'wght@400;500;600;700', use: ['heading', 'body'], fallback: 'Georgia,serif'},
  {slug: 'newsreader', label: 'Newsreader — serif', family: 'Newsreader', axes: 'ital,wght@0,400;0,500;0,600;0,700;1,400', use: ['heading', 'body'], fallback: 'Georgia,serif'},
  {slug: 'cardo', label: 'Cardo — serif', family: 'Cardo', axes: 'ital,wght@0,400;0,700;1,400', use: ['heading', 'body'], fallback: 'Georgia,serif'},
  {slug: 'unna', label: 'Unna — serif', family: 'Unna', axes: 'ital,wght@0,400;0,700;1,400;1,700', use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'rufina', label: 'Rufina — serif', family: 'Rufina', axes: 'wght@400;700', use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'halant', label: 'Halant — serif', family: 'Halant', axes: 'wght@300;400;500;600;700', use: ['heading', 'body'], fallback: 'Georgia,serif'},
  {slug: 'sorts-mill-goudy', label: 'Sorts Mill Goudy — serif', family: 'Sorts+Mill+Goudy', axes: 'ital@0;1', use: ['heading', 'body'], fallback: 'Georgia,serif'},
  {slug: 'alice', label: 'Alice — serif', family: 'Alice', axes: null, use: ['heading', 'body'], fallback: 'Georgia,serif'},

  // ── Display serifs (heading only) ────────────────────────────────────
  {slug: 'dm-serif-display', label: 'DM Serif Display — display serif', family: 'DM+Serif+Display', axes: 'ital@0;1', use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'prata', label: 'Prata — display serif', family: 'Prata', axes: null, use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'marcellus', label: 'Marcellus — display serif', family: 'Marcellus', axes: null, use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'italiana', label: 'Italiana — display serif', family: 'Italiana', axes: null, use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'gilda-display', label: 'Gilda Display — display serif', family: 'Gilda+Display', axes: null, use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'cinzel', label: 'Cinzel — display serif', family: 'Cinzel', axes: 'wght@400;500;600;700', use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'abril-fatface', label: 'Abril Fatface — display serif', family: 'Abril+Fatface', axes: null, use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'cormorant-upright', label: 'Cormorant Upright — display serif', family: 'Cormorant+Upright', axes: 'wght@300;400;500;600;700', use: ['heading'], fallback: 'Georgia,serif'},

  // ── Scripts & hand-lettered (heading only) ───────────────────────────
  {slug: 'great-vibes', label: 'Great Vibes — script', family: 'Great+Vibes', axes: null, use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'parisienne', label: 'Parisienne — script', family: 'Parisienne', axes: null, use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'sacramento', label: 'Sacramento — script', family: 'Sacramento', axes: null, use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'dancing-script', label: 'Dancing Script — script', family: 'Dancing+Script', axes: 'wght@400;500;600;700', use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'allura', label: 'Allura — script', family: 'Allura', axes: null, use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'pinyon-script', label: 'Pinyon Script — script', family: 'Pinyon+Script', axes: null, use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'tangerine', label: 'Tangerine — script', family: 'Tangerine', axes: 'wght@400;700', use: ['heading'], fallback: 'Georgia,serif'},
  {slug: 'amatic-sc', label: 'Amatic SC — hand-lettered', family: 'Amatic+SC', axes: 'wght@400;700', use: ['heading'], fallback: 'Georgia,serif'},

  // ── Sans-serifs (mostly body; several heading-worthy) ────────────────
  {slug: 'tenor-sans', label: 'Tenor Sans — sans', family: 'Tenor+Sans', axes: null, use: ['heading', 'body'], fallback: 'system-ui,sans-serif'},
  {slug: 'julius-sans-one', label: 'Julius Sans One — display sans', family: 'Julius+Sans+One', axes: null, use: ['heading'], fallback: 'system-ui,sans-serif'},
  {slug: 'josefin-sans', label: 'Josefin Sans — sans', family: 'Josefin+Sans', axes: 'ital,wght@0,300;0,400;0,600;1,400', use: ['heading', 'body'], fallback: 'system-ui,sans-serif'},
  {slug: 'montserrat', label: 'Montserrat — sans', family: 'Montserrat', axes: 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400', use: ['heading', 'body'], fallback: 'system-ui,sans-serif'},
  {slug: 'jost', label: 'Jost — sans', family: 'Jost', axes: 'wght@300;400;500;600;700', use: ['heading', 'body'], fallback: 'system-ui,sans-serif'},
  {slug: 'lato', label: 'Lato — sans', family: 'Lato', axes: 'wght@300;400;700', use: ['body'], fallback: 'system-ui,sans-serif'},
  {slug: 'dm-sans', label: 'DM Sans — sans', family: 'DM+Sans', axes: 'wght@300;400;500;600;700', use: ['heading', 'body'], fallback: 'system-ui,sans-serif'},
  {slug: 'nunito-sans', label: 'Nunito Sans — sans', family: 'Nunito+Sans', axes: 'ital,wght@0,300;0,400;0,600;0,700;1,400', use: ['body'], fallback: 'system-ui,sans-serif'},
  {slug: 'libre-franklin', label: 'Libre Franklin — sans', family: 'Libre+Franklin', axes: 'wght@300;400;500;600;700', use: ['body'], fallback: 'system-ui,sans-serif'},
  {slug: 'raleway', label: 'Raleway — sans', family: 'Raleway', axes: 'wght@300;400;500;600;700', use: ['heading', 'body'], fallback: 'system-ui,sans-serif'},
  {slug: 'inter', label: 'Inter — sans', family: 'Inter', axes: 'wght@300;400;500;600;700', use: ['body'], fallback: 'system-ui,sans-serif'},
  {slug: 'work-sans', label: 'Work Sans — sans', family: 'Work+Sans', axes: 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400', use: ['heading', 'body'], fallback: 'system-ui,sans-serif'},
  {slug: 'karla', label: 'Karla — sans', family: 'Karla', axes: 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400', use: ['body'], fallback: 'system-ui,sans-serif'},
  {slug: 'mulish', label: 'Mulish — sans', family: 'Mulish', axes: 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400', use: ['body'], fallback: 'system-ui,sans-serif'},
  {slug: 'outfit', label: 'Outfit — sans', family: 'Outfit', axes: 'wght@300;400;500;600;700', use: ['heading', 'body'], fallback: 'system-ui,sans-serif'},
  {slug: 'poppins', label: 'Poppins — sans', family: 'Poppins', axes: 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400', use: ['heading', 'body'], fallback: 'system-ui,sans-serif'},
  {slug: 'figtree', label: 'Figtree — sans', family: 'Figtree', axes: 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400', use: ['body'], fallback: 'system-ui,sans-serif'},
  {slug: 'manrope', label: 'Manrope — sans', family: 'Manrope', axes: 'wght@300;400;500;600;700', use: ['body'], fallback: 'system-ui,sans-serif'},
  {slug: 'source-sans-3', label: 'Source Sans 3 — sans', family: 'Source+Sans+3', axes: 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400', use: ['body'], fallback: 'system-ui,sans-serif'},
  {slug: 'open-sans', label: 'Open Sans — sans', family: 'Open+Sans', axes: 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400', use: ['body'], fallback: 'system-ui,sans-serif'},
  {slug: 'quicksand', label: 'Quicksand — sans', family: 'Quicksand', axes: 'wght@300;400;500;600;700', use: ['body'], fallback: 'system-ui,sans-serif'},
];

export const fontBySlug = Object.fromEntries(fontCatalog.map((f) => [f.slug, f]));

// css2 family name → human/CSS display name ('Playfair+Display' → 'Playfair Display')
export const fontDisplayName = (family) => family.replace(/\+/g, ' ');
