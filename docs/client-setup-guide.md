# Client Site Setup Guide
## Deploying a New Photography Portfolio to Cloudflare Pages

This guide covers everything needed to launch a new client site from scratch —
from Sanity to Cloudflare to live domain. Follow the steps in order.

---

## Architecture Overview

```
GitHub Repo (your template)
    │
    ├── Cloudflare Pages: client-smith       ← client A
    ├── Cloudflare Pages: client-jones       ← client B
    └── Cloudflare Pages: client-williams    ← client C
```

Each client gets:
- Their own **Cloudflare Pages project** connected to your GitHub repo
- Their own **Sanity project** (separate CMS, separate content, separate billing)
- Their own **environment variables** pointing to their Sanity project
- Their own **custom domain** managed in Cloudflare DNS

Code updates you push to `main` redeploy all client sites automatically.
Client content lives entirely in Sanity — it is never touched by code updates.

---

## One-Time Template Prep (Do This Once)

These changes are needed before you can deploy any client site. You only do
this once on the template repo.

### Step 1 — Switch Sanity IDs to environment variables

Open `src/lib/sanity.js` and replace the hardcoded IDs:

```js
// BEFORE
const config = {
  projectId: 'hx5xgigp',
  dataset: 'production',
  apiVersion: '2024-01-01',
}

// AFTER
const config = {
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset:   import.meta.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
}
```

### Step 2 — Switch to the Cloudflare adapter

The current adapter (`@astrojs/node`) does not run on Cloudflare Pages.

```sh
# From repo root
npm remove @astrojs/node
npm install @astrojs/cloudflare
```

Open `astro.config.mjs` and replace:

```js
// BEFORE
import node from '@astrojs/node';
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
});

// AFTER
import cloudflare from '@astrojs/cloudflare';
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
});
```

### Step 3 — Update `.env.example`

Add the new required variables so you remember them for each client:

```
PUBLIC_SANITY_PROJECT_ID=
PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=
SANITY_PREVIEW_SECRET=
SANITY_STUDIO_PREVIEW_URL=https://yourclient.com
```

### Step 4 — Commit and push

```sh
git add -A
git commit -m "switch to Cloudflare adapter and env var Sanity config"
git push
```

---

## Per-Client Setup — Complete Launch Checklist

### PHASE 1 — Sanity (CMS)

**1.1 — Create a new Sanity project**

1. Go to [sanity.io/manage](https://sanity.io/manage)
2. Click **Create new project**
3. Name it something clear: `Smith Photography`
4. Choose **Production** dataset (already created by default)
5. Copy the **Project ID** shown on the project dashboard — you will need it

**1.2 — Deploy the Sanity Studio for this client**

The Studio lives in the `studio/` folder of your repo. Each client needs their
own deployed Studio pointed at their own project ID.

1. Open `studio/sanity.config.js` in your editor
2. Change `projectId` to the new client's project ID
3. Change `title` to the client's name (e.g. `'Smith Photography'`)
4. Deploy:
   ```sh
   cd studio
   npm install
   npm run deploy
   ```
5. Sanity will give you a hosted Studio URL:
   `https://smith-photography.sanity.studio`
6. Share this URL with the client

> **Important:** After deploying, revert `studio/sanity.config.js` back to your
> template values before committing, or keep a per-client branch for the Studio
> config. The Studio config does not need to be in the same repo as the frontend.

**1.3 — Create a Sanity API Read Token**

1. In [sanity.io/manage](https://sanity.io/manage), open the client's project
2. Go to **API → Tokens**
3. Click **Add API Token**
   - Name: `Cloudflare Preview`
   - Permissions: **Viewer**
4. Copy the token — you will only see it once

**1.4 — Generate a Preview Secret**

Run in your terminal:
```sh
openssl rand -hex 32
```
Copy the output. This is your `SANITY_PREVIEW_SECRET`.

**1.5 — Add CORS origins in Sanity**

1. In Sanity manage → **API → CORS Origins**
2. Add these (you'll add the real domain again after Step 3):
   - `http://localhost:4321` (development)
   - `https://*.pages.dev` (Cloudflare preview URLs) — check **Allow credentials**
   - `https://clientdomain.com` — check **Allow credentials**
   - `https://www.clientdomain.com` — check **Allow credentials**

---

### PHASE 2 — Cloudflare Pages

**2.1 — Create a new Pages project**

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Go to **Workers & Pages → Create application → Pages → Connect to Git**
3. Authorize GitHub if not already done
4. Select your **photo-portfolio-template** repo
5. Name the project: `smith-photography` (lowercase, hyphens only)
6. Set build settings:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (leave blank)
7. Click **Save and Deploy** — it will fail on first deploy because env vars
   aren't set yet. That's expected. Continue to the next step.

**2.2 — Set environment variables**

In the new Pages project, go to **Settings → Environment Variables**.
Add the following under **Production** (and optionally **Preview**):

| Variable | Value |
|---|---|
| `PUBLIC_SANITY_PROJECT_ID` | The client's Sanity project ID (e.g. `abc123xy`) |
| `PUBLIC_SANITY_DATASET` | `production` |
| `SANITY_API_READ_TOKEN` | The Viewer token from Step 1.3 |
| `SANITY_PREVIEW_SECRET` | The secret from Step 1.4 |
| `SANITY_STUDIO_PREVIEW_URL` | `https://clientdomain.com` |

> Variables prefixed `PUBLIC_` are embedded in client-side code.
> Never put sensitive secrets (tokens) in `PUBLIC_` variables.

**2.3 — Trigger a new deployment**

1. Go to **Deployments** in the Pages project
2. Click **Retry deployment** on the failed one, or push any small commit to trigger a rebuild
3. Wait for the build to complete (2–4 minutes)
4. Open the `.pages.dev` preview URL and confirm the site loads

---

### PHASE 3 — Domain Setup

**3.1 — Add the client's domain to Cloudflare**

If the domain is not already on Cloudflare:
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Add a site**
2. Enter the client's domain (e.g. `smithphotography.com`)
3. Choose the **Free** plan (sufficient for most clients)
4. Cloudflare will scan existing DNS records — review and confirm them
5. Give the client the two **Cloudflare nameservers** shown
6. Client updates nameservers at their domain registrar (GoDaddy, Namecheap, etc.)
7. Wait for DNS propagation — usually 15 minutes to 2 hours

**3.2 — Connect the custom domain to Cloudflare Pages**

1. In your Pages project → **Custom Domains → Set up a custom domain**
2. Enter: `smithphotography.com`
3. Cloudflare will automatically add the CNAME record in DNS
4. Repeat for `www.smithphotography.com` — Cloudflare will redirect www → root
5. SSL certificates are provisioned automatically (5–15 minutes)

**3.3 — Update CORS and preview URL**

Now that the real domain is known:
1. In Sanity manage → **CORS Origins** — confirm the live domain was added (Step 1.5)
2. In Cloudflare Pages → **Environment Variables** — update `SANITY_STUDIO_PREVIEW_URL`
   to `https://smithphotography.com`
3. Redeploy (push a commit or use Retry deployment)

---

### PHASE 4 — Contact Form (Web3Forms)

**4.1 — Create a Web3Forms account for the client**

> Tip: Create the account using the **client's email address** so form
> submissions land directly in their inbox and they own the account.

1. Go to [web3forms.com](https://web3forms.com)
2. Enter the client's email and click **Create Access Key**
3. Check the client's email for the verification link
4. Copy the **Access Key** shown after verification

**4.2 — Enter the key in Sanity**

1. Open the client's Sanity Studio
2. Go to **Site Settings → Contact Page**
3. Paste the Access Key into **Web3Forms Key**
4. Fill in the submit button text and success message
5. Publish

**4.3 — Test the form**

1. Open the live contact page
2. Submit a test message
3. Confirm the email arrives in the client's inbox
4. Check the Web3Forms dashboard for the submission log

---

### PHASE 5 — Initial Content Setup

Walk through the Sanity Studio with the client (or fill it yourself):

**Site Settings**
- [ ] Site & Theme — site name, color theme, font, logo, accent color
- [ ] Navigation — add nav links, choose nav variant
- [ ] Footer — social links, copyright text, privacy/terms links
- [ ] Social — Instagram, Facebook, YouTube, TikTok URLs
- [ ] SEO — site URL (must include `https://`), business phone, city/state, Twitter handle

**Pages**
- [ ] Homepage — hero images, section order, toggle sections on/off
- [ ] About Page — bio, headshot, approach section
- [ ] Experience / Pricing — packages, FAQs, process steps
- [ ] Portfolio — gallery images
- [ ] Blog — enable/disable, add first post
- [ ] Contact — hero image, heading, info text, form settings
- [ ] 404 Page — message and CTA

**Content**
- [ ] Add at least 3–5 testimonials
- [ ] Upload portfolio images
- [ ] Write or draft first blog post

---

### PHASE 6 — Pre-Launch Checklist

- [ ] Site loads on `https://clientdomain.com` with valid SSL (green padlock)
- [ ] `www` redirects to non-www (or vice versa)
- [ ] Contact form submits and email is received
- [ ] All nav links work
- [ ] Portfolio images load correctly
- [ ] Blog renders (or is disabled cleanly if not ready)
- [ ] Google Search Console — add property, submit sitemap: `https://clientdomain.com/sitemap.xml`
- [ ] Verify `robots.txt`: `https://clientdomain.com/robots.txt`
- [ ] Verify web manifest: `https://clientdomain.com/manifest.json`
- [ ] Mobile layout looks correct (check on a real phone)
- [ ] Share Sanity Studio URL with client and walk them through editing content

---

## Quick Reference — Per-Client Variables

Keep a secure record of these for each client (use 1Password or similar):

| Item | Where to find it |
|---|---|
| Sanity Project ID | sanity.io/manage → project dashboard |
| Sanity Read Token | sanity.io/manage → API → Tokens |
| Preview Secret | Generated with `openssl rand -hex 32` |
| Web3Forms Key | web3forms.com dashboard |
| Studio URL | After `npm run deploy` in `studio/` |
| Pages URL | Cloudflare → Pages project → Deployments |
