// Product images for the Laurel pages, taken from the real demos: node _laurel/test/marketing-shots.mjs
// Writes WebP/PNG into laurel/assets/img/.
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const OUT = path.join(ROOT, 'laurel', 'assets', 'img');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'laurel-shots-'));
fs.mkdirSync(OUT, { recursive: true });
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.woff2') ? 'font/woff2' : f.endsWith('.css') ? 'text/css' : 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}`;
const browser = await pw.chromium.launch();

async function tv(name, url, steps, size = [1920, 1080]) {
  const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
  await page.goto(base + url);
  await page.waitForTimeout(1500);
  for (let i = 0; i < steps; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(250); }
  await page.mouse.move(5, 5);
  await page.waitForTimeout(4200); // let the controls fade and the slide settle
  const file = path.join(TMP, name + '.png');
  await page.screenshot({ path: file });
  await page.close();
  return file;
}
async function shot(name, url, size, opts = {}) {
  const page = await browser.newPage({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: opts.dpr || 1 });
  await page.goto(base + url);
  await page.waitForTimeout(opts.wait || 1500);
  if (opts.act) await opts.act(page);
  const file = path.join(TMP, name + '.png');
  await page.screenshot({ path: file });
  await page.close();
  return file;
}

const files = {
  'tv-timber': await tv('tv-timber', '/laurel/demo/?embed=1#screen', 2),
  'tv-spot': await tv('tv-spot', '/laurel/demo/?embed=1#screen', 1),
  'tv-heritage': await tv('tv-heritage', '/laurel/demo/school/?embed=1#screen', 2),
  'tv-modern': await tv('tv-modern', '/laurel/demo/rugby/?embed=1#screen', 2),
  'web-phone': await shot('web-phone', '/laurel/demo/#/p/mere-henare', [390, 844], { dpr: 2 }),
  'kiosk': await shot('kiosk', '/laurel/demo/?embed=1#kiosk', [1920, 1080], { act: async (p) => { await p.mouse.click(600, 600); await p.waitForTimeout(700); await p.click('.lr-az button:has-text("H")'); await p.waitForTimeout(500); } }),
  'editor': await shot('editor', '/laurel/app/', [1600, 1000], { act: async (p) => { await p.click('text=Try it with an example club'); await p.waitForTimeout(2500); } }),
};
await browser.close();
server.close();

// Convert and size with Python/Pillow (always present where this runs).
const py = `
import sys, json
from PIL import Image
files = json.loads(sys.argv[1]); out = sys.argv[2]
spec = {
  'tv-timber': (1600, None), 'tv-spot': (1600, None), 'tv-heritage': (1600, None), 'tv-modern': (1600, None),
  'web-phone': (600, None), 'kiosk': (1600, None), 'editor': (1600, None),
}
for name, f in files.items():
    im = Image.open(f).convert('RGB')
    w = spec[name][0]
    if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(f'{out}/{name}.webp', 'WEBP', quality=80, method=6)
    print(name, im.size)
# share card: the TV board on a dark ground with the name
tv = Image.open(files['tv-timber']).convert('RGB').resize((960, 540), Image.LANCZOS)
card = Image.new('RGB', (1200, 630), (12, 11, 9))
card.paste(tv, (120, 45))
from PIL import ImageDraw
d = ImageDraw.Draw(card)
d.rectangle([110, 35, 1090, 595], outline=(60, 52, 40), width=3)
card.save(f'{out}/og-laurel.png', optimize=True)
print('og', card.size)
`;
const pyFile = path.join(TMP, 'convert.py');
fs.writeFileSync(pyFile, py);
console.log(execSync(`python3 -I ${pyFile} '${JSON.stringify(files)}' '${OUT}'`).toString());
