# Laurel (source)

Digital honours boards. Sources live here; `node _laurel/build.mjs` writes the published files into
`laurel/`. This folder starts with an underscore, so GitHub Pages doesn't publish it. For the business
side (pricing, Lemon Squeezy, launch), see `LAUNCH.md`.

## Layout

```
_laurel/
  build.mjs         builds laurel/app (editor), laurel/demo (sample boards) and the product pages
  site.mjs          the product pages (landing, guide, licence, golf/bowls/schools/sports-clubs)
  shop.json         prices, checkout links, Lemon Squeezy store and product IDs
  src/
    model.js        data model: normalising, paste/CSV parsing, people index (ES2017, also runs in Node)
    runtime.js/css  the board runtime inside every exported file: screen, browse and kiosk modes
    export.js       project -> one self-contained HTML file (fonts, textures, data, QR, no-JS fallback)
    samples.js      the made-up example clubs and the starter templates
    editor.*        the editor UI (modern browsers)
    fonts/          OFL fonts, subset to Latin + Latin Extended-A (+ ʻokina); licences beside them
    textures/       procedural wood and paper (tools/textures.py makes them)
    vendor/         qrcode-generator (MIT, Kazuhiko Arase)
  test/             Playwright scripts (use the global Playwright install)
laurel/             built output, served at /laurel/ (app/, demo/, assets/, pages)
```

## Rules of the road

- **The runtime must stay ES2017** with no flex `gap`, `clamp()`, `aspect-ratio` or `inset` in the
  screen CSS. Smart-TV browsers from around 2019 run it. If the runtime throws, the file shows its
  built-in plain list instead.
- **Board files never call home.** The only network request a board makes is the hosted copy
  checking its own URL for a newer version every ten minutes.
- **The editor's only network call** is the Lemon Squeezy licence API (CORS-enabled).
- User text is rendered with `textContent`; images must be validated `data:image/...;base64` URIs.
- Build output is deterministic: rebuild after any change to `src/`, `site.mjs` or `shop.json` and
  commit `laurel/` with it.

## Commands

```bash
node _laurel/build.mjs                  # build everything
python3 bin/check-site.py               # site checker (CI runs this)
node _laurel/test/e2e.mjs               # 51 end-to-end checks: editor, licence (mocked), runtime, kiosk
node _laurel/test/perf.mjs              # 4,800 names on a 6x-throttled CPU
node _laurel/test/shots.mjs [filter]    # screenshots of the demos in every mode -> test/shots/
node _laurel/test/page-shots.mjs        # full-page screenshots of the product pages
node _laurel/test/marketing-shots.mjs   # regenerate laurel/assets/img from the demos
python3 _laurel/tools/textures.py       # regenerate the wood and paper textures
```

Fonts were subset with `pyftsubset` (fonttools) from the Google Fonts repository: Cinzel, EB Garamond,
Barlow and Barlow Condensed, all SIL Open Font License 1.1.
