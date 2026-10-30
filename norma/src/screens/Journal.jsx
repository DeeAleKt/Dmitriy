import { useEffect, useMemo, useState } from 'preact/hooks';
import { entryPercent, level, summarize } from '../calc.js';
import { watchEntries } from '../data.js';
import { exportXlsx } from '../export.js';
import { Empty, errText, Icon, Pct, Segmented, Sheet, Spinner, toast } from '../ui.jsx';
import {
  addDays,
  collator,
  fmt,
  fmtDate,
  fmtDateNum,
  fmtMin,
  fmtMonth,
  fmtTime,
  fromISO,
  initials,
  monthRange,
  monthsBetween,
  plural,
  today,
  weekRange,
} from '../util.js';
import { PeoplePick } from './Calc.jsx';

const PERIODS = [
  { value: 'week', label: 'Тиждень' },
  { value: 'month', label: 'Місяць' },
  { value: 'prev', label: 'Мин. місяць' },
  { value: 'custom', label: 'Період' },
];

function rangeFor(period, custom) {
  const t = today();
  if (period === 'week') return weekRange(t);
  if (period === 'month') return monthRange(t);
  if (period === 'prev') return monthRange(addDays(monthRange(t).from, -1));
  return custom;
}

export function Journal({ me, myName, isAdmin, people, onOpen }) {
  const [period, setPeriod] = useState('month');
  const [custom, setCustom] = useState(() => ({ from: monthRange(today()).from, to: today() }));
  const [worker, setWorker] = useState(isAdmin ? 'all' : me);
  const [view, setView] = useState('people');
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);
  const [whoOpen, setWhoOpen] = useState(false);
  const range = rangeFor(period, custom);
  const validRange = range.from && range.to && range.from <= range.to;

  useEffect(() => {
    if (!validRange) return;
    setEntries(null);
    setError(null);
    return watchEntries(
      { months: monthsBetween(range.from, range.to), email: worker === 'all' ? null : worker },
      (list) =>
        setEntries(
          list
            .filter((e) => e.date >= range.from && e.date <= range.to)
            .sort((a, b) => b.date.localeCompare(a.date) || collator.compare(a.name, b.name)),
        ),
      (e) => setError(e),
    );
  }, [range.from, range.to, worker]);

  const names = useMemo(() => new Map(people.map((p) => [p.email, p.name])), [people]);
  const nameOf = (email, fallback) => (email === me ? myName : names.get(email) || fallback || email);
  const all = isAdmin && worker === 'all';
  const showPeople = all && view === 'people';

  async function doExport() {
    try {
      exportXlsx({ entries, range, nameOf });
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  const periodLabel =
    period === 'month' || period === 'prev'
      ? fmtMonth(range.from)
      : validRange
        ? `${fmtDateNum(range.from)} – ${fmtDateNum(range.to)}`
        : '';

  return (
    <div class="screen">
      <div class="toolbar">
        <Segmented value={period} onChange={setPeriod} options={PERIODS} small />
      </div>
      {period === 'custom' && (
        <div class="grid2 range">
          <label class="field">
            <span class="field-label">З</span>
            <input class="input" type="date" value={custom.from} max={today()} onChange={(e) => setCustom({ ...custom, from: e.currentTarget.value })} />
          </label>
          <label class="field">
            <span class="field-label">По</span>
            <input class="input" type="date" value={custom.to} max={today()} onChange={(e) => setCustom({ ...custom, to: e.currentTarget.value })} />
          </label>
        </div>
      )}

      <div class="toolbar between">
        {isAdmin ? (
          <button class="who-chip compact" onClick={() => setWhoOpen(true)}>
            <span class="avatar sm">{worker === 'all' ? <Icon name="users" size={16} /> : initials(nameOf(worker))}</span>
            <span>{worker === 'all' ? 'Усі працівники' : nameOf(worker)}</span>
            <Icon name="down" size={18} />
          </button>
        ) : (
          <h2 class="period-title">{periodLabel}</h2>
        )}
        <button class="btn soft sm" onClick={doExport} disabled={!entries?.length}>
          <Icon name="download" size={18} /> Excel
        </button>
      </div>

      {!validRange ? (
        <Empty icon="calendar" title="Перевірте дати періоду" />
      ) : error ? (
        <IndexError error={error} />
      ) : !entries ? (
        <div class="center-pad">
          <Spinner />
        </div>
      ) : (
        <>
          <Summary entries={entries} label={isAdmin ? periodLabel : null} single={!all} />
          {all && (
            <div class="toolbar">
              <Segmented
                value={view}
                onChange={setView}
                small
                options={[
                  { value: 'people', label: 'По працівниках' },
                  { value: 'days', label: 'По днях' },
                ]}
              />
            </div>
          )}
          {showPeople ? (
            <PeopleSummary
              entries={entries}
              people={people}
              nameOf={nameOf}
              onPick={(email) => {
                setWorker(email);
              }}
            />
          ) : entries.length ? (
            <EntryList entries={entries} showName={all} nameOf={nameOf} onOpen={onOpen} />
          ) : (
            <Empty icon="list" title="Записів за цей період немає">
              Записи з’являються тут після натискання «Зберегти в журнал».
            </Empty>
          )}
        </>
      )}

      <Sheet open={whoOpen} title="Чиї записи показати" onClose={() => setWhoOpen(false)} tall>
        <PeoplePick
          people={people}
          me={me}
          myName={myName}
          value={worker}
          allOption
          onPick={(email) => {
            setWorker(email);
            setWhoOpen(false);
          }}
        />
      </Sheet>
    </div>
  );
}

function Summary({ entries, label, single }) {
  const s = summarize(entries);
  const lv = level(s.percent);
  const chrono = single ? [...entries].sort((a, b) => a.date.localeCompare(b.date)) : [];
  return (
    <section class={`card summary lv-${lv}`}>
      <div class="summary-top">
        <div>
          <span class="muted small">{label || 'Середнє виконання'}</span>
          <div class={`summary-pct lv-text ${s.days ? lv : ''}`}>{s.days ? `${fmt(s.percent, 1)}%` : '—'}</div>
          {label && <span class="muted small">середнє виконання</span>}
        </div>
        <div class="summary-facts">
          <span>
            <b>{s.days}</b> {plural(s.days, ['запис', 'записи', 'записів'])}
          </span>
          <span>
            <b>{s.reached}</b> з нормою ≥100%
          </span>
          <span>
            простій <b>{fmtMin(s.downtime)}</b>
          </span>
        </div>
      </div>
      {single && chrono.length > 1 && <Bars entries={chrono} />}
    </section>
  );
}

function Bars({ entries }) {
  const max = Math.max(120, ...entries.map((e) => entryPercent(e)));
  return (
    <div class="bars" role="img" aria-label="Виконання по днях">
      <div class="bars-line" style={{ bottom: `${(100 / max) * 100}%` }}>
        <span>100%</span>
      </div>
      {entries.map((e) => {
        const p = entryPercent(e);
        return (
          <div class="bar-col" title={`${fmtDate(e.date)}: ${fmt(p, 1)}%`}>
            <div class={`bar ${level(p)}`} style={{ height: `${Math.max(2, (p / max) * 100)}%` }} />
            <span>{fromISO(e.date).getDate()}</span>
          </div>
        );
      })}
    </div>
  );
}

function EntryList({ entries, showName, nameOf, onOpen }) {
  let lastDate = null;
  return (
    <div class="entries">
      {entries.map((e) => {
        const p = entryPercent(e);
        const header = showName && e.date !== lastDate;
        lastDate = e.date;
        const d = fromISO(e.date);
        return (
          <>
            {header && <h4 class="group-title">{fmtDate(e.date)}</h4>}
            <button class="entry" onClick={() => onOpen(e.date, e.email)} key={e.id}>
              {showName ? (
                <span class="avatar">{initials(nameOf(e.email, e.name))}</span>
              ) : (
                <span class="entry-date">
                  <b>{d.getDate()}</b>
                  <small>{fmtDate(e.date).split(',')[0]}</small>
                </span>
              )}
              <span class="entry-main">
                {showName && <b class="entry-who">{nameOf(e.email, e.name)}</b>}
                <span class="entry-items">
                  {e.items.map((i) => `${i.name} × ${fmt(i.qty)}`).join(', ') || 'Без виробів'}
                </span>
                <span class="entry-meta">
                  <span class="shift-tag">{e.shiftName || `${fmtTime(e.start)}–${fmtTime(e.end)}`}</span>
                  {e.downtime > 0 && (
                    <>
                      <Icon name="pause" size={14} /> {fmtMin(e.downtime)}
                      {e.reason && ` · ${e.reason}`}
                    </>
                  )}
                  {e.comment && <> · {e.comment}</>}
                </span>
              </span>
              <Pct value={p} />
            </button>
          </>
        );
      })}
    </div>
  );
}

function PeopleSummary({ entries, people, nameOf, onPick }) {
  const byEmail = new Map();
  for (const e of entries) {
    if (!byEmail.has(e.email)) byEmail.set(e.email, []);
    byEmail.get(e.email).push(e);
  }
  const rows = [...byEmail.entries()]
    .map(([email, list]) => ({ email, name: nameOf(email, list[0].name), s: summarize(list) }))
    .sort((a, b) => b.s.percent - a.s.percent);
  const silent = people.filter((p) => p.active && p.role === 'worker' && !byEmail.has(p.email));
  if (!rows.length && !silent.length) return <Empty icon="users" title="Записів за цей період немає" />;
  return (
    <div class="entries">
      {rows.map(({ email, name, s }) => (
        <button class="entry person-row" onClick={() => onPick(email)} key={email}>
          <span class="avatar">{initials(name)}</span>
          <span class="entry-main">
            <b class="entry-who">{name}</b>
            <span class="meter">
              <i class={level(s.percent)} style={{ width: `${Math.min(100, (s.percent / 150) * 100)}%` }} />
              <em style={{ left: `${(100 / 150) * 100}%` }} />
            </span>
            <span class="entry-meta">
              {s.days} {plural(s.days, ['день', 'дні', 'днів'])}, з них ≥100%: {s.reached}
              {s.downtime > 0 && ` · простій ${fmtMin(s.downtime)}`}
            </span>
          </span>
          <Pct value={s.percent} />
        </button>
      ))}
      {silent.length > 0 && (
        <>
          <h4 class="group-title">Без записів за період</h4>
          {silent.map((p) => (
            <button class="entry person-row dim" onClick={() => onPick(p.email)} key={p.email}>
              <span class="avatar">{initials(p.name)}</span>
              <span class="entry-main">
                <b class="entry-who">{p.name}</b>
                <span class="entry-meta">{p.email}</span>
              </span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

function IndexError({ error }) {
  const link = String(error?.message || '').match(/https:\/\/console\.firebase\.google\.com\S+/)?.[0];
  if (error?.code === 'failed-precondition' && link) {
    return (
      <div class="card notice">
        <b>Базі потрібен індекс</b>
        <p class="muted">
          Firebase просить один раз створити індекс для цього запиту. Відкрийте посилання (під акаунтом власника),
          натисніть «Створити» і зачекайте кілька хвилин.
        </p>
        <a class="btn primary block" href={link} target="_blank" rel="noopener">
          Створити індекс
        </a>
      </div>
    );
  }
  return <Empty icon="info" title="Не вдалося завантажити записи">{errText(error)}</Empty>;
}
