// Full-page checks of the local case page at several widths and both themes.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const CHROME = '/Users/krissingh/.cache/puppeteer/chrome/mac_arm-148.0.7778.97/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const URL = process.argv[2] || 'http://localhost:4173/case-nextgen.html'; // serve the repo root on :4173 first
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync('verify', { recursive: true });
const ALL = [
  { w: 1516, h: 900, theme: 'dark' }, { w: 1516, h: 900, theme: 'light' },
  { w: 1024, h: 768, theme: 'dark' }, { w: 820, h: 1180, theme: 'light' },
  { w: 390, h: 844, theme: 'dark', mobile: true },
];
// RUNS=1516-dark,390-dark picks runs; phones get the site-wide grain overlay
// pinned to the viewport (it is 3x the viewport and widens the layout in
// mobile emulation, a separate site-wide issue)
const pick = (process.env.RUNS || '').split(',').filter(Boolean);
const runs = pick.length ? ALL.filter((r) => pick.includes(`${r.w}-${r.theme}`)) : ALL;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', '--disable-gpu-vsync', '--disable-frame-rate-limit'] });
for (const r of runs) {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', (q) => errors.push('failed: ' + q.url()));
  await page.setViewport({ width: r.w, height: r.h, deviceScaleFactor: 1, isMobile: !!r.mobile, hasTouch: !!r.mobile });
  if (r.mobile) await page.evaluateOnNewDocument(() => {
    const css = '';
    const add = () => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); };
    new MutationObserver((m, o) => { if (document.head) { add(); o.disconnect(); } }).observe(document, { childList: true, subtree: true });
  });
  await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('ss-theme', t); } catch (e) {} }, r.theme);
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await sleep(1500);
  // walk the page so reveals and loops fire, pausing on each screen
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const states = [];
  for (let y = 0; y < H; y += Math.round(r.h * 0.6)) {
    await page.evaluate((y) => scrollTo(0, y), y);
    await sleep(700);
    const s = await page.evaluate(() => [...document.querySelectorAll('.case-screen video')].map((v) => {
      const b = v.getBoundingClientRect();
      return { src: (v.currentSrc || '').split('/').pop(), t: +v.currentTime.toFixed(1), paused: v.paused, vis: b.bottom > 0 && b.top < innerHeight };
    }));
    states.push(s.filter((x) => x.vis).map((x) => `${x.src}@${x.t}${x.paused ? '(p)' : ''}`).join(' '));
  }
  await sleep(800);
  const metrics = await page.evaluate(() => ({
    docW: document.documentElement.scrollWidth, winW: innerWidth,
    hidden: [...document.querySelectorAll('[data-mask]:not(.in)')].length,
    reveal: [...document.querySelectorAll('[data-reveal]:not(.in)')].length,
    stats: [...document.querySelectorAll('.case-stats [data-count-to]')].map((e) => e.textContent).join(','),
    toggles: [...document.querySelectorAll('.screen-toggle')].map((b) => (b.hidden ? 'H' : b.querySelector('.st-label').textContent)).join(','),
  }));
  const name = `verify/${r.w}-${r.theme}.png`;
  await page.screenshot({ path: name, fullPage: true });
  console.log(JSON.stringify({ run: `${r.w} ${r.theme}`, H, ...metrics, errors }));
  console.log('  playing while walking:', states.filter(Boolean).slice(0, 12).join(' | '));
  await page.close();
}
await browser.close();
