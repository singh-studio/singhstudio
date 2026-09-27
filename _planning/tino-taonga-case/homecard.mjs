import puppeteer from 'puppeteer-core';
const CHROME = '/Users/krissingh/.cache/puppeteer/chrome/mac_arm-148.0.7778.97/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, defaultViewport: null,
  args: ['--hide-scrollbars','--autoplay-policy=no-user-gesture-required','--disable-gpu-vsync','--disable-frame-rate-limit','--force-color-profile=srgb','--force-device-scale-factor=2','--window-size=1440,987'] });
const [page] = await browser.pages();
const cdp = await page.createCDPSession();
const { windowId } = await cdp.send('Browser.getWindowForTarget');
for (let i = 0; i < 3; i++) { const [iw, ih] = await page.evaluate(() => [innerWidth, innerHeight]); if (iw === 1440 && ih === 900) break; const { bounds } = await cdp.send('Browser.getWindowBounds', { windowId }); await cdp.send('Browser.setWindowBounds', { windowId, bounds: { width: bounds.width + (1440 - iw), height: bounds.height + (900 - ih) } }); await sleep(200); }
await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('tt_intro_seen', '1'); } catch (e) {} });
await page.goto('https://www.nextgen.salvationarmy.org.nz/', { waitUntil: 'networkidle2', timeout: 90000 });
await sleep(8000);
for (const t of [2.4, 4.4, 10.5, 12.4, 19.4, 22.2]) {
  const ok = await page.evaluate(async (t) => {
    const v = document.querySelector('.tt-film video, .tt-open video, video');
    if (!v) return 'no video';
    v.pause(); v.currentTime = t;
    await new Promise((r) => v.addEventListener('seeked', r, { once: true }));
    return v.currentSrc.slice(-30) + ' @' + v.currentTime.toFixed(2);
  }, t);
  await sleep(700);
  await page.screenshot({ path: `stills/home-${t}.png` });
  console.log(t, ok);
}
await browser.close();
