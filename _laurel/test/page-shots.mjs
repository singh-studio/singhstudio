// Full-page screenshots of the Laurel pages: node _laurel/test/page-shots.mjs [filter]
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const OUT = process.env.SHOTS || path.join(HERE, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}`;
const filter = process.argv[2] || '';
const jobs = [['home', '/laurel/'], ['guide', '/laurel/guide/'], ['licence', '/laurel/licence/'], ['golf', '/laurel/golf/'], ['schools', '/laurel/schools/']].filter((j) => j[0].includes(filter));
const browser = await pw.chromium.launch();
const errs = [];
for (const [name, url] of jobs) {
  for (const [w, h, tag] of [[1440, 900, 'desk'], [390, 844, 'phone']]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on('pageerror', (e) => errs.push(name + ': ' + e.message));
    page.on('requestfailed', (r) => errs.push(name + ': failed ' + r.url()));
    page.on('response', (r) => { if (r.status() >= 400) errs.push(name + ': ' + r.status() + ' ' + r.url()); });
    await page.goto(base + url, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      document.querySelectorAll('.rise').forEach((e) => e.classList.add('in'));
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
      for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    if (sw > w) errs.push(`${name} ${tag}: horizontal overflow ${sw}px > ${w}px`);
    await page.screenshot({ path: path.join(OUT, `page-${name}-${tag}.png`), fullPage: true });
    await page.close();
  }
}
await browser.close(); server.close();
console.log(errs.length ? errs.join('\n') : 'no errors');
