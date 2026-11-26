/* The Commons, group "act": give, help out, hire. Loaded after commons.js; every init checks that its elements are on the page.
   Facts come from window.COMMONS (data.js); dates and helpers from window.Commons (commons.js). All dates are New Zealand time. */
(function () {
  'use strict';
  var C = window.Commons, D = window.COMMONS;
  if (!C || !D) return;
  var $ = C.$, $$ = C.$$, h = C.h, doc = document, reduced = C.reduced;
  var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  var WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  function small(n) { return n <= 10 ? WORDS[n] : String(n); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  /* money in whole cents, so halves never drift: 1750 is $17.50 and 3500 is $35 */
  function money(cents) {
    var whole = Math.floor(cents / 100), frac = cents % 100;
    return '$' + whole.toLocaleString('en-NZ') + (frac ? '.' + (frac < 10 ? '0' + frac : frac) : '');
  }
  function say(el, text) { if (!el) return; el.textContent = ''; setTimeout(function () { el.textContent = text; }, 30); }
  function jump(el) { el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }
  function bad(input, err, isBad) {
    err.hidden = !isBad;
    if (isBad) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    return isBad;
  }
  function clearOnInput(input, err) { input.addEventListener('input', function () { input.removeAttribute('aria-invalid'); err.hidden = true; }); }
  function iso(c) { return c.y + '-' + (c.m < 10 ? '0' : '') + c.m + '-' + (c.d < 10 ? '0' : '') + c.d; }
  function fromIso(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); if (!m) return null;
    var c = C.civil(C.dayNum(+m[1], +m[2], +m[3]));
    return (c.y === +m[1] && c.m === +m[2] && c.d === +m[3]) ? c : null;
  }
  function minutes(s) { var a = C.hm(s); return a[0] * 60 + a[1]; }
  function dowShort(c) { return C.DOWS[c.dow].slice(0, 3); }
  function monShort(c) { return C.MONS[c.m - 1].slice(0, 3); }

  /* =====================================================================
     GIVE
     ===================================================================== */
  function initGive() {
    if (!$('#g-tool')) return;
    var status = $('#g-status');
    function toTool(n, freq) {
      var range = $('#giverange');
      range.value = n; range.dispatchEvent(new Event('input', { bubbles: true }));
      if (freq) {
        var r = $('input[name=freq][value="' + freq + '"]');
        if (r && !r.checked) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
      }
      jump($('#g-top'));
      $('#given').focus({ preventScroll: true });
      say(status, 'The giving tool is set to ' + n + (n === 1 ? ' plate' : ' plates') + (freq === 'weekly' ? ', every week' : ', once') + '. ' + $('#givesentence').textContent);
    }
    $$('[data-lay]').forEach(function (b) { b.addEventListener('click', function () { toTool(parseInt(b.dataset.lay, 10), 'once'); }); });
    var wn = $('#wk-n'), wsum = $('#wk-sum');
    function wkSentence(n) {
      var per = n * D.counts.platePrice, yr = per * D.org.weeksOpen;
      return cap(small(n)) + (n === 1 ? ' plate' : ' plates') + ' every week is ' + money(per * 100) + ' a week, and ' + money(yr * 100) + ' over the ' + D.org.weeksOpen + ' weeks we are open.';
    }
    function wkValue() { var v = parseInt(wn.value, 10); return v >= 1 && v <= 90 ? v : null; }
    wn.addEventListener('input', function () { var v = wkValue(); if (v) wsum.textContent = wkSentence(v); });
    wn.addEventListener('change', function () { wn.value = clamp(parseInt(wn.value, 10) || 1, 1, 90); wsum.textContent = wkSentence(+wn.value); });
    $('#wk-minus').addEventListener('click', function () { wn.value = clamp((wkValue() || 1) - 1, 1, 90); wsum.textContent = wkSentence(+wn.value); });
    $('#wk-plus').addEventListener('click', function () { wn.value = clamp((wkValue() || 1) + 1, 1, 90); wsum.textContent = wkSentence(+wn.value); });
    $('#wk-set').addEventListener('click', function () { var v = wkValue() || clamp(parseInt(wn.value, 10) || 1, 1, 90); wn.value = v; toTool(v, 'weekly'); });
    wsum.textContent = wkSentence(wkValue() || 2);
  }

  /* =====================================================================
     HELP OUT
     ===================================================================== */
  var ROLE_SESSION = { dish: 'kai', packer: 'pantry', tutor: 'homework', fixer: 'repair', garden: 'garden' };
  var ROLE_TIME = { dish: ['19:00', '20:30'], packer: ['09:00', '10:00'], tutor: ['15:15', '17:15'], fixer: ['09:45', '13:15'], garden: ['09:00', '11:00'] };
  function ruleHit(s, c) {
    var r = s.rule;
    if (r.type === 'weekly') return r.dows.indexOf(c.dow) > -1;
    if (r.type === 'nth') return c.dow === r.dow && Math.ceil(c.d / 7) === r.n;
    if (r.type === 'alt') return c.dow === r.dow && Math.abs(Math.round((c.n - C.dayNum(r.anchor[0], r.anchor[1], r.anchor[2])) / 7)) % 2 === 0;
    return false;
  }
  function initHelp() {
    if (!$('#roles')) return;
    var roleById = {}; D.roles.forEach(function (r) { roleById[r.id] = r; });
    var yours = C.sget('act.yours') || [];
    var picked = null, rosterLive = $('#r-status');
    var pickEl = $('#join-pick'), form = $('#joinform'), done = $('#join-done');

    function shiftsFor(role, wkStart) {
      var s = D.sessions.filter(function (x) { return x.id === ROLE_SESSION[role]; })[0], ms = C.nowMs(), out = [], closed = false;
      for (var i = 0; i < 7; i++) {
        var c = C.civil(wkStart + i);
        if (!ruleHit(s, c)) continue;
        var t = ROLE_TIME[role], e = C.hm(t[1]);
        if (C.nzToMs(c, e[0], e[1]) <= ms) continue;
        if (C.isClosed(c)) { closed = true; continue; }
        out.push(c);
      }
      return { list: out, closed: closed };
    }
    function shiftBtn(role, c) {
      var key = role.id + '|' + c.n, mine = yours.indexOf(key) > -1, t = ROLE_TIME[role.id];
      var plates = h('span', { 'class': 'sh-p', 'aria-hidden': 'true' });
      for (var i = 0; i < role.needed; i++) plates.appendChild(h('i', { 'class': mine && i === 0 ? 'you' : '' }));
      var more = role.needed - (mine ? 1 : 0);
      var note = mine ? 'You are down' + (more ? ', ' + more + ' more needed' : ' for this one') : role.needed + ' needed';
      var b = h('button', { 'class': 'shift', type: 'button', 'data-role': role.id, 'data-n': c.n, 'aria-pressed': String(!!(picked && picked.role === role.id && picked.n === c.n)),
        'aria-label': role.name + ', ' + C.dateLong(c) + ', ' + C.range(t[0], t[1]) + '. ' + note + '. Press to start the form with this shift.' }, [
        h('span', { 'class': 'sh-d', text: dowShort(c) + ' ' + c.d + ' ' + monShort(c) }), plates, h('span', { 'class': 'sh-n', text: note })]);
      b.addEventListener('click', function () { pick(role.id, c.n, true); });
      return b;
    }
    /* phones: each job lists its next two dates, with the rest behind a native "More dates" disclosure (the table is hidden there) */
    function phoneRoster(weeks) {
      return h('div', { 'class': 'rmob' }, D.roles.map(function (role) {
        var all = [], closed = false;
        weeks.forEach(function (w) { var sh = shiftsFor(role.id, w.n); sh.list.forEach(function (c) { all.push(c); }); if (sh.closed) closed = true; });
        var li = function (c) { return h('li', null, [shiftBtn(role, c)]); };
        var note = closed ? h('p', { 'class': 'r-none', text: 'Closed for ' + D.closure.label + '.' }) : null;
        var kids = [h('h3', null, [role.name, h('small', { text: role.when })]), h('ul', null, all.slice(0, 2).map(li))];
        if (all.length > 2) kids.push(h('details', { 'class': 'rmore' }, [h('summary', { text: 'More dates' }), h('ul', null, all.slice(2).map(li)), note]));
        else if (note) kids.push(note);
        if (!all.length && !note) kids.push(h('p', { 'class': 'r-none', text: 'No shift in the next five weeks.' }));
        return h('section', { 'class': 'rm-role', 'aria-label': role.name }, kids);
      }));
    }
    function buildRoster() {
      var host = $('#rosterwrap'); if (!host) return;
      var t = C.today(C.nowMs()).c, mon = t.n - ((t.dow + 6) % 7);
      var weeks = [0, 1, 2, 3, 4].map(function (w) { var c = C.civil(mon + w * 7); return { n: mon + w * 7, label: w === 0 ? 'This week' : 'Week of ' + c.d + ' ' + monShort(c) }; });
      var head = h('tr', null, [h('th', { scope: 'col', text: 'Job' })].concat(weeks.map(function (w) { return h('th', { scope: 'col', text: w.label }); })));
      var body = D.roles.map(function (role) {
        var cells = weeks.map(function (w) {
          var sh = shiftsFor(role.id, w.n), td = h('td', { 'data-week': w.label });
          if (!sh.list.length) {
            td.className = sh.closed ? '' : 'none';
            td.appendChild((sh.closed ? h('p', { 'class': 'r-none', text: 'Closed for ' + D.closure.label + '.' }) : h('p', { 'class': 'r-none' }, [h('span', { 'aria-hidden': 'true', text: '–' }), h('span', { 'class': 'visually-hidden', text: 'No shift this week.' })])));
            return td;
          }
          var ul = h('ul');
          sh.list.forEach(function (c) { ul.appendChild(h('li', null, [shiftBtn(role, c)])); });
          td.appendChild(ul);
          return td;
        });
        return h('tr', null, [h('th', { scope: 'row' }, [role.name, h('small', { text: role.when })])].concat(cells));
      });
      host.textContent = '';
      host.appendChild(phoneRoster(weeks));
      host.appendChild(h('table', { 'class': 'rtab' }, [h('caption', { 'class': 'visually-hidden', text: 'Shifts for the next five weeks. Each empty plate is a place still open.' }), h('thead', null, [head]), h('tbody', null, body)]));
    }
    function nextShift(role) {
      var t = C.today(C.nowMs()).c, mon = t.n - ((t.dow + 6) % 7);
      for (var w = 0; w < 5; w++) { var s = shiftsFor(role, mon + w * 7); if (s.list.length) return s.list[0].n; }
      return null;
    }
    function pick(role, n, scroll) {
      var r = $('input[name=role][value="' + role + '"]');
      if (r) { r.checked = true; $('#j-role-err').hidden = true; }
      picked = { role: role, n: n };
      if (n != null) { var c = C.civil(n), cb = $('input[name=day][value="' + C.DOWS[c.dow] + '"]'); if (cb) cb.checked = true; }
      pickEl.hidden = false;
      pickEl.textContent = roleById[role].name + (n != null ? ', ' + C.dateLong(C.civil(n)) + ', ' + C.range(ROLE_TIME[role][0], ROLE_TIME[role][1]) : '') + '. You can change the job below.';
      $$('.shift').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.role === role && +b.dataset.n === n)); });
      if (done && !done.hidden) { done.hidden = true; form.hidden = false; }
      if (scroll) { jump($('#join')); $('#j-name').focus({ preventScroll: true }); say(rosterLive, 'Form started for ' + roleById[role].name + (n != null ? ' on ' + C.dateLong(C.civil(n)) : '') + '.'); }
    }
    buildRoster();

    $$('[data-pick]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); pick(a.dataset.pick, null, true); }); });
    $$('input[name=role]').forEach(function (r) {
      r.addEventListener('change', function () {
        picked = { role: r.value, n: picked && picked.role === r.value ? picked.n : null };
        $$('.shift').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.role === picked.role && +b.dataset.n === picked.n)); });
        pickEl.hidden = true; $('#j-role-err').hidden = true;
      });
    });
    /* arriving with ?role=tutor or #role-tutor */
    var q = /[?&]role=([a-z]+)/.exec(location.search);
    if (q && roleById[q[1]]) pick(q[1], null, false);
    function openFromHash() {
      var m = /^#role-([a-z]+)$/.exec(location.hash);
      if (m) { var d = $('#role-' + m[1]); if (d && d.tagName === 'DETAILS') { d.open = true; setTimeout(function () { jump(d); }, 60); } }
    }
    openFromHash(); window.addEventListener('hashchange', openFromHash);

    var nameIn = $('#j-name'), emIn = $('#j-email'), roleErr = $('#j-role-err');
    clearOnInput(nameIn, $('#j-name-err')); clearOnInput(emIn, $('#j-email-err'));
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var role = $('input[name=role]:checked');
      var b1 = !role, b2 = !nameIn.value.trim(), b3 = !EMAIL.test(emIn.value.trim());
      roleErr.hidden = !b1;
      bad(nameIn, $('#j-name-err'), b2); bad(emIn, $('#j-email-err'), b3);
      if (b1) { $('input[name=role]').focus(); return; }
      if (b2) { nameIn.focus(); return; }
      if (b3) { emIn.focus(); return; }
      var rid = role.value, n = picked && picked.role === rid && picked.n != null ? picked.n : nextShift(rid);
      if (n != null && yours.indexOf(rid + '|' + n) < 0) { yours.push(rid + '|' + n); C.sset('act.yours', yours); }
      var days = $$('input[name=day]:checked').map(function (c) { return c.value; });
      var msg = 'Thank you, ' + nameIn.value.trim() + '. Ana Fifita looks after volunteers and will write to ' + emIn.value.trim() + ' about ' + roleById[rid].name.toLowerCase() +
        (n != null ? ', starting with ' + C.dateLong(C.civil(n)) : '') + (days.length ? '. You said ' + days.join(', ').replace(/, ([^,]*)$/, ' and $1') + (days.length === 1 ? ' suits you' : ' suit you') : '') + '. This is a demo, so nothing was sent.';
      $('#join-msg').textContent = msg; form.hidden = true; done.hidden = false;
      var np = $('.nine i:not(.you)'); if (np) np.classList.add('you');
      buildRoster(); $('#join-msg').focus();
    });
    $('#join-again').addEventListener('click', function () {
      done.hidden = true; form.hidden = false; form.reset(); picked = null; $$('.nine i.you').forEach(function (i) { i.classList.remove('you'); }); pickEl.hidden = true; nameIn.focus();
      $$('.shift').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    });
  }

  /* =====================================================================
     HIRE
     ===================================================================== */
  var ROOMS = [
    { id: 'hall', name: 'main hall', rate: D.rooms[0].rate },
    { id: 'kitchen', name: 'kitchen', rate: D.rooms[1].rate },
    { id: 'front', name: 'front room', rate: D.rooms[2].rate }
  ];
  var PARTS = [{ id: 'morning', name: 'Morning', a: 0, b: 720 }, { id: 'afternoon', name: 'Afternoon', a: 720, b: 1020 }, { id: 'evening', name: 'Evening', a: 1020, b: 1440 }];
  function nthOfMonth(c) { return Math.ceil(c.d / 7); }
  /* What the programme takes. Each of the three parts is free or taken, with the reasons. */
  function dayInfo(c) {
    var info = { closed: false, lunch: false, parts: PARTS.map(function () { return { free: true, why: [] }; }) };
    if (C.isClosed(c)) { info.closed = true; return info; }
    function take(i, why) { info.parts[i].free = false; info.parts[i].why.push(why); }
    if (c.dow === 0) {
      var lunch = c.m === 12 && nthOfMonth(c) === 2;
      info.lunch = lunch;
      PARTS.forEach(function (p, i) { take(i, lunch ? 'The long lunch, noon to 2.30pm. The hall is not hired out that day.' : 'Sundays go to the groups that already hire the hall.'); });
    }
    C.sessionsOn(c).forEach(function (s) {
      if (s.id === 'garden') return;
      var a = minutes(s.open || s.start), b = minutes(s.end);
      PARTS.forEach(function (p, i) { if (a < p.b && b > p.a) take(i, s.name + ', ' + C.range(s.start, s.end) + '.'); });
    });
    if (c.m === 3 && c.dow === 4 && nthOfMonth(c) === 3) take(2, 'The annual meeting, soup at 5.30pm and the meeting at 6pm.');
    return info;
  }
  function initHire() {
    if (!$('#plan')) return;
    var live = { rooms: { hall: true, kitchen: false, front: false }, hours: 3, community: false, date: null, part: null };
    var pl = $('#pl'), hrs = $('#hrs');

    /* standing: 140 dots in 14 columns and 10 rows, nudged so it reads as a crowd */
    var g = $('#standing'), NS = 'http://www.w3.org/2000/svg', i, j;
    for (j = 0; j < 10; j++) for (i = 0; i < 14; i++) {
      var d = doc.createElementNS(NS, 'circle');
      d.setAttribute('cx', 96 + i * 32 + ((i * 7 + j * 3) % 5 - 2) * 3); d.setAttribute('cy', 152 + j * 24 + ((i * 5 + j * 11) % 5 - 2) * 3); d.setAttribute('r', 6);
      g.appendChild(d);
    }
    $$('input[name=layout]').forEach(function (r) { r.addEventListener('change', function () { pl.dataset.layout = r.value; }); });

    /* the sum, in cents */
    function calc() {
      var sel = ROOMS.filter(function (r) { return live.rooms[r.id]; });
      var rate = sel.reduce(function (t, r) { return t + (live.community ? r.rate * 50 : r.rate * 100); }, 0);
      return { sel: sel, rate: rate, total: rate * live.hours, each: function (r) { return live.community ? r.rate * 50 : r.rate * 100; } };
    }
    function names(sel) {
      var n = sel.map(function (r) { return r.name; });
      var s = n.length > 1 ? n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1] : n[0];
      return s;
    }
    function sentence() {
      var k = calc();
      if (!k.sel.length) return 'Choose at least one room to see a price.';
      return cap(names(k.sel)) + ', ' + live.hours + (live.hours === 1 ? ' hour' : ' hours') + ' at ' + money(k.rate) + ' is ' + money(k.total) + '.';
    }
    function dateText() {
      var c = fromIso(live.date); if (!c) return '';
      return C.dateLong(c) + (live.part ? ', in the ' + live.part : '');
    }
    function summary() {
      var k = calc();
      if (!k.sel.length) return 'Choose a room and a slot above and they will appear here.';
      var dt = dateText();
      return sentence() + (dt ? ' For ' + dt + '.' : ' Pick a day in the calendar to add it.');
    }
    function renderCalc() {
      var k = calc();
      $('#calc-sentence').textContent = sentence();
      var body = $('#calc-body'); body.textContent = '';
      k.sel.forEach(function (r) {
        body.appendChild(h('tr', null, [h('th', { scope: 'row', text: cap(r.name) }), h('td', { text: money(k.each(r)) + ' an hour' }), h('td', { text: String(live.hours) }), h('td', { text: money(k.each(r) * live.hours) })]));
      });
      $('#calc-total').textContent = k.sel.length ? money(k.total) : '$0';
      $('#calc-tab').hidden = k.sel.length < 2;
      ROOMS.forEach(function (r) { pl.classList.toggle('on-' + r.id, !!live.rooms[r.id]); var hit = $('.pl-hit[data-room=' + r.id + ']'); hit.classList.toggle('is-on', !!live.rooms[r.id]); });
      $('#ask-sum').textContent = summary();
    }
    $$('input[name=room]').forEach(function (cb) { cb.addEventListener('change', function () { live.rooms[cb.value] = cb.checked; $('#a-rooms-err').hidden = true; renderCalc(); }); });
    $$('.pl-hit').forEach(function (hit) {
      hit.addEventListener('click', function () { var cb = $('input[name=room][value=' + hit.dataset.room + ']'); cb.checked = !cb.checked; cb.dispatchEvent(new Event('change', { bubbles: true })); });
    });
    $$('input[name=rate]').forEach(function (r) { r.addEventListener('change', function () { live.community = r.value === 'community' && r.checked; renderCalc(); }); });
    function setHours(v) { live.hours = clamp(v, 1, 12); hrs.value = live.hours; renderCalc(); }
    hrs.addEventListener('input', function () { var v = parseInt(hrs.value, 10); if (v >= 1 && v <= 12) { live.hours = v; renderCalc(); } });
    hrs.addEventListener('change', function () { setHours(parseInt(hrs.value, 10) || 1); });
    $('#hrs-minus').addEventListener('click', function () { setHours(live.hours - 1); });
    $('#hrs-plus').addEventListener('click', function () { setHours(live.hours + 1); });

    /* ---------- the month ---------- */
    var t0 = C.today(C.nowMs()).c, status = $('#cal-status');
    /* with fewer than ten days of the month left (today counts), open on the next month; going back to this one stays allowed */
    var daysLeft = new Date(Date.UTC(t0.y, t0.m, 0)).getUTCDate() - t0.d + 1, late = daysLeft < 10;
    var cal = late ? { y: t0.m === 12 ? t0.y + 1 : t0.y, m: t0.m === 12 ? 1 : t0.m + 1 } : { y: t0.y, m: t0.m }, selN = null;
    /* the panel opens on the next day with a free slot, in the month shown, or in the first later month that has one */
    function hasFree(n) { var inf = dayInfo(C.civil(n)); return !inf.closed && inf.parts.some(function (p) { return p.free; }); }
    function firstFreeIn(y, m) {
      var days = new Date(Date.UTC(y, m, 0)).getUTCDate(), k;
      for (k = 1; k <= days; k++) { var n = C.dayNum(y, m, k); if (n >= t0.n && hasFree(n)) return n; }
      return null;
    }
    selN = firstFreeIn(cal.y, cal.m);
    if (selN == null) { var k2; for (k2 = 0; k2 < 400 && selN == null; k2++) if (hasFree(t0.n + k2)) selN = t0.n + k2; if (selN != null) { var sc = C.civil(selN); cal = { y: sc.y, m: sc.m }; } }
    var grid = $('#cal-grid'), panel = $('#cal-panel');
    function monthIndex(y, m) { return y * 12 + m - 1; }
    function titleOf() { return C.MONS[cal.m - 1] + ' ' + cal.y; }
    function describe(c, info) {
      if (info.closed) return C.dateLong(c) + '. Closed for ' + D.closure.label + '.';
      if (info.lunch) return C.dateLong(c) + (c.n === t0.n ? ', today' : '') + '. The long lunch, noon to 2.30pm. The hall is not hired out that day.';
      return C.dateLong(c) + (c.n === t0.n ? ', today' : '') + '. ' + PARTS.map(function (p, i) { return p.name.toLowerCase() + ' ' + (info.parts[i].free ? 'free' : 'taken'); }).join(', ') + '.';
    }
    function renderGrid(focusSel) {
      var first = C.civil(C.dayNum(cal.y, cal.m, 1)), lead = (first.dow + 6) % 7, days = new Date(Date.UTC(cal.y, cal.m, 0)).getUTCDate();
      grid.textContent = '';
      $('#cal-title').textContent = titleOf();
      $('#cal-prev').disabled = monthIndex(cal.y, cal.m) <= monthIndex(t0.y, t0.m);
      $('#cal-next').disabled = monthIndex(cal.y, cal.m) >= monthIndex(t0.y, t0.m) + 12;
      var chosen = fromIso(live.date), firstEnabled = null, selBtn = null, k;
      for (k = 0; k < lead; k++) grid.appendChild(h('span', { 'class': 'cday is-blank', 'aria-hidden': 'true' }));
      for (k = 1; k <= days; k++) {
        var c = C.civil(C.dayNum(cal.y, cal.m, k)), info = dayInfo(c), past = c.n < t0.n;
        var hs = h('span', { 'class': 'cd-h', 'aria-hidden': 'true' }, info.lunch ? [h('i', { 'class': 'plate hc-lunch' })] : info.parts.map(function (p, i) {
          var cls = 'hc' + (p.free ? '' : ' is-taken') + (chosen && chosen.n === c.n && live.part === PARTS[i].id ? ' is-chosen' : '');
          return h('i', { 'class': cls });
        }));
        var b = h('button', { 'class': 'cday' + (c.n === t0.n ? ' is-today' : '') + (info.closed ? ' is-closed' : ''), type: 'button', 'data-n': c.n, 'aria-pressed': String(c.n === selN), tabindex: '-1', 'aria-label': describe(c, info) }, [h('span', { 'class': 'cd-n', 'aria-hidden': 'true', text: String(k) }), hs]);
        if (past) b.disabled = true; else { if (firstEnabled == null) firstEnabled = b; if (c.n === selN) selBtn = b; }
        grid.appendChild(b);
      }
      var tab = selBtn || firstEnabled; if (tab) tab.tabIndex = 0;
      if (focusSel && tab) tab.focus();
    }
    function slotRow(c, info, i) {
      var p = PARTS[i], pt = info.parts[i], isChosen = live.date === iso(c) && live.part === p.id;
      var icon = h('i', { 'class': 'hc' + (pt.free ? '' : ' is-taken') + (isChosen ? ' is-chosen' : ''), 'aria-hidden': 'true' });
      if (pt.free) {
        var b = h('button', { 'class': 'slot', type: 'button', 'aria-pressed': String(isChosen) }, [icon, h('span', { 'class': 'slot-t' }, [h('strong', { text: p.name }), h('span', { text: isChosen ? 'Yours, filled in below' : 'Free. Press to choose it.' })])]);
        b.addEventListener('click', function () { choose(c, p.id); });
        return b;
      }
      return h('div', { 'class': 'slot is-off' }, [icon, h('span', { 'class': 'slot-t' }, [h('strong', { text: p.name }), h('span', { text: 'Taken. ' + pt.why[0] })])]);
    }
    function renderPanel() {
      panel.textContent = '';
      var c = selN != null ? C.civil(selN) : null;
      if (!c || c.m !== cal.m || c.y !== cal.y) { panel.appendChild(h('p', { text: 'Press a day to see its three slots.' })); return; }
      var info = dayInfo(c);
      panel.appendChild(h('h3', { text: C.dateLong(c) + (info.lunch ? ', the long lunch' : '') }));
      if (info.closed) { panel.appendChild(h('p', { 'class': 'panel-note', text: 'The house is closed for ' + D.closure.label + '. Pick a day after it reopens.' })); return; }
      PARTS.forEach(function (p, i) { panel.appendChild(slotRow(c, info, i)); });
      var any = info.parts.some(function (p) { return p.free; });
      panel.appendChild(h('p', { 'class': 'panel-note', text: any ? 'A free slot fills in the form at the bottom of the page.' : 'Nothing is free that day. Try another, or ask Moana in the form below.' }));
      if (live.date === iso(c) && live.part) panel.appendChild(h('a', { 'class': 'btn btn-ink', href: '#ask', text: 'Go to the form' }));
    }
    function selectDay(n, focus) {
      selN = n;
      $$('.cday', grid).forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.n === n)); b.tabIndex = +b.dataset.n === n ? 0 : -1; });
      renderPanel();
      if (focus) { var b = $('.cday[data-n="' + n + '"]', grid); if (b) b.focus(); }
    }
    function choose(c, partId) {
      live.date = iso(c); live.part = partId;
      $('#a-date').value = live.date;
      $$('input[name=part]').forEach(function (r) { r.checked = r.value === partId; });
      $('#a-date-err').hidden = true; $('#a-date').removeAttribute('aria-invalid');
      renderGrid(false); renderPanel(); $('#ask-sum').textContent = summary();
      say(status, 'Chosen: ' + C.dateLong(c) + ', ' + partId + '. It is filled in the form at the bottom of the page.');
    }
    grid.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('.cday:not(.is-blank)'); if (b && !b.disabled) selectDay(+b.dataset.n, false); });
    grid.addEventListener('keydown', function (e) {
      var b = e.target.closest && e.target.closest('.cday'); if (!b) return;
      var step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]; if (!step) return;
      e.preventDefault();
      var all = $$('.cday:not(.is-blank)', grid), idx = all.indexOf(b), nx = idx + step;
      while (nx >= 0 && nx < all.length && all[nx].disabled) nx += step > 0 ? 1 : -1;
      if (nx >= 0 && nx < all.length && !all[nx].disabled) { all[idx].tabIndex = -1; all[nx].tabIndex = 0; all[nx].focus(); }
    });
    function month(delta) {
      var idx = monthIndex(cal.y, cal.m) + delta, lo = monthIndex(t0.y, t0.m);
      if (idx < lo || idx > lo + 12) return;
      cal.y = Math.floor(idx / 12); cal.m = idx % 12 + 1;
      selN = firstFreeIn(cal.y, cal.m);
      renderGrid(false); renderPanel();
    }
    $('#cal-prev').addEventListener('click', function () { month(-1); });
    $('#cal-next').addEventListener('click', function () { month(1); });
    renderGrid(false); renderPanel();

    /* ---------- the form ---------- */
    var af = $('#askform'), done = $('#ask-done'), aDate = $('#a-date'), aName = $('#a-name'), aEm = $('#a-email');
    aDate.min = iso(t0);
    $$('input[name=part]').forEach(function (r) { r.addEventListener('change', function () { live.part = r.value; renderGrid(false); renderPanel(); $('#ask-sum').textContent = summary(); }); });
    aDate.addEventListener('change', function () {
      var c = fromIso(aDate.value); live.date = c ? aDate.value : null;
      if (c && c.n >= t0.n) { cal.y = c.y; cal.m = c.m; selN = c.n; renderGrid(false); renderPanel(); }
      $('#a-date-err').hidden = true; aDate.removeAttribute('aria-invalid'); $('#ask-sum').textContent = summary();
    });
    clearOnInput(aName, $('#a-name-err')); clearOnInput(aEm, $('#a-email-err'));
    af.addEventListener('submit', function (e) {
      e.preventDefault();
      var c = fromIso(aDate.value), noRoom = !calc().sel.length;
      var b1 = bad(aDate, $('#a-date-err'), !c || c.n < t0.n), b2 = bad(aName, $('#a-name-err'), !aName.value.trim()), b3 = bad(aEm, $('#a-email-err'), !EMAIL.test(aEm.value.trim()));
      $('#a-rooms-err').hidden = !noRoom;
      if (b1) { aDate.focus(); return; }
      if (b2) { aName.focus(); return; }
      if (b3) { aEm.focus(); return; }
      if (noRoom) { $('input[name=room]').focus(); return; }
      var k = calc(), msg = 'Thank you, ' + aName.value.trim() + '. Moana will write to ' + aEm.value.trim() + ' about the ' + names(k.sel) + ' for ' + live.hours + (live.hours === 1 ? ' hour' : ' hours') +
        ' on ' + dateText() + '. At ' + (live.community ? 'the community rate' : 'the standard rate') + ' that comes to ' + money(k.total) + '. This is a demo, so nothing was sent.';
      $('#ask-msg').textContent = msg; af.hidden = true; done.hidden = false; $('#ask-msg').focus();
    });
    $('#ask-again').addEventListener('click', function () { done.hidden = true; af.hidden = false; aName.focus(); });
    renderCalc();
  }

  initGive(); initHelp(); initHire();
})();
