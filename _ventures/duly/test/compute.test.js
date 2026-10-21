import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  REGIMES, PROVINCE_IDS, addCalendarDays, addDays, addWorkingDays, countWorkingDays, isWorkingDay, reasonsExcluded, getRegime,
} from '../src/engine/index.js';

const provinceFor = (r) => (r.rules.anniversary === 'location' ? 'auckland' : undefined);

// A small deterministic PRNG so the property tests are repeatable.
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

test('counting forward then counting back agree, for every regime', () => {
  const rand = rng(42);
  for (const r of REGIMES) {
    for (let i = 0; i < 60; i++) {
      const from = addDays('2023-01-01', Math.floor(rand() * 365 * 25));
      const days = Math.floor(rand() * 60);
      const province = provinceFor(r) && PROVINCE_IDS[Math.floor(rand() * PROVINCE_IDS.length)];
      const fwd = addWorkingDays({ regime: r.id, from, days, province, trace: false });
      assert.equal(countWorkingDays({ regime: r.id, from, to: fwd.result, province, trace: false }).result, days, `${r.id} ${from} +${days}`);
      if (days > 0) {
        assert.equal(isWorkingDay({ regime: r.id, date: fwd.result, province }).result, true, `${r.id} result ${fwd.result} must be a working day`);
        const back = addWorkingDays({ regime: r.id, from: fwd.result, days, direction: 'before', province, trace: false });
        assert.ok(back.result <= from || !isWorkingDay({ regime: r.id, date: from, province }).result || back.result === from,
          `${r.id}: going back ${days} from ${fwd.result} gave ${back.result}, after ${from}`);
        assert.equal(countWorkingDays({ regime: r.id, from: back.result, to: fwd.result, province, trace: false }).result, days);
      }
    }
  }
});

test('the trace numbers every counted day and explains every skipped one', () => {
  const out = addWorkingDays({ regime: 'oia', from: '2026-12-14', days: 20 });
  const counted = out.trace.filter((t) => t.working && t.n);
  assert.deepEqual(counted.map((t) => t.n), Array.from({ length: 20 }, (_, i) => i + 1));
  for (const t of out.trace.filter((x) => !x.working)) assert.ok(t.reasons.length > 0, `${t.date} skipped with no reason`);
  assert.equal(out.trace[0].role, 'trigger');
  assert.equal(out.trace[out.trace.length - 1].date, out.result);
});

test('OIA: the summer period stops the clock from 25 December to 15 January', () => {
  const r = getRegime('oia');
  assert.equal(isWorkingDay({ regime: 'oia', date: '2026-12-24' }).result, true);
  for (let d = '2026-12-25'; d <= '2027-01-15'; d = addDays(d, 1)) {
    assert.equal(isWorkingDay({ regime: 'oia', date: d }).result, false, d);
  }
  assert.equal(isWorkingDay({ regime: 'oia', date: '2027-01-18' }).result, true);
  // Request received Monday 14 Dec 2026: 8 working days before the break
  // (15–24 Dec), then 12 from Monday 18 Jan 2027.
  assert.equal(addWorkingDays({ regime: 'oia', from: '2026-12-14', days: 20 }).result, '2027-02-02');
  assert.equal(r.rules.anniversary, null);
});

test('OIA counts provincial anniversary days as working days', () => {
  // Wellington Anniversary 2027 is Monday 25 January.
  assert.equal(isWorkingDay({ regime: 'oia', date: '2027-01-25' }).result, true);
});

test('Mondayised Anzac Day is skipped where the definition says so', () => {
  // Anzac Day 2027 is a Sunday, so Monday 26 April is the observed holiday.
  const res = isWorkingDay({ regime: 'oia', date: '2027-04-26' });
  assert.equal(res.result, false);
  assert.match(res.reasons[0], /Anzac Day \(observed/);
});

test('Labour Day, Matariki and the King’s Birthday are skipped', () => {
  for (const date of ['2026-10-26', '2026-07-10', '2026-06-01']) {
    assert.equal(isWorkingDay({ regime: 'oia', date }).result, false, date);
  }
});

test('regimes that exclude the local anniversary day need to know where', () => {
  const needs = REGIMES.filter((r) => r.rules.anniversary === 'location');
  assert.ok(needs.length >= 2);
  for (const r of needs) {
    assert.throws(() => addWorkingDays({ regime: r.id, from: '2027-01-20', days: 10 }), /province/);
  }
  // Auckland Anniversary 2027 is Monday 1 February.
  const akl = addWorkingDays({ regime: 'adls', from: '2027-01-25', days: 10, province: 'auckland' });
  const wgn = addWorkingDays({ regime: 'adls', from: '2027-01-25', days: 10, province: 'wellington' });
  assert.equal(isWorkingDay({ regime: 'adls', date: '2027-02-01', province: 'auckland' }).result, false);
  assert.equal(isWorkingDay({ regime: 'adls', date: '2027-02-01', province: 'wellington' }).result, true);
  assert.notEqual(akl.result, wgn.result);
});

test('banking business days skip both Auckland and Wellington anniversary days but not summer', () => {
  assert.equal(isWorkingDay({ regime: 'business-day', date: '2027-01-25' }).result, false); // Wellington
  assert.equal(isWorkingDay({ regime: 'business-day', date: '2027-02-01' }).result, false); // Auckland
  assert.equal(isWorkingDay({ regime: 'business-day', date: '2026-12-29' }).result, true);
  assert.equal(isWorkingDay({ regime: 'business-day', date: '2026-12-28' }).result, false); // Boxing Day observed
});

test('start date counted as day 1 when asked', () => {
  const after = addWorkingDays({ regime: 'oia', from: '2026-10-21', days: 1 });
  const on = addWorkingDays({ regime: 'oia', from: '2026-10-21', days: 1, startRule: 'on' });
  assert.equal(after.result, '2026-10-22');
  assert.equal(on.result, '2026-10-21');
});

test('a start date that is not a working day gets a note, and counting still starts the next working day', () => {
  const out = addWorkingDays({ regime: 'oia', from: '2026-10-24', days: 1 }); // Saturday before Labour Day
  assert.equal(out.result, '2026-10-27');
  assert.ok(out.countingNotes.some((n) => /not itself a working day/.test(n)));
});

test('calendar days, with and without moving to the next working day', () => {
  const plain = addCalendarDays({ from: '2026-12-01', days: 25 });
  assert.equal(plain.result, '2026-12-26');
  const rolled = addCalendarDays({ regime: 'taa', from: '2026-12-01', days: 27, roll: 'next-working-day' });
  assert.equal(rolled.unrolled, '2026-12-28');
  assert.equal(rolled.result, '2027-01-18'); // first working day after 15 Jan 2027
});

test('zero days returns the start date', () => {
  assert.equal(addWorkingDays({ regime: 'rma', from: '2026-12-25', days: 0 }).result, '2026-12-25');
});

test('bad input is refused with a clear message', () => {
  assert.throws(() => addWorkingDays({ regime: 'oia', from: '2026-02-30', days: 5 }), /real calendar date/);
  assert.throws(() => addWorkingDays({ regime: 'oia', from: '2022-06-01', days: 5 }), /between/);
  assert.throws(() => addWorkingDays({ regime: 'oia', from: '2026-01-01', days: -1 }), /whole number/);
  assert.throws(() => addWorkingDays({ regime: 'oia', from: '2026-01-01', days: 2.5 }), /whole number/);
  assert.throws(() => addWorkingDays({ regime: 'nope', from: '2026-01-01', days: 5 }), /Unknown regime/);
  assert.throws(() => addWorkingDays({ regime: 'oia', from: '2052-12-20', days: 30 }), /past the dates/);
});

test('every regime has a citation, URL, summary and sensible presets', () => {
  for (const r of REGIMES) {
    assert.ok(r.citation && r.url.startsWith('https://') && r.summaryLine.startsWith('Skips'), r.id);
    for (const p of r.presets || []) {
      assert.ok(p.id && p.label && Number.isInteger(p.days), `${r.id}/${p.id}`);
    }
    for (const key of [...r.rules.holidays, ...r.rules.mondayised]) {
      assert.ok(['new-year', 'day-after-new-year', 'waitangi', 'good-friday', 'easter-monday', 'anzac', 'sovereign', 'matariki', 'labour', 'christmas', 'boxing'].includes(key), `${r.id}: ${key}`);
    }
  }
});

test('reasons name the closed period', () => {
  const reasons = reasonsExcluded('2027-01-05', getRegime('rma'));
  assert.deepEqual(reasons.map((r) => r.code), ['blackout']);
  assert.match(reasons[0].label, /20 December – 10 January/);
});
