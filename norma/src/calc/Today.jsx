import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { addDays, fmt, fmtHM, fmtMin, fmtTime, fromISO, pad, plural, store, today } from '../util.js';
import { useApp, useNow } from './ctx.js';
import { backup, BACKUP_KEY } from './files.js';
import { buzz, confetti } from './fx.js';
import { Gauge } from './Gauge.jsx';
import { MonthCard, MonthGoalSheet } from './Month.jsx';
import { NormFixSheet } from './Norms.jsx';
import {
  bestDay,
  compareDay,
  computeDay,
  DOWN_MINUTES,
  fmtShortDate,
  isApprox,
  isBlank,
  level,
  minutesLabel,
  newKey,
  oddDay,
  num,
  openDayOf,
  OTHER_MINUTES,
  paceAt,
  pctText,
  rankInMonth,
  sameRecord,
  shiftLength,
  streak,
  toGoal,
  toRecord,
} from './model.js';
import { ask, CardHead, cleanNum, Icon, Sheet, Stepper, toast, Toggle } from './ui.jsx';

const WEEKDAYS = ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', 'пʼятниця', 'субота'];
const MONTHS_GEN = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];

function dateTitle(iso) {
  const t = today();
  const d = fromISO(iso);
  const long = `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
  if (iso === t) return { main: 'Сьогодні', sub: long };
  if (iso === addDays(t, -1)) return { main: 'Вчора', sub: long };
  return { main: long.charAt(0).toUpperCase() + long.slice(1), sub: String(d.getFullYear()) };
}

/** Короткий підсумок дня текстом — щоб надіслати майстру в месенджер. */
export function summaryText(day, res) {
  const d = fromISO(day.date);
  const lines = [
    `${WEEKDAYS[d.getDay()].charAt(0).toUpperCase() + WEEKDAYS[d.getDay()].slice(1)}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]} · ${day.shiftName || 'зміна'}: вхід ${fmtTime(day.start)}, вихід ${fmtTime(day.end)}`,
  ];
  for (const l of res.active) lines.push(`${l.name || 'Виріб'}: ${fmt(l.qty)} шт (норма ${l.approx ? '≈' : ''}${fmt(l.norm)} за зміну${l.approx ? ', приблизна' : ''})`);
  for (const x of day.downtime || []) lines.push(`Простій: ${x.reason} — ${fmtMin(num(x.min))}`);
  for (const x of day.others || []) lines.push(`Інші роботи: ${x.kind} — ${fmtMin(num(x.min))}`);
  lines.push(`Виконання норми: ${res.active.some((l) => l.approx && l.qty > 0) ? '≈' : ''}${fmt(res.pct, 1)}%`);
  return lines.join('\n');
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Підсумок скопійовано', 'ok', 'check');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.append(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    toast(ok ? 'Підсумок скопійовано' : 'Не вдалося скопіювати', ok ? 'ok' : 'err');
  }
}

const TIP_KEY = 'norma.v2.tip-done';

/** Що показати під шкалою. */
function statusOf(res, goal, base) {
  if (res.error === 'shift') return { icon: 'clock', text: 'Вкажіть час зміни' };
  if (res.error === 'break') return { icon: 'info', text: 'Перерва довша за зміну' };
  if (res.error === 'downtime') return { icon: 'pause', text: 'Простій забрав увесь робочий час' };
  if (!res.active.length && !res.otherMin) return { icon: 'plus', text: 'Додайте виріб або інші роботи' };
  if (!res.hasInput) return { icon: 'box', text: 'Вкажіть, скільки зроблено' };
  if (res.error === 'other') return { icon: 'info', text: 'Інших робіт більше, ніж робочого часу' };
  const g = toGoal(res, goal, base);
  const word = goal === 100 ? 'норми' : `мети ${goal}%`;
  if (g.minutes <= 0.01) {
    let extra = 0;
    if (g.single && res.otherMin === 0) extra = g.single.qty - (g.single.dayNorm * goal) / 100;
    if (goal !== 100) return { icon: 'sparkle', done: true, text: `Мету ${goal}% досягнуто` };
    return { icon: 'sparkle', done: true, text: extra >= 0.05 ? `Норму виконано · +${fmt(extra)} шт понад` : 'Норму виконано' };
  }
  if (g.pieces != null) return { icon: 'target', text: `До ${word} ще ${fmt(g.pieces)} шт` };
  return { icon: 'target', text: `До ${word} ще ${fmtMin(g.minutes)} нормо-часу` };
}

export function Today() {
  const { settings, setSettings, days, draft, setDraft, sync, switchDate, openSettings } = useApp();
  const now = useNow(30000);
  const base = settings.base;
  const goal = settings.goal;
  const res = useMemo(() => computeDay(draft, base), [draft, base]);
  const record = useMemo(() => toRecord(draft, base), [draft, base]);
  const saved = days[draft.date];
  const blank = isBlank(draft);
  const dirty = saved ? !sameRecord(record, saved) : !blank;
  const isToday = draft.date === today();
  const pace = useMemo(() => paceAt(draft, res, now), [draft, res, now]);
  const lv = res.hasInput && res.valid ? level(res.pct, goal) : 'idle';
  const status = statusOf(res, goal, base);
  const odd = oddDay(res);
  const [sheet, setSheet] = useState(null);
  const [tip, setTip] = useState(() => !store(TIP_KEY) && !Object.keys(days).length);
  const title = dateTitle(draft.date);

  // Свято, коли під час введення перетнули мету чи свій рекорд (раз на день)
  const prev = useRef({ date: draft.date, pct: res.pct });
  const fired = useRef(new Set());
  useEffect(() => {
    const was = prev.current;
    prev.current = { date: draft.date, pct: res.pct };
    if (was.date !== draft.date || !res.hasInput || !res.valid || res.pct <= was.pct || oddDay(res)) return;
    const others = Object.fromEntries(Object.entries(days).filter(([d, r]) => d !== draft.date && !r.sample));
    const best = Object.keys(others).length >= 5 ? bestDay(others) : null;
    const key = draft.date;
    if (best && was.pct <= best.pct && res.pct > best.pct + 0.05 && !fired.current.has(`${key}:best`)) {
      fired.current.add(`${key}:best`).add(`${key}:goal`);
      toast(`Новий особистий рекорд — ${fmt(res.pct, 1)}%!`, 'ok', 'trophy');
      if (settings.celebrate) confetti({ y: 0.22, count: 170 });
      buzz(30);
    } else if (was.pct < goal - 0.05 && res.pct >= goal - 0.05 && !fired.current.has(`${key}:goal`)) {
      fired.current.add(`${key}:goal`);
      const run = streak({ ...others, [key]: record }, goal).cur;
      const done = goal === 100 ? 'Норму виконано' : `Мету ${goal}% досягнуто`;
      toast(run >= 2 ? `${done} · ${run} ${plural(run, ['день', 'дні', 'днів'])} поспіль` : `${done}!`, 'ok', run >= 2 ? 'flame' : 'sparkle');
      if (settings.celebrate) confetti({ y: 0.22, count: 110 });
      buzz(25);
    }
  }, [res.pct, draft.date]);

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const setProduct = (key, p) => setDraft((d) => ({ ...d, products: d.products.map((x) => (x.key === key ? { ...x, ...p } : x)) }));
  const focusQty = (key) => setTimeout(() => document.querySelector(`[data-pkey="${key}"] .step-input`)?.focus(), 80);

  function addProduct(from) {
    let target;
    setDraft((d) => {
      const empty = d.products.find((p) => !p.name && !num(p.norm) && !num(p.qty));
      const filled = from ? { name: from.name, norm: String(from.norm).replace('.', ','), approx: !!from.approx } : {};
      if (empty && from) {
        target = empty.key;
        return { ...d, products: d.products.map((p) => (p === empty ? { ...p, ...filled } : p)) };
      }
      const item = { key: newKey(), name: '', norm: '', qty: '', ...filled };
      target = item.key;
      return { ...d, products: [...d.products, item] };
    });
    setTimeout(() => {
      const box = document.querySelector(`[data-pkey="${target}"]`);
      if (!box) return;
      (from ? box.querySelector('.step-input') : box.querySelector('.numbox input'))?.focus();
    }, 80);
  }

  async function removeProduct(p) {
    if ((num(p.qty) > 0 || p.name) && !(await ask({ title: 'Прибрати виріб?', text: p.name || undefined, ok: 'Прибрати', danger: true }))) return;
    setDraft((d) => {
      const rest = d.products.filter((x) => x.key !== p.key);
      return { ...d, products: rest.length ? rest : [{ key: newKey(), name: '', norm: '', qty: '' }] };
    });
  }

  async function clearDay() {
    const ok = await ask({
      title: 'Очистити розрахунок?',
      text: saved ? 'Кількості, простій та інші роботи буде прибрано, а день зникне з історії та статистики.' : 'Кількості, простій та інші роботи буде прибрано.',
      ok: 'Очистити',
      danger: true,
    });
    if (!ok) return;
    setDraft((d) => ({ ...d, products: d.products.map((p) => ({ ...p, qty: '' })), downtime: [], others: [] }));
  }

  return (
    <div class="screen">
      <header class="topbar">
        <button class="round-btn" onClick={() => switchDate(addDays(draft.date, -1))} aria-label="Попередній день">
          <Icon name="left" />
        </button>
        <label class="date-pill">
          <span class="date-main">{title.main}</span>
          <span class="date-sub">{title.sub}</span>
          <input type="date" value={draft.date} max={today()} aria-label="Обрати дату" onChange={(e) => e.currentTarget.value && switchDate(e.currentTarget.value)} />
        </label>
        <button class="round-btn" disabled={isToday} onClick={() => switchDate(addDays(draft.date, 1))} aria-label="Наступний день">
          <Icon name="right" />
        </button>
        <button class="round-btn" onClick={openSettings} aria-label="Налаштування">
          <Icon name="sliders" />
        </button>
      </header>

      {!isToday && (
        <div class="banner">
          <Icon name="history" size={18} />
          <span>{saved?.sample ? 'Це день із прикладу — змініть щось, і він стане вашим.' : saved ? 'Минулий день · зміни зберігаються самі.' : 'Запис за минулий день · зберігається сам.'}</span>
          <button class="link" onClick={() => switchDate(today())}>
            До сьогодні
          </button>
        </div>
      )}

      <section class={`panel lv-${lv}`}>
        <Gauge pct={res.pct} goal={goal} />
        <p class={`panel-status ${status.done ? 'done' : ''}`}>
          <Icon name={status.icon} size={18} />
          <span>{status.text}</span>
        </p>
        {isApprox(record) && <p class="panel-approx">≈ Орієнтовно: норма виробу поки приблизна</p>}
        {odd && (
          <div class="pace attention odd">
            <Icon name="info" size={18} />
            <span>
              <b>{fmt(res.pct, 0)}% — схоже на помилку.</b> {odd.text}.{' '}
              <button
                class="link inline"
                onClick={() =>
                  odd.why === 'time'
                    ? setSheet({ type: 'shift' })
                    : document.querySelector(odd.why === 'down' ? '.tcard-down' : '.pitem .step-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
              >
                Перевірити
              </button>
            </span>
          </div>
        )}
        <div class="panel-stats">
          <div>
            <span>Робочий час</span>
            <b>{res.valid ? fmtHM(res.avail) : '—'}</b>
          </div>
          <div>
            <span>Зароблено</span>
            <b>{res.valid ? fmtHM(res.earned) : '—'}</b>
          </div>
          <div>
            <span>Виробів</span>
            <b>{fmt(res.pieces)}</b>
          </div>
        </div>
        <Pace pace={pace} res={res} isToday={isToday} />
        <div class="panel-foot">
          <SaveChip sync={sync} dirty={dirty} invalid={!blank && !res.valid} blank={blank && !saved} onClick={() => setSheet({ type: 'sync' })} />
          <button class="panel-how" onClick={() => setSheet({ type: 'how' })} disabled={!res.valid}>
            <Icon name="info" size={15} /> Як пораховано
          </button>
        </div>
      </section>

      {tip && (
        <section class="card tip-card">
          <div class="tip-head">
            <span class="head-ico good">
              <Icon name="bulb" size={17} />
            </span>
            <b>Як користуватися</b>
            <button
              class="icon-btn"
              aria-label="Сховати підказку"
              onClick={() => {
                store(TIP_KEY, 1);
                setTip(false);
              }}
            >
              <Icon name="x" size={18} />
            </button>
          </div>
          <ol>
            <li>Оберіть зміну — час і перерва підставляться самі.</li>
            <li>Впишіть норму виробу за зміну і скільки зробили. Тримайте «+», щоб рахувати швидко.</li>
            <li>Простій та інші роботи обирайте зі списку — з хвилинами.</li>
            <li>Нічого зберігати вручну не треба: кожна зміна записується сама, а у «Статистиці» видно тенденцію й висновки.</li>
          </ol>
        </section>
      )}

      <BackupNudge mode={sync.mode} settings={settings} days={days} />

      <ShiftCard draft={draft} res={res} settings={settings} isToday={isToday} now={now} onPatch={patch} onOpen={() => setSheet({ type: 'shift' })} />

      <section class="card">
        <CardHead icon="box" title="Вироби" aside={res.pieces > 0 ? `${fmt(res.pieces)} шт` : null} />
        <div class="plist">
          {draft.products.map((p, i) => (
            <ProductItem
              key={p.key}
              p={p}
              idx={i}
              line={res.lines[i]}
              res={res}
              onChange={(x) => setProduct(p.key, x)}
              onRemove={() => removeProduct(p)}
              onPick={() => setSheet({ type: 'product', key: p.key })}
              onFix={() => setSheet({ type: 'norm', key: p.key, name: p.name.trim() })}
            />
          ))}
        </div>
        <button class="add-btn" onClick={() => addProduct()}>
          <Icon name="plus" size={18} /> Додати виріб
        </button>
        {settings.products.length > 0 && (
          <div class="quick">
            <span class="quick-label">Мої вироби</span>
            <div class="quick-row">
              {settings.products.map((sp) => (
                <button class="qchip" key={sp.id} onClick={() => addProduct(sp)}>
                  <span>{sp.name || 'Без назви'}</span>
                  <em>
                    {sp.approx ? '≈' : ''}
                    {fmt(sp.norm)}
                  </em>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <TimeCard
        kind="down"
        items={draft.downtime}
        total={res.downMin}
        onAdd={() => setSheet({ type: 'time', kind: 'down' })}
        onEdit={(item) => setSheet({ type: 'time', kind: 'down', item })}
        onRemove={(key) => setDraft((d) => ({ ...d, downtime: d.downtime.filter((x) => x.key !== key) }))}
      />
      <TimeCard
        kind="other"
        items={draft.others}
        total={res.otherMin}
        onAdd={() => setSheet({ type: 'time', kind: 'other' })}
        onEdit={(item) => setSheet({ type: 'time', kind: 'other', item })}
        onRemove={(key) => setDraft((d) => ({ ...d, others: d.others.filter((x) => x.key !== key) }))}
      />

      {isToday && <MonthCard days={days} settings={settings} date={draft.date} res={res} onGoal={() => setSheet({ type: 'mgoal' })} />}

      {!odd && <DayContext days={days} date={draft.date} record={record} res={res} goal={goal} isToday={isToday} />}

      {!blank && (
        <button class="text-btn" onClick={clearDay}>
          <Icon name="reset" size={16} /> Очистити розрахунок
        </button>
      )}

      <p class="privacy">
        <Icon name="shield" size={16} />
        <span>{privacyText(sync)}</span>
      </p>

      {sheet?.type === 'how' && (
        <Sheet
          title="Як пораховано"
          sub={`${title.main} · ${draft.shiftName || 'свій час'}`}
          onClose={() => setSheet(null)}
          tall
          footer={
            <button class="btn soft block" onClick={() => copyText(summaryText(draft, res))}>
              <Icon name="copy" size={18} /> Скопіювати підсумок дня
            </button>
          }
        >
          <Breakdown day={draft} res={res} base={base} />
        </Sheet>
      )}
      {sheet?.type === 'norm' && <NormFixSheet name={sheet.name} lineKey={sheet.key} onClose={() => setSheet(null)} />}
      {sheet?.type === 'mgoal' && (
        <MonthGoalSheet month={draft.date.slice(0, 7)} days={days} settings={settings} setSettings={setSettings} todayISO={today()} onClose={() => setSheet(null)} />
      )}
      {sheet?.type === 'sync' && <SyncSheet sync={sync} settings={settings} days={days} onClose={() => setSheet(null)} />}
      {sheet?.type === 'shift' && (
        <ShiftSheet draft={draft} res={res} settings={settings} setSettings={setSettings} onApply={patch} onClose={() => setSheet(null)} />
      )}
      {sheet?.type === 'product' && (
        <ProductSheet
          item={draft.products.find((p) => p.key === sheet.key)}
          settings={settings}
          setSettings={setSettings}
          days={days}
          onApply={(x) => {
            setProduct(sheet.key, x);
            if (x.norm) focusQty(sheet.key);
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.type === 'time' && (
        <TimeSheet
          kind={sheet.kind}
          item={sheet.item}
          draft={draft}
          base={base}
          settings={settings}
          setSettings={setSettings}
          onSave={(item) => {
            const field = sheet.kind === 'down' ? 'downtime' : 'others';
            setDraft((d) => ({
              ...d,
              [field]: d[field].some((x) => x.key === item.key) ? d[field].map((x) => (x.key === item.key ? item : x)) : [...d[field], item],
            }));
            setSheet(null);
          }}
          onDelete={(key) => {
            const field = sheet.kind === 'down' ? 'downtime' : 'others';
            setDraft((d) => ({ ...d, [field]: d[field].filter((x) => x.key !== key) }));
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}

// ---------- Зміна: вхід і вихід ----------

const nowHM = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function ShiftCard({ draft, res, settings, isToday, now, onPatch, onOpen }) {
  const preset = settings.shifts.find((s) => s.name === draft.shiftName);
  const planned = preset ? shiftLength(preset.start, preset.end) : null;
  const diff = planned != null && res.shiftMin > 0 ? res.shiftMin - planned : 0;
  const single = res.valid && res.active.length === 1 && res.otherMin === 0 ? res.active[0] : null;
  const dPieces = single && diff ? (single.norm * Math.abs(diff)) / settings.base : 0;
  const t = nowHM(now);
  return (
    <section class="card shiftbox">
      <button class="shift-top" onClick={onOpen}>
        <span class="head-ico">
          <Icon name="clock" size={17} />
        </span>
        <span class="shift-main">
          <b>{draft.shiftName || 'Свій час'}</b>
          <small>
            {preset ? `графік ${fmtTime(preset.start)}–${fmtTime(preset.end)} · ` : ''}перерва {fmtMin(num(draft.brk))}
          </small>
        </span>
        <span class="shift-work">
          <b>{res.workMin > 0 ? fmtMin(res.workMin) : '—'}</b>
          <small>роботи</small>
        </span>
        <Icon name="right" size={18} class="faint" />
      </button>
      <div class="punch">
        <PunchBox label="Вхід" value={draft.start} now={isToday && draft.start !== t ? t : null} onChange={(v) => onPatch({ start: v })} />
        <PunchBox label="Вихід" value={draft.end} now={isToday && draft.end !== t ? t : null} onChange={(v) => onPatch({ end: v })} />
      </div>
      {diff !== 0 && (
        <p class={`punch-note ${diff < 0 ? 'less' : 'more'}`}>
          <Icon name={diff < 0 ? 'down2' : 'up'} size={15} />
          <span>
            {diff < 0 ? `На ${fmtMin(-diff)} менше` : `На ${fmtMin(diff)} більше`} за графік — норма на день {diff < 0 ? 'менша' : 'більша'}
            {dPieces >= 0.05 ? ` на ${fmt(dPieces)} шт` : ''}
          </span>
        </p>
      )}
    </section>
  );
}

function PunchBox({ label, value, now, onChange }) {
  return (
    <div class="punch-box">
      <label>
        <span class="punch-label">{label}</span>
        <input type="time" step="60" value={value} aria-label={`${label}, час`} onChange={(e) => e.currentTarget.value && onChange(e.currentTarget.value)} />
      </label>
      {now && (
        <button class="punch-now" onClick={() => onChange(now)} aria-label={`${label} — зараз, ${fmtTime(now)}`}>
          зараз
        </button>
      )}
    </div>
  );
}

// ---------- Темп зміни ----------

function Pace({ pace, res, isToday }) {
  if (!pace) return null;
  if (pace.state === 'before') {
    if (!isToday || pace.inMin > 12 * 60) return null;
    return (
      <div class="pace">
        <Icon name="clock" size={16} />
        <span>Зміна почнеться через {fmtMin(pace.inMin)}</span>
      </div>
    );
  }
  if (pace.state === 'after') {
    if (!isToday || !res.hasInput || !res.valid) return null;
    return (
      <div class="pace">
        <Icon name="check" size={16} />
        <span>Зміна завершилась — день уже в історії та статистиці</span>
      </div>
    );
  }
  const ahead = pace.diffPieces != null ? pace.diffPieces : null;
  return (
    <div class="pace live">
      <div class="pace-top">
        <span class="live-dot" />
        {res.hasInput && pace.pace != null ? (
          <span>
            <b>Темп {fmt(pace.pace, 0)}%</b>
            {ahead != null
              ? Math.abs(ahead) < 0.5
                ? ' · точно за графіком'
                : ahead > 0
                  ? ` · випереджаєте на ${fmt(ahead, 0)} шт`
                  : ` · відстаєте на ${fmt(-ahead, 0)} шт`
              : ` · прогноз ≈ ${fmt(pace.pace, 0)}% на кінець`}
          </span>
        ) : (
          <span>
            Зміна триває · лишилось <b>{fmtMin(pace.left)}</b>
          </span>
        )}
      </div>
      <div class="pace-bar" aria-hidden="true">
        <i style={{ width: `${Math.min(100, pace.frac * 100)}%` }} />
      </div>
      {res.hasInput && pace.expectedPieces != null && (
        <div class="pace-note">
          За графіком зараз ≈ {fmt(pace.expectedPieces, 0)} шт · лишилось {fmtMin(pace.left)}
        </div>
      )}
    </div>
  );
}

// ---------- Збереження ----------

function privacyText({ mode, provider }) {
  if (mode === 'cloud' && provider === 'norma') return 'Дані зберігаються самі у вашому акаунті. Бачите їх ви та адміністратор.';
  if (mode === 'cloud') return 'Дані зберігаються самі у вашому особистому розділі акаунта Claude. Бачите їх лише ви.';
  if (mode === 'connecting') return 'Дані зберігаються самі — спершу на телефоні, потім в акаунті.';
  return 'Дані зберігаються самі, лише на цьому телефоні. Нікуди не надсилаються.';
}

function SaveChip({ sync, dirty, invalid, blank, onClick }) {
  const cloud = sync.mode === 'cloud';
  let s;
  if (invalid) s = { tone: 'warn', icon: 'info', text: 'Не збережено' };
  else if (dirty || (cloud && sync.status === 'saving')) s = { tone: 'busy', icon: cloud ? 'cloud' : 'phone', text: 'Зберігаю…' };
  else if (cloud && sync.status === 'error') s = { tone: 'warn', icon: 'cloudOff', text: 'Лише на телефоні' };
  else if (sync.mode === 'connecting') s = { tone: '', icon: 'cloud', text: 'Підключаю…' };
  else if (blank) s = { tone: '', icon: cloud ? 'cloud' : 'phone', text: 'Автозбереження' };
  else s = { tone: 'ok', icon: cloud ? 'cloudCheck' : 'phone', text: cloud ? 'Збережено' : 'На телефоні' };
  return (
    <button class={`savechip ${s.tone}`} onClick={onClick} aria-label={`Збереження: ${s.text}`}>
      <Icon name={s.icon} size={15} />
      <span aria-live="polite">{s.text}</span>
    </button>
  );
}

function SyncSheet({ sync, settings, days, onClose }) {
  const real = Object.values(days).filter((r) => !r.sample).length;
  const at = sync.at ? new Date(sync.at) : null;
  const norma = sync.provider === 'norma';
  const where = {
    cloud: norma
      ? {
          icon: 'cloudCheck',
          title: 'У вашому акаунті',
          text: 'Кожна зміна записується сама за секунду — на сервер, у ваш акаунт. Увійдіть на іншому телефоні чи компʼютері — історія буде та сама. Без інтернету все записується на телефоні й дописується на сервер, щойно звʼязок зʼявиться. Ваші дані бачите ви та адміністратор, інші працівники — ні.',
        }
      : {
          icon: 'cloudCheck',
          title: 'В акаунті Claude',
          text: 'Кожна зміна записується сама за секунду — у ваш особистий розділ акаунта. Бачите ці дані лише ви: ні автор сторінки, ні інші люди доступу до них не мають. Відкрийте калькулятор на іншому телефоні чи компʼютері під тим самим акаунтом — історія буде та сама.',
        },
    connecting: { icon: 'cloud', title: 'Підключаю акаунт…', text: 'Поки що все записується на телефоні, а щойно акаунт підключиться — дані перенесуться туди.' },
    denied: norma
      ? { icon: 'phone', title: 'Запис на сервер закрито', text: 'Адміністратор закрив запис для вашого акаунта, тому зміни лишаються лише на цьому телефоні. Зверніться до керівника.' }
      : { icon: 'phone', title: 'На цьому телефоні', text: 'Сторінка не має дозволу зберігати дані в акаунті, тому вони лишаються лише в памʼяті цього браузера. Час від часу зберігайте резервну копію.' },
    local: {
      icon: 'phone',
      title: 'На цьому телефоні',
      text: 'Кожна зміна записується сама в памʼять цього браузера й нікуди не надсилається. Якщо почистити дані браузера чи змінити телефон — історія зникне, тож час від часу зберігайте резервну копію у файл.',
    },
  }[sync.mode] || {};
  return (
    <Sheet
      title="Збереження"
      sub="Кнопки «Зберегти» немає — усе записується саме"
      onClose={onClose}
      footer={
        <button class="btn soft block" onClick={() => backup(settings, days).then((r) => r === 'saved' && toast('Копію збережено')).catch((e) => toast(e.message, 'err'))}>
          <Icon name="download" size={18} /> Резервна копія у файл
        </button>
      }
    >
      <div class={`sync-hero ${sync.mode}`}>
        <span class="sync-ico">
          <Icon name={where.icon} size={22} />
        </span>
        <div>
          <b>{where.title}</b>
          <small>
            {sync.mode === 'cloud' && sync.status === 'error'
              ? 'Остання спроба не вдалась — дані на телефоні, повторю сам'
              : sync.mode === 'cloud' && sync.status === 'saving'
                ? 'Записую…'
                : at
                  ? `Синхронізовано о ${fmtTime(at.toTimeString().slice(0, 5))}`
                  : `${real} ${plural(real, ['день', 'дні', 'днів'])} в історії`}
          </small>
        </div>
      </div>
      <p class="sync-text">{where.text}</p>
      <div class="sync-facts">
        <div>
          <span>Днів в історії</span>
          <b>{real}</b>
        </div>
        <div>
          <span>Моїх виробів</span>
          <b>{settings.products.length}</b>
        </div>
      </div>
    </Sheet>
  );
}

const SNOOZE_KEY = 'norma.v2.backup-snooze';
const DAY_MS = 864e5;

/** Коли дані лише на телефоні — раз на два тижні нагадати про резервну копію. */
function BackupNudge({ mode, settings, days }) {
  const [hidden, setHidden] = useState(false);
  if (hidden || (mode !== 'local' && mode !== 'denied')) return null;
  const real = Object.values(days).filter((r) => !r.sample).length;
  const now = Date.now();
  const last = store(BACKUP_KEY) || 0;
  if (real < 7 || now - last < 14 * DAY_MS || (store(SNOOZE_KEY) || 0) > now) return null;
  return (
    <section class="card tip-card nudge">
      <div class="tip-head">
        <span class="head-ico warn">
          <Icon name="download" size={17} />
        </span>
        <b>{last ? `Остання копія — ${Math.floor((now - last) / DAY_MS)} дн. тому` : 'Ще жодної резервної копії'}</b>
      </div>
      <p>
        {real} {plural(real, ['день', 'дні', 'днів'])} історії зберігаються лише в цьому браузері. Збережіть копію у файл — і нічого не загубиться, навіть якщо змінити телефон.
      </p>
      <div class="row">
        <button
          class="btn ghost"
          onClick={() => {
            store(SNOOZE_KEY, now + 7 * DAY_MS);
            setHidden(true);
          }}
        >
          Пізніше
        </button>
        <button
          class="btn primary grow"
          onClick={() =>
            backup(settings, days)
              .then((r) => {
                if (r !== 'saved') return;
                toast('Копію збережено', 'ok', 'check');
                setHidden(true);
              })
              .catch((e) => toast(e.message, 'err'))
          }
        >
          <Icon name="download" size={18} /> Зберегти копію
        </button>
      </div>
    </section>
  );
}

// ---------- Цей день серед інших ----------

const signed = (x) => `${x > 0 ? '+' : x < 0 ? '−' : '±'}${fmt(Math.abs(x), 1)}%`;

function DayContext({ days, date, record, res, goal, isToday }) {
  const data = useMemo(() => {
    if (!res.valid || !res.hasInput) return null;
    const others = Object.fromEntries(Object.entries(days).filter(([d]) => d !== date));
    if (!Object.keys(others).length) return null;
    const all = { ...others, [date]: record };
    return {
      cmp: compareDay(others, date, goal),
      rank: rankInMonth(all, date),
      run: streak(all, goal, isToday ? openDayOf(all, date) : null).cur,
    };
  }, [days, date, record, res.valid, res.hasInput, goal, isToday]);
  if (!data) return null;
  const { cmp, rank, run } = data;
  const pct = res.pct;
  const tiles = [];
  if (cmp.prev) {
    const near = cmp.prev.date === addDays(date, -1);
    tiles.push({ label: near && isToday ? 'Вчора' : 'Попередній', value: cmp.prev.pct, sub: fmtShortDate(cmp.prev.date) });
  }
  if (cmp.avg30 && cmp.avg30.n >= 2) tiles.push({ label: 'Середнє', value: cmp.avg30.pct, sub: `${cmp.avg30.n} ${plural(cmp.avg30.n, ['день', 'дні', 'днів'])} до того` });
  if (cmp.best) tiles.push({ label: 'Рекорд', value: cmp.best.pct, sub: fmtShortDate(cmp.best.date), best: true });
  if (!tiles.length) return null;
  const isRecord = cmp.best && pct > cmp.best.pct + 0.05;
  const monthName = MONTHS_GEN[fromISO(date).getMonth()];
  return (
    <section class="card">
      <CardHead icon="chart" title={isToday ? 'Сьогодні серед інших днів' : 'Цей день серед інших'} aside={`${pctText(pct)}%`} />
      <div class="ctx-grid">
        {tiles.map((t) => {
          const d = pct - t.value;
          return (
            <div class="ctx-tile">
              <span class="ctx-label">{t.label}</span>
              <b class="ctx-value">{pctText(t.value)}%</b>
              <span class="ctx-sub">{t.sub}</span>
              {t.best && isRecord ? (
                <span class="ctx-delta up">
                  <Icon name="trophy" size={12} /> рекорд
                </span>
              ) : (
                <span class={`ctx-delta ${Math.abs(d) < 0.05 ? '' : d > 0 ? 'up' : 'down'}`}>{signed(d)}</span>
              )}
            </div>
          );
        })}
      </div>
      <div class="ctx-notes">
        {rank && rank.of >= 3 && (
          <span>
            <Icon name="trophy" size={15} />
            {rank.place === 1 ? `Найкращий день ${monthName}` : `${rank.place}-е місце з ${rank.of} днів ${monthName}`}
          </span>
        )}
        {run >= 2 && (
          <span>
            <Icon name="flame" size={15} />
            {run} {plural(run, ['день', 'дні', 'днів'])} поспіль {goal === 100 ? 'з нормою' : `з метою ${goal}%`}
          </span>
        )}
      </div>
    </section>
  );
}

// ---------- Виріб ----------

function ProductItem({ p, idx, line, res, onChange, onRemove, onPick, onFix }) {
  const norm = num(p.norm);
  const single = res.active.length === 1 && norm > 0;
  const lvl = single && line ? level(line.pct, 100) : 'idle';
  const focusNorm = () => setTimeout(() => document.querySelector(`[data-pkey="${p.key}"] .numbox input`)?.focus(), 30);
  let meter = null;
  if (!norm && p.approx)
    meter = (
      <p class="pm-hint">
        Впишіть приблизну норму — коли зʼявиться точна, її можна буде уточнити.{' '}
        <button class="link inline" onClick={() => onChange({ approx: false })}>
          Скасувати
        </button>
      </p>
    );
  else if (!norm)
    meter = (
      <p class="pm-hint">
        Вкажіть норму за зміну — і побачите відсоток.{' '}
        <button
          class="link inline"
          onClick={() => {
            onChange({ approx: true });
            focusNorm();
          }}
        >
          Норми ще немає?
        </button>
      </p>
    );
  else if (!res.valid) meter = null;
  else if (single)
    meter = (
      <div class="pmeter">
        <div class="pm-row">
          <span>Норма на сьогодні {fmt(line.dayNorm)} шт</span>
          <b class={`lv-text ${lvl}`}>{pctText(line.pct)}%</b>
        </div>
        <div class={`bar lv-${lvl}`}>
          <i style={{ width: `${Math.min(100, line.pct)}%` }} />
        </div>
      </div>
    );
  else {
    const share = res.avail > 0 ? (line.minutes / res.avail) * 100 : 0;
    meter = (
      <div class="pmeter">
        <div class="pm-row">
          <span>Нормо-час {fmtMin(line.minutes)}</span>
          <b>{fmt(share, 0)}% дня</b>
        </div>
        <div class="bar lv-accent">
          <i style={{ width: `${Math.min(100, share)}%` }} />
        </div>
      </div>
    );
  }
  return (
    <div class="pitem" data-pkey={p.key}>
      <div class="pitem-top">
        <button class="pname" onClick={onPick}>
          <span class={`pname-text ${p.name ? '' : 'ph'}`}>{p.name || `Виріб ${idx + 1}`}</span>
          <Icon name="down" size={16} class="faint" />
        </button>
        <button class="icon-btn" onClick={onRemove} aria-label="Прибрати виріб">
          <Icon name="x" size={18} />
        </button>
      </div>
      <div class="pitem-grid">
        <label class="mini">
          <span class="mini-label">Норма за зміну</span>
          <span class={`numbox ${p.approx ? 'approx' : ''}`}>
            {p.approx && <i class="approx-sign">≈</i>}
            <input
              inputMode="decimal"
              value={p.norm}
              placeholder="—"
              aria-label="Норма за зміну, шт"
              onFocus={(e) => e.currentTarget.select()}
              onInput={(e) => onChange({ norm: cleanNum(e.currentTarget.value) })}
            />
            <em>шт</em>
          </span>
        </label>
        <div class="mini">
          <span class="mini-label">Зроблено</span>
          <Stepper value={p.qty} onChange={(v) => onChange({ qty: v })} label="Зроблено, шт" />
        </div>
      </div>
      {meter}
      {p.approx && norm > 0 && (
        <div class="approx-note">
          <span>Норма приблизна — відсоток орієнтовний</span>
          <button class="btn soft small" onClick={onFix}>
            Уточнити
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- Простій та інші роботи ----------

function TimeCard({ kind, items, total, onAdd, onEdit, onRemove }) {
  const down = kind === 'down';
  return (
    <section class={`card tcard-${kind}`}>
      <CardHead icon={down ? 'pause' : 'wrench'} tone={down ? 'warn' : 'teal'} title={down ? 'Простій' : 'Інші роботи'} aside={total > 0 ? `${down ? '−' : '+'}${fmtMin(total)}` : null} />
      {!items.length && (
        <p class="card-hint">
          {down ? 'Коли працювати не було змоги: зменшує робочий час і норму на день.' : 'Робота не з виробами. Зараховується година в годину: 1 год = 1 год норми.'}
        </p>
      )}
      {items.length > 0 && (
        <div class="tlist">
          {items.map((it) => (
            <div class="trow" key={it.key}>
              <button class="trow-main" onClick={() => onEdit(it)}>
                <span class={`tdot ${kind}`} />
                <span class="tname">{down ? it.reason : it.kind}</span>
                <span class={`tmin ${kind}`}>{fmtMin(it.min)}</span>
              </button>
              <button class="icon-btn" onClick={() => onRemove(it.key)} aria-label="Прибрати">
                <Icon name="x" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button class={`add-btn ${kind}`} onClick={onAdd}>
        <Icon name="plus" size={18} /> {down ? 'Додати простій' : 'Додати інші роботи'}
      </button>
    </section>
  );
}

function TimeSheet({ kind, item, draft, base, settings, setSettings, onSave, onDelete, onClose }) {
  const down = kind === 'down';
  const field = down ? 'downReasons' : 'otherKinds';
  const list = settings[field];
  const first = item ? (down ? item.reason : item.kind) : '';
  const [name, setName] = useState(first && list.includes(first) ? first : '');
  const [customOn, setCustomOn] = useState(Boolean(first && !list.includes(first)));
  const [custom, setCustom] = useState(first && !list.includes(first) ? first : '');
  const [min, setMin] = useState(item ? item.min : down ? 15 : 60);
  const options = down ? DOWN_MINUTES : OTHER_MINUTES;
  const chosen = (customOn ? custom : name).trim();
  const ok = chosen && min > 0;

  // як зміниться день із цим записом
  const without = { ...draft, downtime: draft.downtime.filter((x) => x.key !== item?.key), others: draft.others.filter((x) => x.key !== item?.key) };
  const before = computeDay(without, base);
  const rest = down ? 0 : Math.max(0, before.avail - before.otherMin);
  const withIt = down
    ? { ...without, downtime: [...without.downtime, { reason: chosen, min }] }
    : { ...without, others: [...without.others, { kind: chosen, min }] };
  const after = computeDay(withIt, base);

  function submit() {
    if (!ok) return;
    if (customOn && !list.includes(chosen)) {
      setSettings((s) => {
        const l = s[field].filter((x) => x !== 'Інше');
        return { ...s, [field]: [...l, chosen, ...(s[field].includes('Інше') ? ['Інше'] : [])] };
      });
    }
    onSave({ key: item?.key || newKey(), [down ? 'reason' : 'kind']: chosen, min: Math.round(min) });
  }

  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  const setHM = (hh, mm) => setMin(Math.max(0, Math.min(1440, Math.round(num(hh) * 60 + num(mm)))));

  return (
    <Sheet
      title={item ? (down ? 'Простій' : 'Інші роботи') : down ? 'Додати простій' : 'Додати інші роботи'}
      sub={down ? 'Час, коли не було змоги працювати' : 'Зараховується година в годину'}
      onClose={onClose}
      tall
      footer={
        <>
          {ok && after.valid && (
            <div class={`effect ${down ? 'down' : 'other'}`}>
              <Icon name={down ? 'pause' : 'zap'} size={18} />
              <span>
                {down ? (
                  <>
                    Робочий час стане <b>{fmtMin(after.avail)}</b>
                    {after.hasInput && (
                      <>
                        , виконання <b>{fmt(after.pct, 1)}%</b>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    +{fmtMin(min)} нормо-часу → виконання <b>{fmt(after.pct, 1)}%</b>
                  </>
                )}
              </span>
            </div>
          )}
          {ok && !after.valid && <div class="effect bad">Простій забере весь робочий час — перевірте хвилини</div>}
          <div class="row">
            {item && (
              <button class="btn ghost danger-text sq" onClick={() => onDelete(item.key)} aria-label="Видалити">
                <Icon name="trash" />
              </button>
            )}
            <button class="btn primary grow" disabled={!ok} onClick={submit}>
              {!chosen ? (down ? 'Оберіть причину' : 'Оберіть, що робили') : `${item ? 'Зберегти' : 'Додати'} · ${minutesLabel(min)}`}
            </button>
          </div>
        </>
      }
    >
      <div class="sec-label">{down ? 'Причина' : 'Що робили'}</div>
      <div class="choices">
        {list.map((x) => (
          <button
            class={`choice ${!customOn && name === x ? 'on' : ''}`}
            onClick={() => {
              setName(x);
              setCustomOn(false);
            }}
          >
            {x}
          </button>
        ))}
        <button class={`choice add ${customOn ? 'on' : ''}`} onClick={() => setCustomOn(true)}>
          <Icon name="plus" size={16} /> Своє
        </button>
      </div>
      {customOn && (
        <input
          class="input"
          data-autofocus
          maxLength={60}
          placeholder={down ? 'Напр.: чекали на крани' : 'Напр.: фарбування стенду'}
          value={custom}
          onInput={(e) => setCustom(e.currentTarget.value)}
        />
      )}

      <div class="sec-label">Скільки часу</div>
      <div class="minutes">
        {options.map((x) => (
          <button class={`mchip ${min === x ? 'on' : ''}`} onClick={() => setMin(x)}>
            {minutesLabel(x)}
          </button>
        ))}
        {!down && rest > 0 && !options.includes(rest) && (
          <button class={`mchip wide ${min === rest ? 'on' : ''}`} onClick={() => setMin(rest)}>
            Уся решта зміни · {fmtMin(rest)}
          </button>
        )}
      </div>
      <div class="hm">
        <span>Точно:</span>
        <label class="hm-box">
          <input inputMode="numeric" value={h ? String(h) : ''} placeholder="0" aria-label="Годин" onFocus={(e) => e.currentTarget.select()} onInput={(e) => setHM(e.currentTarget.value.replace(/\D/g, ''), m)} />
          <em>год</em>
        </label>
        <label class="hm-box">
          <input inputMode="numeric" value={m ? String(m) : ''} placeholder="0" aria-label="Хвилин" onFocus={(e) => e.currentTarget.select()} onInput={(e) => setHM(h, e.currentTarget.value.replace(/\D/g, ''))} />
          <em>хв</em>
        </label>
      </div>

    </Sheet>
  );
}

// ---------- Зміна ----------

function ShiftSheet({ draft, res, settings, setSettings, onApply, onClose }) {
  const [naming, setNaming] = useState(false);
  const [newName, setNewName] = useState('');
  const match = settings.shifts.find((s) => s.name === draft.shiftName);
  // вхід і вихід — фактичні (по прохідній); назва зміни лишається, бо від неї перерва і статистика за змінами
  const setTime = (p) => onApply(p);
  function saveAsPreset() {
    const name = newName.trim();
    if (!name) return;
    setSettings((s) => ({ ...s, shifts: [...s.shifts, { id: newKey(), name, start: draft.start, end: draft.end, brk: num(draft.brk) }] }));
    onApply({ shiftName: name });
    setNaming(false);
  }
  return (
    <Sheet
      title="Зміна"
      sub="Від зміни — перерва; вхід і вихід вказуєте фактичні"
      onClose={onClose}
      tall
      footer={
        <button class="btn primary block" onClick={onClose}>
          Готово
        </button>
      }
    >
      <div class="presets">
        {settings.shifts.map((s) => {
          const on = s.name === draft.shiftName;
          return (
            <button
              class={`preset ${on ? 'on' : ''}`}
              key={s.id}
              onClick={() => {
                onApply({ shiftName: s.name, start: s.start, end: s.end, brk: s.brk });
                onClose();
              }}
            >
              <span class="preset-main">
                <b>{s.name}</b>
                <small>
                  {fmtTime(s.start)}–{fmtTime(s.end)} · перерва {fmtMin(s.brk)}
                </small>
              </span>
              <span class="preset-work">{fmtMin(shiftLength(s.start, s.end) - s.brk)}</span>
              <span class="preset-check">{on && <Icon name="check" size={18} />}</span>
            </button>
          );
        })}
        <button class={`preset ${!match ? 'on' : ''}`} onClick={() => onApply({ shiftName: '' })}>
          <span class="preset-main">
            <b>Свій час</b>
            <small>Без графіка — лише вхід, вихід і перерва</small>
          </span>
          <span class="preset-work" />
          <span class="preset-check">{!match && <Icon name="check" size={18} />}</span>
        </button>
      </div>

      <div class="sec-label">Вхід і вихід по прохідній</div>
      <div class="grid2">
        <label class="field">
          <span class="field-label">Вхід</span>
          <input class="input time" type="time" step="300" value={draft.start} onChange={(e) => e.currentTarget.value && setTime({ start: e.currentTarget.value })} />
        </label>
        <label class="field">
          <span class="field-label">Вихід</span>
          <input class="input time" type="time" step="300" value={draft.end} onChange={(e) => e.currentTarget.value && setTime({ end: e.currentTarget.value })} />
        </label>
      </div>
      <div class="grid2">
        <label class="field">
          <span class="field-label">Перерва, хв</span>
          <input
            class="input"
            inputMode="numeric"
            value={String(num(draft.brk))}
            onFocus={(e) => e.currentTarget.select()}
            onInput={(e) => onApply({ brk: Math.min(600, num(e.currentTarget.value.replace(/\D/g, ''))) })}
          />
        </label>
        <div class="work-box">
          <span>Роботи</span>
          <b>{res.workMin > 0 ? fmtMin(res.workMin) : '—'}</b>
        </div>
      </div>
      {res.shiftMin > 0 && toMinutesSafe(draft.end) <= toMinutesSafe(draft.start) && <p class="hint">Зміна переходить через північ — це враховано.</p>}

      {match && (match.start !== draft.start || match.end !== draft.end) && (
        <p class="hint">
          За графіком «{match.name}» {fmtTime(match.start)}–{fmtTime(match.end)}. Рахується фактичний час: {fmtTime(draft.start)}–{fmtTime(draft.end)}.
        </p>
      )}
      {!match && res.workMin > 0 && !naming && (
        <button class="link" onClick={() => setNaming(true)}>
          <Icon name="bookmark" size={16} /> Зберегти цей час як нову зміну
        </button>
      )}
      {naming && (
        <div class="inline-form">
          <input class="input" data-autofocus maxLength={40} placeholder="Назва зміни, напр.: Нічна" value={newName} onInput={(e) => setNewName(e.currentTarget.value)} />
          <button class="btn primary" disabled={!newName.trim()} onClick={saveAsPreset}>
            Зберегти
          </button>
        </div>
      )}
    </Sheet>
  );
}

const toMinutesSafe = (t) => {
  const [h, m] = String(t || '').split(':').map(Number);
  return h * 60 + m;
};

// ---------- Вибір виробу ----------

function ProductSheet({ item, settings, setSettings, days, onApply, onClose }) {
  const [name, setName] = useState(item?.name || '');
  const [q, setQ] = useState('');
  const saved = settings.products;
  const norm = num(item?.norm);
  const recent = useMemo(() => {
    const seen = new Map();
    Object.values(days)
      .filter((r) => !r.sample)
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach((r) =>
        r.products.forEach((p) => {
          const k = `${p.name}|${p.norm}`;
          if (p.name && !seen.has(k) && !saved.some((s) => s.name === p.name && s.norm === p.norm)) seen.set(k, p);
        }),
      );
    return [...seen.values()].slice(0, 8);
  }, [days, saved]);
  if (!item) return null;
  const needle = q.trim().toLowerCase();
  const list = needle ? saved.filter((s) => s.name.toLowerCase().includes(needle)) : saved;
  const canSave = name.trim() && norm > 0 && !saved.some((s) => s.name === name.trim() && s.norm === norm);
  const save = (p) => setSettings((s) => ({ ...s, products: [...s.products, { id: newKey(), name: p.name.trim(), norm: p.norm, ...(p.approx ? { approx: true } : {}) }] }));
  const apply = (p) => {
    onApply({ name: p.name, norm: String(p.norm).replace('.', ','), approx: !!p.approx });
    onClose();
  };
  return (
    <Sheet
      title="Виріб"
      sub="Оберіть зі збережених або дайте коротку назву"
      onClose={onClose}
      tall
      footer={
        <button
          class="btn primary block"
          onClick={() => {
            onApply({ name: name.trim() });
            onClose();
          }}
        >
          Готово
        </button>
      }
    >
      <label class="field">
        <span class="field-label">Назва в цьому рядку</span>
        <input class="input" maxLength={60} placeholder="Можна скорочено, напр.: Корпус К-12" value={name} onInput={(e) => setName(e.currentTarget.value)} />
      </label>
      {canSave && (
        <button
          class="link"
          onClick={() => {
            save({ name, norm, approx: item.approx });
            onApply({ name: name.trim() });
          }}
        >
          <Icon name="bookmark" size={16} /> Зберегти «{name.trim()}» · {item.approx ? '≈' : ''}
          {fmt(norm)} шт у мої вироби
        </button>
      )}
      <Toggle
        label="Норма приблизна"
        hint="Поки офіційної норми немає. Коли зʼявиться — уточните, і дні з цим виробом перерахуються"
        checked={!!item.approx}
        onChange={(v) => onApply({ approx: v })}
      />

      {saved.length > 0 && (
        <>
          <div class="sec-label">Мої вироби</div>
          {saved.length > 7 && (
            <div class="search">
              <Icon name="search" size={18} />
              <input type="search" placeholder="Пошук" value={q} onInput={(e) => setQ(e.currentTarget.value)} />
            </div>
          )}
          <div class="list">
            {list.map((sp) => (
              <button class="lrow" key={sp.id} onClick={() => apply(sp)}>
                <span class="lrow-name">{sp.name || 'Без назви'}</span>
                <em>
                  {sp.approx ? '≈' : ''}
                  {fmt(sp.norm)} шт
                </em>
              </button>
            ))}
            {!list.length && <p class="hint">Нічого не знайдено</p>}
          </div>
        </>
      )}

      {recent.length > 0 && (
        <>
          <div class="sec-label">Раніше вводили</div>
          <div class="list">
            {recent.map((p) => (
              <div class="lrow split">
                <button class="lrow-main" onClick={() => apply(p)}>
                  <span class="lrow-name">{p.name}</span>
                  <em>
                    {p.approx ? '≈' : ''}
                    {fmt(p.norm)} шт
                  </em>
                </button>
                <button class="icon-btn" onClick={() => save(p)} aria-label={`Зберегти ${p.name}`}>
                  <Icon name="bookmark" size={17} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {!saved.length && !recent.length && (
        <div class="tip">
          <Icon name="bulb" size={18} />
          <span>Збережіть вироби, які робите найчастіше, — тоді назва й норма підставлятимуться одним дотиком.</span>
        </div>
      )}
    </Sheet>
  );
}

// ---------- Як пораховано ----------

export function Breakdown({ day, res, base }) {
  if (!res.valid) return <p class="hint">Перевірте час зміни та простій.</p>;
  return (
    <div class="bd">
      <div class="bd-sec">
        <div class="bd-title">
          <Icon name="clock" size={16} /> Робочий час
        </div>
        <div class="bd-row">
          <span>
            Вхід {fmtTime(day.start)} → вихід {fmtTime(day.end)}
          </span>
          <b>{fmtMin(res.shiftMin)}</b>
        </div>
        <div class="bd-row">
          <span>− перерва</span>
          <b>{fmtMin(res.brk)}</b>
        </div>
        {(day.downtime || []).map((d) => (
          <div class="bd-row">
            <span>− простій: {d.reason}</span>
            <b>{fmtMin(num(d.min))}</b>
          </div>
        ))}
        <div class="bd-row total">
          <span>Доступний час</span>
          <b>{fmtMin(res.avail)}</b>
        </div>
      </div>

      {res.active.length > 0 && (
        <div class="bd-sec">
          <div class="bd-title">
            <Icon name="box" size={16} /> Вироби
          </div>
          {res.otherMin > 0 && (
            <div class="bd-row">
              <span>Час на вироби (без інших робіт)</span>
              <b>{fmtMin(res.prodTime)}</b>
            </div>
          )}
          {res.active.map((l) => (
            <div class="bd-item">
              <b>{l.name || 'Виріб'}</b>
              <span>
                Норма {l.approx ? '≈' : ''}
                {fmt(l.norm)} шт{l.approx ? ' (приблизна)' : ''} на {fmtMin(base)} → на сьогодні {fmt(l.norm)} × {Math.round(res.prodTime)} / {base} ={' '}
                <b>{fmt(l.dayNorm)} шт</b>
              </span>
              <span>
                Зроблено {fmt(l.qty)} шт = <b>{fmt(l.minutes, 0)} нормо-хв</b>
              </span>
            </div>
          ))}
        </div>
      )}

      {res.otherMin > 0 && (
        <div class="bd-sec">
          <div class="bd-title">
            <Icon name="wrench" size={16} /> Інші роботи (година в годину)
          </div>
          {(day.others || []).map((o) => (
            <div class="bd-row">
              <span>{o.kind}</span>
              <b>{fmt(num(o.min), 0)} нормо-хв</b>
            </div>
          ))}
        </div>
      )}

      <div class="bd-total">
        <span>
          ({fmt(res.prodEarned, 0)}
          {res.otherMin > 0 && <> + {fmt(res.otherMin, 0)}</>}) нормо-хв / {fmt(res.avail, 0)} хв × 100
        </span>
        <b>{fmt(res.pct, 1)}%</b>
      </div>
    </div>
  );
}
