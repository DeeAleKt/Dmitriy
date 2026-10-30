import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fromSnapshot, mergeDays, monthBody, monthId } from '../src/calc/cloud.js';

const day = (date, savedAt, qty = 30) => ({ date, savedAt, start: '06:30', end: '14:30', brk: 60, base: 420, products: [{ name: 'A', norm: 35, qty }], downtime: [], others: [] });
const snap = (docs) => ({ empty: !docs.length, docs: docs.map(([id, body]) => ({ id, data: () => body })) });

test('monthId і monthBody розкладають дні по місяцях', () => {
  assert.equal(monthId('2026-10-30'), 'm-2026-10');
  const days = { '2026-10-01': day('2026-10-01', 1), '2026-11-02': day('2026-11-02', 2) };
  const b = monthBody(days, '2026-10', { '2026-10-05': 9, '2026-10-01': 3, '2026-11-01': 4 });
  assert.deepEqual(Object.keys(b.days), ['2026-10-01']);
  // позначка видалення не пишеться для дня, який знову існує
  assert.deepEqual(b.deleted, { '2026-10-05': 9 });
  assert.equal(b.kind, 'month');
});

test('fromSnapshot збирає налаштування, дні та видалення', () => {
  const r = fromSnapshot(
    snap([
      ['settings', { kind: 'settings', goal: 105, wipedAt: 7 }],
      ['m-2026-10', { kind: 'month', month: '2026-10', days: { '2026-10-01': day('2026-10-01', 1), '2026-10-02': { bad: true } }, deleted: { '2026-10-03': 5 } }],
      ['junk', { hello: 1 }],
    ]),
  );
  assert.equal(r.settings.goal, 105);
  assert.deepEqual(Object.keys(r.days), ['2026-10-01']);
  assert.deepEqual(r.deleted, { '2026-10-03': 5 });
  assert.ok(r.months.has('2026-10'));
  assert.equal(r.empty, false);
});

test('mergeDays: новіші локальні дні виграють, видалені й стерті — ні', () => {
  const remote = { days: { '2026-10-01': day('2026-10-01', 100, 30), '2026-10-02': day('2026-10-02', 100, 30) }, deleted: { '2026-10-04': 300 } };
  const local = {
    '2026-10-01': day('2026-10-01', 200, 35), // новіший — переносимо
    '2026-10-02': day('2026-10-02', 50, 10), // старіший — лишається з акаунта
    '2026-10-03': day('2026-10-03', 400), // нового в акаунті немає — додаємо
    '2026-10-04': day('2026-10-04', 250), // видалений пізніше — не воскрешаємо
    '2026-09-30': day('2026-09-30', 20), // збережений до повного стирання
  };
  const { days, touched } = mergeDays(remote, local, 30);
  assert.equal(days['2026-10-01'].products[0].qty, 35);
  assert.equal(days['2026-10-02'].products[0].qty, 30);
  assert.ok(days['2026-10-03']);
  assert.equal(days['2026-10-04'], undefined);
  assert.equal(days['2026-09-30'], undefined);
  assert.deepEqual([...touched], ['2026-10']);
});
