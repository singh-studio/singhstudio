# ELEVATION PLAN — Singh Studio website
*Written by Fable, 2026-07-08. Execution-ready specification for implementing agents (Sonnet/Haiku tier).*
*Facts below were verified against the live repo on the date above, commit `30ce6a5`.*

---

## 0. HOW TO USE THIS DOCUMENT (read first, every agent)

1. You implement **one wave** (or one task if so instructed). Do not start work outside your assigned task IDs.
2. Every task lists: files you may touch, exact changes, and acceptance criteria. If reality differs from
   the "Current state" described in your task (someone shipped ahead of you), STOP and report the drift
   instead of forcing the change.
3. Site root: `/Users/krissingh/Desktop/Singh Studio/02_Singh_Studio/Website` (path has a space — quote it).
   Git remote: `singh-studio/singhstudio`, branch `main`, deployed by GitHub Pages to `www.singhstudio.co.nz`.
4. After your wave: run the verification steps in §8 that apply, commit with a descriptive message
   (no "Co-Authored-By" unless the session harness requires it), and push. One commit per wave.
5. A local preview runs via the `singh-studio-site` config (python http.server on :4173, serving this folder).
   The embedded preview tab is known to cache JS/CSS aggressively — verify with fresh
   `fetch(url, {cache:'no-store'})` reads or direct DOM inspection when screenshots look stale.

### Global guardrails (violations = failed wave)
- **Colours**: CSS custom properties only (`--ink --bone --mute --mute-dark --red --red-hot --hairline
  --hairline-dark --copy`). The site has a light theme that remaps them; hardcoded hex is allowed ONLY for
  text sitting on photos or red grounds (`#ece7dd`) — an existing, documented exception.
- **Type roles**: Switzer = display/UI/body · PlexSerif italic = "voice" accents · Fragment mono = labels,
  numbers, buttons. Do not add font files or Google Fonts to root pages (template demos in `templates/`
  are self-contained and exempt).
- **Copy voice**: plain NZ English (organisation, colour), typographic quotes (’ “ ”), **≤3 em-dashes in
  visible prose per page**, no fortune-cookie aphorisms, one intentional sentence fragment per section max.
- **Never**: invent prices, clients, testimonials, or metrics · touch the pinned light-table mechanics
  (380vh/sticky — client-approved) · restyle or proxy the Google booking page · commit secrets
  (Web3Forms access keys and GA4 measurement IDs are public-by-design and ARE allowed in the repo).
- **Structure**: inline `style=""` is reserved for `--i` reveal-stagger custom properties. All other styling
  goes in `css/style.css`. JS modules in `js/main.js` are guarded IIFEs — every module must bail cleanly
  when its elements are absent (main.js loads on all 13 pages).
- `data-mask` / `data-reveal` attributes only work because JS observers cover them. If you hand-author one
  on new markup, confirm the selector in the relevant module actually matches it (this bit us once:
  `.case-shot` sat invisible for days).

---

## 1. CURRENT STATE — verified facts the plan builds on

| Area | Fact |
|---|---|
| Pages | 13 root (12 indexable + 404) + 7 self-contained demos in `templates/` |
| Nav (all 12) | `Disciplines · Work · Thoughts · Kris` + Book a call. Footer = same + Contact. Matches homepage physical order. |
| Hero (new) | Eyebrow “A multidisciplinary creative studio in Aotearoa New Zealand.” · serif line “Telling stories *that matter.*” |
| **Brand drift** | `<title>` still says “Web Design & Communications Studio”; meta description says “web design first”; `og:title` says “Every discipline. One message.”; the preloader word-line says “EVERY DISCIPLINE / ONE MESSAGE”. Four surfaces contradict the new hero. |
| Booking | LIVE — `CONFIG.bookingUrl` = `https://calendar.app.google/vMWDbHmj9NgqmHc48`, opens new tab. |
| Socials | Removed sitewide (no profiles exist yet). |
| Measurement | **None.** No analytics, no events, no form capture. Contact = booking link + `mailto:` only. |
| Menu a11y | Mobile menu has NO focus trap and NO Escape-to-close (only keydown handlers are the “/” hotkey and the Voices arrows). |
| Finder | templates.html finder works but has zero state persistence — returning from a demo resets it. |
| Images | Heavy JPEGs without WebP siblings in `assets/img/`: gal-pasifika (658K), gal-braided-river (476K), gal-brass-rain (442K), gal-raptor-bw (404K). `assets/img/archive/` (25 files) has NO WebP coverage at all. |
| Orphans | `assets/img/hero-dancer-red-900.jpg` + `.webp` referenced by nothing (hero moved to kris portrait). |
| Repo hygiene | `.claude/launch.json` is git-tracked (local tooling; shouldn’t be). |
| Sitemap | 12/12 indexable pages, demos correctly excluded (noindex). Feed, robots, canonicals valid. |
| Docs | README / CONTENT-GUIDE / IMAGE-MAP / LAUNCH-CHECKLIST are stale (predate nav rework, hero copy, booking, socials removal). |
| Known-good | Letterized headings, vermillion accordion wipe, theme system w/ dark islands, view transitions, session-skip preloader, back-to-top, “/” hotkey, WebP+`<picture>` on 9 placements, per-page og:images, RSS, 404. |

---

## 2. DECISIONS REQUIRED FROM KRIS (blockers — everything else can ship without them)

| # | Decision | Options | Default if no answer |
|---|---|---|---|
| D1 | Analytics provider | **A: GA4** (free, custom events, heavier script) · **B: Plausible** (~US$9/mo, light, clean events, NZ-friendly privacy story) · **C: Cloudflare Web Analytics** (free, lightest, **no custom events** — pageviews only) | A (GA4) — events matter more than script weight for a lead-gen site |
| D2 | Enquiry form | Create a free Web3Forms account with kris@singhstudio.co.nz → paste the access key (public-safe). Alternative: Formspree. Or skip the form entirely. | Blocked until key exists — T2.1 cannot ship without it |
| D3 | Brand line | Plan standardises every surface on “multidisciplinary creative studio” + “Telling stories that matter” (Wave 1 tables). | Proceed — inferred from Kris’s own hero rewrite |

---

## 3. WAVE 1 — Brand reconciliation *(Sonnet · no blockers · ship first)*

**Benefit: one coherent story on every surface a visitor or share-card sees. Currently four surfaces contradict the hero.**

### T1.1 — index.html head + loader alignment
Files: `index.html` only.
Exact replacements:

| Location | From | To |
|---|---|---|
| `<title>` | `Singh Studio: Web Design & Communications Studio, Aotearoa NZ` | `Singh Studio — A Multidisciplinary Creative Studio, Aotearoa NZ` |
| `meta name="description"` + `og:description` (keep identical) | current “…web design first…” sentence | `Singh Studio is a multidisciplinary creative studio in Aotearoa New Zealand. Strategy-led web, film, photography, audio, apps and AI. Telling stories that matter.` |
| `og:title` | `Singh Studio — Every discipline. One message.` | `Singh Studio — Telling stories that matter.` |
| JSON-LD `ProfessionalService.description` | current | `Multidisciplinary creative studio: strategy, web, film, photography, audio, apps and AI.` |
| Preloader `.loader-word` | `EVERY DISCIPLINE / ONE MESSAGE` | `TELLING STORIES / THAT MATTER` (keep the slash — it’s the brand device) |

### T1.2 — sweep the other 11 pages for stale positioning
Grep every root page for: `web design first`, `web-led`, `Every discipline`, `One message`,
`communications studio`. For each hit in a `<title>`, meta description, or og tag: rewrite to fit the new
positioning while keeping the page-specific subject (e.g. archive page stays photography-led). Body prose
hits: report, don’t change (the Position statement’s message-first thesis is compatible and stays).
Keep meta descriptions ≤160 chars, complete sentences.

**Acceptance:** `grep -ri "web design first\|web-led" *.html` → 0 hits in head metadata ·
`grep -c "Telling stories" index.html` ≥ 2 · og:description === meta description on every page touched ·
tag-balance parser passes on all touched files.

---

## 4. WAVE 2 — Conversion infrastructure *(Sonnet · D1 + D2 gate parts of it)*

**Benefit: the site finally captures leads it currently loses (mailto fails silently on machines with no
mail client — a large share of desktop users) and measures which CTAs earn their place.**

### T2.1 — Enquiry form (BLOCKED on D2 key)
Files: `index.html`, `css/style.css`, `js/main.js`.
- In `#contact`, after the existing `.contact-card`, add a `.contact-form` block: name (text, required),
  email (email, required), message (textarea, required), hidden `access_key`, honeypot field
  (`<input type="checkbox" name="botcheck" class="hidden" style="display:none">` per Web3Forms docs),
  submit `.btn.btn-solid` labelled `Send it`.
- Form heading (mono eyebrow style): `/ Or write it down`. One serif support line:
  `No calendar required. Three fields and it’s with us.`
- JS module (guarded on `#enquiryForm`): intercept submit, `fetch("https://api.web3forms.com/submit", {method:"POST", body: new FormData(form)})`,
  disable button + label `Sending…` while in flight; on success replace the form body with a styled
  confirmation (`role="status"`): `Got it. Replies within one business day, NZT.`; on failure show inline
  error (`role="alert"`) and re-enable, keeping the user’s text. No page reload. `node --check` after.
- Style with existing tokens: hairline borders, mono labels, `--ink-2` field backgrounds, red focus ring
  via existing `:focus-visible` convention. Fields ≥44px tall. Works in both themes (variables only).
- The mailto line stays as a tertiary path below the form.

### T2.2 — Analytics snippet (BLOCKED on D1 choice + ID)
Files: all 13 root pages (incl. 404) — insert immediately before `</head>`.
- **If GA4**: standard gtag snippet with the measurement ID, plus
  `gtag('config', ID, { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false })`.
- **If Plausible**: `<script defer data-domain="singhstudio.co.nz" src="https://plausible.io/js/script.tagged-events.js"></script>`.
- Demos in `templates/` get the snippet too (they’re real marketing surfaces) — append before `</body>`
  in each, matching each file’s formatting.

### T2.3 — One tracking wrapper, provider-agnostic
File: `js/main.js` (new guarded module, placed before the modules that use it).
```js
/* Track — thin wrapper so the provider can change without touching call sites */
const track = (name, props = {}) => {
  try {
    if (window.gtag) gtag("event", name, props);
    else if (window.plausible) plausible(name, { props });
  } catch { /* analytics must never break the page */ }
};
```
Then delegate clicks once (single listener, not per-element):
```js
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-track]");
  if (el) track(el.dataset.track, { label: el.dataset.trackLabel || el.textContent.trim().slice(0, 60) });
});
```

### T2.4 — Instrument the CTAs (works regardless of D1/D2 timing; attributes are inert until a provider loads)
Add `data-track` attributes — exact mapping:
| Element | Attribute |
|---|---|
| `#bookBtn` (contact card) | `data-track="book_click" data-track-label="contact_card"` |
| Nav `.btn-book` (all pages) | `data-track="book_click" data-track-label="nav"` |
| Hero `Book a 20-min call` | `data-track="book_click" data-track-label="hero"` |
| Every `View the demo →` + mockup link on templates.html | `data-track="demo_view"` (label = template key) |
| Every `Enquire` mailto on templates.html | `data-track="template_enquiry"` (label = template key) |
| Enquiry form successful submit | call `track("enquiry_submit")` inside the T2.1 success handler |
| `.footer-mail` (all pages) | `data-track="email_click"` |

**Acceptance:** form posts successfully to Web3Forms test endpoint and renders success state without
reload · honeypot present · analytics request visible in the network log on page load · clicking the hero
Book CTA fires exactly one event · `node --check js/main.js` passes · zero console errors with AND without
the provider script present (wrapper must no-op safely).

---

## 5. WAVE 3 — UX mechanics *(Sonnet · no blockers)*

**Benefit: keyboard/assistive users get a correct menu; shareable deep links; the finder stops punishing
demo browsing; the profile page becomes a usable CV artefact.**

### T3.1 — Mobile menu: focus trap + Escape
File: `js/main.js` (extend the existing nav module — do not duplicate its state).
- On open: `menu.setAttribute("role","dialog")` + `aria-modal="true"` (set once at init is fine),
  move focus to the first menu link.
- Trap: on `Tab`/`Shift+Tab` inside the open menu, wrap focus between first and last focusable items
  (query: `a, button` within `#menu`).
- `Escape` while open: close via the existing `setMenu(false)` path and return focus to `#navBurger`.
- Closing by any existing path also returns focus to the burger.
**Acceptance:** with menu open — Tab cycles inside the menu only; Escape closes and focus lands on the
burger; screen-reader tree shows dialog semantics; no behavioural change when menu is closed.

### T3.2 — Disciplines deep links
Files: `index.html`, `js/main.js`.
- Give each `.ix-row` an id: `d-web-design, d-strategy-comms, d-app-development, d-ai-systems,
  d-photography, d-video-film, d-audio-music` (match current row order — verify against the DOM, don’t
  assume this list’s order).
- In the accordion module: when a row opens, `history.replaceState(null, "", "#" + row.id)`; when all
  close, restore `#index`. On page load (and `hashchange`), if `location.hash` matches a row id: open that
  row and `scrollIntoView({block:"center"})` it (respect `prefers-reduced-motion` for smoothness).
**Acceptance:** visiting `/#d-photography` cold lands with the Photography row open and centred · opening
rows updates the URL without adding history entries · nav link to `#index` still works.

### T3.3 — Templates finder persistence
File: `js/templates.js`.
- On every finder state change, write `{type, priority}` to `sessionStorage["ss-finder"]` (try/catch).
- On load, if stored state exists: re-apply it through the SAME code path as a user click (call the
  handlers, don’t duplicate filter logic), so ribbon, shelf filter and aria states all restore.
- “Show everything” clears the stored state.
**Acceptance:** pick café + sell → open the Storefront demo → browser Back → filter, ribbon and pressed
chips all restored · reset clears storage · no errors when storage is unavailable (private mode).

### T3.4 — kris.html print stylesheet
File: `css/style.css` (append one banner-commented block).
```css
/* ============ PRINT — kris.html reads as a clean CV ============ */
@media print {
  .nav, .menu, .footer, .cursor, .grain, .progress, .to-top-btn,
  .btn, .case-next, .theme-toggle { display: none !important; }
  body { background: #fff; color: #111; font-size: 11pt; }
  .sub-hero { padding-top: 0; }
  a { color: #111; text-decoration: none; }
  .case-meta dt, .eyebrow, .fact dt { color: #444; }
  section { padding-block: 1.2rem; break-inside: avoid; }
}
```
Adjust selectors to what actually exists on kris.html; verify with the browser’s print preview.
**Acceptance:** print preview of kris.html = white background, no chrome/buttons/cursor artefacts,
content in document order, ≤3 pages.

---

## 6. WAVE 4 — Performance & asset hygiene *(Haiku-capable for T4.2/T4.3; Sonnet for T4.1)*

**Benefit: measurably faster first paint on the photography-heavy pages; a clean repo.**

### T4.1 — Finish the WebP programme (Sonnet)
- Generate WebP siblings (`ffmpeg -y -i in.jpg -c:v libwebp -q:v 78 out.webp`, ffmpeg at
  `/opt/homebrew/bin/ffmpeg`) for: the four heavy root images (gal-pasifika, gal-braided-river,
  gal-brass-rain, gal-raptor-bw) AND every jpg in `assets/img/archive/` over 150KB.
- Wrap each usage in `<picture>` with a webp `<source>` first, following the exact existing pattern in
  index.html’s light table (jpg stays as `<img src>` — the lightbox reads `.src` and must keep getting the
  jpg URL). Touch: index.html light table, archive.html masonry. The Folio demo (`templates/folio.html`)
  references root images with `../` paths — apply the same wrap there, inside that file’s own conventions.
- Report a size table (jpg vs webp, % saved) in your final message.
**Acceptance:** every wrapped image’s `currentSrc` resolves to `.webp` in Chrome · lightbox still opens
the jpg · zero broken paths (run the link scan) · total webp savings reported.

### T4.2 — Orphan + repo hygiene (Haiku)
- `git rm assets/img/hero-dancer-red-900.jpg assets/img/hero-dancer-red-900.webp` (verified: 0 references).
- Add `.claude/` to `.gitignore`; `git rm --cached .claude/launch.json` (keep the local file on disk).
**Acceptance:** `git ls-files | grep .claude` → empty · link scan still 0 broken · local launch.json still present.

### T4.3 — Favicon set (Haiku)
- From `assets/img/ss-logo.png` (115×115) generate `favicon-32.png` (32×32) via sips; keep the existing
  180px apple-touch-icon. Add to all 13 root pages’ heads:
  `<link rel="icon" type="image/png" sizes="32x32" href="assets/img/favicon-32.png">` (before the existing
  icon line; demos use `../` prefix and already have their own favicon line — update them the same way).
**Acceptance:** both icon links present on every page, files exist, no 404s in the network log.

---

## 7. WAVE 5 — SEO depth *(Sonnet)*

**Benefit: richer share cards and result listings for the pages that sell (cases, templates, profile).**

### T5.1 — Case pages: CreativeWork JSON-LD
Add to each `case-*.html` head, values from that page’s own meta row (client, years, description from the
page’s meta description — do not invent):
```json
{ "@context":"https://schema.org", "@type":"CreativeWork",
  "name":"<case title>", "creator":{"@type":"Organization","name":"Singh Studio"},
  "about":"<meta description text>", "dateCreated":"<first year on the page>" }
```

### T5.2 — BreadcrumbList on cases, kris.html, templates.html
Standard two-level breadcrumb (Home → page). Use absolute URLs on `https://www.singhstudio.co.nz/`.
Note the canonical host is **www** (Pages serves there; apex 301s) — while touching heads, also update any
`rel=canonical`/`og:url`/sitemap entries still pointing at the bare apex so everything says `www.`
consistently. (Check first; report what you found.)

**Acceptance:** all JSON-LD blocks parse (python `json.loads` on each extracted block) · Google Rich
Results test passes on one case page (or, offline, schema validates structurally) · canonical host
consistent sitewide, sitemap/feed/robots included.

---

## 8. WAVE 6 — Workflow & tooling *(Sonnet)*

**Benefit: every future change (by Kris or any agent) gets verified automatically; adding content stops
being error-prone.**

### T6.1 — `bin/check-site.py` (commit the QA brain)
Python 3, stdlib only, exit non-zero on failure. Checks:
1. Every `href/src/srcset/poster` in all HTML (root + demos, handling `../`) resolves on disk
   (skip http/mailto/tel/#/data:; skip anything inside HTML comments).
2. No orphaned files under `assets/` (referenced nowhere in html/css/js, excluding `_incoming/`).
3. Nav/menu/footer link sets are identical (labels + order) across the 12 nav’d pages.
4. Every indexable page: unique `<title>`, meta description ≤170 chars and not mid-sentence-truncated
   (ends in `.` `?` `!`), canonical matches filename, og:description === meta description.
5. `sitemap.xml`/`feed.xml` parse; sitemap count === indexable page count.
6. Tag-balance pass per page (the HTMLParser stack technique).
7. `node --check` on the three JS files (subprocess; skip with a warning if node absent).
Output: a compact PASS/FAIL table; failures list file + detail.

### T6.2 — GitHub Action
`.github/workflows/check.yml`:
```yaml
name: site-check
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: python3 bin/check-site.py
```
**Acceptance:** the action runs green on push; deliberately breaking a link in a scratch branch turns it red.

### T6.3 — `bin/new-thought.sh`
Scaffolds a post: `bin/new-thought.sh "slug" "Title"` copies the structure of an existing post
(`thought-the-20-minute-brief.html`) with title/canonical/og/JSON-LD/date placeholders swapped in, then
PRINTS (does not auto-edit) the three exact snippets to paste: the listing row for `thoughts.html`, the
`<item>` for `feed.xml`, and the `<url>` for `sitemap.xml`. Refuses to overwrite an existing file.

### T6.4 — Docs refresh
Bring `README.md`, `CONTENT-GUIDE.md`, `IMAGE-MAP.md`, `LAUNCH-CHECKLIST.md` up to the post-elevation
state: 4-item nav, new hero/brand lines, booking LIVE (remove it from blockers), socials removed
(re-add instructions preserved), form + analytics documented (incl. where the key/ID lives), the new
bin/ scripts and CI documented. Tick off completed checklist items rather than deleting them (strike-through
with a date reads better than silent removal).

**Acceptance:** `bin/check-site.py` passes locally · CI green on GitHub · scaffolder produces a valid page
(run the checker against its output) · zero stale “web design first”/6-item-nav references in docs.

---

## 9. WAVE 7 — QA gate *(Sonnet · always last)*

Run in order; all must pass:
1. `python3 bin/check-site.py` → all green (this now embodies most former manual checks).
2. Em-dash census: ≤3 in visible prose per page.
3. Both themes: force `ss-theme` light/dark + reload; spot-check hero, contact form, finder, footer.
4. Keyboard pass: Tab through index.html top to bottom — menu trap (T3.1), accordion, form, footer all
   reachable and operable; “/” hotkey still works; Escape closes menu and lightbox.
5. Mobile spot (375px): hero, form fields ≥44px, finder chips wrap, no horizontal overflow
   (`document.documentElement.scrollWidth === clientWidth`).
6. Payload check on index.html: sum transferred bytes of above-the-fold requests (document + css + js +
   fonts + hero webp) — target **< 900KB**; report the number.
7. Live check after push: `https://www.singhstudio.co.nz/` serves the new title; booking link resolves;
   analytics beacon fires (if D1 delivered); form submits (if D2 delivered).
8. Update the plan file itself: mark shipped tasks `✅ shipped <date>` in place.

---

## 10. SEQUENCING

```
Wave 1 (brand)  ──►  Wave 3 (UX)  ──►  Wave 4 (perf)  ──►  Wave 5 (SEO)  ──►  Wave 6 (tooling)  ──►  Wave 7 (QA)
      │                                                        ▲
      └── Wave 2 (conversion) runs whenever D1/D2 unblock ─────┘  (T2.3/T2.4 attributes can ship with Wave 3)
```
Waves touch overlapping files (index.html, main.js) — run them **sequentially, never in parallel**, one
commit each. Wave 2 may interleave when its blockers clear; its tasks are additive and safe to rebase.

## 11. WHAT “WORLD-CLASS” MEANS HERE (exit rubric)

- Lighthouse (mobile, index.html): Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95, Best Practices ≥ 95.
- LCP < 2.5s on simulated 4G (hero webp is the LCP element), CLS < 0.1, zero console errors on all pages.
- Every primary CTA measurable; every enquiry path (book / form / email) works and is tracked.
- Full keyboard operability incl. modal semantics; both themes contrast-clean.
- One brand story on every surface: tab title, share card, preloader, hero, JSON-LD.
- CI guards the lot on every push; docs describe the site as it actually is.
