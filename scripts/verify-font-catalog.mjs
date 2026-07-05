// Verifies every fontCatalog entry against Google's css2 API.
// Google hard-fails the ENTIRE css2 request when any family or weight is
// unknown, so a single bad axes string in the catalog would nuke all fonts
// on any site that picks it. Run after ANY catalog edit:
//
//   node scripts/verify-font-catalog.mjs
//
// Exits non-zero if any entry fails. Also verifies a combined two-family
// URL (the shape Layout actually emits) as a sanity check.

import {fontCatalog} from '../src/lib/fontCatalog.js';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

const urlFor = (f) =>
  `https://fonts.googleapis.com/css2?family=${f.family}${f.axes ? `:${f.axes}` : ''}&display=swap`;

let failures = 0;
for (const f of fontCatalog) {
  const url = urlFor(f);
  try {
    const res = await fetch(url, {headers: {'User-Agent': UA}});
    if (res.status === 200) {
      console.log(`OK   ${f.slug}`);
    } else {
      failures++;
      console.error(`FAIL ${f.slug} → HTTP ${res.status}\n     ${url}`);
    }
  } catch (err) {
    failures++;
    console.error(`FAIL ${f.slug} → ${err.message}`);
  }
}

// Combined-URL smoke test (two families in one request, as Layout emits)
const [a, b] = fontCatalog;
const combined = `https://fonts.googleapis.com/css2?family=${a.family}${a.axes ? `:${a.axes}` : ''}&family=${b.family}${b.axes ? `:${b.axes}` : ''}&display=swap`;
const res = await fetch(combined, {headers: {'User-Agent': UA}});
console.log(`combined-URL check: HTTP ${res.status} ${res.status === 200 ? 'OK' : 'FAIL'}`);
if (res.status !== 200) failures++;

if (failures) {
  console.error(`\n${failures} FAILURE(S) — fix axes/family in src/lib/fontCatalog.js before shipping.`);
  process.exit(1);
}
console.log(`\nAll ${fontCatalog.length} catalog entries verified.`);
