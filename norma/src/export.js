import { computeDay, summarize } from './calc.js';
import { buildXlsx, excelDate, STYLE } from './xlsx.js';

const r1 = (n) => Math.round(n * 10) / 10;
const dec = (n) => ({ v: r1(n), s: STYLE.decimal });
const date = (iso) => ({ v: excelDate(iso), s: STYLE.date });

export function exportXlsx({ entries, range, nameOf }) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date) || nameOf(a.email).localeCompare(nameOf(b.email), 'uk'));

  const days = [
    ['Дата', 'Працівник', 'Email', 'Зміна', 'Початок', 'Кінець', 'Вироби', 'Зроблено, шт', 'Тривалість зміни, хв', 'Перерва, хв', 'Простій, хв',
      'Причина простою', 'Робочий час, хв', 'Нормо-час, хв', 'Виконання, %', 'Примітка'],
  ];
  const items = [
    ['Дата', 'Працівник', 'Виріб', 'Код', 'Норма, шт/зміну', 'Норма на день, шт', 'Зроблено, шт', 'Виконання по виробу, %'],
  ];
  for (const e of sorted) {
    const r = computeDay(e);
    const name = nameOf(e.email, e.name);
    days.push([
      date(e.date), name, e.email, e.shiftName || '', e.start || '', e.end || '',
      e.items.map((i) => `${i.name} × ${i.qty}`).join('; '),
      r.pieces, e.shift, e.brk, e.downtime, e.reason || '', r.available, r1(r.earned), dec(r.percent), e.comment || '',
    ]);
    r.lines.forEach((l) => {
      items.push([date(e.date), name, l.name, l.code || '', l.norm, r1(l.dayNorm), l.qty, dec(l.percent)]);
    });
  }

  const byEmail = new Map();
  for (const e of sorted) {
    if (!byEmail.has(e.email)) byEmail.set(e.email, []);
    byEmail.get(e.email).push(e);
  }
  const summary = [
    ['Працівник', 'Email', 'Днів', 'Днів з нормою ≥100%', 'Робочий час, год', 'Нормо-час, год', 'Простій, хв',
      'Середнє виконання, %', 'Мінімум, %', 'Максимум, %'],
  ];
  const rows = [...byEmail.entries()]
    .map(([email, list]) => ({ email, name: nameOf(email, list[0].name), s: summarize(list) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'uk'));
  for (const { email, name, s } of rows) {
    summary.push([name, email, s.days, s.reached, r1(s.available / 60), r1(s.earned / 60), s.downtime,
      dec(s.percent), dec(s.min), dec(s.max)]);
  }
  if (rows.length > 1) {
    const t = summarize(sorted);
    summary.push([
      { v: 'Разом', s: STYLE.bold }, '', { v: t.days, s: STYLE.bold }, { v: t.reached, s: STYLE.bold },
      { v: r1(t.available / 60), s: STYLE.bold }, { v: r1(t.earned / 60), s: STYLE.bold },
      { v: t.downtime, s: STYLE.bold }, { v: r1(t.percent), s: STYLE.boldDecimal },
    ]);
  }

  const bytes = buildXlsx([
    { name: 'Підсумок', widths: [28, 28, 8, 12, 12, 12, 12, 14, 11, 11], rows: summary },
    { name: 'По днях', widths: [11, 26, 26, 16, 9, 9, 40, 11, 12, 10, 10, 24, 12, 12, 12, 30], rows: days },
    { name: 'Вироби', widths: [11, 26, 32, 12, 12, 14, 12, 14], rows: items },
  ]);
  const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `norma_${range.from}_${range.to}.xlsx`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}
