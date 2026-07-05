# Singh Studio — S·/·S

## The system at a glance

- **13 pages**, one stylesheet, three scripts, three fonts (74KB total), zero
  dependencies, no build step.
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

A single-page studio site. No frameworks, no build step, no dependencies —
three files and your photography do all the work.

```
Website/
├── index.html        # the studio one-pager (web-led ordering)
├── case-*.html       # four case studies (Amplify, More, Band Camp, Firezone)
├── together.html     # engagement models: Project / Retainer / Sprint
├── thoughts.html     # writing space ("Observations") + thought-*.html posts
├── archive.html      # the photo archive (sticky set-tabs + masonry + lightbox)
├── css/style.css     # design system (archive styles at the bottom)
├── js/main.js        # shared interactions (CONFIG block at the top)
├── js/archive.js     # archive-only: scrollspy tabs + sequential lightbox
└── assets/
    ├── fonts/        # self-hosted woff2 (Switzer, Sentient, Fragment Mono)
    └── img/          # web-resolution exports (+ /archive for the archive-only frames)
```

## Run it locally

Any static server works:

```bash
cd Website
python3 -m http.server 4173
# → http://localhost:4173
```

## The one thing to configure — Google Meet bookings

1. In [Google Calendar](https://calendar.google.com) (with your kris@singhstudio.co.nz
   account), create an **Appointment schedule** — e.g. "Intro call", 20 min.
   Appointment schedules attach a **Google Meet link automatically** to every booking.
2. Open the schedule → **Share** → copy the booking-page link
   (looks like `https://calendar.app.google/AbC123xyz`).
3. Paste it into `js/main.js` at the top:

```js
const CONFIG = {
  bookingUrl: "https://calendar.app.google/AbC123xyz",  // ← here
  email: "kris@singhstudio.co.nz",
};
```

Until you do this, the "Book a Google Meet" button falls back to a pre-filled
email to you — nothing breaks, leads still land.

## Deploying

The folder is deploy-ready for any static host (Netlify, Vercel, Cloudflare
Pages, GitHub Pages — drag-and-drop the `Website` folder). After you deploy:

- `og:image` in `index.html` assumes `https://singhstudio.co.nz` — update the
  domain if the site lives elsewhere.
- Footer social links point at instagram.com / linkedin.com generically —
  swap in your profile URLs.

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

## Deploy checklist

1. `CONFIG.bookingUrl` in `js/main.js` — your Google Calendar appointment link.
2. Footer Instagram / LinkedIn URLs (both pages).
3. If the domain isn't `singhstudio.co.nz`: update `og:image`, `canonical`
   (both pages), `robots.txt` and `sitemap.xml`.

## Voices — swapping in real testimonials

The slider in `index.html` (`05 / Voices`) ships with **[bracketed]
placeholders — replace them with real client words before launch.**

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

To add a post: copy a `thought-*.html`, update title/date/tag/prose, add a
row to the list in `thoughts.html`, an `<item>` to `feed.xml`, and a line
to `sitemap.xml`. Body copy goes in plain `<p>`/`<h2>`/`<ol>` — the
typography does the rest.

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
