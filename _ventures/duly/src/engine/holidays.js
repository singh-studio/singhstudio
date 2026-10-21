// New Zealand public holidays: the national days in s 44 of the Holidays Act
// 2003, their "Mondayised" observances (ss 45 and 45A), Matariki (Te Kāhui o
// Matariki Public Holiday Act 2022, Schedule 1) and the provincial anniversary
// days, which are set by custom and local councils rather than by statute.
//
// Checked against every table MBIE has published for 2010–2027
// (test/holidays.test.js) and Te Papa's Matariki schedule to 2052.

import { addDays, nearestMonday, nthWeekday, weekday, ymd } from './dates.js';

export const FIRST_YEAR = 2010;
export const LAST_YEAR = 2052; // Matariki is fixed in law only this far ahead

// Schedule 1, Te Kāhui o Matariki Public Holiday Act 2022. Always a Friday.
export const MATARIKI = {
  2022: '06-24', 2023: '07-14', 2024: '06-28', 2025: '06-20', 2026: '07-10',
  2027: '06-25', 2028: '07-14', 2029: '07-06', 2030: '06-21', 2031: '07-11',
  2032: '07-02', 2033: '06-24', 2034: '07-07', 2035: '06-29', 2036: '07-18',
  2037: '07-10', 2038: '06-25', 2039: '07-15', 2040: '07-06', 2041: '07-19',
  2042: '07-11', 2043: '07-03', 2044: '06-24', 2045: '07-07', 2046: '06-29',
  2047: '07-19', 2048: '07-03', 2049: '06-25', 2050: '07-15', 2051: '06-30',
  2052: '06-21',
};

// Waitangi Day and Anzac Day moved to Monday when on a weekend from 1 January
// 2014 (Holidays (Full Recognition of Waitangi Day and ANZAC Day) Amendment Act 2013).
const WAITANGI_ANZAC_MONDAYISED_FROM = 2014;

export const NATIONAL_KEYS = [
  'new-year', 'day-after-new-year', 'waitangi', 'good-friday', 'easter-monday',
  'anzac', 'sovereign', 'matariki', 'labour', 'christmas', 'boxing',
];

export function checkYear(year) {
  if (!Number.isInteger(year) || year < FIRST_YEAR || year > LAST_YEAR) {
    throw new RangeError(`Duly covers ${FIRST_YEAR}–${LAST_YEAR}; Matariki dates after ${LAST_YEAR} are not yet set in law (got ${year})`);
  }
}

// Gregorian Easter Sunday (Meeus/Jones/Butcher).
export function easterSunday(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return ymd(year, month, day);
}

function sovereignName(year) {
  return year >= 2023 ? "King's Birthday" : "Queen's Birthday";
}

// Every national public holiday in a year. A holiday that falls on a weekend
// appears twice: once on its actual date and once on the weekday it is
// observed ("mondayised": true), the way MBIE lists it.
export function nationalHolidays(year) {
  checkYear(year);
  const out = [];
  const add = (key, name, date, mondayised = false, actual = date) =>
    out.push({ key, name, date, mondayised, actual });

  // New Year's Day and 2 January (s 45(2)–(3)).
  const ny = ymd(year, 1, 1), ny2 = ymd(year, 1, 2);
  add('new-year', "New Year's Day", ny);
  add('day-after-new-year', "Day after New Year's Day", ny2);
  const nyDow = weekday(ny);
  if (nyDow === 5) add('day-after-new-year', "Day after New Year's Day", ymd(year, 1, 4), true, ny2); // Fri: 2 Jan is Sat
  if (nyDow === 6) { // Sat: both move
    add('new-year', "New Year's Day", ymd(year, 1, 3), true, ny);
    add('day-after-new-year', "Day after New Year's Day", ymd(year, 1, 4), true, ny2);
  }
  if (nyDow === 0) add('new-year', "New Year's Day", ymd(year, 1, 3), true, ny); // Sun: 2 Jan is Mon

  const waitangi = ymd(year, 2, 6);
  add('waitangi', 'Waitangi Day', waitangi);
  if (year >= WAITANGI_ANZAC_MONDAYISED_FROM && [0, 6].includes(weekday(waitangi))) {
    add('waitangi', 'Waitangi Day', addDays(waitangi, weekday(waitangi) === 6 ? 2 : 1), true, waitangi);
  }

  const easter = easterSunday(year);
  add('good-friday', 'Good Friday', addDays(easter, -2));
  add('easter-monday', 'Easter Monday', addDays(easter, 1));

  const anzac = ymd(year, 4, 25);
  add('anzac', 'Anzac Day', anzac);
  if (year >= WAITANGI_ANZAC_MONDAYISED_FROM && [0, 6].includes(weekday(anzac))) {
    add('anzac', 'Anzac Day', addDays(anzac, weekday(anzac) === 6 ? 2 : 1), true, anzac);
  }

  add('sovereign', sovereignName(year), nthWeekday(year, 6, 1, 1));
  if (MATARIKI[year]) add('matariki', 'Matariki', `${year}-${MATARIKI[year]}`);
  add('labour', 'Labour Day', nthWeekday(year, 10, 1, 4));
  if (year === 2022) add('qe2-memorial', 'Queen Elizabeth II Memorial Day', '2022-09-26');

  // Christmas Day and Boxing Day (s 45(1)).
  const xmas = ymd(year, 12, 25), boxing = ymd(year, 12, 26);
  add('christmas', 'Christmas Day', xmas);
  add('boxing', 'Boxing Day', boxing);
  const xDow = weekday(xmas);
  if (xDow === 5) add('boxing', 'Boxing Day', ymd(year, 12, 28), true, boxing); // Fri: Boxing Day is Sat
  if (xDow === 6) { // Sat: both move
    add('christmas', 'Christmas Day', ymd(year, 12, 27), true, xmas);
    add('boxing', 'Boxing Day', ymd(year, 12, 28), true, boxing);
  }
  if (xDow === 0) add('christmas', 'Christmas Day', ymd(year, 12, 27), true, xmas); // Sun: Boxing Day is Mon

  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

// Provincial anniversary days. Observance is custom, not statute, so each
// carries the rule MBIE describes and any caveat a careful user should see.
export const PROVINCES = [
  { id: 'wellington', name: 'Wellington', actual: '22 January', rule: 'Monday nearest 22 January',
    areas: 'Wellington, Wairarapa, Manawatū, Whanganui' },
  { id: 'auckland', name: 'Auckland', actual: '29 January', rule: 'Monday nearest 29 January',
    areas: 'Auckland, Northland, Waikato, Coromandel, Bay of Plenty, Gisborne' },
  { id: 'nelson', name: 'Nelson', actual: '1 February', rule: 'Monday nearest 1 February',
    areas: 'Nelson, Tasman, Buller' },
  { id: 'taranaki', name: 'Taranaki', actual: '31 March', rule: 'Second Monday in March (moved to avoid Easter)',
    areas: 'Taranaki' },
  { id: 'otago', name: 'Otago', actual: '23 March', rule: 'Monday nearest 23 March (Tuesday if that is Easter Monday)',
    areas: 'Otago, Dunedin, Queenstown, Central Otago',
    note: 'MBIE notes there is no single agreed day of observance across Otago; employment agreements and local custom can differ.' },
  { id: 'southland', name: 'Southland', actual: '17 January', rule: 'Easter Tuesday',
    areas: 'Southland, Invercargill, Gore, Fiordland' },
  { id: 'south-canterbury', name: 'South Canterbury', actual: '16 December', rule: 'Fourth Monday in September (Dominion Day)',
    areas: 'Timaru, Mackenzie, Waimate' },
  { id: 'hawkes-bay', name: "Hawke's Bay", actual: '1 November', rule: 'Friday before Labour Day',
    areas: "Napier, Hastings, Central Hawke's Bay" },
  { id: 'marlborough', name: 'Marlborough', actual: '1 November', rule: 'First Monday after Labour Day',
    areas: 'Marlborough, Blenheim, Picton' },
  { id: 'canterbury', name: 'Canterbury', actual: '16 December', rule: 'Christchurch Show Day: second Friday after the first Tuesday in November',
    areas: 'Christchurch, North and Central Canterbury, Ashburton' },
  { id: 'chatham-islands', name: 'Chatham Islands', actual: '30 November', rule: 'Monday nearest 30 November',
    areas: 'Chatham Islands' },
  { id: 'westland', name: 'Westland', actual: '1 December', rule: 'Monday nearest 1 December (as observed in Greymouth)',
    areas: 'Westland, Greymouth, Hokitika',
    note: 'Observance varies across Westland; Greymouth keeps the official day.' },
];

export const PROVINCE_IDS = PROVINCES.map((p) => p.id);
const BY_ID = Object.fromEntries(PROVINCES.map((p) => [p.id, p]));

export function getProvince(id) {
  const p = BY_ID[id];
  if (!p) throw new RangeError(`Unknown province ${JSON.stringify(id)}. Use one of: ${PROVINCE_IDS.join(', ')}`);
  return p;
}

// Years where the observed day departed from the usual rule, with the source.
const EXCEPTIONS = {
  'south-canterbury': {
    // 26 Sep 2022 became Queen Elizabeth II Memorial Day, so the three South
    // Canterbury councils moved the anniversary. (MBIE's table still shows 26 Sep.)
    2022: { date: '2022-11-11', source: 'Timaru, Mackenzie and Waimate district councils (Stuff, 20 Sep 2022)' },
  },
};

export function anniversaryDay(provinceId, year) {
  checkYear(year);
  const p = getProvince(provinceId);
  const exception = EXCEPTIONS[provinceId]?.[year];
  if (exception) return { ...base(p), date: exception.date, exception: exception.source };

  let date;
  switch (provinceId) {
    case 'wellington': date = nearestMonday(ymd(year, 1, 22)); break;
    case 'auckland': date = nearestMonday(ymd(year, 1, 29)); break;
    case 'nelson': date = nearestMonday(ymd(year, 2, 1)); break;
    case 'taranaki': date = nthWeekday(year, 3, 1, 2); break;
    case 'otago': {
      date = nearestMonday(ymd(year, 3, 23));
      const easterMonday = addDays(easterSunday(year), 1);
      if (date === easterMonday) date = addDays(easterMonday, 1);
      break;
    }
    case 'southland':
      // Southland moved from the Monday nearest 17 January to Easter Tuesday in 2012.
      date = year >= 2012 ? addDays(easterSunday(year), 2) : nearestMonday(ymd(year, 1, 17));
      break;
    case 'south-canterbury': date = nthWeekday(year, 9, 1, 4); break;
    case 'hawkes-bay': date = addDays(nthWeekday(year, 10, 1, 4), -3); break;
    case 'marlborough': date = addDays(nthWeekday(year, 10, 1, 4), 7); break;
    case 'canterbury': {
      const firstTuesday = nthWeekday(year, 11, 2, 1);
      date = addDays(firstTuesday, 3 + 7); // first Friday after it is +3; the second is +10
      break;
    }
    case 'chatham-islands': date = nearestMonday(ymd(year, 11, 30)); break;
    case 'westland': date = nearestMonday(ymd(year, 12, 1)); break;
  }
  return { ...base(p), date };
}

function base(p) {
  return { key: `anniversary:${p.id}`, province: p.id, name: `${p.name} Anniversary Day`, rule: p.rule, ...(p.note ? { note: p.note } : {}) };
}

// National holidays plus, optionally, one province's anniversary day.
export function holidaysFor(year, province) {
  const list = nationalHolidays(year);
  if (province) {
    const a = anniversaryDay(province, year);
    list.push({ key: a.key, name: a.name, date: a.date, mondayised: false, actual: a.date, provincial: true });
    list.sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
  }
  return list;
}
