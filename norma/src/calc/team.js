// Команда для адміністратора: підсумки кожного працівника за місяць і всієї команди. Чисті функції.
import { computeDay, isApprox, monthGoalOf, normalizeSettings, oddDay, summarize, trendOf } from './model.js';

/**
 * Рядок працівника за місяць.
 * member: { uid, name, email, blocked, lastSeen, days (дні місяця), prevDays, settings }
 */
export function teamRow(member, month, todayISO) {
  const settings = normalizeSettings(member.settings);
  const recs = Object.values(member.days || {}).filter((r) => r.date?.startsWith(month) && !r.sample);
  const s = summarize(recs, 100);
  const prev = summarize(Object.values(member.prevDays || {}).filter((r) => !r.sample), 100);
  const t = member.days?.[todayISO];
  const tc = t && !t.sample ? computeDay(t, t.base || 420) : null;
  const last = recs.reduce((m, r) => Math.max(m, r.savedAt || 0), 0);
  return {
    uid: member.uid,
    name: member.name,
    email: member.email,
    blocked: !!member.blocked,
    n: s.n,
    pct: s.n ? s.pct : null,
    earned: s.earned,
    avail: s.avail,
    goalDays: s.goalDays,
    pieces: s.pieces,
    downMin: s.downMin,
    otherMin: s.otherMin,
    prevPct: prev.n ? prev.pct : null,
    delta: s.n && prev.n ? s.pct - prev.pct : null,
    trend: trendOf(s.days),
    goal: monthGoalOf(settings, month),
    today: tc?.valid && tc.hasInput ? { pct: tc.pct, odd: !!oddDay(tc), approx: isApprox(t) } : null,
    odd: s.odd.length,
    approx: s.approxDays,
    lastActive: Math.max(last, member.lastSeen || 0) || null,
    recs,
  };
}

/** Підсумок команди: середнє зважене за робочим часом (як і в кожного працівника). */
export function teamSummary(rows) {
  const active = rows.filter((r) => r.n > 0);
  const earned = active.reduce((a, r) => a + r.earned, 0);
  const avail = active.reduce((a, r) => a + r.avail, 0);
  return {
    people: rows.length,
    active: active.length,
    pct: avail > 0 ? (earned / avail) * 100 : null,
    atNorm: active.filter((r) => r.pct >= 99.95).length,
    today: rows.filter((r) => r.today).length,
    flagged: rows.filter((r) => r.odd > 0).length,
  };
}

export const FILTERS = {
  all: () => true,
  below: (r) => r.pct != null && r.pct < 99.95,
  notToday: (r) => !r.today && !r.blocked,
  flagged: (r) => r.odd > 0 || r.approx > 0,
};

export function sortRows(rows, by) {
  const list = [...rows];
  const name = (a, b) => a.name.localeCompare(b.name, 'uk');
  if (by === 'name') return list.sort(name);
  if (by === 'active') return list.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0) || name(a, b));
  // за відсотком: спершу ті, в кого є дні; найвищий угорі
  return list.sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1) || name(a, b));
}
