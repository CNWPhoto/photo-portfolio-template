# Client proofing gallery — implementation plan

A per-client proofing gallery: the photographer creates a gallery of all a
shoot's images in Studio, shares an unguessable link, the client browses
thumbnails, clicks to enlarge, checks the ones they want, and submits — the
photographer receives an email listing the selected **original filenames**.

This is the photographer "favorites / proofing" workflow (Pixieset,
ShootProof, Pic-Time). It's built almost entirely from parts the template
already has.

## Architecture fit (decided 2026-05-21)

- **Cloudflare Workers Free covers it.** Gallery pages are SSR like the rest
  of the site and edge-cached by `src/middleware.ts`. Images are served by
  Sanity's CDN, *not* the Worker — a 300-image gallery view is one cacheable
  HTML request to the Worker + 300 image requests straight to Sanity. No need
  for Workers Paid ($5/mo).
- **Sanity Free covers normal volume:** 100GB assets, 100GB bandwidth/mo, 1M
  CDN requests/mo. Proofing is thumbnail-light (~40KB/thumb). Only a
  high-volume delivery business approaches the ceiling; the escape hatch then
  is Cloudflare R2 for originals (v2, not needed to ship).
- **No new backend.** Selections submit through Web3Forms, already wired in
  `ContactFormSection.astro`.

## What's reused vs. new

| Piece | Source |
|---|---|
| Per-client gallery content | NEW `clientGallery` Sanity doc type (mirror `studio/schemaTypes/portfolio.js`) |
| Thumbnail grid + click-to-enlarge | Reuse `GalleryGrid.astro` + existing lightbox |
| Image rendering / srcset | Reuse `SanityImage.astro` / `lib/image.ts` |
| Selection UI + submit bar | NEW client-side JS (no backend) |
| Record filename | Project `asset->originalFilename` |
| Send list to photographer | Reuse Web3Forms pattern from `ContactFormSection.astro` |
| noindex / privacy | Reuse Layout `robots` prop + `isPreview` noindex mechanism |
| Opt-in per client | Reuse schema-gated feature-flag pattern (siteSettings boolean) |

---

## Step 1 — Sanity schema: `clientGallery`

New file `studio/schemaTypes/clientGallery.js`, registered in
`studio/schemaTypes/index.js` (flat import + add to the exported array).

Fields:

- `title` (string, required) — internal name, e.g. "Smith Family — Fall 2026"
- `clientName` (string) — display name shown to the client
- `slug` (slug, required) — **generate with a random token suffix** so the URL
  is unguessable, e.g. `smith-family-fall-2026-a7f3k9`. Use a custom
  `slugify`/`source` that appends 6 random chars. The unguessable URL is the
  primary access control (no login).
- `intro` (text) — message to the client ("Pick your favorites and submit")
- `selectionLimit` (number, optional) — "choose up to N" (package allowance)
- `passcode` (string, optional) — extra gate on top of the unguessable URL
  (see Step 5; leave empty to rely on URL secrecy alone)
- `expiresAt` (datetime, optional) — gallery 404s / shows "expired" after this
- `notifyEmail` (string, optional) — overrides where selections are emailed;
  falls back to the site's Web3Forms key
- `images[]` — array of image objects, each: `{ asset (hotspot+crop), caption (string) }`
- `enabled` (boolean, default true) — soft on/off without deleting

Studio structure: add a dedicated **"Client Galleries"** list to the desk
structure, gated by the `siteSettings.clientGalleriesEnabled` flag (Step 6).

## Step 2 — Route: `src/pages/gallery/[slug].astro`

SSR route. `trailingSlash: 'always'` applies, so the path is `/gallery/<slug>/`.

Query (note `originalFilename` — that's the photographer-recognizable name):

```groq
*[_type == "clientGallery" && slug.current == $slug && enabled != false][0]{
  title, clientName, intro, selectionLimit, passcode, expiresAt, notifyEmail,
  images[]{
    caption,
    asset->{ _id, originalFilename, metadata { dimensions { width, height } } }
  }
}
```

- Use `getClient(Astro.locals.isPreview)`.
- If no doc, or `expiresAt` is in the past → `return new Response(null, { status: 404 })`.
- Defensive filter: `.filter(img => img?.asset?._id)` (empty upload slots).
- **Always `noindex`:** pass `robots="noindex, nofollow"` to `Layout` (these
  are private client photos). Layout already honors `robots` when not preview.
- Thumbnails: `urlFor(img).width(500).quality(70).auto('format')` + a retina
  srcset; lightbox large: `urlFor(img).width(2000)` on demand.
- `loading="lazy"` on thumbnails (galleries can be 300+ images).

## Step 3 — Selection UI

- Each thumbnail: a toggle (checkbox or heart) in a corner overlay. Clicking
  the image body opens the lightbox; clicking the toggle selects/deselects.
- Sticky bottom bar: live count ("12 selected", or "12 / 20" when
  `selectionLimit` set) + "Submit my selections" button. Enforce the limit
  (block or warn past N).
- Persist selections in `localStorage` keyed by gallery slug, so a refresh
  doesn't lose picks.
- Lightbox carries a select toggle too, so clients can pick while viewing large.
- Event-delegate the click handlers on `document` (consistent with
  `FaqSection.astro`) so they survive any DOM swap.

## Step 4 — Submission via Web3Forms

Mirror `ContactFormSection.astro` (lines ~73–122 markup, ~144+ script):

- Hidden `access_key` = `stegaClean(notifyKey)` where `notifyKey` resolves to
  the gallery's `notifyEmail`-derived key or `siteSettings.web3formsKey`.
  **stegaClean is required** — the value is posted verbatim to web3forms.com
  (the stega-clean-third-party-payloads rule).
- Honeypot `botcheck` field.
- On submit, build FormData with:
  - `subject`: `Gallery selections: {clientName} — {title}`
  - `client`, `gallery_title`, `gallery_url` (the current URL)
  - `selected_count`
  - `selected_filenames`: the checked images' `originalFilename`, newline-joined
    (a hidden field or serialized textarea). ~300 filenames ≈ ~6KB, well within
    limits.
- POST FormData to `https://api.web3forms.com/submit` (same handler shape as
  the contact form), show a success/error status, confirmation copy
  ("Your N selections were sent to {photographer}").
- No-key fallback: render a "gallery submissions not configured" notice, same
  as the contact form's `!isConfigured` branch.
- **Web3Forms free = 250 submissions/mo**, shared with the contact form on that
  client's key. Note in client docs.

Serialize-selections-to-payload should be a small **pure function** so it's
unit-testable (see Step 7).

## Step 5 — Passcode gate + cache interaction (optional)

Only if `passcode` is set on the gallery:

- Render a passcode form first; on correct entry, set a short-lived cookie
  (e.g. `__gallery_<hash>`) and show the gallery.
- **The unlocked view must not be edge-cached** (or CF could serve one
  client's unlocked gallery to another). Add a condition in `src/middleware.ts`
  to mark `/gallery/` paths non-cacheable **when the gallery cookie/passcode is
  in play** — simplest: exclude all `/gallery/` paths from the cache write +
  lookup (one `startsWith('/gallery/')` check beside the existing
  `cacheEligible` logic). Galleries are low-traffic, so skipping the edge cache
  for them is a non-issue.

If no passcode (URL-secrecy only), the gallery HTML **can** be edge-cached
normally — the URL is the secret and anyone with it can view anyway.

## Step 6 — Feature flag (opt-in per client)

- `siteSettings.clientGalleriesEnabled` (boolean, default false), per the
  schema-gated-feature-flag pattern.
- When false: hide the "Client Galleries" list in Studio structure, and the
  route can 404. When true: the photographer sees the section and can create
  galleries.
- Keeps the feature invisible for clients who don't want it.

## Step 7 — Tests + verification

Add to the Vitest suite (`tests/`):

- The selections→Web3Forms-payload serializer (pure function): correct
  filename list, count, subject; empty-selection guard; stega-cleaned key.
- Any slug/token helper logic.

Verify on the demo before fan-out:

- [ ] Create a `clientGallery` with ~20 images in the demo Studio
- [ ] `/gallery/<slug>/` renders thumbnails, lazy-loads, 404s on bad slug + after `expiresAt`
- [ ] Click → lightbox large view
- [ ] Select toggles + count + `selectionLimit` enforcement + localStorage persistence
- [ ] Submit → photographer receives the email with the filename list
- [ ] `<meta name="robots" content="noindex, nofollow">` present; gallery NOT in `sitemap.xml`
- [ ] (If passcode) gate works AND `/gallery/` is not edge-cached (`x-cache-status: MISS` on the unlocked view)
- [ ] No-key fallback notice shows when the Web3Forms key is unset

## Privacy checklist

- Unguessable slug (random token suffix) — primary access control
- `noindex, nofollow` on every gallery page
- Exclude `/gallery/` from `sitemap.xml.ts`
- Optional passcode for sensitive shoots (+ cache exclusion)
- Optional `expiresAt` so old galleries auto-close

## Out of scope for v1 (note as v2)

- Selections **recorded** in a dashboard (vs emailed) — needs a Worker + KV/D1
  (still Free-tier-able)
- Originals on Cloudflare R2 instead of Sanity (only if a client goes
  high-volume)
- Client-side ZIP download of selected images
- Per-image comments from the client

## Effort

~3–4 days for a polished v1: schema + structure (½d), route + grid + lightbox
reuse (1d), selection UI + localStorage (1d), Web3Forms submission +
states (½d), passcode + cache exclusion + flag + tests + verify (1d).
