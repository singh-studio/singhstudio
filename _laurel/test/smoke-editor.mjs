// Quick editor smoke run: node _laurel/test/smoke-editor.mjs  (screenshots to $SHOTS)
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const ROOT = path.join(HERE, '..', '..');
const OUT = process.env.SHOTS || path.join(HERE, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}`;
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
page.on('frameattached', (f) => {});
await page.goto(base + '/laurel/app/');
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(OUT, 'ed-welcome.png') });
await page.click('text=Try it with an example club');
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, 'ed-boards.png') });
for (const step of ['Your club', 'Look', 'TV screen', 'Save & publish']) {
  await page.click(`.step:has-text("${step}")`);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, 'ed-' + step.replace(/\W+/g, '-').toLowerCase() + '.png') });
}
console.log(errs.length ? errs.join('\n') : 'no errors');
await browser.close(); server.close();
