# Singh Studio — S·/·S

*Docs current as of Wave 6, 2026-07-08. Site is LIVE at
[www.singhstudio.co.nz](https://www.singhstudio.co.nz) via GitHub Pages
(`www` is canonical; the apex domain 301s to it).*

## The system at a glance

- **12 indexable pages + 404** (13 root HTML files) + 7 self-contained demo
  sites in `templates/`, one stylesheet, three scripts, three fonts (74KB
  total), zero dependencies, no build step.
- **Nav is 4 items**: Disciplines · Work · Thoughts · Kris, plus a persistent
  "Book a call" button. The mobile overlay menu repeats the same four plus
  Book; the footer repeats the same four plus Contact. All three link sets
  must stay identical in labels and order — `bin/check-site.py` enforces this
  on every push.
- **Brand line**: hero eyebrow reads *"A multidisciplinary creative studio in
  Aotearoa New Zealand."*, serif line *"Telling stories that matter."* This
  is the one story every surface tells — tab title, share card, preloader,
  hero, JSON-LD `description` — keep new copy consistent with it rather than
  the older "web design first" positioning.
- **Tokens rule everything**: colours come from `--ink/--bone/--mute/--red/
  --hairline/--copy`; light mode remaps them; "dark islands" (hero, capacity,
  loader, lightbox) pin the night palette. Never hardcode a colour except
  text sitting on photos or red grounds (#ece7dd).
- **Type roles**: Switzer = display + UI + body · IBM Plex Serif Italic =
  the "voice" (quotes, ledes, asides) · Fragment Mono = slate labels,
  numbers, buttons. Big lockups: weight 620, tracking -0.025em, line-height 0.86.
- **The slash is the brand device** — section eyebrows, cursor, captions,
  hotkey. New sections should use the `eyebrow → content` scaffold and mono
  `/ labels`.
- **Inline styles are reserved for `--i` reveal staggers** — everything else
  belongs in css/style.css.
- **JS is guarded modules** in main.js — every module bails cleanly if its
  elements are absent, so any page can load it.
- **Every push is checked automatically** — `bin/check-site.py` runs in CI
  (`.github/workflows/check.yml`) and locally; see "QA tooling" below.

No frameworks, no build step, no dependencies — plain HTML/CSS/JS and your
photography do all the work.

```
Website/
├── index.html          # the studio one-pager
├── case-*.html         # four case studies (Amplify, More, Band Camp, Firezone)
├── together.html       # engagement models: Project / Retainer / Sprint
├── templates.html      # template shopfront + finder → templates/ demos
├── thoughts.html       # writing space + thought-*.html posts
├── archive.html        # the photo archive (sticky set-tabs + masonry + lightbox)
├── kris.html           # profile / CV page
├── 404.html            # custom not-found page
├── sitemap.xml, feed.xml, robots.txt, CNAME
├── css/style.css       # design system (archive styles at the bottom)
├── js/main.js          # shared interactions (CONFIG block at the top)
├── js/archive.js       # archive-only: scrollspy tabs + sequential lightbox
├── js/templates.js     # templates.html finder logic
├── templates/          # 7 self-contained demo sites (own fonts/CSS, ../ asset paths)
├── bin/
│   ├── check-site.py   # QA checker — see "QA tooling" below
│   ├── new-thought.sh  # scaffold a new Thoughts post — see "QA tooling"
│   └── ingest-images.sh
├── .github/workflows/check.yml   # runs check-site.py on every push/PR
└── assets/
    ├── fonts/          # self-hosted woff2 (Switzer, Plex Serif Italic, Fragment Mono)
    ├── video/
    └── img/            # web-resolution exports (+ /archive for archive-only frames)
```

## Run it locally

Any static server works:

```bash
cd Website
python3 -m http.server 4173
# → http://localhost:4173
```

## Google Meet bookings — LIVE

Booking is configured and working sitewide. `js/main.js`'s `CONFIG` block:

```js
const CONFIG = {
  bookingUrl: "https://calendar.app.google/vMWDbHmj9NgqmHc48",  // live
  email: "kris@singhstudio.co.nz",
};
```

Every "Book a call" button (nav, hero, contact card) opens this Google
Calendar appointment-schedule link in a new tab — it attaches a Google Meet
link automatically to every booking. To point it at a different schedule:

1. In [Google Calendar](https://calendar.google.com) (kris@singhstudio.co.nz
   account) → the appointment schedule → **Share** → copy the booking-page
   link (`https://calendar.app.google/...`).
2. Paste it into `CONFIG.bookingUrl` above.

If `CONFIG.bookingUrl` is ever emptied out, the button falls back to a
pre-filled `mailto:` — nothing breaks, leads still land.

## Analytics & tracking — wrapper present, provider not yet chosen

`js/main.js` ships a small provider-agnostic `track(name, props)` wrapper
(guarded, no-ops safely if neither `window.gtag` nor `window.plausible`
exists) and `data-track`/`data-track-label` attributes are already wired up
on every primary CTA (nav/hero "Book a call", `.footer-mail`, template
demo/enquiry links). **This instrumentation is currently dormant** — no
analytics script is loaded on any page yet, so no events fire and nothing is
collected. To turn it on:

1. Pick a provider — GA4 (free, custom events) or Plausible (paid, lighter,
   NZ-friendly privacy story) are the two under consideration.
2. Add the provider's snippet (measurement ID / `data-domain`) before
   `</head>` on all 13 root pages and the 7 `templates/` demos.
3. That's it — `track()` picks up `window.gtag`/`window.plausible`
   automatically once either is present; no other code changes needed.

Measurement ID / Plausible domain, once chosen, are public-by-design and are
fine to commit directly in the HTML (not a secret, unlike an API key).

## Enquiry form — not built yet

There's no on-page form. Contact currently runs through the "Book a call"
link and the `mailto:kris@singhstudio.co.nz` footer link only. Building the
form (`#contact`, Web3Forms-backed, honeypot + inline success/error states)
is blocked on creating a free [Web3Forms](https://web3forms.com) account
with kris@singhstudio.co.nz and pasting the resulting access key into the
form's hidden `access_key` field — that key is public-safe and fine to
commit. Formspree is a documented fallback if Web3Forms doesn't suit.

## QA tooling

- **`bin/check-site.py`** — stdlib-only Python 3 checker. Verifies every
  link resolves, no `assets/` file is orphaned, nav/menu/footer labels and
  order match sitewide, every indexable page has sane unique head metadata
  (title, description, canonical, og:description), `sitemap.xml`/`feed.xml`
  are well-formed with the sitemap count matching the indexable page count,
  every HTML file's tags balance, and `node --check` passes on the JS files.
  Run it locally with `python3 bin/check-site.py` — it prints a PASS/FAIL
  table and exits non-zero on any failure, so it's safe to wire into a
  pre-commit hook if you want it stricter than CI alone.
- **`.github/workflows/check.yml`** — runs `bin/check-site.py` on every push
  and pull request via GitHub Actions. A red run means something in the
  pushed commit fails one of the checks above; read the Action's log for the
  exact file + line.
- **`bin/new-thought.sh "slug" "Title"`** — scaffolds a new Thoughts post.
  Copies the structure of `thought-the-20-minute-brief.html` with the
  title/canonical/og/JSON-LD/date swapped in and obvious `PLACEHOLDER` text
  standing in for the prose, then prints (does not auto-edit) the three
  snippets you paste by hand: the listing row for `thoughts.html`, the
  `<item>` for `feed.xml`, and the `<url>` for `sitemap.xml`. Refuses to
  overwrite an existing file. Run `python3 bin/check-site.py` after pasting
  the sitemap snippet in to confirm the new page is fully wired up.

## Deploying

The site is **live** on GitHub Pages, served from this repo's `main` branch,
with `CNAME` pointing the custom domain at `www.singhstudio.co.nz` (the
canonical host — the bare apex domain 301s to `www`). Any other static host
(Netlify, Vercel, Cloudflare Pages) would work identically if you ever need
to move it — drag-and-drop the `Website` folder, no build step.

If the domain ever changes from `www.singhstudio.co.nz`:

- Every `og:image`, `rel="canonical"`, and JSON-LD `mainEntityOfPage` across
  all 13 root pages needs updating, plus `sitemap.xml`, `feed.xml` and
  `robots.txt`'s `Sitemap:` line. `bin/check-site.py`'s head-metadata check
  will catch any canonical that doesn't match its own filename, but it
  doesn't know what the *new* domain should be — that part's manual.
- Update `CNAME` to the new domain and re-point DNS.

## Social links — removed, how to re-add

The footer currently has no Instagram/LinkedIn links — they were pulled
sitewide because no real profile URLs existed yet, not because the design
doesn't support them. `css/style.css` still carries a ready-to-use
`.footer-social` class (shares layout/hover rules with `.footer-links`,
mono uppercase labels). To bring them back once real profiles exist, add a
block like this next to `.footer-links` in every page's footer (`grep
'class="footer-links"'` to find the spot on each of the 12 nav'd pages):

```html
<nav class="footer-social" aria-label="Social">
  <a href="https://instagram.com/yourhandle" target="_blank" rel="noopener">Instagram</a>
  <a href="https://linkedin.com/company/yourcompany" target="_blank" rel="noopener">LinkedIn</a>
</nav>
```

Swap in real profile URLs before adding — a generic link to instagram.com's
homepage (rather than an actual Singh Studio profile) is exactly the state
this cleanup removed. `bin/check-site.py`'s link-resolution check only
verifies local file paths, not that external URLs resolve, so double-check
those by hand.

## Swapping photography

**Light Table (homepage)** — images live in `assets/img/`, referenced in the
Light Table section of `index.html`:

1. Export around 1600px on the long edge, JPEG quality ~80.
2. Drop it in `assets/img/`, update the `<img src … width height alt>` and the
   `figcaption` (the `FR 00X — title / category` convention).
3. `width`/`height` attributes matter — they keep the horizontal scroll smooth
   while images lazy-load.

**Archive (`archive.html`)** — frames live in `assets/img/archive/`. Add a
`<figure class="ph">…</figure>` to whichever set's `.masonry` grid fits. Tab
counts and the "40 frames / 4 sets" line recount themselves from the DOM, so
you only touch the figure. To add a whole new set: copy a `<section class="set">`
block, give it an id, and add a matching tab in `.set-tabs` — scrollspy picks
it up automatically.

Capability rows fill vermillion on hover (a CSS wipe on `.ix-head::before`)
and open as accordions on click — no imagery involved.

## Design notes (for future edits)

- **Concept**: the slash in S·/·S is the brand device — the pivot between
  disciplines. It recurs in the nav, headline, cursor, captions and dividers.
- **Palette**: smoky black `#0c0b09`, bone `#ece7dd`, signal vermillion
  `#e23b22` (pulled from the red-pigment dance shoot).
- **Type**: Switzer variable (display, structure and copy — from Kris's own
  Switzer_Complete folder; weights 460-640, display tracking -0.025em, big
  lockups at 0.86 line-height), IBM Plex Serif Italic (the serif "voice"),
  Fragment Mono (slate labels).
- All motion respects `prefers-reduced-motion`, and the pinned horizontal
  gallery degrades to a native swipe strip under 900px.

## Signature interactions (and where they live)

- **Per-letter headline choreography** — hero, LET'S/TALK and THE/ARCHIVE
  titles split into staggered characters (`main.js`, "letter choreography").
- **Clip-mask image reveals** — light table, work cards and archive masonry
  unmask as they enter view (`[data-mask]`, injected by JS).
- **Scroll parallax** — hero and capacity backgrounds drift (`data-plx="0.055"`
  etc. — raise the number for more movement).
- **Velocity-coupled marquee** — the discipline ticker speeds up as you scroll.
- **Rolling button labels** — hover any pill button.
- **`/` hotkey** — pressing slash anywhere jumps to the booking section
  (on the archive it returns you to the homepage contact). Hinted in the footer.
- **Cross-page view transitions** — index ↔ archive fades (Chromium).
- All of it is disabled under `prefers-reduced-motion`.

## Before shipping new content — run the checker

`python3 bin/check-site.py` locally, then push — CI runs the same check.
It catches broken links, orphaned assets, nav drift, bad meta, malformed
feeds, unbalanced tags and JS syntax errors before they reach production.
See "QA tooling" above for what each check covers.

## Voices — swapping in real testimonials

The slider in `index.html` (`04 / Voices`) ships with one real video
testimonial (Joy Florals) and one reserved placeholder slide — **replace the
placeholder with real client words before it's presented as finished.**

- **Text slide**: copy an `<article class="voice" data-kind="text">` block,
  swap the quote and the name/role lines.
- **Video slide**: drop an mp4 in `assets/video/` (720p, H.264 — run it
  through `ffmpeg -vf scale=1280:-2 -crf 27` to keep it ~10MB), a poster jpg
  in `assets/img/`, and copy the `data-kind="video"` block. Videos only load
  when someone presses play.
- The counter and arrows adapt to however many slides exist.

Easy testimonial capture: record 30 seconds of a happy client at the end of a
Google Meet (with their OK), trim it, done.

## Client proof band

The names under the hero live in the `.proof` block of `index.html` — plain
text spans, edit freely. The old animated marquee is gone on purpose: motion
now lives only where it earns its keep (headlines, photography, the light
table).


## Case studies

Each `case-*.html` states only what the folders can prove (e.g. Amplify's
"three consecutive builds"). When you have a hard number — registrations,
attendance, funds raised — add it as another `.fact` row in the outcome
grid. One real number per case is worth more than ten adjectives.

## Together (engagement models)

`together.html` ships without prices. When you're ready, each card has a
commented-out `<p class="tg-meta">From NZ$X,XXX</p>` line — fill and
uncomment. The "written proposal inside two working days" promise is yours
to keep or soften.

## Thoughts

Two posts ship as drafts written in the studio voice — **edit them until
they sound like you** before launch, or replace them entirely.

Reading system baked into every post: byline with avatar, drop cap on the
opening paragraph, counter-numbered section headings (`/01`, `/02` — added
automatically, don't number them yourself), hover anchors on headings,
share row (LinkedIn / X / copy-link), next-post navigation, BlogPosting
schema, and an RSS feed at `feed.xml`.

To add a post: run `bin/new-thought.sh "slug" "Title"` (see "QA tooling"
above) rather than hand-copying a file — it scaffolds a well-formed page
with placeholders swapped in and prints the three snippets you paste into
`thoughts.html`, `feed.xml` and `sitemap.xml`. Then write the actual prose
in plain `<p>`/`<h2>`/`<ol>` — the typography does the rest — and run
`python3 bin/check-site.py` once you've pasted the snippets in.

**Marginalia** — the narrow reading measure is deliberate: on wide screens
the right rail carries punctuation that slides in as you read. Three kinds,
placed in the markup just *before* the paragraph they annotate:

```html
<aside class="mn mn-note" data-reveal><i>a /</i>A sidenote.</aside>
<aside class="mn mn-pull" data-reveal>A short pulled phrase.</aside>
<aside class="mn mn-fig" data-reveal>
  <img src="…" …><figcaption><i>/</i>Caption — from the archive</figcaption>
</aside>
```

Pair sidenotes with a `<sup class="mref">a</sup>` marker in the text. Two or
three per post is the right dose. Figures take the full rail — on big
screens that's up to ~670px wide, so export margin images at 1400px+.
Below 1280px everything folds inline as bordered notes automatically.

Reading scale is fluid: body copy runs ~18px on a laptop up to ~21px on a
wide desktop, on a fixed 46rem measure. The hairline rule between column
and rail is drawn by `.post-article::before`.


## Light / dark mode

The site is **time-aware**: first-time visitors get light mode during NZ
daytime (7am–7pm Pacific/Auckland) and dark mode at night. The dial in the
nav toggles manually — a manual choice is remembered (localStorage
`ss-theme`) and wins over the clock from then on. Clearing site data
returns a visitor to time-aware behaviour.

Theming is token-level: light mode remaps the same variables, `.section-light`
blocks invert with it (the rhythm keeps alternating), and the photographic
moments — hero, capacity, preloader, lightbox — stay dark by design
("dark islands" in css/style.css).

Also in this pass: a back-to-top button appears site-wide after a viewport
of scrolling, and the Thoughts landing is organised into featured-latest,
topic filter chips, and the index list. Give new posts a `data-topic` on
their row and a chip if it's a new topic.


## Templates shopfront (templates.html + templates/ demos)

Seven template cards, each linking to a REAL standalone demo site in
`templates/` (toolbelt, counter, ledger, commons, programme, folio,
storefront) — self-contained single files with their own design languages,
fictional NZ businesses, and a fixed "a Singh Studio build" bar linking
back. All demos are noindex. The FINDER above the shelf replaces the old
chooser+filter pair: type chips live-filter the shelf and pin a
recommendation ribbon (priority chips refine it; 24-combination mapping).
Each card keeps a commented `tpl-price` slot; timeline language stays
"quoted on the intro call". To add a template: build the demo in
templates/, add a card with data-tpl + demo links, extend the maps at the
top of js/templates.js.

## Profile page (kris.html)

Standalone bio, skills and selected history, linked from the Studio
section ("Full profile & CV →"). Two slots await you: the commented
earlier-roles template in Selected History, and the commented PDF-download
swap in "The full CV" (drop the file at assets/kris-singh-cv.pdf).
