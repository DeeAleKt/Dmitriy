import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeDay, level, parseNum, summarize } from '../src/calc.js';

const day = (items, downtime = 0, extra = {}) => ({ items, shift: 480, brk: 60, base: 420, downtime, ...extra });
const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test('повна зміна без простою: 35 з 35 = 100 %', () => {
  const r = computeDay(day([{ norm: 35, qty: 35 }]));
  close(r.percent, 100);
  close(r.available, 420);
  close(r.lines[0].dayNorm, 35);
});

test('20 шт при нормі 35 = 57,1 %', () => {
  close(computeDay(day([{ norm: 35, qty: 20 }])).percent, (20 / 35) * 100);
});

test('простій 30 хв зменшує норму на день до 32,5 шт', () => {
  const r = computeDay(day([{ norm: 35, qty: 20 }], 30));
  close(r.available, 390);
  close(r.lines[0].dayNorm, 32.5);
  close(r.percent, (20 / 32.5) * 100);
  close(r.toGo[0], 12.5);
});

test('кілька різних виробів додаються через нормо-хвилини', () => {
  // половину дня — виріб із нормою 35, половину — з нормою 70
  const r = computeDay(day([{ norm: 35, qty: 17.5 }, { norm: 70, qty: 35 }]));
  close(r.percent, 100);
  close(r.pieces, 52.5);
});

test('коротка зміна: 4 год без перерви, норма 35 на 7 год', () => {
  const r = computeDay(day([{ norm: 35, qty: 20 }], 0, { shift: 240, brk: 0 }));
  close(r.lines[0].dayNorm, 20);
  close(r.percent, 100);
});

test('перевиконання не обрізається', () => {
  const r = computeDay(day([{ norm: 35, qty: 42 }]));
  close(r.percent, 120);
  close(r.remaining, 0);
  close(r.toGo[0], 0);
});

test('увесь день простій — розрахунок недійсний, без ділення на нуль', () => {
  const r = computeDay(day([{ norm: 35, qty: 5 }], 420));
  assert.equal(r.valid, false);
  assert.equal(r.percent, 0);
});

test('рядки без виробу чи кількості ігноруються', () => {
  const r = computeDay(day([{ norm: 0, qty: 10 }, { norm: 35, qty: '' }, { norm: '35', qty: '7' }]));
  close(r.percent, 20);
});

test('parseNum розуміє кому і пробіли', () => {
  assert.equal(parseNum('12,5'), 12.5);
  assert.equal(parseNum(' 1 200 '), 1200);
  assert.equal(parseNum('abc'), 0);
  assert.equal(parseNum(undefined), 0);
});

test('зведення зважене за доступним часом', () => {
  const s = summarize([
    day([{ norm: 35, qty: 35 }]), // 100 % за 420 хв
    day([{ norm: 35, qty: 0 }], 210), // 0 % за 210 хв
  ]);
  assert.equal(s.days, 2);
  close(s.percent, (420 / 630) * 100);
  close(s.min, 0);
  close(s.max, 100);
  assert.equal(s.reached, 1);
  assert.equal(s.downtime, 210);
});

test('рівні кольорів', () => {
  assert.equal(level(100), 'good');
  assert.equal(level(99.96), 'good');
  assert.equal(level(85), 'warn');
  assert.equal(level(10), 'bad');
});
