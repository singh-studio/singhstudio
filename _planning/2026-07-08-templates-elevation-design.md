# Templates Elevation — Design Spec

**Date:** 2026-07-08 · **Approved by:** Kris (conversation, 2026-07-08)
**Scope:** All 7 demo sites in `templates/` + the `templates.html` shopfront.

## Goal

Turn the seven preset template demos into bold, functional multi-page demo *sites* that win business on sight — not conservative polish, not generic "vibe-coded" aesthetics. A client clicking a demo should experience a complete site: working menus, multiple pages, real interactive functionality.

## Non-negotiable invariants (unchanged from current system)

1. Each demo is ONE self-contained HTML file in `templates/` (own fonts via Google Fonts links, own CSS/JS inline, images via `../assets/img/`).
2. Every demo keeps: `<meta name="robots" content="noindex">`, the fixed "TEMPLATE DEMO · <NAME> · A SINGH STUDIO BUILD" bar (`--demo-bar-h:52px`) with "ALL TEMPLATES" + "MAKE IT YOURS →" links.
3. Root pages untouched except `templates.html`. No build step. No npm.
4. `js/templates.js` finder maps stay intact (extended only for persistence).
5. Existing `data-track` hooks and commented `tpl-price` slots on templates.html stay.

## Functional model (all seven demos)

- **In-file pages via hash routing:** `demo.html#/menu`, `#/work/tidal`, etc. Each page is a `<section data-page="...">`; the router toggles `.is-active`, animates transitions, scrolls to top, syncs `aria-current` in nav, supports back/forward and deep links. No-JS fallback: all pages render stacked (CSS hides inactive pages only when `html.js`).
- **Working mobile menu** per demo (aria-expanded, Escape closes, focus returns to trigger).
- **One signature functional component** per demo (below) — real logic, not decoration.

## The seven concepts

| Demo | Business | Concept | Pages (hash routes) | Signature functionality |
|---|---|---|---|---|
| toolbelt | Ridgeline Builders (trades) | **The Job Sheet** — blueprint/technical-drawing language: drafting grid, dimension annotations, hazard tape, massive Archivo caps | home, services, jobs, reviews, quote | Before/after drag slider on jobs; quote form styled as a job docket with working validation |
| counter | Little Harbour Café | **The Daily Menu** — menu as typographic print piece; Fraunces at display sizes | home, menu, story, gallery, find-us | Live open/closed state from real Pacific/Auckland time ("Open now — closes 3pm") |
| ledger | Cove & Co. Accountants | **The Annual Report** — editorial finance-report: ruled columns, marginalia, giant serif numerals, tariff-card fee schedule | home, services, approach, people, contact | Working fee estimator (turnover band + services → indicative annual range); counting stat numerals |
| commons | Harbourside Community Trust | **The Noticeboard** — layered pinned notices, tape details, photo-forward warmth | home, programmes, events, volunteer, donate | Events list with working type filters; volunteer form with validation states |
| programme | GATHER 27 (conference) | **The Lineup Drop** — festival-grade marquee names, electric accents on near-black | home, speakers, timetable, tickets | Interactive timetable (Day 1/Day 2 × two stages) + live countdown to 13 Mar 2027 |
| storefront | North End Candle Co. | **The Shop That Works** — flat editorial product art (CSS-drawn glossy candle is deleted), art-directed color fields | home, shop, product/:id, story, stockists | Cart drawer: add/remove/quantity/subtotal, persists in sessionStorage; per-product pages; scent-family filter |
| folio | ELLISON (photographer) | **The Index** — dark photographic drama + the missing work system, built from `assets/img/gal-*` | home, work, work/:slug, about, contact | Work index with hover-floating image preview; project pages with keyboard-navigable lightbox |

## Craft bar (every demo)

- **Motion:** anime.js v4.5.0 (`https://cdn.jsdelivr.net/npm/animejs@4.5.0/+esm`). Choreographed hero entrance per site, page-transition choreography, one scroll-linked moment per site. Transforms/opacity only. Everything gated: if `prefers-reduced-motion: reduce` → skip animations, show final states instantly. If JS fails to load → full content visible (initial hidden states set via JS, never CSS).
- **Distinct nav pattern per demo** (no two alike), all functional.
- **Banned:** glassmorphism, purple-gradient glows, emoji feature grids, identical three-card rows, stock "AI SaaS" layouts, faux-3D gradient illustrations.
- Fix in passing: ledger nav CTA renders with no visible label (contrast bug).

## Shopfront (templates.html)

- Card mockups (`.tpl-mock`) become **living micro-previews**: subtle CSS-only loops per template (steam curl, hazard-stripe crawl, timetable tick, cart badge pulse, etc.). `prefers-reduced-motion` pauses all.
- Staggered grid entrance; card hover = lift + mockup parallax tilt (CSS transform only).
- **Finder persistence** (ELEVATION-PLAN T3.3): finder selections survive navigation to a demo and back, via `sessionStorage`.
- Copy row per card gains a "Pages included" line reflecting the new routes.

## Verification model

Local server: `python3 -m http.server 4173 -d "02_Singh_Studio/Website"` (exists as `singh-studio-site` in `.claude/launch.json`). Demos screenshot cleanly; `templates.html` has a known preview-screenshot compositing quirk (loader clip-path) — verify it via DOM snapshot/eval, not pixels. Zero console errors allowed. Mobile pass at 375px. Every route deep-linkable and back-button safe.

## Out of scope

Real checkout/payments, CMS, analytics changes, root-page redesigns, new template cards, real client imagery for storefront (flat editorial direction now; photography swappable later per client).
