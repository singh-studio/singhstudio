// Counting working days under a regime, with a full audit trail of every day
// that was skipped and why. Each public function returns a "receipt": the
// answer plus enough working that a person can check it by hand.

import {
  addDays, assertISODate, diffDays, formatLong, formatMonthDay, formatShort, isWeekend, weekday, WEEKDAYS, yearOf,
} from './dates.js';
import { anniversaryDay, easterSunday, getProvince, nationalHolidays } from './holidays.js';
import { getRegime } from './regimes.js';
import { ENGINE_VERSION, RULES_VERIFIED } from './version.js';

export const FIRST_DATE = '2023-01-01';
export const LAST_DATE = '2052-12-31';
const MAX_DAYS = 2000;
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// ---------------------------------------------------------------------------
// Which days a regime excludes
// ---------------------------------------------------------------------------

const yearCache = new Map();

// Map of date -> reasons for one regime/province/year (holidays + anniversary).
function excludedByHoliday(regime, province, year) {
  const key = `${regime.id}|${province || ''}|${year}`;
  if (yearCache.has(key)) return yearCache.get(key);
  const map = new Map();
  const push = (date, reason) => {
    if (!map.has(date)) map.set(date, []);
    map.get(date).push(reason);
  };
  const { holidays, mondayised } = regime.rules;
  for (const h of nationalHolidays(year)) {
    if (!h.mondayised && holidays.includes(h.key)) push(h.date, { code: 'holiday', label: h.name });
    if (h.mondayised && mondayised.includes(h.key)) {
      push(h.date, { code: 'mondayised', label: `${h.name} (observed; ${formatShort(h.actual)} falls on a weekend)` });
    }
  }
  if (holidays.includes('easter-tuesday')) push(addDays(easterSunday(year), 2), { code: 'holiday', label: 'Easter Tuesday' });
  for (const p of anniversaryProvinces(regime, province)) {
    const a = anniversaryDay(p, year);
    push(a.date, { code: 'anniversary', label: a.name });
  }
  yearCache.set(key, map);
  return map;
}

// Weekday public holidays (actual or Mondayised) in a year, by date. Used to
// point out when a definition counts a day most people have off.
const observedCache = new Map();
function observedHoliday(date) {
  const y = yearOf(date);
  if (!observedCache.has(y)) {
    observedCache.set(y, new Map(nationalHolidays(y).filter((h) => !isWeekend(h.date)).map((h) => [h.date, h])));
  }
  return observedCache.get(y).get(date);
}

function countedHolidayNotes(trace, regime) {
  const notes = [];
  for (const t of trace) {
    if (!t.working || !t.n) continue;
    const h = observedHoliday(t.date);
    if (h) {
      notes.push(`${formatLong(t.date)} is counted: it is ${h.mondayised ? `the observed ${h.name} public holiday` : `${h.name}`}, but the definition of working day in ${regime.citation} doesn’t exclude it.`);
    }
  }
  return notes;
}

function anniversaryProvinces(regime, province) {
  const rule = regime.rules.anniversary;
  if (!rule) return [];
  if (Array.isArray(rule)) return rule;
  return province ? [province] : [];
}

function inBlackout(date, blackout) {
  if (!blackout) return false;
  const md = date.slice(5);
  return blackout.from <= blackout.to
    ? md >= blackout.from && md <= blackout.to
    : md >= blackout.from || md <= blackout.to; // spans the new year
}

export function blackoutLabel(blackout) {
  return `${formatMonthDay(blackout.from)} – ${formatMonthDay(blackout.to)} period`;
}

// Why a date is not a working day under a regime ([] means it is one).
export function reasonsExcluded(date, regime, province) {
  const reasons = [];
  if (regime.rules.weekends && isWeekend(date)) reasons.push({ code: 'weekend', label: WEEKDAYS[weekday(date)] });
  const hol = excludedByHoliday(regime, province, yearOf(date)).get(date);
  if (hol) reasons.push(...hol);
  if (inBlackout(date, regime.rules.blackout)) reasons.push({ code: 'blackout', label: blackoutLabel(regime.rules.blackout) });
  return reasons;
}

// ---------------------------------------------------------------------------
// Input handling
// ---------------------------------------------------------------------------

function resolve(opts) {
  const regime = getRegime(opts.regime ?? 'legislation-act');
  let province = opts.province || null;
  const needsProvince = regime.rules.anniversary === 'location';
  if (province) getProvince(province);
  else if (needsProvince && opts.requireProvince !== false) {
    throw new RangeError(`${cap(regime.the)} excludes the anniversary day of the province where the ${regime.rules.locationNoun || 'place'} is. Pass a province (e.g. "auckland").`);
  }
  if (!needsProvince) province = null;
  return { regime, province };
}

function checkDate(date, label) {
  assertISODate(date, label);
  if (date < FIRST_DATE || date > LAST_DATE) {
    throw new RangeError(`${label} must be between ${FIRST_DATE} and ${LAST_DATE} (got ${date})`);
  }
}

function checkCount(n, label = 'days') {
  if (!Number.isInteger(n) || n < 0 || n > MAX_DAYS) throw new RangeError(`${label} must be a whole number from 0 to ${MAX_DAYS} (got ${JSON.stringify(n)})`);
}

function regimeSummary(regime) {
  return {
    id: regime.id, title: regime.title, short: regime.short, the: regime.the,
    citation: regime.citation, url: regime.url, status: regime.status,
  };
}

function regimeNotes(regime, province) {
  const notes = [...(regime.notes || [])];
  if (regime.status === 'partial') notes.push(`This definition was checked against official extracts of ${regime.citation}, not its full text.`);
  if (regime.status === 'convention') notes.push('This is a common convention rather than a statutory definition; check the wording that applies to you.');
  if (province) {
    const p = getProvince(province);
    if (p.note) notes.push(p.note);
  }
  return notes;
}

function step(date, regime, province) {
  const reasons = reasonsExcluded(date, regime, province);
  return { date, working: reasons.length === 0, reasons };
}

function envelope(kind, regime, province, input, body) {
  return {
    kind,
    regime: regimeSummary(regime),
    province: province ? { id: province, name: getProvince(province).name } : null,
    input,
    ...body,
    notes: regimeNotes(regime, province),
    engine: { version: ENGINE_VERSION, rulesVerified: RULES_VERIFIED },
  };
}

function excludedSummary(trace) {
  const skipped = trace.filter((t) => !t.working && t.role !== 'trigger');
  const byCode = {};
  for (const t of skipped) for (const r of t.reasons) byCode[r.code] = (byCode[r.code] || 0) + 1;
  return {
    days: skipped.length,
    byReason: byCode,
    list: skipped.filter((t) => t.reasons.some((r) => r.code !== 'weekend'))
      .map((t) => ({ date: t.date, reasons: t.reasons.map((r) => r.label) })),
  };
}

// "Fri 25 Dec 2026 – Fri 15 Jan 2027 (25 December – 15 January period)":
// consecutive skipped days with the same reason, as one range.
function compactSkips(list) {
  const runs = [];
  for (const e of list) {
    const key = e.reasons.filter((r) => !WEEKDAYS.includes(r)).join('; ');
    const last = runs[runs.length - 1];
    if (last && last.key === key && addDays(last.to, 1) === e.date) last.to = e.date;
    else runs.push({ from: e.date, to: e.date, key });
  }
  return runs.map((r) => `${formatShort(r.from)}${r.to !== r.from ? ` – ${formatShort(r.to)}` : ''} (${r.key})`).join(', ');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// Is this date a working day under the regime?
export function isWorkingDay(opts) {
  const { regime, province } = resolve(opts);
  checkDate(opts.date, 'date');
  const s = step(opts.date, regime, province);
  return envelope('is-working-day', regime, province, { date: opts.date }, {
    result: s.working,
    reasons: s.reasons.map((r) => r.label),
    summary: s.working
      ? `${formatLong(opts.date)} is a working day under ${regime.the}.`
      : `${formatLong(opts.date)} is not a working day under ${regime.the}: ${s.reasons.map((r) => r.label).join('; ')}.`,
  });
}

// The day that is `days` working days after (or before) `from`.
//   direction "after":  day 1 is the first working day after `from`
//                       ("within 20 working days after the day on which…").
//   startRule "on":     `from` itself counts as day 1 if it is a working day
//                       (for wording like "from and including").
//   direction "before": the `days`-th working day before `from`, not counting `from`.
export function addWorkingDays(opts) {
  const { regime, province } = resolve(opts);
  const from = opts.from;
  checkDate(from, 'from');
  checkCount(opts.days);
  const days = opts.days;
  const direction = opts.direction === 'before' ? 'before' : 'after';
  const startRule = opts.startRule === 'on' && direction === 'after' ? 'on' : 'after';
  const sign = direction === 'before' ? -1 : 1;

  const trigger = { ...step(from, regime, province), role: 'trigger' };
  const trace = [trigger];
  let count = 0;
  let current = from;
  if (startRule === 'on' && trigger.working && days > 0) {
    count = 1;
    trigger.n = 1;
  }
  while (count < days) {
    current = addDays(current, sign);
    if (current < FIRST_DATE || current > LAST_DATE) {
      throw new RangeError(`The count runs past the dates Duly covers (${FIRST_DATE} to ${LAST_DATE}).`);
    }
    const s = step(current, regime, province);
    if (s.working) s.n = ++count;
    trace.push(s);
  }
  const result = days === 0 ? from : current;
  const excluded = excludedSummary(trace);
  const counted = days === 0 ? 0 : days;
  const phrase = direction === 'before'
    ? `${counted} working day${counted === 1 ? '' : 's'} before ${formatLong(from)}`
    : startRule === 'on'
      ? `${counted} working day${counted === 1 ? '' : 's'} counting ${formatLong(from)} as day 1`
      : `${counted} working day${counted === 1 ? '' : 's'} after ${formatLong(from)}`;
  const resultIsWorking = step(result, regime, province).working;
  const notes = countedHolidayNotes(trace, regime);
  if (days === 0) notes.push('Zero working days: the answer is the start date itself.');
  else if (direction === 'after' && !trigger.working) {
    notes.push(`${formatLong(from)} is not itself a working day (${trigger.reasons.map((r) => r.label).join('; ')}); counting starts from the next working day either way.`);
  }
  return envelope('deadline', regime, province, { from, days, direction, startRule }, {
    result,
    resultLong: formatLong(result),
    resultIsWorkingDay: resultIsWorking,
    calendarDays: Math.abs(diffDays(from, result)),
    excluded,
    summary: `Under ${regime.the} (${regime.citation}), ${phrase} is ${formatLong(result)}.`
      + (excluded.list.length ? ` Skipped besides weekends: ${compactSkips(excluded.list)}.` : ''),
    countingNotes: notes,
    trace: opts.trace === false ? undefined : trace,
  });
}

// Working days after `from` up to and including `to`.
// countWorkingDays(from, addWorkingDays(from, n).result) === n.
export function countWorkingDays(opts) {
  const { regime, province } = resolve(opts);
  checkDate(opts.from, 'from');
  checkDate(opts.to, 'to');
  const { from, to } = opts;
  if (to < from) throw new RangeError('"to" must be on or after "from"');
  if (diffDays(from, to) > MAX_DAYS * 2) throw new RangeError('Date range too long');
  const trace = [{ ...step(from, regime, province), role: 'trigger' }];
  let n = 0;
  for (let d = addDays(from, 1); d <= to; d = addDays(d, 1)) {
    const s = step(d, regime, province);
    if (s.working) s.n = ++n;
    trace.push(s);
  }
  const excluded = excludedSummary(trace);
  return envelope('count', regime, province, { from, to }, {
    result: n,
    calendarDays: diffDays(from, to),
    excluded,
    summary: `Under ${regime.the} (${regime.citation}), there ${n === 1 ? 'is' : 'are'} ${n} working day${n === 1 ? '' : 's'} after ${formatLong(from)} up to and including ${formatLong(to)}.`,
    countingNotes: countedHolidayNotes(trace, regime),
    trace: opts.trace === false ? undefined : trace,
  });
}

// Calendar days, optionally moved to the next working day (Legislation Act
// s 55, IRD due dates) or the previous one (the sale and purchase agreement,
// cl 1.3(1)) when the answer isn't a working day. startRule "on" counts the
// start date as day 1, for periods "beginning with" a day.
export function addCalendarDays(opts) {
  const roll = normaliseRoll(opts.roll);
  const { regime, province } = resolve({ ...opts, requireProvince: roll !== 'none' });
  checkDate(opts.from, 'from');
  checkCount(opts.days);
  const inclusive = opts.startRule === 'on' && opts.days > 0;
  const raw = addDays(opts.from, inclusive ? opts.days - 1 : opts.days);
  checkDate(raw, 'result');
  let result = raw;
  const rolledOver = [];
  if (roll !== 'none') {
    const stepBy = roll === 'previous' ? -1 : 1;
    let s = step(result, regime, province);
    while (!s.working) {
      rolledOver.push({ date: result, reasons: s.reasons.map((r) => r.label) });
      result = addDays(result, stepBy);
      checkDate(result, 'result');
      s = step(result, regime, province);
    }
  }
  const period = `${opts.days} calendar day${opts.days === 1 ? '' : 's'} ${inclusive ? `beginning with ${formatLong(opts.from)} end on` : `after ${formatLong(opts.from)} is`} ${formatLong(raw)}`;
  return envelope('calendar', regime, province, { from: opts.from, days: opts.days, roll, startRule: inclusive ? 'on' : 'after' }, {
    result,
    resultLong: formatLong(result),
    unrolled: raw,
    rolledOver,
    summary: period + (rolledOver.length
      ? `, which is not a working day under ${regime.the}, so it moves ${roll === 'previous' ? 'back' : 'forward'} to ${formatLong(result)}.`
      : '.'),
  });
}

export function normaliseRoll(roll) {
  if (roll === 'next' || roll === 'next-working-day' || roll === true) return 'next';
  if (roll === 'previous' || roll === 'previous-working-day') return 'previous';
  return 'none';
}

// Every excluded (non-weekend) day in a date range, e.g. to show a regime's
// year at a glance.
export function excludedDays(opts) {
  const { regime, province } = resolve(opts);
  checkDate(opts.from, 'from');
  checkDate(opts.to, 'to');
  if (diffDays(opts.from, opts.to) > 800) throw new RangeError('Range too long (max ~2 years)');
  const out = [];
  for (let d = opts.from; d <= opts.to; d = addDays(d, 1)) {
    const reasons = reasonsExcluded(d, regime, province).filter((r) => r.code !== 'weekend');
    if (reasons.length) out.push({ date: d, weekend: isWeekend(d), reasons: reasons.map((r) => r.label) });
  }
  return out;
}
