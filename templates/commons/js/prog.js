/* The Commons, group prog: the programmes list and the programme pages. Loaded after commons.js (front matter: js: prog).
   Reusable parts, each a no-op when its element is not on the page:
     ol[data-next="<session id>"]   next four dates from the browser clock, in New Zealand time (fills each li's [data-slot])
     form[data-pform]               every [data-req] control needs a value; tied errors, focus to the first, then data-done text in .pdone
     #wall + chips                  the wall chart filters on the programmes page
     .gm                            the small twelve-month ring: this month lit */
(function () {
  'use strict';
  var C = window.Commons;
  if (!C) return;
  var $ = C.$, $$ = C.$$;

  function iso(c) { return c.y + '-' + (c.m < 10 ? '0' : '') + c.m + '-' + (c.d < 10 ? '0' : '') + c.d; }

  /* ---------- next dates ---------- */
  function upcoming(id, n) {
    var ms = C.nowMs(), all = C.events(ms, 0, 400), out = [], i;
    for (i = 0; i < all.length && out.length < n; i++) if (all[i].s.id === id && all[i].en > ms) out.push(all[i]);
    return out;
  }
  function nextText(id) {
    var ev = upcoming(id, 1)[0];
    return ev ? C.dateLong(ev.c) : 'the next one';
  }
  function fillNext(ol) {
    var ms = C.nowMs(), td = C.today(ms), out = upcoming(ol.dataset.next, 4);
    breakLine(ol, out);
    $$('.pn-i', ol).forEach(function (li, k) {
      var ev = out[k];
      if (!ev) return;
      var t = $('time', li);
      if (t) t.setAttribute('datetime', iso(ev.c));
      $('[data-slot=num]', li).textContent = ev.c.d;
      $('[data-slot=dow]', li).textContent = C.DOWS[ev.c.dow];
      $('[data-slot=mon]', li).textContent = C.MONS[ev.c.m - 1];
      $('[data-slot=time]', li).textContent = C.range(ev.s.start, ev.s.end);
      var d = ev.c.n - td.c.n, w;
      if (ev.st <= ms && ms < ev.en) w = 'On now, until ' + C.fmtT(ev.s.end, true) + '.';
      else w = d === 0 ? 'Today.' : d === 1 ? 'Tomorrow.' : 'In ' + d + ' days.';
      var gap = k === 0 ? (C.isClosed(td.c) ? 999 : 0) : ev.c.n - out[k - 1].c.n;
      if (gap > 40) w += ' The first after the summer break.';
      $('[data-slot=when]', li).textContent = w;
    });
  }
  /* the summer-break line under a four-date strip shows only when those four dates cross the closure */
  function breakLine(ol, out) {
    var span = ol.parentNode && $('[data-break]', ol.parentNode); if (!span) return;
    var td = C.today(C.nowMs()), cross = false, i, from = null, to = null;
    if (C.isClosed(td.c) && out[0]) { cross = true; to = out[0]; }
    for (i = 1; i < out.length && !cross; i++) if (out[i].c.n - out[i - 1].c.n > 40) { cross = true; from = out[i - 1]; to = out[i]; }
    span.hidden = !cross;
    if (cross) span.textContent = 'The house is shut from 24 December to 20 January.' + (from ? ' The dates skip from ' + C.MONS[from.c.m - 1] + ' to ' + C.MONS[to.c.m - 1] + '.' : ' The first date is after the break.');
    var p = span.parentNode, rest = false;
    Array.prototype.forEach.call(p.childNodes, function (n) { if (n !== span && n.textContent.trim()) rest = true; });
    p.hidden = span.hidden && !rest;
  }
  $$('ol[data-next]').forEach(fillNext);
  setInterval(function () { $$('ol[data-next]').forEach(fillNext); }, 60000);

  /* ---------- forms ---------- */
  function initForm(f) {
    var par = f.parentNode, done = $('.pdone', par), msgEl = $('.pdone-msg', par), status = $('[data-pstatus]', par);
    function clearErr(inp) {
      inp.removeAttribute('aria-invalid');
      var e = document.getElementById(inp.id + '-err'); if (e) e.hidden = true;
    }
    $$('[data-req]', f).forEach(function (inp) {
      inp.addEventListener('input', function () { clearErr(inp); });
      inp.addEventListener('change', function () { clearErr(inp); });
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      $$('[data-req]', f).forEach(function (inp) {
        var empty = !(inp.value || '').trim(), err = document.getElementById(inp.id + '-err');
        if (err) err.hidden = !empty;
        if (empty) { inp.setAttribute('aria-invalid', 'true'); bad = bad || inp; } else inp.removeAttribute('aria-invalid');
      });
      if (bad) { bad.focus(); return; }
      var msg = f.dataset.done.replace(/\{([\w-]+)\}/g, function (m, k) {
        if (k === 'next') return nextText(f.dataset.nextId);
        var el = document.getElementById(k);
        return el ? (el.value || '').trim() : '';
      });
      f.hidden = true; done.hidden = false; msgEl.textContent = msg;
      status.textContent = '';
      msgEl.focus();
    });
    var again = $('[data-again]', par);
    if (again) again.addEventListener('click', function () {
      f.reset();
      $$('[aria-invalid]', f).forEach(clearErr);
      $$('.err', f).forEach(function (x) { x.hidden = true; });
      if (f._resetPhoto) f._resetPhoto();
      done.hidden = true; f.hidden = false; status.textContent = '';
      var first = $('input, textarea, select', f); if (first) first.focus();
    });
  }
  $$('form[data-pform]').forEach(initForm);

  /* ---------- Repair Café: an optional photo that stays in the browser ---------- */
  (function () {
    var inp = $('#tell-photo'); if (!inp) return;
    var prev = $('#tell-prev'), img = $('#tell-img'), nameEl = $('#tell-photo-name'), err = $('#tell-photo-err'), url = null, f = inp.form;
    function reset() {
      if (url) URL.revokeObjectURL(url);
      url = null; img.removeAttribute('src'); prev.hidden = true; nameEl.textContent = ''; inp.value = '';
      inp.removeAttribute('aria-invalid'); err.hidden = true;
    }
    f._resetPhoto = reset;
    inp.addEventListener('change', function () {
      var file = inp.files && inp.files[0];
      if (!file) { reset(); return; }
      if (!/^image\//.test(file.type)) { reset(); err.hidden = false; inp.setAttribute('aria-invalid', 'true'); return; }
      if (url) URL.revokeObjectURL(url);
      err.hidden = true; inp.removeAttribute('aria-invalid');
      url = URL.createObjectURL(file); img.src = url; prev.hidden = false; nameEl.textContent = file.name;
    });
    $('#tell-rm').addEventListener('click', function () { reset(); inp.focus(); });
  })();

  /* ---------- the wall chart ---------- */
  (function () {
    var wall = $('#wall'); if (!wall) return;
    var rows = $$('.wr', wall), st = { day: 'all', who: 'all' }, status = $('#pl-status'), empty = $('#pl-empty');
    var dayBtns = $$('button[data-day]'), whoBtns = $$('button[data-who]');
    var WORDS = ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];
    function apply() {
      var n = 0;
      rows.forEach(function (r) {
        var days = r.dataset.days.split(' '), who = r.dataset.who.split(' ');
        var ok = (st.day === 'all' || days.indexOf(st.day) > -1) && (st.who === 'all' || who.indexOf(st.who) > -1);
        r.hidden = !ok; if (ok) { r.dataset.g = String(n % 4); n++; }
      });
      empty.textContent = st.day === '0' ? 'Nothing runs on Sundays, because the hall is hired out. Try another day.' : 'Nothing runs on that day for that group. Try another day, or choose All.';
      empty.hidden = n > 0;
      status.textContent = n === rows.length ? 'Showing all seven.' : n === 0 ? 'Showing no programmes.' : 'Showing ' + WORDS[n] + ' of the seven.';
    }
    function pick(btns, key, val) {
      btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset[key] === val)); });
      st[key] = val; apply();
    }
    dayBtns.forEach(function (b) {
      b.addEventListener('click', function () { pick(dayBtns, 'day', b.getAttribute('aria-pressed') === 'true' ? 'all' : b.dataset.day); });
    });
    whoBtns.forEach(function (b) {
      b.addEventListener('click', function () { pick(whoBtns, 'who', b.dataset.who); });
    });
  })();

  /* ---------- the small ring of months ---------- */
  var gm = $$('.gm');
  if (gm.length) {
    var mi = C.today(C.nowMs()).c.m - 1;
    gm.forEach(function (c) { c.setAttribute('fill', parseInt(c.getAttribute('data-m'), 10) === mi ? 'var(--accent)' : 'var(--page)'); });
  }
})();
