// Розрахунок виконання норми.
//
// Норма виробу задана на «базовий» чистий час зміни (за замовчуванням 8 год − 60 хв перерви = 420 хв).
// Кожен виготовлений виріб «заробляє» base / norm нормо-хвилин. Виконання — це заробленi
// нормо-хвилини, поділені на фактично доступний час (зміна − перерва − простій).
//
// Приклад: норма 35 шт, простій 30 хв → доступно 390 хв, норма на день 35 × 390 / 420 = 32,5 шт.
// Зроблено 20 шт → 20 / 32,5 = 61,5 %.

// Зміни за замовчуванням; адміністратор змінює їх у «Керування → Зміни».
export const DEFAULT_SHIFTS = [
  { id: 's1', name: '1 зміна', start: '06:30', end: '14:30', brk: 60 },
  { id: 's2', name: '2 зміна', start: '14:30', end: '22:30', brk: 60 },
  { id: 's3', name: 'Перша подовжена', start: '06:30', end: '17:00', brk: 60 },
  { id: 's4', name: 'Середня', start: '08:00', end: '17:00', brk: 60 },
];

// normShift/normBrk — зміна, на яку задано норми виробів (8 год − 60 хв = 420 хв чистого часу).
export const DEFAULT_SETTINGS = { normShift: 480, normBrk: 60, shifts: DEFAULT_SHIFTS };

export function normalizeSettings(s) {
  return {
    normShift: s?.normShift ?? DEFAULT_SETTINGS.normShift,
    normBrk: s?.normBrk ?? DEFAULT_SETTINGS.normBrk,
    shifts: Array.isArray(s?.shifts) ? s.shifts : DEFAULT_SHIFTS,
  };
}

/** '06:30' → 390 */
export function toMinutes(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || ''));
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
}

/** Тривалість зміни в хвилинах; кінець раніше за початок — зміна через північ. */
export function shiftLength(start, end) {
  const a = toMinutes(start);
  const b = toMinutes(end);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return 0;
  return b > a ? b - a : b + 1440 - a;
}

export function parseNum(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const n = parseFloat(String(value ?? '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function baseMinutes(settings = DEFAULT_SETTINGS) {
  return settings.normShift - settings.normBrk;
}

/**
 * @param {{items: {norm:number, qty:number}[], shift:number, brk:number, downtime:number, base:number}} day
 */
export function computeDay({ items = [], shift, brk, downtime = 0, base }) {
  const available = shift - brk - downtime;
  const valid = available > 0 && base > 0;
  let earned = 0;
  let pieces = 0;
  const lines = items.map((it) => {
    const norm = parseNum(it.norm);
    const qty = parseNum(it.qty);
    const minutes = norm > 0 && qty > 0 ? (qty * base) / norm : 0;
    const dayNorm = norm > 0 && valid ? (norm * available) / base : 0;
    earned += minutes;
    pieces += qty > 0 ? qty : 0;
    return { ...it, norm, qty, minutes, dayNorm, percent: dayNorm > 0 ? (qty / dayNorm) * 100 : 0 };
  });
  const percent = valid ? (earned / available) * 100 : 0;
  const remaining = valid ? Math.max(0, available - earned) : 0;
  return {
    valid,
    available,
    earned,
    pieces,
    percent,
    remaining,
    lines,
    // скільки ще штук кожного виробу треба, щоб вийти на 100 %
    toGo: lines.map((l) => (l.norm > 0 ? (remaining * l.norm) / base : 0)),
  };
}

export function entryPercent(e) {
  return computeDay(e).percent;
}

/** Зведення за набором записів: середнє зважене за доступним часом. */
export function summarize(entries) {
  let earned = 0;
  let available = 0;
  let downtime = 0;
  let pieces = 0;
  let min = Infinity;
  let max = -Infinity;
  let reached = 0;
  for (const e of entries) {
    const r = computeDay(e);
    if (!r.valid) continue;
    earned += r.earned;
    available += r.available;
    downtime += e.downtime || 0;
    pieces += r.pieces;
    min = Math.min(min, r.percent);
    max = Math.max(max, r.percent);
    if (r.percent >= 99.95) reached++;
  }
  const days = entries.length;
  return {
    days,
    earned,
    available,
    downtime,
    pieces,
    reached,
    percent: available > 0 ? (earned / available) * 100 : 0,
    min: days ? min : 0,
    max: days ? max : 0,
  };
}

export function level(percent) {
  if (percent >= 99.95) return 'good';
  if (percent >= 80) return 'warn';
  return 'bad';
}
