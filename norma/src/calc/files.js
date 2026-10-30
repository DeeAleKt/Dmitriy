// Файли: Excel з історією, резервна копія і відновлення. Без мережі — лише збереження на пристрій.
import { buildXlsx, excelDate, STYLE } from '../xlsx.js';
import { store, today } from '../util.js';
import { computeDay, isApprox, MONTHS_SHORT, normalizeSettings, oddDay, summarize } from './model.js';

const WD = ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const r1 = (n) => Math.round(n * 10) / 10;

/** Зберегти файл: у claude.ai — через вікно підтвердження, деінде — звичайне завантаження. */
export async function saveFile(filename, data, type) {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const downloads = window.claude?.use ? await window.claude.use('downloads').catch(() => null) : null;
  if (downloads) {
    try {
      await downloads.save({ filename, data: blob });
      return 'saved';
    } catch (e) {
      if (e?.code === 'declined') return 'declined';
      throw new Error('Не вдалося зберегти файл');
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  return 'saved';
}

export async function exportExcel(records, period, goal = 100) {
  const recs = [...records].sort((a, b) => a.date.localeCompare(b.date));
  if (!recs.length) throw new Error('Немає днів для експорту');
  const days = [
    ['Дата', 'День', 'Зміна', 'Вхід', 'Вихід', 'Перерва, хв', 'Робочий час, хв', 'Простій, хв', 'Причини простою', 'Інші роботи, хв', 'Що робили', 'Вироби', 'Виробів, шт', 'Нормо-час, хв', 'Виконання, %'],
  ];
  const items = [['Дата', 'Виріб', 'Норма за зміну, шт', 'Норма на день, шт', 'Зроблено, шт', 'Нормо-час, хв']];
  for (const r of recs) {
    const c = computeDay(r, r.base || 420);
    const [y, m, d] = r.date.split('-').map(Number);
    days.push([
      { v: excelDate(r.date), s: STYLE.date },
      WD[new Date(y, m - 1, d).getDay()],
      r.shiftName || '',
      r.start,
      r.end,
      r.brk,
      c.avail,
      c.downMin,
      r.downtime.map((x) => `${x.reason} ${x.min}`).join('; '),
      c.otherMin,
      r.others.map((x) => `${x.kind} ${x.min}`).join('; '),
      r.products.map((p) => `${p.name || 'Виріб'} × ${p.qty}`).join('; '),
      c.pieces,
      r1(c.earned),
      { v: r1(c.pct), s: STYLE.decimal },
    ]);
    c.lines.forEach((l) =>
      items.push([{ v: excelDate(r.date), s: STYLE.date }, `${l.name || 'Виріб'}${l.approx ? ' (норма приблизна)' : ''}`, l.norm, r1(l.dayNorm), l.qty, r1(l.minutes)]),
    );
  }
  const months = [['Місяць', 'Днів', 'З нормою', 'Середнє, %', 'Виробів, шт', 'Простій, хв', 'Інші роботи, хв']];
  const byMonth = new Map();
  for (const r of recs) {
    const k = r.date.slice(0, 7);
    if (!byMonth.has(k)) byMonth.set(k, []);
    byMonth.get(k).push(r);
  }
  for (const [k, list] of byMonth) {
    const s = summarize(list, goal);
    const [y, m] = k.split('-').map(Number);
    months.push([`${MONTHS_SHORT[m - 1]} ${y}`, s.n, s.goalDays, { v: r1(s.pct), s: STYLE.decimal }, s.pieces, s.downMin, s.otherMin]);
  }
  if (byMonth.size > 1) {
    const s = summarize(recs, goal);
    months.push([{ v: 'Разом', s: STYLE.bold }, { v: s.n, s: STYLE.bold }, { v: s.goalDays, s: STYLE.bold }, { v: r1(s.pct), s: STYLE.boldDecimal }, { v: s.pieces, s: STYLE.bold }, { v: s.downMin, s: STYLE.bold }, { v: s.otherMin, s: STYLE.bold }]);
  }
  const bytes = buildXlsx([
    { name: 'Дні', widths: [11, 5, 16, 8, 8, 9, 11, 9, 28, 11, 28, 36, 10, 11, 11], rows: days },
    { name: 'Вироби', widths: [11, 28, 14, 14, 12, 12], rows: items },
    { name: 'По місяцях', widths: [12, 7, 10, 11, 12, 11, 14], rows: months },
  ]);
  const name = period ? `norma_${period.from}_${period.to}.xlsx` : `norma_${recs[0].date}_${recs[recs.length - 1].date}.xlsx`;
  return saveFile(name, new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
}

export const BACKUP_KEY = 'norma.v2.backup-at';

export async function backup(settings, days) {
  const data = JSON.stringify({ app: 'norma-calc', v: 2, exportedAt: new Date().toISOString(), settings, days }, null, 1);
  const r = await saveFile(`norma-kopiya-${today()}.json`, data, 'application/json');
  if (r === 'saved') store(BACKUP_KEY, Date.now());
  return r;
}

/** Розбір файлу резервної копії. Повертає { settings, days } або кидає зрозумілу помилку. */
export async function readBackup(file) {
  if (!file) throw new Error('Файл не обрано');
  if (file.size > 5 * 1024 * 1024) throw new Error('Файл завеликий для резервної копії');
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error('Це не файл резервної копії (не JSON)');
  }
  if (data?.app !== 'norma-calc' || typeof data.days !== 'object' || !data.days) throw new Error('Це не резервна копія калькулятора «Норма»');
  const days = {};
  for (const [k, r] of Object.entries(data.days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !r || !Array.isArray(r.products) || !Array.isArray(r.downtime) || !Array.isArray(r.others)) continue;
    days[k] = { ...r, date: k };
  }
  return { settings: normalizeSettings(data.settings), days };
}

/** Звіт адміністратора за місяць: підсумок по кожному працівнику і всі дні команди. */
export async function exportTeam(rows, month) {
  const people = [
    ['Працівник', 'Пошта', 'Днів', 'З нормою', 'Середнє, %', 'Мета на місяць, %', 'Виробів, шт', 'Простій, хв', 'Інші роботи, хв', 'Минулий місяць, %', 'Зміна, %', 'Підозрілі дні', 'Дні з приблизною нормою', 'Доступ'],
  ];
  const days = [
    ['Працівник', 'Дата', 'День', 'Зміна', 'Вхід', 'Вихід', 'Перерва, хв', 'Робочий час, хв', 'Простій, хв', 'Інші роботи, хв', 'Вироби', 'Виробів, шт', 'Нормо-час, хв', 'Виконання, %', 'Примітка'],
  ];
  const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name, 'uk'));
  for (const r of sorted) {
    const num = (v) => (v == null ? '' : { v: r1(v), s: STYLE.decimal });
    people.push([r.name, r.email, r.n, r.goalDays, num(r.pct), r.goal, r.pieces, r.downMin, r.otherMin, num(r.prevPct), num(r.delta), r.odd, r.approx, r.blocked ? 'закрито' : 'так']);
    for (const rec of [...r.recs].sort((a, b) => a.date.localeCompare(b.date))) {
      const c = computeDay(rec, rec.base || 420);
      const [y, m, d] = rec.date.split('-').map(Number);
      const note = [oddDay(c) ? 'неправдоподібний відсоток' : '', isApprox(rec) ? 'приблизна норма' : ''].filter(Boolean).join('; ');
      days.push([
        r.name,
        { v: excelDate(rec.date), s: STYLE.date },
        WD[new Date(y, m - 1, d).getDay()],
        rec.shiftName || '',
        rec.start,
        rec.end,
        rec.brk,
        c.avail,
        c.downMin,
        c.otherMin,
        rec.products.map((p) => `${p.name || 'Виріб'} × ${p.qty}`).join('; '),
        c.pieces,
        r1(c.earned),
        { v: r1(c.pct), s: STYLE.decimal },
        note,
      ]);
    }
  }
  const bytes = buildXlsx([
    { name: 'Команда', widths: [24, 26, 7, 10, 11, 12, 11, 11, 13, 14, 9, 11, 12, 9], rows: people },
    { name: 'Дні', widths: [24, 11, 5, 16, 7, 7, 10, 12, 10, 13, 36, 10, 11, 11, 24], rows: days },
  ]);
  return saveFile(`norma_komanda_${month}.xlsx`, new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
}
