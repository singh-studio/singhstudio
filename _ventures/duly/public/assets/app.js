// Duly calculator: every [data-calc] form on a page. Runs entirely in the
// browser on the same engine the API uses, so the free tool costs nothing to host.

import {
  REGIMES, PROVINCES, addCalendarDays, addWorkingDays, formatLong, formatShort, getRegime, MONTHS, weekday,
  addDays, FIRST_DATE, LAST_DATE,
} from './engine/index.js';
import { toICS } from './engine/ics.js';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function todayNZ() {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function readURL() {
  const q = new URLSearchParams(location.search);
  return {
    regime: q.get('r'), from: q.get('from'), days: q.get('n'), province: q.get('p'),
    direction: q.get('d') === 'before' ? 'before' : null, on: q.get('s') === 'on',
    unit: q.get('u') === 'cal' ? 'calendar' : null, roll: ['next', 'previous'].includes(q.get('roll')) ? q.get('roll') : null, service: q.get('sv'),
    preset: q.get('k'),
  };
}

function writeURL(state) {
  const q = new URLSearchParams();
  q.set('r', state.regime);
  q.set('from', state.from);
  q.set('n', String(state.days));
  if (state.province) q.set('p', state.province);
  if (state.direction === 'before') q.set('d', 'before');
  if (state.on) q.set('s', 'on');
  if (state.unit === 'calendar') q.set('u', 'cal');
  if (state.unit === 'calendar' && state.roll && state.roll !== 'none') q.set('roll', state.roll);
  if (state.service && state.service !== 'none') q.set('sv', state.service);
  if (state.preset) q.set('k', state.preset);
  return `${location.pathname}?${q}`;
}

function setup(form) {
  const els = {
    regime: form.elements.regime, from: form.elements.from, days: form.elements.days, province: form.elements.province,
    on: form.elements.on, unit: form.elements.unit, roll: form.elements.roll, service: form.elements.service,
    ruleLine: $('[data-rule-line]', form), presets: $('[data-presets]', form), provinceWrap: $('[data-province-wrap]', form),
    serviceWrap: $('[data-service-wrap]', form), rollWrap: $('[data-roll-wrap]', form), result: $('[data-result]', form),
    dir: form.querySelectorAll('[data-dir]'), dirWrap: $('[data-dir-wrap]', form), daysLabel: $('[data-days-label]', form), fromLabel: $('[data-from-label]', form),
  };
  const pinned = form.dataset.pinned === 'true';
  const url = pinned ? {} : readURL();
  const state = {
    regime: url.regime && REGIMES.some((r) => r.id === url.regime) ? url.regime : form.dataset.regime || 'oia',
    direction: url.direction || 'after',
    preset: url.preset || null,
  };
  els.regime.value = state.regime;
  els.from.min = FIRST_DATE;
  els.from.max = LAST_DATE;
  els.from.value = url.from || todayNZ();
  if (url.province) els.province.value = url.province;
  if (url.on) els.on.checked = true;
  if (url.unit && els.unit) els.unit.value = url.unit;
  if (url.roll && els.roll) els.roll.value = url.roll;

  function regime() { return getRegime(els.regime.value); }

  function renderRegime(keepDays) {
    const r = regime();
    els.ruleLine.textContent = r.summaryLine;
    const needs = r.rules.anniversary === 'location';
    els.provinceWrap.hidden = !needs;
    els.province.required = needs;
    if (els.serviceWrap) {
      const options = r.service || [];
      els.serviceWrap.hidden = !options.length;
      els.service.innerHTML = '<option value="none">Not applicable / already served</option>'
        + options.map((s) => `<option value="${esc(s.id)}">${esc(s.label)}</option>`).join('');
      if (url.service && options.some((s) => s.id === url.service)) els.service.value = url.service;
    }
    els.presets.innerHTML = (r.presets || []).map((p) => `<button type="button" class="chip" data-preset="${esc(p.id)}" aria-pressed="false" title="${esc(p.cite || '')}">${esc(p.label)} <b>${p.days}${p.unit === 'calendar' ? ' days' : ' wd'}</b></button>`).join('');
    const chosen = (r.presets || []).find((p) => p.id === state.preset) || (keepDays ? null : (r.presets || [])[0]);
    if (chosen) applyPreset(chosen, !keepDays);
    else markPreset(null);
  }

  function markPreset(id) {
    els.presets.querySelectorAll('[data-preset]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.preset === id)));
  }

  function applyPreset(p, setDays = true) {
    if (p.regime && p.regime !== els.regime.value) {
      // Some timeframes (the LIM date) use a variant definition: switch to it.
      els.regime.value = p.regime;
      state.preset = (getRegime(p.regime).presets || [])[0]?.id || null;
      renderRegime(!setDays);
      if (setDays) els.days.value = p.days;
      return;
    }
    state.preset = p.id;
    if (setDays) els.days.value = p.days;
    if (els.unit) els.unit.value = p.unit === 'calendar' ? 'calendar' : 'working';
    if (els.roll) els.roll.value = p.roll || 'none';
    if (setDays) els.on.checked = p.startRule === 'on';
    setDirection(p.direction || 'after');
    if (els.fromLabel) els.fromLabel.textContent = p.trigger || 'Start date';
    markPreset(p.id);
    syncUnit();
  }

  function setDirection(d) {
    state.direction = d;
    els.dir.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dir === d)));
  }

  function syncUnit() {
    const cal = els.unit && els.unit.value === 'calendar';
    if (els.rollWrap) els.rollWrap.hidden = !cal;
    if (els.dirWrap) els.dirWrap.hidden = cal;
    if (els.daysLabel) els.daysLabel.textContent = cal ? 'Calendar days' : 'Working days';
    els.dir.forEach((b) => { b.disabled = cal && b.dataset.dir === 'before'; });
    if (cal && state.direction === 'before') setDirection('after');
  }

  function compute() {
    const r = regime();
    const days = Number(els.days.value);
    const from = els.from.value;
    const province = els.provinceWrap.hidden ? undefined : els.province.value || undefined;
    const unit = els.unit ? els.unit.value : 'working';
    const svc = els.serviceWrap && !els.serviceWrap.hidden ? (r.service || []).find((s) => s.id === els.service.value) : null;
    if (!from) return showError('Pick a start date.');
    if (!Number.isInteger(days) || days < 0) return showError('Enter a whole number of days.');
    if (r.rules.anniversary === 'location' && !province) return showError(`Choose where the ${r.rules.locationNoun || 'place'} is: ${r.the} skips that province’s anniversary day.`);
    try {
      let served = null;
      let start = from;
      if (svc && svc.addWorkingDays) {
        served = addWorkingDays({ regime: r.id, from, days: svc.addWorkingDays, province, requireProvince: false, trace: true });
        start = served.result;
      } else if (svc && svc.addCalendarDays) {
        served = addCalendarDays({ regime: r.id, from, days: svc.addCalendarDays, province, requireProvince: false });
        start = served.result;
      }
      const out = unit === 'calendar'
        ? addCalendarDays({ regime: r.id, from: start, days, roll: els.roll ? els.roll.value : 'none', startRule: els.on.checked ? 'on' : 'after', province })
        : addWorkingDays({ regime: r.id, from: start, days, direction: state.direction, startRule: els.on.checked ? 'on' : 'after', province, requireProvince: false, trace: true });
      const st = { regime: r.id, from, days, province, direction: state.direction, on: els.on.checked, unit, roll: els.roll ? els.roll.value : 'none', service: svc ? svc.id : null, preset: state.preset };
      const link = writeURL(st);
      if (!form.dataset.embed) history.replaceState(null, '', link);
      render(out, r, { served, svc, unit, link: new URL(link, location.href).href });
    } catch (e) {
      showError(e.message);
    }
  }

  function showError(msg) {
    els.result.innerHTML = `<p class="error">${esc(msg)}</p>`;
  }

  function render(out, r, ctx) {
    const preset = (r.presets || []).find((p) => p.id === state.preset);
    const label = preset ? preset.label : `${out.input.days} ${ctx.unit === 'calendar' ? 'calendar' : 'working'} days`;
    const [dow, ...rest] = formatLong(out.result).split(' ');
    const servedLine = ctx.served ? `${esc(ctx.svc.label)}: treated as served on <span class="mono">${esc(formatShort(ctx.served.result))}</span>. ` : '';
    const sub = ctx.unit === 'calendar'
      ? `${servedLine}${esc(out.summary)}`
      : `${servedLine}${out.input.days} working day${out.input.days === 1 ? '' : 's'} ${out.input.direction === 'before' ? 'before' : 'after'} <span class="mono">${esc(formatShort(out.input.from))}</span> · ${out.calendarDays} calendar days · ${out.excluded.days} skipped`;
    const notes = [...(out.countingNotes || []), ...(preset && preset.note ? [preset.note] : []), ...(out.notes || [])];
    const skippedList = ctx.unit === 'calendar' ? out.rolledOver : out.excluded.list;
    const summaryText = (ctx.served ? `${ctx.svc.label}: treated as served on ${formatLong(ctx.served.result)}. ` : '') + out.summary;
    els.result.innerHTML = `
      <p class="result-label">${esc(label)} · ${esc(r.short)}</p>
      <p class="result-date"><span class="dow">${esc(dow)}</span> ${esc(rest.join(' '))}</p>
      <p class="result-sub">${sub}</p>
      ${notes.map((n) => `<p class="note">${esc(n)}</p>`).join('')}
      <div class="actions no-print">
        <button type="button" class="btn sm" data-act="copy">Copy wording</button>
        <button type="button" class="btn sm ghost" data-act="link">Copy link</button>
        <button type="button" class="btn sm ghost" data-act="ics">Add to calendar</button>
        <button type="button" class="btn sm ghost" data-act="print">Print</button>
      </div>
      ${ctx.unit === 'calendar' ? '' : calendar(out)}
      ${skippedList && skippedList.length ? `<div><p class="result-label">Skipped${ctx.unit === 'calendar' ? ' (rolled forward)' : ' (besides weekends)'}</p><ul class="skipped">${skippedList.map((e) => `<li><span class="mono">${esc(formatShort(e.date))}</span><span>${esc(e.reasons.join('; '))}</span></li>`).join('')}</ul></div>` : ''}
      <p class="source">${esc(r.citation)}${r.definition && (r.definition.quote || r.definition.paraphrase) ? `: <span class="quote">${esc(r.definition.quote || r.definition.paraphrase)}</span>` : ''} <a href="${esc(r.url)}" rel="noopener" target="_blank">Read the Act</a>. Duly ${esc(out.engine.version)}, rules checked ${esc(out.engine.rulesVerified)}. Not legal advice.</p>`;
    els.result.querySelector('[data-act="copy"]').onclick = (e) => copy(e.currentTarget, `${summaryText}\n${ctx.link}`);
    els.result.querySelector('[data-act="link"]').onclick = (e) => copy(e.currentTarget, ctx.link);
    els.result.querySelector('[data-act="print"]').onclick = () => window.print();
    els.result.querySelector('[data-act="ics"]').onclick = () => downloadICS(out, r, label, summaryText, ctx.link);
  }

  els.regime.addEventListener('change', () => { state.preset = null; renderRegime(false); compute(); });
  els.presets.addEventListener('click', (e) => {
    const b = e.target.closest('[data-preset]');
    if (!b) return;
    const p = (regime().presets || []).find((x) => x.id === b.dataset.preset);
    if (p) { applyPreset(p); compute(); }
  });
  els.dir.forEach((b) => b.addEventListener('click', () => { setDirection(b.dataset.dir); compute(); }));
  ['from', 'days', 'province', 'on', 'unit', 'roll', 'service'].forEach((k) => els[k] && els[k].addEventListener('change', () => {
    if (k === 'days') { state.preset = null; markPreset(null); }
    if (k === 'unit') syncUnit();
    compute();
  }));
  els.days.addEventListener('input', () => { state.preset = null; markPreset(null); });
  form.addEventListener('submit', (e) => { e.preventDefault(); compute(); });

  renderRegime(!!url.days);
  if (url.days) els.days.value = url.days;
  if (url.direction) setDirection(url.direction);
  syncUnit();
  compute();
}

function copy(btn, text) {
  const done = () => { const t = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = t; }, 1400); };
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => prompt('Copy this:', text));
  else prompt('Copy this:', text);
}

function downloadICS(out, r, label, summary, link) {
  const ics = toICS({
    name: 'Duly deadline', stamp: out.engine.rulesVerified, domain: location.hostname || 'duly.nz',
    events: [{ uid: `deadline-${r.id}-${out.input.from}-${out.input.days}-${Date.now()}`, date: out.result, summary: `Due: ${label} (${r.short})`, description: `${summary}\n${link}`, url: link }],
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = `deadline-${out.result}.ics`;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
}

// Month grids from the trigger to the answer, Monday first.
function calendar(out) {
  const trace = out.trace || [];
  const byDate = new Map(trace.map((t) => [t.date, t]));
  const first = trace.reduce((a, t) => (t.date < a ? t.date : a), out.input.from);
  const last = trace.reduce((a, t) => (t.date > a ? t.date : a), out.result);
  let months = [];
  for (let y = +first.slice(0, 4), m = +first.slice(5, 7); `${y}-${String(m).padStart(2, '0')}` <= last.slice(0, 7); m === 12 ? (y++, m = 1) : m++) {
    months.push([y, m]);
  }
  let gap = false;
  if (months.length > 4) { months = [months[0], months[1], months[months.length - 2], months[months.length - 1]]; gap = true; }
  const cell = (iso) => {
    const t = byDate.get(iso);
    const d = +iso.slice(8);
    if (!t) return `<span class="day" aria-hidden="true">${d}</span>`;
    const cls = ['day'];
    let title = formatLong(iso);
    if (t.role === 'trigger') { cls.push('start'); title += ' · start'; }
    if (iso === out.result && out.input.days > 0) cls.push('due');
    else if (t.working && t.n) cls.push('in');
    if (!t.working) {
      const kinds = t.reasons.map((x) => x.code);
      cls.push(kinds.some((k) => k === 'holiday' || k === 'mondayised' || k === 'anniversary') ? 'hol' : 'skip');
      title += ` · ${t.reasons.map((x) => x.label).join('; ')}`;
    } else if (t.n) title += ` · working day ${t.n}`;
    return `<span class="${cls.join(' ')}" title="${esc(title)}">${d}${t.working && t.n ? `<i>${t.n}</i>` : ''}</span>`;
  };
  const grids = months.map(([y, m], i) => {
    const firstDay = `${y}-${String(m).padStart(2, '0')}-01`;
    const lead = (weekday(firstDay) + 6) % 7;
    const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
    let cells = '';
    for (let k = 0; k < lead; k++) cells += '<span class="day out"></span>';
    for (let d = 1; d <= daysIn; d++) cells += cell(addDays(firstDay, d - 1));
    const sep = gap && i === 2 ? '<p class="muted small" style="grid-column:1/-1;margin:0">… months in between not shown</p>' : '';
    return `${sep}<div class="month"><h4>${MONTHS[m - 1]} ${y}</h4><div class="grid7">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((h) => `<span class="dh">${h}</span>`).join('')}${cells}</div></div>`;
  }).join('');
  return `<div class="months">${grids}</div>
    <ul class="legend"><li><span class="sw" style="outline:1.5px solid var(--ink);outline-offset:-1.5px"></span>Start</li><li><span class="sw" style="background:color-mix(in srgb,var(--ok) 14%,transparent)"></span>Counted</li><li><span class="sw" style="background:var(--hol-soft)"></span>Holiday</li><li><span class="sw" style="background:repeating-linear-gradient(135deg,var(--skip),var(--skip) 3px,transparent 3px,transparent 6px)"></span>Weekend or closed period</li><li><span class="sw" style="background:var(--accent)"></span>Due</li></ul>`;
}

document.querySelectorAll('form[data-calc]').forEach(setup);

// Embedded widget: tell the parent page how tall we are.
if (document.body.classList.contains('embed') && window.parent !== window) {
  const post = () => window.parent.postMessage({ duly: 'height', h: document.documentElement.scrollHeight }, '*');
  new ResizeObserver(post).observe(document.body);
  post();
}

export { PROVINCES };
