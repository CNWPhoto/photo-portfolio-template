# Template Rules & Checklist

## Rule: Every New Page or Section

When adding any new page or section component to this template, the following
must be done as part of that same task — not as a follow-up:

### 1. Sanity schema fields
Every piece of visible text must have a corresponding labeled field in the
relevant schema document (siteSettings, homepageSettings, or a page-specific
document). No hardcoded strings that a client would ever want to change.

Field title format: use plain English, clearly named per section.
e.g. "Experience Page — Section Heading" not just "heading".

### 2. Typography override fields
Every font-size value in the new component's CSS must have a corresponding
override field added to the `typographyOverrides` object in `siteSettings.js`.

Pattern:
- Field name: camelCase, prefixed with component name. e.g. `experienceBodySize`
- Field title: "[Section] — [Element] Size"
- Description: "Default: Xrem" (always include the current default value)
- CSS: use `var(--override-name, defaultValue)` syntax in the component

### 3. Inline style wiring
The new component must accept an `overrides` prop and apply the CSS variables
as an inline style on the root section element, filtering out empty values.

```astro
<section
  class="mysection"
  style={[
    overrides?.mysectionBodySize ? `--mysection-body-size: ${overrides.mysectionBodySize}` : '',
  ].filter(Boolean).join('; ') || undefined}
>
```

### 4. GROQ query
If the new component needs data from Sanity, update the GROQ query in
`src/pages/index.astro` (or the relevant page file) to include the new fields.

### 5. Images
Every `<img>` that uses a Sanity CDN URL must:
- Use the `sanityImg()` helper for `src` (never hardcode `?w=` directly)
- Have a `srcset` built with `sanitySrcset()` covering at least 4 widths
- Have a `sizes` attribute matching the image's actual display width in the layout
- Use `loading="eager"` for above-the-fold images, `loading="lazy"` for everything else
- The `src` fallback width should be 1.5x–2x the largest expected display width to cover retina

Reference widths by context:
- Full-width / hero: `widths [900, 1400, 2000, 2800]`, `sizes="100vw"`
- Half-column (50vw): `widths [800, 1200, 1600, 2400]`, `sizes="(max-width: 900px) 100vw, 50vw"`
- Third-column or card: `widths [600, 900, 1200, 1800]`, `sizes="(max-width: 900px) 50vw, 35vw"`
- Thumbnail / portrait photo: `widths [400, 800, 1200]`, `sizes="(max-width: 900px) 30vw, 200px"`

Import the helpers: `import { sanityImg, sanitySrcset } from '../../utils/imageUrl';`

---

## Checklist for every new section
- [ ] All text fields exist in Sanity schema with clear labels
- [ ] All font-size values have override fields in `typographyOverrides` in `siteSettings.js`
- [ ] Component accepts `overrides` prop and applies inline CSS vars
- [ ] GROQ query updated to include new fields
- [ ] Fallback defaults in `var()` match the current hardcoded CSS values exactly
- [ ] All Sanity images use `sanityImg()` + `sanitySrcset()` with appropriate `sizes`
- [ ] Above-fold images use `loading="eager"`, all others use `loading="lazy"`

---

## Typography overrides location

Override fields live in `studio/schemaTypes/siteSettings.js` under the
`typographyOverrides` object field. They are fetched in `src/pages/index.astro`
via `*[_type == "siteSettings" && _id == "siteSettings"][0].typographyOverrides`
and passed as `overrides` to every section component.
