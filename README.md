# Photo Portfolio — Documentation

This file covers two audiences. Jump to the section that applies to you.

- [For clients — editing your website](#for-clients--editing-your-website)
- [For developers — deploying a new site](#for-developers--deploying-a-new-site)

---

## For clients — editing your website

Your website is managed through **Sanity Studio**, a browser-based editor your developer has set up for you. You don't need to install anything or use a terminal.

### Logging in

Open the Studio link your developer gave you (it looks like `https://your-name.sanity.studio`). Sign in with the email address they invited you with.

### Editing content

Everything on your site is editable from the left sidebar:

| Section | What you can change |
| --- | --- |
| **Site Settings** | Color theme, fonts, logo, favicon |
| **Navigation** | Links that appear in your menu |
| **Homepage** | Hero images, intro text, how it works, testimonials, FAQs |
| **About Page** | Your bio, photos, and the call-to-action at the bottom |
| **Experience Page** | Pricing, session details, artwork info, FAQs |
| **Portfolio** | Your gallery images |
| **Testimonials** | Client reviews |
| **Blog** | Blog posts |

### Drafts vs. published

Changes you make are saved as **drafts** — they're visible to you in the editor but not yet live on the website.

When you're ready to make a change go live, click the **Publish** button at the bottom of the page.

### Previewing before publishing

Click the **eye icon** (Presentation) in the left sidebar to open a live preview of your site showing your unpublished draft changes. This lets you see exactly what visitors will see before you commit to publishing.

### Setting up your contact form

Your contact form uses **Web3Forms**, a free service that delivers submissions straight to your email inbox. It takes about two minutes to activate.

1. Go to [web3forms.com](https://web3forms.com)
2. Enter your email address and click **Create Access Key** — no account or credit card needed
3. Copy the access key they give you
4. In Sanity Studio, go to **Pages → Contact → Form** tab
5. Paste the key into the **Web3Forms Access Key** field and publish

From that point on, every form submission on your contact page will be emailed to you automatically.

**Free tier includes 250 submissions per month**, which is plenty for a photography inquiry form. If you ever need more, paid plans are available at web3forms.com.

> If you'd prefer to use a different form tool (Typeform, JotForm, HubSpot, etc.), paste its embed code into the **Form Embed Code** field in Sanity instead. That will replace the built-in form entirely.

### Need help?

Reach out to your developer. Do not delete documents or change the document structure — only edit the fields within existing pages and sections.

---

## For developers — deploying a new site

This section is for the developer setting up a new client site from this template. Clients do not need to read this.

### Deployment model at a glance

**One template repo → one GitHub Actions workflow → N client sites on Cloudflare Pages.** Each client owns their own CF account and Sanity project; a scoped CF API token lets the workflow deploy via Direct Upload without Git-integrating the repo to their account (CF's per-repo-per-CF-account constraint forbids that for more than one client).

Branch model:
- **`main`** — demo canary. Every push deploys to `cnw-photo-demo.pages.dev` only.
- **`production`** — client fan-out. Merging `main → production` fans out to every client in parallel.

Break-glass: `git revert HEAD && git push origin production` redeploys every client to the previous good state in 2–5 minutes. Or CF dashboard → client project → Deployments → previous → Rollback for a single-client instant restore.

### Where to read next

- **[`docs/client-setup-guide.md`](./docs/client-setup-guide.md)** — the authoritative step-by-step for setting up a new client. Covers Sanity project creation, Studio deploy, CF Pages Direct Upload project, GitHub Actions workflow matrix entry, DNS, custom domain, Web3Forms, canonical host alignment, pre-launch checklist. Follow this end to end for every new client.
- **[`docs/update-and-maintenance-guide.md`](./docs/update-and-maintenance-guide.md)** — day-to-day workflow once clients are live. Branch strategy, safety checks, schema migration patterns, adding/removing clients from the matrix, monitoring.
- **[`docs/emergency-playbook.md`](./docs/emergency-playbook.md)** — field manual for when something breaks. TL;DR at the top; detailed scenarios with copy-pasteable commands below. Bookmark this.
- **[`docs/page-builder-spec.md`](./docs/page-builder-spec.md)** — architecture spec for the section catalog, JSON-LD/SEO infrastructure, schema decisions.
- **[`docs/rewrite-rollback.md`](./docs/rewrite-rollback.md)** — historical snapshot of the pre-rewrite state and dataset rollback procedure.

### Quick prerequisites

- [Node.js](https://nodejs.org/) v20 (matches `.node-version`)
- A Sanity account (yours — client gets added as Editor, not a new Sanity account per client)
- A Cloudflare account (yours for the demo; each client's CF account is separate)
- A GitHub account with push access to this repo

### What NOT to do

- **Don't Git-connect client CF Pages projects to this repo.** CF only allows one repo per GitHub account → CF account pairing. Use the Direct Upload workflow instead (`.github/workflows/deploy.yml`).
- **Don't fork the template per client.** Forks inherit the same per-GitHub-account-to-CF-account constraint.
- **Don't commit `studio/.env`.** Gitignored on purpose — holds per-client project IDs, preview URLs, app IDs. One file, swapped per-client while working locally.
- **Don't push Sanity schema changes to `production`** without first snapshotting affected client datasets — see the emergency playbook's "Dataset corrupted" scenario.

### Niche forking

All site content (headings, body copy, images, nav, footer, testimonials, FAQs, etc.) lives in Sanity — there is almost nothing niche-specific hardcoded in the Astro components anymore. To reskin the template for a different photography niche (wedding, family, real estate, etc.) you should **not** need to edit any component files. Instead:

1. Update the Sanity `siteSettings` document (site name, photographer name, logo, palette, font theme) in Studio.
2. Create/edit the page documents (homepage, portfolio, about, etc.) — all sections are composed visually in Sanity via the section builder.
3. Upload the client's real photos to the gallery / hero / featured portfolio sections.

The only remaining niche markers in code are tagged with `TODO:NICHE` — run `git grep 'TODO:NICHE'` to see them. Today these are limited to a couple of generic fallback strings in `src/pages/blog.astro` that only render if Sanity is empty, so they're safe to leave untouched for most clients.

### Local development commands

For your own development work — clients never need these.

**Website** (from project root):

| Command | What it does |
| --- | --- |
| `npm run dev` | Start dev server at localhost:4321 |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |

**Studio** (from `studio/` directory):

| Command | What it does |
| --- | --- |
| `npm run dev` | Start Studio at localhost:3333 |
| `npm run deploy` | Deploy Studio to Sanity's hosted URL |
