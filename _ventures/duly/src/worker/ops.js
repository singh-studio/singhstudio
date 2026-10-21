// The operations the REST API and the MCP server both expose. Each takes loose
// input (query strings or JSON), validates it, and returns plain JSON.

import {
  PROVINCES, REGIMES, addCalendarDays, addWorkingDays, anniversaryDay, countWorkingDays, describeRules, getRegime,
  isWorkingDay, nationalHolidays, ENGINE_VERSION, RULES_VERIFIED,
} from '../engine/index.js';
import { HttpError } from './http.js';

function int(v, name) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  if (v === undefined || v === null || v === '' || !Number.isInteger(n)) throw new HttpError(400, `"${name}" must be a whole number`);
  return n;
}

function req(v, name) {
  if (v === undefined || v === null || v === '') throw new HttpError(400, `"${name}" is required`);
  return String(v);
}

function bool(v, dflt) {
  if (v === undefined || v === null || v === '') return dflt;
  return v === true || v === 'true' || v === '1' || v === 1;
}

function regimeInfo(r, full = false) {
  const base = {
    id: r.id, short: r.short, title: r.title, citation: r.citation, url: r.url, status: r.status,
    family: r.family, rules: describeRules(r), needsProvince: r.rules.anniversary === 'location',
  };
  if (!full) return base;
  return { ...base, definition: r.definition, presets: r.presets, notes: r.notes || [] };
}

export const OPS = {
  regimes: () => ({
    regimes: REGIMES.map((r) => regimeInfo(r)),
    provinces: PROVINCES.map(({ id, name, rule, areas }) => ({ id, name, rule, areas })),
    engine: { version: ENGINE_VERSION, rulesVerified: RULES_VERIFIED },
  }),

  regime: (p) => regimeInfo(getRegime(req(p.id ?? p.regime, 'regime')), true),

  deadline: (p) => addWorkingDays({
    regime: req(p.regime, 'regime'),
    from: req(p.from, 'from'),
    days: int(p.days, 'days'),
    direction: p.direction === 'before' ? 'before' : 'after',
    startRule: p.start_rule === 'on' || p.startRule === 'on' ? 'on' : 'after',
    province: p.province || undefined,
    trace: bool(p.trace, false),
  }),

  count: (p) => countWorkingDays({
    regime: req(p.regime, 'regime'),
    from: req(p.from, 'from'),
    to: req(p.to, 'to'),
    province: p.province || undefined,
    trace: bool(p.trace, false),
  }),

  'is-working-day': (p) => isWorkingDay({
    regime: req(p.regime, 'regime'),
    date: req(p.date, 'date'),
    province: p.province || undefined,
  }),

  'calendar-days': (p) => addCalendarDays({
    regime: p.regime || 'legislation-act',
    from: req(p.from, 'from'),
    days: int(p.days, 'days'),
    roll: p.roll === 'next-working-day' ? 'next-working-day' : 'none',
    province: p.province || undefined,
  }),

  holidays: (p) => {
    const year = int(p.year ?? new Date().getUTCFullYear(), 'year');
    const national = nationalHolidays(year).map(({ key, name, date, mondayised, actual }) => ({
      key, name, date, ...(mondayised ? { mondayised: true, actual } : {}),
    }));
    const provinces = (p.province ? [p.province] : PROVINCES.map((x) => x.id)).map((id) => {
      const a = anniversaryDay(id, year);
      return { province: id, name: a.name, date: a.date, rule: a.rule, ...(a.note ? { note: a.note } : {}), ...(a.exception ? { exception: a.exception } : {}) };
    });
    return { year, national, anniversary: provinces };
  },
};

export function runOp(name, params) {
  const op = OPS[name];
  if (!op) throw new HttpError(404, `Unknown operation "${name}"`);
  try {
    return op(params || {});
  } catch (e) {
    if (e instanceof HttpError) throw e;
    if (e instanceof RangeError || e instanceof TypeError) throw new HttpError(400, e.message);
    throw e;
  }
}
