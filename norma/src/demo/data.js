// Демо-заміна data.js: ті самі функції, але дані — вигадані приклади в пам’яті браузера
// (localStorage, якщо доступний). Нічого нікуди не надсилається.
import { computeDay, DEFAULT_SHIFTS, shiftLength } from '../calc.js';
import { addDays, collator, fromISO, monthOf, today, toISO } from '../util.js';

const KEY = 'norma.demo.data.v1';
const clone = (x) => JSON.parse(JSON.stringify(x));

export const entryId = (date, email) => `${date}_${email}`;

// ---------- Приклади ----------

const PRODUCTS = [
  ['Стілець «Класик»', 35, 'ST-01', 'Стільці'],
  ['Стілець барний', 28, 'ST-02', 'Стільці'],
  ['Табурет', 48, 'TB-01', 'Стільці'],
  ['Стіл обідній 120×80', 12, 'TA-01', 'Столи'],
  ['Стіл журнальний', 18, 'TA-02', 'Столи'],
  ['Стіл письмовий', 10, 'TA-03', 'Столи'],
  ['Полиця настінна', 60, 'PL-01', 'Полиці'],
  ['Стелаж 5 полиць', 9, 'PL-02', 'Полиці'],
  ['Тумба приліжкова', 16, 'TU-01', 'Тумби'],
  ['Тумба під ТВ', 8, 'TU-02', 'Тумби'],
];

const PEOPLE = [
  ['vlasnyk@example.com', 'Ви (власник)', 'admin', true],
  ['serhii.bondar@example.com', 'Сергій Бондар', 'admin'],
  ['ivan.petrenko@example.com', 'Іван Петренко', 'worker'],
  ['olena.shevchuk@example.com', 'Олена Шевчук', 'worker'],
  ['andrii.melnyk@example.com', 'Андрій Мельник', 'worker'],
  ['nataliia.tkachenko@example.com', 'Наталія Ткаченко', 'worker'],
];

function seed() {
  let n = 20241;
  const rnd = () => (n = (n * 16807) % 2147483647) / 2147483647;
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

  const products = {};
  PRODUCTS.forEach(([name, norm, code, group], i) => {
    products[`p${i + 1}`] = { name, norm, code, group, archived: false };
  });
  const access = {};
  for (const [email, name, role, owner] of PEOPLE) access[email] = { name, role, active: true, ...(owner ? { owner } : {}) };

  const settings = { normShift: 480, normBrk: 60, shifts: clone(DEFAULT_SHIFTS) };
  const workers = PEOPLE.filter((p) => p[2] === 'worker');
  const skill = [1.04, 0.97, 0.9, 1.08];
  const usual = [['p1', 'p3'], ['p4', 'p5'], ['p7', 'p8'], ['p9', 'p10']];
  const entries = {};
  const t = today();
  const first = toISO(new Date(fromISO(t).getFullYear(), fromISO(t).getMonth() - 1, 1));
  for (let d = first; d < t; d = addDays(d, 1)) {
    const wd = fromISO(d).getDay();
    if (wd === 0 || wd === 6) continue;
    workers.forEach(([email, name], w) => {
      if (rnd() < 0.06) return; // вихідний / лікарняний
      const shift = rnd() < 0.15 ? pick(settings.shifts.slice(2)) : settings.shifts[(w + Math.floor(fromISO(d).getDate() / 7)) % 2];
      const downtime = rnd() < 0.25 ? pick([10, 15, 20, 30, 45, 60]) : 0;
      const available = shiftLength(shift.start, shift.end) - shift.brk - downtime;
      const two = rnd() < 0.3;
      const ids = two ? usual[w] : [usual[w][0]];
      const items = ids.map((id) => {
        const p = products[id];
        const share = two ? 0.5 : 1;
        const qty = Math.max(0, Math.round(((p.norm * available) / 420) * share * skill[w] * (0.82 + rnd() * 0.3)));
        return { productId: id, name: p.name, code: p.code, norm: p.norm, qty };
      });
      const e = {
        email,
        name,
        date: d,
        month: monthOf(d),
        items,
        shiftName: shift.name,
        start: shift.start,
        end: shift.end,
        shift: shiftLength(shift.start, shift.end),
        brk: shift.brk,
        base: 420,
        downtime,
        reason: downtime ? pick(['Немає матеріалу', 'Ремонт верстата', 'Відключення світла', 'Переналагодження']) : '',
        comment: '',
        updatedBy: email,
      };
      e.percent = Math.round(computeDay(e).percent * 10) / 10;
      entries[entryId(d, email)] = e;
    });
  }
  return { products, access, settings, entries };
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s?.products && s.access && s.settings && s.entries) return s;
  } catch {
    /* сховище недоступне */
  }
  return null;
}

let state = load() || seed();
const subs = new Set();

function commit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* працюємо лише в пам’яті */
  }
  subs.forEach((fn) => fn());
  return new Promise((r) => setTimeout(r, 120));
}

function watch(compute, cb) {
  const fn = () => setTimeout(() => subs.has(fn) && cb(compute()), 0);
  subs.add(fn);
  fn();
  return () => subs.delete(fn);
}

export function resetDemo() {
  state = seed();
  return commit();
}

export const demoPeople = () => Object.entries(state.access).map(([email, a]) => ({ email, ...a }));

// ---------- Доступ ----------

export const watchAccess = (email, cb) => watch(() => (state.access[email] ? { email, ...clone(state.access[email]) } : null), cb);

export const bootstrapOwner = () => Promise.reject(new Error('demo'));

export const watchPeople = (cb) =>
  watch(() => demoPeople().sort((a, b) => collator.compare(a.name || a.email, b.name || b.email)), cb);

export function savePerson(email, { name, role, active, owner }) {
  state.access[email] = { name: name.trim(), role, active, ...(owner ? { owner: true } : {}) };
  return commit();
}

export function deletePerson(email) {
  delete state.access[email];
  return commit();
}

// ---------- Вироби ----------

export const watchProducts = (cb) =>
  watch(
    () =>
      Object.entries(state.products)
        .map(([id, p]) => ({ id, ...p }))
        .sort((a, b) => collator.compare(a.group || '', b.group || '') || collator.compare(a.name, b.name)),
    cb,
  );

const cleanProduct = (p) => ({
  name: String(p.name).trim(),
  norm: Number(p.norm),
  code: String(p.code || '').trim(),
  group: String(p.group || '').trim(),
  archived: Boolean(p.archived),
});

const newId = () => Math.random().toString(36).slice(2, 10);

export function saveProduct(id, p) {
  state.products[id || newId()] = cleanProduct(p);
  return commit();
}

export function deleteProduct(id) {
  delete state.products[id];
  return commit();
}

export function importProducts(rows) {
  for (const r of rows) state.products[r.id || newId()] = cleanProduct(r);
  return commit();
}

// ---------- Налаштування ----------

export const watchSettings = (cb) => watch(() => clone(state.settings), cb);

export function saveSettings({ normShift, normBrk, shifts }) {
  state.settings = { normShift, normBrk, shifts: clone(shifts) };
  return commit();
}

// ---------- Журнал ----------

export const getEntry = (date, email) => {
  const e = state.entries[entryId(date, email)];
  return new Promise((r) => setTimeout(() => r(e ? { id: entryId(date, email), ...clone(e) } : null), 60));
};

export function saveEntry(e, me) {
  const items = e.items.map((it) => ({ productId: it.productId, name: it.name, code: it.code || '', norm: Number(it.norm), qty: Number(it.qty) }));
  state.entries[entryId(e.date, e.email)] = {
    email: e.email,
    name: e.name || '',
    date: e.date,
    month: monthOf(e.date),
    items,
    shiftName: e.shiftName || '',
    start: e.start,
    end: e.end,
    shift: e.shift,
    brk: e.brk,
    base: e.base,
    downtime: e.downtime,
    reason: (e.reason || '').trim(),
    comment: (e.comment || '').trim(),
    percent: Math.round(computeDay({ ...e, items }).percent * 10) / 10,
    updatedBy: me,
  };
  return commit();
}

export function deleteEntry(date, email) {
  delete state.entries[entryId(date, email)];
  return commit();
}

export const watchEntries = ({ months, email }, cb) =>
  watch(
    () =>
      Object.entries(state.entries)
        .filter(([, e]) => months.includes(e.month) && (!email || e.email === email))
        .map(([id, e]) => ({ id, ...clone(e) })),
    cb,
  );
