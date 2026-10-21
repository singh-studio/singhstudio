/* Laurel board runtime: one file, three ways to show it.
   screen  - a slideshow for a TV (landscape or portrait)
   browse  - a searchable page for a club website and phones
   kiosk   - a touchscreen: slideshow until someone touches it, then browse, then back when idle
   ES2017 on purpose (smart-TV browsers): no optional chaining, no ??, no object spread. */
(function () {
  'use strict';
  var M = window.LaurelModel;
  var doc = document, html = doc.documentElement, body = doc.body;
  html.className += ' lr-js';

  function readJSON(id) {
    var n = doc.getElementById(id);
    if (!n) return null;
    try { return JSON.parse(n.textContent); } catch (e) { return null; }
  }
  var cfg = readJSON('laurel-config') || {};
  var params = (function () {
    var out = {};
    location.search.replace(/^\?/, '').split('&').forEach(function (kv) {
      if (!kv) return;
      var p = kv.split('=');
      out[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || '').replace(/\+/g, ' '));
    });
    return out;
  })();
  var EMBED = params.embed === '1' || cfg.preview === true;
  var PREVIEW = cfg.preview === true;
  var data, people, personByKey, boardBySlug;
  var W = M.WORDS;

  // ---------- small helpers ----------
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function add(parent) { for (var i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]); return parent; }
  function put(parent, child) { parent.appendChild(child); return child; }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }
  function on(n, ev, fn, opt) { n.addEventListener(ev, fn, opt || false); }
  function licensed() { return !!(cfg.licence && cfg.licence.tier); }
  function trade() { return licensed() && cfg.licence.tier === 'trade'; }
  function thisYear() { return new Date().getFullYear(); }
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function lum(hex) {
    var c = rgb(hex).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function monogram(name) {
    var w = M.line(name).replace(/[^A-Za-z\u00C0-\u024F\s-]/g, ' ').split(/\s+/).filter(Boolean);
    if (!w.length) return '';
    return (w.length > 1 ? w[0].charAt(0) + w[w.length - 1].charAt(0) : w[0].slice(0, 2)).toUpperCase();
  }
  // Inside the editor's preview (a sandboxed srcdoc frame) the URL can't change; that's fine.
  function replaceHash(h) { try { history.replaceState(null, '', h); } catch (e) { /* about:srcdoc */ } }
  function setTitle(parts) { doc.title = parts.filter(Boolean).join(' \u00B7 '); }

  // ---------- data ----------
  // Boards kept off the website never appear in the browse or touchscreen views.
  function webBoards() { return data.boards.filter(function (b) { return b.web; }); }
  function load(project) {
    data = M.normaliseProject(project);
    W = data.words;
    M.boardSlugs(data);
    boardBySlug = {};
    webBoards().forEach(function (b) { boardBySlug[b.slug] = b; });
    people = M.people({ boards: webBoards() });
    personByKey = {};
    people.forEach(function (p) { personByKey[p.key] = p; });
  }

  function applyTheme() {
    var L = data.look;
    var cls = ['lr', 'theme-' + L.theme, 'wood-' + L.wood, 'paper-' + L.paper, 'mode-' + mode];
    if (L.caps) cls.push('lr-caps');
    if (mode === 'kiosk') cls.push('lr-kiosk');
    var st = body.style;
    if (L.theme === 'modern') {
      var light = lum(L.bg) > 0.4;
      if (light) cls.push('is-light');
      var ink = light ? '#141414' : '#ffffff';
      st.setProperty('--bg', L.bg);
      st.setProperty('--ink', ink);
      st.setProperty('--ink-strong', ink);
      st.setProperty('--ink-soft', light ? 'rgba(20,20,20,.68)' : 'rgba(255,255,255,.72)');
      st.setProperty('--rule', light ? 'rgba(20,20,20,.3)' : 'rgba(255,255,255,.35)');
      st.setProperty('--accent', contrast(L.accent, L.bg) >= 2.2 ? L.accent : ink);
      st.setProperty('--focus', contrast(L.accent, L.bg) >= 3 ? L.accent : ink);
    }
    if (isPortrait()) cls.push('is-portrait');
    if (data.screen.qr && cfg.qr && data.org.url) cls.push('lr-has-qr');
    body.className = cls.join(' ');
  }
  function isPortrait() { return window.innerHeight > window.innerWidth * 1.05; }

  // =====================================================================================
  // SCREEN
  // =====================================================================================
  var S = { root: null, stage: null, slides: null, deck: [], i: -1, timer: null, paused: false, progress: null, cur: null, hold: 0 };

  function buildScreen() {
    S.root = el('div', 'lr-screen');
    S.stage = put(S.root, el('div', 'lr-stage'));
    var stage = S.stage;
    add(stage, el('div', 'lr-bg'), el('div', 'lr-frame'));
    S.slides = put(stage, el('div', 'lr-slides'));
    S.slides.setAttribute('aria-live', 'off');
    var pr = put(stage, el('div', 'lr-progress'));
    S.progress = put(pr, el('i'));
    S.chrome = put(stage, el('div', 'lr-chrome'));
    S.ctl = put(S.root, el('div', 'lr-ctl'));
    S.ctl.setAttribute('role', 'toolbar');
    S.ctl.setAttribute('aria-label', 'Slideshow controls');
    function btn(label, fn) { var b = put(S.ctl, el('button', '', label)); b.type = 'button'; on(b, 'click', function (e) { e.stopPropagation(); fn(); poke(); }); return b; }
    btn('\u2190 Back', function () { step(-1); });
    S.pauseBtn = btn('Pause', function () { setPaused(!S.paused); });
    btn('Next \u2192', function () { step(1); });
    btn('Full screen', fullscreen);
    S.browseBtn = btn('Find a name', function () { go('browse'); });
    return S.root;
  }

  function chrome() {
    clear(S.chrome);
    if (data.screen.qr && cfg.qr && data.org.url) {
      var q = put(S.chrome, el('div', 'lr-qr'));
      var holder = put(q, el('div'));
      holder.innerHTML = cfg.qr;
      var t = put(q, el('div', 'lr-qr-text'));
      add(t, el('b', '', W.scan), el('span', '', data.org.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')));
    }
    if (data.screen.clock) { S.clock = put(S.chrome, el('div', 'lr-clock')); tick(); } else S.clock = null;
    if (!licensed()) add(S.chrome, el('div', 'lr-trial', 'Laurel trial \u00B7 singhstudio.co.nz/laurel'));
    else if (data.screen.credit || !trade()) add(S.chrome, el('div', 'lr-credit', 'Laurel'));
    if (mode === 'kiosk') add(S.chrome, el('div', 'lr-attract', W.touch));
  }
  function tick() {
    if (!S.clock) return;
    try { S.clock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?([AP]M)$/i, function (m, ap) { return ' ' + ap.toLowerCase(); }); }
    catch (e) { var d = new Date(); S.clock.textContent = d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2); }
  }

  // --- headings shared by slides ---
  function heading(title, sub, crest) {
    var h = el('header', 'lr-head');
    if (crest && data.org.crest) { var img = put(h, el('img', 'lr-crest')); img.src = data.org.crest; img.alt = ''; }
    var t = put(h, el('h1', 'lr-title'));
    add(t, el('span', data.look.theme === 'timber' ? 'lr-gilt lr-sheen' : '', title));
    if (sub) {
      var s = put(h, el('p', 'lr-sub'));
      add(s, el('span', 'lr-rule'), el('span', '', sub), el('span', 'lr-rule'));
    } else if (data.look.theme !== 'modern') {
      h.appendChild(ornament());
    }
    return h;
  }
  function ornament() {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = doc.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'lr-orn');
    svg.setAttribute('viewBox', '0 0 260 14');
    svg.setAttribute('aria-hidden', 'true');
    var p = doc.createElementNS(ns, 'path');
    p.setAttribute('d', 'M0 7h112M148 7h112M122 7l8-5 8 5-8 5z');
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', '1.4');
    svg.appendChild(p);
    return svg;
  }
  function foot(page, pages) {
    var f = el('footer', 'lr-foot');
    add(f, el('span', 'lr-org', data.org.name));
    if (pages > 1) {
      var p = put(f, el('span', 'lr-pages'));
      add(p, el('b', '', String(page)), doc.createTextNode(' / ' + pages));
    }
    return f;
  }

  // --- fields: how each column of a board is shown ---
  function fieldKinds(cols) {
    var nameAt = -1;
    cols.forEach(function (c, i) { if (c.role === 'name' && nameAt < 0) nameAt = i; });
    return cols.map(function (c, i) {
      if (c.role === 'year') return 'year';
      if (c.role === 'name') return 'name';
      return nameAt >= 0 && i < nameAt ? 'label' : 'text';
    });
  }
  function rowEl(cells, kinds, isNew) {
    var li = el('li', 'lr-row' + (isNew ? ' is-new' : ''));
    cells.forEach(function (v, i) {
      var k = kinds[i];
      var cls = k === 'label' ? 'lr-f lr-f-name lr-f-label' : 'lr-f lr-f-' + k;
      if (k === 'name' && v && M.isPlaceholder(v)) cls += ' is-void';
      add(li, el('span', cls, v));
    });
    return li;
  }

  // --- layout: measure real text, then pick the calmest arrangement that fits ---
  var CANDIDATES = [[1.32, 1], [1.16, 1], [1, 1], [1.16, 2], [1, 2], [0.92, 2], [1, 3], [0.92, 3], [0.84, 2], [0.84, 3], [0.84, 4]];
  function measure(slideFactory, cells, kinds) {
    var probe = slideFactory();
    probe.style.visibility = 'hidden';
    probe.className += ' is-measuring';
    var bodyEl = probe.querySelector('.lr-body');
    var col = put(bodyEl, el('ol', 'lr-col'));
    var sample = cells.length ? widest(cells) : [kinds.map(function () { return 'Sample'; })];
    sample.forEach(function (c) { col.appendChild(rowEl(c, kinds, false)); });
    S.slides.appendChild(probe);
    var w = bodyEl.clientWidth, h = bodyEl.clientHeight;
    var cs = window.getComputedStyle(bodyEl);
    var padTop = parseFloat(cs.paddingTop) || 0;
    var entry = col.offsetWidth;
    var firstRow = col.querySelector('.lr-row');
    var lineH = firstRow ? firstRow.offsetHeight : 40;
    var colMargin = parseFloat(window.getComputedStyle(col).marginLeft) + parseFloat(window.getComputedStyle(col).marginRight);
    S.slides.removeChild(probe);
    return { W: w, H: h - padTop - 4, entry: entry, lineH: lineH, gap: colMargin || 0 };
  }
  // Measuring hundreds of rows is slow on a TV, and only the longest ones decide the layout.
  function widest(cells) {
    if (cells.length <= 24) return cells;
    var picked = [], seen = {};
    function take(score, k) {
      cells.map(function (c, i) { return { i: i, s: score(c) }; }).sort(function (a, b) { return b.s - a.s; }).slice(0, k).forEach(function (x) {
        if (!seen[x.i]) { seen[x.i] = true; picked.push(cells[x.i]); }
      });
    }
    take(function (c) { return c.join('').length; }, 10);
    for (var f = 0; f < cells[0].length; f++) take(function (c) { return (c[f] || '').length; }, 6);
    return picked;
  }
  function plan(m, n) {
    var maxCols = isPortrait() ? 2 : 4;
    var best = null, i, c, rowsPerCol, fitsW;
    for (i = 0; i < CANDIDATES.length; i++) {
      c = CANDIDATES[i];
      if (c[1] > maxCols) continue;
      fitsW = c[1] * (m.entry * c[0] + m.gap) <= m.W + 1;
      rowsPerCol = Math.max(1, Math.floor(m.H / (m.lineH * c[0])));
      if (fitsW && rowsPerCol * c[1] >= n) return { scale: c[0], cols: c[1], perCol: Math.ceil(n / c[1]), cap: rowsPerCol, wrap: false, few: Math.ceil(n / c[1]) < rowsPerCol * 0.7 };
      if (fitsW && c[0] >= 0.9 && (!best || rowsPerCol * c[1] > best.cap * best.cols)) best = { scale: c[0], cols: c[1], perCol: rowsPerCol, cap: rowsPerCol, wrap: false };
    }
    if (best) return best;
    rowsPerCol = Math.max(1, Math.floor(m.H / (m.lineH * 0.9 * 2)));
    return { scale: 0.9, cols: 1, perCol: rowsPerCol, cap: rowsPerCol, wrap: true };
  }
  function paginate(cells, p) {
    var per = p.cap * p.cols, pages = [], i, chunk;
    if (cells.length <= per) return [{ cells: cells, perCol: Math.ceil(cells.length / p.cols) || 1 }];
    for (i = 0; i < cells.length; i += per) {
      chunk = cells.slice(i, i + per);
      pages.push({ cells: chunk, perCol: chunk.length === per ? p.cap : Math.ceil(chunk.length / p.cols) });
    }
    return pages;
  }
  function columns(bodyEl, cells, kinds, perCol, newFlags) {
    for (var i = 0; i < cells.length; i += perCol) {
      var col = put(bodyEl, el('ol', 'lr-col'));
      for (var j = i; j < Math.min(i + perCol, cells.length); j++) col.appendChild(rowEl(cells[j], kinds, newFlags && newFlags[j]));
    }
  }

  // --- the deck ---
  function spotlightItems(year) {
    var items = [];
    data.boards.forEach(function (b) {
      if (!onScreen(b)) return;
      var yi = M.colIndex(b, 'year');
      if (yi < 0 || M.colIndex(b, 'name') < 0) return;
      M.sortedRows(b).forEach(function (r) {
        if (M.yearOf(r.c[yi]) !== year) return;
        var names = [], detail = [];
        b.cols.forEach(function (c, i) {
          if (i === yi || !r.c[i]) return;
          if (c.role === 'name') names.push(r.c[i]); else detail.push(r.c[i]);
        });
        if (!names.length || names.every(M.isPlaceholder)) return;
        items.push([b.title + (b.subtitle ? ' \u2014 ' + b.subtitle : ''), names.join(' & '), detail.join(' \u00B7 ')]);
      });
    });
    return items;
  }

  function onScreen(b) { return b.screen && (mode !== 'kiosk' || b.web); }
  function buildDeck() {
    var deck = [];
    var latest = M.latestYear(data);
    var recent = latest !== null && latest >= thisYear() - 1 ? latest : null;
    if (data.screen.cover) deck.push({ type: 'cover', key: 'cover' });
    if (data.screen.spotlight && latest !== null) {
      var items = spotlightItems(latest);
      if (items.length) {
        var kinds = ['board', 'name', 'text'];
        var factory = function () { return spotSlide(latest, null, 1, 1, null); };
        var m = measure(factory, items, kinds);
        var p = plan(m, items.length);
        paginate(items, p).forEach(function (pg, i, all) {
          deck.push({ type: 'spot', key: 'spot-' + i, year: latest, cells: pg.cells, perCol: pg.perCol, scale: p.scale, wrap: p.wrap, few: all.length === 1 && p.few, page: i + 1, pages: all.length });
        });
      }
    }
    data.boards.forEach(function (b) {
      if (!onScreen(b)) return;
      var rows = M.sortedRows(b);
      var kinds = fieldKinds(b.cols);
      var cells = rows.map(function (r) { return r.c; });
      var yi = M.colIndex(b, 'year');
      var flags = rows.map(function (r) { return recent !== null && yi >= 0 && M.yearOf(r.c[yi]) === recent; });
      if (!cells.length && !PREVIEW) return;
      var factory = function () { return boardSlide(b, [], kinds, 1, 1, 1, 1, false, null, true); };
      var m = measure(factory, cells, kinds);
      var p = plan(m, cells.length);
      var start = 0;
      paginate(cells, p).forEach(function (pg, i, all) {
        deck.push({ type: 'board', key: b.id + '-' + i, board: b, kinds: kinds, cells: pg.cells, flags: flags.slice(start, start + pg.cells.length), perCol: pg.perCol, scale: p.scale, wrap: p.wrap, few: all.length === 1 && p.few, page: i + 1, pages: all.length });
        start += pg.cells.length;
      });
      if (data.screen.features) rows.forEach(function (r, i) { if (r.photo || r.text) deck.push({ type: 'feature', key: b.id + '-f' + i, board: b, row: r }); });
    });
    if (!deck.length) deck.push({ type: 'cover', key: 'cover' });
    return deck;
  }

  function boardSlide(b, cells, kinds, perCol, scale, page, pages, wrap, flags, measuring, few) {
    var sec = el('section', 'lr-slide lr-s-board' + (wrap ? ' lr-wrap' : '') + (few ? ' lr-few' : ''));
    add(sec, heading(b.title, b.subtitle, true));
    var bodyEl = put(sec, el('div', 'lr-body'));
    bodyEl.style.setProperty('--scale', String(scale));
    if (cells.length) columns(bodyEl, cells, kinds, perCol, flags);
    else if (!measuring) bodyEl.appendChild(el('p', 'lr-empty', 'No names on this board yet'));
    add(sec, foot(page, pages));
    return sec;
  }
  function spotSlide(year, cells, page, pages, s) {
    var sec = el('section', 'lr-slide lr-s-spot' + (s && s.wrap ? ' lr-wrap' : '') + (s && s.few ? ' lr-few' : ''));
    var h = put(sec, el('header', 'lr-head'));
    add(h, el('span', 'lr-spot-year' + (data.look.theme === 'timber' ? ' lr-gilt' : ''), String(year)));
    var t = put(h, el('h1', 'lr-title'));
    add(t, el('span', data.look.theme === 'timber' ? 'lr-gilt lr-sheen' : '', W.spotlight));
    var bodyEl = put(sec, el('div', 'lr-body'));
    if (s) { bodyEl.style.setProperty('--scale', String(s.scale)); columns(bodyEl, cells, ['board', 'name', 'text'], s.perCol, null); }
    add(sec, foot(page, pages));
    return sec;
  }
  function coverSlide() {
    var sec = el('section', 'lr-slide lr-s-cover');
    if (data.org.crest) { var img = put(sec, el('img', 'lr-crest')); img.src = data.org.crest; img.alt = ''; }
    add(sec, el('h1', 'lr-cover-org' + (data.look.theme === 'timber' ? ' lr-gilt' : ''), data.org.name));
    var w = put(sec, el('p', 'lr-cover-word'));
    add(w, el('span', 'lr-rule'), el('span', '', W.honours), el('span', 'lr-rule'));
    var tag = [data.org.founded ? W.est + ' ' + data.org.founded : '', data.org.tagline].filter(Boolean).join(' \u00B7 ');
    if (tag) add(sec, el('p', 'lr-cover-tag', tag));
    return sec;
  }
  function featureSlide(b, r) {
    var sec = el('section', 'lr-slide lr-s-feature');
    var ni = M.colIndex(b, 'name'), yi = M.colIndex(b, 'year');
    var name = ni >= 0 ? r.c[ni] : r.c.join(' ');
    var ph = put(sec, el('div', 'lr-feat-photo'));
    if (r.photo) { var img = put(ph, el('img')); img.src = r.photo; img.alt = ''; }
    else add(ph, el('div', 'lr-mono', monogram(name)));
    var t = put(sec, el('div', 'lr-feat-text'));
    add(t, el('p', 'lr-feat-kicker', [b.title, b.subtitle, yi >= 0 ? r.c[yi] : ''].filter(Boolean).join(' \u00B7 ')));
    add(t, el('h1', 'lr-feat-name' + (data.look.theme === 'timber' ? ' lr-gilt' : ''), name));
    var extra = r.c.filter(function (v, i) { return i !== ni && i !== yi && v; }).join(' \u00B7 ');
    if (r.text || extra) add(t, el('p', 'lr-feat-cite', r.text || extra));
    return sec;
  }
  function render(s) {
    if (s.type === 'cover') return coverSlide();
    if (s.type === 'spot') return spotSlide(s.year, s.cells, s.page, s.pages, s);
    if (s.type === 'feature') return featureSlide(s.board, s.row);
    return boardSlide(s.board, s.cells, s.kinds, s.perCol, s.scale, s.page, s.pages, s.wrap, s.flags, false, s.few);
  }
  function duration(s) {
    var base = data.screen.seconds;
    if (s.type === 'cover') return Math.max(6, Math.round(base * 0.7));
    if (s.type === 'spot') return base + 3;
    if (s.type === 'feature') return base + 2;
    return base + Math.min(10, Math.round((s.cells.length || 0) * 0.08));
  }

  function show(i, instant) {
    if (!S.deck.length) return;
    S.i = (i + S.deck.length) % S.deck.length;
    var s = S.deck[S.i];
    var next = render(s);
    var prev = S.cur;
    S.slides.appendChild(next);
    void next.offsetWidth;
    next.classList.add('is-in');
    if (prev) {
      prev.classList.remove('is-in');
      setTimeout(function () { if (prev.parentNode) prev.parentNode.removeChild(prev); }, instant ? 0 : 1300);
    }
    S.cur = next;
    // Burn-in care: the whole board drifts a hair between slides.
    if (!EMBED) {
      var dx = (Math.random() - 0.5) * 1.1, dy = (Math.random() - 0.5) * 1.1;
      S.stage.style.transform = 'translate(' + dx.toFixed(2) + 'vmin,' + dy.toFixed(2) + 'vmin)';
    }
    schedule();
  }
  function schedule() {
    clearTimeout(S.timer);
    var bar = S.progress;
    bar.style.transition = 'none';
    bar.style.width = '0';
    if (S.paused || !S.deck.length || S.hidden) return;
    var secs = duration(S.deck[S.i]) + (S.hold || 0);
    S.hold = 0;
    void bar.offsetWidth;
    bar.style.transition = 'width ' + secs + 's linear';
    bar.style.width = '100%';
    S.timer = setTimeout(function () { show(S.i + 1); }, secs * 1000);
  }
  function step(d) { show(S.i + d); }
  function setPaused(p) {
    S.paused = p;
    if (S.pauseBtn) S.pauseBtn.textContent = p ? 'Play' : 'Pause';
    schedule();
  }
  function rebuild(keep) {
    var key = keep && S.deck[S.i] ? S.deck[S.i].key : null;
    var boardId = keep && S.deck[S.i] && S.deck[S.i].board ? S.deck[S.i].board.id : null;
    applyTheme();
    chrome();
    S.deck = buildDeck();
    var at = 0;
    if (key) {
      for (var i = 0; i < S.deck.length; i++) if (S.deck[i].key === key) { at = i; break; }
      if (!at && boardId) for (i = 0; i < S.deck.length; i++) if (S.deck[i].board && S.deck[i].board.id === boardId) { at = i; break; }
    }
    show(at, true);
  }
  function focusBoard(id) {
    if (id === '@cover') { for (var c = 0; c < S.deck.length; c++) if (S.deck[c].type === 'cover') { S.hold = 8; show(c, true); return; } return; }
    for (var i = 0; i < S.deck.length; i++) if (S.deck[i].board && S.deck[i].board.id === id) { S.hold = 8; show(i, true); return; }
  }

  // --- fullscreen, wake lock, cursor, keys ---
  function fullscreen() {
    var r = html;
    var fs = doc.fullscreenElement || doc.webkitFullscreenElement;
    try {
      if (fs) (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc);
      else if (r.requestFullscreen) r.requestFullscreen();
      else if (r.webkitRequestFullscreen) r.webkitRequestFullscreen();
    } catch (e) { /* not allowed here; fine */ }
  }
  var wake = null;
  function keepAwake() {
    if (EMBED || !navigator.wakeLock || doc.visibilityState !== 'visible') return;
    navigator.wakeLock.request('screen').then(function (l) { wake = l; }).catch(function () {});
  }
  var pokeTimer = null;
  function poke() {
    if (!S.root) return;
    S.root.classList.add('show-cursor');
    clearTimeout(pokeTimer);
    pokeTimer = setTimeout(function () { S.root.classList.remove('show-cursor'); }, 3200);
  }
  function screenKeys(e) {
    if (mode !== 'screen' || S.hidden) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === 'MediaTrackNext') { step(1); poke(); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'MediaTrackPrevious') { step(-1); poke(); }
    else if (k === ' ' || k === 'MediaPlayPause' || k === 'Enter' && e.target === body) { setPaused(!S.paused); poke(); e.preventDefault(); }
    else if (k === 'f' || k === 'F') fullscreen();
    else if (k === 'b' || k === 'B' || k === '/') go('browse');
    else poke();
  }

  // =====================================================================================
  // BROWSE (+ KIOSK)
  // =====================================================================================
  var B = { root: null, main: null, input: null, az: null, letter: '' };
  var ICON = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M13 13l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  function buildBrowse() {
    B.root = el('div', 'lr-web');
    var skip = put(B.root, el('a', 'lr-skip', 'Skip to the honours'));
    skip.href = '#lr-main';
    on(skip, 'click', function (e) { e.preventDefault(); B.main.focus(); });
    if (!licensed()) {
      var tb = put(B.root, el('div', 'lr-trial-bar'));
      tb.appendChild(doc.createTextNode('Made with a trial of Laurel. '));
      var a = put(tb, el('a', '', 'Get Laurel'));
      a.href = 'https://www.singhstudio.co.nz/laurel/';
      a.rel = 'noopener';
    }
    var head = put(B.root, el('header', 'lr-w-head'));
    if (data.org.crest) { var img = put(head, el('img', 'lr-w-crest')); img.src = data.org.crest; img.alt = data.org.name + ' crest'; }
    add(head, el('p', 'lr-w-org', data.org.name));
    var h1 = put(head, el('h1', 'lr-w-title', W.honours));
    if (data.look.theme === 'timber') h1.className += ' lr-gilt';
    var tag = [data.org.founded ? W.est + ' ' + data.org.founded : '', data.org.tagline].filter(Boolean).join(' \u00B7 ');
    if (tag) add(head, el('p', 'lr-w-tag', tag));
    if (mode !== 'kiosk') {
      var act = put(head, el('div', 'lr-w-actions'));
      var sb = put(act, el('button', '', '\u25B6 Slideshow'));
      sb.type = 'button';
      on(sb, 'click', function () { go('screen'); fullscreen(); });
    }
    var bar = put(B.root, el('div', 'lr-w-bar'));
    var srch = put(bar, el('div', 'lr-w-search'));
    srch.setAttribute('role', 'search');
    var lab = put(srch, el('label', 'lr-sr', W.find));
    lab.htmlFor = 'lr-q';
    srch.insertAdjacentHTML('beforeend', ICON);
    B.input = put(srch, el('input'));
    B.input.id = 'lr-q';
    B.input.type = 'search';
    B.input.placeholder = W.find + ' \u2026';
    B.input.autocomplete = 'off';
    B.input.setAttribute('autocapitalize', 'words');
    B.input.spellcheck = false;
    on(B.input, 'input', function () {
      B.letter = '';
      if (location.hash.replace(/^#\/?/, '') !== '') { replaceHash('#/'); }
      home();
    });
    if (mode === 'kiosk') {
      B.az = put(bar, el('div', 'lr-az'));
      B.az.setAttribute('role', 'group');
      B.az.setAttribute('aria-label', 'Surnames starting with');
      var have = {};
      people.forEach(function (p) { have[p.initial] = true; });
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function (L) {
        var b = put(B.az, el('button', '', L));
        b.type = 'button';
        b.disabled = !have[L];
        b.setAttribute('aria-pressed', 'false');
        on(b, 'click', function () {
          B.letter = B.letter === L ? '' : L;
          B.input.value = '';
          if (location.hash.replace(/^#\/?/, '') !== '') replaceHash('#/');
          home();
        });
      });
    }
    B.main = put(B.root, el('main', 'lr-w-main'));
    B.main.id = 'lr-main';
    B.main.tabIndex = -1;
    var f = put(B.root, el('footer', 'lr-w-foot'));
    add(f, el('span', '', data.org.name));
    var upd = '';
    try { upd = new Date(data.updated).toLocaleDateString([], { month: 'long', year: 'numeric' }); } catch (e) { upd = ''; }
    if (upd && upd !== 'Invalid Date') add(f, el('span', '', W.updated + ' ' + upd));
    if (!(trade() && !data.web.credit)) {
      var cr = put(f, el('span'));
      cr.appendChild(doc.createTextNode('Made with '));
      var ca = put(cr, el('a', '', 'Laurel'));
      ca.href = 'https://www.singhstudio.co.nz/laurel/';
      ca.rel = 'noopener';
    }
    if (mode === 'kiosk') {
      var hb = put(B.root, el('button', 'lr-kiosk-home', '\u2302 ' + W.back));
      hb.type = 'button';
      on(hb, 'click', function () { B.input.value = ''; B.letter = ''; location.hash = '#/'; home(); });
    }
    return B.root;
  }

  function nav(href, text, cls) { var a = el('a', cls || '', text); a.href = href; return a; }
  function heading2(text, cls) { var h = el('h2', cls || 'lr-w-h2', text); return h; }
  function focusMain() { try { B.main.focus({ preventScroll: true }); } catch (e) { B.main.focus(); } }

  function summary(p) {
    var s = p.honours.slice(0, 2).map(function (h) { return h.board.title + (h.year ? ' ' + h.year : ''); });
    if (p.honours.length > 2) s.push('+' + (p.honours.length - 2));
    return s.join(', ');
  }
  function peopleList(list) {
    var ul = el('ul', 'lr-people');
    list.slice(0, 300).forEach(function (p) {
      var li = put(ul, el('li'));
      var a = put(li, nav('#/p/' + p.slug));
      add(a, el('b', '', p.name), el('span', '', summary(p)));
    });
    return ul;
  }
  function boardCards(list) {
    var ul = el('ul', 'lr-cards');
    list.forEach(function (b) {
      var li = put(ul, el('li'));
      var a = put(li, nav('#/b/' + b.slug, null, 'lr-card'));
      add(a, el('b', '', b.title));
      if (b.subtitle) add(a, el('i', '', b.subtitle));
      var n = b.rows.filter(function (r) { return r.c.join('') !== ''; }).length;
      var range = M.yearRange(b);
      add(a, el('span', '', n + ' ' + W.names + (range ? ' \u00B7 ' + range : '')));
    });
    return ul;
  }

  function home() {
    var q = M.fold(B.input.value).toLowerCase().trim();
    clear(B.main);
    if (B.az) Array.prototype.forEach.call(B.az.children, function (b) { b.setAttribute('aria-pressed', b.textContent === B.letter ? 'true' : 'false'); });
    setTitle([W.honours, data.org.name]);
    if (B.letter) {
      add(B.main, heading2(B.letter));
      add(B.main, peopleList(people.filter(function (p) { return p.initial === B.letter; })));
      return;
    }
    if (!q) {
      var groups = [], byGroup = {};
      webBoards().forEach(function (b) {
        var g = b.group || '';
        if (!byGroup[g]) { byGroup[g] = []; groups.push(g); }
        byGroup[g].push(b);
      });
      groups.forEach(function (g) {
        add(B.main, heading2(g || W.boards));
        add(B.main, boardCards(byGroup[g]));
      });
      if (!webBoards().length) add(B.main, el('p', 'lr-none', W.noMatch));
      return;
    }
    var terms = q.split(/\s+/);
    var yearQ = /^\d{4}$/.test(q) ? Number(q) : null;
    var hits = people.filter(function (p) {
      var hay = M.fold(p.name).toLowerCase().replace(/[.]/g, '');
      var hay2 = M.fold(p.name).toLowerCase();
      return terms.every(function (t) { return hay.indexOf(t.replace(/[.]/g, '')) >= 0 || hay2.indexOf(t) >= 0; });
    });
    var bhits = webBoards().filter(function (b) {
      var hay = M.fold(b.title + ' ' + b.subtitle + ' ' + b.group).toLowerCase();
      return terms.every(function (t) { return hay.indexOf(t) >= 0; });
    });
    if (yearQ) {
      var items = [];
      webBoards().forEach(function (b) {
        var yi = M.colIndex(b, 'year'), ni = M.colIndex(b, 'name');
        if (yi < 0) return;
        M.sortedRows(b).forEach(function (r) { if (M.yearOf(r.c[yi]) === yearQ) items.push({ b: b, r: r, ni: ni }); });
      });
      if (items.length) {
        add(B.main, heading2(String(yearQ)));
        var ul = put(B.main, el('ul', 'lr-honours'));
        items.forEach(function (it) {
          var li = put(ul, el('li'));
          add(li, el('span', 'lr-h-year', it.r.c[M.colIndex(it.b, 'year')]));
          var sp = put(li, el('span'));
          var a = put(sp, nav('#/b/' + it.b.slug));
          add(a, el('b', '', it.ni >= 0 ? it.r.c[it.ni] : it.r.c.join(' ')));
          add(sp, el('span', '', it.b.title + (it.b.subtitle ? ' \u2014 ' + it.b.subtitle : '')));
        });
      }
    }
    if (hits.length) { add(B.main, heading2(W.people + ' (' + hits.length + ')')); add(B.main, peopleList(hits)); }
    if (bhits.length) { add(B.main, heading2(W.boards)); add(B.main, boardCards(bhits)); }
    if (!hits.length && !bhits.length && !(yearQ && B.main.childNodes.length)) add(B.main, el('p', 'lr-none', W.noMatch + ' \u201C' + B.input.value.trim() + '\u201D.'));
  }

  function nameLinks(cell, list) {
    var frag = doc.createDocumentFragment();
    var names = M.splitNames(cell, list);
    if (!names.length) { frag.appendChild(doc.createTextNode(cell)); return frag; }
    // keep the separators the club typed, link each name in turn
    var rest = cell;
    names.forEach(function (n, i) {
      var at = rest.indexOf(n);
      if (at > 0) frag.appendChild(doc.createTextNode(rest.slice(0, at)));
      var p = personByKey[M.nameKey(n)];
      if (p) frag.appendChild(nav('#/p/' + p.slug, n)); else frag.appendChild(doc.createTextNode(n));
      rest = at >= 0 ? rest.slice(at + n.length) : rest;
      if (i === names.length - 1 && rest) frag.appendChild(doc.createTextNode(rest));
    });
    return frag;
  }

  function boardPage(b) {
    clear(B.main);
    setTitle([b.title + (b.subtitle ? ' (' + b.subtitle + ')' : ''), W.honours, data.org.name]);
    add(B.main, nav('#/', '\u2190 ' + W.back, 'lr-back'));
    var h = put(B.main, el('h2', 'lr-bh', b.title));
    h.tabIndex = -1;
    if (b.subtitle) add(B.main, el('p', 'lr-bsub', b.subtitle));
    var rows = M.sortedRows(b);
    var yi = M.colIndex(b, 'year');
    var tools = put(B.main, el('div', 'lr-tools'));
    var filter = put(tools, el('input'));
    filter.type = 'search';
    filter.placeholder = 'Filter this board';
    filter.setAttribute('aria-label', 'Filter ' + b.title);
    var range = M.yearRange(b);
    add(tools, el('span', 'lr-bsub', rows.length + ' ' + W.names + (range ? ' \u00B7 ' + range : '')));
    if (yi >= 0 && rows.length > 24) {
      var dec = put(B.main, el('nav', 'lr-decades'));
      dec.setAttribute('aria-label', 'Jump to decade');
      var seen = {};
      rows.forEach(function (r, i) {
        var y = M.yearOf(r.c[yi]);
        if (y === null) return;
        var d = Math.floor(y / 10) * 10;
        if (seen[d]) return;
        seen[d] = true;
        var a = put(dec, nav('#', d + 's'));
        on(a, 'click', function (e) { e.preventDefault(); var t = doc.getElementById('lr-r' + i); if (t) { t.scrollIntoView({ block: 'center' }); t.classList.add('is-hit'); setTimeout(function () { t.classList.remove('is-hit'); }, 1600); } });
      });
    }
    var table = put(B.main, el('table', 'lr-table'));
    add(table, el('caption', 'lr-sr', b.title + (b.subtitle ? ', ' + b.subtitle : '')));
    var tr = put(put(table, el('thead')), el('tr'));
    b.cols.forEach(function (c) { var th = put(tr, el('th', '', c.label)); th.scope = 'col'; });
    var tb = put(table, el('tbody'));
    var trs = rows.map(function (r, i) {
      var row = put(tb, el('tr'));
      row.id = 'lr-r' + i;
      b.cols.forEach(function (c, ci) {
        var td = put(row, el('td', 'lr-c-' + c.role));
        if (c.role === 'name') {
          td.appendChild(nameLinks(r.c[ci], c.multi));
          if (r.text || r.photo) {
            var cite = put(td, el('div', 'lr-cite'));
            if (r.photo) { var im = put(cite, el('img')); im.src = r.photo; im.alt = ''; im.loading = 'lazy'; }
            if (r.text) add(cite, el('span', '', r.text));
          }
        } else td.textContent = r.c[ci];
      });
      return { el: row, hay: M.fold(r.c.join(' ') + ' ' + (r.text || '')).toLowerCase() };
    });
    if (!rows.length) add(B.main, el('p', 'lr-none', '\u2014'));
    on(filter, 'input', function () {
      var q = M.fold(filter.value).toLowerCase().trim();
      trs.forEach(function (t) { t.el.hidden = !!q && t.hay.indexOf(q) < 0; });
    });
    h.focus();
  }

  function personPage(p) {
    clear(B.main);
    setTitle([p.name, W.honours, data.org.name]);
    add(B.main, nav('#/', '\u2190 ' + W.back, 'lr-back'));
    var h = put(B.main, el('h2', 'lr-person-h', p.name));
    h.tabIndex = -1;
    var ul = put(B.main, el('ul', 'lr-honours'));
    // Repeat wins on one board read as one line: "Club Champions (Men) 1931, 1932, 1935".
    var groups = [], byBoard = {};
    p.honours.forEach(function (x) {
      var ni = M.colIndex(x.board, 'name'), yi = M.colIndex(x.board, 'year');
      var extra = x.row.c.filter(function (v, i) { return i !== yi && x.board.cols[i].role !== 'name' && v; }).join(' \u00B7 ');
      var plain = !extra && !x.row.text && !x.row.photo && (!x.col || x.col === x.board.cols[ni]);
      var key = x.board.id + (x.col ? '|' + x.col.label : '');
      if (plain && byBoard[key]) { byBoard[key].years.push(x.year); return; }
      var g = { x: x, years: [x.year], extra: extra };
      if (plain) byBoard[key] = g;
      groups.push(g);
    });
    groups.forEach(function (g) {
      var x = g.x;
      var li = put(ul, el('li'));
      put(li, el('span', 'lr-h-year', g.years[0] || ''));
      var sp = put(li, el('span'));
      var a = put(sp, nav('#/b/' + x.board.slug));
      put(a, el('b', '', x.board.title));
      var role = x.col && M.colIndex(x.board, 'name') >= 0 && x.col !== x.board.cols[M.colIndex(x.board, 'name')] ? x.col.label : '';
      var sub = [x.board.subtitle, role, g.extra, g.years.length > 1 ? g.years.join(', ') : ''].filter(Boolean).join(' \u00B7 ');
      if (sub) put(sp, el('span', '', sub));
      if (x.row.text) put(sp, el('p', '', x.row.text));
      if (x.row.photo) { var im = put(sp, el('img')); im.src = x.row.photo; im.alt = p.name; }
    });
    if (mode !== 'kiosk') {
      var sh = put(B.main, el('button', 'lr-share', W.share));
      sh.type = 'button';
      on(sh, 'click', function () {
        var url = location.href;
        var done = function () { sh.textContent = W.copied; setTimeout(function () { sh.textContent = W.share; }, 2000); };
        if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) { navigator.share({ title: p.name + ' \u00B7 ' + data.org.name, url: url }).catch(function () {}); return; }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copy this link', url); });
        else window.prompt('Copy this link', url);
      });
    }
    h.focus();
  }

  function route() {
    if (mode === 'screen') return;
    var hsh = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    var m = hsh.match(/^(b|p)\/(.+)$/);
    window.scrollTo(0, 0);
    if (m && m[1] === 'b' && boardBySlug[m[2]]) { B.letter = ''; return boardPage(boardBySlug[m[2]]); }
    if (m && m[1] === 'p') {
      for (var i = 0; i < people.length; i++) if (people[i].slug === m[2]) { B.letter = ''; return personPage(people[i]); }
    }
    home();
    if (hsh && hsh !== 'browse') focusMain();
  }

  // =====================================================================================
  // MODES
  // =====================================================================================
  var mode = 'browse';
  var app = doc.getElementById('laurel') || put(body, el('div'));
  app.id = 'laurel';
  var idleTimer = null;

  function wantedMode() {
    var h = location.hash.replace(/^#\/?/, '');
    if (/^(screen|browse|kiosk)$/.test(h)) return h;
    if (/^(screen|browse|kiosk)$/.test(params.mode || '')) return params.mode;
    return /^(screen|browse|kiosk)$/.test(cfg.mode || '') ? cfg.mode : 'browse';
  }

  function go(next) {
    if (mode === 'kiosk' && next === 'browse') { attract(false); return; }
    mode = next;
    if (next === 'browse' && location.hash.replace(/^#\/?/, '') === 'screen') replaceHash('#/');
    if (next === 'screen' && !/^#\/?screen$/.test(location.hash)) replaceHash('#screen');
    start();
  }

  function attract(onScreen) {
    if (!S.root || !B.root) return;
    S.hidden = !onScreen;
    S.root.hidden = !onScreen;
    B.root.hidden = onScreen;
    if (onScreen) {
      B.input.value = ''; B.letter = '';
      if (location.hash.replace(/^#\/?/, '') !== 'kiosk') replaceHash('#kiosk');
      chrome();
      S.deck = buildDeck();
      show(0, true);
    } else {
      clearTimeout(S.timer);
      B.woke = Date.now();
      route();
      armIdle();
    }
  }
  function armIdle() {
    clearTimeout(idleTimer);
    if (mode !== 'kiosk' || !S.root || !S.root.hidden) return;
    idleTimer = setTimeout(function () { attract(true); }, (Number(cfg.kioskIdle) || 90) * 1000);
  }

  function start() {
    clearTimeout(S.timer);
    clear(app);
    S.cur = null; S.i = -1; S.hidden = false;
    applyTheme();
    if (mode === 'screen') {
      app.appendChild(buildScreen());
      S.browseBtn.hidden = PREVIEW;
      rebuild(false);
      setPaused(false);
      keepAwake();
      if (!EMBED && !(doc.fullscreenElement || doc.webkitFullscreenElement)) hint('Click anywhere or press F for full screen');
    } else if (mode === 'kiosk') {
      app.appendChild(buildBrowse());
      app.appendChild(buildScreen());
      S.browseBtn.hidden = true;
      S.ctl.hidden = true;
      attract(true);
      keepAwake();
    } else {
      app.appendChild(buildBrowse());
      route();
    }
  }

  function hint(text) {
    var hn = put(S.root, el('div', 'lr-hint', text));
    setTimeout(function () { hn.classList.add('is-gone'); }, 6000);
    setTimeout(function () { if (hn.parentNode) hn.parentNode.removeChild(hn); }, 7000);
  }

  // ---------- global listeners ----------
  on(window, 'hashchange', function () {
    var w = wantedMode();
    var h = location.hash.replace(/^#\/?/, '');
    if (/^(screen|browse|kiosk)$/.test(h) && w !== mode) { mode = w; start(); return; }
    if (mode === 'browse' || (mode === 'kiosk' && S.root && S.root.hidden)) route();
  });
  on(doc, 'keydown', function (e) {
    if (mode === 'screen') return screenKeys(e);
    if (mode === 'kiosk') { if (S.root && !S.root.hidden) attract(false); armIdle(); }
    if (mode === 'browse' && e.key === '/' && doc.activeElement !== B.input && B.input) { e.preventDefault(); B.input.focus(); }
  });
  ['pointerdown', 'touchstart', 'mousedown', 'wheel', 'scroll'].forEach(function (ev) {
    on(window, ev, function () {
      if (mode !== 'kiosk') return;
      if (S.root && !S.root.hidden && ev !== 'scroll' && ev !== 'wheel') { attract(false); return; }
      armIdle();
    }, { passive: true });
  });
  on(window, 'mousemove', function () { if (mode === 'screen') poke(); });
  // The tap that wakes a kiosk shouldn't also press whatever appears under the finger.
  on(window, 'click', function (e) {
    if (mode === 'kiosk' && B.woke && Date.now() - B.woke < 450) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  on(window, 'click', function (e) {
    if (mode !== 'screen' || EMBED) return;
    if (e.target.closest && e.target.closest('.lr-ctl')) return;
    if (!(doc.fullscreenElement || doc.webkitFullscreenElement)) fullscreen();
  });
  var resizeTimer = null, lastPortrait = null;
  on(window, 'resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if ((mode === 'screen' || mode === 'kiosk') && S.root && !S.hidden) rebuild(true);
      else if (lastPortrait !== isPortrait()) applyTheme();
      lastPortrait = isPortrait();
    }, 250);
  });
  on(doc, 'visibilitychange', function () { if (doc.visibilityState === 'visible' && (mode === 'screen' || mode === 'kiosk')) keepAwake(); });
  setInterval(tick, 10000);

  // A board hosted on a website checks for a newer copy, so screens update themselves after an upload.
  if (!EMBED && /^https?:$/.test(location.protocol)) {
    setInterval(function () {
      if (mode === 'browse') return;
      var url = location.href.split('#')[0];
      url += (url.indexOf('?') >= 0 ? '&' : '?') + '_lr=' + Date.now();
      var x = new XMLHttpRequest();
      x.open('GET', url, true);
      x.onload = function () {
        if (x.status !== 200) return;
        var m = x.responseText.match(/"updated":"([^"]+)"/);
        if (m && m[1] && m[1] !== data.updated) location.reload();
      };
      x.send();
    }, 10 * 60 * 1000);
  }

  // The editor's live preview talks to this window.
  if (PREVIEW) {
    on(window, 'message', function (e) {
      if (e.source !== window.parent || !e.data || typeof e.data !== 'object') return;
      var d = e.data;
      if (d.laurel === 'project') {
        if (typeof d.qr === 'string') cfg.qr = d.qr;
        if (d.licence !== undefined) cfg.licence = d.licence;
        load(d.project);
        if (d.mode && d.mode !== mode) { mode = d.mode; start(); }
        else if (mode === 'screen') { rebuild(true); }
        else { var y = window.scrollY; start(); window.scrollTo(0, y); }
        if (d.focus && mode === 'screen') focusBoard(d.focus);
        if (d.focus && mode === 'browse') { var b = data.boards.filter(function (x) { return x.id === d.focus; })[0]; if (b) location.hash = '#/b/' + b.slug; }
      } else if (d.laurel === 'focus') {
        if (mode === 'screen') focusBoard(d.board);
      } else if (d.laurel === 'step') {
        if (mode === 'screen') step(d.by || 1);
      }
    });
  }

  // ---------- boot ----------
  function boot() {
    try {
      load(readJSON('laurel-data') || {});
      mode = wantedMode();
      lastPortrait = isPortrait();
      start();
      if (PREVIEW && window.parent !== window) window.parent.postMessage({ laurel: 'ready' }, '*');
    } catch (err) {
      // Something this browser can't do: show the plain list that ships inside the file instead.
      html.className = html.className.replace(/\blr-js\b/g, '');
      if (window.console) console.error('Laurel:', err);
    }
  }
  var booted = false;
  function once() { if (!booted) { booted = true; boot(); } }
  // Fonts load lazily; ask for every embedded face now so the layout measures the real letters.
  if (doc.fonts && doc.fonts.forEach && window.Promise) {
    var loads = [];
    doc.fonts.forEach(function (f) { loads.push(f.load().catch(function () {})); });
    Promise.all(loads).then(once, once);
  } else once();
  setTimeout(once, 2500);
})();
