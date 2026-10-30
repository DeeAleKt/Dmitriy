export const pad = (n) => String(n).padStart(2, '0');

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function fromISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const today = () => toISO(new Date());

export function addDays(iso, n) {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export const monthOf = (iso) => iso.slice(0, 7);

export function monthsBetween(from, to) {
  const out = [];
  let [y, m] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  while ((y < ty || (y === ty && m <= tm)) && out.length < 36) {
    out.push(`${y}-${pad(m)}`);
    if (++m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

export function weekRange(iso) {
  const d = fromISO(iso);
  const shift = (d.getDay() + 6) % 7; // понеділок = 0
  const from = addDays(iso, -shift);
  return { from, to: addDays(from, 6) };
}

export function monthRange(iso) {
  const d = fromISO(iso);
  return {
    from: toISO(new Date(d.getFullYear(), d.getMonth(), 1)),
    to: toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
  };
}

const nf = {};
export function fmt(n, digits = 1) {
  if (!Number.isFinite(n)) return '—';
  nf[digits] ??= new Intl.NumberFormat('uk-UA', { maximumFractionDigits: digits });
  return nf[digits].format(Math.abs(n) < 1e-9 ? 0 : n);
}

export const fmtPct = (p) => `${fmt(p, 1)}%`;

export function fmtMin(min) {
  min = Math.round(min);
  if (min <= 0) return '0 хв';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} хв`;
  return m ? `${h} год ${m} хв` : `${h} год`;
}

/** 390 → «6:30» */
export function fmtHM(min) {
  min = Math.max(0, Math.round(min));
  return `${Math.floor(min / 60)}:${pad(min % 60)}`;
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const dfShort = new Intl.DateTimeFormat('uk-UA', { weekday: 'short', day: 'numeric', month: 'short' });
const dfDay = new Intl.DateTimeFormat('uk-UA', { weekday: 'short', day: 'numeric', month: 'long' });
const dfLong = new Intl.DateTimeFormat('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
const dfNum = new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
const dfMonth = new Intl.DateTimeFormat('uk-UA', { month: 'long', year: 'numeric' });

export const fmtDate = (iso) => cap(dfShort.format(fromISO(iso)));
export const fmtDay = (iso) => cap(dfDay.format(fromISO(iso)));
export const fmtDateLong = (iso) => cap(dfLong.format(fromISO(iso)));
export const fmtDateNum = (iso) => dfNum.format(fromISO(iso));
export const fmtMonth = (iso) => cap(dfMonth.format(fromISO(iso)));

export function plural(n, [one, few, many]) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}

export const collator = new Intl.Collator('uk', { sensitivity: 'base', numeric: true });

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

export const normEmail = (e) => String(e || '').trim().toLowerCase();

export const isEmail = (e) => /^[^@\s/]+@[^@\s/]+\.[^@\s/]+$/.test(e);

export function store(key, value) {
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return undefined;
  }
}
