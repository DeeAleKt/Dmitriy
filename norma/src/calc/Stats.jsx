import { useMemo, useState } from 'preact/hooks';
import { addDays, fmt, fmtMin, fromISO, monthRange, plural, toISO, today } from '../util.js';
import { useApp } from './ctx.js';
import { exportExcel } from './files.js';
import {
  bestDay,
  computeDay,
  fmtShortDate,
  insights,
  level,
  makeSample,
  MONTHS_SHORT,
  moveAnchor,
  periodOf,
  recordsIn,
  streak,
  summarize,
  WEEKDAYS_SHORT,
} from './model.js';
import { CardHead, Empty, Icon, Segmented, toast } from './ui.jsx';

const MODES = [
  { value: 'week', label: 'Тиждень' },
  { value: 'month', label: 'Місяць' },
  { value: 'year', label: 'Рік' },
];
const MODE_WORD = { week: 'тиждень', month: 'місяць', year: 'рік' };

export function Stats() {
  const { settings, days, setDays, openDay, switchDate, openSettings } = useApp();
  const [mode, setMode] = useState('month');
  const [anchor, setAnchor] = useState(today());
  const goal = settings.goal;
  const period = periodOf(mode, anchor);
  const prevPeriod = periodOf(mode, moveAnchor(mode, anchor, -1));
  const recs = useMemo(() => recordsIn(days, period.from, period.to), [days, period.from, period.to]);
  const cur = useMemo(() => summarize(recs, goal), [recs, goal]);
  const prev = useMemo(() => summarize(recordsIn(days, prevPeriod.from, prevPeriod.to), goal), [days, prevPeriod.from, prevPeriod.to, goal]);
  const st = useMemo(() => streak(days, goal), [days, goal]);
  const best = useMemo(() => bestDay(days), [days]);
  const facts = useMemo(() => insights(cur, prev, goal, period), [cur, prev, goal, period.label]);
  const t = today();
  const isCurrent = period.from <= t && t <= period.to;
  const any = Object.keys(days).length > 0;
  const hasSample = Object.values(days).some((r) => r.sample);

  function addSample() {
    const sample = makeSample(settings, days, today());
    setDays((d) => ({ ...sample, ...d }));
    toast('Додано приклад: 45 днів', 'ok', 'sparkle');
  }
  function removeSample() {
    setDays((d) => Object.fromEntries(Object.entries(d).filter(([, r]) => !r.sample)));
    toast('Приклад прибрано');
  }

  return (
    <div class="screen">
      <header class="topbar">
        <h1 class="title">Статистика</h1>
        <button class="round-btn" onClick={openSettings} aria-label="Налаштування">
          <Icon name="sliders" />
        </button>
      </header>

      {!any ? (
        <section class="card">
          <Empty
            icon="chart"
            title="Тут буде ваша статистика"
            action={
              <button class="btn soft" onClick={addSample}>
                <Icon name="sparkle" size={18} /> Подивитися на прикладі
              </button>
            }
          >
            Зберігайте кожен день кнопкою «Зберегти день» — і тут з’являться середній відсоток, серії днів з нормою,
            рекорди, календар і куди йде робочий час.
          </Empty>
        </section>
      ) : (
        <>
          {hasSample && (
            <div class="banner sample">
              <Icon name="sparkle" size={18} />
              <span>Частина днів — вигаданий приклад.</span>
              <button class="link" onClick={removeSample}>
                Прибрати
              </button>
            </div>
          )}
          <Segmented value={mode} options={MODES} onChange={setMode} />
          <div class="period-nav">
            <button class="round-btn" onClick={() => setAnchor(moveAnchor(mode, anchor, -1))} aria-label="Попередній період">
              <Icon name="left" />
            </button>
            <span>{period.label}</span>
            <button class="round-btn" disabled={isCurrent} onClick={() => setAnchor(moveAnchor(mode, anchor, 1))} aria-label="Наступний період">
              <Icon name="right" />
            </button>
          </div>

          {cur.n === 0 ? (
            <section class="card">
              <Empty icon="calendar" title="За цей період немає збережених днів">
                {prev.n > 0 ? 'Перегляньте попередній період стрілкою ліворуч.' : 'Збережіть день на вкладці «Сьогодні».'}
              </Empty>
            </section>
          ) : (
            <>
              <Summary cur={cur} prev={prev} goal={goal} mode={mode} />

              <div class="tiles">
                <Tile icon="flame" tone="warn" label="Серія зараз" value={`${st.cur}`} unit={plural(st.cur, ['день', 'дні', 'днів'])} sub={st.best > st.cur ? `найдовша — ${st.best}` : 'поспіль з нормою'} />
                <Tile
                  icon="trophy"
                  tone="good"
                  label="Рекорд"
                  value={best ? fmt(best.pct, 1) : '—'}
                  unit="%"
                  sub={best ? fmtShortDate(best.date) : ''}
                  onClick={best ? () => openDay(best.date) : null}
                />
                <Tile icon="target" label="З нормою" value={`${cur.goalDays}`} unit={`з ${cur.n}`} sub={`${plural(cur.n, ['день', 'дні', 'днів'])} за ${MODE_WORD[mode]}`} />
                <Tile icon="box" label="Виробів" value={fmt(cur.pieces, 0)} unit="шт" sub={`за ${MODE_WORD[mode]}`} />
              </div>

              {mode === 'month' && <MonthCalendar anchor={anchor} days={days} goal={goal} onDay={openDay} onEmpty={(d) => switchDate(d, true)} />}
              {mode === 'year' && (
                <YearMap
                  year={fromISO(anchor).getFullYear()}
                  days={days}
                  goal={goal}
                  onMonth={(m) => {
                    setMode('month');
                    setAnchor(m);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}
              <Trend mode={mode} period={period} recs={recs} goal={goal} onDay={openDay} />

              {facts.length > 0 && (
                <section class="card">
                  <CardHead icon="bulb" title="Цікаве" />
                  <div class="facts">
                    {facts.map((f) => (
                      <div class={`fact ${f.tone || ''}`}>
                        <span class="fact-ico">
                          <Icon name={f.icon === 'down' ? 'down2' : f.icon} size={16} />
                        </span>
                        <span>{f.text}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <TimeSplit cur={cur} />
              {cur.down.length > 0 && <Reasons title="Причини простою" icon="pause" tone="warn" items={cur.down} />}
              {cur.other.length > 0 && <Reasons title="Інші роботи" icon="wrench" tone="teal" items={cur.other} />}
              {cur.products.length > 0 && <Products items={cur.products} />}

              <button
                class="btn soft block"
                onClick={() =>
                  exportExcel(recs, period, goal).catch((e) => toast(e?.message || 'Не вдалося зберегти файл', 'err'))
                }
              >
                <Icon name="sheet" size={18} /> Excel за {period.label.toLowerCase()}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Summary({ cur, prev, goal, mode }) {
  const lv = level(cur.pct, goal);
  const delta = prev.n >= 1 ? cur.pct - prev.pct : null;
  const scale = 150;
  return (
    <section class={`card summary lv-${lv}`}>
      <div class="sum-top">
        <span class="sum-label">Середнє за {MODE_WORD[mode]}</span>
        {delta != null && Math.abs(delta) >= 0.05 && (
          <span class={`delta ${delta >= 0 ? 'up' : 'down'}`}>
            <Icon name={delta >= 0 ? 'up' : 'down2'} size={15} />
            {delta >= 0 ? '+' : '−'}
            {fmt(Math.abs(delta), 1)}%
          </span>
        )}
      </div>
      <div class={`sum-num lv-text ${lv}`}>
        {fmt(cur.pct, 1)}
        <small>%</small>
      </div>
      <div class="sum-bar">
        <i class={`lv-${lv}`} style={{ width: `${Math.min(100, (cur.pct / scale) * 100)}%` }} />
        <em style={{ left: `${(goal / scale) * 100}%` }} />
      </div>
      <div class="sum-facts">
        <span>
          <b>{cur.n}</b> {plural(cur.n, ['день', 'дні', 'днів'])}
        </span>
        <span>
          робочий час <b>{fmtMin(cur.avail)}</b>
        </span>
        {cur.downMin > 0 && (
          <span>
            простій <b>{fmtMin(cur.downMin)}</b>
          </span>
        )}
      </div>
    </section>
  );
}

function Tile({ icon, tone, label, value, unit, sub, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag class={`tile ${onClick ? 'tap' : ''}`} onClick={onClick || undefined}>
      <span class={`head-ico ${tone || ''}`}>
        <Icon name={icon} size={17} />
      </span>
      <span class="tile-label">{label}</span>
      <span class="tile-value">
        {value}
        {unit && <small> {unit}</small>}
      </span>
      {sub && <span class="tile-sub">{sub}</span>}
    </Tag>
  );
}

function legendFor(goal) {
  return [
    ['bad', `< ${Math.round(goal * 0.8)}%`],
    ['warn', `${Math.round(goal * 0.8)}–${goal - 1}%`],
    ['good', `${goal}%+`],
    ['great', `${goal + 15}%+`],
  ];
}

function MonthCalendar({ anchor, days, goal, onDay, onEmpty }) {
  const { from, to } = monthRange(anchor);
  const lead = (fromISO(from).getDay() + 6) % 7;
  const total = fromISO(to).getDate();
  const t = today();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => addDays(from, i))];
  return (
    <section class="card">
      <CardHead icon="calendar" title="Календар" aside="торкніться дня" />
      <div class="cal-head">
        {WEEKDAYS_SHORT.map((w) => (
          <span>{w}</span>
        ))}
      </div>
      <div class="cal">
        {cells.map((d, i) => {
          if (!d) return <span class="cal-cell blank" key={`b${i}`} />;
          const r = days[d];
          const c = r && computeDay(r, r.base || 420);
          const lv = c?.valid ? level(c.pct, goal) : '';
          const future = d > t;
          return (
            <button
              key={d}
              class={`cal-cell ${lv ? `h-${lv}` : ''} ${d === t ? 'today' : ''} ${future ? 'future' : ''} ${r?.sample ? 'sample' : ''}`}
              disabled={future}
              onClick={() => (r ? onDay(d) : onEmpty(d))}
              aria-label={`${fromISO(d).getDate()}: ${c?.valid ? `${fmt(c.pct, 1)}%` : 'немає запису'}`}
            >
              <span class="cal-num">{fromISO(d).getDate()}</span>
              {c?.valid && <span class="cal-pct">{fmt(c.pct, 0)}</span>}
            </button>
          );
        })}
      </div>
      <div class="legend">
        {legendFor(goal).map(([k, l]) => (
          <span>
            <i class={`h-${k}`} />
            {l}
          </span>
        ))}
      </div>
    </section>
  );
}

function YearMap({ year, days, goal, onMonth }) {
  const t = today();
  return (
    <section class="card">
      <CardHead icon="calendar" title={`${year} рік`} aside="торкніться місяця" />
      <div class="ymonths">
        {MONTHS_SHORT.map((name, m) => {
          const from = toISO(new Date(year, m, 1));
          const total = new Date(year, m + 1, 0).getDate();
          const lead = (new Date(year, m, 1).getDay() + 6) % 7;
          let n = 0;
          const cells = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => addDays(from, i))].map((d, i) => {
            if (!d) return <i class="ym-cell blank" key={`b${i}`} />;
            const r = days[d];
            const c = r && computeDay(r, r.base || 420);
            if (c?.valid) n++;
            const lv = c?.valid ? level(c.pct, goal) : d > t ? 'future' : 'none';
            return <i class={`ym-cell h-${lv}`} key={d} />;
          });
          return (
            <button class={`ymonth ${n ? '' : 'nodata'}`} onClick={() => onMonth(from)} aria-label={`${name}: ${n} днів`}>
              <span class="ymonth-name">{name}</span>
              <span class="ymonth-grid">{cells}</span>
            </button>
          );
        })}
      </div>
      <div class="legend">
        {legendFor(goal).map(([k, l]) => (
          <span>
            <i class={`h-${k}`} />
            {l}
          </span>
        ))}
      </div>
    </section>
  );
}

function Trend({ mode, period, recs, goal, onDay }) {
  const [sel, setSel] = useState(null);
  const slots = useMemo(() => {
    if (mode === 'year') {
      const y = Number(period.from.slice(0, 4));
      return MONTHS_SHORT.map((m, i) => {
        const r = monthRange(toISO(new Date(y, i, 1)));
        const s = summarize(
          recs.filter((x) => x.date >= r.from && x.date <= r.to),
          goal,
        );
        return { key: `m${i}`, label: m, v: s.n ? s.pct : null, title: `${m}: ${s.n ? `${fmt(s.pct, 1)}% · ${s.n} дн.` : 'немає'}` };
      });
    }
    const map = new Map(recs.map((r) => [r.date, r]));
    const out = [];
    for (let d = period.from; d <= period.to; d = addDays(d, 1)) {
      const r = map.get(d);
      const c = r && computeDay(r, r.base || 420);
      const dn = fromISO(d).getDate();
      out.push({
        key: d,
        date: d,
        label: mode === 'week' ? WEEKDAYS_SHORT[(fromISO(d).getDay() + 6) % 7] : dn === 1 || dn % 5 === 0 ? String(dn) : '',
        v: c?.valid ? c.pct : null,
        title: `${fmtShortDate(d)}: ${c?.valid ? `${fmt(c.pct, 1)}%` : 'немає запису'}`,
      });
    }
    return out;
  }, [mode, period.from, period.to, recs, goal]);
  const max = Math.min(200, Math.max(goal + 30, ...slots.map((s) => s.v || 0)));
  const picked = slots.find((s) => s.key === sel);
  return (
    <section class="card">
      <CardHead icon="chart" title={mode === 'year' ? 'По місяцях' : 'По днях'} aside={picked ? picked.title : null} />
      <div class="chart">
        <div class="chart-goal" style={{ bottom: `${(goal / max) * 100}%` }}>
          <span>{goal}%</span>
        </div>
        <div class={`chart-bars ${mode}`}>
          {slots.map((s) => (
            <button
              class={`cbar-col ${sel === s.key ? 'sel' : ''}`}
              disabled={s.v == null}
              onClick={() => setSel(sel === s.key ? null : s.key)}
              aria-label={s.title}
            >
              {s.v != null && <i class={`cbar lv-${level(s.v, goal)}`} style={{ height: `${Math.max(3, (s.v / max) * 100)}%` }} />}
            </button>
          ))}
        </div>
      </div>
      <div class={`chart-axis ${mode}`}>
        {slots.map((s) => (
          <span>{s.label}</span>
        ))}
      </div>
      {picked?.date && (
        <button class="link" onClick={() => onDay(picked.date)}>
          Відкрити {fmtShortDate(picked.date)} <Icon name="right" size={16} />
        </button>
      )}
    </section>
  );
}

function TimeSplit({ cur }) {
  const total = cur.prodMin + cur.otherMin + cur.downMin;
  if (!total) return null;
  const parts = [
    ['prod', 'Вироби', cur.prodMin],
    ['other', 'Інші роботи', cur.otherMin],
    ['down', 'Простій', cur.downMin],
  ].filter((p) => p[2] > 0);
  return (
    <section class="card">
      <CardHead icon="clock" title="Куди пішов час" aside={fmtMin(total)} />
      <div class="split">
        {parts.map(([k, , v]) => (
          <i class={`s-${k}`} style={{ flexGrow: v }} />
        ))}
      </div>
      <div class="split-legend">
        {parts.map(([k, l, v]) => (
          <div>
            <i class={`s-${k}`} />
            <span>{l}</span>
            <b>{fmtMin(v)}</b>
            <em>{fmt((v / total) * 100, 0)}%</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function Reasons({ title, icon, tone, items }) {
  const max = items[0]?.min || 1;
  return (
    <section class="card">
      <CardHead icon={icon} tone={tone} title={title} />
      <div class="rlist">
        {items.slice(0, 6).map((x) => (
          <div class="ritem">
            <div class="ritem-row">
              <span>{x.name}</span>
              <b>{fmtMin(x.min)}</b>
            </div>
            <div class={`bar thin ${tone}`}>
              <i style={{ width: `${(x.min / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Products({ items }) {
  return (
    <section class="card">
      <CardHead icon="box" title="Що робили" />
      <div class="rlist">
        {items.slice(0, 8).map((p) => (
          <div class="prow">
            <span class="prow-name">{p.name}</span>
            <span class="prow-days">
              {p.days} {plural(p.days, ['день', 'дні', 'днів'])}
            </span>
            <b>{fmt(p.qty, 0)} шт</b>
          </div>
        ))}
      </div>
    </section>
  );
}
