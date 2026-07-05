# Launch Checklist — Singh Studio

Ordered runbook, brutally practical. Work top to bottom. Every pointer below has been grep-verified against the actual files as they stand today — if a grep doesn't match after you've made your own edits, that's expected; it means you've already fixed that row.

---

## A. Content blockers

These are the things that will make the site look unfinished or actively broken to a visitor, ranked in the order they'll bite you.

- [ ] **A1 — The booking button does nothing yet.** `js/main.js`, line 14, grep `bookingUrl: ""`. `CONFIG.bookingUrl` is currently an **empty string**, not a placeholder URL — the "Book a Google Meet" button on every page falls back to a pre-filled `mailto:` link, which works but isn't the Google Meet flow the whole site is built around. To fix:
  1. In Google Calendar (signed in as kris@singhstudio.co.nz), create an **Appointment schedule** (e.g. "Intro call", 20 min) — this attaches a Google Meet link automatically to every booking.
  2. Open the schedule → Share → copy the booking-page URL (`https://calendar.app.google/...`).
  3. Paste it into `js/main.js` between the quotes on line 14: `bookingUrl: "https://calendar.app.google/AbC123xyz",`.
  4. This one line fixes the button sitewide — it's read by every page via the shared script, nothing else to touch.

- [ ] **A2 — Footer Instagram/LinkedIn links point nowhere specific.** Identical placeholder block repeated verbatim on **12 of the 13 root pages** (every page except 404.html, which has no footer social row). Grep `https://www.instagram.com/" rel="noopener"` to find every occurrence — it currently links to the generic Instagram and LinkedIn homepages, not a Singh Studio profile. Files to fix (all contain the same two-line block, grep `footer-social` to jump to it in each): `index.html`, `together.html`, `templates.html`, `kris.html`, `archive.html`, `thoughts.html`, `thought-start-with-the-message.html`, `thought-the-20-minute-brief.html`, `case-amplify.html`, `case-more.html`, `case-bandcamp.html`, `case-firezone.html`. Since there's no shared template (no build step, remember), this is a genuine find-and-replace across 12 files, not a one-line fix — a global search/replace tool (`sed -i ''` on macOS) across `*.html` for both URLs is faster than hand-editing each file.

- [ ] **A3 — The Voices section has a placeholder testimonial slide.** `index.html`, grep `This seat is saved`. The second slide in the `05 / Voices` slider is a labelled placeholder (name: "This seat is saved", role: "Client words landing here soon") — ships intentionally, per the README, but needs a real client quote before launch. To swap it in:
  - **Text quote**: copy an `<article class="voice" data-kind="text">` block (there's a real pattern to copy from if you add a second text testimonial later), swap in the real quote and name/role lines, delete the `voice-reserved` class and its two placeholder lines.
  - **Video quote**: drop an mp4 in `assets/video/` (720p H.264, run through `ffmpeg -vf scale=1280:-2 -crf 27` to keep it ~10MB — see the Joy Florals video for the exact pattern already on the page, currently 10MB itself, right at that ceiling), a poster jpg in `assets/img/`, and copy the existing `data-kind="video"` block structure.
  - The slide counter (`01 / 02`) and the arrow buttons auto-adjust to however many slides exist — don't hand-edit `#voiceCount`.

- [ ] **A4 — Seven commented-out price slots in `templates.html`.** Grep `<!-- <p class="tpl-price">From NZ\$X,XXX</p> -->` — one per template card (Toolbelt, Counter, Ledger, Commons, Programme, Folio, Storefront), all currently commented out, all currently reading `From NZ$X,XXX`. Decide: either fill in real numbers and uncomment all seven, or confirm you're happy shipping with "Quoted on the intro call" as the only pricing signal (which is itself a legitimate strategy — just make it a decision, not a default).

- [ ] **A5 — Three commented-out price slots in `together.html`.** Grep `<!-- <p class="tg-meta">` — one per engagement card (Project, Retainer, Sprint). Same decision as A4: fill and uncomment, or confirm the visible "Typical: 2–6 weeks · fixed quote" / "Monthly · three-month minimum" / "Five working days · flat rate" lines are enough on their own.

- [ ] **A6 — `kris.html`'s earlier-roles slot and CV PDF are both empty.** Two separate things in one file:
  - Grep `Add earlier roles:` (around line 161) — a commented-out `<div class="fact">` template sits under "03 / Selected history", waiting for any pre-2018 work history you want to include. Currently the history starts at 2018 (photography practice) with nothing before it. Decide if that's the story you want to tell, or fill this in.
  - Grep `assets/kris-singh-cv.pdf` — the "Request the CV" button currently opens a `mailto:` link. The commented-out swap to a direct PDF download is right below it, but **the PDF file itself does not exist yet** (`assets/kris-singh-cv.pdf` is not present in `assets/`). If you want the direct-download version, export the CV to that exact path first, then uncomment the swap.

- [ ] **A7 — One line in the "Start with the message" essay makes a specific factual claim — own it or soften it.** `thought-start-with-the-message.html`, grep `We’ve built the wrong artefact for the right brief before` (note: this uses a curly apostrophe in the source, not a straight one). The full sentence: *"You don't choose the vehicle until you know the road. We've built the wrong artefact for the right brief before. It's an expensive way to learn that."* This reads as a confident admission of a real past mistake — decide if that's true and you're comfortable naming it publicly under your own byline, or soften it to a more general statement (e.g. "It's easy to build the wrong artefact for the right brief" removes the first-person admission while keeping the point).

- [ ] **A8 — Verify both `thought-*.html` posts actually read as your voice.** The README is explicit that these ship as studio-voice drafts meant to be edited "until they sound like you" before launch, not published as-is by default. Read both in full: `thought-start-with-the-message.html` (grep `Most briefs arrive pre-solved` for the opening line) and `thought-the-20-minute-brief.html` (grep `The intro call is twenty minutes on Google Meet` for its opening line). Full copy inventory with every paragraph, sidenote and blockquote is in `CONTENT-GUIDE.md` under each post's own section — use that as your line-by-line edit pass rather than re-reading the raw HTML.

- [ ] **A9 — Two case-study meta descriptions are cut off mid-sentence.** Both the `<meta name="description">` and `<meta property="og:description">` tags are identical duplicates within each file, and both are truncated in the same two files:
  - `case-amplify.html`, grep `feel the way "` — ends on "...and feel the way " (trailing space, sentence never finishes). The visible on-page copy in the case body **does** finish the thought ("...and feel the way the event sounds: loud, young, certain") — the meta tag just needs the same ending pasted in.
  - `case-firezone.html`, grep `across t"` — ends mid-word on "...community spread across t" (missing "he Pacific"). Same fix: the on-page brief text already has the complete sentence, grep `a community spread across the Pacific` to find it and copy the ending into both meta tags.

- [ ] **A10 — Two frame-count numbers disagree and don't auto-sync.** `archive.html`'s `#archiveCount` is live-recounted by `js/archive.js` from the actual figures on the page (currently **37 frames / 4 sets** — don't hand-edit this one, it fixes itself). `index.html`'s light-table end-card is a hand-typed string reading **"40 frames / 4 sets"** (grep `40 frames / 4 sets`) that does **not** auto-update. Either add 3 more frames to archive.html to make 40 true, or change index.html's hard-coded text to say 37. Do this last, after any other archive edits, so you're reconciling against the final real count.

---

## B. Domain & meta (only if the live domain is NOT singhstudio.co.nz)

Skip this whole section if the site is genuinely deploying to `singhstudio.co.nz`. If it's going anywhere else — a subdomain, a different TLD, a staging URL before the real domain is ready — every one of these needs updating, and there are more of them than you'd expect because there's no templating layer to catch them all in one place.

- [ ] **B1 — Canonical tags, 12 files.** Every root page except 404.html carries a `<link rel="canonical" href="https://singhstudio.co.nz/...">` tag (grep `rel="canonical"` in any file to find its line). 404.html correctly has none (it's a `noindex` page, no canonical needed).
- [ ] **B2 — og:image absolute URLs, 12 files.** Every `<meta property="og:image" content="https://singhstudio.co.nz/assets/img/...">` tag is a full absolute URL, not a relative path — necessary for social-share previews to resolve the image correctly. See `IMAGE-MAP.md`'s "og:image usage" table for the exact file each page points to.
- [ ] **B3 — BlogPosting schema `mainEntityOfPage`, 2 files.** Both `thought-start-with-the-message.html` and `thought-the-20-minute-brief.html` embed a JSON-LD block with `"mainEntityOfPage":"https://singhstudio.co.nz/thought-*.html"` — grep `mainEntityOfPage` in each to find it.
- [ ] **B4 — `sitemap.xml`, 12 URLs.** Every `<loc>` entry is a full `https://singhstudio.co.nz/...` URL. All 12 indexable pages are listed (404.html and the 7 `templates/*.html` demos are correctly absent, since the demos are `noindex`).
- [ ] **B5 — `robots.txt`, 1 line.** Grep `Sitemap:` — points at `https://singhstudio.co.nz/sitemap.xml`.
- [ ] **B6 — `feed.xml`, 6 URLs.** The RSS feed's channel `<link>`, its self-referencing `<atom:link href>`, and both `<item>`'s `<link>` + `<guid>` pairs are all absolute `https://singhstudio.co.nz/...` URLs.
- [ ] **B7 — NOT the email address.** `kris@singhstudio.co.nz` appears dozens of times sitewide (mailto links, footer text, schema `email` fields) and is **independent of the website's hosting domain** — leave every instance of it exactly as is unless the email address itself is actually changing, which is a different decision from where the site is hosted.
- [ ] **B8 — Quick verification after editing.** Once you've updated B1–B6, re-run: `grep -rn "singhstudio.co.nz" --include="*.html" --include="*.xml" --include="*.txt" .` from the `Website/` folder and confirm every remaining hit is either a `kris@singhstudio.co.nz` email address (correct, leave it) or an instance of your actual new domain (correct, that's the point) — nothing should still say `singhstudio.co.nz` if that's not where you're deploying.

---

## C. Deploy

- [ ] **C1 — Drag-and-drop the `Website/` folder** to Cloudflare Pages or Netlify (both accept a static folder with zero build step — this site has no `package.json`, no build command, nothing to configure beyond "serve this folder"). GitHub Pages and Vercel work too if you prefer either.
- [ ] **C2 — Add the custom domain** in the host's dashboard and confirm **HTTPS** is issued and active (both Cloudflare Pages and Netlify auto-provision a certificate — this can take a few minutes after DNS propagates, don't panic if it's not instant).
- [ ] **C3 — Confirm `404.html` actually serves as the 404 page.** Static hosts don't all auto-detect a file literally named `404.html` the same way — Netlify and Cloudflare Pages both do this by convention, but verify by visiting a nonsense URL on the live domain (e.g. `https://yourdomain/this-page-does-not-exist`) and confirming you see the "Lost the/thread" page, not a generic host-branded error page.

---

## D. Post-deploy

- [ ] **D1 — Re-run a link/integrity scan against the live URL**, not just the local folder. Internal links, asset paths and the sitemap all need re-checking once they're resolving through a real domain and HTTPS rather than a local static server — a broken relative path can hide locally and only surface once real routing is in play.
- [ ] **D2 — Run a Lighthouse pass** against the live URL (Chrome DevTools → Lighthouse, or `npx lighthouse https://yourdomain --view`). This site is built to be fast (zero dependencies, self-hosted fonts, lazy-loaded images) — a bad score post-deploy usually means a hosting/caching config issue, not a code issue, so it's worth catching early.
- [ ] **D3 — Submit `sitemap.xml` in Google Search Console** (and Bing Webmaster Tools if you care about Bing search traffic) once the domain is live and verified. This is also the point to double-check `robots.txt` is being served correctly and isn't accidentally blocking crawlers (`curl https://yourdomain/robots.txt` from a terminal is the fastest sanity check).
- [ ] **D4 — Test the booking flow end-to-end**, live, as if you were a stranger finding the site: click "Book a Google Meet" from the homepage contact section, from the nav "Book a call" button, and from at least one sub-page — confirm it opens the real Google Calendar appointment page (not the `mailto:` fallback, which means A1 above didn't actually get saved/deployed). Then actually book a test slot yourself and confirm you receive the calendar invite with a real Google Meet link attached.
- [ ] **D5 — Check both light and dark themes.** The site is time-aware (light mode 7am–7pm Pacific/Auckland for first-time visitors, dark otherwise) with a manual toggle in the nav that overrides and persists via `localStorage`. Load the live site, toggle the theme manually, reload the page, and confirm your manual choice stuck (rather than reverting to the time-based default) — this is the number-one thing that silently breaks if a deploy step strips or blocks localStorage/cookies.
- [ ] **D6 — Test on a real phone**, not just a resized desktop browser window. Specifically check: the burger menu opens/closes cleanly, the horizontal light-table scroll on the homepage degrades to a native swipe strip below 900px (per the README), the archive's masonry grid and lightbox both work with touch, and the booking button/CTA buttons are comfortably tappable. Do this on both iOS and Android if you can get hold of both — Safari and Chrome handle a few of the CSS/JS interactions (view transitions, backdrop filters) differently.

---

## Reference — files touched most often in this checklist

For quick navigation while working through the above:

- `js/main.js` — CONFIG.bookingUrl (A1), booking-window text, theme toggle logic.
- `index.html` — footer social (A2), Voices placeholder (A3), light-table frame count (A10).
- `templates.html` — 7× commented price slots (A4).
- `together.html` — 3× commented price slots (A5).
- `kris.html` — earlier-roles comment + CV PDF slot (A6).
- `thought-start-with-the-message.html` — the essay line to own/soften (A7), voice check (A8).
- `thought-the-20-minute-brief.html` — voice check (A8).
- `case-amplify.html`, `case-firezone.html` — truncated meta descriptions (A9).
- `archive.html` — frame count, auto-syncs (A10).
- `CONTENT-GUIDE.md` — the full page-by-page copy inventory referenced throughout section A.
- `IMAGE-MAP.md` — every image slot, dimensions and replacement specs, referenced throughout section B.
