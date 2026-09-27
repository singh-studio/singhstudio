# Tino Taonga case: captures and loops

`case-nextgen.html` was rebuilt on 2026-09-27 as the definitive account of the
Tino Taonga site (no before/after). Kris chose the "feature showcase" shape:
homepage loop up top, brief and approach, stats, five highlights (each with an
"In Squarespace / In code" ledger), four details, the handover, the outcome.
Every picture on the page is a capture of the live site or its editor, shown in
one `.case-screen` frame whose bar says where you are.

## Rebuild the media

Needs Node 22, ffmpeg, ImageMagick, cwebp and Ghostscript (all Homebrew), and
Chrome for Testing at the path in the scripts.

```bash
cd "_planning/tino-taonga-case"
npm i
node rec.mjs home          # also: hub, team, phone, menu, find
node stills.mjs            # kidscamp, post, person, news, phonehub, home
node homecard.mjs          # homepage with the bubble film held on chosen frames
bash media.sh ../..        # loops, posters, stills, guide pages, work card
bash media.sh ../.. hub    # just the Hub loop and poster
```

`rec.mjs` records in real time: headless Chrome at a forced 2x scale, CDP
screencast with compositor timestamps, assembled at 30 fps by ffmpeg. Scenes
draw their own cursor (headless Chrome has none) and scroll from inside the
page, so the homepage's scroll-driven bubble sees every position. Takes land in
`takes/<scene>/raw.mp4`; check them with a contact sheet before encoding.

## Check the page

Serve the repo root on :4173 (the `singh-studio-site` launch entry), then:

```bash
node verify.mjs                    # full-page shots at 1516/1024/820/390, both themes
RUNS=390-dark node verify.mjs      # one run
node behave.mjs                    # reduced motion, Pause/Play, keyboard, no-JS
node overflow.mjs                  # anything wider than a 390px phone
```

## Things learned

- Screencast frames come out at 1x unless Chrome is launched with
  `--force-device-scale-factor=2` and `defaultViewport: null`. Phones need the
  viewport emulated inside a roomy window (headless clamps small windows).
- Pin the inner size with `Browser.setWindowBounds`; window chrome eats ~87px.
- The Hub is framed 110px above the filter wrapper: any lower and the site's
  floating Menu pill covers Sort; any higher and the banner's text is cut.
- The team finder's suggestion rows mis-space partial matches (each row is a
  flex box with a 10px gap, so text and `<b>` split apart). The recorder hides
  the list while typing. Fix on the live site: wrap the label in one span.
- The live team page's Find pill sits over "Start again" when that row is at
  the top of the screen; the take is framed to avoid it.
- Re-recording shows whatever the site shows that day (the "On now" pill, the
  Events row, the newest resources).
