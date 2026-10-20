// Draws the demo's event images (typographic posters, no photos) and renders each to a JPG with Playwright.
// node demo/art/render-art.mjs   (run from the product folder or anywhere; paths are resolved from this file)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/krissingh/Desktop/Singh Studio/01 Client Projects/Miramar Salvation Army/site/node_modules/playwright');
const dir = path.dirname(fileURLToPath(import.meta.url));
const W = 960, H = 640;

const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
const art = {
  sunday: { bg: '#1f5560', ink: '#f3ead8', kicker: 'Every Sunday · 9.30am', title: 'Sunday Gathering',
    svg: (c) => rep(6, (i) => `<circle cx="760" cy="300" r="${40 + i * 46}" fill="none" stroke="${c}" stroke-opacity="${0.5 - i * 0.07}" stroke-width="2"/>`) + `<circle cx="760" cy="300" r="26" fill="#f2c56b"/>` },
  youth: { bg: '#e0583f', ink: '#24120d', kicker: 'Years 9–13 · Fridays', title: 'Youth Night',
    svg: (c) => rep(7, (i) => `<rect x="${600 + i * 44}" y="${70 + (i % 3) * 40}" width="22" height="${300 - (i % 3) * 40}" rx="11" fill="${c}" fill-opacity="${0.18 + (i % 4) * 0.12}"/>`) },
  camp: { bg: '#24402f', ink: '#eef2e3', kicker: 'Camp Tūī Ridge', title: 'Summer Camp',
    svg: (c) => `<path d="M520 470 L700 210 L880 470 Z" fill="${c}" fill-opacity=".14"/><path d="M640 470 L770 280 L900 470 Z" fill="${c}" fill-opacity=".24"/><path d="M700 470 L760 380 L820 470 Z" fill="#f2c56b" fill-opacity=".85"/>` + rep(14, (i) => `<circle cx="${560 + (i * 97) % 360}" cy="${70 + (i * 53) % 120}" r="${1.5 + (i % 3)}" fill="${c}"/>`) },
  kids: { bg: '#f2c14e', ink: '#1d2a44', kicker: 'Kids & families', title: 'Come and Play',
    svg: (c) => rep(16, (i) => `<circle cx="${560 + (i * 71) % 380}" cy="${60 + (i * 113) % 330}" r="${10 + (i * 7) % 30}" fill="${['#1d2a44', '#e0583f', '#ffffff', '#1f5560'][i % 4]}" fill-opacity="${i % 4 === 2 ? 0.7 : 0.85}"/>`) },
  dinner: { bg: '#a3432b', ink: '#fbefe4', kicker: 'Free · Everyone welcome', title: 'Community Dinner',
    svg: (c) => `<circle cx="760" cy="250" r="150" fill="none" stroke="${c}" stroke-opacity=".55" stroke-width="3"/><circle cx="760" cy="250" r="104" fill="${c}" fill-opacity=".12"/><path d="M560 120v260M580 120v90M540 120v90M540 210q20 26 40 0" fill="none" stroke="${c}" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/><path d="M922 120v260M922 120q-34 40 0 110" fill="none" stroke="${c}" stroke-opacity=".7" stroke-width="3"/>` },
  prayer: { bg: '#18223d', ink: '#eceaf6', kicker: 'Come for ten minutes or stay all night', title: 'Night of Prayer',
    svg: (c) => `<ellipse cx="760" cy="200" rx="120" ry="120" fill="#f5c46a" fill-opacity=".08"/><ellipse cx="760" cy="200" rx="60" ry="60" fill="#f5c46a" fill-opacity=".12"/><path d="M760 140 q30 50 0 90 q-30 -40 0 -90z" fill="#f5c46a"/><rect x="738" y="232" width="44" height="190" rx="6" fill="${c}" fill-opacity=".9"/>` },
  mission: { bg: '#1d5d7a', ink: '#e8f3f6', kicker: 'Our Pacific partners', title: 'Mission Sunday',
    svg: (c) => rep(6, (i) => `<path d="M 520 ${220 + i * 46} q 40 -24 80 0 t 80 0 t 80 0 t 80 0 t 80 0" fill="none" stroke="${c}" stroke-opacity="${0.6 - i * 0.08}" stroke-width="2.5"/>`) + `<path d="M720 200 q40 -70 90 0 z" fill="${c}" fill-opacity=".85"/><path d="M770 150 v-60 m0 0 q30 -10 40 10 m-40 -10 q-30 -10 -40 10" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>` },
  art: { bg: '#cbb7e6', ink: '#24163a', kicker: 'Twelve artists · free', title: 'Art Trail',
    svg: () => `<rect x="560" y="80" width="170" height="170" fill="#24163a" fill-opacity=".85"/><circle cx="800" cy="170" r="90" fill="#f2c14e"/><path d="M600 470 L720 290 L840 470 Z" fill="#e0583f" fill-opacity=".9"/><rect x="760" y="300" width="160" height="40" fill="#ffffff" fill-opacity=".8"/>` },
  concert: { bg: '#161616', ink: '#e9cf87', kicker: 'Choir, band and friends', title: 'Harbour Lights',
    svg: (c) => rep(24, (i) => { const h = 40 + Math.round(Math.abs(Math.sin(i * 0.7)) * 220); return `<rect x="${540 + i * 16}" y="${260 - h / 2}" width="7" height="${h}" rx="3.5" fill="${c}" fill-opacity="${0.35 + (i % 5) * 0.12}"/>`; }) },
  foodbank: { bg: '#7d8e73', ink: '#f4f1e8', kicker: 'Harbourlight Community Trust', title: 'Foodbank',
    svg: (c) => rep(15, (i) => `<rect x="${570 + (i % 5) * 70}" y="${80 + Math.floor(i / 5) * 100}" width="50" height="76" rx="8" fill="${c}" fill-opacity="${0.2 + (i % 3) * 0.2}"/>`) },
  alpha: { bg: '#f1e6d2', ink: '#1c2422', kicker: 'Eleven weeks · dinner included', title: 'Alpha',
    svg: () => `<text x="640" y="420" font-family="Instrument Serif" font-size="460" fill="#a3432b" fill-opacity=".9">α</text>` },
  fiafia: { bg: '#b8381e', ink: '#fff1e6', kicker: 'Food, dance and music', title: 'Fiafia Night',
    svg: (c) => rep(8, (r) => rep(6, (k) => `<path d="M${560 + k * 64} ${60 + r * 48} l32 40 l32 -40 z" fill="${c}" fill-opacity="${(r + k) % 2 ? 0.16 : 0.42}"/>`)) }
};

const sections = Object.entries(art).map(([id, a]) => `
<section id="${id}" style="width:${W}px;height:${H}px;position:relative;background:${a.bg};color:${a.ink};overflow:hidden">
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0">${a.svg(a.ink)}</svg>
  <div style="position:absolute;left:64px;top:56px;font:500 17px/1 'DM Mono',monospace;letter-spacing:.22em;text-transform:uppercase;opacity:.8">Harbourlight</div>
  <div style="position:absolute;left:64px;bottom:62px;width:600px">
    <div style="font:400 19px/1.2 'DM Mono',monospace;letter-spacing:.08em;text-transform:uppercase;opacity:.78;margin-bottom:20px">${a.kicker}</div>
    <div style="font:400 ${a.title.length > 14 ? 92 : 112}px/0.94 'Instrument Serif',serif;letter-spacing:-0.01em">${a.title}</div>
  </div>
</section>`).join('');
const html = `<!doctype html><meta charset="utf-8"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Serif&display=block" rel="stylesheet"><style>body{margin:0}</style>${sections}`;
fs.writeFileSync(path.join(dir, 'art.html'), html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto('file://' + path.join(dir, 'art.html'));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
for (const id of Object.keys(art)) await page.locator('#' + id).screenshot({ path: path.join(dir, id + '.jpg'), type: 'jpeg', quality: 78 });
await browser.close();
console.log('rendered', Object.keys(art).length, 'images');
