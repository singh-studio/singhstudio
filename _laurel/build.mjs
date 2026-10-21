// Build Laurel: node _laurel/build.mjs
// Writes the editor (laurel/app/) and the demo boards (laurel/demo/) from _laurel/src.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, 'src');
const OUT = path.join(HERE, '..', 'laurel');
const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
const dataUri = (f, mime) => `data:${mime};base64,${fs.readFileSync(path.join(SRC, f)).toString('base64')}`;
const write = (rel, text) => {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  console.log(`  ${path.relative(path.join(HERE, '..'), file).padEnd(34)} ${(Buffer.byteLength(text) / 1024).toFixed(0).padStart(5)} KB`);
};

const FONTS = ['cinzel', 'garamond', 'garamond-italic', 'barlow-condensed-500', 'barlow-condensed-600', 'barlow-400', 'barlow-500'];
const assets = {
  css: read('runtime.css'),
  model: read('model.js'),
  runtime: read('runtime.js'),
  fonts: Object.fromEntries(FONTS.map((n) => [n, dataUri(`fonts/${n}.woff2`, 'font/woff2')])),
  textures: { wood: dataUri('textures/wood.jpg', 'image/jpeg'), paper: dataUri('textures/paper.jpg', 'image/jpeg') },
};

const SHOP = JSON.parse(fs.readFileSync(path.join(HERE, 'shop.json'), 'utf8'));
const M = require('./src/model.js');
const X = require('./src/export.js');
const Samples = require('./src/samples.js');

// Demo boards are Singh Studio's own, so they carry no trial ribbon.
const OURS = { tier: 'trade', to: 'Singh Studio' };
const DEMO = { assets, licence: OURS, noindex: true };
console.log('Laurel ' + M.VERSION);
write('demo/index.html', X.boardHTML(Samples.golfClub(), { ...DEMO, mode: 'browse' }));
write('demo/school/index.html', X.boardHTML(Samples.school(), { ...DEMO, mode: 'browse' }));
write('demo/rugby/index.html', X.boardHTML(Samples.rugbyClub(), { ...DEMO, mode: 'browse' }));

// The editor is one file: its own UI plus everything it needs to write board files offline.
const editorTpl = path.join(SRC, 'editor.html');
if (fs.existsSync(editorTpl)) {
  const inline = (s) => s.replace(/<\/(script)/gi, '<\\/$1');
  const scripts = [
    read('vendor/qrcode.js'),
    read('model.js'),
    read('samples.js'),
    read('export.js'),
    'window.LAUREL_ASSETS = ' + JSON.stringify(assets).replace(/</g, '\\u003c') + ';\nwindow.LAUREL_SHOP = ' + JSON.stringify({ storeId: SHOP.storeId, productIds: SHOP.productIds, prices: SHOP.prices }) + ';',
    read('editor.js'),
  ].map((s) => `<script>\n${inline(s)}\n</script>`).join('\n');
  let html = fs.readFileSync(editorTpl, 'utf8')
    .replace('/*EDITOR_CSS*/', () => read('editor.css'))
    .replace('<!--EDITOR_SCRIPTS-->', () => scripts)
    .replace(/__VERSION__/g, M.VERSION);
  write('app/index.html', html);
}

// The product pages: landing, guide, licence, one page per kind of club, and their sitemap.
const { pages } = await import('./site.mjs');
const site = pages(SHOP);
for (const [rel, text] of Object.entries(site.files)) write(rel, text);
