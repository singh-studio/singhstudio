// Stills for the Tino Taonga case study, captured from the live site at 2x.
//   node stills.mjs [name ...]      (no names = all)
// Writes stills/<name>.png (full viewport, or a full-page shot when noted)
// plus stills/<name>.json with the boxes of anything we may crop to.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const CHROME = '/Users/krissingh/.cache/puppeteer/chrome/mac_arm-148.0.7778.97/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const SITE = 'https://www.nextgen.salvationarmy.org.nz';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync('stills', { recursive: true });

const boxOf = (page, sels) => page.evaluate((sels) => {
  const out = {};
  for (const [k, s] of Object.entries(sels)) {
    const e = document.querySelector(s);
    if (!e) { out[k] = null; continue; }
    const b = e.getBoundingClientRect();
    out[k] = { x: Math.round(b.left), y: Math.round(b.top + scrollY), w: Math.round(b.width), h: Math.round(b.height) };
  }
  return out;
}, sels);

const SHOTS = {
  // homepage opening, once the film is playing: work card + og image
  home: { url: '/', skipIntro: true, wait: 9000 },
  // Kids Camp: the two-panel hero built from the Page Content post
  kidscamp: { url: '/kids-camp', skipIntro: true, wait: 10000, boxes: { hero: '.tt-pc, section.tt-pc', title: '.tt-pc h1, h1' } },
  // a Hub post: the download card and Talk to someone
  post: {
    url: '/resources/post-amplify-bible-study', wait: 11000,
    async prep(page) {
      await page.evaluate(() => { const e = document.querySelector('.tt-actions, .tt-action, [class*=tt-dl], .tt-people'); if (e) scrollTo(0, e.getBoundingClientRect().top + scrollY - 330); });
      await sleep(2500);
    },
  },
  // a person page: role, bio, and what they can help with
  person: { url: '/team/missy-ditchburn', wait: 11000, fullPage: true },
  // News: the featured story in the bubble
  news: { url: '/news', wait: 8000 },
  // phones: the Hub's filter panel slides in
  phonehub: {
    url: '/resources', mobile: true, wait: 7000,
    async prep(page) {
      const ok = await page.evaluate(() => {
        const cands = [...document.querySelectorAll('button, a, div, span')].filter((e) => /^\s*filter/i.test(e.textContent) && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().width < 200);
        const b = cands.find((e) => e.closest('.cf-filter-wrapper')) || cands[0];
        if (!b) return false; b.click(); return b.className || b.tagName;
      });
      console.log('phonehub filter trigger:', ok);
      await sleep(1800);
    },
  },
};

const want = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true, defaultViewport: null, protocolTimeout: 180000,
  args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', '--disable-gpu-vsync', '--disable-frame-rate-limit', '--force-color-profile=srgb', '--force-device-scale-factor=2', '--window-size=1440,987'],
});
for (const [name, S] of Object.entries(SHOTS)) {
  if (want.length && !want.includes(name)) continue;
  const page = await browser.newPage();
  if (S.mobile) await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  else {
    const cdp = await page.createCDPSession();
    const { windowId } = await cdp.send('Browser.getWindowForTarget');
    for (let i = 0; i < 3; i++) {
      const [iw, ih] = await page.evaluate(() => [innerWidth, innerHeight]);
      if (iw === 1440 && ih === 900) break;
      const { bounds } = await cdp.send('Browser.getWindowBounds', { windowId });
      await cdp.send('Browser.setWindowBounds', { windowId, bounds: { width: bounds.width + (1440 - iw), height: bounds.height + (900 - ih) } });
      await sleep(200);
    }
  }
  if (S.skipIntro) await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('tt_intro_seen', '1'); } catch (e) {} });
  await page.goto(SITE + S.url, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(S.wait || 6000);
  if (S.fullPage) {
    // walk the page so lazy images load
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); } scrollTo(0, 0); });
    await sleep(2500);
  }
  if (S.prep) await S.prep(page);
  const boxes = S.boxes ? await boxOf(page, S.boxes) : {};
  const scroll = await page.evaluate(() => scrollY);
  await page.screenshot({ path: `stills/${name}.png`, fullPage: !!S.fullPage, captureBeyondViewport: !!S.fullPage });
  fs.writeFileSync(`stills/${name}.json`, JSON.stringify({ scroll, boxes }, null, 1));
  console.log('shot', name, JSON.stringify({ scroll, boxes }));
  await page.close();
}
await browser.close();
