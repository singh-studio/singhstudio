// Stress test: a big club on a slow CPU. node _laurel/test/perf.mjs
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const X = require('../src/export.js');
const read = (f) => fs.readFileSync(path.join(HERE, '..', 'src', f), 'utf8');
const uri = (f, m) => `data:${m};base64,${fs.readFileSync(path.join(HERE, '..', 'src', f)).toString('base64')}`;
const assets = { css: read('runtime.css'), model: read('model.js'), runtime: read('runtime.js'), fonts: Object.fromEntries(['cinzel', 'garamond', 'garamond-italic', 'barlow-condensed-500', 'barlow-condensed-600', 'barlow-400', 'barlow-500'].map((n) => [n, uri(`fonts/${n}.woff2`, 'font/woff2')])), textures: { wood: uri('textures/wood.jpg', 'image/jpeg'), paper: uri('textures/paper.jpg', 'image/jpeg') } };
const first = ['Aroha', 'James', 'Mere', 'Sione', 'Priya', 'Hamish', 'Ana', 'Wiremu', 'Grace', 'Tane'];
const last = ['Smith', 'Ngata', 'Taufa', 'Patel', 'Wallace', 'Hēnare', 'Chen', 'Kerr', 'Moana', 'de Vries', 'Taʻala', 'Brown'];
const boards = [];
for (let b = 0; b < 12; b++) {
  const rows = [];
  for (let i = 0; i < 400; i++) rows.push({ c: [String(1626 + i), `${first[(i * 7 + b) % 10]} ${last[(i * 5 + b * 3) % 12]}`, i % 3 ? '' : 'Detail ' + i] });
  boards.push({ title: 'Board ' + (b + 1), cols: [{ label: 'Year', role: 'year' }, { label: 'Name', role: 'name' }, { label: 'Detail', role: 'text' }], rows });
}
const project = { org: { name: 'Big Club' }, boards };
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'laurel-perf-'));
const browser = await pw.chromium.launch();
for (const [mode, hash] of [['screen', '#screen'], ['browse', '#/']]) {
  const f = path.join(TMP, mode + '.html');
  const html = X.boardHTML(project, { assets, mode });
  fs.writeFileSync(f, html);
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  const t0 = Date.now();
  await page.goto('file://' + f + hash);
  await page.waitForSelector(mode === 'screen' ? '.lr-slide.is-in' : '.lr-cards');
  const ready = Date.now() - t0;
  let extra = '';
  if (mode === 'screen') {
    const deck = await page.evaluate(() => document.querySelectorAll('.lr-slide').length);
    const t1 = Date.now();
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    extra = ` · 5 slide changes in ${Date.now() - t1} ms`;
    void deck;
  } else {
    const t1 = Date.now();
    await page.fill('#lr-q', 'ngata');
    await page.waitForSelector('.lr-people');
    const searchMs = Date.now() - t1;
    await page.fill('#lr-q', '');
    await page.waitForSelector('.lr-card');
    const t2 = Date.now();
    await page.click('.lr-card >> nth=0');
    await page.waitForSelector('.lr-table');
    extra = ` · search in ${searchMs} ms · 400-name board page in ${Date.now() - t2} ms`;
  }
  console.log(`${mode}: ${(html.length / 1024).toFixed(0)} KB file, 4,800 names, ready in ${ready} ms at 6x CPU slowdown${extra}${errs.length ? ' ERRORS ' + errs.join('; ') : ''}`);
  await page.close();
}
await browser.close();
