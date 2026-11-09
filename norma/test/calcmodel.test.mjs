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
  piecesToGoal,
  toRecord,
  wholePieces,
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
  const s = normalizeSettings({ v: 5, goal: 'abc', base: -5, shifts: [{ name: 'X', start: '08:00', end: '08:00' }], products: [{ name: 'A', norm: 0 }, { name: 'B', norm: '12,5' }] });
  assert.equal(s.goal, 100);
  assert.equal(s.base, 420);
  assert.equal(s.shifts.length, 0);
  assert.deepEqual(s.products.map((p) => [p.name, p.norm]), [['B', 12.5]]);
  const def = normalizeSettings(null);
  assert.equal(def.shifts.length, 1);
  assert.deepEqual([def.shifts[0].start, def.shifts[0].end, def.shifts[0].brk], ['06:30', '19:30', 105]);
});

test('налаштування: старі зміни замінює одна 6:30–19:30 з перервами 1 год 45 хв, нові лишаються як є', () => {
  const old = [
    { id: 's1', name: '1 зміна', start: '06:30', end: '14:30', brk: 60 },
    { id: 's2', name: '2 зміна', start: '14:30', end: '22:30', brk: 60 },
  ];
  const s = normalizeSettings({ v: 2, shifts: old, products: [{ name: 'B', norm: 35 }] });
  assert.equal(s.v, 5);
  assert.deepEqual(s.shifts.map((x) => `${x.start}–${x.end} ${x.brk}`), ['06:30–19:30 105']);
  assert.equal(s.products.length, 1);
  // 3-тя і 4-та версії (6:30–19:30, перерва 1 год чи 1 год 15 хв) теж оновлюються
  for (const [v, brk] of [[3, 60], [4, 75]]) {
    const old = normalizeSettings({ v, shifts: [{ id: 's1', name: 'Основна зміна', start: '06:30', end: '19:30', brk }] });
    assert.equal(old.shifts[0].brk, 105);
  }
  // уже нова версія: свої зміни (наприклад, додана нічна) не чіпаємо
  const mine = [...s.shifts, { id: 'n', name: 'Нічна', start: '19:30', end: '06:30', brk: 60 }];
  assert.equal(normalizeSettings({ ...s, shifts: mine }).shifts.length, 2);
  // 13 год − 1 год 45 хв перерв = 11 год 15 хв; норма 22 шт на 7 год → 35,36 шт на зміну;
  // зроблено 50 → 141,4 % (у майстра ≈142 %; раніше з 11 год 45 хв виходило 135,4 %)
  const user = computeDay({ start: '06:30', end: '19:30', brk: 105, products: [{ norm: 22, qty: 50 }] }, 420);
  assert.equal(user.workMin, 675);
  close(user.lines[0].dayNorm, (22 * 675) / 420);
  close(user.pct, (50 / ((22 * 675) / 420)) * 100); // 141,4 %
  close(computeDay({ start: '06:30', end: '19:30', brk: 75, products: [{ norm: 22, qty: 50 }] }, 420).pct, (50 / ((22 * 705) / 420)) * 100); // 135,4 %
  const c = computeDay({ start: '06:30', end: '19:30', brk: 105, products: [{ norm: 35, qty: 45 }] }, 420);
  close(c.lines[0].dayNorm, 56.25);
  close(c.pct, 80);
});

test('ціль на зміну видно одразу після норми: штуки цілими з запасом', () => {
  // норма 35 на 7 год, зміна 11 год 45 хв, ще нічого не зроблено → 58,75 шт → треба 59
  const empty = computeDay({ start: '06:30', end: '19:30', brk: 75, products: [{ norm: 35, qty: '' }] }, 420);
  assert.equal(empty.hasInput, false);
  close(toGoal(empty, 100).pieces, 58.75);
  assert.equal(wholePieces(toGoal(empty, 100).pieces), 59);
  assert.equal(wholePieces(toGoal(empty, 105).pieces), 62); // 61,69
  assert.equal(computeDay({ start: '06:30', end: '19:30', brk: 75, products: [{ norm: 35, qty: 58 }] }, 420).pct < 100, true);
  // ціле лишається цілим, навіть із похибкою дробів
  assert.equal(wholePieces(60), 60);
  assert.equal(wholePieces(60.004), 60);
  assert.equal(wholePieces(20.75), 21);
});

test('прайд-режим: увімкнений за замовчуванням і вимикається', () => {
  assert.equal(normalizeSettings(null).pride, true);
  assert.equal(normalizeSettings({ pride: false }).pride, false);
  assert.equal(normalizeSettings({ pride: 'так' }).pride, true);
});

test('ціль у штуках для кожного виробу: решта зміни — лише на нього', () => {
  const shift = { start: '06:30', end: '19:30', brk: 75 }; // 705 хв
  // один виріб: ціль = норма на день, і не змінюється від уже зробленого
  const one = computeDay({ ...shift, products: [{ norm: 85, qty: 40 }] }, 420);
  assert.equal(piecesToGoal(one, one.lines[0], 100, 420), 143); // 142,68
  // два вироби, ще нічого не внесено: кожен — на всю зміну
  const two = computeDay({ ...shift, products: [{ norm: 58, qty: '' }, { norm: 58, qty: '' }] }, 420);
  assert.deepEqual(two.lines.map((l) => piecesToGoal(two, l, 100, 420)), [98, 98]); // 97,36
  // внесли 50 шт першого — другому лишилось (705 − 50·420/58) · 58/420 = 47,36 → 48
  const part = computeDay({ ...shift, products: [{ norm: 58, qty: 50 }, { norm: 58, qty: '' }] }, 420);
  assert.equal(piecesToGoal(part, part.lines[1], 100, 420), 48);
  // інші роботи теж зменшують ціль: 2 год → (705 − 120) · 85/420 = 118,4 → 119
  const other = computeDay({ ...shift, products: [{ norm: 85, qty: '' }], others: [{ kind: 'Прибирання', min: 120 }] }, 420);
  assert.equal(piecesToGoal(other, other.lines[0], 100, 420), 119);
  // без норми — цілі немає
  const none = computeDay({ ...shift, products: [{ norm: '', qty: '' }] }, 420);
  assert.equal(piecesToGoal(none, none.lines[0], 100, 420), null);
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

// ---------- тенденції та висновки ----------
import { compareDay, monthGoalOf, monthPlan, monthStatus, movingAvg, openDayOf, rankInMonth, trendOf, weeksOf, withDay, workdayTest } from '../src/calc/model.js';

const rec = (date, qty, patch = {}) => ({ ...day({ date, products: [{ name: 'А', norm: 35, qty }] }), base: 420, ...patch });

test('тенденція: зростання, спад, стабільно', () => {
  const up = summarize([30, 31, 32, 33, 34, 35, 36].map((q, i) => rec(`2026-10-${String(5 + i).padStart(2, '0')}`, q))).days;
  const t = trendOf(up);
  assert.equal(t.dir, 'up');
  close(t.slope, (1 / 35) * 100, 1e-9); // +1 шт щодня = +2,857%
  assert.equal(trendOf(up.slice(0, 4)), null); // мало даних
  const flat = summarize([35, 35, 35, 35, 35].map((q, i) => rec(`2026-10-0${5 + i}`, q))).days;
  assert.equal(trendOf(flat).dir, 'flat');
  const down = summarize([40, 38, 36, 34, 32].map((q, i) => rec(`2026-10-0${5 + i}`, q))).days;
  assert.equal(trendOf(down).dir, 'down');
});

test('ковзне середнє і тижні', () => {
  // пн–пт 5–9 жовтня і пн–вт 12–13 жовтня — два тижні
  const dates = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-12', '2026-10-13'];
  const items = summarize([35, 35, 0, 35, 35, 42, 42].map((q, i) => rec(dates[i], q))).days;
  const ma = movingAvg(items, 3);
  close(ma[0], 100);
  close(ma[2], 200 / 3);
  const w = weeksOf(items);
  assert.equal(w.length, 2);
  assert.equal(w[0].n, 5);
  close(w[0].pct, 80);
  close(w[1].pct, 120);
  close(w[1].delta, 40);
  assert.equal(w[0].delta, null);
});

test('план місяця: скільки треба в решту днів', () => {
  // 1–29 жовтня: 20 записів по 90 %; сьогодні 30-те (пт), лишається 30 і (не) 31 (сб)
  const days = {};
  let k = 0;
  for (let d = 1; d <= 29 && k < 20; d++) {
    const iso = `2026-10-${String(d).padStart(2, '0')}`;
    const wd = new Date(2026, 9, d).getDay();
    if (wd === 0 || wd === 6) continue;
    days[iso] = rec(iso, 31.5); // 90 %
    k++;
  }
  const p = monthPlan(days, '2026-10-30', 100);
  assert.equal(p.rest, 1);
  // 20 днів × 420 × 0,9 = 7560; треба (21 × 420) = 8820 → 1260 нормо-хв за 420 → 300 %
  close(p.needPct, 300);
  assert.equal(p.done, false);
  const good = Object.fromEntries(Object.keys(days).map((d) => [d, rec(d, 42)])); // 120 %
  assert.equal(monthPlan(good, '2026-10-30', 100).done, true);
  // сьогоднішня зміна ще триває: її неповний запис не рахується, а день лишається в плані
  const open = monthPlan({ ...days, '2026-10-30': rec('2026-10-30', 5) }, '2026-10-30', 100, '2026-10-30');
  assert.equal(open.rest, 1);
  close(open.needPct, 300);
});

test('openDayOf: день не остаточний, поки зміна триває', () => {
  const days = { '2026-10-30': rec('2026-10-30', 20) }; // 6:30–14:30
  assert.equal(openDayOf(days, '2026-10-30', new Date(2026, 9, 30, 10, 0)), '2026-10-30');
  assert.equal(openDayOf(days, '2026-10-30', new Date(2026, 9, 30, 15, 0)), null);
  assert.equal(openDayOf({}, '2026-10-30', new Date(2026, 9, 30, 10, 0)), null);
});

test('порівняння дня і місце в місяці', () => {
  const days = { '2026-10-26': rec('2026-10-26', 35), '2026-10-27': rec('2026-10-27', 42), '2026-10-28': rec('2026-10-28', 28) };
  const c = compareDay(days, '2026-10-28', 100);
  close(c.prev.pct, 120);
  close(c.avg30.pct, 110);
  close(c.best.pct, 120);
  assert.deepEqual(rankInMonth(days, '2026-10-27'), { place: 1, of: 3 });
  assert.deepEqual(rankInMonth(days, '2026-10-28'), { place: 3, of: 3 });
});

test('серія не обривається незавершеним сьогоднішнім днем', () => {
  const days = { '2026-10-28': rec('2026-10-28', 35), '2026-10-29': rec('2026-10-29', 36), '2026-10-30': rec('2026-10-30', 10) };
  assert.equal(streak(days, 100).cur, 0);
  assert.equal(streak(days, 100, '2026-10-30').cur, 2);
});

test('зміни, вироби і втрати від простою', () => {
  const s = summarize([
    rec('2026-10-05', 35, { shiftName: '1 зміна' }),
    rec('2026-10-06', 35, { shiftName: '1 зміна' }),
    { ...rec('2026-10-07', 28, { shiftName: '2 зміна' }), downtime: [{ reason: 'Світло', min: 60 }] },
    { ...rec('2026-10-08', 30, { shiftName: '2 зміна' }) },
    { ...day({ date: '2026-10-09', products: [{ name: 'Б', norm: 70, qty: 77 }] }), base: 420, shiftName: '1 зміна' },
    { ...day({ date: '2026-10-12', products: [{ name: 'Б', norm: 70, qty: 77 }] }), base: 420, shiftName: '1 зміна' },
  ]);
  assert.deepEqual(s.shifts.map((x) => x.name), ['1 зміна', '2 зміна']);
  close(s.shifts[0].pct, 105);
  assert.equal(s.perf[0].name, 'Б');
  close(s.perf[0].pct, 110);
  close(s.lostPieces, (60 * 35) / 420); // 5 шт
  const facts = insights(s, null, 100, periodOf('month', '2026-10-30'), { trend: trendOf(s.days) });
  const text = facts.map((f) => f.text).join(' | ');
  assert.match(text, /Тенденція/);
  assert.match(text, /недороблено ≈ 5 шт/);
  assert.match(text, /Найкраще виходить «Б»/);
});

test('мета на місяць: окрема → загальна → особиста', () => {
  const s = normalizeSettings({ goal: 100, monthGoal: 105, monthGoals: { '2026-10': 110, bad: 120, '2026-11': 999 } });
  assert.deepEqual(s.monthGoals, { '2026-10': 110 });
  assert.equal(monthGoalOf(s, '2026-10'), 110);
  assert.equal(monthGoalOf(s, '2026-09'), 105);
  assert.equal(monthGoalOf(normalizeSettings({ goal: 95 }), '2026-09'), 95);
  assert.deepEqual(normalizeSettings({}).workdays, [1, 2, 3, 4, 5]);
  assert.deepEqual(normalizeSettings({ workdays: [6, 1, 1, 9] }).workdays, [1, 6]);
});

test('стан місяця: календарний місяць, нестача до мети, план на решту днів', () => {
  // 1–29 жовтня: 20 робочих днів по 90 % (як у тесті плану), сьогодні 30-те (пт)
  const days = {};
  for (let d = 1, k = 0; d <= 29 && k < 20; d++) {
    const wd = new Date(2026, 9, d).getDay();
    if (wd === 0 || wd === 6) continue;
    const iso = `2026-10-${String(d).padStart(2, '0')}`;
    days[iso] = rec(iso, 31.5);
    k++;
  }
  days['2026-09-30'] = rec('2026-09-30', 70); // інший місяць — не рахується
  const m = monthStatus(days, '2026-10', '2026-10-30', 95);
  assert.equal(m.n, 20);
  close(m.pct, 90);
  close(m.short, 0.05 * 20 * 420); // 5 % від 8400 хв = 420 нормо-хв
  assert.equal(m.rest, 1);
  close(m.needPct, 195); // (0,95 × 8820 − 7560) / 420
  // робоча субота теж рахується в решті
  assert.equal(monthStatus(days, '2026-10', '2026-10-30', 95, [1, 2, 3, 4, 5, 6]).rest, 2);
  // сьогоднішня зміна, що триває: не в середньому, але в решті; «з сьогоднішнім днем»
  const open = { ...days, '2026-10-30': rec('2026-10-30', 35) };
  const mo = monthStatus(open, '2026-10', '2026-10-30', 95, [1, 2, 3, 4, 5], '2026-10-30');
  assert.equal(mo.n, 20);
  assert.equal(mo.rest, 1);
  close(withDay(mo, computeDay(open['2026-10-30'], 420)), ((7560 + 420) / 8820) * 100);
  // минулий місяць закрито
  const past = monthStatus(days, '2026-10', '2026-11-05', 95);
  assert.equal(past.closed, true);
  assert.equal(past.rest, 0);
  assert.equal(past.reached, false);
  // новий місяць без записів: треба просто тримати мету
  const fresh = monthStatus(days, '2026-11', '2026-11-02', 105);
  assert.equal(fresh.n, 0);
  assert.equal(fresh.needPct, 105);
});

test('змінний графік 1/1 і 2/2: робочі дні від першого дня блоку, у будь-який бік', () => {
  const week = ['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11'];
  const one = workdayTest(normalizeSettings({ cycle: { on: 1, off: 1, from: '2026-11-06' } }));
  assert.deepEqual(week.map(one), [true, false, true, false, true, false]);
  assert.equal(one('2026-11-05'), false); // і до дати відліку
  const two = workdayTest(normalizeSettings({ cycle: { on: 2, off: 2, from: '2026-11-07' } }));
  assert.deepEqual(week.map(two), [false, true, true, false, false, true]);
  // по той бік переходу на зимовий час (25.10): 22–23.10 робочі, 24–25.10 вихідні
  assert.deepEqual(['2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'].map(two), [true, true, false, false]);
  // без графіка — дні тижня; зіпсований графік відкидається
  assert.equal(workdayTest(normalizeSettings({}))('2026-11-07'), false); // субота
  assert.equal(normalizeSettings({ cycle: { on: 0, off: 1, from: '2026-11-06' } }).cycle, null);
  // решта листопада з 24-го при 1/1 від 6.11: 24 (уже записаний — не рахується), 26, 28, 30
  const days = { '2026-11-24': rec('2026-11-24', 35) };
  assert.equal(monthStatus(days, '2026-11', '2026-11-24', 100, one).rest, 3);
  assert.equal(monthStatus({}, '2026-11', '2026-11-24', 100, one).rest, 4);
});

test('новий день: зміна з попереднього, а вхід і вихід — за графіком', async () => {
  const { newDraft } = await import('../src/calc/store.js');
  const night = { id: 'n', name: 'Нічна', start: '19:30', end: '06:30', brk: 60 };
  const settings = normalizeSettings({ v: 5, shifts: [...normalizeSettings({}).shifts, night] });
  const prev = { ...rec('2026-10-29', 30), shiftName: 'Нічна', start: '19:40', end: '06:15', brk: 60 };
  const d = newDraft('2026-10-30', settings, { '2026-10-29': prev });
  assert.equal(d.shiftName, 'Нічна');
  assert.equal(d.start, '19:30');
  assert.equal(d.end, '06:30');
  assert.equal(d.products[0].norm, '35');
  assert.equal(d.products[0].qty, '');
  // зміни з учорашнього дня вже немає (старий графік чи свій час) — основна 6:30–19:30
  for (const shiftName of ['1 зміна', '']) {
    const x = newDraft('2026-10-30', settings, { '2026-10-29': { ...prev, shiftName } });
    assert.deepEqual([x.shiftName, x.start, x.end, x.brk], ['Основна зміна', '06:30', '19:30', 105]);
  }
  // вхід 6:30, вихід 14:15, перерва 1 год → 6 год 45 хв, норма 35 шт → 33,75 шт на день
  const c = computeDay({ ...prev, start: '06:30', end: '14:15' }, 420);
  assert.equal(c.shiftMin, 465);
  assert.equal(c.workMin, 405);
  close(c.lines[0].dayNorm, 33.75);
});

test('приблизна норма: зберігається, позначається і уточнюється з перерахунком', async () => {
  const { applyNorm, approxProducts, isApprox } = await import('../src/calc/model.js');
  const draft = { ...day({ date: '2026-10-28', products: [{ name: 'Кришка', norm: '30', qty: '30', approx: true }] }) };
  const r = toRecord(draft, 420);
  assert.equal(r.products[0].approx, true);
  assert.equal(isApprox(r), true);
  // зміна лише позначки — це зміна запису (автозбереження її помітить)
  assert.equal(sameRecord(r, toRecord({ ...draft, products: [{ ...draft.products[0], approx: false }] }, 420)), false);
  assert.equal(normalizeSettings({ products: [{ name: 'Кришка', norm: 30, approx: true }] }).products[0].approx, true);

  const days = {
    '2026-10-27': { ...rec('2026-10-27', 30), products: [{ name: 'Кришка', norm: 30, qty: 30, approx: true }] },
    '2026-10-28': r,
    '2026-10-29': { ...rec('2026-10-29', 35), products: [{ name: 'Кришка', norm: 35, qty: 35 }] }, // точна — не чіпаємо
  };
  const list = approxProducts(days);
  assert.equal(list.length, 1);
  assert.equal(list[0].days, 2);
  assert.equal(list[0].from, '2026-10-27');
  close(computeDay(days['2026-10-27'], 420).pct, 100);

  const { next, changed } = applyNorm(days, 'Кришка', 40, true, 123);
  assert.deepEqual(changed, ['2026-10-27', '2026-10-28']);
  assert.equal(next['2026-10-27'].products[0].norm, 40);
  assert.equal(next['2026-10-27'].products[0].approx, undefined);
  assert.equal(next['2026-10-27'].savedAt, 123);
  close(computeDay(next['2026-10-27'], 420).pct, 75); // 30 шт при нормі 40
  assert.equal(next['2026-10-29'], days['2026-10-29']);
  assert.equal(approxProducts(next).length, 0);
  // уточнили, але ще не остаточно — позначка лишається
  assert.equal(applyNorm(days, 'Кришка', 38, false).next['2026-10-28'].products[0].approx, true);
});

test('неправдоподібний відсоток: скорочений показ, причина, не рекорд', async () => {
  const { oddDay, pctText, bestDay } = await import('../src/calc/model.js');
  assert.equal(pctText(37333.3), '999+');
  assert.equal(pctText(104.44), '104,4');
  // простій 6 год 58 хв: лишилось 2 хв, 80 шт при нормі 45 → 37 333 %
  const bad = { ...rec('2026-10-30', 80), products: [{ name: 'Кришка', norm: 45, qty: 80 }], downtime: [{ reason: 'Поломка', min: 418 }] };
  const c = computeDay(bad, 420);
  close(c.pct, (80 * 420) / 45 / 2 * 100);
  assert.equal(oddDay(c).why, 'down');
  assert.equal(oddDay(computeDay({ ...rec('2026-10-30', 40), end: '08:30' }, 420)).why, 'time'); // вихід о 8:30 → 1 год роботи
  assert.equal(oddDay(computeDay(rec('2026-10-30', 350), 420)).why, 'qty'); // зайвий нуль
  assert.equal(oddDay(computeDay(rec('2026-10-30', 40), 420)), null);
  const days = { '2026-10-28': rec('2026-10-28', 40), '2026-10-30': bad };
  assert.equal(bestDay(days).date, '2026-10-28');
  const s = summarize(Object.values(days));
  assert.deepEqual(s.odd.map((d) => d.date), ['2026-10-30']);
  assert.equal(s.best.date, '2026-10-28');
});
