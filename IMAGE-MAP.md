# Image Map — Singh Studio

Every image slot on the site: what it is, its actual pixel size (read via `sips`, not guessed), where it's used, how it's displayed, and what a replacement needs to be. Use this before you swap any photo — several images do double duty (light table **and** archive, or a homepage photo reused inside a template demo), and this map tells you what else breaks if you only update one spot.

**Reading a row**: *Path* is relative to `Website/`. *Actual size* is the real pixel dimensions of the file on disk today. *Used* lists every page + role. *Display* describes how the CSS frames it (cover-crop vs. contain, aspect ratio, orientation). *Replacement spec* is the minimum you need to hand the ingest script for a like-for-like swap.

**Re-verified 2026-07-08 (post-elevation, Wave 6).** WebP coverage is now sitewide — every jpg with a `.webp` sibling on disk is wrapped in a `<picture>` (the `hero-dancer-red.webp` row below was the one remaining gap; it's now wired in). `bin/check-site.py`'s orphan-asset check runs on every push and will flag it again if a future image gets a `.webp` sibling generated but never wrapped in a `<picture>`.

---

## Hero + brand

| Path | Actual size | Used | Display | Replacement spec |
|---|---|---|---|---|
| `assets/img/hero-kris-portrait.jpg` | 1800×1200 (landscape) | index.html hero background (`data-plx` parallax figure); index.html og:image | Full-bleed cover crop behind scrim, `object-position: 70% 12%`, parallax `data-plx="0.055"` | Landscape orientation works well here (crops to portrait on mobile via `object-fit: cover`). Keep the subject right-of-centre, upper third, so the crop holds across breakpoints — the left side needs clear space for the "SINGH/STUDIO" wordmark. |
| `assets/img/hero-kris-portrait-900.jpg` | 900×600 (landscape) | index.html hero `<img>`/`<source>` srcset at the 900w breakpoint only | Same crop as the 1800 version, smaller responsive variant | Same photo, same crop, just smaller — produced via `bin/ingest-images.sh` (or `sips -Z 900`) alongside the main export. |
| `assets/img/hero-kris-portrait.webp` | 1800×1200 | Same as `hero-kris-portrait.jpg` — webp `<source>` variant | Same as above | Auto-produced alongside the jpg (ffmpeg webp pass). |
| `assets/img/hero-kris-portrait-900.webp` | 900×600 | Same as `hero-kris-portrait-900.jpg` — webp `<source>` variant at 900w | Same as above | Same note as the -900 jpg above. |
| `assets/img/hero-dancer-red.jpg` | 1500×2000 (portrait) | index.html light table FR 001 (`lt-tall`); together.html og:image; templates.html og:image; archive.html og:image + Movement set frame #1; `templates/folio.html` hero image (as `../assets/img/hero-dancer-red.jpg`) | Light table, archive masonry and the Folio demo hero all wrap this in a `<picture>` with the `.webp` sibling below as the `<source>` (added 2026-07-08 — was a bare `<img>` before, which is why `bin/check-site.py`'s orphan check flagged the unused webp). og:image tags stay pointed at the `.jpg` directly (og:image only supports one URL). | Portrait orientation, **min 1500×2000** (2:3-ish), strong single subject reads at both full-bleed and thumbnail scale. Still reused in 5 places — check all of them before swapping, even though it's no longer the homepage hero. |
| `assets/img/hero-dancer-red.webp` | 1500×2000 | Same as `hero-dancer-red.jpg` — webp `<source>` variant, now actually wired into a `<picture>` in all three markup usages above (see note above; was previously generated but unused) | Same as above | Auto-produced by the ingest script alongside the jpg (ffmpeg webp pass). |

*(`hero-dancer-red-900.jpg`/`.webp` — the 900w responsive variants once listed here — were removed from disk in an earlier repo-hygiene pass, verified zero references at the time. If you see them mentioned elsewhere, that's stale; they no longer exist.)*
| `assets/img/ss-logo.png` | 115×115 (square) | **Favicon on all 13 root pages + all 7 template demos** (`<link rel="icon">`) | Browser tab icon | Square, simple enough to read at 16–32px. If you redesign the mark, export at minimum 128×128 and keep the filename so you don't have to touch 20 files. |
| `assets/img/apple-touch-icon.png` | 180×180 (square) | Home-screen icon on all 12 root pages **except 404.html** (`<link rel="apple-touch-icon">`) | iOS/Android "add to home screen" icon | Square, 180×180 exactly (Apple's spec), no transparency (iOS adds its own rounding/background). |

## og:image usage (per-page — same files as above, listed here for the SEO/share angle)

| Page | og:image points to |
|---|---|
| index.html | `hero-kris-portrait.jpg` |
| together.html | `hero-dancer-red.jpg` |
| templates.html | `hero-dancer-red.jpg` |
| archive.html | `hero-dancer-red.jpg` |
| kris.html | `kris-portrait.jpg` |
| thoughts.html | `gal-ferry-teal.jpg` |
| thought-start-with-the-message.html | `gal-ferry-teal.jpg` |
| thought-the-20-minute-brief.html | `gal-cafe-doc.jpg` |
| case-amplify.html | `work-amplify.jpg` |
| case-nextgen.html | `work-nextgen.jpg` |
| case-peniel.html | `work-peniel.jpg` |
| case-littlethings.html | `work-littlethings.jpg` |
| case-butterfly.html | `work-butterfly.jpg` |
| case-wcn.html | `work-wcn.jpg` |
| case-bearers.html | `work-bearers.jpg` |
| case-rhythms.html | `work-rhythms.jpg` |

**All og:image tags are absolute URLs** (`https://singhstudio.co.nz/assets/img/…`) — if the domain changes, every one of these 12 lines needs updating (see LAUNCH-CHECKLIST.md, section B).

---

## Light table + archive (the shared photo pool)

Most of these frames appear in **both** index.html's horizontal light-table strip and archive.html's masonry grid — they're the same underlying photography, referenced from two different pages. A handful only live in one or the other. Check the "Also in" column before you swap a file.

| Path | Actual size | Orientation | Used | Display |
|---|---|---|---|---|
| `assets/img/gal-dancer-floor.jpg` | 1600×1200 | Landscape | Light table FR 002; Archive Movement set | Light table: standard card. Archive: masonry tile. |
| `assets/img/gal-brass-rain.jpg` | 1447×1600 | Portrait | Light table FR 003 (`lt-tall`); Archive Documentary set; `templates/folio.html` gallery grid | Tall card / masonry / folio grid cell (600×663 in the demo). |
| `assets/img/gal-pasifika.jpg` | 1600×1079 | Landscape | Light table FR 004; Archive Documentary set; **`templates/commons.html`** community-gathering photo | Standard card / masonry / commons demo hero-adjacent image. **Cross-use in a demo — see note below.** |
| `assets/img/gal-onset-bts.jpg` | 1200×1600 | Portrait | Light table FR 005 (`lt-tall`); Archive Movement set | Tall card / masonry. |
| `assets/img/gal-joy-florals.jpg` | 1600×982 | Landscape | Light table FR 006; Archive People set; **`templates/counter.html`** ×2 (menu photo strip) | Standard card / masonry / counter demo. **Cross-use in a demo.** |
| `assets/img/gal-kakahu.jpg` | 1600×901 | Landscape | Light table FR 007; Archive People set; `templates/folio.html` gallery grid | Standard card / masonry / folio grid cell (600×338). |
| `assets/img/gal-cafe-doc.jpg` (+ `.webp`) | 1571×1600 | Near-square/portrait | Light table FR 008; Archive Documentary set; og:image for "The 20-minute brief" thought post; margin figure inside that same post; **`templates/counter.html`** ×2 (café interior) | Standard card / masonry / post margin figure / counter demo hero. **Cross-use in a demo.** |
| `assets/img/gal-braided-river.jpg` | 1600×1066 | Landscape | Light table FR 009; Archive Land & Wild set; `templates/folio.html` gallery grid | Standard card / masonry / folio grid cell (600×400). |
| `assets/img/gal-brick-walker.jpg` (+ `.webp`) | 1600×1319 | Landscape | Light table FR 010; Archive Documentary set | Standard card / masonry. |
| `assets/img/gal-ferry-teal.jpg` (+ `.webp`) | 1600×946 | Landscape | Light table FR 011; Archive Land & Wild set; og:image + featured card + margin figure on thoughts.html and "Start with the message" post; `templates/folio.html` gallery grid | Standard card / masonry / og-image / margin figure (up to ~670px on wide screens per README) / folio grid cell (600×355). |
| `assets/img/gal-stone-bridge.jpg` (+ `.webp`) | 1600×965 | Landscape | Light table FR 012; Archive Land & Wild set | Standard card / masonry. |
| `assets/img/gal-pigment-feet.jpg` (+ `.webp`) | 1600×1200 | Landscape | Archive Movement set only (not on the light table) | Masonry tile. |
| `assets/img/gal-raptor-bw.jpg` | 1600×841 | Wide landscape | Archive Documentary set only | Masonry tile. |

### Archive-only frames (`assets/img/archive/` — 27 files, never appear on the light table)

| Path | Actual size | Set | Also used in |
|---|---|---|---|
| `ar-dancers-leap.jpg` | 1400×1050 | Movement | `templates/folio.html` grid (600×450) |
| `ar-dancer-dark.jpg` | 1050×1400 | Movement | `templates/folio.html` grid (600×800) |
| `ar-cyc-wide.jpg` | 1400×1050 | Movement | — |
| `ar-bts-camera.jpg` | 1050×1400 | Movement | — |
| `ar-dancer-white.jpg` | 1400×1050 | Movement | — |
| `ar-orange-cloth.jpg` | 1050×1400 | Documentary | `templates/folio.html` grid (600×800) |
| `ar-officer.jpg` | 1139×1400 | Documentary | — |
| `ar-flagbearer.jpg` | 1400×1050 | Documentary | — |
| `ar-kitchen.jpg` | 1400×933 | Documentary | **`templates/commons.html`** volunteer-kitchen photo — cross-use in a demo |
| `ar-alley-bw.jpg` | 1102×1400 | Documentary | `templates/folio.html` grid (600×762) |
| `ar-interior.jpg` | 1400×1202 | Documentary | — |
| `ar-cyclone.jpg` | 1400×789 | Documentary | — |
| `ar-window-light.jpg` | 1064×1400 | People | `templates/folio.html` grid (600×789) |
| `ar-gazebo.jpg` | 1400×789 | People | — |
| `ar-bride-bouquet.jpg` | 1400×1063 | People | `templates/folio.html` grid (600×456) |
| `ar-groom.jpg` | 866×1400 | People | — |
| `ar-golden-child.jpg` | 1400×1246 | People | — |
| `ar-snow-smile.jpg` | 1400×933 | People | — |
| `ar-couch-dog.jpg` | 1400×925 | People | — |
| `ar-dog-golden.jpg` | 1244×1400 | People | — |
| `ar-snow-range.jpg` | 1400×978 | Land & Wild | `templates/folio.html` grid (600×419) |
| `ar-snow-sheep.jpg` | 1400×573 | Land & Wild (very wide crop) | — |
| `ar-sunset-lake.jpg` | 1400×933 | Land & Wild | — |
| `ar-kangaroo.jpg` | 1400×933 | Land & Wild | — |
| `ar-elephant.jpg` | 1400×933 | Land & Wild | — |

**Replacement spec for any light-table/archive frame**: landscape or portrait both work (masonry adapts), **minimum 1400px on the long edge**, JPEG quality ~80. Portrait frames read well as `lt-tall` cards on the light table if you want to promote one there. Always add a `figcaption` following the sitewide convention: on the light table, `FR 0XX: Short title / category`; in the archive, a short evocative two-part caption (`Title / mood`) — see CONTENT-GUIDE.md for every existing caption's exact wording.

**Frame-count reconciliation needed**: archive.html's live-counted total is currently **37 frames / 4 sets** (`js/archive.js` recounts this from the DOM automatically — don't hand-edit `#archiveCount`). index.html's light-table end-card hard-codes **"40 frames / 4 sets"** as plain text, which does not match and will not auto-update. Fix one or the other before launch (see LAUNCH-CHECKLIST.md).

---

## Work / case-study screenshots

| Path | Actual size | Used | Display | Replacement spec |
|---|---|---|---|---|
| `assets/img/work-amplify.jpg` | 1600×934 | index.html work-grid card; case-amplify.html hero shot (`case-shot`, `data-mask`); og:image for case-amplify.html | Work card: `<img width="1600" height="934">` cover-crop. Case page: full-width masked reveal. | Landscape, ~16:9-ish (1600×934 ≈ 1.71:1), a clean full-page screenshot or hero frame of the actual site/build. Keep width/height attributes in sync with the real file to avoid layout shift. |
| `assets/img/work-nextgen.jpg` | 1600×1000 | index.html work-grid card; case-nextgen.html hero shot; og:image for case-nextgen.html | Work card + case page, same `<picture>` pattern (webp sibling wired) | Tino Taonga share-card art, cover-cropped from 16:9 — swap for a full-page screenshot of the live site whenever one is captured. |
| `assets/img/work-peniel.jpg` | 1600×1000 | index.html work-grid card; case-peniel.html hero shot; og:image for case-peniel.html | Same pattern | Studio photo of the WHCC building front (from the client asset folder). |
| `assets/img/work-littlethings.jpg` | 1600×1000 | index.html work-grid card; case-littlethings.html hero shot; og:image for case-littlethings.html | Same pattern | Composite: two app screenshots (home + person page) on an ink ground, built with ffmpeg hstack+pad. Rebuild from getlittlethings.app screenshot assets if the app UI changes. |
| `assets/img/work-butterfly.jpg` | 1600×1000 | index.html work-grid card; case-butterfly.html hero shot; og:image for case-butterfly.html | Same pattern | Project photography from the live butterflybuilds.co.nz homepage hero. |
| `assets/img/work-wcn.jpg` | 1600×1000 | index.html work-grid card; case-wcn.html hero shot; og:image for case-wcn.html | Same pattern | Homepage hero image from the live wellingtonchurchnetwork.co.nz site (their licensed imagery). |
| `assets/img/work-bearers.jpg` | 1600×1000 | index.html work-grid card; case-bearers.html hero shot; og:image for case-bearers.html | Same pattern | This Is Who We Are EP artwork centred on an ink ground (pad, not crop — keep the square art whole). |
| `assets/img/work-rhythms.jpg` | 1600×1000 | index.html work-grid card; case-rhythms.html hero shot; og:image for case-rhythms.html | Same pattern | Podcast cover artwork centred on an ink ground, same pad treatment as Bearers. |

Every `work-*.jpg` above has a `.webp` sibling wired into its `<picture>` (including work-amplify, added 2026-07-13). None are reused inside the template demos — safe to swap independently. (work-more / work-bandcamp / work-firezone were removed 2026-07-13 with their case pages.)

**Object-mode assets (2026-07-13).** Four cards/case-shots carry non-photographic assets and use the `.wc-object` / `.cs-object` treatment (asset contained whole on a pinned ink ground — CSS in the WORK and case sections of style.css), so these files keep their native ratios and can be swapped for ANY ratio without cropping concerns: `art-nextgen.{jpg,webp}` (1200×630 share card), `art-bearers.{jpg,webp}` (1100², EP art), `art-rhythms.{jpg,webp}` (1100², podcast art), `app-littlethings-{home,person}.{jpg,webp}` (506×1100 phone shots). The 1600×1000 `work-nextgen/littlethings/bearers/rhythms.jpg` composites remain ONLY as og:images for those case pages (their .webp siblings were removed); if you replace an og composite, keep it ~1600×1000.

---

## Portraits

**Studio section rework (2026-07-13).** The homepage Kris section now runs a single full-bleed frame: `kris-studio.jpg/.webp` (2000×1500) + `kris-studio-1000` variants (processed from `04_Creative_Production/Photography/IMG_1092.jpeg` — note the source carries a 180° EXIF rotation; pixels were baked upright). CSS `.studio-bleed` cover-crops it to ~62vh, `object-position: center 42%`. The contact-sheet strip and the polaroid candid are both retired: `kris-enroute.jpg/.webp` and `kris-portrait.webp` were removed from the repo (recoverable from git history); `kris-portrait.jpg` remains ONLY as kris.html's og:image.


| Path | Actual size | Used | Display | Replacement spec |
|---|---|---|---|---|
| `assets/img/kris-portrait.jpg` | 1200×1200 (square) | index.html studio section main figure (`sv-main`); kris.html og:image; archive.html People set (captioned "The photographer / occasionally in frame"); byline avatar on **both** thought posts (`post-avatar`, rendered at 92×92) | Studio section: square portrait, `figcaption` "Kris Singh, Director". Byline: small circular-cropped avatar. | **Square, min 1200×1200** — used at both full portrait size and tiny avatar size, so it needs to read clearly cropped tight on the face. Changing this photo touches 5 files/roles; update all of them together so the "same person" reads consistently. |
| `assets/img/kris-enroute.jpg` | 825×1100 (portrait) | index.html studio section candid figure (`sv-candid`) only | Smaller candid portrait next to the main one, `figcaption` "En route: wherever the brief is" | Portrait orientation, min 825×1100, a candid/environmental shot rather than a posed one — it's deliberately the "other side" of the formal portrait next to it. |

---

## Video assets

| Path | Actual size | Duration | Used | Display | Replacement spec |
|---|---|---|---|---|---|
| `assets/video/joy-florals-feature.mp4` | 1280×720 (h264) | 1:57 (116.6s per ffprobe) | index.html Voices section, video testimonial slide | Plays inline in a 16:9 frame, `preload="none"`, starts only on click of the play overlay | README recommends re-encoding to 720p H.264 via `ffmpeg -vf scale=1280:-2 -crf 27`, targeting **~10MB** — current file is 10MB already, right at that ceiling. If you replace it, keep the runtime label ("1:57") on index.html's play-button text in sync with the actual new duration. |
| `assets/img/voice-joy-poster.jpg` | 1280×720 (landscape) | — | `poster` attribute on the video above, shown before playback starts | Must match the video's own 16:9 frame and ideally be a flattering freeze-frame from the actual clip, not a generic stand-in. |

---

## Icons / structural (not photography — listed for completeness, low priority to touch)

- `assets/img/ss-logo.png` and `assets/img/apple-touch-icon.png` — see "Hero + brand" table above.
- No other icon files exist; UI icons (the plus/arrow/slash marks, mock-browser dots in the template cards) are drawn in CSS/HTML, not images.

---

## Fonts (self-hosted, not swappable via the ingest script — listed for completeness only)

| Path | Size on disk |
|---|---|
| `assets/fonts/switzer-variable.woff2` | 43KB |
| `assets/fonts/fragment-mono.woff2` | 15KB |
| `assets/fonts/plex-serif-italic.woff2` | 16KB |

Total font weight ~74KB, matching the README's "74KB total, zero dependencies" claim. Not part of the image pipeline — don't run these through `ingest-images.sh`.

---

## Cross-use in demos — full list (check before you replace a source photo)

The seven template demos in `templates/` borrow real Singh Studio photography as placeholder set-dressing for their fictional businesses. If you replace one of these source files sitewide (e.g. reshoot and re-export `gal-cafe-doc.jpg`), the matching demo will pick up the new photo automatically since it points at the same path — usually desirable, but check the demo's `alt` text still makes sense for the new image before you consider the swap done:

- **`templates/commons.html`** — uses `gal-pasifika.jpg` (community gathering) and `archive/ar-kitchen.jpg` (volunteers preparing food).
- **`templates/counter.html`** — uses `gal-cafe-doc.jpg` ×2 (café interior, counter) and `gal-joy-florals.jpg` ×2 (flowers on a café table).
- **`templates/folio.html`** — uses the most: `hero-dancer-red.jpg` (as its own hero image), plus a 10-image gallery grid drawing on `gal-brass-rain.jpg`, `archive/ar-dancer-dark.jpg`, `gal-braided-river.jpg`, `archive/ar-window-light.jpg`, `gal-kakahu.jpg`, `archive/ar-dancers-leap.jpg`, `archive/ar-orange-cloth.jpg`, `gal-ferry-teal.jpg`, `archive/ar-alley-bw.jpg`, `archive/ar-bride-bouquet.jpg`, `archive/ar-snow-range.jpg`.
- **`templates/toolbelt.html`, `templates/ledger.html`, `templates/programme.html`, `templates/storefront.html`** — do not reference any real Singh Studio photography; their imagery (if any) is CSS mockup blocks, not real files.

All seven demos link their favicon to `../assets/img/ss-logo.png` — if you ever move or rename that file, all seven demo pages need the relative path checked too.

---

## Quick recipes

### To add a new archive frame

1. Export the photo, ~1400px+ on the long edge, JPEG quality ~80 (or run it through the ingest script below for a consistent result).
2. Drop the file in `assets/img/archive/` (or `assets/img/` if it's good enough to also feature on the homepage light table).
3. In `archive.html`, add a `<figure class="ph" data-cursor="VIEW"><img src="…" alt="…" width="…" height="…" loading="lazy" decoding="async"><figcaption>Your caption</figcaption></figure>` to whichever `<section class="set">`'s `.masonry` grid it belongs in.
4. Don't touch the tab's superscript count or `#archiveCount` — `js/archive.js` recounts both automatically from the DOM the next time the page loads.
5. If it's striking enough for the homepage too, also add a matching `<figure class="lt-item" data-cursor="VIEW">` block to index.html's `#ltTrack`, with the next sequential `FR 0XX` figcaption number — this one **does** need manual renumbering, and so does the light-table end-card's hard-coded "40 frames / 4 sets" text (see the reconciliation note above).

### To swap the hero — corrected 2026-07-08

**Current hero (as of this pass): `hero-kris-portrait.jpg`, 1800×1200 landscape** (a brick-wall
portrait of Kris), not the older `hero-dancer-red.jpg` this recipe used to describe — that photo
moved off the homepage hero role a while back and is now only a light-table/archive/og:image
asset (see the rows above). This recipe was written before that swap and never got updated
until now; the steps below describe the *current* hero image's actual specs.

1. Pick the new hero photo — this hero slot is currently **landscape**, roughly 3:2
   (1800×1200), cropped via `object-fit: cover` with `object-position: 70% 12%` so the subject
   sits right-of-centre, upper third (clear space on the left for the "SINGH/STUDIO" wordmark).
   A portrait photo would need the crop/scrim CSS re-checked, not just the file swapped.
2. Run it through `bin/ingest-images.sh` with the `--hero` flag and a clear slug, e.g.
   `./bin/ingest-images.sh --hero --slug hero-newshot _incoming/my-photo.jpg`.
3. Manually also produce a 900px-wide companion (the site's responsive `srcset` expects both a
   full-size and a `-900` variant) — export/resize a second pass at 900px long edge, named
   `hero-newshot-900.jpg` (plus its `.webp`).
4. Update index.html's hero `<picture>` block (both the `<source>` and `<img>` `srcset`/`src`
   attributes) to point at the new filenames, and update the `width`/`height` attributes to
   match the new file's real dimensions.
5. Update the hero frame caption (currently `"FR 000 — KRIS SINGH / DIRECTOR"`, grep
   `FR&nbsp;000&nbsp;—&nbsp;KRIS`) to describe the new photo.
6. **index.html's own og:image already points at the current hero** (`hero-kris-portrait.jpg`)
   — update it alongside the hero itself. together.html/templates.html/archive.html's og:image
   tags deliberately still point at `hero-dancer-red.jpg` (a separate, older decision — see the
   og:image usage table above) and are unaffected by a hero swap unless you choose to change
   those too.
7. Run `python3 bin/check-site.py` after — it'll catch a missing file or a broken path
   immediately rather than leaving a silent 404 in the `<picture>` block.

---

## Totals — recounted 2026-07-08

**87 distinct image files on disk today**: 23 JPEGs in `assets/img/` (including the video poster and both portraits) + 3 icon PNGs (`ss-logo.png`, `apple-touch-icon.png`, and `favicon-32.png` — added by the favicon-set work) + 12 `.webp` companions in `assets/img/` + 25 JPEGs in `assets/img/archive/` + 24 `.webp` companions in `assets/img/archive/`. Plus **1 video asset** (`joy-florals-feature.mp4`). The row-by-row counts above (originally "56 files... 7 webp companions... 25 JPEGs in archive with NO webp coverage") predate the sitewide WebP programme — webp coverage now extends into `assets/img/archive/`, 24 of its 25 jpgs have a webp sibling (the one exception, `ar-dancer-dark.jpg`, is 72KB — below the 150KB threshold the WebP pass targeted, so its absence is by design, not a gap). Usage-instance count not recounted in this pass — treat the old "≈90 usage instances" figure as a rough historical estimate, not current.
