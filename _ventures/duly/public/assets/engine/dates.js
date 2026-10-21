// Calendar-date arithmetic on ISO strings ("2026-10-21"). Everything is a plain
// calendar date: no times, no time zones, so a deadline never drifts by a day
// because of where the code happens to run.

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86400000;

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

export function isISODate(s) {
  if (typeof s !== 'string') return false;
  const m = ISO_RE.exec(s);
  if (!m) return false;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (mo < 1 || mo > 12 || d < 1) return false;
  return d <= daysInMonth(y, mo);
}

export function assertISODate(s, label = 'date') {
  if (!isISODate(s)) throw new RangeError(`${label} must be a real calendar date written YYYY-MM-DD (got ${JSON.stringify(s)})`);
  return s;
}

export function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

// Days since 1970-01-01. Lets dates be compared and stepped as integers.
export function toDayNumber(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function fromDayNumber(n) {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

export function ymd(y, m, d) {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function addDays(iso, n) {
  return fromDayNumber(toDayNumber(iso) + n);
}

export function diffDays(a, b) {
  return toDayNumber(b) - toDayNumber(a);
}

// 0 = Sunday … 6 = Saturday
export function weekday(iso) {
  return ((toDayNumber(iso) % 7) + 7 + 4) % 7; // 1970-01-01 was a Thursday
}

export function yearOf(iso) {
  return +iso.slice(0, 4);
}

export function isWeekend(iso) {
  const w = weekday(iso);
  return w === 0 || w === 6;
}

// The nth (1-based) given weekday of a month; n = -1 for the last.
export function nthWeekday(y, m, dow, n) {
  if (n > 0) {
    const first = ymd(y, m, 1);
    const offset = (dow - weekday(first) + 7) % 7;
    return addDays(first, offset + (n - 1) * 7);
  }
  const last = ymd(y, m, daysInMonth(y, m));
  return addDays(last, -((weekday(last) - dow + 7) % 7));
}

// Monday nearest a date: Tue–Thu go back, Fri–Sun go forward. This is the
// convention MBIE uses for provincial anniversary days.
export function nearestMonday(iso) {
  const w = weekday(iso);
  const back = (w + 6) % 7; // days since the previous (or same) Monday
  return back <= 3 ? addDays(iso, -back) : addDays(iso, 7 - back);
}

// "Wednesday 21 October 2026"
export function formatLong(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${WEEKDAYS[weekday(iso)]} ${d} ${MONTHS[m - 1]} ${y}`;
}

// "Wed 21 Oct 2026"
export function formatShort(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${WEEKDAYS[weekday(iso)].slice(0, 3)} ${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

// "21 October" (month-day keys like "12-25")
export function formatMonthDay(md) {
  const [m, d] = md.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}
