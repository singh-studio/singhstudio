/* The Commons, group prog2: the pantry, te reo for beginners, Playgroup and Garden morning. Loaded after prog.js (front matter: js: prog,prog2).
   Each part is a no-op when its element is not on the page:
     [data-weeks] / [data-term-start]   the next te reo term (first Wednesday of February, May, August or October) and its eight Wednesdays
     [data-gring]                       the twelve-month ring: this month lit, press a month to see what is ready then
     [data-bedm]                        each bed's "Ready now / Ready next month / Ready in March", from the browser clock
     .p2-ml                             the month list: this month marked
     .p2-crates, .p2-strip, ...         plates lay in order when a drawing first comes into view (not with reduced motion) */
(function () {
  'use strict';
  var C = window.Commons;
  if (!C) return;
  var $ = C.$, $$ = C.$$;

  function iso(c) { return c.y + '-' + (c.m < 10 ? '0' : '') + c.m + '-' + (c.d < 10 ? '0' : '') + c.d; }
  var td = C.today(C.nowMs()).c;

  /* ---------- te reo terms ---------- */
  var TERM_MONTHS = [2, 5, 8, 10];
  function firstWednesday(y, m) {
    var n = C.dayNum(y, m, 1), c = C.civil(n);
    return n + ((3 - c.dow + 7) % 7);
  }
  function nextTermStart() {
    var ys = [td.y, td.y + 1], i, j, n;
    for (i = 0; i < ys.length; i++) for (j = 0; j < TERM_MONTHS.length; j++) {
      n = firstWednesday(ys[i], TERM_MONTHS[j]);
      if (n >= td.n) return n;
    }
    return td.n;
  }
  (function () {
    var starts = $$('[data-term-start]'), weeks = $$('[data-wk]');
    if (!starts.length && !weeks.length) return;
    var n0 = nextTermStart(), text = C.dateLong(C.civil(n0));
    starts.forEach(function (el) { el.textContent = text; });
    weeks.forEach(function (el) {
      var c = C.civil(n0 + 7 * parseInt(el.getAttribute('data-wk'), 10));
      el.textContent = C.dateLong(c);
      el.setAttribute('datetime', iso(c));
    });
    var hid = document.getElementById('term');
    if (hid) hid.value = text;
    /* the big term start beside the enrol form */
    var tc = C.civil(n0), away = n0 - td.n;
    function set(k, v) { $$('[data-ts=' + k + ']').forEach(function (el) { el.textContent = v; }); }
    set('num', tc.d); set('dow', C.DOWS[tc.dow]); set('mon', C.MONS[tc.m - 1]);
    set('when', away === 0 ? 'The term starts today.' : away === 1 ? 'The term starts tomorrow.' : 'In ' + away + ' days.');
    $$('time[data-ts]').forEach(function (el) { el.setAttribute('datetime', iso(tc)); });
  })();

  /* ---------- the garden ---------- */
  var nowM = td.m - 1;
  function fit(crop) {
    var words = crop.split(' '), eff = 0, i;
    for (i = 0; i < words.length; i++) eff = Math.max(eff, words[i].length);
    if (words.length > 1) eff = Math.max(eff, Math.floor((crop.length + 1) / 2) + 1);
    return Math.min(17, 105 / eff).toFixed(1) + 'cqw';
  }
  (function () {
    var wrap = $('[data-gring]'); if (!wrap) return;
    var btns = $$('.p2-gm', wrap), k = $('#gd-k'), v = $('#gd-v');
    function show(m, announce) {
      var crop = '';
      btns.forEach(function (b) {
        var on = parseInt(b.dataset.m, 10) === m;
        b.setAttribute('aria-pressed', String(on));
        if (on) crop = b.dataset.crop;
      });
      var kt = m === nowM ? 'Ready now' : 'Ready in ' + C.MONS[m];
      if (k.textContent !== kt) k.textContent = kt;
      if (v.textContent !== crop) v.textContent = crop;
      v.style.setProperty('--fs', fit(crop));
    }
    btns.forEach(function (b) {
      b.disabled = false;
      b.classList.toggle('is-now', parseInt(b.dataset.m, 10) === nowM);
      b.addEventListener('click', function () { show(parseInt(b.dataset.m, 10)); });
    });
    show(nowM);
  })();
  $$('[data-bedm]').forEach(function (p) {
    var m = parseInt(p.dataset.bedm, 10), d = (m - nowM + 12) % 12, extra = /, with the beans$/.test(p.textContent) ? ', with the beans' : '';
    p.textContent = (d === 0 ? 'Ready now' : d === 1 ? 'Ready next month' : 'Ready in ' + C.MONS[m]) + extra;
    p.classList.toggle('is-now', d === 0);
  });
  $$('.p2-ml li').forEach(function (li, i) {
    li.classList.toggle('is-now', i === nowM);
    if (i === nowM) li.setAttribute('aria-current', 'date'); else li.removeAttribute('aria-current');
  });

  /* ---------- big type that fills its block: [data-fit="<largest px>"] is sized so its line just fits the width it has ---------- */
  function fitAll() {
    $$('[data-fit]').forEach(function (el) {
      var box = el.parentNode, max = parseFloat(el.getAttribute('data-fit')) || 400, cs = getComputedStyle(box), fs = 100, w, cw, i;
      cw = box.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      el.style.width = 'max-content'; el.style.display = 'block';
      /* widths do not scale exactly with size (optical sizes, hinting), so measure and correct a few times */
      for (i = 0; i < 4; i++) {
        el.style.fontSize = fs + 'px';
        w = el.getBoundingClientRect().width;
        fs = Math.max(40, Math.min(max, fs * cw / w * 0.985));
      }
      el.style.fontSize = fs.toFixed(1) + 'px';
      el.style.width = ''; el.style.display = '';
    });
  }
  fitAll();
  window.addEventListener('resize', fitAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', fitAll);
  new MutationObserver(function () { setTimeout(fitAll, 60); setTimeout(fitAll, 600); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-type', 'data-palette'] });

  /* ---------- plates lay in order when a drawing first comes into view ---------- */
  (function () {
    var targets = $$('.p2-crates, .p2-strip, .p2-ring-draw, .p2-gring-in, .p2-moments');
    if (!targets.length) return;
    var reduced = C.reduced && (typeof C.reduced === 'function' ? C.reduced() : C.reduced);
    if (reduced || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.remove('p2-pre');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    targets.forEach(function (t) {
      t.classList.add('p2-pre'); io.observe(t);
    });
  })();
})();
