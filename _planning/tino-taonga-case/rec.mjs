// Real-time recorder for the Tino Taonga case-study loops.
// Headless Chrome at a forced device scale (so frames are 2x), CDP screencast
// with compositor timestamps, then assembled at a constant rate by ffmpeg.
//
//   node rec.mjs <scene>            one take into takes/<scene>/raw.mp4
//
// Each scene gets a small kit (drawn cursor, eased scroll, typing) and returns
// when the take is done. Re-running a scene re-records it from the live site.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const CHROME = '/Users/krissingh/.cache/puppeteer/chrome/mac_arm-148.0.7778.97/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const SITE = 'https://www.nextgen.salvationarmy.org.nz';
const OUT = path.resolve('takes');
const FPS = 30;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A drawn cursor, because headless Chrome has none. Eased moves, a soft
// purple pulse on click, never intercepts the pointer.
const CURSOR_JS = `
(() => {
  if (window.__cur) return;
  const c = document.createElement('div');
  c.id = '__cur';
  c.innerHTML = '<svg width="24" height="28" viewBox="0 0 26 30"><path d="M3 2 L3 24 L8.6 18.9 L12.4 27.4 L16.3 25.7 L12.6 17.4 L20.2 17.4 Z" fill="#111" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg><i></i>';
  const s = document.createElement('style');
  s.textContent = '#__cur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;will-change:transform;filter:drop-shadow(0 2px 3px rgba(0,0,0,.28))}#__cur svg{display:block;position:relative;z-index:2}#__cur i{position:absolute;left:-14px;top:-14px;width:32px;height:32px;border-radius:50%;background:rgba(90,38,140,.30);transform:scale(0);opacity:0}#__cur.down i{animation:__p .55s ease-out}@keyframes __p{0%{transform:scale(.2);opacity:1}100%{transform:scale(1.3);opacity:0}}';
  document.documentElement.append(s, c);
  window.__cur = { x: -60, y: -60, el: c };
  c.style.transform = 'translate(-60px,-60px)';
  window.__moveCur = (x, y, ms) => new Promise((res) => {
    const x0 = window.__cur.x, y0 = window.__cur.y, t0 = performance.now();
    const ease = (t) => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms), e = ease(t);
      const cx = x0 + (x - x0) * e, cy = y0 + (y - y0) * e;
      window.__cur.x = cx; window.__cur.y = cy;
      c.style.transform = 'translate(' + (cx - 3) + 'px,' + (cy - 2) + 'px)';
      if (t < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
  window.__pulse = () => { c.classList.remove('down'); void c.offsetWidth; c.classList.add('down'); };
})();`;

// Eased scroll from inside the page, so the page's own scroll listeners see
// every intermediate position (the homepage bubble is scroll-driven).
const SCROLL_JS = `window.__scrollTo = (y, ms) => new Promise((res) => {
  const y0 = window.scrollY, t0 = performance.now();
  const ease = (t) => t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2;
  const step = (now) => {
    const t = Math.min(1, (now - t0) / ms);
    window.scrollTo(0, y0 + (y - y0) * ease(t));
    if (t < 1) requestAnimationFrame(step); else res();
  };
  requestAnimationFrame(step);
});`;

async function kit(page, withCursor) {
  if (withCursor) await page.evaluate(CURSOR_JS);
  await page.evaluate(SCROLL_JS);
  const box = (sel) => page.evaluate((sel) => {
    const el = typeof sel === 'string' ? document.querySelector(sel) : null;
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2, top: b.top, left: b.left, w: b.width, h: b.height };
  }, sel);
  // find an element by its visible text inside a container
  const byText = (container, text, tag = '*') => page.evaluate((container, text, tag) => {
    const root = document.querySelector(container) || document;
    const els = [...root.querySelectorAll(tag)].filter((e) => e.children.length === 0 || tag !== '*');
    const el = els.find((e) => e.textContent.trim().replace(/\s+/g, ' ').toLowerCase().startsWith(text.toLowerCase()) && e.getBoundingClientRect().width > 0);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.left + Math.min(b.width / 2, 40), y: b.top + b.height / 2 };
  }, container, text, tag);
  const k = {
    page, sleep, box, byText,
    cursorAt: (x, y) => page.evaluate((x, y) => { window.__cur.x = x; window.__cur.y = y; window.__cur.el.style.transform = `translate(${x - 3}px,${y - 2}px)`; }, x, y),
    move: (x, y, ms = 700) => page.evaluate((x, y, ms) => window.__moveCur(x, y, ms), x, y, ms),
    async clickAt(p, ms = 700) {
      await page.evaluate((x, y, ms) => window.__moveCur(x, y, ms), p.x, p.y, ms);
      await page.mouse.move(p.x, p.y);
      await sleep(140);
      await page.evaluate(() => window.__pulse());
      await page.mouse.click(p.x, p.y);
    },
    async click(sel, ms = 700, dx = 0, dy = 0) {
      const b = await box(sel);
      if (!b) throw new Error('no element ' + sel);
      await k.clickAt({ x: b.x + dx, y: b.y + dy }, ms);
      return b;
    },
    async hover(sel, ms = 700, dx = 0, dy = 0) {
      const b = await box(sel);
      if (!b) throw new Error('no element ' + sel);
      await page.evaluate((x, y, ms) => window.__moveCur(x, y, ms), b.x + dx, b.y + dy, ms);
      await page.mouse.move(b.x + dx, b.y + dy, { steps: 4 });
      return b;
    },
    async type(text, delay = 85) { for (const ch of text) { await page.keyboard.type(ch); await sleep(delay + Math.random() * 45); } },
    scrollTo: (y, ms = 1200) => page.evaluate((y, ms) => window.__scrollTo(y, ms), y, ms),
    scrollBy: (dy, ms = 1200) => page.evaluate((dy, ms) => window.__scrollTo(window.scrollY + dy, ms), dy, ms),
    docY: (sel, off = 0) => page.evaluate((sel, off) => { const e = document.querySelector(sel); return e ? e.getBoundingClientRect().top + scrollY + off : null; }, sel, off),
  };
  return k;
}

const SKIP_INTRO = () => { try { sessionStorage.setItem('tt_intro_seen', '1'); } catch (e) {} };

const SCENES = {
  // Homepage, desktop: the seasonal scripture intro lifts, the film plays in
  // the speech bubble, then the scroll opens the bubble into the statement.
  home: {
    viewport: { width: 1440, height: 900 }, dpr: 2,
    url: SITE + '/?intro=preview',
    startWhen: '#quote-preloader',
    async run(k) {
      await k.sleep(6200);                       // intro holds, lifts, film settles in the bubble
      const end = await k.page.evaluate(() => { const m = document.querySelector('.tt-move'); return m.getBoundingClientRect().top + scrollY + m.offsetHeight - innerHeight; });
      await k.scrollTo(end * 0.42, 3200);        // bubble opens to full bleed
      await k.sleep(500);
      await k.scrollTo(end, 3600);               // statement lights up, loop draws
      await k.sleep(2200);
    },
  },

  // Resource Hub, desktop: Youth, then Bible Study, then Clear all.
  hub: {
    viewport: { width: 1440, height: 900 }, dpr: 2, cursor: true,
    url: SITE + '/resources',
    async prep(page) {
      await sleep(4000);
      await page.evaluate(() => { const r = document.querySelector('.cf-filter-wrapper'); scrollTo(0, r.getBoundingClientRect().top + scrollY - 110); });
      await sleep(1500);
    },
    async run(k) {
      await k.cursorAt(1380, 760);
      await k.sleep(900);
      const youth = await k.byText('.tt-hub, .cf-filter-wrapper', 'Youth', 'label, li, span, a');
      await k.clickAt(youth, 900);
      await k.sleep(1800);
      const bible = await k.byText('.tt-hub, .cf-filter-wrapper', 'Bible Study', 'label, li, span, a');
      await k.clickAt(bible, 800);
      await k.sleep(2600);
      const clear = await k.byText('.tt-hub, .cf-filter-wrapper', 'Clear all', 'a, button, span, div');
      await k.clickAt(clear, 900);
      await k.sleep(1600);
      await k.move(1380, 760, 900);
      await k.sleep(600);
    },
  },

  // Team finder, desktop: type "kids camp", pick the suggestion, scroll to
  // the four people it leaves, open one.
  team: {
    viewport: { width: 1440, height: 900 }, dpr: 2, cursor: true,
    url: SITE + '/team',
    async before(page) {
      // warm the cache with the profile we open, so its photo is ready
      await page.goto(SITE + '/team?person=missy-ditchburn', { waitUntil: 'networkidle2', timeout: 90000 });
      await sleep(3500);
    },
    async prep(page) { await sleep(3500); await page.evaluate(() => scrollTo(0, 0)); await sleep(500); },
    async run(k) {
      await k.cursorAt(1300, 780);
      await k.sleep(700);
      await k.click('#tf-q', 900, -180, 0);
      await k.sleep(300);
      // the live list mis-spaces partial matches (flex gap between text and <b>);
      // keep it hidden until the whole query is typed
      await k.page.addStyleTag({ content: '.tf-suggest{opacity:0!important}' }).then((h) => (k.__hide = h));
      await k.type('kids camp', 95);
      await k.page.evaluate((h) => h.remove(), k.__hide);
      await k.sleep(1000);
      await k.click('.tf-suggest-item', 700, -60, 0);
      await k.sleep(900);
      const grid = await k.docY('#tf-people', -150);
      await k.scrollTo(grid, 2600);
      await k.sleep(1000);
      const sel = '.tf-person[data-slug="missy-ditchburn"]';
      await k.hover(sel, 900, 0, -40);
      await k.sleep(900);
      await k.click(sel, 250, 0, -40);
      await k.sleep(1200);
      const panel = await k.docY('#tf-profile', -205);
      if (panel) await k.scrollTo(panel, 1300);
      await k.sleep(2800);
    },
  },

  // Homepage, phone: the sections under the opening, each fed by a collection.
  phone: {
    viewport: { width: 390, height: 844 }, dpr: 2, mobile: true,
    url: SITE + '/',
    before: (page) => page.evaluateOnNewDocument(SKIP_INTRO),
    async prep(page) {
      await sleep(4000);
      // walk the page once so lazy images are in, then park at Events
      await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } });
      await sleep(1500);
      await page.evaluate(() => { const e = document.querySelector('.tt-events'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 24); });
      await sleep(1500);
    },
    async run(k) {
      await k.sleep(1800);
      const stops = await k.page.evaluate(() => ['.tt-programmes', '.tt-team', '.tt-hub', '.tt-news']
        .map((s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().top + scrollY - 24) : null; })
        .filter((v) => v != null));
      for (const y of stops) { await k.scrollTo(y, 1500); await k.sleep(1700); }
    },
  },

  // Menu, desktop: open, drift over the sections, close.
  menu: {
    viewport: { width: 1440, height: 900 }, dpr: 2, cursor: true,
    url: SITE + '/',
    before: (page) => page.evaluateOnNewDocument(SKIP_INTRO),
    async prep(page) { await sleep(4500); },
    async run(k) {
      await k.cursorAt(1000, 520);
      await k.sleep(600);
      await k.click('#menuToggle', 900);
      await k.sleep(1700);
      for (const label of ['Children', 'Youth', 'Events and Camps']) {
        const p = await k.byText('#mobileMegaMenu', label, '.nav-heading');
        if (p) { await k.clickAt({ x: p.x + 50, y: p.y }, 800); await k.sleep(1500); }
      }
      await k.click('#menuToggle', 900);
      await k.sleep(1200);
    },
  },

  // Team finder: the Find pill that appears beside Menu once the controls scroll away.
  find: {
    viewport: { width: 1440, height: 900 }, dpr: 2, cursor: true,
    url: SITE + '/team',
    async prep(page) { await sleep(4000); await page.evaluate(() => scrollTo(0, 0)); },
    async run(k) {
      await k.cursorAt(1200, 700);
      await k.sleep(600);
      await k.scrollBy(900, 1800);
      await k.sleep(1200);
      await k.click('#tf-fab', 900);
      await k.sleep(1600);
      await k.click('#tf-q2', 700, -80, 0);
      await k.type('Napier', 110);
      await k.sleep(700);
      await k.click('#tf-strip .tf-suggest-item, .tf-suggest-item', 700, -60, 0);
      await k.sleep(2600);
    },
  },
};

async function main() {
  const scene = process.argv[2];
  const S = SCENES[scene];
  if (!S) { console.error('scenes:', Object.keys(SCENES).join(', ')); process.exit(1); }
  const { width, height } = S.viewport;
  const dpr = S.dpr || 2;
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true, defaultViewport: null, protocolTimeout: 180000,
    args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', '--disable-gpu-vsync', '--disable-frame-rate-limit',
      '--force-color-profile=srgb', `--force-device-scale-factor=${dpr}`, S.mobile ? '--window-size=800,1100' : `--window-size=${width},${height + 87}`],
  });
  const [page] = await browser.pages();
  const cdp = await page.createCDPSession();
  // phones: emulate the device inside a roomy window (headless clamps small windows)
  if (S.mobile) await page.setViewport({ width, height, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
  // desktops: pin the inner size exactly, window chrome height differs by platform
  const { windowId } = await cdp.send('Browser.getWindowForTarget');
  for (let i = 0; i < 3 && !S.mobile; i++) {
    const [iw, ih] = await page.evaluate(() => [innerWidth, innerHeight]);
    if (iw === width && ih === height) break;
    const { bounds } = await cdp.send('Browser.getWindowBounds', { windowId });
    await cdp.send('Browser.setWindowBounds', { windowId, bounds: { width: bounds.width + (width - iw), height: bounds.height + (height - ih) } });
    await sleep(200);
  }
  if (S.before) await S.before(page);

  const dir = path.join(OUT, scene);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'f'), { recursive: true });
  const frames = [];
  let recording = false;
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    if (!recording) return;
    const file = path.join(dir, 'f', String(frames.length).padStart(5, '0') + '.jpg');
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, t: metadata.timestamp });
  });
  const start = () => cdp.send('Page.startScreencast', { format: 'jpeg', quality: 93, maxWidth: width * dpr, maxHeight: height * dpr, everyNthFrame: 1 }).then(() => { recording = true; });

  if (S.startWhen) {
    await page.goto(S.url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForSelector(S.startWhen, { timeout: 30000 });
    await start();
  } else {
    await page.goto(S.url, { waitUntil: 'networkidle2', timeout: 90000 });
    if (S.prep) await S.prep(page);
    await start();
  }
  const k = await kit(page, S.cursor);
  const [iw, ih] = await page.evaluate(() => [innerWidth, innerHeight]);
  await S.run(k);
  recording = false;
  await cdp.send('Page.stopScreencast').catch(() => {});
  await browser.close();

  const list = [];
  for (let i = 0; i < frames.length; i++) {
    const d = i + 1 < frames.length ? frames[i + 1].t - frames[i].t : 1 / FPS;
    list.push(`file '${frames[i].file}'`, `duration ${Math.max(0.001, d).toFixed(4)}`);
  }
  list.push(`file '${frames[frames.length - 1].file}'`);
  fs.writeFileSync(path.join(dir, 'list.txt'), list.join('\n'));
  const span = frames[frames.length - 1].t - frames[0].t;
  const raw = path.join(dir, 'raw.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'),
    '-vf', `fps=${FPS},format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', raw]);
  console.log(JSON.stringify({ scene, inner: [iw, ih], frames: frames.length, secs: +span.toFixed(2), fps: +(frames.length / span).toFixed(1) }));
}

main().catch((e) => { console.error(e); process.exit(1); });
