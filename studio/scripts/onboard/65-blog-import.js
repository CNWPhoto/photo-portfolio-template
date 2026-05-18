// 65-blog-import.js — create blogPost docs from .staging/<slug>/blog/posts.json.
//
// Run via sanity exec inside the swapped client env (npm wrapper handles
// the dotenv; runbook shows the .env swap dance, same as 60-overlay):
//   cp studio/.env.<slug>-backup studio/.env
//   cd studio && npx sanity exec scripts/onboard/65-blog-import.js \
//     --with-user-token -- --slug=kelly-mac-studios
//   (restore dev .env after)
//
// Idempotent: each post gets a deterministic _id (blogPost-<postSlug>),
// createOrReplace, cover images SHA-deduped by Sanity. Re-run freely.
// Self-contained (no ESM lib import — runs under esbuild-register/CJS).

import {getCliClient} from 'sanity/cli'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
function getArg(name, {required = false, fallback} = {}) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  const v = hit ? hit.split('=').slice(1).join('=') : fallback
  if (required && !v) throw new Error(`Missing required --${name}=<value>`)
  return v
}
const slug = getArg('slug', {required: true})
const BLOG = path.join(REPO_ROOT, '.staging', slug, 'blog')
const posts = JSON.parse(fs.readFileSync(path.join(BLOG, 'posts.json'), 'utf8'))
const client = getCliClient()

async function withRetry(label, fn, tries = 4) {
  for (let i = 1; i <= tries; i++) {
    try { return await fn() } catch (e) {
      const st = e?.statusCode || e?.response?.statusCode
      if ((st && st < 500 && st !== 429) || i === tries) throw e
      const w = 800 * 2 ** (i - 1)
      console.warn(`  ↻ ${label} (try ${i}/${tries}) retry ${w}ms`)
      await new Promise((r) => setTimeout(r, w))
    }
  }
}
const key = () => Math.random().toString(36).slice(2, 14)
function blocks(paras) {
  return (paras || []).map((t) => ({
    _key: key(), _type: 'block', style: 'normal', markDefs: [],
    children: [{_key: key(), _type: 'span', text: t, marks: []}],
  }))
}

async function main() {
  if (client.config().projectId === 'hx5xgigp')
    throw new Error('Refusing to import blog into hx5xgigp (the demo).')
  console.log(`[blog-import] ${slug} → ${client.config().projectId}: ${posts.length} posts`)

  // Donor-seed drags the donor's demo blog posts along ("This is a test
  // blog post", "Another blog post") with random UUIDs. Ours all use the
  // deterministic id blogPost-<slug>. Anything else is donor cruft —
  // delete it (incl. drafts) so the client's blog is only her real posts.
  const junk = await client.fetch(
    `*[_type=="blogPost" && !(_id match "blogPost-*") && !(_id match "drafts.blogPost-*")]._id`,
  )
  if (junk.length) {
    const ids = [...new Set(junk.flatMap((id) => [id, `drafts.${id}`, id.replace(/^drafts\./, '')]))]
    const tx = client.transaction()
    ids.forEach((id) => tx.delete(id))
    await withRetry('purge donor blog cruft', () => tx.commit())
    console.log(`[blog-import] removed ${junk.length} donor demo blog post(s)`)
  }

  let ok = 0
  for (const p of posts) {
    let cover
    if (p.cover) {
      const abs = path.join(REPO_ROOT, '.staging', slug, p.cover)
      if (fs.existsSync(abs)) {
        const asset = await withRetry(`upload ${p.slug}`, () =>
          client.assets.upload('image', fs.readFileSync(abs), {filename: path.basename(abs)}),
        )
        cover = {
          _type: 'image',
          asset: {_type: 'reference', _ref: asset._id},
          alt: p.title,
        }
      }
    }
    const doc = {
      _id: `blogPost-${p.slug}`,
      _type: 'blogPost',
      title: p.title,
      slug: {_type: 'slug', current: p.slug},
      publishDate: p.publishDate || new Date().toISOString().slice(0, 10),
      ...(p.excerpt ? {excerpt: p.excerpt} : {}),
      ...(cover ? {coverImage: cover} : {}),
      body: blocks(p.body),
    }
    await withRetry(`create ${p.slug}`, () => client.createOrReplace(doc))
    ok++
    console.log(`  + ${p.title.slice(0, 60)} (${doc.publishDate})`)
  }

  // Make sure the blog is switched on so the posts are reachable.
  try {
    await withRetry('enable blog', () =>
      client.patch('blogPage').set({blogEnabled: true}).commit(),
    )
  } catch { /* blogPage may not exist on every donor — non-fatal */ }

  console.log(`[blog-import] done: ${ok}/${posts.length} posts`)
  console.log(`[blog-import] NOTE: body is plain paragraphs — headings/inline`)
  console.log(`  images need a Studio pass on any post she wants polished.`)
}

main().catch((e) => { console.error('[blog-import] FAILED:', e); process.exit(1) })
