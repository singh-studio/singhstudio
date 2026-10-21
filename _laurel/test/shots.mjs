// Screenshot the demo boards in every mode and size: node _laurel/test/shots.mjs [filter]
// Writes PNGs to $SHOTS (default: _laurel/test/shots, git-ignored).
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// Playwright from the project if installed, otherwise the global install.
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const { chromium } = pw;
const ROOT = path.join(HERE, '..', '..');
const OUT = process.env.SHOTS || path.join(HERE, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const filter = process.argv[2] || '';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end('nope'); }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const SIZES = { tv: [1920, 1080], tv4k: [3840, 2160], portrait: [1080, 1920], laptop: [1366, 768], phone: [390, 844] };
const jobs = [
  ['golf-screen', '/laurel/demo/#screen', 'tv'],
  ['golf-screen-portrait', '/laurel/demo/#screen', 'portrait'],
  ['golf-browse', '/laurel/demo/', 'laptop'],
  ['golf-browse-phone', '/laurel/demo/', 'phone'],
  ['school-screen', '/laurel/demo/school/#screen', 'tv'],
  ['rugby-screen', '/laurel/demo/rugby/#screen', 'tv'],
  ['rugby-browse', '/laurel/demo/rugby/', 'laptop'],
  ['school-browse-phone', '/laurel/demo/school/', 'phone'],
  ['golf-board', '/laurel/demo/#/b/club-champions-men', 'laptop'],
  ['golf-person', '/laurel/demo/#/p/mere-henare', 'laptop'],
  ['golf-person-phone', '/laurel/demo/#/p/j-r-wallace', 'phone'],
  ['rugby-board-phone', '/laurel/demo/rugby/#/b/premiership-winners', 'phone'],
  ['golf-kiosk', '/laurel/demo/#kiosk', 'tv'],
].filter((j) => j[0].includes(filter));

const browser = await chromium.launch();
const errors = [];
for (const [name, url, size] of jobs) {
  const [w, h] = SIZES[size];
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: size === 'phone' ? 2 : 1 });
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${name}: console ${m.text()}`); });
  await page.goto(base + url, { waitUntil: 'load' });
  await page.waitForTimeout(1800);
  if (url.includes('#screen')) {
    const n = Number(process.env.SLIDES || 4);
    for (let i = 0; i < n; i++) {
      await page.screenshot({ path: path.join(OUT, `${name}-${i}.png`) });
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(1500);
    }
  } else {
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: size === 'phone' ? false : false });
  }
  await page.close();
}
await browser.close();
server.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors');
console.log('shots in ' + OUT);
