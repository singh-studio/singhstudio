import puppeteer from 'puppeteer-core';
const CHROME = '/Users/krissingh/.cache/puppeteer/chrome/mac_arm-148.0.7778.97/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const url = process.argv[2] || 'http://localhost:4173/case-nextgen.html';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.evaluateOnNewDocument(() => {
  const css = '';
  const add = () => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); };
  new MutationObserver((m, o) => { if (document.head) { add(); o.disconnect(); } }).observe(document, { childList: true, subtree: true });
});
await page.goto(url, { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1200));
console.log(await page.evaluate(() => {
  const W = document.documentElement.clientWidth;
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const b = el.getBoundingClientRect();
    if (b.width && b.right > 391 && !el.closest('.nav, .menu, .progress, .grain, .cursor, .to-top-btn') && getComputedStyle(el).position !== 'fixed') out.push([el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''), Math.round(b.left), Math.round(b.right), Math.round(b.width)]);
  }
  // keep the outermost offenders
  return JSON.stringify({ W, iw: innerWidth, n: out.length, first: out.slice(0, 40) }, null, 0);
}));
await browser.close();
