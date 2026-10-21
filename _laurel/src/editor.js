/* Laurel editor. Everything happens in this browser: projects live in IndexedDB, board files are
   written here and downloaded. The only network call is the optional licence check. */
(function () {
  'use strict';
  const M = window.LaurelModel, X = window.LaurelExport, S = window.LaurelSamples, A = window.LAUREL_ASSETS;

  // Fill these in once the Lemon Squeezy product exists (see _laurel/LAUNCH.md).
  const SHOP = {
    storeId: 0,
    productIds: [],
    buyUrl: 'https://www.singhstudio.co.nz/laurel/#pricing',
    guide: 'https://www.singhstudio.co.nz/laurel/guide/',
    support: 'kris@singhstudio.co.nz',
    ...(window.LAUREL_SHOP || {}),
    ...(window.__LAUREL_SHOP__ || {}),
  };
  const LS_API = 'https://api.lemonsqueezy.com/v1/licenses/';

  // ---------------------------------------------------------------------------------- helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) for (const k of Object.keys(props)) {
      const v = props[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'selected' || k === 'hidden' || k === 'indeterminate') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) if (kid !== null && kid !== undefined && kid !== false) el.append(kid instanceof Node ? kid : String(kid));
    return el;
  }
  function svg(markup) { const t = document.createElement('template'); t.innerHTML = markup.trim(); return t.content.firstChild; }
  const I = {
    logo: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#d9b35c"/><path d="M16 27V11" stroke="#17140f" stroke-width="2" stroke-linecap="round"/><path d="M16 12c-.6-3.4-2.7-5.6-6.2-6.4.3 3.5 2.5 5.7 6.2 6.4zM16 12c.6-3.4 2.7-5.6 6.2-6.4-.3 3.5-2.5 5.7-6.2 6.4zM16 18.5c-1.6-2.8-4.3-4.2-7.9-4.1 1.2 3.1 3.9 4.5 7.9 4.1zM16 18.5c1.6-2.8 4.3-4.2 7.9-4.1-1.2 3.1-3.9 4.5-7.9 4.1zM16 24.4c-2.2-2.2-5-3-8.3-2.3 1.7 2.7 4.5 3.5 8.3 2.3zM16 24.4c2.2-2.2 5-3 8.3-2.3-1.7 2.7-4.5 3.5-8.3 2.3z" fill="#17140f"/></svg>',
    chev: '<svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    undo: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5L3 9l4 4M3.5 9H12a5 5 0 010 10h-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    redo: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M13 5l4 4-4 4M16.5 9H8a5 5 0 000 10h2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    eye: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M1.5 10S5 4 10 4s8.5 6 8.5 6S15 16 10 16 1.5 10 1.5 10z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="10" cy="10" r="2.6" fill="currentColor"/></svg>',
    down: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v10M5.5 8.5L10 13l4.5-4.5M3.5 16.5h13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    key: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="6.5" cy="13.5" r="3.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9 11l7.5-7.5M14 6l2 2M12 8l1.5 1.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    up: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 10l4-4 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    dn: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    x: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    photo: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4" width="15" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="7.5" cy="8.5" r="1.6" fill="currentColor"/><path d="M3 14l4.5-4 3.5 3 2.5-2 4 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    paste: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="4" width="12" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7.5 2.5h5v3h-5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7 10h6M7 13h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    file: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 2.5h6.5L15.5 6.5V17.5h-10.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M11 2.5v4.5h4.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    tv: '<svg viewBox="0 0 40 40" class="ico" aria-hidden="true"><rect x="3" y="6" width="34" height="22" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M14 34h12M20 28v6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M10 13h20M12 17.5h16M14 22h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity=".6"/></svg>',
    web: '<svg viewBox="0 0 40 40" class="ico" aria-hidden="true"><rect x="4" y="6" width="32" height="26" rx="3" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M4 12.5h32" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="22" r="4.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M23.5 25.5L27 29" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    touch: '<svg viewBox="0 0 40 40" class="ico" aria-hidden="true"><rect x="6" y="4" width="28" height="22" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M19 37v-11.5a2.2 2.2 0 014.4 0V31l4.2.8a3 3 0 012.4 3.3l-.3 1.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const plural = (n, one, many) => `${n.toLocaleString()} ${n === 1 ? one : (many || one + 's')}`;
  const today = () => new Date().toISOString().slice(0, 10);
  function b64utf8(s) { return btoa(unescape(encodeURIComponent(s))); }
  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type: type || 'text/html;charset=utf-8' }));
    const a = h('a', { href: url, download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  function kb(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function pickFile(accept) {
    return new Promise((resolve) => {
      const inp = h('input', { type: 'file', accept, hidden: true });
      inp.addEventListener('change', () => { resolve(inp.files[0] || null); inp.remove(); });
      document.body.append(inp); inp.click();
    });
  }
  function readText(file) { return file.text ? file.text() : new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(file); }); }
  // Images are shrunk before they go in: crests to 640px (keeping transparency), photos to 720px JPEG.
  async function imageData(file, max, photo) {
    if (!/^image\//.test(file.type)) throw new Error('That isn’t an image file.');
    if (file.type === 'image/svg+xml') {
      const text = await readText(file);
      if (text.length > 400000) throw new Error('That SVG is very large. Try a PNG instead.');
      return 'data:image/svg+xml;base64,' + b64utf8(text);
    }
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Couldn’t read that image.')); i.src = url; });
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = h('canvas', { width: Math.max(1, Math.round(img.naturalWidth * k)), height: Math.max(1, Math.round(img.naturalHeight * k)) });
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, c.width, c.height);
      if (photo) return c.toDataURL('image/jpeg', 0.84);
      const webp = c.toDataURL('image/webp', 0.9);
      return webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/png');
    } finally { URL.revokeObjectURL(url); }
  }

  // ---------------------------------------------------------------------------------- storage
  const Store = (() => {
    let db = null, mode = 'idb';
    const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const LSK = (k) => 'laurel:' + k;
    async function init() {
      try {
        db = await new Promise((res, rej) => {
          const r = indexedDB.open('laurel-editor', 1);
          r.onupgradeneeded = () => { r.result.createObjectStore('projects', { keyPath: 'id' }); r.result.createObjectStore('meta'); };
          r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked'));
        });
      } catch (e) {
        mode = 'local';
        try { localStorage.setItem(LSK('probe'), '1'); localStorage.removeItem(LSK('probe')); } catch (e2) { mode = 'memory'; }
      }
    }
    const mem = { projects: {}, meta: {} };
    function localAll() { try { return JSON.parse(localStorage.getItem(LSK('projects')) || '{}'); } catch (e) { return {}; } }
    return {
      init, get mode() { return mode; },
      async list() {
        if (mode === 'idb') return req(db.transaction('projects').objectStore('projects').getAll());
        return Object.values(mode === 'local' ? localAll() : mem.projects);
      },
      async get(id) {
        if (mode === 'idb') return req(db.transaction('projects').objectStore('projects').get(id));
        return (mode === 'local' ? localAll() : mem.projects)[id] || null;
      },
      async put(p) {
        if (mode === 'idb') return req(db.transaction('projects', 'readwrite').objectStore('projects').put(p));
        if (mode === 'local') { const all = localAll(); all[p.id] = p; localStorage.setItem(LSK('projects'), JSON.stringify(all)); return; }
        mem.projects[p.id] = p;
      },
      async del(id) {
        if (mode === 'idb') return req(db.transaction('projects', 'readwrite').objectStore('projects').delete(id));
        if (mode === 'local') { const all = localAll(); delete all[id]; localStorage.setItem(LSK('projects'), JSON.stringify(all)); return; }
        delete mem.projects[id];
      },
      async meta(key) {
        if (mode === 'idb') return req(db.transaction('meta').objectStore('meta').get(key));
        if (mode === 'local') { try { return JSON.parse(localStorage.getItem(LSK('meta:' + key))); } catch (e) { return null; } }
        return mem.meta[key];
      },
      async setMeta(key, val) {
        if (mode === 'idb') return req(db.transaction('meta', 'readwrite').objectStore('meta').put(val, key));
        if (mode === 'local') return localStorage.setItem(LSK('meta:' + key), JSON.stringify(val));
        mem.meta[key] = val;
      },
    };
  })();

  // ---------------------------------------------------------------------------------- licence
  let licence = null;
  async function lsCall(action, params) {
    const r = await fetch(LS_API + action, { method: 'POST', headers: { Accept: 'application/json' }, body: new URLSearchParams(params) });
    let json = null;
    try { json = await r.json(); } catch (e) { /* not JSON */ }
    return { ok: r.ok, status: r.status, json: json || {} };
  }
  function friendly(err) {
    if (/not found/i.test(err)) return 'We couldn’t find that key. Check it against your receipt email (it’s from Lemon Squeezy, on behalf of Singh Studio).';
    if (/activation limit/i.test(err)) return `This key is already in use on as many computers as it allows. Deactivate it on a computer you no longer use, or email ${SHOP.support}.`;
    if (/disabled|expired/i.test(err)) return `This key has been switched off. Email ${SHOP.support} and I’ll sort it out.`;
    return err;
  }
  function instanceName() {
    const ua = navigator.userAgent;
    const what = /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'Mac' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : 'computer';
    return `Laurel editor · ${(project && project.org.name) || 'unnamed'} · ${what} · ${today()}`.slice(0, 190);
  }
  async function activate(key) {
    key = key.trim();
    if (!/^[A-Za-z0-9-]{12,80}$/.test(key)) throw new Error('That doesn’t look like a licence key. It’s in your receipt email and looks like 38b1460a-5104-4067-a91d-77b872934d51.');
    if (!SHOP.storeId) throw new Error(`Licences aren’t on sale just yet. Email ${SHOP.support} and I’ll sort you out.`);
    let res;
    try { res = await lsCall('activate', { license_key: key, instance_name: instanceName() }); }
    catch (e) { throw new Error('Couldn’t reach the licence server. Check this computer is online, then try again.'); }
    const j = res.json;
    if (!j.activated) throw new Error(friendly(j.error || 'That key didn’t work.'));
    const meta = j.meta || {};
    const ours = Number(meta.store_id) === Number(SHOP.storeId) && (!SHOP.productIds.length || SHOP.productIds.map(Number).includes(Number(meta.product_id)));
    if (!ours) {
      try { await lsCall('deactivate', { license_key: key, instance_id: j.instance && j.instance.id }); } catch (e) { /* best effort */ }
      throw new Error('That key belongs to a different product.');
    }
    const now = new Date().toISOString();
    licence = {
      key, instanceId: j.instance && j.instance.id,
      tier: /trade|unlimited|agency|studio/i.test(meta.variant_name || '') ? 'trade' : 'club',
      variant: meta.variant_name || '', customer: meta.customer_name || '', activatedAt: now, checkedAt: now, status: 'active',
    };
    await Store.setMeta('licence', licence);
  }
  async function deactivate(force) {
    if (!licence) return;
    if (!force) {
      const r = await lsCall('deactivate', { license_key: licence.key, instance_id: licence.instanceId });
      if (!r.json.deactivated && r.status !== 404) throw new Error(friendly(r.json.error || 'Couldn’t deactivate just now.'));
    }
    licence = null;
    await Store.setMeta('licence', null);
  }
  // Once a week, quietly make sure the key is still good (refunds switch keys off).
  async function recheck() {
    if (!licence || !SHOP.storeId || !navigator.onLine) return;
    if (Date.now() - Date.parse(licence.checkedAt || 0) < 7 * 864e5) return;
    try {
      const r = await lsCall('validate', { license_key: licence.key, instance_id: licence.instanceId });
      if (r.json.valid) licence.status = 'active';
      else if (r.status === 404 || /disabled|expired/.test((r.json.license_key || {}).status || '')) {
        licence.status = 'inactive';
        toast('Your Laurel licence is no longer active, so new files will show the trial ribbon.', { error: true });
      }
      licence.checkedAt = new Date().toISOString();
      await Store.setMeta('licence', licence);
      refreshTop();
    } catch (e) { /* offline: try another day */ }
  }
  const isLicensed = () => !!(licence && licence.status === 'active');
  const exportLicence = () => isLicensed() ? { tier: licence.tier, to: licence.customer || project.org.name } : null;

  // ---------------------------------------------------------------------------------- state
  let project = null;
  const ui = { step: 'welcome', board: null, pv: 'tv', pvOpen: window.innerWidth > 1180 };
  const hist = { past: [], future: [], cur: null };
  let saveTimer = null, histTimer = null, saveState = 'saved';

  function snapshot() { return JSON.stringify(project); }
  function pushHist() {
    clearTimeout(histTimer);
    if (!project) return;
    const s = snapshot();
    if (s === hist.cur) return;
    if (hist.cur) hist.past.push(hist.cur);
    if (hist.past.length > 80) hist.past.shift();
    hist.cur = s; hist.future = [];
    refreshTop();
  }
  function resetHist() { hist.past = []; hist.future = []; hist.cur = project ? snapshot() : null; }
  function changed(opts = {}) {
    project.updated = new Date().toISOString();
    setStatus('saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 450);
    if (opts.typing) { clearTimeout(histTimer); histTimer = setTimeout(pushHist, 650); } else pushHist();
    previewSoon(opts.focus);
  }
  async function save() {
    clearTimeout(saveTimer);
    if (!project) return;
    try { await Store.put(project); await Store.setMeta('current', project.id); setStatus(Store.mode === 'memory' ? 'memory' : 'saved'); }
    catch (e) { setStatus('error'); }
  }
  function restore(json) {
    project = M.normaliseProject(JSON.parse(json));
    if (!project.boards.some((b) => b.id === ui.board)) ui.board = project.boards[0] ? project.boards[0].id : null;
    save(); preview(); renderMain(); refreshTop();
  }
  function undo() {
    pushHist();
    if (!hist.past.length) return;
    hist.future.push(hist.cur); hist.cur = hist.past.pop();
    restore(hist.cur);
  }
  function redo() {
    if (!hist.future.length) return;
    hist.past.push(hist.cur); hist.cur = hist.future.pop();
    restore(hist.cur);
  }
  async function open(p, step) {
    await save();
    project = M.normaliseProject(p);
    ui.board = project.boards[0] ? project.boards[0].id : null;
    resetHist();
    await save();
    go(step || 'club');
    buildPreview();
  }
  const board = () => project && project.boards.find((b) => b.id === ui.board);

  // ---------------------------------------------------------------------------------- toasts & dialogs
  function toast(msg, opts = {}) {
    const t = h('div', { class: 'toast' + (opts.error ? ' is-error' : '') }, h('span', null, msg));
    if (opts.action) t.append(h('button', { type: 'button', onclick: () => { opts.action.fn(); t.remove(); } }, opts.action.label));
    $('#toasts').append(t);
    setTimeout(() => t.remove(), opts.ms || (opts.action ? 7000 : 4200));
  }
  function dialog({ title, lead, body, actions, wide, onclose }) {
    const d = h('dialog', { class: 'dlg' + (wide ? ' wide' : ''), 'aria-labelledby': 'dlg-h' });
    const close = () => { d.close(); };
    d.append(h('div', { class: 'dlg-in' },
      h('button', { class: 'dlg-x', type: 'button', 'aria-label': 'Close', onclick: close }, '×'),
      h('h2', { id: 'dlg-h' }, title), lead ? h('p', { class: 'lead' }, lead) : null, body,
      actions ? h('div', { class: 'actions' }, actions) : null));
    d.addEventListener('close', () => { d.remove(); if (onclose) onclose(); });
    document.body.append(d);
    d.showModal();
    return d;
  }
  function confirmBox(title, lead, yes, danger) {
    return new Promise((resolve) => {
      let ok = false;
      const d = dialog({ title, lead, actions: [
        h('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Cancel'),
        h('button', { class: 'btn ' + (danger ? 'danger' : 'primary'), type: 'button', onclick: () => { ok = true; d.close(); } }, yes),
      ], onclose: () => resolve(ok) });
    });
  }
  function choiceBox(title, lead, choices) {
    return new Promise((resolve) => {
      let out = null;
      const d = dialog({ title, lead, actions: [h('button', { class: 'btn ghost', type: 'button', onclick: () => d.close() }, 'Cancel'),
        ...choices.map(([v, label], i) => h('button', { class: 'btn' + (i === choices.length - 1 ? ' primary' : ''), type: 'button', onclick: () => { out = v; d.close(); } }, label))], onclose: () => resolve(out) });
    });
  }
  function promptBox(title, lead, label, value, yes) {
    return new Promise((resolve) => {
      let out = null;
      const inp = h('input', { class: 'in big', value: value || '', autocomplete: 'off' });
      const d = dialog({ title, lead, body: h('label', { class: 'f' }, h('span', null, label), inp), actions: [
        h('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Cancel'),
        h('button', { class: 'btn primary', type: 'button', onclick: () => { out = inp.value.trim(); d.close(); } }, yes),
      ], onclose: () => resolve(out) });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { out = inp.value.trim(); d.close(); } });
      setTimeout(() => inp.focus(), 30);
    });
  }
  function menu(anchor, items) {
    document.querySelectorAll('.menu').forEach((m) => m.remove());
    const m = h('div', { class: 'menu', role: 'menu' }, items.map((it) => it === '-' ? h('hr') : h('button', { type: 'button', role: 'menuitem', class: it.cur ? 'cur' : null, onclick: () => { m.remove(); it.fn(); } }, it.label, it.sub ? h('small', null, it.sub) : null)));
    document.body.append(m);
    const r = anchor.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(r.left, window.innerWidth - m.offsetWidth - 8)) + 'px';
    m.style.top = (r.bottom + 6) + 'px';
    const off = (e) => { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('pointerdown', off, true); } };
    setTimeout(() => document.addEventListener('pointerdown', off, true), 0);
    m.addEventListener('keydown', (e) => { if (e.key === 'Escape') { m.remove(); anchor.focus(); } });
    const first = m.querySelector('button'); if (first) first.focus();
  }

  // ---------------------------------------------------------------------------------- shell
  const root = $('#ed');
  let topEl, stepsEl, mainEl, pvEl;
  const STEPS = [['club', 'Your club'], ['boards', 'Boards & names'], ['look', 'Look'], ['screen', 'TV screen'], ['publish', 'Save & publish']];

  function shell() {
    // the board styles' fonts and textures, for the style pickers
    const f = A.fonts;
    document.head.append(h('style', null, [
      `@font-face{font-family:"LR Cinzel";src:url(${f.cinzel}) format("woff2");font-weight:400 700}`,
      `@font-face{font-family:"LR Garamond";src:url(${f.garamond}) format("woff2");font-weight:400 600}`,
      `@font-face{font-family:"LR Garamond";src:url(${f['garamond-italic']}) format("woff2");font-style:italic}`,
      `@font-face{font-family:"LR Barlow Condensed";src:url(${f['barlow-condensed-600']}) format("woff2");font-weight:600}`,
      `@font-face{font-family:"LR Barlow Condensed";src:url(${f['barlow-condensed-500']}) format("woff2");font-weight:500}`,
      `.sw-timber,.start.feature .art,.sw-wood{background-image:url(${A.textures.wood})}.sw-heritage,.sw-paper{background-image:url(${A.textures.paper})}`,
    ].join('\n')));
    topEl = h('header', { class: 'ed-top' });
    stepsEl = h('nav', { class: 'steps', 'aria-label': 'Steps' });
    mainEl = h('main', { class: 'main', id: 'main', tabindex: '-1' });
    pvEl = h('aside', { class: 'pv', 'aria-label': 'Preview' });
    root.append(topEl, stepsEl, mainEl, pvEl);
  }

  function renderTop() {
    topEl.replaceChildren(
      h('a', { class: 'brand', href: 'https://www.singhstudio.co.nz/laurel/', target: '_blank', rel: 'noopener', title: 'About Laurel' }, svg(I.logo), 'Laurel', h('small', null, 'Editor')),
      h('button', { class: 'proj', type: 'button', id: 'proj', 'aria-haspopup': 'menu', onclick: (e) => projectsMenu(e.currentTarget) }, h('span', { id: 'proj-name' }, project ? project.org.name : 'Start'), svg(I.chev)),
      h('span', { class: 'status', id: 'status' }),
      h('span', { class: 'spacer' }),
      h('button', { class: 'tbtn', type: 'button', id: 'undo', title: 'Undo (Ctrl+Z)', onclick: undo }, svg(I.undo), h('span', { class: 'tl' }, 'Undo')),
      h('button', { class: 'tbtn', type: 'button', id: 'redo', title: 'Redo (Ctrl+Shift+Z)', onclick: redo }, svg(I.redo), h('span', { class: 'tl' }, 'Redo')),
      h('button', { class: 'tbtn pv-toggle', type: 'button', id: 'pv-toggle', onclick: togglePreview }, svg(I.eye), h('span', { class: 'tl' }, 'Preview')),
      h('button', { class: 'tbtn chip-lic', type: 'button', id: 'lic', onclick: licenceDialog }, svg(I.key), h('span', { class: 'tl', id: 'lic-l' })),
      h('button', { class: 'tbtn primary', type: 'button', id: 'publish', onclick: () => go('publish') }, svg(I.down), h('span', { class: 'tl' }, 'Save & publish')));
    refreshTop();
    setStatus(saveState);
  }
  function refreshTop() {
    if (!topEl) return;
    const has = !!project;
    const u = $('#undo'), r = $('#redo'), n = $('#proj-name'), l = $('#lic'), ll = $('#lic-l'), p = $('#publish');
    if (u) u.disabled = !hist.past.length && !(project && snapshot() !== hist.cur);
    if (r) r.disabled = !hist.future.length;
    if (n) n.textContent = has ? project.org.name : 'Start';
    if (l) { l.classList.toggle('is-on', isLicensed()); ll.textContent = isLicensed() ? (licence.tier === 'trade' ? 'Trade licence' : 'Licensed') : 'Free trial'; }
    if (p) p.hidden = !has;
    root.classList.toggle('no-pv', !has);
    root.classList.toggle('is-welcome', !has);
    root.classList.toggle('pv-closed', !ui.pvOpen);
  }
  function setStatus(s) {
    saveState = s;
    const el = $('#status');
    if (!el) return;
    el.className = 'status' + (s === 'error' || s === 'memory' ? ' is-warn' : '');
    el.textContent = !project ? '' : { saving: 'Saving…', saved: 'Saved in this browser', error: 'Couldn’t save — download a backup', memory: 'Not saved in this browser — download a backup' }[s] || '';
  }
  function renderSteps() {
    const at = STEPS.findIndex((s) => s[0] === ui.step);
    stepsEl.replaceChildren(
      ...STEPS.map((s, i) => h('button', { class: 'step' + (i < at ? ' is-done' : ''), type: 'button', 'aria-current': s[0] === ui.step ? 'step' : null, disabled: !project, onclick: () => go(s[0]) }, h('i', null, String(i + 1)), s[1])),
      h('hr'),
      h('p', { class: 'side-note' }, 'Your work saves itself in this browser. Nothing is uploaded anywhere.'),
      h('p', { class: 'side-note' }, h('a', { href: SHOP.guide, target: '_blank', rel: 'noopener' }, 'Setup guide ↗'), h('br'), h('a', { href: 'mailto:' + SHOP.support + '?subject=' + encodeURIComponent('Laurel question') }, 'Email for help')));
    stepsEl.hidden = !project;
  }
  function go(step) {
    ui.step = step;
    if (project) Store.setMeta('step', step).catch(() => {});
    renderSteps(); renderMain();
    mainEl.scrollTop = 0;
    if (step === 'boards' && ui.board) previewSoon(ui.board);
    if (step === 'club') previewSoon('@cover');
  }
  function renderMain() {
    const views = { welcome: viewWelcome, club: viewClub, boards: viewBoards, look: viewLook, screen: viewScreen, publish: viewPublish };
    mainEl.replaceChildren((project || ui.step === 'welcome' ? views[project ? ui.step : 'welcome'] : viewWelcome)());
    refreshTop();
  }
  function render() { renderTop(); renderSteps(); renderMain(); }

  // ---------------------------------------------------------------------------------- field helpers
  function text(obj, key, opts = {}) {
    const inp = h(opts.area ? 'textarea' : 'input', { class: 'in' + (opts.big ? ' big' : ''), value: obj[key] || '', placeholder: opts.placeholder, inputmode: opts.inputmode, maxlength: opts.max, autocomplete: 'off', spellcheck: opts.spell ? 'true' : 'false', 'aria-describedby': opts.hintId });
    inp.addEventListener('input', () => { obj[key] = inp.value; if (opts.onInput) opts.onInput(inp.value); changed({ typing: true }); });
    if (opts.onChange) inp.addEventListener('change', () => opts.onChange(inp));
    return inp;
  }
  function field(label, input, hint) {
    const id = 'h' + Math.random().toString(36).slice(2, 8);
    if (hint && input.setAttribute) input.setAttribute('aria-describedby', id);
    return h('label', { class: 'f' }, h('span', null, label), input, hint ? h('small', { id }, hint) : null);
  }
  function toggle(label, sub, checked, onchange, disabled) {
    const inp = h('input', { type: 'checkbox', role: 'switch', checked, disabled });
    inp.addEventListener('change', () => onchange(inp.checked));
    return h('label', { class: 'toggle' }, inp, h('span', null, h('b', null, label), sub ? h('small', null, sub) : null));
  }
  function card(...kids) { return h('section', { class: 'card' }, kids); }
  function head(eyebrow, title, lead, extra) {
    return h('div', { class: 'vh' }, h('div', null, h('p', { class: 'eyebrow' }, eyebrow), h('h1', null, title), lead ? h('p', null, lead) : null), extra || null);
  }

  // ---------------------------------------------------------------------------------- welcome
  function viewWelcome() {
    const T = S.TEMPLATES;
    const starts = [
      h('button', { class: 'start feature', type: 'button', onclick: () => open(S.golfClub(), 'boards') },
        h('span', { class: 'art' }, 'CLUB', h('br'), 'CHAMPIONS'),
        h('span', null, h('b', null, 'Try it with an example club'), h('small', null, 'Kōwhai Bay Golf Club, made up but fully loaded: eight boards, a hundred years of names. Change anything; it won’t break.'))),
      ...Object.keys(T).map((k) => h('button', { class: 'start', type: 'button', onclick: () => startFrom(k) }, h('b', null, T[k].label), h('small', null, T[k].boards.map((b) => b.title + (b.subtitle ? ' (' + b.subtitle + ')' : '')).slice(0, 4).join(', ') + (T[k].boards.length > 4 ? '…' : '')))),
      h('button', { class: 'start', type: 'button', onclick: openFile }, h('b', null, 'Open a saved file'), h('small', null, 'A board file or backup you made earlier, or a spreadsheet saved as CSV.')),
    ];
    return h('div', { class: 'welcome' },
      h('p', { class: 'eyebrow' }, 'Laurel · digital honours boards'),
      h('h1', null, 'Every name, every year, on every screen.'),
      h('p', { class: 'lead' }, 'Type or paste your honours, pick a look, and save one file that runs your clubhouse TV, a searchable page on your website and a touchscreen. Start with a template; you can change everything later.'),
      h('div', { class: 'starts' }, starts),
      h('div', { class: 'trust' }, h('span', null, 'Free to try with your own names'), h('span', null, 'Works offline'), h('span', null, 'Nothing is uploaded'), h('span', null, 'Pay once, no subscription')));
  }
  async function startFrom(key) {
    const t = S.TEMPLATES[key];
    const name = await promptBox('What’s your club called?', 'You can change this later.', 'Name of your club, school or organisation', '', 'Start');
    if (name === null) return;
    open({ org: { name: name || 'Our club' }, look: { theme: t.theme }, boards: JSON.parse(JSON.stringify(t.boards)) }, 'boards');
  }
  async function openFile() {
    const file = await pickFile('.html,.htm,.json,.csv,.txt,text/csv,application/json,text/html');
    if (!file) return;
    let text;
    try { text = await readText(file); } catch (e) { return toast('Couldn’t read that file.', { error: true }); }
    let p = null;
    if (/id="laurel-data"/.test(text)) p = X.projectFromHTML(text);
    else if (/^\s*\{/.test(text)) { try { const j = JSON.parse(text); if (j && (j.boards || j.org)) p = M.normaliseProject(j); } catch (e) { p = null; } }
    else {
      const boards = M.boardsFromCSV(text);
      if (boards.length) {
        const name = await promptBox('Name this club', `Found ${plural(boards.length, 'board')} with ${plural(boards.reduce((n, b) => n + b.rows.length, 0), 'name')}.`, 'Name of your club, school or organisation', file.name.replace(/\.[a-z]+$/i, '').replace(/[-_]+/g, ' '), 'Open');
        if (name === null) return;
        p = M.normaliseProject({ org: { name }, boards });
      } else return toast('That spreadsheet needs a “Board” column and a “Name” column. See the guide for the layout.', { error: true, ms: 8000 });
    }
    if (!p) return toast('That doesn’t look like a Laurel file.', { error: true });
    const existing = await Store.get(p.id);
    if (existing) {
      const pickd = await choiceBox('You already have this board here', `This browser has “${existing.org.name}” too, last changed ${new Date(existing.updated).toLocaleString()}. The file you opened was saved ${new Date(p.updated).toLocaleString()}.`,
        [['keep', 'Keep both'], ['replace', 'Replace the one here with the file']]);
      if (!pickd) return;
      if (pickd === 'keep') { p.id = M.uid('p'); p.org.name += ' (from file)'; }
    }
    await open(p, 'boards');
    toast(`Opened “${p.org.name}”.`);
  }
  async function projectsMenu(anchor) {
    const all = (await Store.list()).sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
    const items = all.slice(0, 12).map((p) => ({ label: p.org.name, sub: `${plural((p.boards || []).length, 'board')} · changed ${new Date(p.updated).toLocaleDateString()}`, cur: project && p.id === project.id, fn: () => { if (!project || p.id !== project.id) open(p, 'boards'); } }));
    menu(anchor, [...items, '-',
      { label: 'Start something new…', fn: async () => { await save(); project = null; ui.step = 'welcome'; render(); buildPreview(); } },
      { label: 'Open a saved file…', fn: openFile },
      ...(project ? [
        { label: 'Make a copy of this one', fn: () => { const c = JSON.parse(snapshot()); c.id = M.uid('p'); c.org.name += ' (copy)'; open(c, ui.step); toast('Made a copy.'); } },
        { label: 'Delete this one…', fn: deleteProject },
      ] : [])]);
  }
  async function deleteProject() {
    if (!(await confirmBox(`Delete “${project.org.name}”?`, 'This removes it from this browser. Files you’ve downloaded aren’t affected. Download a backup first if you might want it again.', 'Delete', true))) return;
    await Store.del(project.id);
    const rest = await Store.list();
    if (rest.length) open(rest[0], 'club'); else { project = null; ui.step = 'welcome'; render(); buildPreview(); }
    toast('Deleted.');
  }

  // ---------------------------------------------------------------------------------- club
  function viewClub() {
    const o = project.org;
    const urlHint = h('small', null, 'Optional. Once your board is on your website, paste its address here. Your TV will show a QR code to it so members can find their names on their phones.');
    const url = text(o, 'url', { placeholder: 'https://yourclub.co.nz/honours', onChange: (inp) => {
      const clean = M.webUrl(inp.value);
      if (inp.value && !clean) { urlHint.textContent = 'That doesn’t look like a web address. It should start with https://'; urlHint.style.color = 'var(--red)'; }
      else { urlHint.textContent = clean ? 'The TV will show a QR code to this address.' : ''; urlHint.style.color = ''; if (clean && clean !== inp.value) { inp.value = clean; o.url = clean; changed(); } }
    } });
    const W = project.words;
    const word = (k, label) => field(label, text(W, k, { onChange: (inp) => { if (!inp.value.trim()) { W[k] = M.WORDS[k]; inp.value = W[k]; changed(); } } }));
    return h('div', { class: 'view' },
      head('Step 1', 'Your club', 'The basics that appear on the cover slide and at the top of your website page.'),
      card(
        field('Name of your club, school or organisation', text(o, 'name', { big: true, onInput: () => { const n = $('#proj-name'); if (n) n.textContent = o.name; } })),
        h('div', { class: 'row3' },
          field('Motto or tagline', text(o, 'tagline', { placeholder: 'Optional' })),
          field('Founded', text(o, 'founded', { inputmode: 'numeric', placeholder: 'e.g. 1926' })),
          field('Short name', text(o, 'short', { placeholder: 'Optional' }), 'Used for file names.'))),
      card(h('h2', null, 'Crest or logo'), h('p', null, 'Shown on the cover, above each board and on your website. A PNG with a transparent background, or an SVG, looks best.'), crestPicker()),
      card(h('h2', null, 'Your honours page on the web'), h('label', { class: 'f' }, h('span', null, 'Web address'), url, urlHint)),
      card(h('h2', null, 'Wording'), h('p', null, 'Change the words the boards use: “Honors”, “Roll of Honour”, “Hall of Fame”, or te reo Māori.'),
        h('div', { class: 'row2' }, word('honours', 'The word for honours'), word('find', 'Search box'), word('scan', 'Beside the QR code'), word('est', 'Short for “established”'), word('spotlight', 'This year’s honours slide'), word('touch', 'Touchscreen prompt'))));
  }
  function crestPicker() {
    const o = project.org;
    const box = h('div', { class: 'crest-box' });
    const paint = () => { box.replaceChildren(o.crest ? h('img', { src: o.crest, alt: 'Your crest' }) : h('span', null, 'No crest yet')); rm.hidden = !o.crest; };
    const rm = h('button', { class: 'btn danger', type: 'button', onclick: () => { o.crest = ''; changed(); paint(); } }, 'Remove');
    const add = h('button', { class: 'btn', type: 'button', onclick: async () => {
      const file = await pickFile('image/png,image/jpeg,image/webp,image/svg+xml,image/gif');
      if (!file) return;
      try { o.crest = await imageData(file, 640, false); changed(); paint(); }
      catch (e) { toast(e.message, { error: true }); }
    } }, 'Choose an image…');
    paint();
    return h('div', { class: 'crest' }, box, h('div', { class: 'btns' }, add, rm));
  }

  // ---------------------------------------------------------------------------------- boards
  function viewBoards() {
    if (!board() && project.boards.length) ui.board = project.boards[0].id;
    const wrap = h('div', { class: 'view wide' },
      head('Step 2', 'Boards & names', 'Each board is one list, like Club Champions or Life Members. Type names in, or copy rows from a spreadsheet and paste them straight into the table.'));
    if (!project.boards.length) {
      wrap.append(card(h('div', { class: 'empty-grid' }, h('b', null, 'No boards yet'), h('p', null, 'Add your first board, or bring in a whole spreadsheet at once.'),
        h('div', { class: 'btns', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: addBoardDialog }, svg(I.plus), 'Add a board'), h('button', { class: 'btn', type: 'button', onclick: importCSV }, svg(I.file), 'Import a spreadsheet (CSV)')))));
      return wrap;
    }
    wrap.append(h('div', { class: 'boards' }, boardList(), h('div', { id: 'beditor' }, boardEditor(board()))));
    return wrap;
  }
  function boardList() {
    const list = h('div', { class: 'blist', id: 'blist' });
    const paint = () => {
      list.replaceChildren(...project.boards.map((b, i) => {
        const n = b.rows.filter((r) => r.c.join('') !== '').length;
        return h('div', { class: 'bitem' + (b.id === ui.board ? ' is-on' : '') + (b.screen ? '' : ' is-off'), 'data-id': b.id },
          h('button', { type: 'button', 'aria-current': b.id === ui.board ? 'true' : null, onclick: () => selectBoard(b.id) },
            h('b', null, b.title + (b.subtitle ? ' · ' + b.subtitle : '')), h('small', null, [plural(n, 'name'), M.yearRange(b), b.screen ? '' : 'not on TV', b.web ? '' : 'not on web'].filter(Boolean).join(' · '))),
          h('div', { class: 'mv' },
            h('button', { type: 'button', 'aria-label': `Move ${b.title} up`, disabled: i === 0, onclick: () => moveBoard(i, -1) }, svg(I.up)),
            h('button', { type: 'button', 'aria-label': `Move ${b.title} down`, disabled: i === project.boards.length - 1, onclick: () => moveBoard(i, 1) }, svg(I.dn))));
      }),
      h('button', { class: 'btn', type: 'button', onclick: addBoardDialog }, svg(I.plus), 'Add a board'),
      h('button', { class: 'btn ghost', type: 'button', onclick: importCSV }, svg(I.file), 'Import a spreadsheet'));
    };
    paint();
    list.paint = paint;
    return list;
  }
  const repaintList = debounce(() => { const l = $('#blist'); if (l && l.paint) l.paint(); }, 300);
  function selectBoard(id) {
    ui.board = id;
    const l = $('#blist'); if (l) l.paint();
    const ed = $('#beditor'); if (ed) ed.replaceChildren(boardEditor(board()));
    previewSoon(id);
  }
  function moveBoard(i, d) {
    const b = project.boards.splice(i, 1)[0];
    project.boards.splice(i + d, 0, b);
    changed({ focus: b.id });
    $('#blist').paint();
  }
  function boardEditor(b) {
    if (!b) return h('div');
    const groups = [...new Set(project.boards.map((x) => x.group).filter(Boolean))];
    const dl = h('datalist', { id: 'groups' }, groups.map((g) => h('option', { value: g })));
    const groupIn = text(b, 'group', { placeholder: 'e.g. Championships', onInput: repaintList });
    groupIn.setAttribute('list', 'groups');
    const sort = h('select', { class: 'in' }, [['asc', 'Oldest first'], ['desc', 'Newest first'], ['none', 'In the order typed']].map(([v, l]) => h('option', { value: v, selected: b.sort === v }, l)));
    sort.addEventListener('change', () => { b.sort = sort.value; changed({ focus: b.id }); });
    const warn = h('div');
    const paintWarn = () => {
      warn.replaceChildren();
      if (M.colIndex(b, 'name') < 0) warn.append(h('p', { class: 'note warn' }, 'No column is set to “Name”, so people on this board won’t show up in search. Set one column’s type to Name.'));
      if (M.colIndex(b, 'year') < 0 && b.sort !== 'none') warn.append(h('p', { class: 'note' }, 'There’s no Year column, so this board will show names in the order you type them.'));
    };
    paintWarn();
    const grid = h('div', { id: 'grid' });
    const paintGrid = () => grid.replaceChildren(gridView(b, paintGrid));
    paintGrid();
    const colsEl = h('div', { class: 'cols' });
    const paintCols = () => {
      colsEl.replaceChildren(...b.cols.map((c, ci) => {
        const lab = h('input', { value: c.label, 'aria-label': `Column ${ci + 1} heading`, maxlength: 40 });
        lab.addEventListener('input', () => { c.label = lab.value; const th = grid.querySelector(`th[data-c="${ci}"]`); if (th) th.textContent = lab.value; changed({ typing: true }); });
        const role = h('select', { 'aria-label': `Column ${ci + 1} type` }, [['year', 'Year'], ['name', 'Name'], ['text', 'Other']].map(([v, l]) => h('option', { value: v, selected: c.role === v }, l)));
        role.addEventListener('change', () => { c.role = role.value; if (c.role !== 'name') delete c.multi; changed({ focus: b.id }); paintCols(); paintGrid(); paintWarn(); });
        const multi = c.role === 'name' ? h('label', { class: 'multi', title: 'Tick for teams and crews: names separated by commas each get the honour.' }, h('input', { type: 'checkbox', checked: !!c.multi, onchange: (e) => { if (e.target.checked) c.multi = true; else delete c.multi; changed({ focus: b.id }); } }), 'Team') : null;
        const rm = h('button', { type: 'button', 'aria-label': `Remove column ${c.label}`, title: 'Remove column', disabled: b.cols.length < 2, onclick: () => {
          b.cols.splice(ci, 1); b.rows.forEach((r) => r.c.splice(ci, 1));
          changed({ focus: b.id }); paintCols(); paintGrid(); paintWarn();
          toast(`Removed the “${c.label}” column.`, { action: { label: 'Undo', fn: undo } });
        } }, '×');
        return h('div', { class: 'col' }, lab, role, multi, rm);
      }), b.cols.length < M.MAX_COLS ? h('button', { class: 'btn sm', type: 'button', onclick: () => {
        b.cols.push({ label: 'Detail', role: 'text' }); b.rows.forEach((r) => r.c.push(''));
        changed({ focus: b.id }); paintCols(); paintGrid();
      } }, svg(I.plus), 'Add a column') : null);
    };
    paintCols();
    return h('div', null,
      card(
        h('div', { class: 'row2' }, field('Board title', text(b, 'title', { big: true, onInput: repaintList })), field('Subtitle', text(b, 'subtitle', { placeholder: 'e.g. Men, Women, Juniors', onInput: repaintList }), 'Optional.')),
        h('div', { class: 'row2' }, field('Group on the website', groupIn, 'Boards with the same group sit together.'), field('Order', sort)), dl,
        toggle('Show on the TV', 'Turn off to keep this board off the slideshow.', b.screen, (v) => { b.screen = v; changed({ focus: b.id }); repaintList(); }),
        toggle('Show on the website and touchscreen', 'Turn off to keep these names off the internet, for example current students. They’re left out of those files completely.', b.web, (v) => { b.web = v; changed({ focus: b.id }); repaintList(); })),
      card(h('div', { class: 'vh', style: 'margin-bottom:12px' }, h('div', null, h('h2', null, 'Names'), h('p', { style: 'margin:2px 0 0;color:var(--mute)' }, 'Tip: copy rows from Excel or Google Sheets and paste into any cell. Press Enter to move down a row.')),
        h('button', { class: 'btn', type: 'button', onclick: () => pasteDialog(b, paintGrid) }, svg(I.paste), 'Paste a list…')), warn, grid),
      card(h('h2', null, 'Columns'), h('p', null, 'Rename the headings, or set what each column holds. One column should be the Name.'), colsEl),
      h('div', { class: 'btns', style: 'margin-top:16px' },
        h('button', { class: 'btn', type: 'button', onclick: () => {
          const c = JSON.parse(JSON.stringify(b)); c.id = M.uid('b'); c.title += ' (copy)';
          project.boards.splice(project.boards.indexOf(b) + 1, 0, M.normaliseBoard(c)); changed(); selectBoard(c.id); $('#blist').paint();
        } }, 'Duplicate board'),
        h('button', { class: 'btn danger', type: 'button', onclick: async () => {
          const n = b.rows.filter((r) => r.c.join('') !== '').length;
          if (n && !(await confirmBox(`Delete “${b.title}”?`, `It has ${plural(n, 'name')} on it. You can undo this straight after.`, 'Delete board', true))) return;
          const i = project.boards.indexOf(b); project.boards.splice(i, 1);
          ui.board = (project.boards[i] || project.boards[i - 1] || {}).id || null;
          changed(); renderMain();
          toast(`Deleted “${b.title}”.`, { action: { label: 'Undo', fn: undo } });
        } }, 'Delete board')));
  }

  function gridView(b, repaint) {
    // An empty board still shows one blank row to type into; that isn't an edit worth an undo step.
    if (!b.rows.length) { const clean = hist.cur === snapshot(); b.rows.push({ c: b.cols.map(() => '') }); if (clean) hist.cur = snapshot(); }
    const table = h('table', { class: 'grid' },
      h('thead', null, h('tr', null, h('th', { class: 'n', scope: 'col' }, '#'), b.cols.map((c, ci) => h('th', { scope: 'col', 'data-c': ci }, c.label)), h('th', null, h('span', { class: 'sr' }, 'Row actions')))));
    const tbody = h('tbody');
    const rowEl = (r, ri) => h('tr', { class: b.cols.some((c, ci) => c.role === 'name' && r.c[ci] && M.isPlaceholder(r.c[ci])) ? 'is-void' : null },
      h('td', { class: 'n' }, String(ri + 1)),
      b.cols.map((c, ci) => h('td', { class: c.role }, h('input', { value: r.c[ci] || '', 'data-r': ri, 'data-c': ci, 'aria-label': `${c.label}, row ${ri + 1}`, autocomplete: 'off', spellcheck: 'false', inputmode: c.role === 'year' ? 'text' : null }))),
      h('td', { class: 'acts' },
        h('button', { type: 'button', class: r.photo || r.text ? 'has' : null, title: 'Photo and a few words', 'aria-label': `Photo and words for row ${ri + 1}`, onclick: () => rowDialog(b, ri, repaint) }, svg(I.photo)),
        h('button', { type: 'button', title: 'Delete row', 'aria-label': `Delete row ${ri + 1}`, onclick: () => {
          b.rows.splice(ri, 1); if (!b.rows.length) b.rows.push({ c: b.cols.map(() => '') });
          changed({ focus: b.id }); repaint(); repaintList();
          toast('Row deleted.', { action: { label: 'Undo', fn: undo } });
        } }, svg(I.x))));
    b.rows.forEach((r, ri) => tbody.append(rowEl(r, ri)));
    table.append(tbody);
    const focusCell = (r, c) => { const i = table.querySelector(`input[data-r="${r}"][data-c="${c}"]`); if (i) { i.focus(); i.select(); } };
    const addRow = () => { b.rows.push({ c: b.cols.map(() => '') }); tbody.append(rowEl(b.rows[b.rows.length - 1], b.rows.length - 1)); changed({ focus: b.id }); };
    table.addEventListener('input', (e) => {
      const t = e.target; if (!t.dataset || t.dataset.r === undefined) return;
      const r = b.rows[+t.dataset.r]; if (!r) return;
      r.c[+t.dataset.c] = t.value;
      t.closest('tr').classList.toggle('is-void', b.cols.some((c, ci) => c.role === 'name' && r.c[ci] && M.isPlaceholder(r.c[ci])));
      changed({ typing: true, focus: b.id }); repaintList();
    });
    table.addEventListener('keydown', (e) => {
      const t = e.target; if (!t.dataset || t.dataset.r === undefined || e.isComposing) return;
      const r = +t.dataset.r, c = +t.dataset.c;
      if (e.key === 'Enter' || (e.key === 'ArrowDown' && !e.altKey)) {
        e.preventDefault();
        if (r === b.rows.length - 1) { if (e.key === 'ArrowDown' && !b.rows[r].c.join('').trim()) return; addRow(); }
        focusCell(r + 1, e.key === 'Enter' && c === b.cols.length - 1 ? 0 : c);
      } else if (e.key === 'ArrowUp' && r > 0) { e.preventDefault(); focusCell(r - 1, c); }
    });
    table.addEventListener('paste', (e) => {
      const t = e.target; if (!t.dataset || t.dataset.r === undefined) return;
      const textIn = (e.clipboardData || window.clipboardData).getData('text/plain') || '';
      if (!/[\t\n]/.test(textIn.replace(/\s+$/, ''))) return;
      e.preventDefault();
      const r0 = +t.dataset.r, c0 = +t.dataset.c;
      const rows = M.rowsFromText(textIn, b.cols.slice(c0)).rows;
      rows.forEach((pr, k) => {
        while (b.rows.length <= r0 + k) b.rows.push({ c: b.cols.map(() => '') });
        pr.c.forEach((v, j) => { if (c0 + j < b.cols.length) b.rows[r0 + k].c[c0 + j] = v; });
      });
      changed({ focus: b.id }); repaint(); repaintList();
      toast(`Pasted ${plural(rows.length, 'row')}.`, { action: { label: 'Undo', fn: undo } });
    });
    const count = b.rows.filter((r) => r.c.join('') !== '').length;
    return h('div', null, h('div', { class: 'grid-wrap' }, table),
      h('div', { class: 'grid-foot' },
        h('button', { class: 'btn', type: 'button', onclick: () => { addRow(); focusCell(b.rows.length - 1, 0); } }, svg(I.plus), 'Add a row'),
        h('span', { class: 'hint' }, plural(count, 'name') + (M.yearRange(b) ? ' · ' + M.yearRange(b) : ''))));
  }

  function pasteDialog(b, repaint) {
    const area = h('textarea', { class: 'in', rows: 9, placeholder: '1987  J. Smith\n1988  A. B. Ngata\n…\n\nOr copy and paste rows from Excel, Google Sheets or Word.', spellcheck: 'false' });
    const out = h('div');
    let parsed = { rows: [], header: false };
    const paint = () => {
      parsed = M.rowsFromText(area.value, b.cols);
      const rows = parsed.rows;
      out.replaceChildren(
        rows.length ? h('p', { class: 'hint' }, `${plural(rows.length, 'row')} found` + (parsed.header ? ' (the first line looked like headings, so it’s skipped)' : '') + '. Check the columns line up:') : null,
        rows.length ? h('div', { class: 'pv-table' }, h('table', null, h('thead', null, h('tr', null, b.cols.map((c) => h('th', null, c.label)))), h('tbody', null, rows.slice(0, 60).map((r) => h('tr', null, r.c.map((v) => h('td', null, v))))))) : null);
      add.disabled = repl.disabled = !rows.length;
    };
    const apply = (replace) => {
      const clean = b.rows.filter((r) => r.c.join('').trim());
      b.rows = replace ? parsed.rows : clean.concat(parsed.rows);
      changed({ focus: b.id }); repaint(); repaintList(); d.close();
      toast(`${replace ? 'Replaced with' : 'Added'} ${plural(parsed.rows.length, 'row')}.`, { action: { label: 'Undo', fn: undo } });
    };
    const add = h('button', { class: 'btn primary', type: 'button', disabled: true, onclick: () => apply(false) }, 'Add to the end');
    const repl = h('button', { class: 'btn', type: 'button', disabled: true, onclick: () => apply(true) }, 'Replace all names');
    area.addEventListener('input', debounce(paint, 120));
    const d = dialog({ title: `Paste a list into “${b.title}”`, lead: 'One name per line. Start a line with the year and Laurel splits it for you. Columns copied from a spreadsheet keep their places.', body: h('div', null, area, out), actions: [h('button', { class: 'btn ghost', type: 'button', onclick: () => d.close() }, 'Cancel'), repl, add], wide: true });
    setTimeout(() => area.focus(), 30);
  }

  function rowDialog(b, ri, repaint) {
    const r = b.rows[ri];
    const ni = M.colIndex(b, 'name');
    const name = (ni >= 0 ? r.c[ni] : r.c.join(' ')) || `Row ${ri + 1}`;
    let photo = r.photo || '';
    const ph = h('div', { class: 'crest-box', style: 'width:120px;height:150px' });
    const paint = () => { ph.replaceChildren(photo ? h('img', { src: photo, alt: '' }) : h('span', null, 'No photo')); rm.hidden = !photo; };
    const rm = h('button', { class: 'btn danger', type: 'button', onclick: () => { photo = ''; paint(); } }, 'Remove photo');
    const pick = h('button', { class: 'btn', type: 'button', onclick: async () => {
      const f = await pickFile('image/*'); if (!f) return;
      try { photo = await imageData(f, 720, true); paint(); } catch (e) { toast(e.message, { error: true }); }
    } }, 'Choose a photo…');
    const words = h('textarea', { class: 'in', maxlength: 1200, rows: 5, placeholder: 'A sentence or two: what they did, what they’re remembered for.' }, r.text || '');
    words.value = r.text || '';
    const count = h('small', { class: 'hint' });
    const pc = () => { count.textContent = `${words.value.length} / 1200`; };
    words.addEventListener('input', pc); pc();
    paint();
    const move = (d) => { const to = ri + d; if (to < 0 || to >= b.rows.length) return; b.rows.splice(to, 0, b.rows.splice(ri, 1)[0]); if (b.sort !== 'none') { b.sort = 'none'; } changed({ focus: b.id }); repaint(); dlg.close(); toast(d < 0 ? 'Moved up. The board now keeps your order.' : 'Moved down. The board now keeps your order.'); };
    const dlg = dialog({
      title: name, lead: 'Add a photo and a few words, and this person gets their own slide on the TV and a short story on the website. Good for life members, hall of fame and special awards.',
      body: h('div', null, h('div', { class: 'crest' }, ph, h('div', { class: 'btns' }, pick, rm)), h('label', { class: 'f', style: 'margin-top:18px' }, h('span', null, 'A few words'), words, count),
        h('div', { class: 'btns' }, h('button', { class: 'btn sm', type: 'button', disabled: ri === 0, onclick: () => move(-1) }, 'Move row up'), h('button', { class: 'btn sm', type: 'button', disabled: ri === b.rows.length - 1, onclick: () => move(1) }, 'Move row down'))),
      actions: [h('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close() }, 'Cancel'), h('button', { class: 'btn primary', type: 'button', onclick: () => {
        if (photo) r.photo = photo; else delete r.photo;
        const t = words.value.trim(); if (t) r.text = t; else delete r.text;
        changed({ focus: b.id }); repaint(); dlg.close();
      } }, 'Save')],
    });
  }

  function addBoardDialog() {
    let kind = S.KINDS[0];
    const title = h('input', { class: 'in big', value: kind.title, autocomplete: 'off' });
    const sub = h('input', { class: 'in', placeholder: 'Optional, e.g. Men', autocomplete: 'off' });
    let touched = false;
    title.addEventListener('input', () => { touched = true; });
    const kinds = h('div', { class: 'kinds', role: 'radiogroup', 'aria-label': 'Kind of board' }, S.KINDS.map((k) => h('button', { type: 'button', role: 'radio', class: 'kind', 'aria-checked': k === kind ? 'true' : 'false', onclick: (e) => {
      kind = k; kinds.querySelectorAll('.kind').forEach((x) => x.setAttribute('aria-checked', 'false')); e.currentTarget.setAttribute('aria-checked', 'true');
      if (!touched) title.value = k.title;
    } }, h('b', null, k.label), h('small', null, k.hint), h('code', null, k.cols.map((c) => c.label).join(' · ')))));
    const create = () => {
      const nb = M.normaliseBoard({ title: title.value.trim() || kind.title, subtitle: sub.value.trim(), kind: kind.kind, cols: JSON.parse(JSON.stringify(kind.cols)), sort: kind.sort || 'asc', rows: [{ c: kind.cols.map(() => '') }] });
      const at = board() ? project.boards.indexOf(board()) + 1 : project.boards.length;
      project.boards.splice(at, 0, nb);
      ui.board = nb.id;
      d.close(); changed({ focus: nb.id });
      if (ui.step !== 'boards') go('boards'); else renderMain();
      setTimeout(() => { const i = document.querySelector('#grid input[data-r="0"]'); if (i) i.focus(); }, 60);
    };
    title.addEventListener('keydown', (e) => { if (e.key === 'Enter') create(); });
    const d = dialog({ title: 'Add a board', lead: 'Pick the shape that fits. You can rename the columns afterwards.', wide: true, body: h('div', null, kinds, h('div', { class: 'row2', style: 'margin-top:18px' }, field('Title', title), field('Subtitle', sub))),
      actions: [h('button', { class: 'btn ghost', type: 'button', onclick: () => d.close() }, 'Cancel'), h('button', { class: 'btn primary', type: 'button', onclick: create }, 'Add board')] });
  }

  async function importCSV() {
    const file = await pickFile('.csv,.tsv,.txt,text/csv');
    if (!file) return;
    const boards = M.boardsFromCSV(await readText(file));
    if (!boards.length) return toast('That spreadsheet needs a “Board” column and a “Name” column (Year, Subtitle and Detail are optional).', { error: true, ms: 9000 });
    const n = boards.reduce((s, b) => s + b.rows.length, 0);
    if (!(await confirmBox('Add these boards?', `Found ${plural(boards.length, 'board')} with ${plural(n, 'name')}: ${boards.slice(0, 5).map((b) => b.title + (b.subtitle ? ' (' + b.subtitle + ')' : '')).join(', ')}${boards.length > 5 ? '…' : ''}.`, 'Add them'))) return;
    project.boards.push(...boards);
    ui.board = boards[0].id;
    changed(); renderMain();
    toast(`Added ${plural(boards.length, 'board')}.`, { action: { label: 'Undo', fn: undo } });
  }

  // ---------------------------------------------------------------------------------- look
  function viewLook() {
    const L = project.look;
    const b0 = project.boards.find((b) => b.rows.length) || { title: 'Club Champions', rows: [] };
    const ni = M.colIndex(b0, 'name'), yi = M.colIndex(b0, 'year');
    const r0 = b0.rows[b0.rows.length - 1];
    const sample = r0 ? `${yi >= 0 ? r0.c[yi] + '  ' : ''}${ni >= 0 ? r0.c[ni] : ''}` : '1987  A. B. Jones';
    const themes = [['timber', 'Timber & gold', 'Gold leaf on a timber board, like the real thing.'], ['heritage', 'Heritage', 'Ink on paper or stone. Quiet and formal.'], ['modern', 'Modern', 'Big, bold type in your club colours.']];
    const pick = (t) => { L.theme = t; changed(); renderMain(); };
    const tcards = h('div', { class: 'themes', role: 'radiogroup', 'aria-label': 'Style' }, themes.map(([id, name, sub]) => h('button', { type: 'button', role: 'radio', class: 'theme', 'aria-checked': L.theme === id ? 'true' : 'false', onclick: () => pick(id) },
      h('div', { class: 'sw sw-' + id, style: id === 'modern' ? `background:${L.bg};border-left-color:${L.accent}` : null }, h('i', null, (b0.subtitle || 'Honours').toUpperCase()), h('b', null, id === 'heritage' ? b0.title : b0.title.toUpperCase()), h('span', null, sample)),
      h('div', null, h('strong', null, name), h('small', null, sub)))));
    const opts = h('div');
    if (L.theme === 'timber') {
      const woods = [['rimu', 'Rimu', '#a04c27'], ['oak', 'Oak', '#ad7c3e'], ['walnut', 'Walnut', '#6e4a31']];
      opts.append(h('span', { class: 'lbl' }, 'Timber'), h('div', { class: 'swatches', role: 'radiogroup', 'aria-label': 'Timber' }, woods.map(([id, nm, c]) => h('button', { type: 'button', role: 'radio', class: 'swatch', 'aria-checked': L.wood === id ? 'true' : 'false', onclick: () => { L.wood = id; changed(); renderMain(); } }, h('i', { class: 'sw-wood', style: `background-color:${c}` }), nm))));
    } else if (L.theme === 'heritage') {
      const papers = [['ivory', 'Ivory & navy', '#efe5cf'], ['stone', 'Stone & bronze', '#d9d6cf']];
      opts.append(h('span', { class: 'lbl' }, 'Paper'), h('div', { class: 'swatches', role: 'radiogroup', 'aria-label': 'Paper' }, papers.map(([id, nm, c]) => h('button', { type: 'button', role: 'radio', class: 'swatch', 'aria-checked': L.paper === id ? 'true' : 'false', onclick: () => { L.paper = id; changed(); renderMain(); } }, h('i', { class: 'sw-paper', style: `background-color:${c}` }), nm))));
    } else {
      const pairs = [['#0d1b2a', '#e0b43a'], ['#111111', '#ffffff'], ['#0f3d2e', '#e7c84b'], ['#5a0f1e', '#ffffff'], ['#0b2f6b', '#ffffff'], ['#b3121f', '#111111'], ['#14213d', '#fca311'], ['#f4f1ea', '#0b2f6b'], ['#ffffff', '#c8102e']];
      const bg = h('input', { type: 'color', value: L.bg }), ac = h('input', { type: 'color', value: L.accent });
      const contrastNote = h('p', { class: 'hint' });
      const check = () => { const lum = (x) => { const n = parseInt(x.slice(1), 16); const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }; const a = lum(L.bg), b = lum(L.accent); const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); contrastNote.textContent = ratio < 2.2 ? 'Those two colours are close, so the accent will switch to plain white or black to stay readable.' : ''; };
      bg.addEventListener('input', () => { L.bg = bg.value; check(); changed({ typing: true }); });
      ac.addEventListener('input', () => { L.accent = ac.value; check(); changed({ typing: true }); });
      bg.addEventListener('change', () => renderMain()); ac.addEventListener('change', () => renderMain());
      check();
      opts.append(h('span', { class: 'lbl' }, 'Club colours'), h('div', { class: 'pairs', role: 'radiogroup', 'aria-label': 'Colour pairs' }, pairs.map(([x, y]) => h('button', { type: 'button', role: 'radio', class: 'pair', 'aria-checked': L.bg === x && L.accent === y ? 'true' : 'false', 'aria-label': `Background ${x}, accent ${y}`, style: `background:${x}`, onclick: () => { L.bg = x; L.accent = y; changed(); renderMain(); } }, h('span'), h('span', { style: `background:${y}` })))),
        h('div', { class: 'colors' }, h('label', null, bg, 'Background'), h('label', null, ac, 'Accent')), contrastNote);
    }
    return h('div', { class: 'view' },
      head('Step 3', 'Look', 'Pick a style. The preview shows it with your own names.'),
      card(tcards), card(opts),
      card(toggle('Names in capitals', 'Traditional for honours boards. Turn off to show names as typed.', L.caps, (v) => { L.caps = v; changed(); })));
  }

  // ---------------------------------------------------------------------------------- screen
  function viewScreen() {
    const sc = project.screen;
    const out = h('output', { style: 'font-weight:600;min-width:7ch;white-space:nowrap' }, `${sc.seconds} seconds`);
    const range = h('input', { type: 'range', min: 6, max: 30, step: 1, value: sc.seconds, 'aria-label': 'Seconds per page', style: 'width:100%;accent-color:var(--ink)' });
    range.addEventListener('input', () => { sc.seconds = +range.value; out.textContent = `${sc.seconds} seconds`; changed({ typing: true }); });
    const latest = M.latestYear(project);
    const feats = project.boards.reduce((n, b) => n + b.rows.filter((r) => r.photo || r.text).length, 0);
    const lic = isLicensed();
    const trade = lic && licence.tier === 'trade';
    return h('div', { class: 'view' },
      head('Step 4', 'TV screen', 'How the slideshow behaves on your clubhouse TV.', h('button', { class: 'btn', type: 'button', onclick: () => openFull('screen') }, svg(I.eye), 'Try it full size')),
      card(h('span', { class: 'lbl' }, 'Time on each page'), h('div', { style: 'display:flex;gap:16px;align-items:center' }, range, out), h('small', { class: 'hint' }, 'Long lists get a few extra seconds automatically.')),
      card(
        toggle('Cover slide', 'Your crest and name between each loop.', sc.cover, (v) => { sc.cover = v; changed(); }),
        toggle(latest ? `${latest} honours` : 'This year’s honours', latest ? `A slide of everyone honoured in ${latest}, the latest year on your boards.` : 'Appears once your boards have years.', sc.spotlight, (v) => { sc.spotlight = v; changed(); }),
        toggle('Photo and story slides', feats ? `${plural(feats, 'person', 'people')} with a photo or a few words get their own slide.` : 'Add a photo or a few words to a name (the picture button on each row) to give them their own slide.', sc.features, (v) => { sc.features = v; changed(); }),
        toggle('QR code to your website', project.org.url ? 'So members can look themselves up on their phones.' : 'Add your website address in Step 1 first.', sc.qr && !!project.org.url, (v) => { sc.qr = v; changed(); }, !project.org.url),
        toggle('Clock', 'A small clock in the corner.', sc.clock, (v) => { sc.clock = v; changed(); }),
        toggle('Small “Laurel” mark', !lic ? 'Trial files show a “Laurel trial” ribbon instead.' : trade ? 'A tiny credit at the bottom edge. Your Trade licence lets you turn it off.' : 'A tiny credit at the bottom edge. A Trade licence can remove it.', trade ? sc.credit : true, (v) => { sc.credit = v; changed(); }, !trade)),
      card(h('h2', null, 'Boards on the TV'), h('p', null, 'Untick a board to keep it on the website only.'),
        ...project.boards.map((b) => toggle(b.title + (b.subtitle ? ' · ' + b.subtitle : ''), plural(b.rows.filter((r) => r.c.join('') !== '').length, 'name'), b.screen, (v) => { b.screen = v; changed(); }))));
  }

  // ---------------------------------------------------------------------------------- publish
  function exportFile(mode) { return X.boardHTML(project, { assets: A, mode, licence: exportLicence() }); }
  function fileBase() { return X.fileSlug(project) + '-honours'; }
  function openFull(mode) {
    const w = window.open('', '_blank');
    const url = URL.createObjectURL(new Blob([exportFile(mode)], { type: 'text/html;charset=utf-8' }));
    if (w) w.location.href = url + (mode === 'screen' ? '#screen' : ''); else toast('Your browser blocked the new window. Allow pop-ups for this page and try again.', { error: true });
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  function viewPublish() {
    const lic = isLicensed();
    const names = M.countNames(project);
    const size = new Blob([exportFile('browse')]).size;
    const outs = [
      ['screen', I.tv, 'For a TV', 'A slideshow for the clubhouse TV, landscape or portrait. Open it on a laptop or mini PC plugged into the TV and press F.', fileBase() + '-tv.html', 'tv'],
      ['browse', I.web, 'For your website', 'A searchable page members can use from home. Upload it to your website, or ask whoever looks after your site.', fileBase() + '.html', 'website'],
      ['kiosk', I.touch, 'For a touchscreen', 'Plays the slideshow until someone touches it, then lets them search. Returns to the slideshow on its own.', fileBase() + '-touchscreen.html', 'touchscreen'],
    ];
    return h('div', { class: 'view wide' },
      head('Step 5', 'Save & publish', `${plural(project.boards.length, 'board')}, ${plural(names, 'name')}. Download the file for where it’s going.`),
      lic ? h('p', { class: 'note ok' }, `Licensed${licence.customer ? ' to ' + licence.customer : ''}. Your files are ready to use.`)
        : h('p', { class: 'note' }, 'You’re using the free trial. Everything works, and files show a small “Laurel trial” ribbon. A licence is one payment, no subscription, and removes it. ', h('a', { href: SHOP.buyUrl, target: '_blank', rel: 'noopener' }, 'See prices'), ' · ', h('a', { href: '#', onclick: (e) => { e.preventDefault(); licenceDialog(); } }, 'Enter a licence key')),
      h('div', { class: 'outs', style: 'margin-top:16px' }, outs.map(([mode, icon, title, sub, name, anchor]) => h('div', { class: 'out' }, svg(icon), h('h3', null, title), h('p', null, sub),
        h('button', { class: 'btn primary', type: 'button', onclick: () => { download(name, exportFile(mode)); toast(`Downloaded ${name}.`, { action: { label: 'How to set it up', fn: () => window.open(SHOP.guide + '#' + anchor, '_blank', 'noopener') } }); } }, svg(I.down), 'Download'),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => openFull(mode) }, 'Open it here first'),
        h('a', { class: 'more', href: SHOP.guide + '#' + anchor, target: '_blank', rel: 'noopener' }, 'Step-by-step setup ↗')))),
      h('p', { class: 'sizes', style: 'margin:10px 2px 0' }, `Each file is about ${kb(size)} and works offline: fonts, pictures and names are all inside it.`),
      card(h('h2', null, 'Keep a backup'), h('p', null, 'Your work saves in this browser, but browsers can be cleared. Keep a backup somewhere safe, like the club’s shared drive. To update next season, open the backup (or any board file) here, add the new names and download again.'),
        h('div', { class: 'btns' },
          h('button', { class: 'btn', type: 'button', onclick: () => download(`${X.fileSlug(project)}-laurel-backup-${today()}.json`, JSON.stringify(project, null, 1), 'application/json') }, svg(I.down), 'Download a backup'),
          h('button', { class: 'btn', type: 'button', onclick: () => download(`${X.fileSlug(project)}-honours.csv`, '\uFEFF' + M.toCSV(project), 'text/csv;charset=utf-8') }, svg(I.down), 'Download as a spreadsheet (CSV)'))),
      lic && licence.tier === 'trade' ? card(toggle('“Made with Laurel” on the website page', 'Your Trade licence lets you turn off the credit at the foot of the website and touchscreen pages.', project.web.credit, (v) => { project.web.credit = v; changed(); })) : null,
      card(h('h2', null, 'Keep a copy of the editor'), h('p', null, 'The editor is a single file too. Save it with your backup and you can keep updating your boards even without the internet, or if this website ever changes.'),
        h('div', { class: 'btns' }, h('button', { class: 'btn', type: 'button', onclick: saveEditor }, svg(I.down), 'Download the editor'))));
  }

  async function saveEditor() {
    try {
      const r = await fetch(location.href.split('#')[0], { cache: 'no-store' });
      if (!r.ok) throw new Error(String(r.status));
      download('laurel-editor.html', await r.text());
      toast('Saved laurel-editor.html. Open it in Chrome, Edge, Safari or Firefox; it works offline.');
    } catch (e) {
      toast(location.protocol === 'file:' ? 'You’re already using a saved copy of the editor. Copy this file to keep another.' : 'Couldn’t download the editor just now. Try again when you’re online.', { error: location.protocol !== 'file:' });
    }
  }

  // ---------------------------------------------------------------------------------- licence dialog
  function licenceDialog() {
    if (isLicensed()) {
      const d = dialog({ title: licence.tier === 'trade' ? 'Trade licence' : 'Club licence', lead: `Active${licence.customer ? ' for ' + licence.customer : ''}${licence.variant ? ' · ' + licence.variant : ''}. Files you download don’t show the trial ribbon.`,
        body: h('p', { class: 'hint' }, 'Moving to a different computer? Deactivate here first so the key is free to use there.'),
        actions: [h('button', { class: 'btn danger', type: 'button', onclick: async () => {
          try { await deactivate(false); } catch (e) {
            if (!(await confirmBox('Couldn’t reach the licence server', e.message + ' Remove the licence from this browser anyway?', 'Remove it', true))) return;
            await deactivate(true);
          }
          d.close(); refreshTop(); renderMain(); preview(); toast('Licence removed from this computer.');
        } }, 'Deactivate on this computer'), h('button', { class: 'btn primary', type: 'button', onclick: () => d.close() }, 'Done')] });
      return;
    }
    const inp = h('input', { class: 'in big', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Licence key' });
    const msg = h('p', { class: 'hint', role: 'alert' });
    const go_ = h('button', { class: 'btn primary', type: 'button', onclick: async () => {
      go_.disabled = true; go_.textContent = 'Checking…'; msg.textContent = '';
      try {
        await activate(inp.value);
        d.close(); refreshTop(); renderMain(); preview();
        toast('Thank you! Your licence is active. Download your files again to drop the trial ribbon.', { ms: 7000 });
      } catch (e) { msg.textContent = e.message; msg.style.color = 'var(--red)'; go_.disabled = false; go_.textContent = 'Activate'; }
    } }, 'Activate');
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go_.click(); });
    const d = dialog({ title: 'Free trial', lead: 'Everything works in the trial; downloaded files show a small “Laurel trial” ribbon. Buy a licence once and it’s gone for good.',
      body: h('div', null, h('p', { class: 'btns', style: 'margin:0 0 18px' }, h('a', { class: 'btn gold', href: SHOP.buyUrl, target: '_blank', rel: 'noopener' }, 'See prices and buy')),
        h('label', { class: 'f' }, h('span', null, 'Already bought? Enter your licence key'), inp, h('small', null, 'It’s in the receipt email. The editor checks it once online; after that it works offline.')), msg),
      actions: [h('button', { class: 'btn ghost', type: 'button', onclick: () => d.close() }, 'Not now'), go_] });
    setTimeout(() => inp.focus(), 30);
  }

  // ---------------------------------------------------------------------------------- preview
  const PV = { frame: null, ready: false, qrUrl: null, qr: '', box: null, stage: null };
  const PVM = {
    tv: { w: 1920, h: 1080, mode: 'screen', cls: 'tv', label: 'TV' },
    portrait: { w: 1080, h: 1920, mode: 'screen', cls: 'tv', label: 'Portrait TV' },
    web: { w: 1280, h: 860, mode: 'browse', cls: '', label: 'Website' },
    phone: { w: 390, h: 800, mode: 'browse', cls: 'phone', label: 'Phone' },
    kiosk: { w: 1920, h: 1080, mode: 'kiosk', cls: 'tv', label: 'Touchscreen' },
  };
  function qr() {
    const u = project.org.url;
    if (u !== PV.qrUrl) { PV.qrUrl = u; PV.qr = u ? X.qrSvg(u) : ''; }
    return PV.qr;
  }
  function buildPreview() {
    if (!project) { pvEl.replaceChildren(); PV.frame = null; return; }
    PV.ready = false;
    const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Preview as' }, Object.keys(PVM).map((k) => h('button', { type: 'button', 'aria-pressed': ui.pv === k ? 'true' : 'false', onclick: () => { ui.pv = k; seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false')); seg.children[Object.keys(PVM).indexOf(k)].setAttribute('aria-pressed', 'true'); fit(); send(); } }, PVM[k].label)));
    PV.frame = h('iframe', { title: 'Live preview of your board', sandbox: 'allow-scripts allow-popups', tabindex: '-1' });
    PV.frame.srcdoc = X.boardHTML(project, { assets: A, mode: PVM[ui.pv].mode, preview: true, licence: exportLicence() });
    PV.box = h('div', { class: 'pv-box' }, PV.frame);
    PV.stage = h('div', { class: 'pv-stage' }, PV.box);
    pvEl.replaceChildren(h('div', { class: 'pv-bar' }, seg, h('span', { class: 'spacer' }), h('button', { class: 'btn ghost sm pv-toggle', type: 'button', onclick: togglePreview }, 'Close')), PV.stage,
      h('div', { class: 'pv-foot' }, h('span', null, 'Live preview. Keys ← → step through the TV slides.'), h('button', { class: 'btn sm', type: 'button', onclick: () => openFull(PVM[ui.pv].mode) }, 'Open full size ↗')));
    fit();
    if (window.ResizeObserver) { if (PV.ro) PV.ro.disconnect(); PV.ro = new ResizeObserver(() => fit()); PV.ro.observe(PV.stage); }
  }
  function fit() {
    if (!PV.frame || !PV.stage) return;
    const m = PVM[ui.pv];
    const pad = m.cls ? 20 : 0;
    const W = PV.stage.clientWidth - 36, H = PV.stage.clientHeight - 36;
    if (W <= 0 || H <= 0) return;
    const k = Math.min((W - pad) / m.w, (H - pad) / m.h, 1);
    PV.box.className = 'pv-box ' + m.cls;
    PV.box.style.width = Math.round(m.w * k + pad) + 'px';
    PV.box.style.height = Math.round(m.h * k + pad) + 'px';
    PV.frame.style.width = m.w + 'px';
    PV.frame.style.height = m.h + 'px';
    PV.frame.style.transform = `scale(${k})`;
  }
  function send(focus) {
    if (!PV.ready || !PV.frame || !project) return;
    PV.frame.contentWindow.postMessage({ laurel: 'project', project: JSON.parse(snapshot()), qr: qr(), licence: exportLicence(), mode: PVM[ui.pv].mode, focus: focus || null }, '*');
  }
  const previewSoon = debounce((focus) => send(focus), 220);
  function preview() { send(); }
  function togglePreview() { ui.pvOpen = !ui.pvOpen; refreshTop(); setTimeout(fit, 30); }
  window.addEventListener('message', (e) => {
    if (!PV.frame || e.source !== PV.frame.contentWindow || !e.data) return;
    if (e.data.laurel === 'ready') { PV.ready = true; send(ui.step === 'boards' ? ui.board : null); }
  });

  // ---------------------------------------------------------------------------------- keys & boot
  document.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod || !project) return;
    const k = e.key.toLowerCase();
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
    else if (k === 's') { e.preventDefault(); save(); toast('Saved in this browser. Download a backup to keep a copy elsewhere.', { action: { label: 'Back up now', fn: () => go('publish') } }); }
  });
  window.addEventListener('beforeunload', () => { if (saveTimer) save(); });

  async function boot() {
    shell();
    try { await Store.init(); } catch (e) { /* memory mode */ }
    try { licence = (await Store.meta('licence')) || null; } catch (e) { licence = null; }
    let cur = null;
    try {
      const id = await Store.meta('current');
      if (id) cur = await Store.get(id);
      if (!cur) { const all = await Store.list(); all.sort((a, b) => String(b.updated).localeCompare(String(a.updated))); cur = all[0] || null; }
    } catch (e) { cur = null; }
    if (cur) {
      project = M.normaliseProject(cur);
      ui.board = project.boards[0] ? project.boards[0].id : null;
      let step = null;
      try { step = await Store.meta('step'); } catch (e) { step = null; }
      ui.step = STEPS.some((s) => s[0] === step) ? step : 'club';
    }
    resetHist();
    render();
    buildPreview();
    // Links from the Laurel pages: #example opens the sample club, #template=golf starts that template.
    const hash = location.hash.replace(/^#/, '');
    const tpl = (hash.match(/^template=([a-z]+)$/) || [])[1];
    if (hash === 'example' || (tpl && S.TEMPLATES[tpl])) {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ }
      if (hash === 'example') open(S.golfClub(), 'boards');
      else if (!project) startFrom(tpl);
      else toast(`Start a new ${S.TEMPLATES[tpl].label.toLowerCase()} board?`, { action: { label: 'Start', fn: () => startFrom(tpl) }, ms: 9000 });
    }
    if (Store.mode === 'memory') toast('This browser won’t let Laurel save your work. Keep the tab open and download a backup before you close it.', { error: true, ms: 12000 });
    recheck();
  }
  // a couple of hooks for the automated tests
  window.__laurel = { get project() { return project; }, get licence() { return licence; }, exportFile, go, open };
  boot();
})();
