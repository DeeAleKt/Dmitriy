import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  computeDay,
  insights,
  isBlank,
  level,
  makeSample,
  minutesLabel,
  moveAnchor,
  normalizeSettings,
  paceAt,
  periodOf,
  sameRecord,
  streak,
  summarize,
  toGoal,
  toRecord,
} from '../src/calc/model.js';

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
const day = (patch = {}) => ({
  date: '2026-10-30',
  start: '06:30',
  end: '14:30',
  brk: 60,
  products: [],
  downtime: [],
  others: [],
  ...patch,
});

test('7 год інших робіт при 7 год роботи = 100 %', () => {
  const r = computeDay(day({ others: [{ kind: 'Прибирання', min: 420 }] }));
  close(r.avail, 420);
  close(r.pct, 100);
});

test('виріб: 20 з 35 і простій 30 хв = 61,5 %, ще 12,5 шт', () => {
  const r = computeDay(day({ products: [{ norm: '35', qty: '20' }], downtime: [{ reason: 'x', min: 30 }] }));
  close(r.avail, 390);
  close(r.lines[0].dayNorm, 32.5);
  close(r.pct, (20 / 32.5) * 100);
  close(toGoal(r, 100).pieces, 12.5);
});

test('кілька простоїв додаються', () => {
  const r = computeDay(day({ downtime: [{ min: 15 }, { min: '20' }, { min: 0 }] }));
  assert.equal(r.downMin, 35);
  close(r.avail, 385);
});

test('з іншими роботами норма виробу рахується на решту часу', () => {
  // 3,5 год інших робіт → на вироби 3,5 год → норма на день 17,5 шт
  const r = computeDay(day({ products: [{ norm: 35, qty: 17.5 }], others: [{ min: 210 }] }));
  close(r.prodTime, 210);
  close(r.lines[0].dayNorm, 17.5);
  close(r.lines[0].pct, 100);
  close(r.pct, 100);
});

test('мета 110 %: скільки ще штук', () => {
  const r = computeDay(day({ products: [{ norm: 35, qty: 35 }] }));
  close(r.pct, 100);
  close(toGoal(r, 110).pieces, 3.5);
  close(toGoal(r, 100).pieces, 0);
});

test('помилки: немає часу зміни, простій забрав увесь час, інших робіт забагато', () => {
  assert.equal(computeDay(day({ start: '', end: '14:30' })).error, 'shift');
  assert.equal(computeDay(day({ brk: 480 })).error, 'break');
  assert.equal(computeDay(day({ downtime: [{ min: 420 }] })).error, 'downtime');
  const r = computeDay(day({ others: [{ min: 500 }] }));
  assert.equal(r.error, 'other');
  assert.ok(r.pct > 100);
});

test('рядок без норми не рахується в штуки', () => {
  const r = computeDay(day({ products: [{ norm: '', qty: 10 }, { norm: 35, qty: 7 }] }));
  assert.equal(r.pieces, 7);
  assert.equal(r.active.length, 1);
  close(r.pct, 20);
});

test('темп: середина 1 зміни', () => {
  const d = day({ products: [{ norm: 35, qty: 20 }] });
  const r = computeDay(d);
  const p = paceAt(d, r, new Date(2026, 9, 30, 10, 30)); // 4 год з 8
  assert.equal(p.state, 'live');
  close(p.frac, 0.5);
  close(p.expectedPieces, 17.5);
  close(p.diffPieces, 2.5);
  close(p.pace, (20 / 17.5) * 100);
});

test('темп: до і після зміни, нічна зміна через північ', () => {
  const d = day({ products: [{ norm: 35, qty: 1 }] });
  const r = computeDay(d);
  assert.equal(paceAt(d, r, new Date(2026, 9, 30, 5, 0)).state, 'before');
  assert.equal(paceAt(d, r, new Date(2026, 9, 30, 15, 0)).state, 'after');
  const n = day({ start: '22:30', end: '06:30', brk: 30, products: [{ norm: 35, qty: 1 }] });
  const rn = computeDay(n);
  const p = paceAt(n, rn, new Date(2026, 9, 31, 2, 30)); // наступного дня о 2:30
  assert.equal(p.state, 'live');
  close(p.frac, 0.5);
});

test('запис: нормалізація, порівняння, порожня чернетка', () => {
  const draft = day({
    products: [{ key: 'a', name: ' Корпус ', norm: '35', qty: '20,5' }, { key: 'b', name: '', norm: '', qty: '' }],
    downtime: [{ key: 'c', reason: 'Немає матеріалу', min: 30 }],
    others: [{ key: 'd', kind: '', min: 0 }],
  });
  const rec = toRecord(draft, 420);
  assert.deepEqual(rec.products, [{ name: 'Корпус', norm: 35, qty: 20.5 }]);
  assert.equal(rec.others.length, 0);
  assert.ok(sameRecord(rec, { ...rec, savedAt: 123, sample: true }));
  assert.ok(!sameRecord(rec, { ...rec, brk: 30 }));
  assert.ok(isBlank(day({ products: [{ norm: 35, qty: '' }] })));
  assert.ok(!isBlank(day({ others: [{ min: 30 }] })));
});

test('зведення: зважене середнє, серії, причини, дні тижня', () => {
  const recs = [
    { ...day({ date: '2026-10-05', products: [{ name: 'А', norm: 35, qty: 35 }] }), base: 420 }, // 100
    { ...day({ date: '2026-10-06', products: [{ name: 'А', norm: 35, qty: 42 }] }), base: 420 }, // 120
    { ...day({ date: '2026-10-07', products: [{ name: 'Б', norm: 35, qty: 17.5 }], downtime: [{ reason: 'Світло', min: 60 }] }), base: 420 }, // 17.5/30*100=58.3
    { ...day({ date: '2026-10-08', others: [{ kind: 'Прибирання', min: 420 }] }), base: 420 }, // 100
  ];
  const s = summarize(recs, 100);
  assert.equal(s.n, 4);
  close(s.pct, ((420 + 504 + 210 + 420) / (420 + 420 + 360 + 420)) * 100);
  assert.equal(s.goalDays, 3);
  assert.equal(s.maxRun, 2);
  assert.deepEqual(s.down, [{ name: 'Світло', min: 60 }]);
  assert.deepEqual(s.other, [{ name: 'Прибирання', min: 420 }]);
  assert.equal(s.products[0].name, 'А');
  assert.equal(s.products[0].qty, 77);
  close(s.best.pct, 120);
  assert.equal(s.weekdays[0].n, 1); // 5 жовтня 2026 — понеділок
  const days = Object.fromEntries(recs.map((r) => [r.date, r]));
  assert.deepEqual(streak(days, 100), { cur: 1, best: 2 });
});

test('рівні кольору відносно мети', () => {
  assert.equal(level(120, 100), 'great');
  assert.equal(level(100, 100), 'good');
  assert.equal(level(85, 100), 'warn');
  assert.equal(level(50, 100), 'bad');
  assert.equal(level(100, 110), 'warn');
});

test('періоди і зсув', () => {
  assert.equal(periodOf('month', '2026-10-30').label, 'Жовтень 2026');
  assert.deepEqual([periodOf('month', '2026-10-30').from, periodOf('month', '2026-10-30').to], ['2026-10-01', '2026-10-31']);
  assert.equal(periodOf('week', '2026-10-30').from, '2026-10-26');
  assert.equal(periodOf('year', '2026-10-30').to, '2026-12-31');
  assert.equal(moveAnchor('month', '2026-01-15', -1), '2025-12-01');
  assert.equal(moveAnchor('week', '2026-10-30', 1), '2026-11-06');
});

test('налаштування: значення за замовчуванням і захист від сміття', () => {
  const s = normalizeSettings({ goal: 'abc', base: -5, shifts: [{ name: 'X', start: '08:00', end: '08:00' }], products: [{ name: 'A', norm: 0 }, { name: 'B', norm: '12,5' }] });
  assert.equal(s.goal, 100);
  assert.equal(s.base, 420);
  assert.equal(s.shifts.length, 0);
  assert.deepEqual(s.products.map((p) => [p.name, p.norm]), [['B', 12.5]]);
  assert.equal(normalizeSettings(null).shifts.length, 4);
});

test('приклад історії: лише будні, не чіпає справжні дні, позначений', () => {
  const s = normalizeSettings(null);
  const real = { '2026-10-29': { ...day({ date: '2026-10-29' }), base: 420 } };
  const sample = makeSample(s, real, '2026-10-30', 20);
  const dates = Object.keys(sample);
  assert.equal(dates.length, 20);
  assert.ok(!dates.includes('2026-10-29'));
  for (const d of dates) {
    const wd = new Date(d).getDay();
    assert.ok(wd !== 0 && wd !== 6, d);
    assert.equal(sample[d].sample, true);
    assert.ok(computeDay(sample[d], 420).valid);
  }
  const sum = summarize(Object.values(sample), 100);
  assert.ok(sum.pct > 70 && sum.pct < 130, `середнє ${sum.pct}`);
});

test('підказки з’являються, коли є дані', () => {
  const s = normalizeSettings(null);
  const sample = makeSample(s, {}, '2026-10-30', 30);
  const cur = summarize(Object.values(sample), 100);
  const list = insights(cur, cur, 100, periodOf('month', '2026-10-30'));
  assert.ok(list.length >= 3);
  assert.ok(list.every((x) => x.text && x.icon));
});

test('підписи хвилин', () => {
  assert.equal(minutesLabel(45), '45 хв');
  assert.equal(minutesLabel(60), '1 год');
  assert.equal(minutesLabel(90), '1,5 год');
  assert.equal(minutesLabel(240), '4 год');
});
