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
  repair: { bg: '#2f4858', ink: '#f3ead8', kicker: 'Bring it and we’ll fix it', title: 'Repair Café',
    svg: (c) => `<g transform="rotate(-35 760 260)"><rect x="610" y="244" width="300" height="34" rx="17" fill="${c}" fill-opacity=".85"/><circle cx="910" cy="261" r="56" fill="${c}" fill-opacity=".85"/><rect x="912" y="238" width="70" height="46" fill="#2f4858"/></g>` +
      [[600, 120, 30], [880, 430, 38], [700, 450, 24], [940, 120, 20], [560, 330, 18]].map(([x, y, r]) => `<polygon points="${rep(6, (k) => `${(x + r * Math.cos(k * Math.PI / 3)).toFixed(1)},${(y + r * Math.sin(k * Math.PI / 3)).toFixed(1)} `)}" fill="${c}" fill-opacity=".3"/><circle cx="${x}" cy="${y}" r="${r * 0.42}" fill="#2f4858"/>`).join('') },
  youth: { bg: '#e0583f', ink: '#24120d', kicker: 'Years 9–13 · Fridays', title: 'Youth Night',
    svg: (c) => rep(7, (i) => `<rect x="${600 + i * 44}" y="${70 + (i % 3) * 40}" width="22" height="${300 - (i % 3) * 40}" rx="11" fill="${c}" fill-opacity="${0.18 + (i % 4) * 0.12}"/>`) },
  camp: { bg: '#24402f', ink: '#eef2e3', kicker: 'Camp Tūī Ridge', title: 'Summer Camp',
    svg: (c) => `<path d="M520 470 L700 210 L880 470 Z" fill="${c}" fill-opacity=".14"/><path d="M640 470 L770 280 L900 470 Z" fill="${c}" fill-opacity=".24"/><path d="M700 470 L760 380 L820 470 Z" fill="#f2c56b" fill-opacity=".85"/>` + rep(14, (i) => `<circle cx="${560 + (i * 97) % 360}" cy="${70 + (i * 53) % 120}" r="${1.5 + (i % 3)}" fill="${c}"/>`) },
  kids: { bg: '#f2c14e', ink: '#1d2a44', kicker: 'Kids & families', title: 'Come and Play',
    svg: (c) => rep(16, (i) => `<circle cx="${560 + (i * 71) % 380}" cy="${60 + (i * 113) % 330}" r="${10 + (i * 7) % 30}" fill="${['#1d2a44', '#e0583f', '#ffffff', '#1f5560'][i % 4]}" fill-opacity="${i % 4 === 2 ? 0.7 : 0.85}"/>`) },
  dinner: { bg: '#a3432b', ink: '#fbefe4', kicker: 'Free · Everyone welcome', title: 'Community Dinner',
    svg: (c) => `<circle cx="760" cy="250" r="150" fill="none" stroke="${c}" stroke-opacity=".55" stroke-width="3"/><circle cx="760" cy="250" r="104" fill="${c}" fill-opacity=".12"/><path d="M560 120v260M580 120v90M540 120v90M540 210q20 26 40 0" fill="none" stroke="${c}" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/><path d="M922 120v260M922 120q-34 40 0 110" fill="none" stroke="${c}" stroke-opacity=".7" stroke-width="3"/>` },
  openmic: { bg: '#18223d', ink: '#eceaf6', kicker: 'Songs, poems and pizza', title: 'Open Mic Night',
    svg: (c) => `<rect x="730" y="100" width="80" height="140" rx="40" fill="#f5c46a"/>` + rep(4, (i) => `<path d="M738 ${130 + i * 24} h64" stroke="#18223d" stroke-opacity=".35" stroke-width="4"/>`) +
      `<path d="M705 190 v20 a65 65 0 0 0 130 0 v-20" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/><path d="M770 275 v150 M715 425 h110" stroke="${c}" stroke-width="6" stroke-linecap="round"/>` +
      rep(3, (i) => `<path d="M ${860 + i * 28} ${110 - i * 18} q ${44 + i * 14} ${80 + i * 18} 0 ${160 + i * 36}" fill="none" stroke="${c}" stroke-opacity="${0.6 - i * 0.16}" stroke-width="3" stroke-linecap="round"/><path d="M ${680 - i * 28} ${110 - i * 18} q ${-44 - i * 14} ${80 + i * 18} 0 ${160 + i * 36}" fill="none" stroke="${c}" stroke-opacity="${0.6 - i * 0.16}" stroke-width="3" stroke-linecap="round"/>`) },
  openday: { bg: '#1d5d7a', ink: '#e8f3f6', kicker: 'Tours, food and friendly faces', title: 'Open Day',
    svg: (c) => `<path d="M680 470 V230 A110 110 0 0 1 900 230 V470" fill="none" stroke="${c}" stroke-opacity=".75" stroke-width="3"/><path d="M700 470 V236 A90 90 0 0 1 880 236 V470 Z" fill="#f2c56b" fill-opacity=".85"/><path d="M700 470 V236 L640 214 V500 Z" fill="${c}" fill-opacity=".9"/><circle cx="652" cy="372" r="7" fill="#1d5d7a"/>` +
      rep(3, (i) => `<path d="M ${600 - i * 30} ${470 + i * 26} H ${940 + i * 30}" stroke="${c}" stroke-opacity="${0.45 - i * 0.12}" stroke-width="2"/>`) },
  art: { bg: '#cbb7e6', ink: '#24163a', kicker: 'Twelve artists · free', title: 'Art Trail',
    svg: () => `<rect x="560" y="80" width="170" height="170" fill="#24163a" fill-opacity=".85"/><circle cx="800" cy="170" r="90" fill="#f2c14e"/><path d="M600 470 L720 290 L840 470 Z" fill="#e0583f" fill-opacity=".9"/><rect x="760" y="300" width="160" height="40" fill="#ffffff" fill-opacity=".8"/>` },
  concert: { bg: '#161616', ink: '#e9cf87', kicker: 'Choir, band and friends', title: 'Harbour Lights',
    svg: (c) => rep(24, (i) => { const h = 40 + Math.round(Math.abs(Math.sin(i * 0.7)) * 220); return `<rect x="${540 + i * 16}" y="${260 - h / 2}" width="7" height="${h}" rx="3.5" fill="${c}" fill-opacity="${0.35 + (i % 5) * 0.12}"/>`; }) },
  foodbank: { bg: '#7d8e73', ink: '#f4f1e8', kicker: 'Volunteers welcome', title: 'Food Bank',
    svg: (c) => rep(15, (i) => `<rect x="${570 + (i % 5) * 70}" y="${80 + Math.floor(i / 5) * 100}" width="50" height="76" rx="8" fill="${c}" fill-opacity="${0.2 + (i % 3) * 0.2}"/>`) },
  cooking: { bg: '#f1e6d2', ink: '#1c2422', kicker: 'Six weeks · dinner included', title: 'Cooking on a Budget',
    svg: (c) => `<path d="M640 300 h260 v120 a40 40 0 0 1 -40 40 h-180 a40 40 0 0 1 -40 -40 z" fill="#a3432b" fill-opacity=".9"/><path d="M628 290 h284 M612 330 h28 M900 330 h28" stroke="${c}" stroke-width="10" stroke-linecap="round"/><circle cx="770" cy="274" r="13" fill="${c}"/>` +
      [700, 770, 840].map((x) => `<path d="M${x} 240 q-22 -30 0 -60 t0 -60" fill="none" stroke="${c}" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/>`).join('') },
  learning: { bg: '#3c5a7d', ink: '#e9f1fa', kicker: 'Classes and workshops', title: 'Learn Something New',
    svg: (c) => `<path d="M790 180 C 748 154 680 154 646 170 V 380 C 680 364 748 364 790 390 Z" fill="${c}" fill-opacity=".88"/><path d="M790 180 C 832 154 900 154 934 170 V 380 C 900 364 832 364 790 390 Z" fill="${c}" fill-opacity=".62"/>` +
      rep(5, (i) => `<path d="M668 ${210 + i * 32} C 698 ${201 + i * 32} 746 ${203 + i * 32} 770 ${217 + i * 32}" fill="none" stroke="#3c5a7d" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/><path d="M912 ${210 + i * 32} C 882 ${201 + i * 32} 834 ${203 + i * 32} 810 ${217 + i * 32}" fill="none" stroke="#3c5a7d" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/>`) },
  volunteer: { bg: '#c98f3c', ink: '#2a1d0e', kicker: 'Give a few hours', title: 'Volunteer With Us',
    svg: (c) => rep(3, (r) => rep(4, (k) => { const x = 610 + k * 90 + (r % 2) * 45, y = 120 + r * 110, o = (r * 4 + k) % 3 === 0 ? 0.85 : 0.32; return `<circle cx="${x}" cy="${y}" r="20" fill="${c}" fill-opacity="${o}"/><path d="M ${x - 34} ${y + 66} a34 34 0 0 1 68 0 z" fill="${c}" fill-opacity="${o}"/>`; })) },
  stars: { bg: '#0f1a2e', ink: '#e8ecf6', kicker: 'Telescopes provided', title: 'Stargazing Night',
    svg: (c) => rep(40, (i) => `<circle cx="${520 + (i * 97) % 420}" cy="${40 + (i * 61) % 420}" r="${1.4 + (i % 4) * 0.9}" fill="${c}" fill-opacity="${0.45 + (i % 3) * 0.2}"/>`) +
      `<circle cx="790" cy="190" r="78" fill="#f5c46a"/><circle cx="822" cy="170" r="72" fill="#0f1a2e"/>` +
      `<g transform="rotate(-32 700 400)"><rect x="640" y="384" width="160" height="30" rx="9" fill="${c}" fill-opacity=".9"/><rect x="796" y="378" width="18" height="42" rx="4" fill="${c}"/></g><path d="M700 412 L650 520 M700 412 L750 520 M700 412 V520" stroke="${c}" stroke-opacity=".8" stroke-width="4" stroke-linecap="round"/>` },
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
