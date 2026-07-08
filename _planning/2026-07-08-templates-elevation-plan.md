# Templates Elevation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild/elevate all 7 template demos in `templates/` into bold, functional multi-page demo sites (hash-routed pages, working components, choreographed motion) and elevate the `templates.html` shopfront.

**Architecture:** Each demo stays ONE self-contained HTML file. A dependency-free inline hash router swaps `<section data-page>` views; anime.js v4.5.0 (pinned CDN ESM, failure-isolated) adds choreography; each demo ships one signature functional component (cart, estimator, timetable, etc.) as inline vanilla JS. Shopfront gets CSS-only living card previews + sessionStorage finder persistence.

**Tech Stack:** Vanilla HTML/CSS/JS, anime.js 4.5.0 via `https://cdn.jsdelivr.net/npm/animejs@4.5.0/+esm`, Google Fonts (demos only), python http.server for preview. No build step, no npm, no other libraries.

---

## READ THIS FIRST (every implementer, every task)

1. **Read the spec:** `_planning/2026-07-08-templates-elevation-design.md`. It is the contract. Do not invent design decisions; every parameter you need is in THIS plan. If something truly isn't specified, match the closest pattern in this plan — never import an outside aesthetic.
2. **Working dir:** all paths relative to the git repo root `/Users/krissingh/Desktop/Singh Studio/02_Singh_Studio/Website`.
3. **Invariants (breaking any = task failure):**
   - Demos are single self-contained files in `templates/`. Images only from `../assets/img/`. Fonts only via Google Fonts `<link>` in that file.
   - Keep in every demo `<head>`: `<meta name="robots" content="noindex">`, existing favicon links, `<title>Demo: <Business> — a Singh Studio template</title>`.
   - Keep the fixed demo bar at the bottom exactly as in the current files: `TEMPLATE DEMO · THE <NAME> · A SINGH STUDIO BUILD` with `ALL TEMPLATES` → `../templates.html` and `MAKE IT YOURS →` → `mailto:kris@singhstudio.co.nz?subject=Template%20enquiry%20%E2%80%94%20The%20<Name>`. Its height variable `--demo-bar-h:52px` stays; `body{padding-bottom:var(--demo-bar-h)}`.
   - Root pages: only `templates.html` (+ `js/templates.js`, `css/style.css` where stated) may change.
   - **Banned aesthetics:** glassmorphism, purple gradient glows, emoji icons, faux-3D gradient illustrations, identical three-card feature rows.
4. **Motion rules:** animate `transform`/`opacity`/`clip-path` only. Initial hidden states are set by JS immediately before animating — NEVER in CSS (no-JS users must see full content). Honor reduced motion everywhere via the `REDUCED()` helper (Pattern B). CSS keyframe loops get `@media (prefers-reduced-motion: reduce){ animation: none }`.
5. **Verify in the browser** with the `singh-studio-site` preview server (port 4173, serves repo root). Demo pages screenshot fine. `templates.html` does NOT screenshot reliably below the fold (loader clip-path compositing quirk) — verify it with DOM eval/snapshot, not pixels. Zero console errors is part of every task's acceptance.
6. **Commit after every task** with the exact message given. Work on branch `templates-elevation`.

---

## SHARED PATTERNS

Insert these verbatim where a task says "insert Pattern X". `{{PLACEHOLDERS}}` are filled per task.

### Pattern A — Hash router (plain script, no dependencies; goes just before `</body>`, BEFORE Pattern B)

```html
<script>
(function () {
  document.documentElement.classList.add('js');
  var pages = {};
  document.querySelectorAll('[data-page]').forEach(function (s) { pages[s.getAttribute('data-page')] = s; });
  var current = null;
  function parse() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, '')).replace(/\/$/, '');
    if (!h) return { page: 'home', param: null };
    if (pages[h]) return { page: h, param: null };
    var head = h.split('/')[0];
    if (pages[head + '/:']) return { page: head + '/:', param: h.slice(head.length + 1) || null };
    return { page: 'home', param: null };
  }
  function show(first) {
    var r = parse();
    var next = pages[r.page] || pages.home;
    if (window.__pageSetup) { try { window.__pageSetup(r.page, r.param, next); } catch (e) {} }
    if (next !== current) {
      if (current) current.classList.remove('is-active');
      next.classList.add('is-active');
      current = next;
    }
    document.querySelectorAll('a[data-nav]').forEach(function (a) {
      var t = a.getAttribute('href').replace(/^#\//, '') || 'home';
      a.setAttribute('aria-current', t === r.page.split('/')[0] ? 'page' : 'false');
    });
    window.scrollTo(0, 0);
    if (window.__closeMenu) window.__closeMenu(false);
    if (!first && window.__pageEnter) { try { window.__pageEnter(next); } catch (e) {} }
  }
  window.addEventListener('hashchange', function () { show(false); });
  show(true);
})();
</script>
```

Required CSS (in the demo's `<style>`):

```css
html.js main > [data-page] { display: none; }
html.js main > [data-page].is-active { display: block; }
/* no-JS: all pages render stacked in order — acceptable fallback */
```

Markup contract: every page is `<section data-page="NAME">` directly inside `<main>`; home is `data-page="home"`; parameterized pages are `data-page="work/:"` etc. All internal nav links: `<a data-nav href="#/menu">` (home links `href="#/"`).

### Pattern B — Motion boot (module script, goes AFTER Pattern A)

```html
<script type="module">
try {
  const { animate, createTimeline, stagger, svg, utils } = await import('https://cdn.jsdelivr.net/npm/animejs@4.5.0/+esm');
  const REDUCED = () => sessionStorage.getItem('ss_reduced') === '1'
    || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const splitChars = (el) => {
    const t = el.textContent; el.textContent = ''; el.setAttribute('aria-label', t);
    return t.split('').map((c) => {
      const s = document.createElement('span');
      s.textContent = c; s.style.display = 'inline-block'; s.setAttribute('aria-hidden', 'true');
      if (c === ' ') s.style.whiteSpace = 'pre';
      el.appendChild(s); return s;
    });
  };
  window.__pageEnter = (section) => {
    if (REDUCED()) return;
    const els = $$('[data-anim]', section);
    if (!els.length) return;
    els.forEach((e) => { e.style.opacity = '0'; });
    animate(els, { opacity: [0, 1], translateY: [{{ENTER_Y}}, 0], duration: 560, ease: 'outQuint', delay: stagger(55) });
  };
  if (!REDUCED()) {
    {{HERO_TIMELINE}}
    {{SCROLL_MOMENT}}
  }
  {{DEMO_MOTION_EXTRAS}}
} catch (e) { /* CDN unreachable: site stays fully functional, no motion */ }
</script>
```

`{{ENTER_Y}}` is per demo (default `18`). The three other placeholders are given per task. Elements that should cascade on page entry get the attribute `data-anim` (no value).

### Pattern C — Mobile menu (plain script; include in demos whose nav collapses; goes before Pattern A)

Markup contract: `<button class="m-btn" aria-expanded="false" aria-controls="mnav">Menu</button>` in the header; `<nav id="mnav" class="m-menu">` containing the same `data-nav` links.

```html
<script>
(function () {
  var btn = document.querySelector('.m-btn'), menu = document.getElementById('mnav');
  if (!btn || !menu) return;
  function set(open) {
    btn.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('open', open);
    document.body.classList.toggle('menu-locked', open);
    if (!open) btn.focus({ preventScroll: true });
  }
  window.__closeMenu = function (refocus) {
    if (menu.classList.contains('open')) { btn.setAttribute('aria-expanded', 'false'); menu.classList.remove('open'); document.body.classList.remove('menu-locked'); if (refocus !== false) btn.focus({ preventScroll: true }); }
  };
  btn.addEventListener('click', function () { set(!menu.classList.contains('open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') window.__closeMenu(); });
})();
</script>
```

CSS contract: `.m-menu{position:fixed; inset:0 0 var(--demo-bar-h) 0; transform:translateY(-102%); transition:transform .45s cubic-bezier(.22,.9,.24,1); z-index:90}` `.m-menu.open{transform:none}` `.menu-locked{overflow:hidden}` `.m-btn{display:none}` — shown ≤820px, where the desktop nav hides.

### Pattern V — Verification recipe (run for EVERY task before commit)

1. Server: ensure `singh-studio-site` (port 4173) is running.
2. Load the page fresh: `preview_eval: window.location.href='http://localhost:4173/<PAGE>'`.
3. `preview_console_logs level=error` → must be empty (font/CDN 404s count as failures).
4. Task-specific eval assertions (listed per task) — each must return the expected value.
5. `preview_resize preset=mobile` → `preview_snapshot` → confirm nav collapses to the menu button, no horizontal overflow: eval `document.documentElement.scrollWidth <= 380` → `true`. Resize back to desktop.
6. Demo pages only: `preview_screenshot` of home for the record.

---

## Task 0: Branch + baseline

**Files:** none (git only)

- [ ] **Step 1:** `cd "/Users/krissingh/Desktop/Singh Studio/02_Singh_Studio/Website" && git checkout templates-elevation && git status --porcelain` → expect empty output (branch already exists — it was created when this plan was committed; do NOT use `-b`).
- [ ] **Step 2:** Start preview server `singh-studio-site`; load `http://localhost:4173/templates.html`; confirm HTTP 200 and zero console errors (baseline).
- [ ] **Step 3:** No commit (nothing changed).

---

## Task 1: Rebuild `templates/folio.html` — ELLISON, "The Index"

**Files:** Rewrite: `templates/folio.html` (complete file replacement; keep `<head>` meta/favicon/title lines and the demo bar markup from the current file)

**Fonts (link, keep from current file):** Cormorant Garamond 300/400 + italic; Albert Sans 400/500/700.

**Tokens:**
```css
--paper:#fafaf8; --ink:#141414; --ink-soft:#4a4a46; --ink-faint:#8a8a83;
--dark:#0e0e0e; --dark-soft:#c9c9c4; --red:#c33f2e; --line:rgba(20,20,20,.14);
--display:'Cormorant Garamond',Georgia,serif; --ui:'Albert Sans',ui-sans-serif,sans-serif;
--demo-bar-h:52px;
```
Type scale: display `clamp(3.2rem, 9vw, 8.5rem)` Cormorant 300; index rows `clamp(1.9rem, 4vw, 2.9rem)`; UI text `0.95rem/1.6` Albert Sans; small caps labels `0.72rem, letter-spacing .14em, uppercase`.

**Pages:** `home`, `work`, `work/:`, `about`, `contact`. Light pages on `--paper`; `work/:` page inverts to `--dark` (set via `body.dark-view` class toggled in `__pageSetup` when page===`work/:`; transition background-color .5s).

**Nav:** top bar, logo "ELLISON" small caps left; right links WORK / ABOUT / CONTACT (`data-nav`). ≤820px → Pattern C menu with links at index-row size.

**PROJECTS data (inline `<script>` before Pattern A) — verbatim:**
```js
window.PROJECTS = [
 { slug:'tidal',   n:'01', title:'Tidal Studies',   cat:'Movement',    year:'2026', imgs:['gal-dancer-floor.jpg','gal-pigment-feet.jpg','hero-dancer-red.jpg'], note:'A season with a contemporary dance company, shot in available light. Bodies as weather: pressure systems, landfall, calm.' },
 { slug:'brass',   n:'02', title:'Brass in the Rain', cat:'Music',     year:'2025', imgs:['gal-brass-rain.jpg'], note:'Street brass under a southerly. The instruments kept playing; the umbrellas gave up first.' },
 { slug:'moana',   n:'03', title:'Mana Moana',      cat:'Culture',     year:'2026', imgs:['gal-pasifika.jpg','gal-kakahu.jpg'], note:'Commissioned portraits and performance work made alongside Pacific communities in Te Whanganui-a-Tara.' },
 { slug:'braided', n:'04', title:'Braided Light',   cat:'Landscape',   year:'2025', imgs:['gal-braided-river.jpg','gal-stone-bridge.jpg'], note:'The braided rivers from above, then from the banks. Water writing its own signature, twice.' },
 { slug:'interisland', n:'05', title:'Interisland', cat:'Documentary', year:'2024', imgs:['gal-ferry-teal.jpg','gal-brick-walker.jpg'], note:'Three crossings, one winter. Everyone on that boat is between two versions of their life.' },
 { slug:'joy',     n:'06', title:'Joy, Arranged',   cat:'Still life',  year:'2026', imgs:['gal-joy-florals.jpg'], note:'Florals for people who send flowers on ordinary Tuesdays. Studio work, one light, no apologies.' },
 { slug:'karearea',n:'07', title:'Kārearea',        cat:'Wildlife',    year:'2025', imgs:['gal-raptor-bw.jpg'], note:'Aotearoa’s falcon, faster than the shutter. Weeks of waiting for a second of contact.' },
 { slug:'onset',   n:'08', title:'On Set',          cat:'Commercial',  year:'2024', imgs:['gal-onset-bts.jpg','gal-cafe-doc.jpg'], note:'Production stills and behind-the-scenes for brands that want the day, not the storyboard.' }
];
```
All image paths render as `../assets/img/` + name.

**Page specs + copy (verbatim):**

- `home`: full-viewport hero, `hero-dancer-red.jpg` full-bleed (object-fit cover, `filter:saturate(.92)`), scrim gradient bottom third. Kicker small caps `PHOTOGRAPHER — TE WHANGANUI-A-TARA` (`data-anim`). H1 "Ellison" Cormorant, chars split+animated (hero timeline). Bottom-right link `data-nav href="#/work"`: "The index →". Below fold: intro block on paper — lede `Fifteen years of movement, music and light. The portfolio is an index, not a slideshow — start anywhere.` (`data-anim`) + three featured rows (projects 01, 03, 07) reusing the index-row component + "See all work →".
- `work` — **THE INDEX (signature):** ruled list, one row per project: `<a class="idx-row" data-nav href="#/work/{slug}">` containing `n` (small, `--ink-faint`), `title` (Cormorant), `cat · year` (small caps, right-aligned). Rows have `data-anim`. Hover: row text `translateX(8px)` (CSS transition), title turns `--red`, and the floating preview appears.
- `work/:` — dark project page, content rendered by `renderProject` (below): kicker `{cat} — {year}`, H1 title (Cormorant, `clamp(2.8rem,7vw,6rem)`), note paragraph (max-width 34ch, `--dark-soft`), then each image full-width (max-height 82vh, object-fit cover, cursor zoom-in, click opens lightbox), then prev/next footer: two `data-nav` links `← {prevTitle}` / `{nextTitle} →` (wraps around).
- `about`: two-column (stacked mobile). Left: `gal-kakahu.jpg` portrait-cropped. Right copy: H2 `The person behind the glass.` + `Ellison shoots movement, music and the water between islands. Based in Wellington, working anywhere the ferry, the van or a commission goes.` + `Clients include theatres, labels, festivals and families who want one honest wall of photographs.` + availability line in small caps: `BOOKING SPRING 2026 — TWO COMMISSIONS OPEN`.
- `contact`: giant type moment. Small caps kicker `SAY HELLO`; email `hello@ellison.photo` set at `clamp(2rem,7.5vw,6.5rem)` Cormorant italic as a mailto link with an SVG underline (see extras); below, small caps: `WELLINGTON · AOTEAROA — REPLIES WITHIN TWO DAYS`.

**Signature JS (hover preview + render + lightbox) — insert verbatim before Pattern A:**
```html
<script>
(function () {
  // Build index rows into any [data-index] container present in the file
  function rowHTML(p) {
    return '<a class="idx-row" data-nav data-slug="' + p.slug + '" href="#/work/' + p.slug + '">'
      + '<span class="idx-n">' + p.n + '</span><span class="idx-t">' + p.title + '</span>'
      + '<span class="idx-m">' + p.cat + ' · ' + p.year + '</span></a>';
  }
  document.querySelectorAll('[data-index]').forEach(function (el) {
    var only = el.getAttribute('data-index').split(',').filter(Boolean);
    var list = only.length ? window.PROJECTS.filter(function (p) { return only.indexOf(p.slug) > -1; }) : window.PROJECTS;
    el.innerHTML = list.map(rowHTML).join('');
  });
  // Floating preview (pointer devices only)
  var pv = document.createElement('figure');
  pv.className = 'idx-preview'; pv.innerHTML = '<img alt="">';
  document.body.appendChild(pv);
  var pvImg = pv.querySelector('img'), tx = 0, ty = 0, cx = 0, cy = 0, on = false, raf;
  function loop() { cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12; pv.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; raf = requestAnimationFrame(loop); }
  if (matchMedia('(pointer:fine)').matches) {
    document.addEventListener('mousemove', function (e) { tx = e.clientX + 24; ty = e.clientY - 120; });
    document.addEventListener('mouseover', function (e) {
      var row = e.target.closest('.idx-row');
      if (row) { var p = window.PROJECTS.find(function (x) { return x.slug === row.getAttribute('data-slug'); }); if (p) { pvImg.src = '../assets/img/' + p.imgs[0]; } if (!on) { on = true; pv.classList.add('on'); cx = tx; cy = ty; loop(); } }
      else if (on && !e.target.closest('.idx-preview')) { on = false; pv.classList.remove('on'); cancelAnimationFrame(raf); }
    });
  }
  // Project renderer
  window.__pageSetup = function (page, param, section) {
    document.body.classList.toggle('dark-view', page === 'work/:');
    if (page !== 'work/:') return;
    var i = window.PROJECTS.findIndex(function (p) { return p.slug === param; });
    if (i < 0) { i = 0; }
    var p = window.PROJECTS[i], prev = window.PROJECTS[(i + 7) % 8], next = window.PROJECTS[(i + 1) % 8];
    section.querySelector('[data-proj]').innerHTML =
      '<p class="kicker" data-anim>' + p.cat + ' — ' + p.year + '</p>'
      + '<h1 class="proj-title" data-anim>' + p.title + '</h1>'
      + '<p class="proj-note" data-anim>' + p.note + '</p>'
      + p.imgs.map(function (src, k) { return '<img class="proj-img" data-zoom="' + k + '" src="../assets/img/' + src + '" alt="' + p.title + ' — image ' + (k + 1) + '">'; }).join('')
      + '<nav class="proj-foot"><a data-nav href="#/work/' + prev.slug + '">← ' + prev.title + '</a>'
      + '<a data-nav href="#/work/' + next.slug + '">' + next.title + ' →</a></nav>';
    window.__curImgs = p.imgs;
  };
  // Lightbox
  var lb = document.createElement('dialog');
  lb.className = 'lightbox';
  lb.innerHTML = '<img alt=""><p class="lb-count"></p><button class="lb-x" aria-label="Close">×</button>';
  document.body.appendChild(lb);
  var lbi = 0;
  function lbShow() { lb.querySelector('img').src = '../assets/img/' + window.__curImgs[lbi]; lb.querySelector('.lb-count').textContent = (lbi + 1) + ' / ' + window.__curImgs.length; }
  document.addEventListener('click', function (e) {
    if (e.target.matches('.proj-img')) { lbi = +e.target.getAttribute('data-zoom'); lbShow(); lb.showModal(); }
    if (e.target.matches('.lb-x') || e.target === lb) lb.close();
  });
  document.addEventListener('keydown', function (e) {
    if (!lb.open || !window.__curImgs) return;
    if (e.key === 'ArrowRight') { lbi = (lbi + 1) % window.__curImgs.length; lbShow(); }
    if (e.key === 'ArrowLeft') { lbi = (lbi + window.__curImgs.length - 1) % window.__curImgs.length; lbShow(); }
  });
})();
</script>
```

**Required CSS for the components (write with the demo's tokens):**
```css
.idx-preview{position:fixed;top:0;left:0;width:min(300px,26vw);aspect-ratio:4/3;margin:0;pointer-events:none;z-index:60;opacity:0;transition:opacity .25s;overflow:hidden}
.idx-preview.on{opacity:1}
.idx-preview img{width:100%;height:100%;object-fit:cover}
.idx-row{display:grid;grid-template-columns:3.2rem 1fr auto;align-items:baseline;gap:1rem;padding:1.15rem 0;border-bottom:1px solid var(--line);text-decoration:none;color:inherit}
.idx-row .idx-t{font-family:var(--display);font-weight:300;font-size:clamp(1.9rem,4vw,2.9rem);line-height:1.05;transition:transform .3s,color .3s}
.idx-row:hover .idx-t,.idx-row:focus-visible .idx-t{transform:translateX(8px);color:var(--red)}
.lightbox{border:0;padding:0;background:rgba(10,10,10,.96);max-width:100vw;max-height:100vh;width:100vw;height:100vh}
.lightbox img{width:100%;height:calc(100% - 3rem);object-fit:contain}
.lightbox .lb-count{color:#c9c9c4;text-align:center;font:500 .8rem var(--ui);letter-spacing:.12em}
.lightbox .lb-x{position:absolute;top:1rem;right:1.2rem;font-size:2rem;background:none;border:0;color:#fff;cursor:pointer}
body.dark-view{background:var(--dark);color:var(--dark-soft)}
```

**Pattern B fills:** `{{ENTER_Y}}` = `22`.
`{{HERO_TIMELINE}}`:
```js
const h1 = $('.hero h1');
if (h1) {
  const chars = splitChars(h1);
  createTimeline({ defaults: { ease: 'outQuint' } })
    .add($$('.hero .kicker'), { opacity: [0, 1], translateY: [14, 0], duration: 500 })
    .add(chars, { opacity: [0, 1], translateY: ['0.35em', 0], duration: 700, delay: stagger(26) }, '-=250')
    .add($$('.hero .hero-cta'), { opacity: [0, 1], duration: 500 }, '-=300');
}
```
`{{SCROLL_MOMENT}}`: project images clip-reveal on scroll — after each `__pageSetup` render, `__pageEnter` also runs; extend it: images get `clipPath:['inset(0 0 14% 0)','inset(0 0 0% 0)']` + `translateY:[24,0]`, `duration:700`, `ease:'outQuad'`, triggered by an IntersectionObserver (threshold .2) registered in `{{DEMO_MOTION_EXTRAS}}` over `.proj-img` (observe after each render via a `MutationObserver` on `[data-proj]` or simply inside a patched `window.__pageEnter`).
`{{DEMO_MOTION_EXTRAS}}`: contact underline — inline `<svg class="u-line" viewBox="0 0 600 12" preserveAspectRatio="none"><path d="M2 8 C150 2, 450 12, 598 6" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>` under the email; on contact page enter: `animate(svg.createDrawable('.u-line path'), { draw: '0 1', duration: 900, ease: 'inOutQuad' })`.

- [ ] **Step 1:** Rewrite `templates/folio.html` per the spec above: head (kept meta + fonts), tokens/CSS, `<main>` with the five `data-page` sections and verbatim copy, PROJECTS + signature script, Pattern C, Pattern A, Pattern B (fills above), demo bar kept.
- [ ] **Step 2 (verify, Pattern V) —** assertions:
  - `location.href='...folio.html#/work'` then eval `document.querySelector('[data-page].is-active').getAttribute('data-page')` → `"work"`; `document.querySelectorAll('.idx-row').length` → `8`.
  - Deep link fresh load `folio.html#/work/moana` → eval `document.querySelector('.proj-title').textContent` → `"Mana Moana"`; `document.body.classList.contains('dark-view')` → `true`.
  - `history.back()` behaves (eval `location.hash` after `history.back()` → previous route).
  - Click first `.proj-img` → eval `document.querySelector('.lightbox').open` → `true`; Escape closes.
- [ ] **Step 3:** `git add templates/folio.html && git commit -m "feat(templates): rebuild folio as ELLISON multi-page index with hover preview + lightbox"`

---

## Task 2: Rebuild `templates/storefront.html` — North End Candle Co., "The Shop That Works"

**Files:** Rewrite: `templates/storefront.html` (same kept-lines rule as Task 1)

**Fonts (keep):** DM Serif Display (+italic); Public Sans 400/500/600.

**Tokens:**
```css
--ink:#221f1b; --ink-soft:#4a453e; --paper:#faf6ef; --paper-dim:#f1e9db; --line:rgba(34,31,27,.14);
--flame:#d96f32; --sage:#8a9b7d; --clay:#c07a52; --sea:#5d7d8a; --sand:#d9c7a7; --plum:#6d5468; --moss:#5f6f52;
--display:'DM Serif Display',Georgia,serif; --ui:'Public Sans',ui-sans-serif,sans-serif; --demo-bar-h:52px;
```

**PRODUCTS (inline script) — verbatim:**
```js
window.PRODUCTS = [
 { id:'harbour-smoke', name:'Harbour Smoke', price:42, field:'var(--clay)', fam:'warm',  notes:['Toitoi','Driftwood','Sea salt'],  story:'Poured for evenings when the westerly’s up and the windows stay shut.' },
 { id:'first-light',   name:'First Light',   price:38, field:'var(--sand)', fam:'fresh', notes:['Citrus peel','White tea','Dune grass'], story:'The 6am swim you keep promising yourself, in candle form.' },
 { id:'southerly',     name:'Southerly',     price:42, field:'var(--sea)',  fam:'fresh', notes:['Rain','Cold kelp','Flint'],        story:'A front rolling up the coast. Best burned under a blanket.' },
 { id:'bush-line',     name:'Bush Line',     price:40, field:'var(--moss)', fam:'green', notes:['Tarata','Crushed fern','Damp earth'], story:'The smell of the track ten minutes after the rain stops.' },
 { id:'late-shift',    name:'Late Shift',    price:44, field:'var(--plum)', fam:'warm',  notes:['Black fig','Tobacco leaf','Amber'],   story:'For the hours when the good ideas finally show up.' },
 { id:'garden-party',  name:'Garden Party',  price:38, field:'var(--sage)', fam:'green', notes:['Tomato vine','Basil','Cut stems'],    story:'Somebody else’s glasshouse, borrowed for an afternoon.' }
];
```
Every product: `burn: '45 hr — 260 g soy wax'` shown on product pages (same string for all).

**Product art (`.prod-art`) — flat editorial, NO gradients:** a color-field block `aspect-ratio:4/5; background:var(--field)` with a top wax-scallop: inline SVG `<svg viewBox="0 0 100 8" preserveAspectRatio="none"><path d="M0 8 Q6 0 12 6 T24 5 T36 7 T48 4 T60 6 T72 3 T84 6 T100 5 L100 0 L0 0 Z" fill="var(--paper)"/></svg>` positioned at top; centered label band (off-white `#fdfaf3`, 1px `--line` border) width 72%, containing product name in DM Serif italic ~1.5rem, `NORTH END` small caps above it (.62rem, ls .22em), notes joined with ` · ` below (.72rem small caps). Hover (cards): field `translateY(-4px)`, label `translateY(2px)` (CSS).

**Pages + copy (verbatim):**
- `home`: announcement marquee strip (see CSS below) text `FREE NZ SHIPPING OVER $60 — POURED IN PETONE — SMALL BATCH, BIG NOSE —` ×2 for the loop. Header: logo "North *End*" (End in italic flame), nav SHOP / STORY / STOCKISTS + cart button `🛒`-free: text `Cart` + `<span class="cart-n">0</span>`. Hero: left = bestseller `.prod-art` (harbour-smoke, large); right: kicker `BESTSELLER`, H1 `Harbour <em>Smoke</em>`, story line, price `$42 <span>NZD</span>`, `data-add="harbour-smoke"` button `Add to cart →`, link `data-nav href="#/product/harbour-smoke"` "Full notes →". Scent-notes strip (scroll moment): the three notes as huge DM Serif words. Below: `Six scents, one street.` + 3-up grid of products 2-4 (each `.prod-card` links to its product page) + `Shop all six →`.
- `shop`: H1 `The shelf.`; filter chips ALL / FRESH / WARM / GREEN (`data-fam` buttons, `aria-pressed`); grid of all six `.prod-card`s (art + name + price + `data-add` quick-add button). Filtering: hide non-matching via `.hide{display:none}`; count line `Showing 6 of 6` updates.
- `product/:`: rendered by `__pageSetup` into `[data-prod]`: breadcrumb `Shop / {name}`; left `.prod-art` large; right: H1 name, price, notes as ruled 3-row list (NOTES headline), story paragraph, burn line, qty stepper `− 1 +` + `Add to cart — $42`; under it small caps `FREE NZ SHIPPING OVER $60 · 30-DAY RELIGHT PROMISE`; then "Goes well with" 2-up (next two products in array order).
- `story`: H1 `Poured in Petone.`; copy: `North End started as one saucepan on a flat stove and a nose that wouldn’t quit. Six years on we pour every candle by hand in a workshop above the old butcher’s on Jackson Street.` + `Soy wax, cotton wicks, fragrance blended in-house. Nothing in the jar we couldn’t pronounce at the market stall where it all began.` + a full-width `--paper-dim` band with three facts: `6 SCENTS / 1 WORKSHOP / 0 SHORTCUTS` (counting animation).
- `stockists`: H1 `Around the region.`; intro `The candles travel further than we do. Find them here, or online with free shipping over $60.`; table-set list grouped by region — **Wellington:** Prefab Hall — Te Aro · Moore Wilson’s — Tory St · Unity Books — Willis St · Garage Project Cellar — Aro Valley; **Hutt Valley:** Comes & Goes — Petone · Dowse Museum Store — Lower Hutt · Stationery Base — High St; **Kāpiti:** Long Beach Trading — Paekākāriki · Tuatara Store — Paraparaumu; **Further afield:** Frank’s — Palmerston North · Zeal & Co — Whanganui · Good Thing — Nelson. Each row: name (DM Serif), suburb small caps right.

**Cart (signature) — insert verbatim:**
```html
<script>
(function () {
  var KEY = 'ne-cart';
  function get() { try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function set(c) { sessionStorage.setItem(KEY, JSON.stringify(c)); render(); }
  function find(id) { return window.PRODUCTS.find(function (p) { return p.id === id; }); }
  function count(c) { return Object.values(c).reduce(function (a, b) { return a + b; }, 0); }
  function fmt(n) { return '$' + n.toFixed(2); }
  var drawer = document.querySelector('.cart-drawer'), back = document.querySelector('.cart-back');
  function render() {
    var c = get(), n = count(c);
    document.querySelectorAll('.cart-n').forEach(function (el) { el.textContent = n; });
    var rows = Object.keys(c).map(function (id) {
      var p = find(id); if (!p) return '';
      return '<div class="cart-row" data-id="' + id + '"><span class="cr-swatch" style="background:' + p.field + '"></span>'
        + '<div><p class="cr-name">' + p.name + '</p><p class="cr-line">' + fmt(p.price) + ' × ' + c[id] + '</p></div>'
        + '<div class="cr-qty"><button data-dec aria-label="Remove one">−</button><span>' + c[id] + '</span><button data-inc aria-label="Add one">+</button></div>'
        + '<p class="cr-total">' + fmt(p.price * c[id]) + '</p></div>';
    }).join('');
    var sub = Object.keys(c).reduce(function (s, id) { var p = find(id); return s + (p ? p.price * c[id] : 0); }, 0);
    drawer.querySelector('.cart-body').innerHTML = n
      ? rows + '<div class="cart-sub"><span>Subtotal</span><strong>' + fmt(sub) + ' NZD</strong></div>'
        + '<p class="cart-ship">' + (sub >= 60 ? 'Free NZ shipping unlocked.' : fmt(60 - sub) + ' away from free NZ shipping.') + '</p>'
        + '<p class="cart-note">Checkout is switched off in this demo — your build connects here.</p>'
      : '<p class="cart-empty">Nothing in here yet. The shelf disagrees with that decision.</p>';
  }
  function open(o) { drawer.classList.toggle('open', o); back.classList.toggle('open', o); drawer.setAttribute('aria-hidden', String(!o)); }
  document.addEventListener('click', function (e) {
    var add = e.target.closest('[data-add]');
    if (add) { var c = get(), id = add.getAttribute('data-add'); var q = +(document.querySelector('.qty-n') && add.hasAttribute('data-useqty') ? document.querySelector('.qty-n').textContent : 1); c[id] = (c[id] || 0) + (q || 1); set(c); open(true); window.__cartPulse && window.__cartPulse(); }
    if (e.target.closest('.cart-open')) open(true);
    if (e.target.closest('.cart-close') || e.target === back) open(false);
    var row = e.target.closest('.cart-row');
    if (row) { var c2 = get(), id2 = row.getAttribute('data-id');
      if (e.target.closest('[data-inc]')) { c2[id2]++; set(c2); }
      if (e.target.closest('[data-dec]')) { c2[id2]--; if (c2[id2] <= 0) delete c2[id2]; set(c2); } }
    var st = e.target.closest('[data-stepper]');
    if (st) { var nEl = document.querySelector('.qty-n'), v = +nEl.textContent + (+st.getAttribute('data-stepper')); nEl.textContent = Math.max(1, Math.min(9, v)); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); });
  window.__cartRender = render; render();
})();
</script>
```
Drawer markup (in body, before scripts): `<div class="cart-back"></div><aside class="cart-drawer" aria-hidden="true" aria-label="Cart"><header><h2>Your cart</h2><button class="cart-close" aria-label="Close">×</button></header><div class="cart-body"></div></aside>`.
Drawer CSS: fixed right, `width:min(420px,92vw); inset:0 0 var(--demo-bar-h) auto; transform:translateX(103%); transition:transform .45s cubic-bezier(.22,.9,.24,1); background:var(--paper); border-left:1px solid var(--line); z-index:95`; `.open{transform:none}`; back = fixed scrim `rgba(34,31,27,.35)`, opacity-transitioned.
Filter JS (5 lines, in same script or its own): chips set `aria-pressed`, toggle `.hide` on `.prod-card[data-fam]`, update `Showing X of 6`.

**Marquee CSS:** `.mq{overflow:hidden;background:var(--ink);color:var(--paper)} .mq-in{display:inline-flex;gap:3rem;white-space:nowrap;padding:.55rem 0;animation:mq 26s linear infinite} @keyframes mq{to{transform:translateX(-50%)}} @media (prefers-reduced-motion:reduce){.mq-in{animation:none}}`

**Pattern B fills:** `{{ENTER_Y}}` = `16`.
`{{HERO_TIMELINE}}`: timeline — hero `.prod-art` `{ opacity:[0,1], translateY:[26,0], duration:650 }`, then H1 `{ opacity:[0,1], translateY:[18,0] }` `-=380`, then price+CTA stagger 70ms `-=320`.
`{{SCROLL_MOMENT}}`: IntersectionObserver on `.note-word` (the three big note words): `animate(el, { opacity:[0,1], translateY:[30,0], duration:600, ease:'outQuad', delay: i*110 })`.
`{{DEMO_MOTION_EXTRAS}}`: `window.__cartPulse = () => animate('.cart-btn', { scale: [1, 1.12, 1], duration: 420, ease: 'outBack' });` and story-page fact counters: on story enter, for each `[data-count]` run `animate({v:0},{v:+el.dataset.count, modifier:utils.round(0), onUpdate:...})` duration 900.

- [ ] **Step 1:** Rewrite `templates/storefront.html` per spec (head kept-lines, tokens, marquee, 5 pages verbatim copy, `.prod-art` recipe, PRODUCTS + cart + filter scripts, Pattern C, A, B, demo bar).
- [ ] **Step 2 (verify, Pattern V) —** assertions:
  - Fresh load home: `document.querySelectorAll('.mq-in').length >= 1` and zero console errors (fonts, CDN).
  - eval click `[data-add="harbour-smoke"]` twice → `document.querySelector('.cart-drawer .cart-sub strong').textContent` → `"$84.00 NZD"`; `.cart-n` → `"2"`; ship line → `"Free NZ shipping unlocked."`.
  - Deep link `storefront.html#/product/southerly` → `document.querySelector('[data-prod] h1').textContent` → `"Southerly"`.
  - Shop filter: click chip `[data-fam="green"]` → visible `.prod-card:not(.hide)` count → `2`; count line → `"Showing 2 of 6"`.
  - sessionStorage survives route change (add item, navigate `#/story`, back to `#/shop` → `.cart-n` still `"2"` — reuse the same tab).
- [ ] **Step 3:** `git add templates/storefront.html && git commit -m "feat(templates): rebuild storefront as working shop — cart drawer, product pages, filters"`

---

## Task 3: Elevate `templates/toolbelt.html` — Ridgeline Builders, "The Job Sheet"

**Files:** Rewrite: `templates/toolbelt.html` (keep head meta/fonts — Archivo — and demo bar; keep tokens charcoal/concrete/amber/red exactly as in current file)

**Blueprint layer (site-wide):** body bg `--charcoal` with drafting grid: `background-image:linear-gradient(rgba(236,234,230,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(236,234,230,.05) 1px,transparent 1px); background-size:56px 56px`. Dimension annotations: `.dim` component — a horizontal rule with end ticks and a small-caps mono label (`ui-monospace`), e.g. under the hero H1: `SITE: KĀPITI COAST — EST. 2012 — LBP LICENSED`. Hazard tape divider `.tape` between sections (current diagonal-stripe pattern kept, given a slow CSS `background-position` crawl, 14s linear infinite, reduced-motion off).

**Pages + copy (verbatim):**
- `home`: keep current hero copy ("BUILT RIGHT. BUILT ONCE.", the lede, both CTAs — CTAs become `data-nav` links to `#/quote` and phone link stays `tel:0275550148`). Add `.dim` annotation + stats strip: `127 <span>JOBS SIGNED OFF</span> · 14 <span>YEARS ON THE TOOLS</span> · 5.0 <span>GOOGLE RATING</span>` (numbers get `data-count`). Below: 3 featured services (rows, not cards) + `Full rate card →` (`#/services`); one featured job teaser linking `#/jobs`.
- `services` — rate card: H1 `THE RATE CARD.`; intro `Straight numbers, before we’ve even met. Final quote on site, always in writing.`; 6 ruled rows (service / includes line / rate right-aligned in mono): `New builds — architectural or group, foundations to handover — from $3,400/m²` · `Renovations — kitchens, bathrooms, knock-throughs — from $48,000` · `Reclads — weathertight remediation, all claddings — from $180,000` · `Decks & pergolas — kwila, vitex or pine, consent handled — from $14,000` · `Fences & retaining — boundary, pool, keystone — from $260/m` · `Insurance & repairs — EQC scopes, make-safes, reinstatement — quoted on scope`. Footer line: `GST included. Site visit within 5 working days.`
- `jobs`: H1 `RECENT JOBS.`; 3 job entries, each: title + meta + **before/after slider** + scope line:
  1. `SEATOUN RECLAD` — `10 months · weathertight remediation` — `Full recloak in vertical cedar over cavity, new joinery throughout. The leaks stopped; the value didn’t.`
  2. `ARO VALLEY VILLA EXTENSION` — `6 months · heritage street` — `Four metres out the back without losing the villa’s face. Council said yes first time.`
  3. `RAUMATI DECK & PERGOLA` — `3 weeks · kwila + louvres` — `Sixty square metres of afternoon sun, engineered for the northerly.`
- `reviews`: H1 `WORD GETS AROUND.`; rating strip `5.0 ★★★★★ — 41 GOOGLE REVIEWS`; 3 pull quotes (Archivo 600, large): `“Quoted on Tuesday, started when they said they would, finished under it.” — MELE T, TAWA` · `“Our third build with Ridgeline. There won’t be a fourth builder.” — CRAIG & JO M, WAIKANAE` · `“The site was cleaner than my kitchen every single Friday.” — PRIYA S, KELBURN`.
- `quote` — the docket: H1 `GET A QUOTE.`; form styled as a job sheet (mono labels, amber rules, docket number top-right `DOCKET #2026-041`): fields Name*, Phone*, Suburb, Job type (select: New build / Renovation / Reclad / Deck or fence / Repair), Timeframe (radios: ASAP / 1–3 months / This year / Just pricing), The job* (textarea). Validation on submit: required empties get `.err` (2px `--red` outline) + inline message `Required — we can’t quote a blank.`; valid submit hides form, shows success panel: big amber stamp-style block rotated -3°: `DOCKET LODGED` + `We call you within one working day. Keep the phone handy.` (No network call.)

**Before/after slider (signature) — the two states are inline SVGs of the same house, plan vs built. Insert once per job (unique ids `ba1/ba2/ba3`):**

Markup per job:
```html
<div class="ba" id="ba1">
  <div class="ba-after"><!-- BUILT SVG --></div>
  <div class="ba-before"><!-- PLAN SVG --></div>
  <div class="ba-handle" aria-hidden="true"></div>
  <input class="ba-range" type="range" min="0" max="100" value="50" aria-label="Drag between plan and built">
  <span class="ba-tag ba-tag-l">THE PLAN</span><span class="ba-tag ba-tag-r">THE BUILD</span>
</div>
```
House SVG (use for both layers; PLAN version: `fill:none; stroke:var(--amber); stroke-width:1.5; stroke-dasharray:5 4` on every shape + grid rect; BUILT version: shapes filled — walls `var(--concrete)`, roof `var(--amber)`, windows `var(--charcoal)`, no dash):
```html
<svg viewBox="0 0 640 360" preserveAspectRatio="xMidYMid meet" role="img" aria-label="House elevation">
  <rect x="80" y="150" width="300" height="160" /><!-- main walls -->
  <polygon points="80,150 230,60 380,150" /><!-- roof -->
  <rect x="380" y="190" width="180" height="120" /><!-- extension -->
  <rect x="120" y="200" width="60" height="60" /><rect x="220" y="200" width="60" height="60" /><!-- windows -->
  <rect x="310" y="220" width="44" height="90" /><!-- door -->
  <rect x="420" y="220" width="50" height="50" /><rect x="490" y="220" width="50" height="50" /><!-- ext windows -->
  <line x1="40" y1="310" x2="600" y2="310" /><!-- ground -->
</svg>
```
JS (once, handles all `.ba`):
```html
<script>
(function () {
  document.querySelectorAll('.ba').forEach(function (ba) {
    var r = ba.querySelector('.ba-range'), before = ba.querySelector('.ba-before'), h = ba.querySelector('.ba-handle');
    function set(v) { before.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)'; h.style.left = v + '%'; }
    r.addEventListener('input', function () { set(+r.value); });
    set(50);
  });
})();
</script>
```
CSS: `.ba{position:relative;aspect-ratio:16/9;border:1px solid var(--line);overflow:hidden}` layers absolute inset 0; `.ba-range{position:absolute;inset:0;opacity:0;cursor:ew-resize;width:100%;height:100%}` (keyboard: arrows work natively); `.ba-handle{position:absolute;top:0;bottom:0;width:2px;background:var(--amber);pointer-events:none}` with a small ◆ marker mid-height; `.ba-tag` mono small caps corners.

**Pattern B fills:** `{{ENTER_Y}}` = `24`.
`{{HERO_TIMELINE}}`: H1 lines wrapped in `.hl` spans → `animate($$('.hero .hl'), { translateY: ['110%', '0%'], duration: 700, ease: 'outQuint', delay: stagger(110) })` inside overflow-hidden line wrappers; then `.dim` rule `scaleX:[0,1]` origin left 500ms; lede+CTAs opacity stagger.
`{{SCROLL_MOMENT}}`: stats `[data-count]` count up on first view: IO → `animate({v:0},{ v:+el.dataset.count, duration:1100, ease:'outExpo', modifier:utils.round(0), onUpdate:(a)=>el.firstChild.textContent=... })` — 5.0 keeps one decimal: if `el.dataset.count` contains `.`, use `utils.round(1)`.
`{{DEMO_MOTION_EXTRAS}}`: none.

- [ ] **Step 1:** Rewrite `templates/toolbelt.html` per spec (5 pages, blueprint layer, sliders ×3, docket form + validation, Patterns C/A/B).
- [ ] **Step 2 (verify, Pattern V):** assertions: `#/services` rows count 6; slider: eval set `ba1`'s range to `10`, expect `document.querySelector('#ba1 .ba-before').style.clipPath` → `"inset(0 90% 0 0)"`; quote form: submit empty → `document.querySelectorAll('#quote-form .err').length >= 3`; fill Name/Phone/The job + submit → success panel visible, form hidden.
- [ ] **Step 3:** `git add templates/toolbelt.html && git commit -m "feat(templates): toolbelt job-sheet rebuild — rate card, plan/built sliders, docket quote form"`

---

## Task 4: Elevate `templates/counter.html` — Little Harbour Café, "The Daily Menu"

**Files:** Rewrite: `templates/counter.html` (keep head/fonts — Fraunces + Nunito Sans — tokens cream/espresso/terracotta/sage, demo bar)

**Pages + copy (verbatim):**
- `home`: centered masthead kept (logo `Little Harbour Café`, `Petone, since 2019`) + **live status chip** (see JS): e.g. `● Open now — closes 3:00pm`. Nav: MENU / STORY / GALLERY / FIND US. Hero: `Good mornings <em>live here.</em>` + `A small harbourside café doing proper flat whites, honest kai and the occasional custard square miracle.` + photo `gal-cafe-doc.jpg` + CTA `See the menu →` (`#/menu`). Steam SVG (3 wavy paths) above masthead, draw-on at load. Below: today's hours line + 3 cabinet picks teaser.
- `menu` — the print piece: kicker `SUMMER — PRINTED WEEKLY`; H1 `The menu.`; two columns desktop (`columns:2; column-gap:4rem`), groups with Fraunces italic headers and dotted leaders (`.mi{display:flex} .mi-dots{flex:1;border-bottom:2px dotted var(--line);margin:0 .5rem .35rem}`):
  **Morning — til 11:** Crumpets, whipped butter, mānuka honey — 12 · Bircher, poached apricot — 14 (v) · Creamed corn on toast, chilli crunch — 16 (v) · Kedgeree, soft egg — 22 · The Fry — bacon, eggs, hash, relish — 24
  **All day:** Fish sandwich, tartare, pickles — 19 · Miso mushrooms on sourdough — 18 (v) · Lamb shoulder roll, mint slaw — 21 · Kūmara & feta fritters — 18 (gf) · Market fish, brown butter, greens — 28 (gf)
  **Cabinet:** Cheese scone — 7 · Louise slice — 6 · Afghan — 6 · Custard square — 7
  **Coffee — Supreme, Coffee Supreme:** Espresso — 4.5 · Flat white — 5.5 · Batch filter — 5 · Mocha — 6 · Iced long black — 6.5 · Hot chocolate — 5.5
  Footer: `Menu changes with the season — this one’s summer’s. Dietaries welcome, yell out.`
- `story`: H1 `A café built around the neighbourhood.` + `We opened with four tables, a secondhand Linea and a theory: if the coffee’s right and the welcome’s real, Petone would do the rest. It did.` + `The fish comes off the wharf, the veges from the Saturday market, and half the art on the walls is by regulars under ten.` + photo `gal-joy-florals.jpg`.
- `gallery` — film strip: horizontal `scroll-snap-type:x mandatory` strip of 5 (`gal-cafe-doc.jpg`, `gal-joy-florals.jpg`, `gal-brick-walker.jpg`, `gal-ferry-teal.jpg`, `gal-pasifika.jpg`), each with a handwritten-style caption (Fraunces italic): `the regulars` · `tuesday’s flowers` · `jackson street` · `the commute` · `festival weekend`. Edges fade via mask-image.
- `find-us`: giant status: `OPEN` / `CLOSED` in Fraunces at `clamp(4rem,14vw,10rem)` (color: sage when open, terracotta when closed) + status sentence; hours table (rows below, `[data-dow]` for highlight-today); address block `2 Beach Street, Petone — Lower Hutt` + `Walk in — no bookings under six. Dogs outside, sorry team.`

**Hours logic (signature) — verbatim:**
```html
<script>
(function () {
  var HOURS = [null,[7,15],[7,15],[7,15],[7,15],[7,15],[8,14],[8,14]]; // index 1=Mon..7=Sun; [open,close] 24h
  function nowNZ() {
    var p = new Intl.DateTimeFormat('en-NZ', { timeZone: 'Pacific/Auckland', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    var g = {}; p.forEach(function (x) { g[x.type] = x.value; });
    var dowMap = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:7 };
    return { dow: dowMap[g.weekday], mins: (+g.hour) * 60 + (+g.minute) };
  }
  function fmt(h) { var ap = h >= 12 ? 'pm' : 'am'; var hh = h % 12 || 12; return hh + ':00' + ap; }
  window.__cafeStatus = function (t) {
    t = t || nowNZ();
    var today = HOURS[t.dow];
    if (today && t.mins >= today[0] * 60 && t.mins < today[1] * 60) return { open: true, label: 'Open now — closes ' + fmt(today[1]) };
    var d = t.dow, add = 0;
    while (add < 8) { add++; d = d % 7 + 1; if (HOURS[d]) break; }
    var when = (add === 1 && t.mins < HOURS[t.dow === 7 ? 1 : t.dow][0] * 60 && HOURS[t.dow] && t.mins < HOURS[t.dow][0] * 60) ? 'today' : (add === 1 ? 'tomorrow' : 'on ' + ['','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][d]);
    if (HOURS[t.dow] && t.mins < HOURS[t.dow][0] * 60) { return { open: false, label: 'Closed — opens ' + fmt(HOURS[t.dow][0]) + ' today' }; }
    return { open: false, label: 'Closed — opens ' + fmt(HOURS[d][0]) + ' ' + when };
  };
  function paint() {
    var s = window.__cafeStatus();
    document.querySelectorAll('[data-status]').forEach(function (el) {
      el.classList.toggle('is-open', s.open);
      var dot = el.querySelector('.st-dot'), txt = el.querySelector('.st-txt');
      if (txt) txt.textContent = s.label; else el.textContent = s.label;
    });
    var big = document.querySelector('[data-status-big]');
    if (big) { big.textContent = s.open ? 'OPEN' : 'CLOSED'; big.classList.toggle('is-open', s.open); }
    var t = nowNZ(); document.querySelectorAll('[data-dow]').forEach(function (r) { r.classList.toggle('today', +r.getAttribute('data-dow') === t.dow); });
  }
  paint(); setInterval(paint, 60000);
})();
</script>
```

**Pattern B fills:** `{{ENTER_Y}}` = `14`.
`{{HERO_TIMELINE}}`: masthead logo `{opacity:[0,1], translateY:[10,0]}` → steam draw `animate(svg.createDrawable('.steam path'), { draw: '0 1', duration: 1100, ease: 'inOutQuad', delay: stagger(140) })` overlapped `-=300` → status chip pop `{opacity:[0,1], scale:[.92,1], ease:'outBack'}`.
`{{SCROLL_MOMENT}}`: menu items cascade on menu page enter is covered by `__pageEnter` (`data-anim` on `.mi` rows, works with 55ms stagger); gallery strip images get IO fade-slide from `x:24`.
`{{DEMO_MOTION_EXTRAS}}`: active-nav underline: CSS `a[data-nav][aria-current="page"]{border-bottom:2px solid var(--terracotta)}` (no JS needed — router sets it).

- [ ] **Step 1:** Rewrite `templates/counter.html` per spec (5 pages, hours script, steam SVG inline, Patterns C/A/B).
- [ ] **Step 2 (verify, Pattern V):** assertions: `window.__cafeStatus({dow:2, mins:600})` → `{open:true, label:"Open now — closes 3:00pm"}`; `window.__cafeStatus({dow:6, mins:900})` → label `"Closed — opens 8:00am on Sunday"`... run exactly: `JSON.stringify(window.__cafeStatus({dow:2,mins:600}))` → `{"open":true,"label":"Open now — closes 3:00pm"}` and `JSON.stringify(window.__cafeStatus({dow:2,mins:300}))` → `{"open":false,"label":"Closed — opens 7:00am today"}`; menu page `.mi` count → `20`; gallery `scroll-snap` computed on strip → `"x mandatory"`.
- [ ] **Step 3:** `git add templates/counter.html && git commit -m "feat(templates): counter daily-menu rebuild — print menu page, live NZ open/closed status"`

---

## Task 5: Elevate `templates/ledger.html` — Cove & Co., "The Annual Report"

**Files:** Rewrite: `templates/ledger.html` (keep head/fonts + paper/navy/gold tokens — reuse the file's existing gold token name; keep demo bar)

**Report grammar (site-wide):** double thin rules (`border-top:3px double var(--line-strong)`) between sections; every page H1 preceded by numeral kicker (`01 — SERVICES` mono small caps gold); desktop-only marginalia column (`.margin-note`, 11rem wide, small italic serif notes) beside key blocks; tabular numerals everywhere (`font-variant-numeric: tabular-nums`).

**Pages + copy (verbatim):**
- `home`: keep hero copy (`Numbers, handled. Decisions, clearer.` + lede + CTAs → `Book a consult` = `#/contact`, `See what we do` = `#/services`). Keep At-a-glance card. Add **figures strip** (counting): `1,100+ <span>RETURNS FILED</span> · $38m <span>CLIENT TURNOVER MANAGED</span> · 9 <span>PEOPLE, ONE OFFICE</span>` (`data-count` values 1100 / 38 / 9 with prefix/suffix spans). Margin note beside hero: `Established 2011. Xero certified since the beginning.`
- `services` — tariff card: kicker `01 — SERVICES`; H1 `The tariff.`; intro `Fixed where it can be fixed, hourly where honesty requires it.`; ruled table rows (service / includes / rate right, mono): `Annual accounts & tax — financials, IR filing, one planning session — from $1,800/yr` · `Monthly Xero care — reconciliation, reporting, quiet compliance — from $240/mo` · `GST returns — prepared, checked, filed — from $95/return` · `Payroll — up to 10 staff, payday filing included — from $60/run` · `Advisory — forecasting, pricing, the hard conversations — $220/hr` · `New entity setup — company, IRD, Xero, done properly — $950 one-off`. Footer: `All prices exclude GST — of course they do.`
- `approach`: kicker `02 — APPROACH`; H1 `Four moves, every year.`; numbered process rows 01–04, each rule draws in on scroll: `01 TIDY — We take the shoebox. Bank feeds, receipts, the lot — reconciled monthly, not annually in a panic.` · `02 FILE — Returns lodged early, never late. IR letters stop being scary when they stop arriving.` · `03 READ — A one-page monthly note in plain English: what moved, why, and what it means for cash.` · `04 STEER — Quarterly sit-down. Pricing, hiring, that machine you’re eyeing — decided with numbers, not vibes.`
- `people`: kicker `03 — PEOPLE`; H1 `Nine of us. No juniors on your file.`; 3 partner plates — navy rectangle, gold serif initials monogram (no photos): `RC — Rewa Cove, CA — Managing partner. Twenty years of small-business books; still answers her own phone.` · `TM — Tom Mercer, CA — Tax. Reads IRD determinations for fun. Someone has to.` · `AK — Amara Khan — Advisory. Ex-CFO. Allergic to dashboards nobody opens.` Below: `+ six more who keep the reconciliations humming.`
- `contact`: kicker `04 — CONTACT`; H1 `Start with the estimator.`; **fee estimator** (below) then booking block: `Level 2, 15 Customhouse Quay, Wellington` · `04 555 0173 · office@coveandco.nz` · button `Book a consult` (mailto) + line `First hour free. Bring the shoebox, we’ve seen worse.`

**Fee estimator (signature) — verbatim:**
```html
<script>
(function () {
  var BASE = { s: 1800, m: 3200, l: 6500 };
  var ADD = { xero: 2880, gst: 380, payroll: 1560, advisory: 2640 };
  var f = document.getElementById('estimator');
  if (!f) return;
  var out = f.querySelector('.est-out'), last = 0;
  function calc() {
    var t = BASE[f.querySelector('[name="band"]').value] || 0;
    f.querySelectorAll('[name="addon"]:checked').forEach(function (c) { t += ADD[c.value]; });
    var hi = Math.round(t * 1.25 / 50) * 50;
    out.setAttribute('data-lo', t); out.setAttribute('data-hi', hi);
    var text = 'Indicative: $' + t.toLocaleString('en-NZ') + ' – $' + hi.toLocaleString('en-NZ') + ' / yr';
    if (window.__estFlip && t !== last) window.__estFlip(out, text); else out.textContent = text;
    last = t;
  }
  f.addEventListener('change', calc); calc();
})();
</script>
```
Markup: `<form id="estimator">` — band select (`s` = `Under $250k turnover`, `m` = `$250k – $1m`, `l` = `$1m – $5m`), 4 addon checkboxes labelled `Monthly Xero care` / `GST returns` / `Payroll` / `Advisory retainer`, output `<p class="est-out" aria-live="polite"></p>`, disclaimer `Indicative only — the real number needs a real conversation.`

**Fix (bug):** the header CTA (`.nav-cta` or equivalent navy button) currently renders label-invisible. Set its color explicitly to the paper token and verify: eval `getComputedStyle(document.querySelector('.nav-cta')).color !== getComputedStyle(document.querySelector('.nav-cta')).backgroundColor` → `true`, and visually confirm the label reads `Book a consult`.

**Pattern B fills:** `{{ENTER_Y}}` = `16`.
`{{HERO_TIMELINE}}`: hero H1 lines (3 `.hl` spans) `{ translateY:['105%','0%'], duration:650, ease:'outQuint', delay: stagger(90) }` in overflow-hidden wrappers; at-a-glance card `{opacity:[0,1], translateX:[24,0]}` `-=350`.
`{{SCROLL_MOMENT}}`: figures `[data-count]` count-up (same recipe as toolbelt; `38` renders `$38m` via prefix/suffix spans); approach rules `scaleX:[0,1]` on IO.
`{{DEMO_MOTION_EXTRAS}}`: `window.__estFlip = (el, text) => { animate(el, { opacity:[1,0], translateY:[0,-8], duration:140, ease:'inQuad', onComplete: () => { el.textContent = text; animate(el, { opacity:[0,1], translateY:[8,0], duration:200, ease:'outQuad' }); } }); };`

- [ ] **Step 1:** Rewrite `templates/ledger.html` per spec (5 pages, estimator, plates, figures, CTA fix, Patterns C/A/B).
- [ ] **Step 2 (verify, Pattern V):** assertions: estimator — eval set band=`m`, check `xero`+`gst`, dispatch `change` → `document.querySelector('.est-out').getAttribute('data-lo')` → `"6460"`, `data-hi` → `"8075"`... **CHECK:** 3200+2880+380 = 6460; 6460×1.25 = 8075; 8075/50 = 161.5 → round = 162 → ×50 = **8100**. Expected `data-hi` → `"8100"`, text `Indicative: $6,460 – $8,100 / yr`. Nav CTA contrast eval → `true`. Tariff rows → `6`.
- [ ] **Step 3:** `git add templates/ledger.html && git commit -m "feat(templates): ledger annual-report rebuild — tariff card, fee estimator, partner plates, CTA fix"`

---

## Task 6: Elevate `templates/commons.html` — Harbourside Community Trust, "The Noticeboard"

**Files:** Rewrite: `templates/commons.html` (keep head/fonts + earth/green/yellow tokens from current file; keep demo bar; keep hero photo `gal-pasifika.jpg` + headline `Everyone eats. Everyone belongs.` + lede verbatim from current file)

**Noticeboard grammar:** content cards are pinned notices: paper tones cycling `#fffdf8` / `#fbf6ea` / `#f3ead6`, `border:1px solid rgba(42,38,32,.12)`, `box-shadow:0 10px 24px rgba(42,38,32,.10)`, each with `--tilt` custom property (values -1.2deg, .8deg, -0.6deg, 1.4deg cycling) applied `transform:rotate(var(--tilt))`, and a tape strip pseudo-element (`::before`, 88px × 26px, `background:rgba(233,214,160,.55)`, centered top, `rotate(-2deg)`).

**Pages + copy (verbatim):**
- `home`: keep current hero (photo, H1, lede, Volunteer + Donate buttons → `#/volunteer`, `#/donate`); hero photo gets slow parallax drift. Below: `This week on the board` — 3 notice cards (Kai Night Tuesday, Homework Club, Repair Café — pulled copy from programmes below) + `The whole board →` (`#/programmes`); impact strip: `48,000 <span>MEALS SHARED</span> · 130 <span>TAMARIKI IN HOMEWORK CLUB</span> · 12 <span>YEARS ON THE HARBOUR</span>` (counting).
- `programmes`: H1 `The board.`; 4 notices, each with WHEN / WHERE / BRING meta rows (mono small caps): `KAI NIGHTS — Shared dinner, no questions at the door. WHEN: Tuesday & Thursday, 5:30pm · WHERE: The hall, 4 Marine Parade · BRING: Nothing but whoever’s hungry` · `HOMEWORK CLUB — Years 4–10, tutors who remember being stuck. WHEN: Mon–Wed, 3:30–5pm · WHERE: The back room · BRING: The homework, we’ve got the snacks` · `TE REO FOR BEGINNERS — Kanohi ki te kanohi, ka pai to start wherever you are. WHEN: Thursday, 7pm · WHERE: The hall · BRING: A notebook and a bit of nerve` · `REPAIR CAFÉ — Toasters, trousers, bikes — fixed together, free. WHEN: First Saturday monthly, 10am–1pm · WHERE: The carpark (fine weather) · BRING: The broken thing`.
- `events` — the working filter (signature): H1 `Coming up.`; filter chips `ALL / KAI / WHĀNAU / LEARNING / FUNDRAISER` (`aria-pressed`); count line `Showing 8 of 8`; 8 event rows (date plate + name + type tag): `TUE 14 JUL — Kai Night — kai` · `SAT 18 JUL — Matariki Whānau Day — whānau` · `THU 23 JUL — Te Reo — new intake pōwhiri — learning` · `SAT 1 AUG — Repair Café — whānau` · `TUE 4 AUG — Kai Night — 400th dinner! — kai` · `SAT 8 AUG — Quiz Night at the Workingmen’s Club — fundraiser` · `WED 12 AUG — Homework Club showcase — learning` · `SUN 30 AUG — Harbour Clean-up + sausage sizzle — whānau`. Filter JS: identical pattern to storefront's (chips toggle `.hide` on `[data-type]` rows, update count line `Showing X of 8`).
- `volunteer`: H1 `Lend a hand.`; lede `Two hours a week keeps the board full. No CV required — just turn up as yourself.`; form: Name*, Email*, `I can help with` checkboxes (Cooking & kai / Tutoring / Driving & pickups / Fixing things / Events & setup), Availability (radios: Weekdays / Evenings / Weekends); same validation pattern as toolbelt docket (`.err` outlines + `Required` messages); success panel: `Nau mai, haere mai — we’ll be in touch within the week.` on a notice card with tape.
- `donate`: H1 `Keep the pot full.`; impact lines as big ruled rows: `$25 — feeds a family at kai night` · `$60 — a term of homework club snacks for one kid` · `$250 — one whole Tuesday, sorted`; then bank block (mono, on a notice card): `Harbourside Community Trust · 02-0500-0345678-00 · Ref: KOHA` + `Registered charity CC-58214. Receipts for anything over $5 — email us.` No fake payment form.

**Pattern B fills:** `{{ENTER_Y}}` = `18`.
`{{HERO_TIMELINE}}`: H1 `{opacity:[0,1], translateY:[20,0], duration:600}` then buttons stagger; notices on any page enter animate via `__pageEnter` PLUS settle: override — in `__pageEnter`, elements with `.notice` class animate `rotate: [0, 'var(--tilt)']` … anime can't read the CSS var target; instead give each notice `data-tilt="-1.2"` and animate `{ rotate: [0, el.dataset.tilt + 'deg'], translateY: [18, 0], opacity: [0, 1], duration: 620, ease: 'outQuint', delay: stagger(80) }` (custom `__pageEnter` for this demo replaces the generic one for `.notice` elements; other `[data-anim]` use the generic path).
`{{SCROLL_MOMENT}}`: home hero photo parallax: `onScroll`-free manual — IO not right for continuous; use `addEventListener('scroll', ...)` setting `img.style.transform = 'translateY(' + (window.scrollY * -0.06) + 'px)'` capped ±28px, `requestAnimationFrame`-throttled, skipped when `REDUCED()`.
`{{DEMO_MOTION_EXTRAS}}`: impact `[data-count]` counters (same recipe as toolbelt).

- [ ] **Step 1:** Rewrite `templates/commons.html` per spec (5 pages, notices, filters, volunteer validation, Patterns C/A/B).
- [ ] **Step 2 (verify, Pattern V):** assertions: events filter — click `[data-fam-chip="kai"]`-equivalent chip → visible rows `2`, count line `"Showing 2 of 8"`; volunteer submit empty → `.err` count `2` (name+email); notices have distinct tilts: eval collect `[data-tilt]` values on programmes → `["-1.2",".8","-0.6","1.4"]`.
- [ ] **Step 3:** `git add templates/commons.html && git commit -m "feat(templates): commons noticeboard rebuild — pinned notices, filtered events, volunteer flow"`

---

## Task 7: Elevate `templates/programme.html` — GATHER 27, "The Lineup Drop"

**Files:** Rewrite: `templates/programme.html` (keep head/fonts + near-black/violet/ink tokens and the existing acid accent token name from current file; keep demo bar; keep hero device: giant GATHER + 2027 with acid underline bar)

**Pages + copy (verbatim):**
- `home`: keep marquee-scale hero (`GATHER` / `2027`, `13–14 MARCH 2027 · SHED 6 · WELLINGTON · AOTEAROA NEW ZEALAND`, `REGISTRATION OPEN` chip). Add: **countdown tiles** (DAYS / HRS / MIN / SEC) under the date line; marquee strip `GATHER/27 — LEADERSHIP · CULTURE · CRAFT — TWO DAYS ON THE HARBOUR — ` (same `.mq` recipe as storefront, acid text on black); headliner block: `FIRST NAMES OUT` + 4 names at `clamp(2.2rem,6vw,4.5rem)` (from speakers list: TROY BAKER-HŌNE, DR MIN-JU PAE, ELENA VASKE, SAM ULUAVE) + `Full lineup →`.
- `speakers` — typographic grid (signature #2): H1 `THE LINEUP.`; 12 speaker blocks, name huge, on hover/focus the name slides up revealing topic+org (overflow-hidden flip, CSS `:hover/:focus-within` transform — no images): `TROY BAKER-HŌNE — Kaupapa-led teams / Tū Kaha Collective` · `DR MIN-JU PAE — The craft of saying no / Auckland Design Lab` · `ELENA VASKE — Shipping culture, not features / Norda` · `SAM ULUAVE — Leading from the second chair / Pacific Futures` · `RUBY THORNE — Critique without casualties / Independent` · `MATIU KAHU — Te ao Māori in modern practice / Toi Studios` · `GRETA LINDQVIST — Slow decisions, fast teams / Fjordwork` · `DEV RAGHAVAN — The apprenticeship revival / Makers Guild NZ` · `LOU BARRETT — Burnout is a design flaw / The Well Studio` · `HANA TE RIRE — Language as leadership / Reo Rua` · `OSCAR PLUME — Craft under constraint / Plume & Co` · `AIMEE SONG-PARKER — Culture debt compounds too / Southerly Ventures`.
- `timetable` — the working grid (signature #1): H1 `TWO DAYS.`; day tabs `DAY 1 — FRI 13` / `DAY 2 — SAT 14` (`aria-pressed`); two stage columns (`MAIN HALL` / `WORKSHOP ROOM`), 5 slots each. Rows: time (mono acid chip) + title + speaker. **Data verbatim:**
  DAY1 MAIN: `09:00 Pōwhiri & opening — Mana whenua + hosts` · `10:00 Kaupapa-led teams — Troy Baker-Hōne` · `11:30 Shipping culture, not features — Elena Vaske` · `14:00 Burnout is a design flaw — Lou Barrett` · `16:00 Panel: The next apprenticeships — Raghavan, Kahu, Thorne`;
  DAY1 WORKSHOP: `10:00 Critique clinic (bring work) — Ruby Thorne` · `11:30 Saying no, kindly — Dr Min-Ju Pae` · `13:30 Reo for the workplace — Hana Te Rire` · `15:00 Decision journals — Greta Lindqvist` · `16:30 Open studio — All workshop leads`;
  DAY2 MAIN: `09:30 Leading from the second chair — Sam Uluave` · `11:00 Te ao Māori in modern practice — Matiu Kahu` · `13:30 Culture debt compounds too — Aimee Song-Parker` · `15:30 Craft under constraint — Oscar Plume` · `17:00 Closing + waiata — Everyone`;
  DAY2 WORKSHOP: `10:00 Pricing your craft — Oscar Plume` · `11:30 Slow decisions, fast teams — Greta Lindqvist` · `13:30 Apprenticeship blueprints — Dev Raghavan` · `15:00 Team rituals that stick — Elena Vaske` · `16:00 Ask a leader anything — Uluave + Barrett`.
  Data as JS array `window.TT = [{day:1, stage:'MAIN HALL', time:'09:00', title:'Pōwhiri & opening', who:'Mana whenua + hosts'}, ...]` (all 20); render function fills the two columns for the active day; tab switch re-renders + `__pageEnter(section)` for the cascade. Mobile: columns stack, stage name as sticky sub-header.
- `tickets`: H1 `GET IN.`; 3 tier cards (border, not filled; acid rules): `EARLY BIRD — $349 — <s>Gone in 48 hours</s> SOLD OUT` (struck, `aria-disabled`) · `STANDARD — $449 — Both days, kai included, workshop access first-come` + button `Register →` (mailto `tickets@gather27.nz?subject=Standard%20registration`) · `STUDIO TABLE — $1,990 — Five seats, front rows, a table that’s yours for two days` + button `Register →` (same mailto, Studio subject). Footer: `Prices NZD incl. GST. Scholarships: five seats held every year — just ask.`

**Countdown (signature) — verbatim:**
```html
<script>
(function () {
  var T = Date.UTC(2027, 2, 12, 20, 0, 0); // 2027-03-13 09:00 NZDT = 03-12 20:00 UTC
  function tick() {
    var d = T - Date.now();
    var el = document.querySelector('.cd');
    if (!el) return;
    if (d <= 0) { el.innerHTML = '<p class="cd-done">DOORS ARE OPEN.</p>'; return; }
    var s = Math.floor(d / 1000), out = [['DAYS', Math.floor(s / 86400)], ['HRS', Math.floor(s / 3600) % 24], ['MIN', Math.floor(s / 60) % 60], ['SEC', s % 60]];
    out.forEach(function (p) {
      var cell = el.querySelector('[data-cd="' + p[0] + '"] .cd-n');
      var v = String(p[1]).padStart(2, '0');
      if (cell && cell.textContent !== v) { cell.textContent = v; if (window.__cdFlip) window.__cdFlip(cell); }
    });
  }
  tick(); setInterval(tick, 1000);
})();
</script>
```
Markup: `.cd` with 4 tiles `<div class="cd-t" data-cd="DAYS"><span class="cd-n">00</span><span class="cd-l">DAYS</span></div>` etc. Tiles: 1px acid border, mono numerals `clamp(1.6rem,4vw,2.6rem)`.

**Pattern B fills:** `{{ENTER_Y}}` = `26`.
`{{HERO_TIMELINE}}`: `GATHER` and `2027` each wrapped in overflow-hidden; `{ translateY: ['100%', '0%'], duration: 850, ease: 'outExpo', delay: stagger(140) }`; acid underline bar `scaleX:[0,1]` origin left `-=400`; chip + date line opacity stagger; countdown tiles `{opacity:[0,1], translateY:[14,0], delay: stagger(70)}`.
`{{SCROLL_MOMENT}}`: headliner names IO cascade `{opacity:[0,1], translateX:[-28,0], delay: stagger(90)}`.
`{{DEMO_MOTION_EXTRAS}}`: `window.__cdFlip = (cell) => animate(cell, { translateY: ['0.6em', 0], opacity: [0, 1], duration: 300, ease: 'outQuad' });` — and ticket card hover spring: `$$('.tier').forEach(t => { t.addEventListener('mouseenter', () => animate(t, { translateY: -6, duration: 450, ease: 'outElastic(1, .6)' })); t.addEventListener('mouseleave', () => animate(t, { translateY: 0, duration: 380, ease: 'outQuad' })); });`

- [ ] **Step 1:** Rewrite `templates/programme.html` per spec (4 pages, countdown, timetable data + renderer, speaker flip grid, Patterns C/A/B).
- [ ] **Step 2 (verify, Pattern V):** assertions: `window.TT.length` → `20`; timetable Day 2 tab click → visible session titles include `"Leading from the second chair"` and NOT `"Pōwhiri & opening"`; countdown: all four `.cd-n` are 2-char numerics and SEC changes across a 1.5s wait (`eval` twice); speakers grid count → `12`; tickets: sold-out tier has `aria-disabled="true"` and no mailto button.
- [ ] **Step 3:** `git add templates/programme.html && git commit -m "feat(templates): programme lineup-drop rebuild — countdown, interactive timetable, ticket tiers"`

---

## Task 8: Elevate `templates.html` shopfront + finder persistence

**Files:** Modify: `templates.html` (cards + mockups + copy), `js/templates.js` (persistence), `css/style.css` (ONLY appended `.tpl-` rules, nothing else)

**8a — "Pages" line per card:** inside each `.tpl-body` after `.tpl-desc`, add `<p class="tpl-pages">` (small caps, `--ink-faint`-equivalent site token): toolbelt `Pages: Home · Rate card · Jobs · Reviews · Quote docket` · counter `Pages: Home · Menu · Story · Gallery · Find us + live open/closed` · ledger `Pages: Home · Tariff · Approach · People · Contact + fee estimator` · commons `Pages: Home · Programmes · Events · Volunteer · Donate` · programme `Pages: Home · Lineup · Timetable · Tickets + countdown` · storefront `Pages: Home · Shop · Product pages · Story · Stockists + working cart` · folio `Pages: Home · Work index · Project pages · About · Contact`.

**8b — living micro-previews** (CSS only, appended to `css/style.css`, all inside `@media (prefers-reduced-motion: no-preference){}`): each `.tpl-mock.mk-*` gains ONE loop ≤ 8s:
- `mk-toolbelt`: existing stripe element `background-position` crawl 12s linear.
- `mk-counter`: two 6px "steam" pseudo-dots rising: `translateY(-8px)` + fade, 4s alternating delays.
- `mk-ledger`: gold rule shimmer — thin gradient sweep via `background-position`, 7s.
- `mk-commons`: inner card `rotate(.6deg)` ↔ `rotate(-.4deg)`, 6s ease-in-out alternate.
- `mk-programme`: acid block `opacity .4↔1` tick, steps(2), 2s (colon blink).
- `mk-storefront`: cart-dot `scale(1)↔(1.25)`, 3s.
- `mk-folio`: inner image strip `translateX(0→-12%)`, 8s alternate.
(Implementer inspects each existing `mk-*` markup and attaches the loop to an element already present — add ONE `<i>` inside a mock only if nothing suitable exists.)

**8c — hover + entrance:** card hover (CSS): `.tpl-card:hover{transform:translateY(-6px)}` + `.tpl-card:hover .tpl-mock{transform:perspective(700px) rotateX(1.2deg) rotateY(-1.2deg)}`, transitions 250ms `var(--ease-out)`, shadow deepen. Keep the existing `[data-reveal]`/`--i` entrance exactly as is (root page — do NOT add anime.js here; the site's reveal system already handles it).

**8d — finder persistence** (`js/templates.js`): read the file first; it has chip-filter logic + a recommendation ribbon with maps at the top. Add:
```js
// persistence (T3.3)
const FKEY = 'tpl-finder';
function saveFinder(state) { try { sessionStorage.setItem(FKEY, JSON.stringify(state)); } catch (e) {} }
function loadFinder() { try { return JSON.parse(sessionStorage.getItem(FKEY)) || null; } catch (e) { return null; } }
```
Wire into the existing chip-click handler: after existing logic runs, `saveFinder({ who, need })` with whatever state variables the file already tracks. On DOMContentLoaded, if `loadFinder()` returns state, programmatically re-apply it through the SAME code path as a user click (call the existing handler functions — do not duplicate filter logic).

- [ ] **Step 1:** Implement 8a–8d.
- [ ] **Step 2 (verify — DOM eval only, no below-fold screenshots on this page):** `document.querySelectorAll('.tpl-pages').length` → `7`; click finder chip (e.g. `cafe`) → eval `JSON.parse(sessionStorage.getItem('tpl-finder'))` → reflects selection; navigate to `templates/counter.html`, back to `templates.html` → eval the same chip has its active class and shelf is filtered (visible cards `1`); reduced-motion media block present: eval `!!Array.from(document.styleSheets).length` + grep the css file for `prefers-reduced-motion: no-preference` → present.
- [ ] **Step 3:** `git add templates.html js/templates.js css/style.css && git commit -m "feat(shopfront): living card previews, pages lines, hover lift, finder persistence (T3.3)"`

---

## Task 9: Full QA sweep + README

**Files:** Modify: `README.md` (templates section)

- [ ] **Step 1 — route matrix:** for EVERY demo, fresh-load every route directly (e.g. `counter.html#/menu`, `folio.html#/work/braided`, `storefront.html#/product/late-shift`): active page correct, zero console errors, demo bar visible, `ALL TEMPLATES` links to `../templates.html`.
- [ ] **Step 2 — back/forward:** on each demo navigate home → page A → page B, then `history.back()` twice → home active.
- [ ] **Step 3 — mobile (375px):** every demo home + its most complex page (menu / timetable / shop): no horizontal scroll (`document.documentElement.scrollWidth <= 380`), menu button opens/closes, Escape closes.
- [ ] **Step 4 — reduced motion:** for each demo: eval `sessionStorage.setItem('ss_reduced','1')`, reload home → all `[data-anim]` computed opacity `1` immediately (eval `Array.from(document.querySelectorAll('[data-anim]')).every(e => getComputedStyle(e).opacity === '1')` → `true`), marquees/loops not running (CSS media query covers OS-level; the flag covers JS). Clear the flag after.
- [ ] **Step 5 — no-JS smoke:** eval on one demo: `document.documentElement.classList.remove('js')` → all sections visible stacked (`[data-page]` all `display:block`).
- [ ] **Step 6 — kill-switch check:** block CDN (eval: not practical) — instead code-review each demo: Pattern B is the ONLY module using the CDN and is fully wrapped in try/catch; routers/carts/forms/hours/countdown/timetable/filters are all plain scripts. Confirm by grep: `grep -c "animejs@4.5.0" templates/*.html` → 1 per file; `grep -n "import" templates/*.html` shows imports ONLY inside the try block.
- [ ] **Step 7 — README:** update the "Templates shopfront" section: demos are now multi-page (hash-routed) with per-demo signature functionality; note anime.js 4.5.0 CDN dependency (motion-only, failure-isolated); note finder persistence; keep the "to add a template" instructions accurate.
- [ ] **Step 8:** `git add README.md && git commit -m "docs: README for multi-page template demos + finder persistence"`
- [ ] **Step 9:** Report completion to Kris with the route matrix results and screenshots of each demo home. Do NOT merge to the default branch — use superpowers:finishing-a-development-branch to present options.

---

## Self-review (done at write time)

- **Spec coverage:** 7 demos ✔ (Tasks 1–7), shopfront + persistence ✔ (Task 8), invariants ✔ (READ THIS FIRST), motion/reduced-motion ✔ (Pattern B + QA 4), banned aesthetics ✔, ledger CTA bug ✔ (Task 5), QA ✔ (Task 9).
- **Placeholder scan:** the only `{{…}}` tokens are Pattern B fill points, each explicitly supplied per task. No TBDs.
- **Consistency:** router contract (`data-page` / `data-nav` / `__pageSetup` / `__pageEnter` / `__closeMenu`) identical across tasks; estimator arithmetic verified (6460/8100); counter hours edge cases specified with exact expected JSON; countdown UTC instant stated (NZDT = UTC+13 in March 2027).
- **Order note:** Tasks 1–7 are independent of each other; Task 8 is independent too but reads better last so `tpl-pages` lines match shipped demos; Task 9 requires 1–8.
