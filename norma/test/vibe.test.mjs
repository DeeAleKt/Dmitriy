import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeDay, level, normalizeSettings } from '../src/calc/model.js';
import { moodOf, QUIPS, quip } from '../src/calc/vibe.js';

const day = (qty, norm = 35) => computeDay({ start: '06:30', end: '19:30', brk: 75, products: [{ norm, qty }] }, 420);

test('жарти: без вписаних — нічого не показується; вписані — стійкі для тих самих умов', () => {
  for (const kind of Object.keys(QUIPS)) assert.equal(quip(kind, 'x'), null, kind);
  assert.equal(quip('нема-такого', 'x'), null);
  const mine = { good: ['А', 'Б', 'В', 'Г'] };
  assert.equal(quip('good', '2026-11-06|1', mine), quip('good', '2026-11-06|1', mine));
  const seen = new Set(Array.from({ length: 30 }, (_, i) => quip('good', `2026-11-06|${i}`, mine)));
  assert.ok(seen.size >= 3); // з часом змінюються
  assert.equal(quip('bad', 'x', mine), null); // для інших станів — нічого
});

test('настрій дня — з тих самих даних, що й відсоток', () => {
  const empty = computeDay({ start: '06:30', end: '19:30', brk: 75, products: [{ norm: '', qty: '' }] }, 420);
  assert.equal(moodOf(empty, 'idle'), 'empty');
  assert.equal(moodOf(day(''), 'idle'), 'ready');
  const lv = (r) => level(r.pct, 100);
  assert.equal(moodOf(day(20), lv(day(20))), 'bad'); // 34 %
  assert.equal(moodOf(day(55), lv(day(55))), 'warn'); // 94 %
  assert.equal(moodOf(day(60), lv(day(60))), 'good'); // 102 %
  assert.equal(moodOf(day(70), lv(day(70))), 'great'); // 119 %
  assert.equal(moodOf(day(60), 'good', { after: true }), 'after');
  assert.equal(moodOf(day(40), 'bad', { after: true }), 'bad'); // зміна скінчилась, а норми немає
  assert.equal(moodOf(day(400), 'great', { odd: true }), 'odd');
});

test('прайд-режим: увімкнений за замовчуванням і вимикається', () => {
  assert.equal(normalizeSettings(null).pride, true);
  assert.equal(normalizeSettings({ pride: false }).pride, false);
  assert.equal(normalizeSettings({ pride: 'так' }).pride, true);
});
