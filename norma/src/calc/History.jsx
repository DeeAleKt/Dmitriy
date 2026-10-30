import { useMemo } from 'preact/hooks';
import { fmt, fmtMin, fmtTime, fromISO, plural } from '../util.js';
import { useApp } from './ctx.js';
import { computeDay, level, summarize } from './model.js';
import { Breakdown, copyText, summaryText } from './Today.jsx';
import { ask, Empty, Icon, Sheet, toast } from './ui.jsx';

const WD = ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
const MONTHS_GEN = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
const WEEKDAYS = ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', 'пʼятниця', 'субота'];

export const longDate = (iso) => {
  const d = fromISO(iso);
  const s = `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
};

function summaryLine(r) {
  const parts = r.products.map((p) => `${p.name || 'Виріб'} × ${fmt(p.qty)}`);
  if (!parts.length && r.others.length) parts.push(`Інші роботи ${fmtMin(r.others.reduce((s, o) => s + o.min, 0))}`);
  return parts.join(', ') || 'Без виробів';
}

export function History() {
  const { days, settings, openDay, openSettings, go } = useApp();
  const goal = settings.goal;
  const groups = useMemo(() => {
    const list = Object.values(days).sort((a, b) => b.date.localeCompare(a.date));
    const map = new Map();
    for (const r of list) {
      const k = r.date.slice(0, 7);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(r);
    }
    return [...map.entries()].map(([k, items]) => ({ k, items, s: summarize(items, goal) }));
  }, [days, goal]);

  return (
    <div class="screen">
      <header class="topbar">
        <h1 class="title">Історія</h1>
        <button class="round-btn" onClick={openSettings} aria-label="Налаштування">
          <Icon name="sliders" />
        </button>
      </header>
      {!groups.length && (
        <section class="card">
          <Empty
            icon="history"
            title="Поки що жодного дня"
            action={
              <button class="btn soft" onClick={() => go('today')}>
                <Icon name="gauge" size={18} /> До розрахунку
              </button>
            }
          >
            Щойно внесете зроблене на вкладці «Сьогодні», день зʼявиться тут — зберігати вручну не треба. Будь-який день можна відкрити, перевірити розрахунок і виправити.
          </Empty>
        </section>
      )}
      {groups.map((g) => {
        const [y, m] = g.k.split('-').map(Number);
        const lv = level(g.s.pct, goal);
        return (
          <section class="hgroup" key={g.k}>
            <div class="hgroup-head">
              <h2>
                {MONTHS[m - 1]} {y}
              </h2>
              <span>
                {g.s.n} {plural(g.s.n, ['день', 'дні', 'днів'])} ·{' '}
                <b class={`lv-text ${lv}`}>{fmt(g.s.pct, 1)}%</b>
              </span>
            </div>
            <div class="card flush">
              {g.items.map((r) => {
                const c = computeDay(r, r.base || 420);
                const d = fromISO(r.date);
                const l = c.valid ? level(c.pct, goal) : 'idle';
                return (
                  <button class="hrow" key={r.date} onClick={() => openDay(r.date)}>
                    <span class="hdate">
                      <b>{d.getDate()}</b>
                      <small>{WD[d.getDay()]}</small>
                    </span>
                    <span class="hmain">
                      <span class="htitle">
                        <span class="htitle-text">{r.shiftName || `${fmtTime(r.start)}–${fmtTime(r.end)}`}</span>
                        {r.sample && <em class="tag-sample">приклад</em>}
                      </span>
                      <span class="hsub">{summaryLine(r)}</span>
                      {(c.downMin > 0 || c.otherMin > 0) && (
                        <span class="htags">
                          {c.downMin > 0 && (
                            <span class="htag down">
                              <Icon name="pause" size={12} /> {fmtMin(c.downMin)}
                            </span>
                          )}
                          {c.otherMin > 0 && (
                            <span class="htag other">
                              <Icon name="wrench" size={12} /> {fmtMin(c.otherMin)}
                            </span>
                          )}
                        </span>
                      )}
                    </span>
                    <span class={`pill lv-${l}`}>{c.valid ? `${fmt(c.pct, 1)}%` : '—'}</span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function DaySheet({ date, onClose }) {
  const { days, settings, setDays, editDay } = useApp();
  const r = days[date];
  if (!r) return null;
  const res = computeDay(r, r.base || 420);
  const goal = settings.goal;
  const lv = res.valid ? level(res.pct, goal) : 'idle';
  const diff = res.pct - goal;
  async function remove() {
    const ok = await ask({ title: 'Видалити цей день?', text: `${longDate(date)} зникне з історії та статистики.`, ok: 'Видалити', danger: true });
    if (!ok) return;
    setDays((d) => {
      const n = { ...d };
      delete n[date];
      return n;
    });
    onClose();
    toast('День видалено');
  }
  return (
    <Sheet
      title={longDate(date)}
      sub={`${r.shiftName || 'Свій час'} · ${fmtTime(r.start)}–${fmtTime(r.end)}${r.sample ? ' · приклад' : ''}`}
      onClose={onClose}
      tall
      footer={
        <div class="row">
          <button class="btn ghost danger-text sq" onClick={remove} aria-label="Видалити день">
            <Icon name="trash" />
          </button>
          <button
            class="btn primary grow"
            onClick={() => {
              onClose();
              editDay(date);
            }}
          >
            <Icon name="pencil" size={18} /> Відкрити в розрахунку
          </button>
        </div>
      }
    >
      <div class={`day-hero lv-${lv}`}>
        <b>{fmt(res.pct, 1)}%</b>
        <span>
          {!res.valid ? 'Неповні дані' : diff >= -0.05 ? (goal === 100 ? 'Норму виконано' : `Мету ${goal}% досягнуто`) : `На ${fmt(-diff, 1)}% нижче ${goal === 100 ? 'норми' : 'мети'}`}
        </span>
      </div>
      <Breakdown day={r} res={res} base={r.base || 420} />
      <button class="btn soft block" onClick={() => copyText(summaryText(r, res))}>
        <Icon name="copy" size={18} /> Скопіювати підсумок дня
      </button>
    </Sheet>
  );
}
