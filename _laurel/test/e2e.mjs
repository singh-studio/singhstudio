// End-to-end checks for the Laurel editor and board runtime: node _laurel/test/e2e.mjs
// Serves the repo locally, drives headless Chromium, mocks the Lemon Squeezy licence API.
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'laurel-e2e-'));

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  const type = f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.woff2') ? 'font/woff2' : f.endsWith('.css') ? 'text/css' : f.endsWith('.js') ? 'text/javascript' : 'application/octet-stream';
  res.writeHead(200, { 'content-type': type });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}`;

let failures = 0, passes = 0;
function check(name, ok, detail) {
  if (ok) { passes++; console.log('  ok   ' + name); }
  else { failures++; console.log('  FAIL ' + name + (detail ? ' :: ' + detail : '')); }
}
const browser = await pw.chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 }, acceptDownloads: true });
const errors = [];
const watch = (page, label) => {
  page.on('pageerror', (e) => errors.push(`${label}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`${label}: console ${m.text()}`); });
};

// Licence API mock: one good key, one bad.
let lsCalls = [];
await ctx.route('https://api.lemonsqueezy.com/v1/licenses/**', async (route) => {
  const url = route.request().url();
  const body = new URLSearchParams(route.request().postData() || '');
  lsCalls.push(url.split('/').pop() + ':' + body.get('license_key'));
  const json = (o, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(o) });
  if (body.get('license_key') === 'GOOD-KEY-1234-5678') {
    if (url.endsWith('/activate')) return json({ activated: true, error: null, license_key: { status: 'active' }, instance: { id: 'inst-1', name: body.get('instance_name') }, meta: { store_id: 999, product_id: 42, variant_name: 'Club licence', customer_name: 'Test Bowling Club' } });
    if (url.endsWith('/deactivate')) return json({ deactivated: true, error: null });
    return json({ valid: true, error: null });
  }
  if (body.get('license_key') === 'OTHER-STORE-KEY-0000') return json({ activated: true, instance: { id: 'inst-x' }, meta: { store_id: 1, product_id: 1, variant_name: 'Default' } });
  return json({ activated: false, error: 'license_key not found.' }, 404);
});
await ctx.addInitScript(() => { window.__LAUREL_SHOP__ = { storeId: 999, productIds: [42] }; });

console.log('Editor');
const page = await ctx.newPage();
watch(page, 'editor');
await page.goto(base + '/laurel/app/');
await page.waitForSelector('.welcome');
check('welcome shows on first visit', await page.isVisible('text=Every name, every year'));

// start from the bowls template
await page.click('.start:has-text("Bowling club")');
await page.fill('dialog input', 'Test Bowling Club');
await page.click('dialog button:has-text("Start")');
await page.waitForSelector('#grid table');
let P = await page.evaluate(() => window.__laurel.project);
check('template creates project with name', P.org.name === 'Test Bowling Club', P.org.name);
check('bowls template has 7 boards', P.boards.length === 7, String(P.boards.length));
check('modern-safe default theme for bowls is timber', P.look.theme === 'timber');

// type into the grid
await page.click('#grid input[data-r="0"][data-c="0"]');
await page.keyboard.type('1990');
await page.keyboard.press('Tab');
await page.keyboard.type('A. Smith');
await page.keyboard.press('Enter');
await page.keyboard.type('1991');
await page.keyboard.press('Tab');
await page.keyboard.type('Mere Hēnare');
await page.waitForTimeout(800);
P = await page.evaluate(() => window.__laurel.project);
check('typing fills rows', JSON.stringify(P.boards[0].rows.map((r) => r.c)) === JSON.stringify([['1990', 'A. Smith'], ['1991', 'Mere Hēnare']]), JSON.stringify(P.boards[0].rows.map((r) => r.c)));

// paste TSV from a spreadsheet into row 3, column 1
await page.keyboard.press('Enter');
await page.evaluate(() => {
  const el = document.querySelector('#grid input[data-r="2"][data-c="0"]');
  el.focus();
  const dt = new DataTransfer();
  dt.setData('text/plain', '1992\tJ. Wallace\n1993\tK. Ngata & L. Brown\n1994\tNot contested\n');
  el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
});
await page.waitForTimeout(400);
P = await page.evaluate(() => window.__laurel.project);
check('spreadsheet paste fills from the cursor', P.boards[0].rows.length === 5 && P.boards[0].rows[3].c[1] === 'K. Ngata & L. Brown', JSON.stringify(P.boards[0].rows.map((r) => r.c)));
check('placeholder row is marked', await page.isVisible('#grid tr.is-void'));

// paste dialog with loose lines
await page.click('button:has-text("Paste a list")');
await page.fill('dialog textarea', '1995  Sione Taʻala\n1996 - Priya Sharma\nT. Brown (1997)');
await page.waitForTimeout(300);
await page.click('dialog button:has-text("Add to the end")');
await page.waitForTimeout(300);
P = await page.evaluate(() => window.__laurel.project);
const last3 = P.boards[0].rows.slice(-3).map((r) => r.c.join('|'));
check('paste dialog splits years from names', JSON.stringify(last3) === JSON.stringify(['1995|Sione Taʻala', '1996|Priya Sharma', '1997|T. Brown']), JSON.stringify(last3));

// add a records board
const before = P.boards.length;
await page.click('.blist button:has-text("Add a board")');
await page.click('dialog .kind:has-text("Records")');
await page.fill('dialog input.big', 'Green Records');
await page.click('dialog button:has-text("Add board")');
await page.waitForTimeout(300);
P = await page.evaluate(() => window.__laurel.project);
const nb = P.boards.find((b) => b.title === 'Green Records');
check('add board with records columns', P.boards.length === before + 1 && nb && nb.cols.map((c) => c.role).join() === 'text,name,text,year', nb && nb.cols.map((c) => c.role).join());

// undo / redo
await page.keyboard.press('Control+z');
await page.waitForTimeout(300);
P = await page.evaluate(() => window.__laurel.project);
check('undo removes the new board', !P.boards.find((b) => b.title === 'Green Records'));
await page.keyboard.press('Control+Shift+z');
await page.waitForTimeout(300);
P = await page.evaluate(() => window.__laurel.project);
check('redo brings it back', !!P.boards.find((b) => b.title === 'Green Records'));

// look
await page.click('.step:has-text("Look")');
await page.click('.theme:has-text("Modern")');
await page.click('.pair >> nth=2');
await page.waitForTimeout(300);
P = await page.evaluate(() => window.__laurel.project);
check('theme and club colours change', P.look.theme === 'modern' && P.look.bg === '#0f3d2e', P.look.theme + ' ' + P.look.bg);

// club details + QR
await page.click('.step:has-text("Your club")');
await page.fill('input[placeholder="https://yourclub.co.nz/honours"]', 'testbowls.org.nz/honours');
await page.keyboard.press('Tab');
await page.waitForTimeout(300);
P = await page.evaluate(() => window.__laurel.project);
check('web address gets https', P.org.url === 'https://testbowls.org.nz/honours', P.org.url);

// preview is alive
const frame = page.frameLocator('.pv iframe');
await page.waitForTimeout(900);
check('preview renders the board', (await frame.locator('.lr-screen').count()) === 1);

// publish: trial download
await page.click('.step:has-text("Save & publish")');
let [dl] = await Promise.all([page.waitForEvent('download'), page.click('.out:has-text("For a TV") button:has-text("Download")')]);
const tvTrial = path.join(TMP, await dl.suggestedFilename());
await dl.saveAs(tvTrial);
let html = fs.readFileSync(tvTrial, 'utf8');
check('TV file is named for the club', path.basename(tvTrial) === 'test-bowling-club-honours-tv.html', path.basename(tvTrial));
check('trial file has no licence', /"licence":null/.test(html));
check('TV file opens in screen mode', /"mode":"screen"/.test(html));
check('file carries a QR code', /"qr":"\\u003csvg/.test(html));
check('file has the static fallback', html.includes('class="lr-static"') && html.includes('Mere H'));
check('no stray </script> from data', (html.match(/<\/script>/g) || []).length === 3, String((html.match(/<\/script>/g) || []).length));

// licence: wrong key, other store's key, then the right one
await page.click('#lic');
await page.fill('dialog input', 'NOPE-NOPE-NOPE-NOPE');
await page.click('dialog button:has-text("Activate")');
await page.waitForSelector('dialog [role="alert"]:has-text("couldn’t find")');
check('bad key explains itself', true);
await page.fill('dialog input', 'OTHER-STORE-KEY-0000');
await page.click('dialog button:has-text("Activate")');
await page.waitForSelector('dialog [role="alert"]:has-text("different product")');
check('another product’s key is refused (and released)', lsCalls.includes('deactivate:OTHER-STORE-KEY-0000'), lsCalls.join(','));
await page.fill('dialog input', 'GOOD-KEY-1234-5678');
await page.click('dialog button:has-text("Activate")');
await page.waitForSelector('#lic.is-on');
check('good key activates', (await page.textContent('#lic')).includes('Licensed'));
[dl] = await Promise.all([page.waitForEvent('download'), page.click('.out:has-text("For your website") button:has-text("Download")')]);
const web = path.join(TMP, await dl.suggestedFilename());
await dl.saveAs(web);
html = fs.readFileSync(web, 'utf8');
check('licensed file carries the licence', /"licence":\{"tier":"club"/.test(html));
check('licensed file never contains the key', !html.includes('GOOD-KEY'));

// backup
[dl] = await Promise.all([page.waitForEvent('download'), page.click('button:has-text("Download a backup")')]);
const backup = path.join(TMP, 'backup.json');
await dl.saveAs(backup);
const bj = JSON.parse(fs.readFileSync(backup, 'utf8'));
check('backup round-trips the boards', bj.boards.length === 8 && bj.org.name === 'Test Bowling Club');

// persistence across reload
await page.reload();
await page.waitForSelector('.step');
P = await page.evaluate(() => window.__laurel.project);
check('project survives a reload', P && P.org.name === 'Test Bowling Club' && P.boards.length === 8);
check('licence survives a reload', (await page.evaluate(() => window.__laurel.licence && window.__laurel.licence.status)) === 'active');

// open the downloaded board file again as a copy
const [chooser] = await Promise.all([page.waitForEvent('filechooser'), (async () => { await page.click('#proj'); await page.click('.menu button:has-text("Open a saved file")'); })()]);
await chooser.setFiles(tvTrial);
await page.waitForSelector('dialog:has-text("You already have this board")');
await page.click('dialog button:has-text("Keep both")');
await page.waitForTimeout(600);
P = await page.evaluate(() => window.__laurel.project);
check('reopening a board file can keep both', P.org.name === 'Test Bowling Club (from file)' && P.boards.some((b) => b.rows.some((r) => r.c.includes('Mere Hēnare'))), P.org.name);
check('both copies are listed', (await page.evaluate(async () => (await new Promise((res) => { const r = indexedDB.open('laurel-editor'); r.onsuccess = () => { const q = r.result.transaction('projects').objectStore('projects').getAll(); q.onsuccess = () => res(q.result); }; })).length)) === 2);

// CSV import into a new project
const csv = 'Board,Subtitle,Year,Name,Detail\nPresidents,,1950,G. Holmes,\nPresidents,,1952,F. Tui,\nSingles,Men,1960,R. Cole,21-18\n';
const csvPath = path.join(TMP, 'club.csv');
fs.writeFileSync(csvPath, csv);
const [ch2] = await Promise.all([page.waitForEvent('filechooser'), (async () => { await page.click('#proj'); await page.click('.menu button:has-text("Open a saved file")'); })()]);
await ch2.setFiles(csvPath);
await page.fill('dialog input', 'CSV Club');
await page.click('dialog button:has-text("Open")');
await page.waitForTimeout(500);
P = await page.evaluate(() => window.__laurel.project);
check('CSV opens as boards', P.org.name === 'CSV Club' && P.boards.length === 2 && P.boards[1].cols.length === 3, JSON.stringify(P.boards.map((b) => [b.title, b.cols.length])));

// deactivate
await page.click('#lic');
await page.click('dialog button:has-text("Deactivate")');
await page.waitForTimeout(300);
check('deactivate returns to trial', (await page.textContent('#lic')).includes('Free trial') && lsCalls.includes('deactivate:GOOD-KEY-1234-5678'));

// teams, privacy and deep links
const t = await ctx.newPage();
watch(t, 'editor-2');
await t.goto(base + '/laurel/app/#template=bowls');
// this browser already has boards, so the link offers to start a new one rather than replacing anything
await t.click('.toast button:has-text("Start")');
await t.fill('dialog input', 'Team Club');
await t.click('dialog button:has-text("Start")');
await t.waitForSelector('#grid table');
await t.click('.bitem:has-text("Fours")');
await t.waitForTimeout(300);
await t.click('#grid input[data-r="0"][data-c="0"]');
await t.keyboard.type('2001');
await t.keyboard.press('Tab');
await t.keyboard.type('A. Smith (skip), B. Jones, C. Brown, D. White');
await t.click('.bitem:has-text("Singles")');
await t.waitForTimeout(300);
await t.click('#grid input[data-r="0"][data-c="0"]');
await t.keyboard.type('2002');
await t.keyboard.press('Tab');
await t.keyboard.type('Secret Person');
await t.click('label.toggle:has-text("Show on the website and touchscreen")');
await t.waitForTimeout(700);
P = await t.evaluate(() => window.__laurel.project);
check('#template link starts that template', P.org.name === 'Team Club' && P.boards[0].title === 'Champion of Champions');
check('bowls fours column is a team list', P.boards.find((b) => b.title === 'Fours').cols[1].multi === true);
const files = await t.evaluate(() => ({ web: window.__laurel.exportFile('browse'), tv: window.__laurel.exportFile('screen'), kiosk: window.__laurel.exportFile('kiosk') }));
check('a board kept off the web is left out of the website file', !files.web.includes('Secret Person') && !files.kiosk.includes('Secret Person'));
check('…but still on the TV file', files.tv.includes('Secret Person'));
const tf = path.join(TMP, 'team.html');
fs.writeFileSync(tf, files.web);
await t.goto('file://' + tf + '#/');
await t.waitForSelector('#lr-q');
await t.fill('#lr-q', 'jones');
check('every team member is findable', await t.isVisible('.lr-people a:has-text("B. Jones")'));
await t.fill('#lr-q', 'smith');
check('notes in brackets are ignored for people', (await t.locator('.lr-people a b').first().textContent()).trim() === 'A. Smith');

console.log('Runtime');
const rt = await ctx.newPage();
watch(rt, 'runtime');
await rt.goto(base + '/laurel/demo/');
await rt.waitForSelector('.lr-cards');
await rt.fill('#lr-q', 'wallace');
await rt.waitForTimeout(200);
check('search finds people', await rt.isVisible('.lr-people a:has-text("J. R. Wallace")'));
await rt.fill('#lr-q', 'henare mere');
check('search ignores macrons and word order', await rt.isVisible('.lr-people a:has-text("Mere Hēnare")'));
await rt.fill('#lr-q', '1987');
check('a year lists that year’s honours', (await rt.locator('.lr-honours li').count()) >= 3);
await rt.fill('#lr-q', '');
await rt.click('.lr-card:has-text("Life Members")');
await rt.waitForSelector('.lr-table');
check('board page lists names', (await rt.locator('.lr-table tbody tr').count()) === 11);
await rt.fill('.lr-tools input', 'tipene');
check('board filter narrows rows', (await rt.locator('.lr-table tbody tr:not([hidden])').count()) === 1);
await rt.click('.lr-table a:has-text("Hēmi Tipene")');
await rt.waitForSelector('.lr-person-h');
check('person page groups repeat titles', (await rt.textContent('.lr-honours')).includes('Club Champions'));
await rt.goBack();
await rt.waitForSelector('.lr-table');
check('back button returns to the board', true);

// kiosk: attract, touch, then idle back to the slideshow
const kioskHtml = fs.readFileSync(path.join(ROOT, 'laurel/demo/index.html'), 'utf8').replace('"kioskIdle":90', '"kioskIdle":2');
const kfile = path.join(TMP, 'kiosk.html');
fs.writeFileSync(kfile, kioskHtml);
const k = await ctx.newPage();
watch(k, 'kiosk');
await k.goto('file://' + kfile + '#kiosk');
await k.waitForSelector('.lr-attract');
check('kiosk starts on the slideshow', await k.isVisible('.lr-screen'));
await k.mouse.click(400, 400);
await k.waitForSelector('.lr-web:not([hidden])');
check('a touch opens search, with A–Z', await k.isVisible('.lr-az'));
await k.waitForTimeout(500);
await k.click('.lr-az button:has-text("W")');
check('A–Z lists surnames', (await k.locator('.lr-people li').count()) > 0);
await k.waitForTimeout(2600);
check('idle returns to the slideshow', await k.isVisible('.lr-screen') && !(await k.isVisible('.lr-web')));

// the fallback list appears if the runtime cannot start
const nojs = await browser.newContext({ javaScriptEnabled: false });
const nj = await nojs.newPage();
await nj.goto(base + '/laurel/demo/');
check('no-JS visitors still see every board', (await nj.locator('.lr-static h2').count()) === 8);
await nojs.close();

check('no page errors anywhere', errors.length === 0, errors.join(' | '));
await browser.close();
server.close();
console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
