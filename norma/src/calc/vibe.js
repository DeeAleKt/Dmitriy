// Прайд-режим: веселковий вигляд (styles.css, атрибут data-pride) і місце для власних жартів під відсотком.
//
// Жарти вписує власник застосунку сам — рядками в QUIPS за станом дня. Порожній список — жарту немає
// (рядок під відсотком не показується). Жарт не змінюється на кожну цифру: лише зі станом дня,
// раз на 10 хв або коли його торкнутися. Розрахунок від цього не залежить.

/** Простий стійкий хеш рядка — щоб жарт не мінявся на кожну цифру. */
function hash(s) {
  let h = 2166136261;
  for (const ch of String(s)) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return h >>> 0;
}

/** Жарти за станом дня — по рядку в лапках через кому. */
export const QUIPS = {
  empty: [], // норми ще немає
  ready: [], // норма є, зробленого ще немає
  bad: [], // далеко до мети (менше 80 % від неї)
  warn: [], // майже
  good: [], // мету виконано
  great: [], // на 15 % і більше понад мету
  odd: [], // неправдоподібний відсоток (понад 250 %)
  after: [], // зміну завершено
};

/** Жарт для стану дня або null, якщо для нього нічого не вписано. */
export function quip(kind, seed = '', quips = QUIPS) {
  const list = quips[kind] || [];
  return list.length ? list[hash(`${kind}|${seed}`) % list.length] : null;
}

/** Стан дня для жарту — з тих самих даних, що й відсоток. */
export function moodOf(res, lv, { odd, after } = {}) {
  if (odd) return 'odd';
  if (!res.active.length && !res.otherMin) return 'empty';
  if (!res.hasInput) return 'ready';
  if (after && res.valid) return lv === 'bad' || lv === 'warn' ? lv : 'after';
  return ['bad', 'warn', 'good', 'great'].includes(lv) ? lv : 'ready';
}

/** Конфеті кольорів прапора (з трансгендерними й міжрасовими смугами Progress Pride). */
export const PRIDE_COLORS = ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787', '#5bcefa', '#f5a9b8', '#ffffff', '#784f17'];
