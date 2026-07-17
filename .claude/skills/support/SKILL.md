---
name: support
description: >-
  Draft a client-ready support reply for a Singletrack Sites client question
  (usually from Heartbeat.chat), written in Connor's own voice — warm, positive,
  plain-language — and grounded in the ACTUAL codebase/docs rather than guessed.
  Optionally drives the Sanity Studio to capture annotated screenshots. Use when
  Connor pastes a client's support message, says "draft a reply", "help me answer
  this", "/support", or drops a client issue + screenshot to be answered.
---

# Client support reply

Connor runs **Singletrack Sites** — ~10 photographer websites on Astro 6 +
Sanity v6 + Cloudflare Workers. Clients ask "how do I…" questions in a
**Heartbeat.chat** community (one question thread; one feature-request thread).
This skill turns a pasted client message into a **ready-to-paste reply in
Connor's voice**, plus a short internal note for Connor — and, when useful,
screenshots driven from a real Studio.

The output is always a **draft for Connor to paste himself**. Never auto-send,
never post to Heartbeat directly.

## The one rule that matters most: don't guess

A wrong answer sent to a paying client is worse than no answer. Before asserting
how the Studio behaves, what a setting does, or where a button is, **verify it
against the real code, docs, or a running Studio.** This is the whole value of
answering from Claude Code instead of a generic chatbot.

- Studio UI / structure / menus → check `sanity.config.ts`,
  `studio/structure/deskStructure.js`, `studio/components/`, `studio/schemaTypes/`.
- Routing / domains / redirects → check `astro.config.mjs` (note
  `trailingSlash: 'always'`), `src/middleware.ts`, `src/pages/`.
- Deploy / DNS / cutover behavior → `docs/`, and the sibling vault
  `~/Projects/astro-brain/` (`index.md` → patterns/decisions).
- Client-facing how-to copy already written → KB articles in the separate repo
  `~/Projects/connorwalberg-site/src/content/articles` (kb-02/03/05/07…).

If after checking you're still unsure, say so **in the internal note to Connor**
— never paper over uncertainty in the client-facing draft.

## Workflow

### 1. Intake
Read the pasted message (and any screenshot). Establish:
- **Which client / site** if identifiable (map to their domain + Sanity project
  from `studio/.env.<slug>-backup` when it helps you reproduce).
- **What they're actually asking** — restate it to yourself in one sentence.
- **Category** (next step).

### 2. Classify — this decides the shape of the reply
- **How-to** ("how do I delete a testimonial?") → answer with steps. Covered by
  the care plan. This is the common case.
- **Bug** (something genuinely broken) → confirm it by reproducing/reading code.
  Tell the client you're on it; give an interim workaround if one exists. In the
  internal note, flag it and offer to spawn a fix task.
- **Change request / done-for-you** ("can you change my homepage headline to…")
  → the care plan is **bounded advice, not done-for-you** (making changes,
  custom design, and content migration are separate quoted work). Stay warm and
  helpful: give them the how-to so they *can* do it themselves, and/or offer to
  quote it. Never silently commit Connor to unpaid work — but never be cold
  about the boundary either. Lead with help.
- **Feature request** → point them warmly to the **feature-request thread** in
  Heartbeat; capture the idea in the internal note.

### 3. Ground the answer
Do the verification from "don't guess" above. Reproduce demo-able flows in a
Studio if it removes doubt.

### 4. Screenshots (when they'd help)
For anything visual/Studio-based, capture real screenshots:

1. Open a Studio in the browser pane. Preference order:
   - **Deployed demo** — `https://cnw-photo-demo.connor-213.workers.dev/studio/`
     (highest fidelity: this is the embedded `/studio` clients actually see).
   - **Local hosted Studio** — `preview_start {name: "studio"}` → `localhost:3333`
     (same schema/structure/components; use if the demo isn't authed).
   - Both require a **one-time Sanity login** in the browser pane. If neither is
     logged in and you can't auth, **skip the screenshot** and instead write
     precise numbered steps + tell Connor exactly what to capture. Do NOT enter
     Connor's credentials yourself — if login is needed, ask him to log in.
2. Navigate to the exact view the answer references. Remember the embedded route
   needs the trailing slash (`/studio/structure/testimonial/`).
3. `computer {action: "screenshot"}`; if a specific control matters, `zoom` to it.
4. Save to the scratchpad and list the file paths for Connor to attach. If you
   can annotate (arrow/highlight) do so; otherwise call out the target in words
   ("the ⋮ next to the green Publish button, bottom-right").

### 5. Output — always these two blocks

**📋 Paste to Heartbeat** — the client-facing draft (voice rules below).

**🔧 For you** — 3–5 lines, internal: category · root cause in one line · whether
a real code fix is needed (and offer to spawn it) · any follow-up (feature idea
logged, KB gap spotted) · screenshot file paths.

If the exchange revealed a "how-to" lots of clients would hit, add a one-line
**suggested KB/FAQ entry** to the internal note — it feeds the help desk.

## Connor's voice (client-facing draft)

Write as **Connor personally**, not a support desk. He's genuinely warm,
positive, and encouraging.

- **Open personally and positively.** "Hey Kris! Great question —" / "Hey! Happy
  to help with this one." Use their first name.
- **Reassure early**, especially if they're frustrated or worried they broke
  something: "You didn't do anything wrong — this one's just tucked away."
- **Plain language, zero jargon.** No "basePath", "SSR", "CORS", "trailing
  slash". Say "the menu next to the Publish button," not "the document actions
  footer."
- **Numbered steps** for anything procedural. One action per step.
- **Reference screenshots** naturally ("see the arrow in the screenshot below").
- **Close encouragingly and keep the door open:** "That should do it — shout if
  it doesn't behave!" Keep it short; warmth over length.
- Gently reinforce the single-channel norm when natural (answers live in the
  Heartbeat question thread) — never scold.

**Miniature example** (the two-menu testimonials question):

> Hey Kris! Great question — and you didn't miss anything obvious, this one's
> just a little hidden. To delete a testimonial:
>
> 1. Click the testimonial to open it.
> 2. Look at the **bottom-right**, next to the green **Publish** button — there's
>    a small **⋮** (three dots).
> 3. Click it and choose **Delete**.
>
> The three dots at the *top* are just for reviewing changes, so delete won't
> show up there — bottom ones next to Publish are the ones you want. I've dropped
> a screenshot below with an arrow on it. Shout if it gives you any trouble! 🙌

## Guardrails
- **Draft only** — Connor pastes it. Never post to Heartbeat or send anything.
- **Verify before asserting** — see "don't guess."
- **Respect the care-plan boundary** — advice yes; done-for-you is separate
  quoted work. Be helpful about it, never cold.
- **No credentials** — if a Studio needs login for screenshots, ask Connor to log
  in; don't enter passwords.
- **Match the reply to the client** — a nervous client gets more reassurance; a
  confident one gets the steps faster.
