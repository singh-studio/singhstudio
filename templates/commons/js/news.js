/* The Commons, group news: What's on, the three one-off event pages, Stories and the four articles.
   Loaded after commons.js (front matter: js: news). Every part does nothing when its element is not on the page.
     #agenda-list, #mg, #chips   the four-week agenda (the first two weeks, then a button for the rest), the month of plates and the kind filters (whats-on)
     .nfeat[data-oneoff]         the three one-off days, next one first (whats-on)
     [data-oneoff] + #pf         one event page: date, calendar file, place form, other things that week
     time[data-ago], [data-garden-next], [data-newest]   story dates and the next Garden morning
     [data-month]                the month name in the What's on head, fitted to the width
   All dates are New Zealand time, taken from the browser clock. */
(function () {
  'use strict';
  var C = window.Commons;
  if (!C) return;
  var D = C.data, $ = C.$, $$ = C.$$, h = C.h, DOWS = C.DOWS, MONS = C.MONS;
  var rootEl = $('link[rel=icon]');
  var ROOT = rootEl ? rootEl.getAttribute('href').replace('favicon.svg', '') : '';
  var SLUG = { kai: 'kai-night', homework: 'homework-club', reo: 'te-reo', pantry: 'pantry', playgroup: 'playgroup', repair: 'repair-cafe', garden: 'garden' };
  var WORDS = ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function isoOf(c) { return c.y + '-' + pad(c.m) + '-' + pad(c.d); }
  function dayWord(n) { return n <= 10 ? WORDS[n] : String(n); }

  /* ---------- the one-off days ---------- */
  function ruleOf(el) {
    var d = el.dataset;
    return { id: d.id, name: d.name, m: +d.m, dow: +d.dow, nth: +d.nth, start: d.start, end: d.end, open: d.open, url: d.url, line: d.line };
  }
  function nthDate(y, m, dow, nth) {
    if (nth > 0) { var f = C.civil(C.dayNum(y, m, 1)); return C.civil(f.n + ((dow - f.dow + 7) % 7) + (nth - 1) * 7); }
    var last = C.civil(C.dayNum(y, m + 1, 1) - 1);
    return C.civil(last.n - ((last.dow - dow + 7) % 7));
  }
  function occ(rule, y) {
    var c = nthDate(y, rule.m, rule.dow, rule.nth), a = C.hm(rule.start), b = C.hm(rule.end);
    return { c: c, st: C.nzToMs(c, a[0], a[1]), en: C.nzToMs(c, b[0], b[1]), rule: rule };
  }
  function nextOcc(rule, ms) {
    var y = C.today(ms).c.y;
    for (var i = 0; i < 3; i++) { var o = occ(rule, y + i); if (o.en > ms) return o; }
    return occ(rule, y);
  }
  function fillDate(scope, c) {
    $$('[data-slot=num]', scope).forEach(function (e) { e.textContent = c.d; });
    $$('[data-slot=dow]', scope).forEach(function (e) { e.textContent = DOWS[c.dow]; });
    $$('[data-slot=mon]', scope).forEach(function (e) { e.textContent = MONS[c.m - 1]; });
    $$('time', scope).forEach(function (t) { if (t.hasAttribute('datetime')) t.setAttribute('datetime', isoOf(c)); });
  }
  function icsFor(o, extra) {
    C.downloadIcs(o.rule.name + ' at ' + C.orgFull(), o.st, o.en, o.rule.line + (extra ? ' ' + extra : ''), o.rule.id);
  }

  /* ---------- what's on: the three days ---------- */
  var RULES = [];
  (function () {
    var box = $('#nfeats'); if (!box) return;
    var ms = C.nowMs(), list = $$('.nfeat', box).map(function (el) {
      var r = ruleOf(el); RULES.push(r);
      var o = nextOcc(r, ms); fillDate(el, o.c);
      return { el: el, st: o.st };
    });
    list.sort(function (a, b) { return a.st - b.st; });
    list.forEach(function (x) { box.appendChild(x.el); });
  })();

  /* ---------- what's on: the month name fitted to the head ---------- */
  (function () {
    var el = $('[data-month]'); if (!el) return;
    el.textContent = MONS[C.today(C.nowMs()).c.m - 1];
    function fit() {
      var W = el.parentNode.clientWidth; if (!W) return;
      var size = 100, i, room = W < 700 ? 10 : 0;
      /* the typeface's optical size axis makes width change a little with size, so measure again after each step.
         The tight tracking lets the last letter's ink run a little past its box, so leave that much back from the edge. */
      for (i = 0; i < 5; i++) {
        el.style.fontSize = size + 'px';
        var w = el.scrollWidth;
        size = Math.max(48, Math.min(360, size * (W - 1 - room - size * .05) / w));
      }
      el.style.fontSize = size + 'px';
    }
    fit();
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    /* a different type set changes the width of the word, so fit it again once the new fonts are in */
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', fit);
    if (window.MutationObserver) new MutationObserver(function () { fit(); setTimeout(fit, 60); setTimeout(fit, 700); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-type'] });
  })();

  /* ---------- what's on: the agenda, the month of plates, the filters ---------- */
  (function () {
    var list = $('#agenda-list'); if (!list || !RULES.length) return;
    var KINDS = ['all', 'food', 'learning', 'making', 'little', 'event'];
    var LABEL = { all: 'Everything', food: 'Food', learning: 'Learning', making: 'Making', little: 'Little ones', event: 'One-off days' };
    var todayN = C.today(C.nowMs()).c.n;
    var S = { start: todayN, filter: 'all', my: 0, mm: 0, more: false };
    var cur = C.civil(todayN); S.my = cur.y; S.mm = cur.m;
    var chipBtns = {}, status = $('#ag-status'), empty = $('#ag-empty'), prev = $('#ag-prev'), next = $('#ag-next'), range = $('#ag-range'), moreWrap = $('#ag-more-wrap'), moreBtn = $('#ag-more');

    function oneoffsOn(c, ms) {
      var out = [];
      RULES.forEach(function (r) { var o = occ(r, c.y); if (o.c.n === c.n && o.en > ms) out.push(o); });
      return out;
    }
    function itemsOn(c, ms) {
      if (C.isClosed(c)) return [];
      var out = C.sessionsOn(c).map(function (s) { return { kind: s.kind, s: s }; });
      oneoffsOn(c, ms).forEach(function (o) { out.push({ kind: 'event', o: o }); });
      return out;
    }
    function itemsFor(c, ms, all) { return itemsOn(c, ms).filter(function (x) { return all || S.filter === 'all' || x.kind === S.filter; }); }
    function closure(c) {
      var y = c.m === 12 ? c.y : c.y - 1;
      return { from: C.civil(C.dayNum(y, D.closure.from[0], D.closure.from[1])), to: C.civil(C.dayNum(y + 1, D.closure.to[0], D.closure.to[1])) };
    }
    function timeParts(s) { var r = C.range(s.start, s.end), i = r.indexOf(' to '); return [r.slice(0, i), 'to ' + r.slice(i + 4)]; }
    function nowWord(st, en, ms, until) { return st <= ms && ms < en ? 'On now, until ' + until + '.' : ''; }

    function itemNode(x, c, ms) {
      var li, tp, body, acts;
      if (x.s) {
        var s = x.s, a = C.hm(s.start), b = C.hm(s.end), st = C.nzToMs(c, a[0], a[1]), en = C.nzToMs(c, b[0], b[1]);
        tp = timeParts(s);
        var label = s.name + ' on ' + C.dateLong(c);
        li = h('li', { 'class': 'ai k-' + s.kind });
        body = h('div', { 'class': 'ai-b' }, [
          h('h4', { 'class': 'ai-n' }, [h('a', { href: ROOT + 'programmes/' + SLUG[s.id] + '/', text: s.name })]),
          h('p', { 'class': 'ai-l', text: s.line + ' ' + s.cost + '.' })
        ]);
        if (st <= ms && ms < en) body.appendChild(h('p', { 'class': 'ai-now', text: 'On now, until ' + C.fmtT(s.end, true) }));
        var det = h('button', { 'class': 'btn btn-outline ai-det', type: 'button', 'aria-label': 'Details for ' + label }, ['Details']);
        det.addEventListener('click', function () { C.openSession(s, c); });
        var cal = h('button', { 'class': 'btn btn-outline', type: 'button', 'aria-label': 'Add ' + label + ' to your calendar' }, ['Add to calendar']);
        cal.addEventListener('click', function () { C.downloadIcs(s.name + ' at ' + C.orgFull(), st, en, s.detail + ' ' + s.cost + '.', s.id); });
        acts = h('div', { 'class': 'ai-a' }, [det, cal]);
      } else {
        var o = x.o, r = o.rule;
        var tt = r.id === 'lunch' ? ['noon', 'to 2.30pm'] : r.id === 'bike' ? ['10am', 'to 1pm'] : ['6pm', 'soup at 5.30pm'];
        tp = tt;
        li = h('li', { 'class': 'ai k-event' });
        body = h('div', { 'class': 'ai-b' }, [
          h('h4', { 'class': 'ai-n' }, [h('a', { href: ROOT + r.url, text: r.name })]),
          h('p', { 'class': 'ai-l', text: r.line })
        ]);
        /* same label and width as the other rows; the name says what is on the other side, and on phones the title is the same link, so this one is dropped */
        var more = h('a', { 'class': 'btn btn-outline ai-det ai-same', href: ROOT + r.url, 'aria-label': 'Details for ' + r.name + ' on ' + C.dateLong(c) + (r.id === 'meeting' ? '' : ', with a form to save a place') }, ['Details']);
        var cal2 = h('button', { 'class': 'btn btn-outline', type: 'button', 'aria-label': 'Add ' + r.name + ' on ' + C.dateLong(c) + ' to your calendar' }, ['Add to calendar']);
        cal2.addEventListener('click', function () { icsFor(o); });
        acts = h('div', { 'class': 'ai-a' }, [more, cal2]);
      }
      li.appendChild(h('p', { 'class': 'ai-t' }, [h('span', { 'class': 'ai-s', text: tp[0] }), h('span', { 'class': 'ai-e', text: tp[1] })]));
      li.appendChild(body); li.appendChild(acts);
      return li;
    }
    function dayNode(c, items, ms) {
      var iso = isoOf(c), isT = c.n === todayN;
      var g = h('section', { 'class': 'dg' + (isT ? ' is-today' : ''), id: 'd-' + iso, 'aria-labelledby': 'dh-' + iso });
      var hd = h('h3', { 'class': 'dg-h', id: 'dh-' + iso, tabindex: '-1' }, [
        h('span', { 'class': 'dg-w', text: DOWS[c.dow] }), h('span', { 'class': 'dg-n', text: String(c.d) }), h('span', { 'class': 'dg-m', text: MONS[c.m - 1] }),
        isT ? h('span', { 'class': 'dg-t', text: 'Today' }) : null
      ]);
      var ul = h('ul', { 'class': 'dg-list' });
      items.forEach(function (x) { ul.appendChild(itemNode(x, c, ms)); });
      g.appendChild(hd); g.appendChild(ul);
      return g;
    }
    function breakNode(c, endN) {
      var cl = closure(c), reopen = C.civil(cl.to.n + 1), first = null, n = reopen.n, i;
      for (i = 0; i < 8 && !first; i++, n++) { var cc = C.civil(n), ss = C.sessionsOn(cc); if (ss.length) first = { s: ss[0], c: cc }; }
      var g = h('section', { 'class': 'dg-break', 'aria-label': 'The summer break' });
      g.appendChild(h('h3', { tabindex: '-1', text: 'The house is closed until ' + C.dateLong(reopen) }));
      g.appendChild(h('p', { text: 'The summer break runs from ' + C.dateLong(cl.from) + ' to ' + C.dateLong(cl.to) + '.' + (first ? ' The first thing back is ' + first.s.name.replace(/^The /, 'the ') + ' on ' + C.dateLong(first.c) + ', ' + C.range(first.s.start, first.s.end) + '.' : '') }));
      if (reopen.n > endN) {
        var b = h('button', { 'class': 'btn', type: 'button' }, ['See what is on from ' + C.dateLong(reopen)]);
        b.addEventListener('click', function () { S.start = reopen.n; S.my = reopen.y; S.mm = reopen.m; S.more = false; render(); status.textContent = ''; setTimeout(function () { status.textContent = range.textContent; }, 30); var hd = $('.dg-h', list); if (hd) { hd.scrollIntoView({ block: 'start' }); hd.focus({ preventScroll: true }); } });
        g.appendChild(b);
      }
      return g;
    }

    function render() {
      var ms = C.nowMs(), endN = S.start + 27, visEnd = S.more ? endN : S.start + 13, counts = {}, shown = 0, n, inBreak = false, nodes = [], hasLate = false;
      KINDS.forEach(function (k) { counts[k] = 0; });
      for (n = S.start; n <= endN; n++) {
        var c = C.civil(n), late = n > visEnd;
        if (C.isClosed(c)) {
          if (!inBreak) { if (late) hasLate = true; else nodes.push(breakNode(c, endN)); inBreak = true; }
          continue;
        }
        inBreak = false;
        if (late) { itemsFor(c, ms, true).forEach(function (x) { counts.all++; counts[x.kind]++; }); if (itemsFor(c, ms, false).length) hasLate = true; continue; }
        var its = itemsFor(c, ms, false);
        itemsFor(c, ms, true).forEach(function (x) { counts.all++; counts[x.kind]++; });
        if (its.length) { shown += its.length; nodes.push(dayNode(c, its, ms)); }
      }
      list.textContent = '';
      nodes.forEach(function (x) { list.appendChild(x); });
      var hasBreak = nodes.some(function (x) { return x.className === 'dg-break'; });
      if (!shown && !hasBreak) {
        empty.hidden = false;
        empty.textContent = 'Nothing in ' + LABEL[S.filter].toLowerCase() + ' over ' + (S.more || !hasLate ? 'these ' + (S.more ? 'four' : 'two') + ' weeks' : 'the next two weeks') + '. Choose Everything, or look at the weeks after.';
      } else empty.hidden = true;
      moreWrap.hidden = !(hasLate && !S.more);
      var a = C.civil(S.start), b = C.civil(visEnd);
      range.textContent = 'Showing ' + (S.filter === 'all' ? 'everything' : LABEL[S.filter].toLowerCase()) + ', ' + (S.more ? 'four' : 'two') + ' weeks, from ' + C.dateLong(a) + ' to ' + C.dateLong(b) + '.';
      KINDS.forEach(function (k) {
        var btn = chipBtns[k]; if (!btn) return;
        btn.setAttribute('aria-pressed', String(S.filter === k));
        $('.n', btn).textContent = counts[k];
        btn.setAttribute('aria-label', LABEL[k] + ', ' + counts[k] + (counts[k] === 1 ? ' thing' : ' things'));
      });
      prev.setAttribute('aria-disabled', String(S.start <= todayN));
      next.setAttribute('aria-disabled', String(S.start >= todayN + 28 * 8));
      renderMonth();
      return { shown: shown, endN: endN, hasLate: hasLate };
    }

    /* the month of plates */
    var mg = $('#mg');
    function arrow(dir) { return '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="' + (dir < 0 ? 'M20 12H5M11 5l-7 7 7 7' : 'M4 12h15M13 5l7 7-7 7') + '" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="square"/></svg>'; }
    var mLabel = h('p', { 'class': 'mg-label', id: 'mg-label' });
    var mPrev = h('button', { 'class': 'arrow', type: 'button', 'aria-label': 'Previous month', html: arrow(-1) });
    var mNext = h('button', { 'class': 'arrow', type: 'button', 'aria-label': 'Next month', html: arrow(1) });
    var tbl = h('table', { 'class': 'mgt', 'aria-labelledby': 'mg-label' });
    var head = '<thead><tr>' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (d, i) { return '<th scope="col"><abbr title="' + DOWS[(i + 1) % 7] + '">' + d + '</abbr></th>'; }).join('') + '</tr></thead>';
    tbl.innerHTML = head + '<tbody></tbody>';
    mg.appendChild(h('div', { 'class': 'mg-head' }, [mLabel, h('div', { 'class': 'mg-nav' }, [mPrev, mNext])]));
    mg.appendChild(tbl);
    mg.appendChild(h('p', { 'class': 'mg-key', 'aria-hidden': 'true', html: '<span><i></i>Something on</span><span><i class="oo"></i>A big day</span><span><i class="shut"></i>Closed</span><span><i class="today"></i>Today</span>' }));
    var mStatus = $('#ag-status');
    mPrev.addEventListener('click', function () { monthStep(-1); });
    mNext.addEventListener('click', function () { monthStep(1); });
    function monthStep(d) {
      var t = C.civil(todayN), idx = (S.my * 12 + S.mm - 1) + d, min = t.y * 12 + t.m - 1;
      if (idx < min || idx > min + 11) return;
      S.my = Math.floor(idx / 12); S.mm = idx % 12 + 1; renderMonth();
      mStatus.textContent = ''; setTimeout(function () { mStatus.textContent = mLabel.textContent + '.'; }, 30);
    }
    function renderMonth() {
      var ms = C.nowMs(), t = C.civil(todayN), idx = S.my * 12 + S.mm - 1, min = t.y * 12 + t.m - 1;
      mLabel.textContent = MONS[S.mm - 1] + ' ' + S.my;
      mPrev.setAttribute('aria-disabled', String(idx <= min)); mNext.setAttribute('aria-disabled', String(idx >= min + 11));
      var first = C.dayNum(S.my, S.mm, 1), lastN = C.dayNum(S.mm === 12 ? S.my + 1 : S.my, S.mm === 12 ? 1 : S.mm + 1, 1) - 1;
      var lead = (C.civil(first).dow + 6) % 7, body = $('tbody', tbl), tr, n;
      body.textContent = '';
      for (n = first - lead; n <= lastN + ((7 - ((lastN - first + lead + 1) % 7)) % 7); n++) {
        if ((n - first + lead) % 7 === 0) { tr = h('tr'); body.appendChild(tr); }
        if (n < first || n > lastN) { tr.appendChild(h('td')); continue; }
        var c = C.civil(n), td = h('td'), isT = n === todayN, all = itemsFor(c, ms, true), its = itemsFor(c, ms, false);
        var cls = 'mc', full = DOWS[c.dow] + ' ' + c.d + ' ' + MONS[c.m - 1] + (isT ? ', today' : ''), node;
        if (C.isClosed(c)) { node = h('span', { 'class': cls + ' shut' + (isT ? ' today' : '') }, [String(c.d), h('span', { 'class': 'visually-hidden', text: ', the house is closed' + (isT ? ', today' : '') })]); }
        else if (n < todayN) { node = h('span', { 'class': cls + ' past' }, [String(c.d), h('span', { 'class': 'visually-hidden', text: ', has passed' })]); }
        else if (its.length) {
          var big = its.some(function (x) { return x.kind === 'event'; });
          node = h('button', { 'class': cls + (big ? ' oo' : ' has') + (isT ? ' today' : ''), type: 'button', 'data-n': n, 'aria-label': full + ', ' + its.length + (its.length === 1 ? ' thing' : ' things') + (big ? ', a big day' : '') }, [String(c.d)]);
          (function (nn) { node.addEventListener('click', function () { goTo(nn); }); })(n);
        } else { node = h('span', { 'class': cls + (all.length ? ' dim' : ' none') + (isT ? ' today' : '') }, [String(c.d), h('span', { 'class': 'visually-hidden', text: all.length ? ', hidden by the filter' : ', nothing on' + (isT ? ', today' : '') })]); }
        td.appendChild(node); tr.appendChild(td);
      }
    }
    function goTo(n) {
      if (n < S.start || n > S.start + 27) {
        var c = C.civil(n), mon = n - ((c.dow + 6) % 7);
        S.start = Math.max(todayN, mon); S.more = false;
      }
      if (n > S.start + 13 && !S.more) S.more = true;
      render();
      var c2 = C.civil(n), hd = document.getElementById('dh-' + isoOf(c2));
      if (hd) { hd.scrollIntoView({ block: 'start' }); hd.focus({ preventScroll: true }); }
    }

    /* chips and paging */
    var chips = $('#chips');
    KINDS.forEach(function (k) {
      var b = h('button', { 'class': 'chip', type: 'button', 'aria-pressed': String(k === 'all') }, [LABEL[k] + ' ', h('span', { 'class': 'n', 'aria-hidden': 'true', text: '0' })]);
      b.addEventListener('click', function () {
        S.filter = k; var r = render(), opened = false;
        if (!r.shown && r.hasLate && !S.more) { S.more = true; r = render(); opened = true; }
        status.textContent = ''; setTimeout(function () { status.textContent = 'Showing ' + r.shown + (r.shown === 1 ? ' thing' : ' things') + (k === 'all' ? '' : ' for ' + LABEL[k].toLowerCase()) + (opened ? ', over four weeks because the first two had none.' : '.'); }, 30);
      });
      chipBtns[k] = b; chips.appendChild(b);
    });
    function page(d) {
      var ns = S.start + d * 28;
      if (ns < todayN || ns > todayN + 28 * 8) return;
      S.start = ns; S.more = false; var c = C.civil(ns); S.my = c.y; S.mm = c.m; render();
      status.textContent = ''; setTimeout(function () { status.textContent = range.textContent; }, 30);
    }
    moreBtn.addEventListener('click', function () {
      var had = list.children.length;
      S.more = true; render();
      var first = list.children[had], hd = first && ($('.dg-h', first) || $('h3', first));
      if (hd) hd.focus();
      var end = C.civil(S.start + 27);
      status.textContent = ''; setTimeout(function () { status.textContent = 'Showing the next two weeks, to ' + C.dateLong(end) + '.'; }, 30);
    });
    prev.addEventListener('click', function () { page(-1); });
    next.addEventListener('click', function () { page(1); });
    render();
  })();

  /* ---------- one event page ---------- */
  (function () {
    var root = $('[data-oneoff]'); if (!root || $('#nfeats')) return;
    var rule = ruleOf(root), ms = C.nowMs(), o = nextOcc(rule, ms);
    fillDate(document, o.c);
    var extra = rule.id === 'meeting' ? 'Soup is from 5.30pm. No booking is needed.' : rule.id === 'bike' ? '' : 'Bring a salad or a pudding if you can.';
    $$('[data-ics]').forEach(function (b) { b.addEventListener('click', function () { icsFor(o, extra); }); });
    var whenText = DOWS[o.c.dow] + ' ' + o.c.d + ' ' + MONS[o.c.m - 1];

    /* other things that week */
    var ow = $('#ow');
    if (ow) {
      var mon = o.c.n - ((o.c.dow + 6) % 7), i, rows = [];
      for (i = 0; i < 7; i++) {
        var c = C.civil(mon + i);
        C.sessionsOn(c).forEach(function (s) {
          var r = C.range(s.start, s.end), k = r.indexOf(' to ');
          rows.push(h('li', { 'class': 'ow-i' }, [
            h('time', { 'class': 'ow-d', datetime: isoOf(c) }, [h('span', { text: DOWS[c.dow].slice(0, 3) }), h('span', { text: c.d + ' ' + MONS[c.m - 1].slice(0, 3) })]),
            h('a', { 'class': 'ow-n', href: ROOT + 'programmes/' + SLUG[s.id] + '/', text: s.name }),
            h('span', { 'class': 'ow-t', text: r.slice(0, k) + ' ' + 'to ' + r.slice(k + 4) })
          ]));
        });
      }
      ow.textContent = '';
      rows.forEach(function (x) { ow.appendChild(x); });
    }

    /* the place form */
    var f = $('#pf'); if (!f) return;
    var kind = f.dataset.kind, KEY = 'news.' + kind;
    var isLunch = kind === 'lunch';
    var units = isLunch ? $$('#lt .p:not(.t)').sort(function (a, b) { return (+a.dataset.g - +b.dataset.g) || (+a.dataset.r - +b.dataset.r); }) : $$('#stands .stand.is-free').sort(function (a, b) { return +a.dataset.i - +b.dataset.i; });
    var max = parseInt($('#pf-n').getAttribute('max'), 10), base = units.length;
    var noun = isLunch ? ['place', 'places'] : ['stand', 'stands'];
    var nIn = $('#pf-n'), nameIn = $('#pf-name'), err = $('#pf-name-err'), go = $('#pf-go');
    var done = $('.pf-done'), msg = $('.pf-msg'), live = $('[data-status]');
    var freeEl = $(isLunch ? '#lt-free' : '#bk-free'), yoursEl = $(isLunch ? '#lt-yours' : '#bk-yours'), yoursWrap = yoursEl.parentNode;
    var saved = C.sget(KEY);
    function n() { var v = parseInt(nIn.value, 10); return isNaN(v) ? 1 : Math.max(1, Math.min(max, v)); }
    function paint() {
      var k = saved ? saved.n : n();
      units.forEach(function (u, i) { u.classList.toggle('is-prev', !saved && i < k); u.classList.toggle('is-yours', !!saved && i < k); });
      freeEl.textContent = base - (saved ? saved.n : 0);
      yoursEl.textContent = saved ? saved.n : 0; yoursWrap.hidden = !saved;
      go.textContent = 'Save ' + k + ' ' + noun[k === 1 ? 0 : 1];
    }
    function say(t) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 30); }
    function message(s) {
      var k = s.n, w = cap(dayWord(k)) + ' ' + noun[k === 1 ? 0 : 1] + ' saved for ' + s.name + '. ';
      if (isLunch) return w + 'The long lunch is on ' + whenText + ', noon to 2.30pm.' + (s.bring && s.bring !== 'nothing yet' ? ' You are bringing ' + s.bring + '.' : ' Bring a salad or a pudding if you can.') + (s.diet && s.diet.length ? ' Graeme has noted ' + s.diet.join(', ') + '.' : '');
      return w + 'Bike fix day is on ' + whenText + ', 10am to 1pm, in the car park.' + (s.what ? ' Noted: ' + s.what + '.' : '');
    }
    function show(s, announce) {
      f.hidden = true; done.hidden = false; msg.textContent = message(s);
      if (announce) msg.focus();
    }
    function setN(v) { nIn.value = Math.max(1, Math.min(max, v)); paint(); }
    $$('.nstep-b', f).forEach(function (b) { b.addEventListener('click', function () { setN(n() + parseInt(b.dataset.step, 10)); }); });
    nIn.addEventListener('input', function () { var v = parseInt(nIn.value, 10); if (v) paint(); });
    nIn.addEventListener('change', function () { setN(n()); });
    nameIn.addEventListener('input', function () { err.hidden = true; nameIn.removeAttribute('aria-invalid'); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = nameIn.value.trim();
      if (!name) { err.hidden = false; nameIn.setAttribute('aria-invalid', 'true'); nameIn.focus(); return; }
      var s = { n: n(), name: name };
      if (isLunch) { var r = $('input[name=bring]:checked', f); s.bring = r ? r.value : ''; s.diet = $$('input[name=diet]:checked', f).map(function (c) { return c.value; }); }
      else s.what = ($('#pf-what').value || '').trim();
      saved = s; C.sset(KEY, s); paint(); show(s, true);
    });
    $('[data-change]', done).addEventListener('click', function () {
      saved = null; C.sset(KEY, null); done.hidden = true; f.hidden = false; paint(); say('Your ' + noun[1] + ' were released. You can choose again.'); nIn.focus();
    });
    if (saved && saved.n) { nIn.value = saved.n; nameIn.value = saved.name || ''; paint(); show(saved, false); } else paint();
  })();

  /* ---------- stories ---------- */
  (function () {
    var ms = C.nowMs(), t = C.today(ms).c.n, newest = null;
    $$('time[data-ago]').forEach(function (el) {
      var a = parseInt(el.dataset.ago, 10), c = C.civil(t - a);
      var ago = a === 1 ? '1 day ago' : a + ' days ago';
      if (el.hasAttribute('data-split')) {
        el.textContent = '';
        el.appendChild(h('span', { 'class': 'ag-d', text: C.dateLong(c) })); el.appendChild(h('span', { 'class': 'visually-hidden', text: ', ' })); el.appendChild(h('span', { 'class': 'ag-a', text: ago }));
      } else el.textContent = C.dateLong(c) + ', ' + ago;
      el.setAttribute('datetime', isoOf(c));
      if (newest === null || a < newest) newest = a;
    });
    var nw = $('[data-newest]'); if (nw && newest !== null) { nw.textContent = newest; }
    var g = $('[data-garden-next]');
    if (g) { var ev = C.nextOf('garden', ms); if (ev) g.textContent = C.dateLong(ev.c); }
  })();
})();
