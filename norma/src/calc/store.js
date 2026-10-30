// Сховище калькулятора: лише localStorage цього браузера. Нічого не надсилається.
import { DEFAULT_SETTINGS, newKey, normalizeSettings, num, shiftLength } from './model.js';

const K = {
  settings: 'norma.v2.settings',
  days: 'norma.v2.days',
  draft: 'norma.v2.draft',
};

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const saveSettings = (s) => write(K.settings, s);
export const saveDays = (d) => write(K.days, d);
export const saveDraft = (d) => write(K.draft, d);

export function clearAll() {
  try {
    Object.values(K).forEach((k) => localStorage.removeItem(k));
  } catch {
    /* сховище недоступне */
  }
}

const str = (v) => (v === '' || v == null || !(num(v) > 0) ? '' : String(v).replace('.', ','));

/** Рядки чернетки з запису (числа → рядки для полів вводу) */
export function draftFromRecord(r) {
  return {
    date: r.date,
    shiftName: r.shiftName || '',
    start: r.start,
    end: r.end,
    brk: r.brk,
    products: r.products.length
      ? r.products.map((p) => ({ key: newKey(), name: p.name || '', norm: str(p.norm), qty: str(p.qty) }))
      : [{ key: newKey(), name: '', norm: '', qty: '' }],
    downtime: r.downtime.map((d) => ({ key: newKey(), reason: d.reason, min: d.min })),
    others: r.others.map((o) => ({ key: newKey(), kind: o.kind, min: o.min })),
  };
}

/**
 * Нова чернетка на дату: зміна і вироби — як в останній збережений день перед нею
 * (кількості порожні), бо зазвичай роблять те саме.
 */
export function newDraft(date, settings, days) {
  const prevDate = Object.keys(days)
    .filter((d) => d < date && !days[d].sample)
    .sort()
    .pop();
  const prev = prevDate ? days[prevDate] : null;
  const shift = settings.shifts[0] || { name: '', start: '08:00', end: '16:00', brk: 60 };
  return {
    date,
    shiftName: prev ? prev.shiftName : shift.name,
    start: prev ? prev.start : shift.start,
    end: prev ? prev.end : shift.end,
    brk: prev ? prev.brk : shift.brk,
    products: prev?.products?.length
      ? prev.products.map((p) => ({ key: newKey(), name: p.name || '', norm: str(p.norm), qty: '' }))
      : [{ key: newKey(), name: '', norm: '', qty: '' }],
    downtime: [],
    others: [],
  };
}

/** Перенесення даних першої версії калькулятора (збережені вироби, зміна, тема). */
function migrateV1(todayISO) {
  const st = read('norma.calc.state.v1', null);
  const presets = read('norma.calc.presets.v1', null);
  const theme = read('norma.calc.theme', null);
  if (!st && !presets && !theme) return null;
  const settings = { ...DEFAULT_SETTINGS };
  if (Array.isArray(presets))
    settings.products = presets
      .filter((p) => p && num(p.norm) > 0)
      .map((p) => ({ id: newKey(), name: String(p.name || '').trim(), norm: num(p.norm) }));
  if (st && num(st.base) > 0) settings.base = num(st.base);
  if (theme === 'light' || theme === 'dark') settings.theme = theme;
  let draft = null;
  if (st && shiftLength(st.start, st.end) > 0) {
    const match = settings.shifts.find((s) => s.start === st.start && s.end === st.end);
    draft = {
      date: todayISO,
      shiftName: match ? match.name : '',
      start: st.start,
      end: st.end,
      brk: num(st.brk),
      products: (Array.isArray(st.products) && st.products.length ? st.products : [{}]).map((p) => ({
        key: newKey(),
        name: String(p.name || ''),
        norm: str(p.norm),
        qty: str(p.qty),
      })),
      downtime: num(st.downtime) > 0 ? [{ key: newKey(), reason: 'Інше', min: num(st.downtime) }] : [],
      others: (Array.isArray(st.others) ? st.others : [])
        .filter((o) => num(o.minutes) > 0)
        .map((o) => ({ key: newKey(), kind: String(o.label || '').trim() || 'Інше', min: num(o.minutes) })),
    };
  }
  return { settings, draft };
}

function validDraft(d) {
  return (
    d &&
    typeof d.date === 'string' &&
    Array.isArray(d.products) &&
    Array.isArray(d.downtime) &&
    Array.isArray(d.others) &&
    typeof d.start === 'string'
  );
}

export function loadAll(todayISO) {
  let settings = read(K.settings, null);
  let draft = read(K.draft, null);
  let migrated = false;
  if (!settings) {
    const m = migrateV1(todayISO);
    if (m) {
      settings = m.settings;
      draft = draft || m.draft;
      migrated = true;
    }
  }
  settings = normalizeSettings(settings);
  let days = read(K.days, {});
  if (!days || typeof days !== 'object' || Array.isArray(days)) days = {};
  if (!validDraft(draft)) draft = newDraft(todayISO, settings, days);
  if (migrated) {
    saveSettings(settings);
    saveDraft(draft);
  }
  return { settings, days, draft };
}
