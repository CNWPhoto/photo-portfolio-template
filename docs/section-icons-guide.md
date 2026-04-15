# Section Icons — Build Guide

A spec for the wireframe-style icons that appear in the Sanity Studio insert-section menu (`Add item ▾` → grid/list view). Hand this entire doc to ChatGPT (or any vector tool) to generate the 17 SVGs in one batch.

---

## Specs

| Property | Value |
|---|---|
| **Format** | SVG (one file per section) |
| **Source size** | `120 × 80` viewBox (3:2 — matches a wide content block) |
| **Stroke width** | `2` |
| **Stroke color** | `currentColor` (so it inherits Studio light/dark theme automatically — do NOT hardcode `#000` or `#fff`) |
| **Fill** | `none` for outlines; `currentColor` for solid fills (image rectangles, dots) |
| **Stroke linecap / linejoin** | `round` |
| **Padding inside viewBox** | Leave ~8px breathing room on all sides — the active art lives in the inner ~104 × 64 area |
| **Style** | Flat wireframe, schematic. No drop shadows, no gradients, no text labels inside the icon |

**Wireframe vocabulary** (use these consistently across all icons so the set reads as a family):

- **Image** → solid filled rectangle (`fill="currentColor"`, no stroke), or outlined rectangle with a small "X" or mountain glyph if filled would be too heavy
- **Heading** → one short horizontal line, ~30% of the available width, slightly thicker
- **Paragraph text** → 2–3 stacked horizontal lines, full or 80% width, evenly spaced (~6px apart)
- **Button / CTA** → small rounded-rect outline, ~24×10px
- **Divider line** → single horizontal line spanning the full inner width
- **Avatar / icon placeholder** → small circle, ~10px diameter

Keep details minimal — these icons are seen at ~80px wide in the grid view AND ~24px in the list view, so anything fussy will turn into mush.

**File naming** — match the schema `name` exactly so the wiring step is mechanical:

```
heroSection.svg
splitSection.svg
fullBleedImageSection.svg
richTextSection.svg
pullQuoteSection.svg
threeColumnSection.svg
stepsSection.svg
galleryGridSection.svg
dividerSection.svg
ctaBandSection.svg
contactFormSection.svg
contactInfoSection.svg
testimonialsSection.svg
faqSection.svg
featuredPortfolioSection.svg
blogTeaserSection.svg
htmlEmbedRef.svg
```

Save the finished set into a new directory: `studio/static/section-icons/`. (Sanity serves `studio/static/` as static assets, so they'll be reachable at `/static/section-icons/heroSection.svg` from the Studio bundle.)

---

## SVG template

Every file should use this skeleton so the family is consistent:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <!-- art goes here -->
</svg>
```

---

## The 17 icons

Order matches the insert-menu groupings (Hero → Layout → CTA → Dynamic → Embed).

### Hero group

#### 1. `heroSection.svg` — Hero
Full-width filled rectangle (the hero image) spanning the entire inner area. Inside it, near the bottom-left corner: one short heading line and two paragraph lines stacked, drawn with `fill="none"` strokes so they read as text-on-image. A small CTA button outline below the paragraph lines.

> Visual: edge-to-edge "image" with overlaid title block bottom-left.

#### Layout group

#### 2. `splitSection.svg` — Split (Image + Text)
Two equal-width rectangles side by side, separated by a small gap. Left rectangle = filled image. Right rectangle = outlined, containing a short heading line and 2–3 paragraph lines stacked.

> Visual: 50/50 image-left, text-right.

#### 3. `fullBleedImageSection.svg` — Full-Bleed Image
A single filled rectangle spanning the full inner area. In the lower-third, an outlined "card" rectangle (~50% width, centered horizontally) with a short heading line and one paragraph line inside it.

> Visual: full image with a centered overlay text card.

#### 4. `richTextSection.svg` — Rich Text
Centered column of text only — one short heading line at the top, then 4 stacked paragraph lines, all centered horizontally with consistent left/right margin (~16px from each edge). No image.

> Visual: pure text block, like an article paragraph.

#### 5. `pullQuoteSection.svg` — Pull Quote
A large opening quotation mark in the upper-left (drawn as a curved stroke shape, not a font glyph), followed by 2 long horizontal text lines, then a short attribution line aligned right or below. Optionally a left vertical bar (~3px wide) running along the left edge of the text lines.

> Visual: large quote mark + two lines of quoted text + attribution.

#### 6. `threeColumnSection.svg` — Three Column
Three equal-width rectangles in a horizontal row, separated by gaps. Each rectangle contains: a small filled square at top (image), a short heading line below it, and 2 short paragraph lines under that.

> Visual: three identical card columns.

#### 7. `stepsSection.svg` — Steps
Three horizontally arranged cards, each containing: a numeral ("1", "2", "3" — drawn as digit shapes with strokes, not font text) at the top, then a short heading line and 1 paragraph line below. Optionally connect them with a thin horizontal line running across all three centered vertically.

> Visual: numbered process cards in a row.

#### 8. `galleryGridSection.svg` — Gallery Grid
A 3×2 grid of small filled rectangles (6 image tiles total), evenly spaced. All same size.

> Visual: photo grid.

#### 9. `dividerSection.svg` — Divider
A single horizontal line spanning the full inner width, vertically centered. Optionally with a small ornament (a tiny circle or diamond) interrupting the line at the midpoint.

> Visual: a horizontal rule, period.

### CTA group

#### 10. `ctaBandSection.svg` — CTA Band
A wide outlined rectangle ("band") spanning the full inner width. Inside, centered: one heading line, one paragraph line, and a small filled rounded-rect button below.

> Visual: a banner with centered text and a button.

#### 11. `contactFormSection.svg` — Contact Form
3 stacked outlined rectangles representing form input fields (each ~70% width, ~10px tall, centered horizontally), with a small filled rounded-rect submit button below them.

> Visual: form fields stacked with a submit button.

#### 12. `contactInfoSection.svg` — Contact Info
Three small rows, each starting with an icon glyph on the left followed by a short text line:
- Row 1: envelope outline + line (email)
- Row 2: phone handset outline + line (phone)
- Row 3: location pin outline + line (address)

> Visual: three labeled rows of contact methods.

### Dynamic group

#### 13. `testimonialsSection.svg` — Testimonials
A single wide outlined card centered in the frame containing: a small circle (avatar) at top-left, three text lines to the right of the avatar (the quote), and a short attribution line below. Two small dots below the card representing slider pagination.

> Visual: a quote card with avatar and slider dots.

#### 14. `faqSection.svg` — FAQ
Three stacked horizontal rows, each ending with a small chevron (`>` rotated 90° down) on the right side. Each row has a short text line on the left.

> Visual: an accordion with three collapsed items.

#### 15. `featuredPortfolioSection.svg` — Featured Portfolio
A wider asymmetric grid of filled rectangles: one large rectangle on the left (~60% width, full height), and two smaller stacked rectangles on the right (~35% width, half height each). Mimics a hero-portfolio feature layout.

> Visual: 1 big image + 2 small stacked images.

#### 16. `blogTeaserSection.svg` — Blog Teaser
Three vertical card outlines in a row. Each card has: a filled rectangle at top (image, ~60% of card height) and 2 short text lines below.

> Visual: three blog post cards in a row.

### Embed group

#### 17. `htmlEmbedRef.svg` — HTML Embed
A rectangle outline spanning most of the inner area, with stylized angle-bracket characters `</>` drawn as strokes (not font text) centered inside it. The brackets should be drawn as 4 short angled strokes (two `<` and two `/` and two `>` line segments).

> Visual: a code/embed placeholder.

---

## Wiring the icons into Studio (after the SVGs exist)

Once the 17 files are in `studio/static/section-icons/`, I'll handle the schema wiring. It's a small wrapper component:

```jsx
// studio/components/SectionIcon.jsx
export default function sectionIcon(name) {
  return () => (
    <img
      src={`/static/section-icons/${name}.svg`}
      alt=""
      style={{width: '100%', height: '100%', objectFit: 'contain'}}
    />
  )
}
```

Then in each section schema:

```js
import sectionIcon from '../../components/SectionIcon'

export default {
  name: 'heroSection',
  // ...
  icon: sectionIcon('heroSection'),
  // ...
}
```

Sanity uses the schema-level `icon` for the insert-menu picker tiles in both grid and list views. Same icon, different sizes — the SVG scales cleanly because of the viewBox.

---

## ChatGPT prompt (copy-paste this when generating)

> Generate 17 SVG icons matching the spec in this guide. Each SVG should be exactly the dimensions and style described. Output one code block per icon, labeled with the filename. Use `viewBox="0 0 120 80"`, `stroke="currentColor"`, `stroke-width="2"`, `fill="none"` as defaults (override `fill` only for solid image rectangles). Keep everything as a wireframe schematic — no drop shadows, no gradients, no font text, no color other than currentColor. Make the family read as a coherent set: same stroke weight, same padding, same vocabulary for images vs text vs buttons.
