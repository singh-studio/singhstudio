/* The Commons, group house: find us (route chooser, the house name on the map plate, today's hours, the question form),
   and the 404 page's back button.  Loaded after commons.js; every part checks that its element is on the page. */
(function () {
  'use strict';
  var C = window.Commons;
  if (!C) return;
  var $ = C.$, $$ = C.$$;

  /* ---------- routes ---------- */
  var svg = $('#fm-svg');
  if (svg) {
    var radios = $$('input[name=way]'), sum = $('#route-sum'), stat = $('#route-status'), panels = $$('.hh-mode');
    var setWay = function (id, announce) {
      var head = '';
      svg.setAttribute('data-mode', id);
      panels.forEach(function (p) {
        var on = p.dataset.mode === id;
        p.hidden = !on;
        if (on) { sum.textContent = p.dataset.sum; head = $('.hh-mode-h', p).textContent; }
      });
      if (announce) {
        stat.textContent = '';
        setTimeout(function () { stat.textContent = 'Showing the route ' + head.toLowerCase() + '. The steps are below the map.'; }, 30);
      }
    };
    radios.forEach(function (r) { r.addEventListener('change', function () { if (r.checked) setWay(r.value, true); }); });
    var cur = radios.filter(function (r) { return r.checked; })[0];
    setWay(cur ? cur.value : 'train', false);
  }

  /* ---------- the house name, written on the plate ---------- */
  var nameEl = $('#fm-name'), src = $('#fm-src');
  if (nameEl) {
    var NS = 'http://www.w3.org/2000/svg', CX = 873, CY = 320, MAXW = 150, MAXH = 124;
    /* The map is scaled to fit its box, so a size in map units is smaller on a phone.  The name is never set below 15 rendered pixels:
       the sizes allowed are the map sizes from 21 down that still come to 15px or more, and a long name wraps onto more lines or is cut short. */
    var sizesNow = function () {
      var m = svg && svg.getScreenCTM && svg.getScreenCTM(), sc = m && m.a > 0 ? m.a : 1, out = [], u;
      for (u = 21; u >= 15; u -= 1) if (u * sc >= 15 - 0.01) out.push(u);
      if (!out.length) out.push(Math.ceil(15 / sc));
      if (out.length > 4) out = [out[0], out[Math.floor(out.length / 3)], out[Math.floor(out.length * 2 / 3)], out[out.length - 1]];
      return out;
    };
    var layoutName = function () {
      var name = ((src && src.textContent) || '').replace(/\s+/g, ' ').trim() || 'Tide Street Community House';
      var title = $('#fm-t'); if (title) title.textContent = 'A map of how to reach ' + name;
      nameEl.textContent = '';
      var probe = document.createElementNS(NS, 'tspan'); nameEl.appendChild(probe);
      var wide = function (s) { probe.textContent = s; return probe.getComputedTextLength(); };
      var wrap = function () {
        var lines = [], cur = '';
        name.split(' ').forEach(function (w) {
          var test = cur ? cur + ' ' + w : w;
          if (wide(test) <= MAXW) { cur = test; return; }
          if (cur) { lines.push(cur); cur = ''; }
          while (wide(w) > MAXW && w.length > 1) {
            var k = w.length - 1; while (k > 1 && wide(w.slice(0, k)) > MAXW) k--;
            lines.push(w.slice(0, k)); w = w.slice(k);
          }
          cur = w;
        });
        if (cur) lines.push(cur);
        return lines;
      };
      var SIZES = sizesNow(), fs = SIZES[0], lines = [], lh = 0, i;
      for (i = 0; i < SIZES.length; i++) {
        fs = SIZES[i]; nameEl.style.fontSize = fs + 'px'; lh = fs * 1.14; lines = wrap();
        if (lines.length * lh <= MAXH) break;
      }
      var most = Math.max(1, Math.floor(MAXH / lh));
      if (lines.length > most) { lines = lines.slice(0, most); lines[most - 1] = lines[most - 1].slice(0, -1) + '…'; }
      nameEl.textContent = '';
      var y0 = CY - (lines.length - 1) * lh / 2 + fs * .35;
      lines.forEach(function (ln, k) {
        var t = document.createElementNS(NS, 'tspan');
        t.setAttribute('x', CX); t.setAttribute('y', (y0 + k * lh).toFixed(1)); t.textContent = ln; nameEl.appendChild(t);
      });
    };
    layoutName();
    window.addEventListener('resize', layoutName);
    if (window.MutationObserver) {
      if (src) new MutationObserver(layoutName).observe(src, { childList: true, characterData: true, subtree: true });
      new MutationObserver(function () { setTimeout(layoutName, 60); setTimeout(layoutName, 700); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-type'] });
    }
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(layoutName);
      if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', layoutName);
    }
  }

  /* ---------- today in the hours ---------- */
  var hours = $$('.hh-hours-list li');
  if (hours.length) {
    var closure = $('#closure-t');
    var markToday = function () {
      var td = C.today(C.nowMs()).c, closed = C.isClosed(td);
      hours.forEach(function (li) {
        var is = !closed && parseInt(li.dataset.dow, 10) === td.dow;
        li.classList.toggle('is-today', is);
        $('.hh-today', li).hidden = !is;
        if (is) li.setAttribute('aria-current', 'date'); else li.removeAttribute('aria-current');
      });
      if (closure) closure.textContent = closed ? 'The house is closed for the summer break, from 24 December to 20 January.' : 'We close for the summer break from 24 December to 20 January.';
    };
    markToday();
    setInterval(markToday, 60000);
  }

  /* ---------- the question form ---------- */
  var form = $('#ask-form');
  if (form) {
    var done = $('#ask-done'), msgEl = $('#ask-msg-done'), status = $('#ask-status'), again = $('#ask-again');
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var clearErr = function (inp) {
      inp.removeAttribute('aria-invalid');
      var e = document.getElementById(inp.id + '-err'); if (e) e.hidden = true;
    };
    $$('[data-req]', form).forEach(function (inp) { inp.addEventListener('input', function () { clearErr(inp); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      $$('[data-req]', form).forEach(function (inp) {
        var v = (inp.value || '').trim(), invalid = !v || (inp.hasAttribute('data-email') && !EMAIL.test(v));
        var err = document.getElementById(inp.id + '-err');
        if (err) err.hidden = !invalid;
        if (invalid) { inp.setAttribute('aria-invalid', 'true'); bad = bad || inp; } else inp.removeAttribute('aria-invalid');
      });
      if (bad) { bad.focus(); return; }
      var msg = form.dataset.done.replace(/\{([\w-]+)\}/g, function (m, k) { var el = document.getElementById(k); return el ? (el.value || '').trim() : ''; });
      form.hidden = true; done.hidden = false; msgEl.textContent = msg;
      status.textContent = '';
      msgEl.focus();
    });
    again.addEventListener('click', function () {
      form.reset();
      $$('[aria-invalid]', form).forEach(clearErr);
      $$('.err', form).forEach(function (x) { x.hidden = true; });
      done.hidden = true; form.hidden = false; status.textContent = '';
      var first = $('input, textarea', form); if (first) first.focus();
    });
  }

  /* ---------- 404: go back ---------- */
  var back = $('#nf-back');
  if (back) back.addEventListener('click', function () {
    if (history.length > 1) history.back(); else { var l = $('.site-header .logo'); if (l) location.href = l.href; }
  });
})();
