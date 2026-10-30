import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { baseMinutes, computeDay, level, parseNum, shiftLength } from '../calc.js';
import { deleteEntry, getEntry, saveEntry } from '../data.js';
import { ask, Empty, errText, Icon, Ring, Sheet, Spinner, Stepper, toast } from '../ui.jsx';
import { addDays, collator, fmt, fmtDateLong, fmtDay, fmtHM, fmtMin, fmtPct, fmtTime, initials, store, today } from '../util.js';

let keySeq = 0;
const newItem = (p) => ({
  key: ++keySeq,
  productId: p?.id || '',
  name: p?.name || '',
  code: p?.code || '',
  norm: p?.norm || 0,
  qty: '',
});

const FALLBACK_SHIFT = { id: '', name: '', start: '08:00', end: '16:00', brk: 60 };

function blank(settings, presetId) {
  const p = settings.shifts.find((x) => x.id === presetId) || settings.shifts[0] || FALLBACK_SHIFT;
  return {
    items: [newItem()],
    downtime: '',
    reason: '',
    comment: '',
    presetId: p.id,
    start: p.start,
    end: p.end,
    brk: p.brk,
    base: baseMinutes(settings),
    custom: false,
  };
}

/** Назва зміни за часом початку і кінця (перерва на назву не впливає) */
const presetFor = (shifts, start, end) => shifts.find((x) => x.start === start && x.end === end);

function fromEntry(e) {
  return {
    items: e.items.length
      ? e.items.map((i) => ({ ...newItem(), ...i, qty: fmtInput(i.qty) }))
      : [newItem()],
    downtime: e.downtime ? String(e.downtime) : '',
    reason: e.reason || '',
    comment: e.comment || '',
    start: e.start,
    end: e.end,
    brk: e.brk,
    base: e.base,
    custom: true,
  };
}

const fmtInput = (n) => (n ? String(n).replace('.', ',') : '');

// Порівнюємо форму без службових полів, щоб знати, чи є незбережені зміни.
const snapshot = (f) =>
  f &&
  JSON.stringify({
    i: f.items.filter((i) => i.productId).map((i) => [i.productId, i.norm, parseNum(i.qty)]),
    d: parseNum(f.downtime),
    r: f.reason.trim(),
    c: f.comment.trim(),
    s: f.start,
    e: f.end,
    b: f.brk,
  });

export function Calc({ me, myName, isAdmin, people, products, settings, request, onDirty }) {
  const [date, setDate] = useState(today());
  const [who, setWho] = useState(me);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(null);
  const [initial, setInitial] = useState(null);
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState(null);
  const [whoOpen, setWhoOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const dateInput = useRef();

  const presetKey = `norma.shift.${me}`;
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const dirty = form && initial !== null && snapshot(form) !== initial;

  useEffect(() => onDirty?.(Boolean(dirty)), [dirty]);

  // Завантажуємо запис на вибрану дату
  useEffect(() => {
    let cancelled = false;
    setForm(null);
    setShiftOpen(false);
    getEntry(date, who)
      .then((e) => {
        if (cancelled) return;
        const f = e ? fromEntry(e) : blank(settings, store(presetKey));
        setSaved(e);
        setForm(f);
        setInitial(snapshot(f));
      })
      .catch((err) => {
        if (cancelled) return;
        toast(errText(err), 'err');
        const f = blank(settings, store(presetKey));
        setSaved(null);
        setForm(f);
        setInitial(snapshot(f));
      });
    return () => {
      cancelled = true;
    };
  }, [date, who]);

  // Новий (ще не збережений) запис підхоплює змінені адміністратором зміни і норму
  useEffect(() => {
    if (form && !saved && !form.custom) {
      setForm((f) => ({ ...blank(settings, f.presetId), items: f.items, downtime: f.downtime, reason: f.reason, comment: f.comment }));
    }
  }, [settings]);

  const guard = async (fn) => {
    if (dirty && !(await ask({ title: 'Є незбережені зміни', text: 'Перейти без збереження?', ok: 'Перейти', danger: true })))
      return;
    fn();
  };

  // Відкриття запису з журналу
  useEffect(() => {
    if (request) guard(() => {
      setDate(request.date);
      setWho(request.email);
    });
  }, [request]);

  const whoName = who === me ? myName : people.find((p) => p.email === who)?.name || saved?.name || who;

  if (!form) {
    return (
      <div class="screen">
        <DateBar date={date} />
        <div class="center-pad">
          <Spinner />
        </div>
      </div>
    );
  }

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setItem = (key, patch) => set({ items: form.items.map((i) => (i.key === key ? { ...i, ...patch } : i)) });
  const dt = parseNum(form.downtime);
  const chosen = form.items.filter((i) => i.productId);
  const shiftMin = shiftLength(form.start, form.end);
  const preset = presetFor(settings.shifts, form.start, form.end);
  const shiftName = preset?.name || '';
  const res = computeDay({
    items: chosen.map((i) => ({ norm: i.norm, qty: parseNum(i.qty) })),
    shift: shiftMin,
    brk: form.brk,
    downtime: dt,
    base: form.base,
  });
  const single = chosen.length === 1;
  const lv = level(res.percent);

  let status;
  if (!shiftMin) status = 'Вкажіть час початку і кінця зміни';
  else if (shiftMin <= form.brk) status = 'Перерва не може бути довшою за зміну';
  else if (!res.valid) status = 'Простій не може бути більшим за робочий час';
  else if (!chosen.length) status = 'Оберіть виріб і вкажіть кількість';
  else if (res.percent >= 99.95) {
    const extra = single ? parseNum(chosen[0].qty) - res.lines[0].dayNorm : 0;
    status = extra >= 0.05 ? `Норму виконано (+${fmt(extra)} шт)` : 'Норму виконано';
  } else if (single) status = `До норми ще ${fmt(res.toGo[0])} шт`;
  else status = `До норми ще ${fmtMin(res.remaining)} нормо-часу`;

  const recentKey = `norma.recent.${me}`;
  const pick = (p) => {
    setItem(picker, { productId: p.id, name: p.name, code: p.code || '', norm: p.norm });
    store(recentKey, [p.id, ...(store(recentKey) || []).filter((id) => id !== p.id)].slice(0, 6));
    setPicker(null);
    setTimeout(() => document.querySelector(`[data-item="${picker}"] .step-input`)?.focus(), 60);
  };

  const canSave = res.valid && chosen.length > 0 && !busy;

  async function save() {
    if (!canSave) return;
    setBusy(true);
    try {
      const entry = {
        email: who,
        name: whoName,
        date,
        items: chosen.map((i) => ({ ...i, qty: parseNum(i.qty) })),
        shiftName,
        start: form.start,
        end: form.end,
        shift: shiftMin,
        brk: form.brk,
        base: form.base,
        downtime: dt,
        reason: dt > 0 ? form.reason : '',
        comment: form.comment,
      };
      await saveEntry(entry, me);
      const f = { ...form, custom: true, items: chosen.length ? form.items.filter((i) => i.productId) : form.items };
      setForm(f);
      setSaved(entry);
      setInitial(snapshot(f));
      toast(`Збережено: ${fmtPct(res.percent)}`);
    } catch (e) {
      toast(errText(e), 'err');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!(await ask({ title: 'Видалити запис?', text: `${fmtDateLong(date)} · ${whoName}`, ok: 'Видалити', danger: true })))
      return;
    try {
      await deleteEntry(date, who);
      const f = blank(settings, store(presetKey));
      setSaved(null);
      setForm(f);
      setInitial(snapshot(f));
      toast('Запис видалено');
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  const go = (d) => guard(() => setDate(d));
  const isToday = date === today();

  return (
    <div class="screen calc">
      <DateBar
        date={date}
        isToday={isToday}
        onPrev={() => go(addDays(date, -1))}
        onNext={() => go(addDays(date, 1))}
        inputRef={dateInput}
        onPick={(d) => d && d <= today() && go(d)}
      />

      {isAdmin && (
        <button class="who-chip" onClick={() => setWhoOpen(true)}>
          <span class="avatar sm">{initials(whoName)}</span>
          <span>
            <small>Працівник</small>
            {who === me ? `${whoName} (я)` : whoName}
          </span>
          <Icon name="down" size={18} />
        </button>
      )}

      <button class="who-chip shift-chip" onClick={() => setShiftOpen(true)}>
        <span class="chip-ico">
          <Icon name="clock" size={18} />
        </span>
        <span>
          <small>Зміна · перерва {fmtMin(form.brk)}</small>
          {shiftName || 'Свій час'} · {fmtTime(form.start)}–{fmtTime(form.end)}
        </span>
        <Icon name="down" size={18} />
      </button>

      <section class={`hero lv-${lv}`}>
        <div class="ring-box">
          <Ring percent={res.percent} />
          <div class="ring-label">
            <div class="ring-pct">
              {fmt(res.percent, 1)}
              <small>%</small>
            </div>
            <div class="ring-sub">виконання</div>
          </div>
        </div>
        <p class="hero-status">
          {res.percent >= 99.95 && chosen.length > 0 && <Icon name="sparkle" size={18} />}
          {status}
        </p>
        <div class="stats">
          <div class="stat">
            <span>Робочий час</span>
            <b>{fmtHM(res.available)} год</b>
            {dt > 0 && <em>простій {fmtMin(dt)}</em>}
          </div>
          {chosen.length > 1 ? (
            <div class="stat">
              <span>Нормо-час</span>
              <b>{fmtHM(res.earned)} год</b>
              <em>з {fmtHM(res.available)} потрібних</em>
            </div>
          ) : (
            <div class="stat">
              <span>Норма дня</span>
              <b>{single ? `${fmt(res.lines[0].dayNorm)} шт` : '—'}</b>
              {single && res.valid && Math.abs(res.lines[0].dayNorm - chosen[0].norm) > 0.01 && (
                <em>норма за зміну {fmt(chosen[0].norm)}</em>
              )}
            </div>
          )}
          <div class="stat">
            <span>Зроблено</span>
            <b>{fmt(res.pieces)} шт</b>
          </div>
        </div>
        {chosen.length > 0 && res.valid && (
          <button class="link how-btn" onClick={() => setHowOpen(true)}>
            <Icon name="info" size={16} /> Як пораховано
          </button>
        )}
      </section>

      <section class="card">
        <div class="card-head">
          <h3>
            <Icon name="box" /> Вироби
          </h3>
        </div>
        {products.length === 0 ? (
          <Empty title="Довідник виробів порожній">
            {isAdmin ? 'Додайте вироби в розділі «Керування».' : 'Зверніться до адміністратора.'}
          </Empty>
        ) : (
          <>
            {form.items.map((it, idx) => {
              const line = res.lines[chosen.indexOf(it)];
              const current = productMap.get(it.productId);
              const drift = current && current.norm !== it.norm;
              return (
                <div class="item" data-item={it.key} key={it.key}>
                  <div class="item-top">
                    <button class={`item-pick ${it.productId ? '' : 'empty'}`} onClick={() => setPicker(it.key)}>
                      <span class="item-name">{it.productId ? it.name : 'Оберіть виріб'}</span>
                      {it.productId && (
                        <span class="item-meta">
                          {it.code && <span>{it.code} · </span>}
                          норма {fmt(it.norm)} шт/зміну
                        </span>
                      )}
                      <Icon name="down" size={18} class="item-caret" />
                    </button>
                    {(form.items.length > 1 || it.productId) && (
                      <button
                        class="icon-btn subtle"
                        aria-label="Прибрати виріб"
                        onClick={() =>
                          set({
                            items: form.items.length > 1 ? form.items.filter((i) => i.key !== it.key) : [newItem()],
                          })
                        }
                      >
                        <Icon name="x" size={18} />
                      </button>
                    )}
                  </div>
                  {drift && (
                    <button class="drift" onClick={() => setItem(it.key, { norm: current.norm, name: current.name })}>
                      <Icon name="refresh" size={14} /> Норму змінено на {fmt(current.norm)} шт — оновити
                    </button>
                  )}
                  {it.productId && (
                    <div class="item-bottom">
                      <Stepper value={it.qty} label={`Кількість: ${it.name}`} onChange={(v) => setItem(it.key, { qty: v })} />
                      {line && res.valid && (
                        <div class="item-calc">
                          <span>
                            з {fmt(line.dayNorm)} шт
                          </span>
                          <b class={`lv-text ${level(line.percent)}`}>{fmtPct(line.percent)}</b>
                        </div>
                      )}
                    </div>
                  )}
                  {idx < form.items.length - 1 && <hr />}
                </div>
              );
            })}
            {form.items.length < 40 && (
              <button
                class="btn soft block add-item"
                onClick={() => {
                  const it = newItem();
                  set({ items: [...form.items, it] });
                  setPicker(it.key);
                }}
              >
                <Icon name="plus" /> Додати ще виріб
              </button>
            )}
          </>
        )}
      </section>

      <section class="card">
        <div class="card-head">
          <h3>
            <Icon name="pause" /> Простій
          </h3>
          <div class="unit-input">
            <input
              inputMode="numeric"
              value={form.downtime}
              placeholder="0"
              aria-label="Простій, хвилин"
              onFocus={(e) => e.currentTarget.select()}
              onInput={(e) => set({ downtime: e.currentTarget.value.replace(/[^\d]/g, '') })}
            />
            <span>хв</span>
          </div>
        </div>
        <div class="chips">
          {[5, 10, 15, 30, 60].map((m) => (
            <button class="chip" onClick={() => set({ downtime: String(dt + m) })}>
              +{m}
            </button>
          ))}
          {dt > 0 && (
            <button class="chip ghost" onClick={() => set({ downtime: '', reason: '' })}>
              Скинути
            </button>
          )}
        </div>
        {dt > 0 && (
          <input
            class="input mt"
            placeholder="Причина простою (необов’язково)"
            maxLength={300}
            value={form.reason}
            onInput={(e) => set({ reason: e.currentTarget.value })}
          />
        )}
      </section>

      <section class="card">
        <div class="card-head">
          <h3>
            <Icon name="note" /> Примітка
          </h3>
        </div>
        <textarea
          class="input"
          rows={2}
          maxLength={500}
          placeholder="Необов’язково"
          value={form.comment}
          onInput={(e) => set({ comment: e.currentTarget.value })}
        />
      </section>

      {saved && (
        <button class="btn ghost block danger-text" onClick={remove}>
          <Icon name="trash" size={18} /> Видалити запис за цей день
        </button>
      )}

      <div class="savebar">
        <span class={`pct big ${lv}`}>{fmtPct(res.percent)}</span>
        <button class="btn primary grow" disabled={!canSave || (saved && !dirty)} onClick={save}>
          {busy ? (
            <Spinner />
          ) : saved && !dirty ? (
            <>
              <Icon name="check" /> Збережено
            </>
          ) : saved ? (
            'Зберегти зміни'
          ) : (
            'Зберегти в журнал'
          )}
        </button>
      </div>

      <ProductPicker
        open={picker !== null}
        products={products}
        recent={store(recentKey) || []}
        onPick={pick}
        onClose={() => {
          // порожній доданий рядок прибираємо
          setForm((f) => {
            const it = f.items.find((i) => i.key === picker);
            return it && !it.productId && f.items.length > 1 ? { ...f, items: f.items.filter((i) => i !== it) } : f;
          });
          setPicker(null);
        }}
        isAdmin={isAdmin}
      />

      <Sheet open={whoOpen} title="Чий запис" onClose={() => setWhoOpen(false)} tall>
        <PeoplePick
          people={people}
          me={me}
          myName={myName}
          value={who}
          onPick={(email) => {
            setWhoOpen(false);
            if (email !== who) guard(() => setWho(email));
          }}
        />
      </Sheet>

      <Sheet open={howOpen} title="Як пораховано" onClose={() => setHowOpen(false)}>
        <How form={form} res={res} chosen={chosen} dt={dt} shiftMin={shiftMin} shiftName={shiftName} />
      </Sheet>

      <Sheet
        open={shiftOpen}
        title="Зміна"
        onClose={() => setShiftOpen(false)}
        footer={
          <button class="btn primary block" onClick={() => setShiftOpen(false)}>
            Готово
          </button>
        }
      >
        <ShiftPick
          shifts={settings.shifts}
          form={form}
          shiftMin={shiftMin}
          onPreset={(p) => {
            set({ start: p.start, end: p.end, brk: p.brk, presetId: p.id, custom: true });
            store(presetKey, p.id);
            setShiftOpen(false);
          }}
          onChange={(patch) => set({ ...patch, custom: true })}
        />
      </Sheet>
    </div>
  );
}

function DateBar({ date, isToday, onPrev, onNext, onPick, inputRef }) {
  return (
    <div class="datebar">
      <button class="icon-btn" onClick={onPrev} aria-label="Попередній день" disabled={!onPrev}>
        <Icon name="left" />
      </button>
      <label class="date-pick" onClick={() => inputRef?.current?.showPicker?.()}>
        <Icon name="calendar" size={18} />
        <span>{fmtDay(date)}</span>
        {isToday && <em>сьогодні</em>}
        {onPick && (
          <input
            ref={inputRef}
            type="date"
            value={date}
            max={today()}
            aria-label="Дата"
            onChange={(e) => onPick(e.currentTarget.value)}
          />
        )}
      </label>
      <button class="icon-btn" onClick={onNext} aria-label="Наступний день" disabled={!onNext || isToday}>
        <Icon name="right" />
      </button>
    </div>
  );
}

function ShiftPick({ shifts, form, shiftMin, onPreset, onChange }) {
  return (
    <>
      <div class="presets">
        {shifts.map((p) => {
          const len = shiftLength(p.start, p.end);
          const on = p.start === form.start && p.end === form.end;
          return (
            <button class={`preset ${on ? 'on' : ''}`} onClick={() => onPreset(p)} key={p.id}>
              <span>
                <b>{p.name}</b>
                <small>
                  {fmtTime(p.start)}–{fmtTime(p.end)} · перерва {fmtMin(p.brk)} · роботи {fmtMin(len - p.brk)}
                </small>
              </span>
              {on && <Icon name="check" />}
            </button>
          );
        })}
      </div>
      <h4 class="group-title flush">Час саме цього дня</h4>
      <div class="grid2">
        <label class="field">
          <span class="field-label">Початок</span>
          <input class="input" type="time" step="300" value={form.start} onChange={(e) => e.currentTarget.value && onChange({ start: e.currentTarget.value })} />
        </label>
        <label class="field">
          <span class="field-label">Кінець</span>
          <input class="input" type="time" step="300" value={form.end} onChange={(e) => e.currentTarget.value && onChange({ end: e.currentTarget.value })} />
        </label>
      </div>
      <div class="grid2">
        <label class="field">
          <span class="field-label">Перерва, хв</span>
          <input
            class="input"
            inputMode="numeric"
            value={String(form.brk)}
            onFocus={(e) => e.currentTarget.select()}
            onInput={(e) => onChange({ brk: Math.min(600, Math.round(parseNum(e.currentTarget.value))) })}
          />
        </label>
      </div>
      <div class="base-box">
        <span>
          {fmtMin(shiftMin)} − перерва {fmtMin(form.brk)}
        </span>
        <b>{shiftMin > form.brk ? `${fmtMin(shiftMin - form.brk)} роботи` : '—'}</b>
      </div>
      <p class="muted small">
        Норми виробів задані на {fmtMin(form.base)} чистого часу. На довшій зміні норма на день більша, на коротшій —
        менша.
      </p>
    </>
  );
}

function How({ form, res, chosen, dt, shiftMin, shiftName }) {
  return (
    <div class="how">
      <div class="how-row">
        <span>Норми задано на чистий час</span>
        <b>{fmtMin(form.base)}</b>
      </div>
      <div class="how-row">
        <span>
          {shiftName || 'Зміна'} {fmtTime(form.start)}–{fmtTime(form.end)} ({fmtMin(shiftMin)}) − перерва{' '}
          {fmtMin(form.brk)}
          {dt > 0 && <> − простій {fmtMin(dt)}</>}
        </span>
        <b>{fmtMin(res.available)}</b>
      </div>
      <h4>По виробах</h4>
      {chosen.map((it, i) => {
        const l = res.lines[i];
        return (
          <div class="how-item">
            <b>{it.name}</b>
            <span>
              Норма на день: {fmt(l.norm)} × {res.available} / {form.base} = <b>{fmt(l.dayNorm)} шт</b>
            </span>
            <span>
              Зроблено {fmt(l.qty)} шт → {fmt(l.minutes, 0)} нормо-хв ({fmtPct(l.percent)})
            </span>
          </div>
        );
      })}
      <div class="how-total">
        Виконання = {fmt(res.earned, 0)} нормо-хв / {res.available} хв × 100 = <b>{fmtPct(res.percent)}</b>
      </div>
    </div>
  );
}

function ProductPicker({ open, products, recent, onPick, onClose, isAdmin }) {
  const [q, setQ] = useState('');
  useEffect(() => open && setQ(''), [open]);
  const active = products.filter((p) => !p.archived);
  const needle = q.trim().toLowerCase();
  const found = needle
    ? active.filter((p) => `${p.name} ${p.code || ''} ${p.group || ''}`.toLowerCase().includes(needle))
    : active;
  const recents = needle ? [] : recent.map((id) => active.find((p) => p.id === id)).filter(Boolean);
  const groups = new Map();
  for (const p of found) {
    const g = p.group || '';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(p);
  }
  const hasGroups = groups.size > 1 || !groups.has('');
  const row = (p) => (
    <button class="pick-row" onClick={() => onPick(p)} key={p.id}>
      <span>
        <b>{p.name}</b>
        {p.code && <small>{p.code}</small>}
      </span>
      <em>{fmt(p.norm)} шт</em>
    </button>
  );
  return (
    <Sheet open={open} title="Виріб" onClose={onClose} tall>
      <div class="search">
        <Icon name="search" size={18} />
        <input
          data-autofocus
          type="search"
          placeholder="Пошук за назвою або кодом"
          value={q}
          onInput={(e) => setQ(e.currentTarget.value)}
        />
      </div>
      {recents.length > 0 && (
        <>
          <h4 class="group-title">Нещодавні</h4>
          {recents.map(row)}
        </>
      )}
      {[...groups.entries()]
        .sort((a, b) => collator.compare(a[0] || 'яяя', b[0] || 'яяя'))
        .map(([g, list]) => (
          <>
            {(hasGroups || recents.length > 0) && <h4 class="group-title">{g || (hasGroups ? 'Інше' : 'Усі вироби')}</h4>}
            {list.map(row)}
          </>
        ))}
      {!found.length && (
        <Empty icon="search" title={needle ? 'Нічого не знайдено' : 'Немає виробів'}>
          {!needle && (isAdmin ? 'Додайте вироби в розділі «Керування».' : 'Зверніться до адміністратора.')}
        </Empty>
      )}
    </Sheet>
  );
}

export function PeoplePick({ people, me, myName, value, onPick, allOption }) {
  const [q, setQ] = useState('');
  const list = people.filter((p) => p.active || p.owner);
  if (!list.some((p) => p.email === me)) list.unshift({ email: me, name: myName });
  const needle = q.trim().toLowerCase();
  const found = list.filter((p) => !needle || `${p.name} ${p.email}`.toLowerCase().includes(needle));
  return (
    <>
      {list.length > 6 && (
        <div class="search">
          <Icon name="search" size={18} />
          <input type="search" placeholder="Пошук" value={q} onInput={(e) => setQ(e.currentTarget.value)} />
        </div>
      )}
      {allOption && !needle && (
        <button class={`pick-row ${value === 'all' ? 'on' : ''}`} onClick={() => onPick('all')}>
          <span class="person">
            <span class="avatar sm">
              <Icon name="users" size={16} />
            </span>
            <b>Усі працівники</b>
          </span>
          {value === 'all' && <Icon name="check" />}
        </button>
      )}
      {found.map((p) => (
        <button class={`pick-row ${value === p.email ? 'on' : ''}`} onClick={() => onPick(p.email)} key={p.email}>
          <span class="person">
            <span class="avatar sm">{initials(p.name || p.email)}</span>
            <span>
              <b>
                {p.name || p.email}
                {p.email === me && ' (я)'}
              </b>
              <small>{p.email}</small>
            </span>
          </span>
          {value === p.email && <Icon name="check" />}
        </button>
      ))}
    </>
  );
}
