import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { addDays, fmt, fmtHM, fmtMin, fmtTime, fromISO, store, today } from '../util.js';
import { useApp, useNow } from './ctx.js';
import { buzz, confetti } from './fx.js';
import { Gauge } from './Gauge.jsx';
import {
  computeDay,
  DOWN_MINUTES,
  isBlank,
  level,
  minutesLabel,
  newKey,
  num,
  OTHER_MINUTES,
  paceAt,
  sameRecord,
  shiftLength,
  toGoal,
  toRecord,
} from './model.js';
import { ask, CardHead, cleanNum, Icon, Sheet, Stepper, toast } from './ui.jsx';

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
    `${WEEKDAYS[d.getDay()].charAt(0).toUpperCase() + WEEKDAYS[d.getDay()].slice(1)}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]} · ${day.shiftName || 'зміна'} ${fmtTime(day.start)}–${fmtTime(day.end)}`,
  ];
  for (const l of res.active) lines.push(`${l.name || 'Виріб'}: ${fmt(l.qty)} шт (норма ${fmt(l.norm)} за зміну)`);
  for (const x of day.downtime || []) lines.push(`Простій: ${x.reason} — ${fmtMin(num(x.min))}`);
  for (const x of day.others || []) lines.push(`Інші роботи: ${x.kind} — ${fmtMin(num(x.min))}`);
  lines.push(`Виконання норми: ${fmt(res.pct, 1)}%`);
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
  const { settings, setSettings, days, draft, setDraft, saveDay, switchDate, openSettings } = useApp();
  const now = useNow(30000);
  const base = settings.base;
  const goal = settings.goal;
  const res = useMemo(() => computeDay(draft, base), [draft, base]);
  const record = useMemo(() => toRecord(draft, base), [draft, base]);
  const saved = days[draft.date];
  const dirty = saved ? saved.sample || !sameRecord(record, saved) : !isBlank(draft);
  const isToday = draft.date === today();
  const pace = useMemo(() => paceAt(draft, res, now), [draft, res, now]);
  const lv = res.hasInput && res.valid ? level(res.pct, goal) : 'idle';
  const status = statusOf(res, goal, base);
  const [sheet, setSheet] = useState(null);
  const [tip, setTip] = useState(() => !store(TIP_KEY) && !Object.keys(days).length);
  const title = dateTitle(draft.date);
  const canSave = res.valid && (res.hasInput || res.active.length > 0);

  // Конфеті, коли під час введення вперше перетнули мету за цей день
  const prev = useRef(res.pct);
  const fired = useRef(new Set());
  useEffect(() => {
    const was = prev.current;
    prev.current = res.pct;
    if (!settings.celebrate || !res.hasInput || res.error) return;
    if (was < goal - 0.05 && res.pct >= goal - 0.05 && !fired.current.has(draft.date)) {
      fired.current.add(draft.date);
      confetti({ y: 0.22, count: 110 });
      buzz(25);
    }
  }, [res.pct]);

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const setProduct = (key, p) => setDraft((d) => ({ ...d, products: d.products.map((x) => (x.key === key ? { ...x, ...p } : x)) }));
  const focusQty = (key) => setTimeout(() => document.querySelector(`[data-pkey="${key}"] .step-input`)?.focus(), 80);

  function addProduct(from) {
    let target;
    setDraft((d) => {
      const empty = d.products.find((p) => !p.name && !num(p.norm) && !num(p.qty));
      const filled = from ? { name: from.name, norm: String(from.norm).replace('.', ',') } : {};
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
      text: saved ? 'Збережений запис цього дня не зміниться, доки ви його не оновите.' : 'Кількості, простій та інші роботи буде прибрано.',
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
          <span>{saved ? (saved.sample ? 'Це день із прикладу. Збережіть, щоб зробити його своїм.' : 'Ви редагуєте збережений день.') : 'Запис за минулий день.'}</span>
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
        <Pace pace={pace} res={res} isToday={isToday} dirty={dirty} saved={saved} />
        <button class="panel-how" onClick={() => setSheet({ type: 'how' })} disabled={!res.valid}>
          <Icon name="info" size={15} /> Як пораховано
        </button>
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
            <li>Наприкінці зміни натисніть «Зберегти день» — так зʼявиться ваша статистика.</li>
          </ol>
        </section>
      )}

      <button class="card shift-card" onClick={() => setSheet({ type: 'shift' })}>
        <span class="head-ico">
          <Icon name="clock" size={17} />
        </span>
        <span class="shift-main">
          <b>{draft.shiftName || 'Свій час'}</b>
          <small>
            {fmtTime(draft.start)}–{fmtTime(draft.end)} · перерва {fmtMin(num(draft.brk))}
          </small>
        </span>
        <span class="shift-work">
          <b>{res.workMin > 0 ? fmtMin(res.workMin) : '—'}</b>
          <small>роботи</small>
        </span>
        <Icon name="right" size={18} class="faint" />
      </button>

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
                  <em>{fmt(sp.norm)}</em>
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

      {!isBlank(draft) && (
        <button class="text-btn" onClick={clearDay}>
          <Icon name="reset" size={16} /> Очистити розрахунок
        </button>
      )}

      <p class="privacy">
        <Icon name="shield" size={16} />
        <span>Усе рахується й зберігається лише на цьому телефоні. Нічого нікуди не надсилається.</span>
      </p>

      <div class="savebar">
        <div class="savebar-in">
          <div class={`sb-pct lv-${lv}`}>
            <b>{fmt(res.pct, 1)}%</b>
            <small>{saved && !dirty ? 'збережено' : dirty ? 'не збережено' : 'сьогодні'}</small>
          </div>
          <button class="btn primary sb-btn" disabled={!canSave || (saved && !dirty)} onClick={saveDay}>
            {saved && !dirty ? (
              <>
                <Icon name="check" size={18} /> Збережено
              </>
            ) : saved && !saved.sample ? (
              'Оновити день'
            ) : (
              'Зберегти день'
            )}
          </button>
        </div>
      </div>

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

// ---------- Темп зміни ----------

function Pace({ pace, res, isToday, dirty, saved }) {
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
    if (!isToday || !(dirty || !saved) || !res.hasInput) return null;
    return (
      <div class="pace attention">
        <Icon name="check" size={16} />
        <span>Зміна завершилась — збережіть день, щоб він потрапив у статистику</span>
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

// ---------- Виріб ----------

function ProductItem({ p, idx, line, res, onChange, onRemove, onPick }) {
  const norm = num(p.norm);
  const single = res.active.length === 1 && norm > 0;
  const lvl = single && line ? level(line.pct, 100) : 'idle';
  let meter = null;
  if (!norm) meter = <p class="pm-hint">Вкажіть норму за зміну — і побачите відсоток</p>;
  else if (!res.valid) meter = null;
  else if (single)
    meter = (
      <div class="pmeter">
        <div class="pm-row">
          <span>Норма на сьогодні {fmt(line.dayNorm)} шт</span>
          <b class={`lv-text ${lvl}`}>{fmt(line.pct, 1)}%</b>
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
          <span class="numbox">
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
    </div>
  );
}

// ---------- Простій та інші роботи ----------

function TimeCard({ kind, items, total, onAdd, onEdit, onRemove }) {
  const down = kind === 'down';
  return (
    <section class="card">
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
  const match = settings.shifts.find((s) => s.start === draft.start && s.end === draft.end && s.brk === num(draft.brk));
  const setTime = (p) => {
    const next = { ...draft, ...p };
    const preset = settings.shifts.find((s) => s.start === next.start && s.end === next.end);
    onApply({ ...p, shiftName: preset ? preset.name : '' });
  };
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
      sub="Оберіть зміну або вкажіть свій час"
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
          const on = s.start === draft.start && s.end === draft.end && s.brk === num(draft.brk);
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
      </div>

      <div class="sec-label">Свій час на цей день</div>
      <div class="grid2">
        <label class="field">
          <span class="field-label">Початок</span>
          <input class="input time" type="time" step="300" value={draft.start} onChange={(e) => e.currentTarget.value && setTime({ start: e.currentTarget.value })} />
        </label>
        <label class="field">
          <span class="field-label">Кінець</span>
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
  const save = (p) => setSettings((s) => ({ ...s, products: [...s.products, { id: newKey(), name: p.name.trim(), norm: p.norm }] }));
  const apply = (p) => {
    onApply({ name: p.name, norm: String(p.norm).replace('.', ',') });
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
            save({ name, norm });
            onApply({ name: name.trim() });
          }}
        >
          <Icon name="bookmark" size={16} /> Зберегти «{name.trim()}» · {fmt(norm)} шт у мої вироби
        </button>
      )}

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
                <em>{fmt(sp.norm)} шт</em>
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
                  <em>{fmt(p.norm)} шт</em>
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
            Зміна {fmtTime(day.start)}–{fmtTime(day.end)}
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
                Норма {fmt(l.norm)} шт на {fmtMin(base)} → на сьогодні {fmt(l.norm)} × {Math.round(res.prodTime)} / {base} ={' '}
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
