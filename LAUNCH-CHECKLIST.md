# Launch Checklist — Singh Studio

Ordered runbook, brutally practical. Work top to bottom. Every pointer below has been grep-verified against the actual files as they stand today — if a grep doesn't match after you've made your own edits, that's expected; it means you've already fixed that row.

**Re-verified 2026-07-08 (post-elevation, Wave 6).** The site shipped a round of brand, conversion, UX, performance and SEO work since this checklist was first written — several rows below were resolved as a side effect and are now struck through with that date. Items left unstruck are still genuinely open; don't assume "elevation shipped" means "launch-ready," these are separate content/business decisions only Kris can make. Also new since this checklist was written: `bin/check-site.py` (run it — see README's "QA tooling" section) covers a lot of what section A/B below used to require manual grepping for.

---

## A. Content blockers

These are the things that will make the site look unfinished or actively broken to a visitor, ranked in the order they'll bite you.

- [x] ~~**A1 — The booking button does nothing yet.** `js/main.js`, line 14, grep `bookingUrl: ""`. `CONFIG.bookingUrl` is currently an **empty string**, not a placeholder URL — the "Book a Google Meet" button on every page falls back to a pre-filled `mailto:` link, which works but isn't the Google Meet flow the whole site is built around.~~ **RESOLVED 2026-07-08** — `CONFIG.bookingUrl` is live: `https://calendar.app.google/vMWDbHmj9NgqmHc48`. Booking works sitewide (nav, hero, contact card all open it in a new tab). See README's "Google Meet bookings — LIVE" section.

- [x] ~~**A2 — Footer Instagram/LinkedIn links point nowhere specific.** Identical placeholder block repeated verbatim on **12 of the 13 root pages**... it currently links to the generic Instagram and LinkedIn homepages, not a Singh Studio profile.~~ **RESOLVED 2026-07-08, differently than originally scoped** — rather than filling in placeholder URLs, the social links were removed sitewide (no real profiles existed yet — a placeholder link to a generic homepage was worse than no link). `.footer-social` CSS still exists, ready for real URLs whenever profiles exist. See README's "Social links — removed, how to re-add" section for the exact markup to paste back in.

- [ ] **A3 — The Voices section has a placeholder testimonial slide.** `index.html`, grep `This seat is saved`. The second slide in the `04 / Voices` slider (this row previously said `05 /` — corrected 2026-07-08 against the live markup, which reads `04 /`) is a labelled placeholder (name: "This seat is saved", role: "Client words landing here soon") — ships intentionally, per the README, but needs a real client quote before launch. Still open as of 2026-07-08. To swap it in:
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

- [x] ~~**A9 — Two case-study meta descriptions are cut off mid-sentence.**~~ **RESOLVED 2026-07-08** — both `case-amplify.html` and `case-firezone.html` now carry complete, correctly-punctuated meta/og descriptions ending in a full stop. `bin/check-site.py`'s head-metadata check now guards against this regressing (it flags any indexable page whose description doesn't end in `.`/`?`/`!`).

- [x] ~~**A10 — Two frame-count numbers disagree and don't auto-sync.**~~ **RESOLVED 2026-07-08** — archive.html now has 40 `.ph` figures across its 4 sets, matching index.html's hard-coded "40 frames / 4 sets" light-table end-card. (archive.html's static HTML fallback text still literally reads "37 frames / 4 sets" in the source — that's fine, it's inert placeholder text that `js/archive.js` overwrites with the live DOM count on every page load, same mechanism as always; nothing to fix there.)

---

## B. Domain & meta — RESOLVED 2026-07-08, canonical host is `www.singhstudio.co.nz`

This section originally asked "is the domain singhstudio.co.nz?" — the actual answer turned out to be more specific than that question assumed: the site deploys to the **`www` subdomain**, not the bare apex, with the apex 301-redirecting to `www` (GitHub Pages' standard custom-domain pattern with a CNAME record). Every row below has been re-pointed at `www.singhstudio.co.nz` and verified consistent sitewide — `bin/check-site.py`'s head-metadata check now guards B1 (canonical) automatically on every push, so this whole section should stay true without manual re-checking going forward.

- [x] ~~**B1 — Canonical tags, 12 files.**~~ All 12 indexable pages carry `<link rel="canonical" href="https://www.singhstudio.co.nz/...">`. Enforced by `bin/check-site.py` from here on.
- [x] ~~**B2 — og:image absolute URLs, 12 files.**~~ All `og:image` tags are absolute `https://www.singhstudio.co.nz/assets/img/...` URLs. See `IMAGE-MAP.md`'s "og:image usage" table for which file each page points to.
- [x] ~~**B3 — BlogPosting schema `mainEntityOfPage`, 2 files.**~~ Both thought posts' JSON-LD use the `www.` host.
- [x] ~~**B4 — `sitemap.xml`, 12 URLs.**~~ All 12 `<loc>` entries are `https://www.singhstudio.co.nz/...`. 404.html and the 7 `templates/*.html` demos correctly stay absent (demos are `noindex`).
- [x] ~~**B5 — `robots.txt`, 1 line.**~~ `Sitemap:` points at `https://www.singhstudio.co.nz/sitemap.xml`.
- [x] ~~**B6 — `feed.xml`, 6 URLs.**~~ Channel `<link>`, self-referencing `<atom:link href>`, and both items' `<link>`+`<guid>` pairs are all `www.`.
- [ ] **B7 — NOT the email address.** Still applies unchanged: `kris@singhstudio.co.nz` appears dozens of times sitewide (mailto links, footer text, schema `email` fields) and is **independent of the website's hosting domain** — leave every instance of it exactly as is unless the email address itself is actually changing.
- [ ] **B8 — If the domain ever changes again**, re-run `grep -rn "singhstudio.co.nz" --include="*.html" --include="*.xml" --include="*.txt" .` from `Website/` and confirm every hit is either the `kris@singhstudio.co.nz` email (leave it) or the new domain (correct). `bin/check-site.py` will independently flag any canonical that stops matching its own filename, but it won't know what the new domain should say.

---

## C. Deploy — RESOLVED 2026-07-08, site is LIVE

The site deployed via **GitHub Pages** (not Cloudflare Pages/Netlify as originally planned — same "drag and drop a static folder" simplicity, GitHub just happened to be where the repo already lived). Live at **https://www.singhstudio.co.nz**.

- [x] ~~**C1 — Drag-and-drop the `Website/` folder** to Cloudflare Pages or Netlify...~~ **RESOLVED 2026-07-08** — deployed via GitHub Pages instead, served from this repo's `main` branch. `CNAME` file in the repo root pins the custom domain.
- [x] ~~**C2 — Add the custom domain**... confirm HTTPS is issued and active.~~ **RESOLVED 2026-07-08** — `www.singhstudio.co.nz` is live over HTTPS (GitHub Pages auto-provisions the certificate), apex domain 301s to `www`.
- [ ] **C3 — Confirm `404.html` actually serves as the 404 page.** Still worth a manual spot-check periodically — visit a nonsense URL on the live domain (e.g. `https://www.singhstudio.co.nz/this-page-does-not-exist`) and confirm you see the "Lost the/thread" page, not a generic GitHub 404. Not automatable by `bin/check-site.py` since it only checks the local filesystem, not live routing behaviour.

---

## D. Post-deploy

The site has been live at `https://www.singhstudio.co.nz` since before this pass — D1–D6 are still legitimate periodic checks, not one-time setup, so they're left unstruck. `bin/check-site.py` now covers D1's link-scan intent for the local filesystem on every push (see README's "QA tooling"), but it doesn't crawl the *live* URL over HTTPS — a genuinely separate check, still worth doing occasionally by hand.

- [ ] **D1 — Re-run a link/integrity scan against the live URL**, not just the local folder. `bin/check-site.py` covers local-filesystem link resolution on every push now, but it doesn't fetch the live site over HTTPS — a broken relative path can still hide locally and only surface once real routing/caching is in play.
- [ ] **D2 — Run a Lighthouse pass** against `https://www.singhstudio.co.nz` (Chrome DevTools → Lighthouse, or `npx lighthouse https://www.singhstudio.co.nz --view`). Target scores are documented in `ELEVATION-PLAN.md` §11 (Performance/Accessibility/SEO/Best Practices ≥ 90-95). Zero dependencies and self-hosted fonts should make this an easy pass; a bad score usually means a hosting/caching config issue, not a code issue.
- [ ] **D3 — Submit `sitemap.xml` in Google Search Console** (and Bing Webmaster Tools if you care about Bing traffic) — `https://www.singhstudio.co.nz/sitemap.xml`. Also worth a `curl https://www.singhstudio.co.nz/robots.txt` sanity check that it's serving correctly and not accidentally blocking crawlers.
- [ ] **D4 — Test the booking flow end-to-end**, live: click "Book a call" from the nav, the hero, and the contact card, confirm each opens the real Google Calendar appointment page in a new tab (not a `mailto:` fallback). Book a test slot and confirm the calendar invite arrives with a real Google Meet link attached.
- [ ] **D5 — Check both light and dark themes** on the live site. Time-aware (light 7am–7pm Pacific/Auckland, dark otherwise), manual toggle persists via `localStorage`. Toggle, reload, confirm the manual choice stuck rather than reverting — the thing most likely to silently break if a deploy step strips/blocks storage.
- [ ] **D6 — Test on a real phone**, not a resized desktop window. Burger menu (now with a focus trap and Escape-to-close — see `ELEVATION-PLAN.md` Wave 3), horizontal light-table scroll degrading to a native swipe strip under 900px, archive masonry + lightbox with touch, and every CTA comfortably tappable (≥44px). Both iOS and Android if you can — view transitions and backdrop-filter behave slightly differently across engines.
- [ ] **D7 — Once an analytics provider is chosen and wired in** (see `ELEVATION-PLAN.md` decision D1 — GA4 vs. Plausible vs. Cloudflare Web Analytics, still open), confirm the beacon actually fires on a live page load (Network tab, filter for the provider's request) and that clicking the hero "Book a call" fires exactly one `book_click` event — see README's "Analytics & tracking" section for what's already wired up vs. still pending.

---

## Reference — files touched most often in this checklist

For quick navigation while working through what's still open:

- `js/main.js` — CONFIG.bookingUrl (live, A1 resolved), `track()` analytics wrapper (dormant — see D7), theme toggle logic.
- `index.html` — Voices placeholder (A3, still open).
- `templates.html` — 7× commented price slots (A4, still open).
- `together.html` — 3× commented price slots (A5, still open).
- `kris.html` — earlier-roles comment + CV PDF slot (A6, still open).
- `thought-start-with-the-message.html` — the essay line to own/soften (A7, still open), voice check (A8, still open).
- `thought-the-20-minute-brief.html` — voice check (A8, still open).
- `CONTENT-GUIDE.md` — the full page-by-page copy inventory referenced throughout section A. Note: its head/nav/hero sections predate the brand-reconciliation pass and are flagged stale at the top of that file — the body-copy inventory further down (per-section prose, case studies, together.html, kris.html, archive.html, thoughts.html) hasn't been found to have drifted from what's on the page, but wasn't re-verified line-by-line in this pass either.
- `IMAGE-MAP.md` — every image slot, dimensions and replacement specs, referenced throughout section B.
- `bin/check-site.py`, `.github/workflows/check.yml`, `bin/new-thought.sh` — new since this checklist was written; see README's "QA tooling" section. Run the checker before ticking anything above off as genuinely done.
