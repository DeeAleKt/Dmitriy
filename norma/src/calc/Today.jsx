import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { addDays, fmt, fmtHM, fmtMin, fmtTime, fromISO, pad, plural, store, today } from '../util.js';
import { useApp, useNow } from './ctx.js';
import { backup, BACKUP_KEY } from './files.js';
import { buzz, confetti } from './fx.js';
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
  piecesToGoal,
  rankInMonth,
  sameRecord,
  shiftLength,
  streak,
  toGoal,
  toRecord,
  wholePieces,
} from './model.js';
import { ask, CardHead, cleanNum, Icon, Sheet, Stepper, toast, Toggle, useTween } from './ui.jsx';

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
  for (const x of day.downtime || []) lines.push(`${withWhy('Простій', x.reason)} — ${fmtMin(num(x.min))}`);
  for (const x of day.others || []) lines.push(`${withWhy('Інша робота', x.kind)} — ${fmtMin(num(x.min))}`);
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

/** Головний рядок під відсотком: що зробити далі або скільки ще лишилось. */
function statusOf(res, goal, base) {
  if (res.error === 'shift') return { icon: 'clock', text: 'Вкажіть час зміни' };
  if (res.error === 'break') return { icon: 'info', text: 'Перерва довша за зміну' };
  if (res.error === 'downtime') return { icon: 'pause', text: 'Простій забрав увесь час' };
  if (!res.active.length && !res.otherMin) return { icon: 'box', text: 'Впишіть норму виробу' };
  const g = toGoal(res, goal, base);
  if (!res.hasInput) {
    // норму вписали, а кількості ще немає — одразу скільки штук треба на всю зміну
    if (g.pieces == null) return { icon: 'box', text: 'Скільки зроблено?' };
    return { icon: 'target', text: `Для ${goal}% треба ${g.single.approx ? '≈' : ''}${wholePieces(g.pieces)} шт за зміну` };
  }
  if (res.error === 'other') return { icon: 'info', text: 'Інших робіт більше, ніж робочого часу' };
  const word = goal === 100 ? 'норми' : `мети ${goal}%`;
  if (g.minutes <= 0.01) {
    let extra = 0;
    if (g.single && res.otherMin === 0) extra = g.single.qty - (g.single.dayNorm * goal) / 100;
    if (goal !== 100) return { icon: 'sparkle', done: true, text: `Мету ${goal}% досягнуто` };
    return { icon: 'sparkle', done: true, text: extra >= 0.05 ? `Норму виконано · +${fmt(extra)} шт понад` : 'Норму виконано' };
  }
  if (g.pieces != null) return { icon: 'target', text: `До ${word} ще ${wholePieces(g.pieces)} шт` };
  return { icon: 'target', text: `До ${word} ще ${fmtMin(g.minutes)} роботи` };
}

export function Today() {
  const { settings, setSettings, days, draft, setDraft, sync, switchDate, openSettings, signIn } = useApp();
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
  // поки зміна триває, колір — за темпом: 60% о півдні при темпі 120% — це добре, а не «червоно»
  const live = isToday && pace?.state === 'live' && pace.pace != null;
  const lv = res.hasInput && res.valid ? level(live ? pace.pace : res.pct, goal) : 'idle';
  const status = statusOf(res, goal, base);
  const odd = oddDay(res);
  const approx = isApprox(record);
  const [sheet, setSheet] = useState(null);
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

  // Картку з відсотком прокрутили вгору (вводять кількість нижче) — згори зʼявляється її стисла копія
  const resultRef = useRef();
  const [mini, setMini] = useState(false);
  useEffect(() => {
    const el = resultRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setMini(!e.isIntersecting && e.boundingClientRect.top < 0), { rootMargin: '-48px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

  const removeTime = (field, key) => setDraft((d) => ({ ...d, [field]: d[field].filter((x) => x.key !== key) }));
  const checkOdd = () =>
    odd.why === 'time'
      ? setSheet({ type: 'shift' })
      : document.querySelector(odd.why === 'down' ? '.trow.down' : '.pitem .step-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <div class="screen today">
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
          <span>{saved?.sample ? 'День із прикладу — змініть щось, і він стане вашим' : 'Минулий день · зберігається сам'}</span>
          <button class="link" onClick={() => switchDate(today())}>
            До сьогодні
          </button>
        </div>
      )}

      <ResultCard
        boxRef={resultRef}
        res={res}
        goal={goal}
        lv={lv}
        status={status}
        pace={isToday ? pace : null}
        odd={odd}
        approx={approx}
        isToday={isToday}
        save={blank && !saved ? null : <SaveChip sync={sync} dirty={dirty} invalid={!blank && !res.valid} onClick={() => setSheet({ type: 'sync' })} />}
        onHow={() => setSheet({ type: 'how' })}
        onCheck={checkOdd}
      />
      <MiniBar show={mini} res={res} goal={goal} lv={lv} status={status} approx={approx} />

      <ShiftRow draft={draft} res={res} settings={settings} onOpen={() => setSheet({ type: 'shift' })} />

      <div class="plist">
        {draft.products.map((p, i) => (
          <ProductItem
            key={p.key}
            p={p}
            idx={i}
            line={res.lines[i]}
            res={res}
            base={base}
            goal={goal}
            onChange={(x) => setProduct(p.key, x)}
            onRemove={() => removeProduct(p)}
            onPick={() => setSheet({ type: 'product', key: p.key })}
            onFix={() => setSheet({ type: 'norm', key: p.key, name: p.name.trim() })}
          />
        ))}
      </div>

      {(draft.downtime.length > 0 || draft.others.length > 0) && (
        <div class="card tlist">
          {draft.downtime.map((it) => (
            <TimeRow key={it.key} kind="down" item={it} onEdit={() => setSheet({ type: 'time', kind: 'down', item: it })} onRemove={() => removeTime('downtime', it.key)} />
          ))}
          {draft.others.map((it) => (
            <TimeRow key={it.key} kind="other" item={it} onEdit={() => setSheet({ type: 'time', kind: 'other', item: it })} onRemove={() => removeTime('others', it.key)} />
          ))}
        </div>
      )}

      <div class="adds">
        <button class="add-chip" onClick={() => addProduct()}>
          <Icon name="plus" size={17} /> Виріб
        </button>
        <button class="add-chip down" onClick={() => setSheet({ type: 'time', kind: 'down' })}>
          <Icon name="pause" size={17} /> Простій
        </button>
        <button class="add-chip other" onClick={() => setSheet({ type: 'time', kind: 'other' })}>
          <Icon name="wrench" size={17} /> Інша робота
        </button>
      </div>

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

      <BackupNudge mode={sync.mode} settings={settings} days={days} />

      {isToday && <MonthCard days={days} settings={settings} date={draft.date} res={res} onGoal={() => setSheet({ type: 'mgoal' })} />}

      {!odd && <DayContext days={days} date={draft.date} record={record} res={res} goal={goal} isToday={isToday} />}

      {!blank && (
        <button class="text-btn" onClick={clearDay}>
          <Icon name="reset" size={16} /> Очистити розрахунок
        </button>
      )}

      <p class="privacy">
        <Icon name="shield" size={16} />
        <span>
          {privacyText(sync)}
          {signIn && (
            <>
              {' '}
              <button class="link inline" onClick={signIn}>
                Увійти в акаунт
              </button>
            </>
          )}
        </span>
      </p>

      {sheet?.type === 'how' && (
        <Sheet
          title="Як пораховано"
          sub={`${title.main} · ${fmtTime(draft.start)}–${fmtTime(draft.end)}`}
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
      {sheet?.type === 'sync' && <SyncSheet sync={sync} settings={settings} days={days} signIn={signIn} onClose={() => setSheet(null)} />}
      {sheet?.type === 'shift' && <ShiftSheet draft={draft} res={res} settings={settings} isToday={isToday} now={now} onApply={patch} onClose={() => setSheet(null)} />}
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
            removeTime(sheet.kind === 'down' ? 'downtime' : 'others', key);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}

// ---------- Результат ----------

/** Відсоток, що робити далі, смуга до норми і темп — усе, заради чого відкривають калькулятор. */
function ResultCard({ boxRef, res, goal, lv, status, pace, odd, approx, isToday, save, onHow, onCheck }) {
  const has = res.hasInput && res.valid;
  const shown = useTween(has ? res.pct : 0);
  const single = res.valid && res.active.length === 1 && res.otherMin === 0 ? res.active[0] : null;
  let sub = null;
  if (single) sub = `Норма на ${isToday ? 'сьогодні' : 'день'}: ${fmt(single.dayNorm, 2)} шт`;
  else if (has) sub = `Нормо-час ${fmtHM(res.earned)} з ${fmtHM(res.avail)}`;
  return (
    <section class={`result lv-${lv}`} ref={boxRef}>
      <div class="r-top">
        <button class="r-num" onClick={onHow} disabled={!res.valid} aria-label={`Виконання ${pctText(has ? res.pct : 0)}%. Як пораховано`}>
          {approx && <i>≈</i>}
          {pctText(shown, 1)}
          <small>%</small>
        </button>
        <div class="r-tools">
          {save}
          <button class="r-ico" onClick={onHow} disabled={!res.valid} aria-label="Як пораховано">
            <Icon name="info" size={18} />
          </button>
        </div>
      </div>
      <p class={`r-status ${status.done ? 'done' : ''}`}>
        <Icon name={status.icon} size={18} />
        <span>{status.text}</span>
      </p>
      {sub && <p class="r-sub">{sub}</p>}
      <ProgressBar res={res} goal={goal} pace={pace} />
      <PaceLine pace={pace} res={res} />
      {odd && (
        <div class="r-odd">
          <Icon name="info" size={17} />
          <span>
            <b>{fmt(res.pct, 0)}% — схоже на помилку.</b> {odd.text}.{' '}
            <button class="link inline" onClick={onCheck}>
              Перевірити
            </button>
          </span>
        </div>
      )}
    </section>
  );
}

/** Смуга до мети; біла риска — де за графіком маєте бути зараз. */
function ProgressBar({ res, goal, pace }) {
  const fill = res.hasInput && res.valid ? Math.min(100, (res.pct / goal) * 100) : 0;
  return (
    <div class="r-bar" aria-hidden="true">
      <i style={{ width: `${fill}%` }} />
      {pace?.state === 'live' && <b style={{ left: `${Math.min(100, pace.frac * 100)}%` }} />}
    </div>
  );
}

function PaceLine({ pace, res }) {
  if (!pace) return null;
  if (pace.state === 'before')
    return pace.inMin > 12 * 60 ? null : (
      <p class="r-pace">
        <Icon name="clock" size={15} />
        <span>Зміна почнеться через {fmtMin(pace.inMin)}</span>
      </p>
    );
  if (pace.state === 'after')
    return res.hasInput && res.valid ? (
      <p class="r-pace">
        <Icon name="check" size={15} />
        <span>Зміну завершено — день збережено</span>
      </p>
    ) : null;
  // один виріб — наскільки випереджаєте графік у штуках; кілька — темп (прогноз на кінець зміни)
  let text = 'Зміна триває';
  if (res.hasInput && pace.pace != null) {
    const d = pace.diffPieces;
    if (d == null) text = `Темп ${fmt(pace.pace, 0)}%`;
    else text = Math.abs(d) < 0.5 ? 'Точно за графіком' : d > 0 ? `Випереджаєте на ${fmt(d, 0)} шт` : `Відстаєте на ${fmt(-d, 0)} шт`;
  }
  return (
    <p class="r-pace">
      <span class="live-dot" />
      <span class="grow">{text}</span>
      <span class="r-left">ще {fmtMin(pace.left)}</span>
    </p>
  );
}

/** Стисла копія результату згори екрана, поки картка з відсотком прокручена. */
function MiniBar({ show, res, goal, lv, status, approx }) {
  const has = res.hasInput && res.valid;
  return (
    <div class={`r-mini lv-${lv} ${show ? 'on' : ''}`} aria-hidden="true" onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}>
      <div class="r-mini-in">
        <b>
          {approx ? '≈' : ''}
          {pctText(has ? res.pct : 0, 1)}%
        </b>
        <span>{status.text}</span>
      </div>
      <i style={{ width: `${has ? Math.min(100, (res.pct / goal) * 100) : 0}%` }} />
    </div>
  );
}

// ---------- Зміна: вхід і вихід ----------

const nowHM = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Один рядок: фактичні вхід–вихід і перерва; відхилення від графіка — позначкою. */
function ShiftRow({ draft, res, settings, onOpen }) {
  const preset = settings.shifts.find((s) => s.name === draft.shiftName);
  const diff = preset && res.workMin > 0 ? res.workMin - (shiftLength(preset.start, preset.end) - preset.brk) : 0;
  return (
    <button class="shift-row" onClick={onOpen} aria-label="Зміна: вхід, вихід і перерва">
      <span class="head-ico">
        <Icon name="clock" size={17} />
      </span>
      <span class="sr-main">
        <b>
          {fmtTime(draft.start)} – {fmtTime(draft.end)}
        </b>
        <small>
          {settings.shifts.length > 1 && draft.shiftName ? `${draft.shiftName} · ` : ''}перерва {fmtMin(num(draft.brk))}
        </small>
      </span>
      <span class="sr-work">
        <b>{res.workMin > 0 ? fmtMin(res.workMin) : '—'}</b>
        <small>
          роботи
          {Math.abs(diff) >= 1 && (
            <em class={diff < 0 ? 'less' : 'more'}>
              {' · '}
              {diff < 0 ? '−' : '+'}
              {fmtMin(Math.abs(diff))}
            </em>
          )}
        </small>
      </span>
      <Icon name="right" size={16} class="faint" />
    </button>
  );
}

// ---------- Збереження ----------

function privacyText({ mode, provider }) {
  if (mode === 'cloud' && provider === 'norma') return 'Зберігається само у вашому акаунті. Бачите ви та адміністратор.';
  if (mode === 'cloud') return 'Зберігається само в особистому розділі акаунта Claude.';
  if (mode === 'connecting') return 'Зберігається само — на телефоні, потім в акаунті.';
  return 'Зберігається само, лише на цьому телефоні.';
}

function SaveChip({ sync, dirty, invalid, onClick }) {
  const cloud = sync.mode === 'cloud';
  let s;
  if (invalid) s = { tone: 'warn', icon: 'info', text: 'Не збережено' };
  else if (dirty || (cloud && sync.status === 'saving')) s = { tone: 'busy', icon: cloud ? 'cloud' : 'phone', text: 'Зберігаю…' };
  else if (cloud && sync.status === 'error') s = { tone: 'warn', icon: 'cloudOff', text: 'Лише на телефоні' };
  else if (sync.mode === 'connecting') s = { tone: '', icon: 'cloud', text: 'Підключаю…' };
  else s = { tone: 'ok', icon: cloud ? 'cloudCheck' : 'phone', text: cloud ? 'Збережено' : 'На телефоні' };
  return (
    <button class={`savechip ${s.tone}`} onClick={onClick} aria-label={`Збереження: ${s.text}`}>
      <Icon name={s.icon} size={15} />
      <span aria-live="polite">{s.text}</span>
    </button>
  );
}

function SyncSheet({ sync, settings, days, signIn, onClose }) {
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
        <div class="foot-stack">
          {signIn && (
            <button
              class="btn primary block"
              onClick={() => {
                onClose();
                signIn();
              }}
            >
              Увійти в акаунт — дані на сервері
            </button>
          )}
          <button class="btn soft block" onClick={() => backup(settings, days).then((r) => r === 'saved' && toast('Копію збережено')).catch((e) => toast(e.message, 'err'))}>
            <Icon name="download" size={18} /> Резервна копія у файл
          </button>
        </div>
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

function ProductItem({ p, idx, line, res, base, goal, onChange, onRemove, onPick, onFix }) {
  const norm = num(p.norm);
  // кілька виробів (чи ще інші роботи) — частка кожного у відсотку дня; разом вони дають загальний відсоток
  const multi = res.active.length > 1 || res.otherMin > 0;
  const share = res.valid && multi && norm > 0 && line?.minutes > 0 ? (line.minutes / res.avail) * 100 : null;
  // одразу після норми видно, скільки штук треба на всю зміну — сірим у порожньому «Зроблено»
  const target = norm > 0 ? piecesToGoal(res, line, goal, base) : null;
  const focusNorm = () => setTimeout(() => document.querySelector(`[data-pkey="${p.key}"] .numbox input`)?.focus(), 30);
  return (
    <div class="pitem" data-pkey={p.key}>
      <div class="pitem-top">
        <button class="pname" onClick={onPick}>
          <span class={`pname-text ${p.name ? '' : 'ph'}`}>{p.name || `Виріб ${idx + 1}`}</span>
          <Icon name="down" size={16} class="faint" />
        </button>
        {share != null && <span class="p-share">{pctText(share, 0)}% дня</span>}
        {!multi && target != null && (
          <span class="p-share">
            {goal}% — {p.approx ? '≈' : ''}
            {target} шт
          </span>
        )}
        <button class="icon-btn" onClick={onRemove} aria-label="Прибрати виріб">
          <Icon name="x" size={18} />
        </button>
      </div>
      <div class="pitem-grid">
        <label class="mini">
          <span class="mini-label">Норма за {fmtMin(base)}</span>
          <span class={`numbox ${p.approx ? 'approx' : ''}`}>
            {p.approx && <i class="approx-sign">≈</i>}
            <input
              inputMode="decimal"
              value={p.norm}
              placeholder="—"
              aria-label={`Норма за ${fmtMin(base)}, шт`}
              onFocus={(e) => e.currentTarget.select()}
              onInput={(e) => onChange({ norm: cleanNum(e.currentTarget.value) })}
            />
            <em>шт</em>
          </span>
        </label>
        <div class="mini">
          <span class="mini-label">Зроблено</span>
          <Stepper
            value={p.qty}
            onChange={(v) => onChange({ qty: v })}
            label={target != null ? `Зроблено, шт (на ${goal}% треба ${target})` : 'Зроблено, шт'}
            placeholder={target != null ? String(target) : '0'}
          />
        </div>
      </div>
      {!norm && !p.approx && (
        <button
          class="link small p-hint"
          onClick={() => {
            onChange({ approx: true });
            focusNorm();
          }}
        >
          Норми ще немає?
        </button>
      )}
      {p.approx && (
        <div class="approx-note">
          <span>{norm > 0 ? 'Норма приблизна — відсоток орієнтовний' : 'Приблизна норма — потім уточните'}</span>
          {norm > 0 ? (
            <button class="btn soft small" onClick={onFix}>
              Уточнити
            </button>
          ) : (
            <button class="btn soft small" onClick={() => onChange({ approx: false })}>
              Скасувати
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Простій та інші роботи ----------

/** Причина необовʼязкова: без неї запис зберігається як «Інше», а в рядку — просто «Простій» чи «Інша робота». */
const timeName = (down, item) => {
  const name = down ? item.reason : item.kind;
  return !name || name === 'Інше' ? (down ? 'Простій' : 'Інша робота') : name;
};
const withWhy = (label, why) => (why && why !== 'Інше' ? `${label}: ${why}` : label);

function TimeRow({ kind, item, onEdit, onRemove }) {
  const down = kind === 'down';
  return (
    <div class={`trow ${kind}`}>
      <button class="trow-main" onClick={onEdit}>
        <span class={`tdot ${kind}`} />
        <span class="tname">{timeName(down, item)}</span>
        <span class={`tmin ${kind}`}>
          {down ? '−' : '+'}
          {fmtMin(item.min)}
        </span>
      </button>
      <button class="icon-btn" onClick={onRemove} aria-label="Прибрати">
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}

function TimeSheet({ kind, item, draft, base, settings, setSettings, onSave, onDelete, onClose }) {
  const down = kind === 'down';
  const field = down ? 'downReasons' : 'otherKinds';
  const list = settings[field].filter((x) => x !== 'Інше');
  const first = item ? (down ? item.reason : item.kind) : '';
  const own = Boolean(first && first !== 'Інше' && !list.includes(first));
  const [name, setName] = useState(list.includes(first) ? first : '');
  const [customOn, setCustomOn] = useState(own);
  const [custom, setCustom] = useState(own ? first : '');
  const [min, setMin] = useState(item ? item.min : down ? 15 : 60);
  const options = down ? DOWN_MINUTES : OTHER_MINUTES;
  const chosen = (customOn ? custom : name).trim();
  const ok = min > 0;

  // як зміниться день із цим записом
  const without = { ...draft, downtime: draft.downtime.filter((x) => x.key !== item?.key), others: draft.others.filter((x) => x.key !== item?.key) };
  const before = computeDay(without, base);
  const rest = down ? 0 : Math.max(0, before.avail - before.otherMin);
  const withIt = down ? { ...without, downtime: [...without.downtime, { min }] } : { ...without, others: [...without.others, { min }] };
  const after = computeDay(withIt, base);

  function submit() {
    if (!ok) return;
    if (customOn && chosen && !settings[field].includes(chosen)) {
      setSettings((s) => {
        const l = s[field].filter((x) => x !== 'Інше');
        return { ...s, [field]: [...l, chosen, ...(s[field].includes('Інше') ? ['Інше'] : [])] };
      });
    }
    onSave({ key: item?.key || newKey(), [down ? 'reason' : 'kind']: chosen || 'Інше', min: Math.round(min) });
  }

  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  const setHM = (hh, mm) => setMin(Math.max(0, Math.min(1440, Math.round(num(hh) * 60 + num(mm)))));

  return (
    <Sheet
      title={down ? 'Простій' : 'Інша робота'}
      sub={down ? 'Зменшує робочий час і норму на день' : 'Зараховується година в годину'}
      onClose={onClose}
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
                    Виконання стане <b>{fmt(after.pct, 1)}%</b>
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
              {ok ? `${item ? 'Зберегти' : 'Додати'} · ${minutesLabel(min)}` : 'Вкажіть час'}
            </button>
          </div>
        </>
      }
    >
      <div class="minutes tight">
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
      <div class="hm tight">
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

      <div class="sec-label">
        {down ? 'Причина' : 'Що робили'} <small>· за бажанням</small>
      </div>
      <div class="reasons">
        {list.map((x) => {
          const on = !customOn && name === x;
          return (
            <button
              class={`rchip ${on ? 'on' : ''}`}
              aria-pressed={on}
              onClick={() => {
                setName(on ? '' : x);
                setCustomOn(false);
              }}
            >
              {x}
            </button>
          );
        })}
        <button class={`rchip add ${customOn ? 'on' : ''}`} aria-pressed={customOn} onClick={() => setCustomOn(!customOn)}>
          <Icon name="plus" size={15} /> Своє
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
    </Sheet>
  );
}

// ---------- Зміна ----------

function ShiftSheet({ draft, res, settings, isToday, now, onApply, onClose }) {
  const plan = settings.shifts.find((s) => s.name === draft.shiftName) || settings.shifts[0];
  const off = plan && (plan.start !== draft.start || plan.end !== draft.end || plan.brk !== num(draft.brk));
  const t = isToday ? nowHM(now) : null;
  return (
    <Sheet
      title="Зміна"
      sub="Вхід і вихід — фактичні, по прохідній"
      onClose={onClose}
      footer={
        <button class="btn primary block" onClick={onClose}>
          Готово
        </button>
      }
    >
      {settings.shifts.length > 1 && (
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
        </div>
      )}

      <div class="grid2">
        <TimeField label="Вхід" value={draft.start} now={t} onChange={(v) => onApply({ start: v })} />
        <TimeField label="Вихід" value={draft.end} now={t} onChange={(v) => onApply({ end: v })} />
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
      {off && (
        <button class="link" onClick={() => onApply({ shiftName: plan.name, start: plan.start, end: plan.end, brk: plan.brk })}>
          <Icon name="reset" size={16} /> Як у графіку: {fmtTime(plan.start)}–{fmtTime(plan.end)}, перерва {fmtMin(plan.brk)}
        </button>
      )}
    </Sheet>
  );
}

function TimeField({ label, value, now, onChange }) {
  return (
    <div class="field">
      <span class="field-label field-row">
        {label}
        {now && now !== value && (
          <button class="link small" onClick={() => onChange(now)}>
            зараз {fmtTime(now)}
          </button>
        )}
      </span>
      <input class="input time" type="time" step="60" aria-label={label} value={value} onChange={(e) => e.currentTarget.value && onChange(e.currentTarget.value)} />
    </div>
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
            <span>− {withWhy('простій', d.reason)}</span>
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
              <span>{timeName(false, o)}</span>
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
