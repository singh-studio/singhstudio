import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  MATARIKI, PROVINCES, anniversaryDay, easterSunday, nationalHolidays,
} from '../src/engine/holidays.js';
import { isWeekend, nearestMonday, weekday } from '../src/engine/dates.js';

const mbie = JSON.parse(readFileSync(new URL('./fixtures/mbie-holidays.json', import.meta.url)));

const NATIONAL_NAMES = {
  "new year's day": 'new-year',
  "day after new year's day": 'day-after-new-year',
  'waitangi day': 'waitangi',
  'good friday': 'good-friday',
  'easter monday': 'easter-monday',
  'anzac day': 'anzac',
  "queen's birthday": 'sovereign',
  "king's birthday": 'sovereign',
  matariki: 'matariki',
  'labour day': 'labour',
  'christmas day': 'christmas',
  'boxing day': 'boxing',
  'queen elizabeth ii memorial day': 'qe2-memorial',
};
const PROVINCE_NAMES = {
  Auckland: 'auckland', Taranaki: 'taranaki', "Hawke's Bay": 'hawkes-bay', Wellington: 'wellington',
  Marlborough: 'marlborough', Nelson: 'nelson', Canterbury: 'canterbury', 'Canterbury (South)': 'south-canterbury',
  Westland: 'westland', Otago: 'otago', Southland: 'southland', 'Chatham Islands': 'chatham-islands',
};

// Places where MBIE's published table is wrong, with the evidence.
const MBIE_ERRATA = {
  // 26 Sep 2022 was Queen Elizabeth II Memorial Day; South Canterbury moved its anniversary to 11 Nov.
  '2022:south-canterbury': ['2022-11-11'],
};

test('national holidays match every MBIE table, 2010–2027', () => {
  let compared = 0;
  for (const [year, tables] of Object.entries(mbie.years)) {
    const ours = nationalHolidays(+year);
    for (const [name, dates] of Object.entries(tables.national)) {
      const key = NATIONAL_NAMES[name.toLowerCase()];
      assert.ok(key, `unmapped MBIE holiday name "${name}" (${year})`);
      // MBIE sometimes lists the weekend date, sometimes only the Monday; the
      // weekday a holiday is observed on is what counting depends on.
      const weekdays = (ds) => ds.filter((d) => !isWeekend(d)).sort();
      const got = ours.filter((h) => h.key === key).map((h) => h.date);
      assert.deepEqual(weekdays(got), weekdays(dates), `${year} ${name}`);
      compared++;
    }
  }
  assert.equal(compared, 187); // 12 years × 10, 2022 × 12 (Matariki, QEII day), 5 years × 11
});

test('provincial anniversary days match every MBIE table, 2010–2027', () => {
  let compared = 0;
  for (const [year, tables] of Object.entries(mbie.years)) {
    for (const [name, dates] of Object.entries(tables.provincial)) {
      const id = PROVINCE_NAMES[name.replace(/[^\w)' ]+$/, '')];
      assert.ok(id, `unmapped MBIE province "${name}"`);
      const expected = MBIE_ERRATA[`${year}:${id}`] || dates;
      assert.deepEqual([anniversaryDay(id, +year).date], expected, `${year} ${name}`);
      compared++;
    }
  }
  assert.equal(compared, 18 * 12);
});

test('Matariki is always a Friday in June or July', () => {
  for (const [y, md] of Object.entries(MATARIKI)) {
    assert.equal(weekday(`${y}-${md}`), 5, `Matariki ${y}`);
    assert.match(md, /^0[67]-/);
  }
  assert.equal(Object.keys(MATARIKI).length, 31);
});

test('Easter Sunday for known years', () => {
  const known = { 2024: '2024-03-31', 2025: '2025-04-20', 2026: '2026-04-05', 2027: '2027-03-28', 2035: '2035-03-25', 2038: '2038-04-25', 2049: '2049-04-18' };
  for (const [y, d] of Object.entries(known)) assert.equal(easterSunday(+y), d);
});

test('nearestMonday follows the Tue–Thu back, Fri–Sun forward convention', () => {
  assert.equal(nearestMonday('2026-01-19'), '2026-01-19'); // Mon stays
  assert.equal(nearestMonday('2026-01-22'), '2026-01-19'); // Thu goes back
  assert.equal(nearestMonday('2027-01-22'), '2027-01-25'); // Fri goes forward
  assert.equal(nearestMonday('2026-02-01'), '2026-02-02'); // Sun goes forward
});

test('Otago moves off Easter Monday when the two collide', () => {
  // 23 Mar 2035 is a Friday, so the nearest Monday is Easter Monday 26 Mar.
  assert.equal(anniversaryDay('otago', 2035).date, '2035-03-27');
});

test('every province resolves for every supported year, on a plausible weekday', () => {
  for (let y = 2023; y <= 2052; y++) {
    for (const p of PROVINCES) {
      const { date } = anniversaryDay(p.id, y);
      assert.ok(date.startsWith(`${y}-`), `${p.id} ${y}`);
      const dow = weekday(date);
      const ok = p.id === 'hawkes-bay' || p.id === 'canterbury' ? dow === 5 : p.id === 'southland' || p.id === 'otago' ? dow === 1 || dow === 2 : dow === 1;
      assert.ok(ok, `${p.id} ${y} lands on weekday ${dow}`);
    }
  }
});

test('years outside the covered range are refused, not guessed', () => {
  assert.throws(() => nationalHolidays(2053), RangeError);
  assert.throws(() => anniversaryDay('auckland', 2009), RangeError);
  assert.throws(() => anniversaryDay('atlantis', 2026), RangeError);
});
