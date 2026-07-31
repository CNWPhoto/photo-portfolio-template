// Consolidate Heidi Adler's navigation into dropdowns, and repair her footer
// links.
//
// NAV: eight flat top-level items became five plus the Gift A Session CTA.
// Everything a visitor needs to evaluate booking sits under Sessions; the two
// charity book projects sit under Projects, so they stay discoverable without
// reading as a way to book.
//
// A dropdown parent renders as a <button>, not a link (Nav.astro), so any page
// used as a parent must ALSO appear as one of its children or it becomes
// unreachable from the nav. About and Contact stay top-level and clickable for
// that reason.
//
// FOOTER: her three footer links were written as navLink-shaped objects
// ({linkType, internalRef}) during onboarding, but footerSettings.links expects
// footerLink ({url: string}). Footer.astro reads `l.url`, got undefined, and
// filtered all three out — the footer rendered only the Facebook icon. Nothing
// warned; the links simply vanished. Rewritten as the url strings the schema
// expects. Checked across the fleet: Heidi is the only client affected.
//
// Run:
//   cd studio && npx dotenv -e .env.heidi-adler-photography-backup -- \
//     npx sanity exec scripts/migrations/heidi-nav-and-footer.js \
//     --with-user-token -- --slug=heidi-adler-photography --apply

import {getCliClient} from 'sanity/cli'
import fs from 'node:fs'
import path from 'node:path'

const client = getCliClient({apiVersion: '2024-01-01'})
const APPLY = process.argv.includes('--apply')
const slug =
  (process.argv.find((a) => a.startsWith('--slug=')) || '').split('=')[1] || ''

function assertProject() {
  if (!slug) throw new Error('Missing --slug=<slug>')
  const envPath = path.resolve(process.cwd(), `.env.${slug}-backup`)
  const m = fs.readFileSync(envPath, 'utf8').match(/^SANITY_STUDIO_PROJECT_ID=(.*)$/m)
  const expected = m && m[1].trim()
  const actual = client.config().projectId
  if (!expected) throw new Error(`No SANITY_STUDIO_PROJECT_ID in ${envPath}`)
  if (expected !== actual) {
    throw new Error(
      `Refusing to write: --slug=${slug} expects project ${expected}, ` +
        `but the active client is ${actual}. Check studio/.env.`,
    )
  }
}

const GIFT_URL =
  'https://giftup.app/place-order/3f18846d-0dd0-4f35-71a9-08dd0e2358a4'

const internal = (key, label, ref) => ({
  _key: key,
  _type: 'navLink',
  label,
  linkType: 'internal',
  internalRef: {_type: 'reference', _ref: ref},
  enabled: true,
})

const NAV_LINKS = [
  internal('navPortfolio', 'Portfolio', 'portfolio'),
  {
    _key: 'navSessions',
    _type: 'navLink',
    label: 'Sessions',
    enabled: true,
    children: [
      internal('navSessionInfo', 'Session Information', 'page-session'),
      internal('navInvestment', 'Investment', 'page-investment'),
      internal('navFaqs', 'FAQs', 'page-faqs'),
    ],
  },
  {
    _key: 'navProjects',
    _type: 'navLink',
    label: 'Projects',
    enabled: true,
    children: [
      internal('navTailsSonoma', 'Tails of Sonoma County', 'page-tails-of-sonoma-county'),
      internal('navTailsWorld', 'Tails of the World', 'page-tails-of-the-world'),
    ],
  },
  internal('navAbout', 'About', 'pageAbout'),
  internal('navContact', 'Contact', 'pageContact'),
  {
    _key: 'navGift',
    _type: 'navLink',
    label: 'Gift A Session',
    linkType: 'external',
    url: GIFT_URL,
    openInNewTab: true,
    enabled: true,
  },
]

// footerLink shape: {label, url} — NOT navLink. See header note.
const FOOTER_LINKS = [
  ['footSession', 'Sessions', '/session/'],
  ['footInvestment', 'Investment', '/investment/'],
  ['footFaqs', 'FAQs', '/faqs/'],
  ['footPortfolio', 'Portfolio', '/portfolio/'],
  ['footAbout', 'About', '/about/'],
  ['footContact', 'Contact', '/contact/'],
].map(([_key, label, url]) => ({
  _key,
  _type: 'footerLink',
  label,
  url,
  enabled: true,
}))

async function save(id, patch) {
  await client.patch(id).set(patch).commit()
  const d = await client.getDocument(`drafts.${id}`)
  if (d) await client.patch(`drafts.${id}`).set(patch).commit()
}

async function run() {
  assertProject()
  console.log(`${client.config().projectId} — ${APPLY ? 'APPLYING' : 'DRY RUN'}\n`)

  const nav = await client.getDocument('navSettings')
  console.log(`  NAV  ${(nav.links || []).length} flat items -> ${NAV_LINKS.length} top-level`)
  for (const l of NAV_LINKS) {
    if (l.children) {
      console.log(`    ${l.label} ▾`)
      for (const c of l.children) console.log(`        ${c.label}`)
    } else {
      console.log(`    ${l.label}`)
    }
  }

  const foot = await client.getDocument('footerSettings')
  const broken = (foot.links || []).filter((l) => !l.url)
  console.log(
    `\n  FOOTER  ${(foot.links || []).length} link(s), ${broken.length} rendering nowhere ` +
      `(${broken.map((b) => b.label).join(', ') || 'none'})`,
  )
  console.log(`          -> ${FOOTER_LINKS.length} links with real hrefs`)

  if (!APPLY) {
    console.log('\n  DRY RUN — nothing written.')
    return
  }
  await save('navSettings', {links: NAV_LINKS})
  await save('footerSettings', {links: FOOTER_LINKS})
  console.log('\n  ✓ nav + footer updated')
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
