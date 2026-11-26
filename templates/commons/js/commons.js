/* The Commons, show home. Vanilla JS. All dates are worked out in New Zealand time.
   One file for every page: each init below checks that its elements are on the page and does nothing when they are not.
   Shared helpers are published on window.Commons for a page script (pages.js) to use. */
(function () {
  'use strict';
  var D = window.COMMONS;
  if (!D) return;
  var doc = document, root = doc.documentElement;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function h(tag, attrs, kids) {
    var e = doc.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k]; else if (k === 'html') e.innerHTML = attrs[k];
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c); });
    return e;
  }
  var KEY = 'commons.v1', KEYI = 'commons.img', KEYS = 'commons.seat', KEYN = 'commons.notice';
  function sget(k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function sset(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage can be blocked */ } }
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Time, in New Zealand ---------- */
  var DOWS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var tzFmt = new Intl.DateTimeFormat('en-NZ', { timeZone: D.tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
  function nowMs() { return new Date().getTime(); }
  function nzParts(ms) {
    var o = {};
    tzFmt.formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = parseInt(p.value, 10); });
    return { y: o.year, m: o.month, d: o.day, h: o.hour % 24, mi: o.minute };
  }
  function dayNum(y, m, d) { return Math.round(Date.UTC(y, m - 1, d) / 864e5); }
  function civil(n) { var t = new Date(n * 864e5); return { n: n, y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), dow: t.getUTCDay() }; }
  function nzToMs(c, hh, mi) {
    var g = Date.UTC(c.y, c.m - 1, c.d, hh, mi);
    var p = nzParts(g), r = g - (Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi) - g);
    var p2 = nzParts(r);
    return g - (Date.UTC(p2.y, p2.m - 1, p2.d, p2.h, p2.mi) - r);
  }
  function today(ms) { var p = nzParts(ms); return { c: civil(dayNum(p.y, p.m, p.d)), min: p.h * 60 + p.mi }; }
  function hm(s) { var a = s.split(':'); return [parseInt(a[0], 10), parseInt(a[1], 10)]; }
  function fmtT(s, mer) {
    var a = hm(s), hh = a[0], m = a[1];
    if (hh === 12 && m === 0) return 'noon';
    return (hh % 12 || 12) + (m ? '.' + (m < 10 ? '0' + m : m) : '') + (mer ? (hh < 12 ? 'am' : 'pm') : '');
  }
  function range(s, e) {
    if (e === '12:00') return fmtT(s, true) + ' to noon';
    return ((hm(s)[0] < 12) === (hm(e)[0] < 12)) ? fmtT(s, false) + ' to ' + fmtT(e, true) : fmtT(s, true) + ' to ' + fmtT(e, true);
  }
  function dateLong(c) { return DOWS[c.dow] + ' ' + c.d + ' ' + MONS[c.m - 1]; }
  function isClosed(c) {
    var md = c.m * 100 + c.d, f = D.closure.from[0] * 100 + D.closure.from[1], t = D.closure.to[0] * 100 + D.closure.to[1];
    return md >= f || md <= t;
  }
  function occurs(s, c) {
    if (isClosed(c)) return false;
    var r = s.rule;
    if (r.type === 'weekly') return r.dows.indexOf(c.dow) > -1;
    if (r.type === 'nth') return c.dow === r.dow && Math.ceil(c.d / 7) === r.n;
    if (r.type === 'alt') return c.dow === r.dow && Math.abs(Math.round((c.n - dayNum(r.anchor[0], r.anchor[1], r.anchor[2])) / 7)) % 2 === 0;
    return false;
  }
  function sessionsOn(c) {
    return D.sessions.filter(function (s) { return occurs(s, c); }).sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });
  }
  function events(ms, from, to) {
    var t = today(ms).c.n, out = [];
    for (var i = from; i <= to; i++) {
      var c = civil(t + i);
      sessionsOn(c).forEach(function (s) {
        var a = hm(s.start), b = hm(s.end), o = hm(s.open || s.start);
        out.push({ s: s, c: c, st: nzToMs(c, a[0], a[1]), en: nzToMs(c, b[0], b[1]), op: nzToMs(c, o[0], o[1]) });
      });
    }
    return out.sort(function (a, b) { return a.st - b.st; });
  }
  function nextOf(id, ms) {
    var all = events(ms, 0, 400);
    for (var i = 0; i < all.length; i++) if (all[i].s.id === id && all[i].en > ms) return all[i];
    return null;
  }
  function sessionById(id) { return D.sessions.filter(function (s) { return s.id === id; })[0]; }
  var KAI = sessionById('kai');

  /* ---------- Customisation (name, town, colours, type, images) ---------- */
  var custom = sget(KEY) || {};
  var imgs = sget(KEYI) || {};
  var logoMark0 = $('.site-header .logo-mark'), heroImg = $('#hero-img');
  var orig = { logo: logoMark0 ? logoMark0.outerHTML : '', heroSrc: heroImg ? heroImg.getAttribute('src') : '', heroSet: heroImg ? heroImg.getAttribute('srcset') : '' };
  var pageMeta = $('meta[name="commons:page-title"]'), pageTitle = pageMeta ? pageMeta.getAttribute('content') : '';
  var fontLoaded = {};
  window.layoutMapReady = false;
  function loadType(t) {
    var def = D.types[t];
    if (!def || !def.css || fontLoaded[t]) return;
    fontLoaded[t] = true;
    var l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=' + def.css + '&display=swap';
    doc.head.appendChild(l);
  }
  function applyOrg() {
    var name = (custom.org || '').trim(), town = (custom.town || '').trim();
    var short = name || D.org.name, full = name || D.org.full, tn = town || D.org.town;
    $$('[data-org]').forEach(function (e) { e.textContent = short; });
    $$('[data-org-full]').forEach(function (e) { e.textContent = full; });
    $$('[data-town]').forEach(function (e) { e.textContent = tn; });
    doc.title = pageTitle ? pageTitle + ', ' + full : full + ', ' + tn;
    root.classList.toggle('long-name', short.length > 14);
    root.classList.remove('pending');
    if (window.layoutMapReady) layoutMap();
  }
  function applyLook() {
    if (custom.palette && custom.palette !== 'kitchen') root.dataset.palette = custom.palette; else delete root.dataset.palette;
    if (custom.type && custom.type !== 'table') { root.dataset.type = custom.type; loadType(custom.type); } else delete root.dataset.type;
  }
  function applyImages() {
    $$('.logo-mark').forEach(function (m) {
      var p = m.parentNode, n;
      if (imgs.logo) { n = h('img', { 'class': 'logo-mark', src: imgs.logo, alt: '' }); }
      else { var t = doc.createElement('div'); t.innerHTML = orig.logo; n = t.firstChild; }
      p.replaceChild(n, m);
    });
    var hi = $('#hero-img');
    if (hi) {
      if (imgs.photo) { hi.removeAttribute('srcset'); hi.src = imgs.photo; }
      else { hi.src = orig.heroSrc; hi.setAttribute('srcset', orig.heroSet); }
    }
    root.classList.remove('pending');
  }
  function saveCustom() { sset(KEY, custom); }
  applyLook(); applyOrg(); applyImages();

  /* ---------- Notice, hero line, find-us status (all clock driven) ---------- */
  function whenWord(ev, td) {
    var diff = ev.c.n - td.c.n;
    return diff === 0 ? (hm(ev.s.start)[0] >= 17 ? 'tonight' : 'today') : 'tomorrow';
  }
  function noticeText(ms) {
    var td = today(ms), ev = events(ms, -1, 3), on = null, nx = null, i;
    for (i = 0; i < ev.length; i++) { if (ev[i].st <= ms && ms < ev[i].en) { on = ev[i]; break; } }
    if (on) return on.s.name + ' ' + (on.s.verb === 'is open' ? 'is open' : 'is on') + ' now, until ' + fmtT(on.s.end, true) + '.';
    for (i = 0; i < ev.length; i++) { if (ev[i].st > ms && ev[i].st - ms <= 24 * 36e5) { nx = ev[i]; break; } }
    if (nx) return nx.s.name + ' ' + nx.s.verb + ' ' + whenWord(nx, td) + ', ' + range(nx.s.start, nx.s.end) + '.';
    var kn = nextOf('kai', ms);
    if (!kn) return 'Closed today.';
    var far = kn.c.n - td.c.n > 6;
    var when = far ? dateLong(kn.c) : DOWS[kn.c.dow];
    if (isClosed(td.c)) return 'Closed for ' + D.closure.label + '. Kai Night is back on ' + when + ' at ' + fmtT(KAI.start, true) + '.';
    return 'Closed today. Kai Night is ' + when + ' at ' + fmtT(KAI.start, true) + '.';
  }
  function heroLine(ms) {
    var td = today(ms), kn = nextOf('kai', ms);
    if (!kn) return 'There’s a seat for you at Kai Night.';
    if (kn.c.n === td.c.n) return 'There’s a seat for you tonight.';
    if (kn.c.n - td.c.n > 7) return 'There’s a seat for you from ' + kn.c.d + ' ' + MONS[kn.c.m - 1] + '.';
    return 'There’s a seat for you on Tuesday.';
  }
  function openText(ms) {
    var td = today(ms), ev = events(ms, -1, 10), i;
    for (i = 0; i < ev.length; i++) if (ev[i].op <= ms && ms < ev[i].en) return { open: true, text: 'Open now, until ' + fmtT(ev[i].s.end, true) + '.' };
    for (i = 0; i < ev.length; i++) if (ev[i].op > ms) {
      var e = ev[i], diff = e.c.n - td.c.n, when = diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : diff < 7 ? DOWS[e.c.dow] : dateLong(e.c);
      var o = fmtT(e.s.open || e.s.start, true);
      return { open: false, text: (isClosed(td.c) ? 'Closed for ' + D.closure.label + '. Opens ' : 'Closed now. Opens ') + when + ' at ' + o + '.' };
    }
    return { open: false, text: 'Closed now.' };
  }
  function refreshClock() {
    var ms = nowMs();
    var nt = $('#notice-text'), h1 = $('#h1'), ot = $('#open-text'), os = $('#open-state');
    if (nt) nt.textContent = noticeText(ms);
    if (h1) h1.textContent = heroLine(ms);
    heroLive();
    if (ot && os) { var o = openText(ms); ot.textContent = o.text; os.classList.toggle('is-open', o.open); }
    var sig = today(ms).c.n + '|' + events(ms, 0, 0).map(function (e) { return e.s.id + (e.st <= ms && ms < e.en ? 1 : 0); }).join(',');
    if (sig !== refreshClock.sig) { refreshClock.sig = sig; if (refreshClock.week) refreshClock.week(); }
  }
  var noticeEl = $('#notice'), noticeX = $('#notice-x');
  if (noticeEl && sget(KEYN)) noticeEl.hidden = true;
  if (noticeEl && noticeX) noticeX.addEventListener('click', function () { noticeEl.hidden = true; sset(KEYN, 1); var l = $('.site-header .logo'); if (l) l.focus(); });

  /* ---------- Menu ---------- */
  var menu = $('#menu'), menuBtn = $('#menu-btn');
  if (menu && menuBtn) {
    menuBtn.addEventListener('click', function () { menu.showModal(); });
    $('#menu-x').addEventListener('click', function () { menu.close(); });
    menu.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) menu.close(); });
    menu.addEventListener('close', function () { menuBtn.focus(); });
    window.addEventListener('resize', function () { if (menu.open && getComputedStyle(menuBtn).display === 'none') menu.close(); });
  }

  /* ---------- Dialog helpers ---------- */
  function wireDialog(dlg) {
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
  }
  $$('.dlg').forEach(wireDialog);

  /* ---------- Error messages: an input points at its message only while the message is showing ---------- */
  var errLinks = {};
  function setErrRef(err) {
    (errLinks[err.id] || []).forEach(function (i) {
      var ids = (i.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (t) { return t && t !== err.id; });
      if (!err.hidden) ids.push(err.id);
      if (ids.length) i.setAttribute('aria-describedby', ids.join(' ')); else i.removeAttribute('aria-describedby');
    });
  }
  function linkErrors(scope) {
    $$('.err[id]', scope || doc).forEach(function (err) {
      var inputs = $$('[aria-describedby~="' + err.id + '"]', scope || doc);
      if (!inputs.length && !errLinks[err.id]) return;
      errLinks[err.id] = errLinks[err.id] || [];
      inputs.forEach(function (i) { if (errLinks[err.id].indexOf(i) < 0) errLinks[err.id].push(i); });
      setErrRef(err);
    });
  }
  linkErrors();
  if (window.MutationObserver) new MutationObserver(function (list) {
    list.forEach(function (m) { if (m.target.id && errLinks[m.target.id]) setErrRef(m.target); });
  }).observe(doc.body, { attributes: true, attributeFilter: ['hidden'], subtree: true });

  /* ---------- ICS ---------- */
  function icsEsc(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
  function zstamp(ms) { return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  function orgFull() { return (custom.org || '').trim() || D.org.full; }
  function townName() { return (custom.town || '').trim() || D.org.town; }
  function downloadIcs(title, st, en, desc, file) {
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Singh Studio//The Commons show home//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      'UID:' + st + '-' + file + '@commons.demo', 'DTSTAMP:' + zstamp(nowMs()), 'DTSTART:' + zstamp(st), 'DTEND:' + zstamp(en),
      'SUMMARY:' + icsEsc(title), 'LOCATION:' + icsEsc(orgFull() + ', ' + D.org.street + ', ' + townName()), 'DESCRIPTION:' + icsEsc(desc), 'END:VEVENT', 'END:VCALENDAR'];
    var blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    var a = h('a', { href: URL.createObjectURL(blob), download: file + '.ics' });
    doc.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }

  /* ---------- The tables (three trestles, seen from above) ---------- */
  /* Seat id = table * 30 + side * 15 + column. Side 0 is the top (or left) row, side 1 the other. */
  var PROPS = [[['pie', 22], ['flowers', 52], ['board', 80]], [['jug', 20], ['board', 50], ['pie', 80]], [['flowers', 30], ['jug', 70]]];
  function pp(cx, cy, r, deg) { var a = deg * Math.PI / 180; return (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2); }
  function propSvg(kind) {
    var o = '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">', i;
    if (kind === 'pie') {
      var a0 = -12, a1 = 288, st = 12, n = Math.round((a1 - a0) / st), dd = 'M' + pp(32, 32, 17, a0) + 'L' + pp(32, 32, 26, a0), k;
      for (k = 1; k <= n; k++) dd += 'A3.3 3.3 0 0 1 ' + pp(32, 32, 26, a0 + k * st);
      dd += 'L' + pp(32, 32, 17, a1) + 'A17 17 0 1 0 ' + pp(32, 32, 17, a0) + 'Z';
      o += '<circle cx="32" cy="32" r="30" fill="var(--page)"/>';
      o += '<path d="' + dd + '" fill="var(--main)"/>';
      o += '<path d="M32 32L' + pp(32, 32, 17, a0) + 'A17 17 0 1 1 ' + pp(32, 32, 17, a1) + 'Z" fill="var(--second)"/>';
      [[110, 6, 9], [200, 6, 9], [285, 6, 9]].forEach(function (s) { o += '<path class="thin" d="M' + pp(32, 32, s[1] + 2, s[0]) + 'L' + pp(32, 32, s[1] + 2 + s[2], s[0]) + '" fill="none"/>'; });
      [[40, 12.5], [150, 12.5], [245, 12.5]].forEach(function (s) { o += '<circle class="thin" cx="' + pp(32, 32, s[1], s[0]).split(' ')[0] + '" cy="' + pp(32, 32, s[1], s[0]).split(' ')[1] + '" r="2.2" fill="var(--accent)"/>'; });
    } else if (kind === 'board') {
      o += '<rect x="44" y="26" width="19" height="12" rx="6" fill="var(--accent)"/><circle class="thin" cx="56" cy="32" r="2.6" fill="var(--soft)"/>';
      o += '<rect x="1.5" y="11" width="46" height="42" rx="6" fill="var(--accent)"/>';
      var sl = 'M1.5 20L1.5 10C-1 4 3 .5 8.5 .5C14 .5 18 4 15.5 10L15.5 20Z';
      [[3.5, 21, -6], [14.5, 20, 0], [25.5, 21, 6]].forEach(function (s) {
        o += '<g transform="translate(' + s[0] + ' ' + s[1] + ') scale(1.18) rotate(' + s[2] + ' 8.5 10)"><path d="' + sl + '" fill="var(--main)"/><path class="thin" d="' + sl + '" fill="var(--page)" transform="translate(3.1 3.6) scale(.64)"/></g>';
      });
    } else if (kind === 'flowers') {
      o += '<circle cx="32" cy="32" r="30" fill="var(--page)"/><circle class="thin" cx="32" cy="32" r="25.5" fill="none" opacity=".45"/>';
      for (i = 0; i < 7; i++) { var q = -90 + i * 360 / 7; o += '<circle cx="' + (32 + 15.5 * Math.cos(q * Math.PI / 180)).toFixed(2) + '" cy="' + (32 + 15.5 * Math.sin(q * Math.PI / 180)).toFixed(2) + '" r="8.2" fill="' + (i % 2 ? 'var(--second)' : 'var(--accent)') + '"/>'; }
      o += '<circle cx="32" cy="32" r="7.5" fill="var(--main)"/>';
    } else {
      o += '<rect x="45" y="19" width="18" height="26" rx="9" fill="var(--page)"/><rect class="thin" x="50.5" y="25" width="7" height="14" rx="3.5" fill="var(--soft)"/>';
      o += '<path d="M10 21L1 32L10 43Z" fill="var(--page)"/>';
      o += '<circle cx="29" cy="32" r="22" fill="var(--page)"/><circle class="thin" cx="29" cy="32" r="16" fill="var(--soft)"/><circle class="thin" cx="29" cy="32" r="9" fill="none" opacity=".35"/>';
    }
    return o + '</svg>';
  }
  function buildTables(host, plain) {
    var seats = [], t, c, s;
    for (t = 0; t < 3; t++) {
      var slab = h('div', { 'class': 'slab' }, [h('div', { 'class': 'runner' }, plain ? [] : [h('span', { 'class': 'tbl-name', text: 'Table ' + (t + 1) })])]);
      if (!plain) PROPS[t].forEach(function (p) { slab.appendChild(h('span', { 'class': 'prop', style: '--x:' + p[1] + '%', html: propSvg(p[0]) })); });
      var rows = [h('div', { 'class': 'trow a' }), h('div', { 'class': 'trow b' })];
      for (s = 0; s < 2; s++) for (c = 0; c < 15; c++) {
        var seat = h('span', { 'class': 'seat' }, [h('i', { 'class': 'chair' }), h('i', { 'class': 'plate' })]);
        rows[s].appendChild(seat); seats[t * 30 + s * 15 + c] = seat;
      }
      host.appendChild(h('div', { 'class': 'tbl' }, [h('div', { 'class': 'tbl-body' }, [slab, rows[0], rows[1]])]));
    }
    return seats;
  }
  function sid(t, s, c) { return t * 30 + s * 15 + c; }
  var FREE = [];
  [[0, 0, [3, 4, 5]], [0, 1, [9, 10]], [1, 0, [7, 8, 9, 10, 11, 12]], [2, 1, [2, 3, 4, 5]], [2, 0, [14]], [2, 1, [12]]].forEach(function (g) {
    g[2].forEach(function (c) { FREE.push(sid(g[0], g[1], c)); });
  });
  var seatsEl = $('#seats'), plates = [];
  var saved = sget(KEYS);
  var seatState = { n: 2, anchor: null };
  var seatInput = $('#seatn'), seatForm = $('#seatform'), seatSaved = $('#seatsaved'), seatStatus = $('#seatstatus');
  var NUM = ['zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
  function buildTable() {
    plates = buildTables(seatsEl);
    plates.forEach(function (p, i) { p.classList.add(FREE.indexOf(i) > -1 ? 'is-free' : 'is-taken'); p.dataset.id = i; });
    if (saved && saved.seats) saved.seats.forEach(function (i) { plates[i].classList.remove('is-free'); plates[i].classList.add('is-yours'); });
  }
  function freeLeft() { return FREE.filter(function (i) { return !(saved && saved.seats && saved.seats.indexOf(i) > -1); }); }
  /* Choose n seats, side by side where the tables allow it. */
  function choose(n, anchor) {
    var free = freeLeft(), set = {}, out = [];
    free.forEach(function (i) { set[i] = 1; });
    n = Math.min(n, free.length);
    function rowOf(i) { return Math.floor(i / 15); }
    function span(i) { var lo = i, hi = i, r = rowOf(i); while (set[lo - 1] && rowOf(lo - 1) === r) lo--; while (set[hi + 1] && rowOf(hi + 1) === r) hi++; return [lo, hi]; }
    function fill(list) { list.forEach(function (i) { if (out.length < n && out.indexOf(i) < 0) out.push(i); }); }
    if (anchor != null && set[anchor]) {
      var sp = span(anchor), start = Math.max(sp[0], Math.min(anchor, sp[1] - n + 1)), k;
      for (k = start; k <= sp[1] && out.length < n; k++) out.push(k);
      if (out.length < n) { var near = free.slice().sort(function (a, b) { return Math.abs(a - anchor) - Math.abs(b - anchor); }); fill(near); }
      return out;
    }
    var best = null, i2;
    for (i2 = 0; i2 < free.length; i2++) {
      var lo = free[i2]; if (set[lo - 1] && rowOf(lo - 1) === rowOf(lo)) continue;
      var sp2 = span(lo), len = sp2[1] - sp2[0] + 1;
      if (len >= n && (!best || len < best.len)) best = { lo: sp2[0], len: len };
    }
    if (best) { for (i2 = 0; i2 < n; i2++) out.push(best.lo + i2); return out; }
    var byTable = [0, 1, 2].map(function (t) { return free.filter(function (i) { return Math.floor(i / 30) === t; }); }).sort(function (a, b) { return b.length - a.length; });
    byTable.forEach(function (l) { fill(l); });
    return out;
  }
  function seatMeta() {
    var kn = nextOf('kai', nowMs());
    $('#seatmeta').textContent = kn ? 'Kai Night, ' + dateLong(kn.c) + ', ' + range(KAI.start, KAI.end) + '. ' + KAI.cost + '.' : 'Kai Night, Tuesday.';
    return kn;
  }
  function seatsLeftCount() { return D.counts.seats - D.counts.coming - (saved && saved.seats ? saved.seats.length : 0); }
  function heroLive() {
    var el = $('#hl-text'); if (!el) return;
    var ms = nowMs(), td = today(ms), kn = nextOf('kai', ms), left = seatsLeftCount(), when = 'on Tuesday';
    if (kn && kn.c.n === td.c.n) when = 'tonight'; else if (kn && kn.c.n - td.c.n > 7) when = 'on ' + dateLong(kn.c);
    el.textContent = left + (left === 1 ? ' seat left ' : ' seats left ') + when;
    var host = $('#hl-plates'); host.style.setProperty('--n', left);
    if (host.children.length !== left) { host.textContent = ''; for (var i = 0; i < left; i++) host.appendChild(h('i')); }
  }
  function renderSeats(opts) {
    opts = opts || {};
    var free = freeLeft(), max = Math.min(D.counts.maxPick, free.length), n = Math.max(1, Math.min(seatState.n, max || 1));
    seatState.n = n; seatInput.max = max || 1;
    if (document.activeElement !== seatInput) seatInput.value = n;
    $('#seatsave').textContent = 'Save ' + n + (n === 1 ? ' seat' : ' seats');
    var yoursN = saved && saved.seats ? saved.seats.length : 0;
    var pick = yoursN ? [] : choose(n, opts.hover != null ? opts.hover : seatState.anchor), k = 0;
    plates.forEach(function (p, i) {
      var on = pick.indexOf(i) > -1, was = p.classList.contains('is-preview');
      if (on) { if (!was && !reduced) p.style.setProperty('--td', Math.min(k * 30, 900) + 'ms'); k++; } else p.style.removeProperty('--td');
      p.classList.toggle('is-preview', on);
    });
    var left = seatsLeftCount();
    $('#coming').textContent = (D.counts.coming + yoursN) + ' people are coming and ' + left + (left === 1 ? ' seat is' : ' seats are') + ' free.';
    seatsEl.setAttribute('aria-label', 'Three long tables, fifteen seats a side. ' + (D.counts.coming + yoursN) + ' seats are taken' + (yoursN ? ', ' + yoursN + ' of them yours' : '') + ' and ' + left + ' are free.');
    heroLive();
  }
  function seatMessage() {
    var kn = nextOf('kai', nowMs()), n = saved.seats.length;
    var msg = NUM[n] + (n === 1 ? ' seat' : ' seats') + ' saved for ' + saved.name + '. Dinner’s at ' + fmtT('17:45', true) + ' on ' + (kn ? dateLong(kn.c) : 'Tuesday') + '.';
    return msg + (saved.diet && saved.diet.length ? ' Noted for the kitchen: ' + saved.diet.join(', ').toLowerCase() + '.' : '');
  }
  function showSaved(announce) {
    seatForm.hidden = true; seatSaved.hidden = false;
    var m = seatMessage(); $('#seatmsg').textContent = m;
  }
  function initSeats() {
    buildTable();
    seatMeta();
    var nameIn = $('#seatname'), err = $('#seatname-err');
    if (saved && saved.seats && saved.seats.length) showSaved(false);
    renderSeats();
    function setN(v) { seatState.n = parseInt(v, 10) || 1; seatState.anchor = null; renderSeats(); }
    $$('.step').forEach(function (b) { b.addEventListener('click', function () { setN(seatState.n + parseInt(b.dataset.step, 10)); seatInput.value = seatState.n; }); });
    seatInput.addEventListener('input', function () { var v = parseInt(seatInput.value, 10); if (v) { seatState.n = v; seatState.anchor = null; renderSeats(); } });
    seatInput.addEventListener('change', function () { setN(seatInput.value); seatInput.value = seatState.n; });
    nameIn.addEventListener('input', function () { err.hidden = true; nameIn.removeAttribute('aria-invalid'); });
    function seatOf(e) { return e.target.closest && e.target.closest('.seat.is-free'); }
    seatsEl.addEventListener('mouseover', function (e) { var p = seatOf(e); if (!p || (saved && saved.seats && saved.seats.length)) return; renderSeats({ hover: parseInt(p.dataset.id, 10) }); });
    seatsEl.addEventListener('mouseleave', function () { renderSeats(); });
    seatsEl.addEventListener('click', function (e) {
      var p = seatOf(e); if (!p || (saved && saved.seats && saved.seats.length)) return;
      seatState.anchor = parseInt(p.dataset.id, 10); renderSeats();
    });
    seatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = nameIn.value.trim();
      if (!name) { err.hidden = false; nameIn.setAttribute('aria-invalid', 'true'); nameIn.focus(); return; }
      var take = choose(seatState.n, seatState.anchor);
      var diet = $$('input[name=diet]:checked', seatForm).map(function (c) { return c.value; });
      saved = { seats: take, name: name, diet: diet };
      sset(KEYS, saved);
      var stag = Math.min(30, 900 / Math.max(1, take.length));
      take.forEach(function (i, k) {
        var p = plates[i]; p.classList.remove('is-free', 'is-preview'); p.classList.add('is-yours'); p.style.removeProperty('--td');
        if (!reduced) { p.style.setProperty('--dl', (k * stag) + 'ms'); p.classList.add('is-laying'); }
      });
      renderSeats(); showSaved(true);
      $('#seatmsg').focus();
    });
    $('#seatchange').addEventListener('click', function () {
      if (saved && saved.seats) saved.seats.forEach(function (i) { plates[i].classList.remove('is-yours', 'is-laying'); plates[i].classList.add('is-free'); plates[i].style.removeProperty('--dl'); });
      nameIn.value = saved ? saved.name : ''; var keep = saved; saved = null; sset(KEYS, null);
      $$('input[name=diet]', seatForm).forEach(function (c) { c.checked = keep && keep.diet && keep.diet.indexOf(c.value) > -1; });
      seatSaved.hidden = true; seatForm.hidden = false; seatState.n = keep ? keep.seats.length : 2; seatState.anchor = null; seatInput.value = seatState.n;
      renderSeats(); seatStatus.textContent = ''; setTimeout(function () { seatStatus.textContent = 'Your seats were released. You can choose again.'; }, 30);
      nameIn.focus();
    });
    $('#seatcal').addEventListener('click', function () {
      var kn = nextOf('kai', nowMs()); if (!kn || !saved) return;
      var n = saved.seats.length;
      downloadIcs('Kai Night at ' + orgFull() + ' (' + n + (n === 1 ? ' seat' : ' seats') + ' for ' + saved.name + ')', kn.st, kn.en,
        'Doors 5.15pm, dinner 5.45pm. ' + KAI.cost + '. This is a demo booking, so nothing was sent.', 'kai-night');
    });
    if ('IntersectionObserver' in window && !reduced) {
      seatsEl.classList.add('pre');
      plates.forEach(function (p, i) { p.style.setProperty('--dl', ((Math.floor(i / 30) * 15 + (i % 15)) * 20) + 'ms'); });
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) {
          io.disconnect(); seatsEl.classList.remove('pre');
          setTimeout(function () { seatsEl.classList.add('laid'); plates.forEach(function (p) { if (!p.classList.contains('is-laying')) p.style.removeProperty('--dl'); }); }, 1400);
        }
      }, { threshold: 0.15 });
      io.observe(seatsEl);
    }
  }

  /* ---------- The week ---------- */
  var wk = { off: 0, filter: 'all', sel: 0 };
  var KINDS = ['all', 'food', 'learning', 'making', 'little'];
  var KIND_LABEL = { all: 'Everything', food: 'Food', learning: 'Learning', making: 'Making', little: 'Little ones' };
  var PARTS = [['Morning', 0, 12], ['Afternoon', 12, 17], ['Evening', 17, 24]];
  var chipsEl = $('#chips'), dayrow = $('#dayrow'), gridEl = $('#weekgrid'), chipBtns = {}, dayBtns = [];
  function weekStart(off) { var t = today(nowMs()).c; return t.n - ((t.dow + 6) % 7) + off * 7; }
  function weekRangeLabel(days) {
    var a = days[0], b = days[6];
    return a.m === b.m ? a.d + ' to ' + b.d + ' ' + MONS[a.m - 1] : a.d + ' ' + MONS[a.m - 1] + ' to ' + b.d + ' ' + MONS[b.m - 1];
  }
  function initWeek() {
    KINDS.forEach(function (k) {
      var b = h('button', { 'class': 'chip', type: 'button', 'aria-pressed': 'false', 'data-kind': k }, [KIND_LABEL[k] + ' ', h('span', { 'class': 'n', text: '0' })]);
      b.addEventListener('click', function () { wk.filter = k; renderWeek(true); });
      chipBtns[k] = b; chipsEl.appendChild(b);
    });
    for (var i = 0; i < 7; i++) (function (i) {
      var b = h('button', { 'class': 'dayb', type: 'button', 'aria-pressed': 'false' }, [h('span', { 'aria-hidden': 'true' }), h('span', { 'class': 'dd', 'aria-hidden': 'true' })]);
      b.addEventListener('click', function () { wk.sel = i; renderWeek(); });
      dayBtns[i] = b; dayrow.appendChild(b);
    })(i);
    $('#wk-prev').addEventListener('click', function () { wk.off = Math.max(-26, wk.off - 1); wk.sel = wk.off === 0 ? todayIdx() : 0; renderWeek(false, true); });
    $('#wk-next').addEventListener('click', function () { wk.off = Math.min(60, wk.off + 1); wk.sel = wk.off === 0 ? todayIdx() : 0; renderWeek(false, true); });
    wk.sel = todayIdx();
    refreshClock.week = function () { if (wk.off === 0 && !refreshClock.skip) renderWeek(); };
    renderWeek();
  }
  function todayIdx() { return (today(nowMs()).c.dow + 6) % 7; }
  function blockFor(ev, ms) {
    var s = ev.s, on = ev.st <= ms && ms < ev.en;
    var b = h('button', { 'class': 'blk kind-' + s.kind, type: 'button', 'aria-haspopup': 'dialog' }, [
      h('span', { 'class': 'visually-hidden', text: dateLong(ev.c) + ', ' }),
      on ? h('span', { 'class': 'onnow' }, [h('i', { 'class': 'now-half', 'aria-hidden': 'true' }), 'On now']) : null,
      h('span', { 'class': 't', text: range(s.start, s.end) }), h('span', { 'class': 'nm', text: s.name }),
      h('span', { 'class': 'ln', text: s.line }), h('span', { 'class': 'co', text: s.cost })
    ]);
    b.addEventListener('click', function () { openSession(s, ev.c); });
    return b;
  }
  function partOf(s) { var hh = hm(s.start)[0]; return hh < 12 ? 0 : hh < 17 ? 1 : 2; }
  function renderWeek(fromChip, paging) {
    var ms = nowMs(), td = today(ms).c, start = weekStart(wk.off), days = [], i;
    for (i = 0; i < 7; i++) days.push(civil(start + i));
    var counts = { all: 0, food: 0, learning: 0, making: 0, little: 0 }, shown = 0;
    var per = days.map(function (c) { return sessionsOn(c); });
    per.forEach(function (list) { list.forEach(function (s) { counts.all++; counts[s.kind]++; }); });
    KINDS.forEach(function (k) { chipBtns[k].setAttribute('aria-pressed', String(wk.filter === k)); $('.n', chipBtns[k]).textContent = counts[k]; chipBtns[k].setAttribute('aria-label', KIND_LABEL[k] + ', ' + counts[k] + (counts[k] === 1 ? ' session' : ' sessions')); });
    var lab = wk.off === 0 ? 'This week' : wk.off === 1 ? 'Next week' : wk.off === -1 ? 'Last week' : 'Week of';
    $('#wk-label').textContent = (wk.off >= -1 && wk.off <= 1 ? lab + ', ' : lab + ' ') + weekRangeLabel(days);
    // what goes in each part-of-day cell
    var cells = PARTS.map(function () { return days.map(function () { return { items: [], note: null }; }); });
    days.forEach(function (c, d) {
      var closed = isClosed(c);
      per[d].forEach(function (s) { if (wk.filter === 'all' || s.kind === wk.filter) { shown++; cells[partOf(s)][d].items.push(s); } });
      if (wk.filter === 'all') {
        if (closed) cells[0][d].note = 'Closed for ' + D.closure.label + '.';
        else if (c.dow === 0) cells[0][d].note = D.sundayNote;
      }
    });
    gridEl.textContent = ''; gridEl.className = 'weekgrid tt';
    var todayI = days.map(function (c) { return c.n === td.n; }).indexOf(true);
    var rowsShown = [];
    PARTS.forEach(function (p, r) { if (cells[r].some(function (x) { return x.items.length || x.note; })) rowsShown.push(r); });
    gridEl.appendChild(h('div', { 'class': 'corner', 'aria-hidden': 'true' }));
    days.forEach(function (c, d) {
      var isT = c.n === td.n;
      gridEl.appendChild(h('div', { 'class': 'dayh', style: 'grid-column:' + (d + 2) + ';grid-row:1' }, [
        h('span', { 'class': 'dow', 'aria-hidden': 'true', text: DOWS[c.dow].slice(0, 3) }), h('span', { 'class': 'dnum', 'aria-hidden': 'true', text: String(c.d) }),
        h('span', { 'class': 'dmon', 'aria-hidden': 'true', text: MONS[c.m - 1].slice(0, 3) }),
        h('span', { 'class': 'visually-hidden', text: dateLong(c) + (isT ? ', today' : '') })
      ]));
      var b = dayBtns[d];
      b.firstChild.textContent = DOWS[c.dow].slice(0, 3); b.lastChild.textContent = c.d;
      b.setAttribute('aria-pressed', String(d === wk.sel)); b.setAttribute('aria-label', dateLong(c) + (isT ? ', today' : '')); b.classList.toggle('is-today', isT);
    });
    rowsShown.forEach(function (r, ri) {
      var row = ri + 2;
      gridEl.appendChild(h('div', { 'class': 'rowlab', style: 'grid-column:1;grid-row:' + row, text: PARTS[r][0] }));
      days.forEach(function (c, d) {
        var x = cells[r][d], isT = c.n === td.n;
        var cell = h('div', { 'class': 'cell' + (isT ? ' is-today' : '') + (d === wk.sel ? ' is-selected' : ''), style: 'grid-column:' + (d + 2) + ';grid-row:' + row, 'data-row': PARTS[r][0] });
        x.items.forEach(function (s) {
          var a = hm(s.start), bb = hm(s.end);
          cell.appendChild(blockFor({ s: s, c: c, st: nzToMs(c, a[0], a[1]), en: nzToMs(c, bb[0], bb[1]) }, ms));
        });
        if (x.note) cell.appendChild(h('p', { 'class': 'day-note', text: x.note }));
        gridEl.appendChild(cell);
      });
    });
    var ai = rowsShown.indexOf(1), ei = rowsShown.indexOf(2);
    if (wk.filter === 'all' && ai > -1 && ei === ai + 1 && [3, 4, 5, 6].every(function (d) { return !cells[1][d].items.length && !cells[1][d].note && !cells[2][d].items.length && !cells[2][d].note; })) {
      var nu = nextUpPanel(days, ai + 2, ei + 2); if (nu) gridEl.appendChild(nu);
    }
    if (todayI > -1) gridEl.insertBefore(h('div', { 'class': 'todaycol', 'aria-hidden': 'true', style: 'grid-column:' + (todayI + 2) + ';grid-row:1 / ' + (rowsShown.length + 2) }), gridEl.firstChild);
    var selHas = cells.some(function (rw) { return rw[wk.sel].items.length || rw[wk.sel].note; });
    if (!selHas) gridEl.appendChild(h('p', { 'class': 'sel-empty', text: wk.filter === 'all' ? 'Nothing on this day.' : 'Nothing on this day with this filter.' }));
    var empty = $('#wk-empty');
    if (!shown && wk.filter !== 'all') {
      if (!empty) { empty = h('p', { 'class': 'wk-empty', id: 'wk-empty' }); gridEl.parentNode.appendChild(empty); }
      empty.textContent = 'Nothing in ' + KIND_LABEL[wk.filter].toLowerCase() + ' this week. Try another week or choose Everything.';
    } else if (empty) empty.remove();
    $('#wk-prev').setAttribute('aria-disabled', String(wk.off <= -26)); $('#wk-next').setAttribute('aria-disabled', String(wk.off >= 60));
    var st = $('#wk-status');
    if (fromChip) st.textContent = 'Showing ' + shown + (shown === 1 ? ' session' : ' sessions') + (wk.filter === 'all' ? '.' : ' for ' + KIND_LABEL[wk.filter].toLowerCase() + '.');
    else if (paging) st.textContent = $('#wk-label').textContent + '.';
  }
  /* The empty Thursday to Sunday afternoon and evening: the next Repair Café, or the next Garden morning when the shown week already has the Repair Café. */
  function nextUpPanel(days, r1, r2) {
    var ms = nowMs(), b = days[6].n, ev = null, all = events(ms, 0, 520), i;
    /* the first Repair Café or Garden morning after the shown week, never one that has passed; closed days have no sessions, so a closure is skipped */
    for (i = 0; i < all.length; i++) {
      if (all[i].en > ms && all[i].c.n > b && (all[i].s.id === 'repair' || all[i].s.id === 'garden')) { ev = all[i]; break; }
    }
    if (!ev) return null;
    var useRepair = ev.s.id === 'repair';
    var btn = h('button', { 'class': 'btn', type: 'button', text: 'Add to calendar' });
    btn.addEventListener('click', function () { downloadIcs(ev.s.name + ' at ' + orgFull(), ev.st, ev.en, ev.s.detail + ' ' + ev.s.cost + '.', ev.s.id); });
    return h('section', { 'class': 'nextup on-ink', 'aria-label': 'Next up', style: 'grid-row:' + r1 + ' / ' + (r2 + 1) }, [
      h('p', { 'class': 'nu-tag' }, [h('i', { 'class': 'now-half', 'aria-hidden': 'true' }), 'Next up']),
      h('h3', { 'class': 'nu-h', text: 'The next ' + ev.s.name + ' is ' + dateLong(ev.c) }),
      h('p', { 'class': 'nu-when', text: range(ev.s.start, ev.s.end) }),
      h('p', { 'class': 'nu-line', text: useRepair ? 'Hemi will have the soldering iron warm by half past nine.' : 'The gloves are on the hook by the back door.' }),
      btn
    ]);
  }
  var sdlg = $('#sdlg'), sCur = null;
  function openSession(s, c) {
    var a = hm(s.start), b = hm(s.end);
    sCur = { s: s, c: c, st: nzToMs(c, a[0], a[1]), en: nzToMs(c, b[0], b[1]) };
    $('#sdlg-kind').textContent = D.kinds[s.kind].label;
    sdlg.style.setProperty('--kc', { food: 'var(--main)', learning: 'var(--soft)', making: 'var(--second)', little: 'var(--tint)' }[s.kind]);
    $('#sdlg-h').textContent = s.name;
    $('#sdlg-when').textContent = dateLong(c) + ', ' + range(s.start, s.end);
    $('#sdlg-detail').textContent = s.detail; $('#sdlg-cost').textContent = s.cost;
    $('#sdlg-bring').textContent = s.bring; $('#sdlg-access').textContent = s.access;
    sdlg.showModal(); $('#sdlg-h').focus();
  }
  if ($('#sdlg-cal')) $('#sdlg-cal').addEventListener('click', function () {
    if (!sCur) return;
    downloadIcs(sCur.s.name + ' at ' + orgFull(), sCur.st, sCur.en, sCur.s.detail + ' ' + sCur.s.cost + '.', sCur.s.id);
  });

  /* ---------- Story dates ---------- */
  function storyDates() {
    var t = today(nowMs()).c.n;
    [['#note1-date', 4], ['#note2-date', 12]].forEach(function (p) {
      var c = civil(t - p[1]), el = $(p[0]);
      if (!el) return;
      el.textContent = dateLong(c) + ', ' + p[1] + ' days ago';
      el.setAttribute('datetime', c.y + '-' + (c.m < 10 ? '0' : '') + c.m + '-' + (c.d < 10 ? '0' : '') + c.d);
    });
  }

  /* ---------- Last year, counted ---------- */
  function dots(el, n, fn) { for (var i = 0; i < n; i++) { var d = h('i', { 'class': 'cdot' }); if (fn) fn(d, i); el.appendChild(d); } }
  function initCounted() {
    if (!$('#art-plates')) return;
    var C = D.counts;
    dots($('#art-plates'), C.tuesdays);
    dots($('#art-fixed'), C.things, function (d, i) { if (i < C.fixed) d.classList.add('on'); });
    var kids = $('#art-kids'), kr = h('div', { 'class': 'krow t' }), perKids = C.kids / 2;
    dots(kr, C.tutors); kids.appendChild(kr);
    for (var q = 0; q < 2; q++) { kr = h('div', { 'class': 'krow k' }); dots(kr, perKids); kids.appendChild(kr); }
    /* the tide: 64 volunteers as two arcs of 32, half a circle, mark at the base */
    var v = $('#art-vols'), per = C.volunteers / 2, K = .62, BASE = .32, HT = .34;
    [[.485, .485 * K], [.41, .395 * K]].forEach(function (ab) {
      /* even spacing along the arc, measured, so the dots never touch */
      var pts = [[0, 0]], len = 0, N = 720, prev = [-ab[0], 0], i, j = 0;
      for (i = 1; i <= N; i++) {
        var t = Math.PI * i / N, q = [-ab[0] * Math.cos(t), ab[1] * Math.sin(t)];
        len += Math.hypot(q[0] - prev[0], q[1] - prev[1]); prev = q; pts.push([t, len]);
      }
      for (i = 0; i < per; i++) {
        var want = len * i / (per - 1);
        while (j < N && pts[j][1] < want) j++;
        var th = pts[j][0], d = h('i', { 'class': 'cdot' });
        d.style.left = ((.5 - ab[0] * Math.cos(th)) * 100).toFixed(3) + '%'; d.style.top = (((BASE - ab[1] * Math.sin(th)) / HT) * 100).toFixed(3) + '%';
        v.appendChild(d);
      }
    });
    v.insertAdjacentHTML('beforeend', '<svg class="ring-mark" viewBox="0 0 60 30" aria-hidden="true"><path d="M2 22a9 9 0 0 1 18 0z M21 22a9 9 0 0 1 18 0z M40 22a9 9 0 0 1 18 0z" fill="var(--main)"/><rect y="24" width="60" height="5" fill="var(--page)"/></svg>');
  }

  /* ---------- Give ---------- */
  var gs = { n: 5, freq: 'once' };
  var gtable = $('#gtable'), gplates = [], gnum = $('#given'), grange = $('#giverange');
  function small(n) { var w = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']; return n <= 10 ? w[n] : String(n); }
  function money(n) { return '$' + n.toLocaleString('en-NZ'); }
  function giveSentence() {
    var n = gs.n, amt = n * D.counts.platePrice;
    if (gs.freq === 'weekly') return money(amt) + ' a week feeds ' + (n === 1 ? 'one person' : small(n) + ' people') + ' every Tuesday. Over the 48 weeks we are open that is ' + money(amt * D.org.weeksOpen) + '.';
    if (n === 90) return money(amt) + ' feeds all three tables on a Tuesday.';
    return money(amt) + ' feeds ' + (n === 1 ? 'one person' : small(n) + ' people') + ' on a Tuesday.';
  }
  function renderGive(prev) {
    var n = gs.n, k = 0;
    var cnt = Math.max(0, n - (prev || 0)); var stag = Math.min(30, 900 / Math.max(1, cnt));
    gplates.forEach(function (p, i) {
      var on = i < n, was = p.classList.contains('is-taken');
      p.classList.toggle('is-taken', on); p.classList.toggle('is-free', !on);
      p.classList.remove('is-laying');
      if (on && !was && prev != null && !reduced) { p.style.setProperty('--dl', Math.round(k * stag) + 'ms'); void p.offsetWidth; p.classList.add('is-laying'); k++; }
    });
    gtable.setAttribute('aria-label', 'Three long tables with ' + n + (n === 1 ? ' plate' : ' plates') + ' laid.');
    $('#givesentence').textContent = giveSentence();
    gnum.value = n; grange.value = n;
    grange.style.setProperty('--p', ((n - 1) / 89).toFixed(4));
    $$('[data-plates]').forEach(function (b) { b.setAttribute('aria-pressed', String(parseInt(b.dataset.plates, 10) === n)); });
  }
  function initGive() {
    if (!gtable) return;
    var seats = buildTables(gtable, true), order = [];
    seats.forEach(function (el, id) { var t = Math.floor(id / 30), c = id % 15, sd = Math.floor((id % 30) / 15); order.push({ el: el, k: t * 30 + c * 2 + sd }); });
    order.sort(function (a, b) { return a.k - b.k; }).forEach(function (o) { gplates.push(o.el); });
    function setN(v) { var o = gs.n; v = parseInt(v, 10); if (!v) return; gs.n = Math.max(1, Math.min(90, v)); renderGive(o); }
    grange.addEventListener('input', function () { setN(grange.value); });
    gnum.addEventListener('input', function () { var v = parseInt(gnum.value, 10); if (v >= 1 && v <= 90) { var o = gs.n; gs.n = v; renderGive(o); gnum.value = v; } });
    gnum.addEventListener('change', function () { setN(gnum.value || gs.n); gnum.value = gs.n; });
    $$('[data-plates]').forEach(function (b) { b.addEventListener('click', function () { setN(b.dataset.plates); }); });
    $$('input[name=freq]').forEach(function (r) { r.addEventListener('change', function () { gs.freq = r.value; renderGive(gs.n); }); });
    renderGive(null);
    var dlg = $('#givedlg'), steps = $$('[data-gstep]', dlg), f1 = $('#givef1');
    function step(k) { steps.forEach(function (s) { s.hidden = s.dataset.gstep !== String(k); }); var hd = $('h2', steps[k - 1]); hd.focus(); }
    $('#giveform').addEventListener('submit', function (e) { e.preventDefault(); step(1); dlg.showModal(); $('#givedlg-h').focus(); });
    f1.addEventListener('submit', function (e) {
      e.preventDefault();
      var nm = $('#gname'), em = $('#gemail'), bad = null;
      [[nm, $('#gname-err'), !nm.value.trim()], [em, $('#gemail-err'), !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value.trim())]].forEach(function (x) {
        x[1].hidden = !x[2]; if (x[2]) { x[0].setAttribute('aria-invalid', 'true'); bad = bad || x[0]; } else x[0].removeAttribute('aria-invalid');
      });
      if (bad) { bad.focus(); return; }
      var amt = gs.n * D.counts.platePrice;
      $('#gsum').textContent = gs.n + (gs.n === 1 ? ' plate' : ' plates') + ', ' + money(amt) + (gs.freq === 'weekly' ? ' every week' : ' once') + ', from ' + nm.value.trim() + '.';
      step(2);
    });
    $('#gback').addEventListener('click', function () { step(1); });
    $('#gconfirm').addEventListener('click', function () {
      var amt = gs.n * D.counts.platePrice;
      $('#gthanks').textContent = 'Thank you, ' + $('#gname').value.trim() + '. This is a demo, so nothing was charged and nothing was sent. ' + money(amt) + ' would have laid ' + gs.n + (gs.n === 1 ? ' plate' : ' plates') + '.';
      step(3); $('#gthanks').focus();
    });
    ['gname', 'gemail'].forEach(function (id) { $('#' + id).addEventListener('input', function () { this.removeAttribute('aria-invalid'); $('#' + id + '-err').hidden = true; }); });
  }

/* ---------- Help out ---------- */
  function initRoster() {
    if (!$('#roster')) return;
    var live = h('p', { 'class': 'visually-hidden', role: 'status', 'aria-live': 'polite' }); $('#roster').parentNode.appendChild(live);
    $$('.role').forEach(function (li) {
      var role = D.roles.filter(function (r) { return r.id === li.dataset.role; })[0], btn = $('button', li), formId = 'rf-' + role.id, form = null;
      btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', formId);
      btn.setAttribute('aria-label', 'I can do that: ' + role.name);
      btn.addEventListener('click', function () {
        if (!form) {
          form = h('form', { id: formId, novalidate: true, hidden: true }, [
            h('div', { 'class': 'field' }, [h('label', { 'for': formId + '-n', text: 'Your name' }), h('input', { id: formId + '-n', autocomplete: 'name', maxlength: '60', 'aria-describedby': formId + '-ne' })]),
            h('div', { 'class': 'field' }, [h('label', { 'for': formId + '-e', text: 'Email' }), h('input', { id: formId + '-e', type: 'email', autocomplete: 'email', maxlength: '80', 'aria-describedby': formId + '-ee' })]),
            h('p', { 'class': 'err', id: formId + '-ne', hidden: true, text: 'Add your name.' }),
            h('p', { 'class': 'err', id: formId + '-ee', hidden: true, text: 'Add an email address like name@example.com.' }),
            h('div', { 'class': 'btn-row' }, [h('button', { 'class': 'btn btn-ink', type: 'submit', text: 'Count me in' }), h('button', { 'class': 'btn btn-outline', type: 'button', text: 'Not now' })]),
            h('p', { 'class': 'demo-note', text: 'This is a demo, so nothing is sent.' })
          ]);
          li.appendChild(form); linkErrors(form);
          $('.btn-outline', form).addEventListener('click', function () { form.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); });
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            var n = $('#' + formId + '-n'), em = $('#' + formId + '-e'), bad = null;
            [[n, $('#' + formId + '-ne'), !n.value.trim()], [em, $('#' + formId + '-ee'), !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value.trim())]].forEach(function (x) {
              x[1].hidden = !x[2]; if (x[2]) { x[0].setAttribute('aria-invalid', 'true'); bad = bad || x[0]; } else x[0].removeAttribute('aria-invalid');
            });
            if (bad) { bad.focus(); return; }
            var msg = 'Thank you, ' + n.value.trim() + '. Ana Fifita looks after volunteers and will be in touch about the ' + role.name.toLowerCase() + ' role. This is a demo, so nothing was sent.';
            var done = h('p', { 'class': 'done', tabindex: '-1', text: msg });
            form.replaceWith(done); btn.hidden = true;
            done.focus();
          });
        }
        var open = form.hidden; form.hidden = !open; btn.setAttribute('aria-expanded', String(open));
        if (open) $('input', form).focus();
      });
    });
  }

  /* ---------- Hire, newsletter ---------- */
  function simpleForm(formId, fields, okId, okText) {
    var f = $(formId); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var bad = null;
      fields.forEach(function (x) {
        var inp = $(x[0]), err = $(x[1]), v = inp.value.trim(), isBad = x[2] === 'email' ? !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) : !v;
        err.hidden = !isBad; if (isBad) { inp.setAttribute('aria-invalid', 'true'); bad = bad || inp; } else inp.removeAttribute('aria-invalid');
      });
      if (bad) { bad.focus(); return; }
      var ok = $(okId); ok.hidden = false; ok.textContent = okText(); ok.focus();
    });
    fields.forEach(function (x) { $(x[0]).addEventListener('input', function () { this.removeAttribute('aria-invalid'); $(x[1]).hidden = true; }); });
  }
  function initForms() {
    simpleForm('#hire-form', [['#hname', '#hname-err']], '#hire-ok', function () { return 'Thank you, ' + $('#hname').value.trim() + '. Moana will reply about the date. This is a demo, so nothing was sent.'; });
    simpleForm('#noteform', [['#nemail', '#nemail-err', 'email']], '#note-ok', function () { return 'Thank you. This is a demo, so nothing was sent and nobody joined a list.'; });
    var ask = $('#hire-ask'), hf = $('#hire-form');
    if (ask && hf) ask.addEventListener('click', function () {
      var open = hf.hidden; hf.hidden = !open; ask.setAttribute('aria-expanded', String(open));
      if (open) { $('#hname').focus(); }
    });
  }

  /* ---------- Try it on ---------- */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function swatchSvg(p) {
    var svg = doc.createElementNS(SVGNS, 'svg'); svg.setAttribute('viewBox', '0 0 28 28'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    [['M14 14V0A14 14 0 0 1 28 14z', p.main], ['M14 14H28A14 14 0 0 1 14 28z', p.accent], ['M14 14V28A14 14 0 0 1 0 14z', p.second], ['M14 14H0A14 14 0 0 1 14 0z', p.ink]].forEach(function (q) {
      var path = doc.createElementNS(SVGNS, 'path'); path.setAttribute('d', q[0]); path.setAttribute('fill', q[1]); svg.appendChild(path);
    });
    var ring = doc.createElementNS(SVGNS, 'circle'); ring.setAttribute('cx', '14'); ring.setAttribute('cy', '14'); ring.setAttribute('r', '13'); ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', '#2a1a2e'); ring.setAttribute('stroke-width', '2');
    svg.appendChild(ring);
    return svg;
  }
  function keepHref() {
    var nm = (custom.org || '').trim(), pal = custom.palette && custom.palette !== 'kitchen' ? D.palettes[custom.palette].name : '', ty = custom.type && custom.type !== 'table' ? D.types[custom.type].name : '';
    if (!nm && !pal && !ty) return D.keepUrl;
    var t = 'The Commons' + (nm ? ' for ' + nm : '') + (pal ? ', ' + pal + ' colours' : '') + (ty ? ', ' + ty + ' type' : '');
    return 'https://www.singhstudio.co.nz/index.html?about=' + encodeURIComponent(t) + '#contact';
  }
  function initTio() {
    if (!$('#tio-panel')) return;
    var panel = $('#tio-panel'), btn = $('#tio-btn'), orgIn = $('#tio-org'), townIn = $('#tio-town'), keep = $('#tio-keep');
    var pal = $('#tio-pal'), typ = $('#tio-type');
    Object.keys(D.palettes).forEach(function (k) {
      var p = D.palettes[k], sw = h('span', { 'class': 'swatch' });
      sw.appendChild(swatchSvg(p));
      pal.appendChild(h('label', { 'class': 'sw' }, [h('input', { type: 'radio', name: 'tio-pal', value: k }), sw, h('span', { 'class': 'swname', text: p.name })]));
    });
    var FACES = { table: "'Bricolage Grotesque', sans-serif", workshop: "'Familjen Grotesk', sans-serif", hall: "'Young Serif', serif" };
    Object.keys(D.types).forEach(function (k) {
      typ.appendChild(h('label', { 'class': 'ty' }, [h('input', { type: 'radio', name: 'tio-type', value: k }), h('span', { text: D.types[k].name, title: D.types[k].note, style: 'font-family:' + FACES[k] })]));
    });
    function sync() {
      orgIn.value = custom.org || ''; townIn.value = custom.town || '';
      $$('input[name=tio-pal]').forEach(function (r) { r.checked = r.value === (custom.palette || 'kitchen'); });
      $$('input[name=tio-type]').forEach(function (r) { r.checked = r.value === (custom.type || 'table'); });
      keep.setAttribute('href', keepHref());
    }
    sync();
    orgIn.addEventListener('input', function () { custom.org = orgIn.value; applyOrg(); saveCustom(); sync2(); });
    townIn.addEventListener('input', function () { custom.town = townIn.value; applyOrg(); saveCustom(); sync2(); });
    function sync2() { keep.setAttribute('href', keepHref()); }
    $$('input[name=tio-pal]').forEach(function (r) { r.addEventListener('change', function () { custom.palette = r.value; applyLook(); saveCustom(); sync2(); }); });
    $$('input[name=tio-type]').forEach(function (r) { r.addEventListener('change', function () { custom.type = r.value; applyLook(); saveCustom(); sync2(); }); });
    function readImage(file, max, type, cb) {
      if (!file) return;
      var fr = new FileReader();
      fr.onload = function () {
        var im = new Image();
        im.onload = function () {
          var sc = Math.min(1, max / Math.max(im.width, im.height)), c = doc.createElement('canvas');
          c.width = Math.max(1, Math.round(im.width * sc)); c.height = Math.max(1, Math.round(im.height * sc));
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          cb(c.toDataURL(type, 0.85));
        };
        im.onerror = function () { cb(fr.result); };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    }
    $('#tio-logo').addEventListener('change', function (e) { var f = e.target.files[0]; if (f) $('#tio-logo-n').textContent = f.name; readImage(f, 400, 'image/png', function (u) { imgs.logo = u; applyImages(); sset(KEYI, imgs); }); });
    $('#tio-photo').addEventListener('change', function (e) { var f = e.target.files[0]; if (f) $('#tio-photo-n').textContent = f.name; readImage(f, 1800, 'image/jpeg', function (u) { imgs.photo = u; applyImages(); sset(KEYI, imgs); }); });
    $('#tio-reset').addEventListener('click', function () {
      custom = {}; imgs = {}; sset(KEY, null); sset(KEYI, null); sync(); applyLook(); applyOrg(); applyImages();
      $('#tio-logo').value = ''; $('#tio-photo').value = ''; $('#tio-logo-n').textContent = 'No file chosen'; $('#tio-photo-n').textContent = 'No file chosen';
    });
    /* On phones the panel is a modal dialog (the page behind goes inert, Escape is native). From 700px it stays beside the page,
       sits below the header so Give and the notice's close button stay reachable, and Escape works from anywhere on the page. */
    var phone = window.matchMedia('(max-width: 699px)');
    function place() {
      var hd = $('.site-header'), top = hd ? Math.max(0, Math.round(hd.getBoundingClientRect().bottom)) + 12 : 16;
      panel.style.setProperty('--tio-top', phone.matches ? '16px' : top + 'px');
    }
    function open() {
      Object.keys(D.types).forEach(loadType);
      place();
      if (phone.matches) panel.showModal(); else panel.show();
      root.classList.add('tio-open'); btn.setAttribute('aria-expanded', 'true'); $('#tio-h').focus();
    }
    function close() { if (panel.open) panel.close(); }
    panel.addEventListener('close', function () { root.classList.remove('tio-open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); });
    btn.addEventListener('click', function () { if (panel.open) close(); else open(); });
    $('#tio-x').addEventListener('click', close);
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); } });
    doc.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !panel.open || panel.matches(':modal')) return;
      if ($$('dialog[open]').some(function (d) { return d !== panel; })) return;
      close();
    });
    window.addEventListener('scroll', function () { if (panel.open && !phone.matches) place(); }, { passive: true });
    window.addEventListener('resize', function () { if (!panel.open) return; if (panel.matches(':modal') !== phone.matches) close(); else place(); });
  }

  /* ---------- Try it on: below 1100px it starts in the strip at the top, then floats and tucks away while scrolling down ---------- */
  function initTioHide() {
    var t = $('#tio');
    if (!t) return;
    var small = window.matchMedia('(max-width: 1099px)'), last = window.scrollY, tick = false;
    function upd() {
      tick = false;
      var y = window.scrollY, hh = root.scrollHeight, vh = window.innerHeight;
      var was = t.classList.contains('is-float'), tuck = t.classList.contains('is-tucked');
      var float = small.matches && y > t.offsetTop + t.offsetHeight;
      if (!float || root.classList.contains('tio-open') || y + vh >= hh - 60) tuck = false;
      else if (!was || y > last + 3) tuck = true;
      else if (y < last - 3) tuck = false;
      if (Math.abs(y - last) > 3) last = y;
      t.classList.toggle('is-anim', float && was);
      t.classList.toggle('is-float', float);
      t.classList.toggle('is-tucked', tuck);
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener('resize', upd);
    t.addEventListener('focusin', function () { t.classList.remove('is-tucked'); });
    upd();
  }

  /* ---------- Map labels (sized in map units so they read 15px on screen) ---------- */
  function layoutMap() {
    var svg = $('#map-svg'), t = $('#map-house'); if (!svg || !t) return;
    var r = svg.getBoundingClientRect(); if (!r.width || !r.height) return;
    var s = Math.max(r.width / 640, r.height / 440), lab = 15.5 / s, fs = lab;
    svg.style.setProperty('--lab', lab.toFixed(2) + 'px');
    var name = (custom.org || '').trim() || D.org.full;
    var visR = 320 + r.width / (2 * s), maxW = 104;
    t.textContent = '';
    var probe = doc.createElementNS(SVGNS, 'tspan'); t.appendChild(probe);
    function wide(str) { probe.textContent = str; return probe.getComputedTextLength(); }
    var longest = 0; name.split(/\s+/).forEach(function (w) { longest = Math.max(longest, wide(w)); });
    maxW = Math.max(maxW, Math.min(visR - 390, longest + 2));
    var lines = [], cur = '';
    name.split(/\s+/).forEach(function (w) {
      var test = cur ? cur + ' ' + w : w;
      if (wide(test) <= maxW) { cur = test; return; }
      if (cur) { lines.push(cur); cur = ''; }
      while (wide(w) > maxW && w.length > 1) { var k = w.length - 1; while (k > 1 && wide(w.slice(0, k)) > maxW) k--; lines.push(w.slice(0, k)); w = w.slice(k); }
      cur = w;
    });
    if (cur) lines.push(cur);
    t.textContent = '';
    var lh = fs * 1.15, y0 = 236 + fs * .35 - (lines.length - 1) * lh / 2;
    lines.forEach(function (ln, i) {
      var ts = doc.createElementNS(SVGNS, 'tspan'); ts.setAttribute('x', '372'); ts.setAttribute('y', (y0 + i * lh).toFixed(1)); ts.textContent = ln; t.appendChild(ts);
    });
    var box = $('#map-house-box');
    if (box) { var bb = t.getBBox(); box.setAttribute('x', (bb.x - 9).toFixed(1)); box.setAttribute('y', (bb.y - 6).toFixed(1)); box.setAttribute('width', (bb.width + 18).toFixed(1)); box.setAttribute('height', (bb.height + 12).toFixed(1)); }
  }

/* ---------- Hero parallax ---------- */
  function initParallax() {
    if (reduced) return;
    var el = $('#hero-photo'), tick = false;
    if (!el) return;
    function upd() {
      tick = false;
      if (window.innerWidth < 900) { el.style.removeProperty('--py'); return; }
      var p = Math.min(1, Math.max(0, window.scrollY / 420));
      el.style.setProperty('--py', (-40 * p).toFixed(1) + 'px');
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  }

  /* ---------- Go ---------- */
  /* Shared helpers for page scripts (pages.js). */
  window.Commons = {
    data: D, $: $, $$: $$, h: h, reduced: reduced, sget: sget, sset: sset,
    nowMs: nowMs, today: today, civil: civil, dayNum: dayNum, nzToMs: nzToMs, hm: hm, fmtT: fmtT, range: range, dateLong: dateLong,
    DOWS: DOWS, MONS: MONS, isClosed: isClosed, sessionsOn: sessionsOn, events: events, nextOf: nextOf, sessionById: sessionById,
    buildTables: buildTables, propSvg: propSvg, openSession: openSession, wireDialog: wireDialog, downloadIcs: downloadIcs,
    orgFull: orgFull, townName: townName, money: money, refreshClock: refreshClock
  };
  if (seatsEl) initSeats();
  if (gridEl) initWeek();
  initCounted(); initGive(); initRoster(); initForms(); initTio(); initTioHide(); storyDates(); initParallax();
  refreshClock(); heroLive(); layoutMap();
  window.addEventListener('resize', layoutMap);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(layoutMap);
  setInterval(refreshClock, 30000);
  window.layoutMapReady = true;
  root.classList.add('ready');
})();
