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

### What you'll need

- [Node.js](https://nodejs.org/) v18 or later
- A [Sanity account](https://sanity.io) (free)
- A hosting account (Netlify, Vercel, or similar)
- A GitHub account

### Step 1 — Fork or clone the repo

Fork this repository into your own GitHub account (or the client's), then clone it locally:

```sh
git clone https://github.com/your-account/your-repo.git
cd your-repo
npm install
cd studio && npm install && cd ..
```

### Step 2 — Create a Sanity project

If this is a new client (not reusing an existing Sanity project):

1. Go to [sanity.io/manage](https://sanity.io/manage) and create a new project
2. Update the `projectId` in both files:
   - `studio/sanity.config.js`
   - `src/lib/sanity.js`
3. Update the dataset name if you changed it from `production`

### Step 3 — Set environment variables

Create a `.env` file in the project root (copy from `.env.example`):

```sh
cp .env.example .env
```

#### `SANITY_API_READ_TOKEN`

Required for the live preview feature.

1. [sanity.io/manage](https://sanity.io/manage) → your project → **API** → **Tokens**
2. Click **Add API token** → name it `Preview` → role: **Viewer**
3. Copy the token into `.env`

#### `SANITY_PREVIEW_SECRET`

A random password that authenticates preview requests. Generate one:

```sh
openssl rand -hex 32
```

Paste the output into `.env`.

### Step 4 — Deploy the Astro site

The site uses `@astrojs/node` by default. Swap the adapter in `astro.config.mjs` for your hosting platform before deploying:

| Platform | Package |
| --- | --- |
| Netlify | `@astrojs/netlify` |
| Vercel | `@astrojs/vercel` |
| Cloudflare | `@astrojs/cloudflare` |

See the [Astro adapters guide](https://docs.astro.build/en/guides/on-demand-rendering/) for installation instructions.

Add these environment variables in your hosting platform's dashboard:

```
SANITY_API_READ_TOKEN=   (from step 3)
SANITY_PREVIEW_SECRET=   (from step 3)
SANITY_STUDIO_PREVIEW_URL=https://your-deployed-site.com
```

Connect your GitHub repo to the platform and deploy.

### Step 5 — Deploy Sanity Studio

Deploy the Studio so the client can access it from a browser without running anything locally:

```sh
cd studio
npm run deploy
```

This gives you a URL like `https://your-project.sanity.studio`. Share this link with the client along with an invitation from Sanity's manage dashboard.

### Step 6 — Invite the client to Sanity

1. [sanity.io/manage](https://sanity.io/manage) → your project → **Members**
2. Click **Invite members** → enter the client's email → role: **Editor**

They'll receive an email to set up their account. Once they log in, they only ever need the Studio URL — no code, no terminal.

### Step 7 — Set up the contact form (Web3Forms)

Web3Forms is free (250 submissions/month, no credit card) and takes two minutes. You can either do this yourself during setup or walk the client through it — it's simple enough for them to handle on their own.

1. Go to [web3forms.com](https://web3forms.com)
2. Enter the client's email address → click **Create Access Key**
3. Copy the access key
4. In Sanity Studio → **Pages → Contact → Form** tab → paste the key into **Web3Forms Access Key** → publish

Form submissions will be delivered to whatever email was used in step 2. If the client wants to use a different tool (Typeform, JotForm, HubSpot, etc.), they can paste any embed code into the **Form Embed Code** field in Sanity instead — it will replace the built-in form automatically.

### Niche forking

This template is built for pet photography but works for any photographer niche. Search for `TODO:NICHE` in the codebase to find copy that needs updating per client:

- Studio name/logo: `Nav.astro`, `Footer.astro`
- Hero fallback images: `Hero.astro`
- Intro bio fallback: `Intro.astro`
- Testimonial fallback quotes: `Testimonials.astro`
- Featured section label: `FeaturedDogs.astro`
- How It Works copy: `HowItWorks.astro`
- Why Choose copy: `WhyChoose.astro`
- FAQ fallbacks: `FAQs.astro`

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
| `npm run dev` | Start Studio at localhost:3334 |
| `npm run deploy` | Deploy Studio to Sanity's hosted URL |
