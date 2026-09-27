import puppeteer from 'puppeteer-core';
const CHROME = '/Users/krissingh/.cache/puppeteer/chrome/mac_arm-148.0.7778.97/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const URL = 'http://localhost:4173/case-nextgen.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const state = (page) => page.evaluate(() => [...document.querySelectorAll('.case-screen')].filter((f) => f.querySelector('video')).map((f) => {
  const v = f.querySelector('video'), b = f.querySelector('.screen-toggle');
  return `${(v.dataset.src || '').split('/').pop()}:${v.currentSrc ? 'loaded' : 'none'}/${v.paused ? 'paused' : 'playing'}/btn=${b.hidden ? 'hidden' : b.querySelector('.st-label').textContent}/live=${f.classList.contains('is-live')}`;
}));

// 1. reduced motion: nothing loads or plays until asked; Play works
let page = await browser.newPage();
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.setViewport({ width: 1440, height: 900 });
await page.goto(URL, { waitUntil: 'networkidle2' });
await sleep(1500);
console.log('reduced, at load:', (await state(page))[0]);
console.log('reduced, stats:', await page.evaluate(() => [...document.querySelectorAll('[data-count-to]')].map((e) => e.textContent).join(',')));
await page.click('.screen-hero .screen-toggle');
await sleep(1500);
console.log('reduced, after Play:', (await state(page))[0]);
await page.close();

// 2. normal: hero autoplays; Pause sticks through a scroll away and back
page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(URL, { waitUntil: 'networkidle2' });
await sleep(2000);
console.log('normal, at load:', (await state(page))[0]);
await page.focus('.screen-hero .screen-toggle');
await page.keyboard.press('Enter');
await sleep(400);
console.log('after Enter on toggle:', (await state(page))[0]);
await page.evaluate(() => scrollTo(0, 3000)); await sleep(800);
await page.evaluate(() => scrollTo(0, 0)); await sleep(1200);
console.log('after scroll away and back:', (await state(page))[0]);
await page.keyboard.press('Enter');
await sleep(800);
console.log('after Enter again:', (await state(page))[0]);
const focusRing = await page.evaluate(() => { const b = document.querySelector('.screen-hero .screen-toggle'); const cs = getComputedStyle(b); return [document.activeElement === b, cs.outlineStyle, cs.outlineColor].join(' '); });
console.log('focus ring:', focusRing);
await page.close();

// 3. no JS: stills visible, toggles hidden, stats readable
page = await browser.newPage();
await page.setJavaScriptEnabled(false);
await page.setViewport({ width: 1440, height: 900 });
await page.goto(URL, { waitUntil: 'networkidle2' });
console.log('no-js:', JSON.stringify(await page.evaluate(() => ({
  toggles: [...document.querySelectorAll('.screen-toggle')].map((b) => getComputedStyle(b).display).join(','),
  stats: [...document.querySelectorAll('[data-count-to]')].map((e) => e.textContent + '/' + getComputedStyle(e.closest('dl')).opacity).join(','),
  heroImg: (() => { const i = document.querySelector('.screen-hero img'); const r = i.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), getComputedStyle(i).opacity, getComputedStyle(document.querySelector('.screen-hero')).opacity].join('x'); })(),
  videoOpacity: getComputedStyle(document.querySelector('.screen-hero video')).opacity,
}))));
await browser.close();
