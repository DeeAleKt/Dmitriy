// Модель офлайн-калькулятора: розрахунок дня, темп зміни, статистика, підказки.
// Усе — чисті функції без DOM і сховища, щоб їх легко перевіряти тестами.
//
// Норма виробу задана на «базовий» чистий час (за замовчуванням 7 год = 420 хв).
// Виріб «заробляє» base / norm нормо-хвилин за штуку; інші роботи — хвилина за хвилину.
// Виконання = зароблені нормо-хвилини / доступний час (зміна − перерва − простій).

import { parseNum, shiftLength, toMinutes } from '../calc.js';
import { addDays, fmt, fmtMin, fromISO, monthRange, pad, plural, toISO, weekRange } from '../util.js';

export { parseNum as num, shiftLength, toMinutes };

export const DEFAULT_SHIFTS = [
  { id: 's1', name: '1 зміна', start: '06:30', end: '14:30', brk: 60 },
  { id: 's2', name: '2 зміна', start: '14:30', end: '22:30', brk: 60 },
  { id: 's3', name: 'Перша подовжена', start: '06:30', end: '17:00', brk: 60 },
  { id: 's4', name: 'Середня', start: '08:00', end: '17:00', brk: 60 },
];

export const DEFAULT_DOWN = [
  'Немає матеріалу',
  'Поломка обладнання',
  'Відключення світла',
  'Переналагодження',
  'Очікування завдання',
  'Інше',
];

export const DEFAULT_OTHER = [
  'Прибирання',
  'Налагодження обладнання',
  'Допомога на іншій ділянці',
  'Переробка браку',
  'Навчання',
  'Інвентаризація',
  'Інше',
];

export const DOWN_MINUTES = [5, 10, 15, 20, 30, 45, 60, 90, 120];
export const OTHER_MINUTES = [15, 30, 45, 60, 90, 120, 180, 240];

export const DEFAULT_SETTINGS = {
  v: 2,
  base: 420,
  goal: 100,
  shifts: DEFAULT_SHIFTS,
  products: [],
  downReasons: DEFAULT_DOWN,
  otherKinds: DEFAULT_OTHER,
  theme: 'auto',
  celebrate: true,
};

let seq = 0;
export const newKey = () =>
  Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 6);

const pos = (v) => {
  const n = parseNum(v);
  return n > 0 ? n : 0;
};
const sumBy = (arr, f) => (arr || []).reduce((s, x) => s + f(x), 0);

/** Стійкі налаштування: відсутні чи зіпсовані поля замінюються значеннями за замовчуванням. */
export function normalizeSettings(s) {
  const d = DEFAULT_SETTINGS;
  const list = (v, def) =>
    Array.isArray(v) ? [...new Set(v.map((x) => String(x || '').trim()).filter(Boolean))] : def;
  const goal = parseNum(s?.goal);
  const base = parseNum(s?.base);
  return {
    v: 2,
    base: base > 0 && base <= 1440 ? Math.round(base) : d.base,
    goal: goal >= 50 && goal <= 200 ? Math.round(goal) : d.goal,
    shifts: Array.isArray(s?.shifts)
      ? s.shifts
          .filter((x) => x && shiftLength(x.start, x.end) > 0)
          .map((x) => ({ id: x.id || newKey(), name: String(x.name || '').trim() || 'Зміна', start: x.start, end: x.end, brk: pos(x.brk) }))
      : d.shifts,
    products: Array.isArray(s?.products)
      ? s.products.filter((p) => p && pos(p.norm) > 0).map((p) => ({ id: p.id || newKey(), name: String(p.name || '').trim(), norm: pos(p.norm) }))
      : [],
    downReasons: list(s?.downReasons, d.downReasons),
    otherKinds: list(s?.otherKinds, d.otherKinds),
    theme: ['light', 'dark'].includes(s?.theme) ? s.theme : 'auto',
    celebrate: s?.celebrate !== false,
  };
}

// ---------- Один день ----------

/**
 * day: {start, end, brk, products:[{name,norm,qty}], downtime:[{reason,min}], others:[{kind,min}]}
 */
export function computeDay(day, base = 420) {
  const shiftMin = shiftLength(day.start, day.end);
  const brk = pos(day.brk);
  const workMin = shiftMin - brk;
  const downMin = sumBy(day.downtime, (d) => pos(d.min));
  const otherMin = sumBy(day.others, (o) => pos(o.min));
  const avail = workMin - downMin;
  const valid = shiftMin > 0 && workMin > 0 && avail > 0 && base > 0;
  // час, що лишився на вироби після інших робіт
  const prodTime = valid ? Math.max(0, avail - otherMin) : 0;
  let prodEarned = 0;
  let pieces = 0;
  const lines = (day.products || []).map((p) => {
    const norm = pos(p.norm);
    const qty = pos(p.qty);
    const minutes = norm > 0 ? (qty * base) / norm : 0;
    const dayNorm = norm > 0 ? (norm * prodTime) / base : 0;
    prodEarned += minutes;
    pieces += norm > 0 ? qty : 0;
    return { name: String(p.name || ''), norm, qty, minutes, dayNorm, pct: dayNorm > 0 ? (qty / dayNorm) * 100 : 0 };
  });
  const earned = valid ? prodEarned + otherMin : 0;
  const pct = valid ? (earned / avail) * 100 : 0;
  const active = lines.filter((l) => l.norm > 0);
  let error = null;
  if (!shiftMin) error = 'shift';
  else if (workMin <= 0) error = 'break';
  else if (avail <= 0) error = 'downtime';
  else if (otherMin > avail) error = 'other';
  return {
    shiftMin,
    brk,
    workMin,
    downMin,
    otherMin,
    avail,
    valid,
    prodTime,
    prodEarned,
    earned,
    pieces,
    pct,
    lines,
    active,
    error,
    hasInput: active.some((l) => l.qty > 0) || otherMin > 0,
  };
}

/** Скільки ще треба до мети: нормо-хвилини і (для одного виробу) штуки. */
export function toGoal(res, goal, base = 420) {
  if (!res.valid) return { minutes: 0, pieces: null };
  const minutes = Math.max(0, (res.avail * goal) / 100 - res.earned);
  const single = res.active.length === 1 ? res.active[0] : null;
  return { minutes, pieces: single ? (minutes * single.norm) / base : null, single };
}

/**
 * Темп усередині зміни за годинником: скільки мало бути зароблено зараз
 * і який відсоток вийде на кінець зміни, якщо триматися того ж темпу.
 */
export function paceAt(day, res, now = new Date()) {
  if (!res.valid || !day.date) return null;
  const startMin = toMinutes(day.start);
  if (!Number.isFinite(startMin)) return null;
  const start = fromISO(day.date);
  start.setHours(0, startMin, 0, 0);
  const elapsed = (now - start) / 60000;
  if (elapsed < 0) return { state: 'before', inMin: -elapsed };
  if (elapsed >= res.shiftMin) return { state: 'after' };
  const frac = elapsed / res.shiftMin;
  const expected = frac * res.avail;
  const single = res.active.length === 1 && res.otherMin === 0 ? res.active[0] : null;
  return {
    state: 'live',
    frac,
    elapsed,
    left: res.shiftMin - elapsed,
    expected,
    pace: frac >= 0.05 && expected > 0 ? (res.earned / expected) * 100 : null,
    expectedPieces: single ? single.dayNorm * frac : null,
    diffPieces: single ? single.qty - single.dayNorm * frac : null,
  };
}

/** Рівень для кольору: відносно особистої мети. */
export function level(pct, goal = 100) {
  if (pct >= goal + 15 - 0.05) return 'great';
  if (pct >= goal - 0.05) return 'good';
  if (pct >= goal * 0.8) return 'warn';
  return 'bad';
}

// ---------- Записи (збережені дні) ----------

/** Нормалізований запис дня з чернетки (рядки зберігаються як числа). */
export function toRecord(draft, base) {
  return {
    date: draft.date,
    shiftName: String(draft.shiftName || '').trim(),
    start: draft.start,
    end: draft.end,
    brk: pos(draft.brk),
    base,
    products: (draft.products || [])
      .filter((p) => pos(p.norm) > 0)
      .map((p) => ({ name: String(p.name || '').trim(), norm: pos(p.norm), qty: pos(p.qty) })),
    downtime: (draft.downtime || []).filter((d) => pos(d.min) > 0).map((d) => ({ reason: d.reason || 'Інше', min: pos(d.min) })),
    others: (draft.others || []).filter((o) => pos(o.min) > 0).map((o) => ({ kind: o.kind || 'Інше', min: pos(o.min) })),
  };
}

const core = (r) =>
  r && JSON.stringify([r.date, r.shiftName, r.start, r.end, r.brk, r.base, r.products, r.downtime, r.others]);

export const sameRecord = (a, b) => core(a) === core(b);

/** Порожня чернетка: нічого не введено (норми без кількості не рахуються). */
export const isBlank = (draft) =>
  !(draft.products || []).some((p) => pos(p.qty) > 0) && !(draft.downtime || []).length && !(draft.others || []).length;

export function recordsIn(days, from, to) {
  return Object.values(days)
    .filter((r) => r && r.date >= from && r.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Поточна серія: скільки останніх збережених днів поспіль із нормою (вихідні серію не рвуть). */
export function streak(days, goal) {
  const list = Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
  let cur = 0;
  let best = 0;
  for (const r of list) {
    const c = computeDay(r, r.base || 420);
    if (!c.valid) continue;
    if (c.pct >= goal - 0.05) best = Math.max(best, ++cur);
    else cur = 0;
  }
  return { cur, best };
}

export function bestDay(days) {
  let best = null;
  for (const r of Object.values(days)) {
    const c = computeDay(r, r.base || 420);
    if (c.valid && (!best || c.pct > best.pct)) best = { date: r.date, pct: c.pct };
  }
  return best;
}

const add = (map, key, v) => map.set(key, (map.get(key) || 0) + v);
const sortedMap = (map) => [...map.entries()].map(([name, min]) => ({ name, min })).sort((a, b) => b.min - a.min);

/** Зведення за набором днів: середнє зважене за доступним часом. */
export function summarize(records, goal = 100) {
  let earned = 0;
  let avail = 0;
  let workMin = 0;
  let downMin = 0;
  let otherMin = 0;
  let pieces = 0;
  let goalDays = 0;
  let run = 0;
  let maxRun = 0;
  let best = null;
  let worst = null;
  const down = new Map();
  const other = new Map();
  const prod = new Map();
  const wd = Array.from({ length: 7 }, () => ({ earned: 0, avail: 0, n: 0 }));
  const days = [];
  for (const r of [...records].sort((a, b) => a.date.localeCompare(b.date))) {
    const c = computeDay(r, r.base || 420);
    if (!c.valid) continue;
    days.push({ date: r.date, pct: c.pct, pieces: c.pieces, rec: r, c });
    earned += c.earned;
    avail += c.avail;
    workMin += c.workMin;
    downMin += c.downMin;
    otherMin += c.otherMin;
    pieces += c.pieces;
    if (c.pct >= goal - 0.05) {
      goalDays++;
      maxRun = Math.max(maxRun, ++run);
    } else run = 0;
    if (!best || c.pct > best.pct) best = { date: r.date, pct: c.pct };
    if (!worst || c.pct < worst.pct) worst = { date: r.date, pct: c.pct };
    for (const d of r.downtime || []) add(down, d.reason || 'Інше', pos(d.min));
    for (const o of r.others || []) add(other, o.kind || 'Інше', pos(o.min));
    for (const p of r.products || []) {
      const name = p.name || 'Без назви';
      const e = prod.get(name) || { name, qty: 0, dates: new Set() };
      e.qty += pos(p.qty);
      e.dates.add(r.date);
      prod.set(name, e);
    }
    const w = (fromISO(r.date).getDay() + 6) % 7;
    wd[w].earned += c.earned;
    wd[w].avail += c.avail;
    wd[w].n++;
  }
  return {
    n: days.length,
    days,
    earned,
    avail,
    pct: avail > 0 ? (earned / avail) * 100 : 0,
    workMin,
    downMin,
    otherMin,
    prodMin: Math.max(0, avail - otherMin),
    pieces,
    goalDays,
    maxRun,
    best,
    worst,
    down: sortedMap(down),
    other: sortedMap(other),
    products: [...prod.values()].map((e) => ({ name: e.name, qty: e.qty, days: e.dates.size })).sort((a, b) => b.qty - a.qty),
    weekdays: wd.map((x, i) => ({ i, n: x.n, pct: x.avail > 0 ? (x.earned / x.avail) * 100 : null })),
  };
}

// ---------- Періоди ----------

const MONTHS_GEN = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
const MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
const MONTHS_LOC = ['січні', 'лютому', 'березні', 'квітні', 'травні', 'червні', 'липні', 'серпні', 'вересні', 'жовтні', 'листопаді', 'грудні'];
export const MONTHS_SHORT = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
export const WEEKDAYS_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд'];
const WEEKDAYS_ACC = ['понеділок', 'вівторок', 'середу', 'четвер', 'пʼятницю', 'суботу', 'неділю'];

export function periodOf(mode, anchor) {
  const d = fromISO(anchor);
  if (mode === 'week') {
    const r = weekRange(anchor);
    const a = fromISO(r.from);
    const b = fromISO(r.to);
    const label =
      a.getMonth() === b.getMonth()
        ? `${a.getDate()}–${b.getDate()} ${MONTHS_GEN[b.getMonth()]}`
        : `${a.getDate()} ${MONTHS_GEN[a.getMonth()].slice(0, 3)} – ${b.getDate()} ${MONTHS_GEN[b.getMonth()].slice(0, 3)}`;
    return { ...r, label, prevLabel: 'минулого тижня' };
  }
  if (mode === 'year') {
    const y = d.getFullYear();
    return { from: `${y}-01-01`, to: `${y}-12-31`, label: String(y), prevLabel: `${y - 1} року` };
  }
  const r = monthRange(anchor);
  const pm = (d.getMonth() + 11) % 12;
  return { ...r, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, prevLabel: `у ${MONTHS_LOC[pm]}` };
}

export function moveAnchor(mode, anchor, dir) {
  const d = fromISO(anchor);
  if (mode === 'week') return addDays(anchor, 7 * dir);
  if (mode === 'year') return `${d.getFullYear() + dir}-01-01`;
  return toISO(new Date(d.getFullYear(), d.getMonth() + dir, 1));
}

export const fmtShortDate = (iso) => {
  const d = fromISO(iso);
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
};

// ---------- Підказки ----------

/** Кілька коротких фактів про період. */
export function insights(cur, prev, goal, period) {
  const out = [];
  if (prev && prev.n >= 2 && cur.n >= 2) {
    const d = cur.pct - prev.pct;
    if (Math.abs(d) >= 0.5)
      out.push({ icon: d > 0 ? 'up' : 'down', tone: d > 0 ? 'good' : 'bad', text: `Середнє ${d > 0 ? 'вище' : 'нижче'} на ${fmt(Math.abs(d), 1)}%, ніж ${period.prevLabel}` });
    else out.push({ icon: 'up', tone: 'muted', text: `Середнє майже як ${period.prevLabel}` });
  }
  const wd = cur.weekdays.filter((w) => w.n >= 2 && w.pct != null);
  if (wd.length >= 3) {
    const b = wd.reduce((a, x) => (x.pct > a.pct ? x : a));
    out.push({ icon: 'calendar', text: `Найкраще виходить у ${WEEKDAYS_ACC[b.i]}: у середньому ${fmt(b.pct, 1)}%` });
  }
  if (cur.maxRun >= 2) out.push({ icon: 'flame', tone: 'good', text: `Найдовша серія з нормою — ${cur.maxRun} ${plural(cur.maxRun, ['день', 'дні', 'днів'])} поспіль` });
  if (cur.down.length) {
    const t = cur.down[0];
    out.push({ icon: 'pause', tone: 'warn', text: `Найбільше простою через «${t.name}» — ${fmtMin(t.min)}` });
  }
  if (cur.otherMin > 0 && cur.workMin > 0)
    out.push({ icon: 'wrench', text: `Інші роботи — ${fmtMin(cur.otherMin)}, це ${fmt((cur.otherMin / cur.workMin) * 100, 0)}% робочого часу` });
  if (cur.best && cur.n >= 3) out.push({ icon: 'trophy', tone: 'good', text: `Найкращий день — ${fmtShortDate(cur.best.date)}: ${fmt(cur.best.pct, 1)}%` });
  if (cur.n >= 3 && cur.goalDays === cur.n) out.push({ icon: 'sparkle', tone: 'good', text: `Мету ${goal}% виконано в усі дні періоду` });
  return out.slice(0, 5);
}

// ---------- Приклад даних ----------

/** Детермінований приклад історії, щоб одразу побачити статистику. Справжні дні не чіпає. */
export function makeSample(settings, days, todayISO, count = 45) {
  let seed = 7919;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const products = [
    ...settings.products,
    { name: 'Корпус К-12', norm: 35 },
    { name: 'Кришка', norm: 48 },
    { name: 'Панель бокова', norm: 20 },
  ]
    .filter((p, i, a) => a.findIndex((x) => x.name === p.name) === i)
    .slice(0, 3);
  const shifts = settings.shifts.length ? settings.shifts : DEFAULT_SHIFTS;
  const reasons = settings.downReasons.filter((r) => r !== 'Інше');
  const kinds = settings.otherKinds.filter((k) => k !== 'Інше');
  const out = {};
  let made = 0;
  for (let i = 1; made < count && i < count * 2; i++) {
    const date = addDays(todayISO, -i);
    const wd = fromISO(date).getDay();
    if (wd === 0 || wd === 6 || days[date]) continue;
    made++;
    const week = Math.floor(i / 7);
    const shift = rnd() < 0.12 ? pick(shifts.slice(2).length ? shifts.slice(2) : shifts) : shifts[week % Math.min(2, shifts.length)];
    const downtime = rnd() < 0.28 ? [{ reason: pick(reasons.length ? reasons : ['Інше']), min: pick([10, 15, 20, 30, 45, 60]) }] : [];
    const others = rnd() < 0.2 ? [{ kind: pick(kinds.length ? kinds : ['Інше']), min: pick([30, 60, 90, 120]) }] : [];
    const work = shiftLength(shift.start, shift.end) - shift.brk - downtime.reduce((s, d) => s + d.min, 0);
    const prodTime = Math.max(0, work - others.reduce((s, o) => s + o.min, 0));
    const two = rnd() < 0.25;
    const list = two ? [products[week % 3], products[(week + 1) % 3]] : [products[(week + 1) % 3]];
    const trend = 0.93 + (count - made) * 0.0025; // поступово краще ближче до сьогодні
    const r = {
      date,
      shiftName: shift.name,
      start: shift.start,
      end: shift.end,
      brk: shift.brk,
      base: settings.base,
      products: list.map((p) => ({
        name: p.name,
        norm: p.norm,
        qty: Math.max(0, Math.round(((p.norm * prodTime) / settings.base) * (two ? 0.5 : 1) * (trend + (rnd() - 0.45) * 0.22))),
      })),
      downtime,
      others,
      savedAt: 0,
      sample: true,
    };
    out[date] = r;
  }
  return out;
}

// ---------- Дрібне ----------

export const minutesLabel = (m) => (m % 60 === 0 && m >= 60 ? `${m / 60} год` : m > 60 ? `${fmt(m / 60, 1)} год` : `${m} хв`);

export { pad, toISO, fromISO };
