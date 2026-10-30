import { useState } from 'preact/hooks';
import { fmt, fmtMin, fmtTime, plural } from '../util.js';
import { useApp } from './ctx.js';
import { backup, exportExcel, readBackup } from './files.js';
import { DEFAULT_DOWN, DEFAULT_OTHER, makeSample, newKey, num, shiftLength } from './model.js';
import { ask, cleanNum, Icon, Segmented, Sheet, toast, Toggle } from './ui.jsx';
import { today } from '../util.js';

export function Settings({ onClose }) {
  const { settings, setSettings, days, setDays, sync, wipeAll } = useApp();
  const cloud = sync.mode === 'cloud';
  const [edit, setEdit] = useState(null); // {type:'shift'|'product', item}
  const set = (p) => setSettings((s) => ({ ...s, ...p }));
  const real = Object.values(days).filter((r) => !r.sample);
  const hasSample = Object.values(days).some((r) => r.sample);

  async function restore(e) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    try {
      const data = await readBackup(file);
      const n = Object.keys(data.days).length;
      const ok = await ask({
        title: `Відновити ${n} ${plural(n, ['день', 'дні', 'днів'])}?`,
        text: 'Дні з копії додадуться до історії (однакові дати буде замінено). Збережені вироби, зміни та списки обʼєднаються.',
        ok: 'Відновити',
      });
      if (!ok) return;
      setDays((d) => ({ ...d, ...data.days }));
      setSettings((s) => ({
        ...s,
        shifts: mergeBy(s.shifts, data.settings.shifts, (x) => `${x.start}|${x.end}|${x.name}`),
        products: mergeBy(s.products, data.settings.products, (x) => `${x.name}|${x.norm}`),
        downReasons: [...new Set([...s.downReasons, ...data.settings.downReasons])],
        otherKinds: [...new Set([...s.otherKinds, ...data.settings.otherKinds])],
      }));
      toast(`Відновлено: ${n} ${plural(n, ['день', 'дні', 'днів'])}`);
    } catch (err) {
      toast(err.message, 'err');
    }
  }

  async function wipe() {
    const ok = await ask({
      title: 'Видалити всі дані?',
      text: cloud
        ? 'Зникнуть історія, статистика, мої вироби й налаштування — і в акаунті, і на всіх ваших пристроях. Скасувати це неможливо — спершу можна зберегти резервну копію.'
        : 'Зникнуть історія, статистика, мої вироби й налаштування на цьому пристрої. Скасувати це неможливо — спершу можна зберегти резервну копію.',
      ok: 'Видалити все',
      danger: true,
    });
    if (!ok) return;
    await wipeAll();
  }

  return (
    <Sheet title="Налаштування" onClose={onClose} tall>
      <section class="sgroup">
        <h3>Мета і норма</h3>
        <div class="srow-static">
          <div>
            <b>Особиста мета</b>
            <span class="hint">Кольори, серії та «до мети ще…» рахуються від неї</span>
          </div>
          <MiniStepper value={settings.goal} step={5} min={50} max={200} suffix="%" onChange={(v) => set({ goal: v })} />
        </div>
        <div class="srow-static">
          <div>
            <b>Норму задано на</b>
            <span class="hint">Чистий час стандартної зміни, на яку дано норму виробу</span>
          </div>
          <MiniStepper value={settings.base / 60} step={0.5} min={1} max={24} suffix="год" onChange={(v) => set({ base: Math.round(v * 60) })} />
        </div>
      </section>

      <section class="sgroup">
        <div class="sgroup-head">
          <h3>Зміни</h3>
          <button class="link" onClick={() => setEdit({ type: 'shift', item: null })}>
            <Icon name="plus" size={16} /> Додати
          </button>
        </div>
        <div class="slist">
          {settings.shifts.map((s) => (
            <button class="srow" key={s.id} onClick={() => setEdit({ type: 'shift', item: s })}>
              <span class="srow-main">
                <b>{s.name}</b>
                <small>
                  {fmtTime(s.start)}–{fmtTime(s.end)} · перерва {fmtMin(s.brk)}
                </small>
              </span>
              <em>{fmtMin(shiftLength(s.start, s.end) - s.brk)}</em>
              <Icon name="right" size={16} class="faint" />
            </button>
          ))}
        </div>
      </section>

      <section class="sgroup">
        <div class="sgroup-head">
          <h3>Мої вироби</h3>
          <button class="link" onClick={() => setEdit({ type: 'product', item: null })}>
            <Icon name="plus" size={16} /> Додати
          </button>
        </div>
        {settings.products.length ? (
          <div class="slist">
            {settings.products.map((p) => (
              <button class="srow" key={p.id} onClick={() => setEdit({ type: 'product', item: p })}>
                <span class="srow-main">
                  <b>{p.name || 'Без назви'}</b>
                </span>
                <em>{fmt(p.norm)} шт/зміну</em>
                <Icon name="right" size={16} class="faint" />
              </button>
            ))}
          </div>
        ) : (
          <p class="hint">Популярні вироби зі скороченою назвою й нормою — тоді на головному екрані вони додаються одним дотиком.</p>
        )}
      </section>

      <section class="sgroup">
        <h3>Причини простою</h3>
        <ChipEditor items={settings.downReasons} defaults={DEFAULT_DOWN} placeholder="Нова причина" onChange={(v) => set({ downReasons: v })} />
      </section>
      <section class="sgroup">
        <h3>Види інших робіт</h3>
        <ChipEditor items={settings.otherKinds} defaults={DEFAULT_OTHER} placeholder="Новий вид роботи" onChange={(v) => set({ otherKinds: v })} />
      </section>

      <section class="sgroup">
        <h3>Вигляд</h3>
        <Segmented
          value={settings.theme}
          onChange={(v) => set({ theme: v })}
          options={[
            { value: 'auto', label: 'Як у системі' },
            { value: 'light', label: 'Світла' },
            { value: 'dark', label: 'Темна' },
          ]}
        />
        <Toggle label="Святкувати виконання норми" hint="Конфеті, коли досягаєте мети" checked={settings.celebrate} onChange={(v) => set({ celebrate: v })} />
      </section>

      <section class="sgroup">
        <h3>Дані</h3>
        <div class="slist">
          <button
            class="srow"
            disabled={!Object.keys(days).length}
            onClick={() => exportExcel(Object.values(days), null, settings.goal).catch((e) => toast(e.message, 'err'))}
          >
            <span class="srow-ico">
              <Icon name="sheet" size={18} />
            </span>
            <span class="srow-main">
              <b>Експорт в Excel</b>
              <small>Уся історія: дні, вироби, підсумки по місяцях</small>
            </span>
          </button>
          <button class="srow" onClick={() => backup(settings, days).then((r) => r === 'saved' && toast('Копію збережено')).catch((e) => toast(e.message, 'err'))}>
            <span class="srow-ico">
              <Icon name="download" size={18} />
            </span>
            <span class="srow-main">
              <b>Зберегти резервну копію</b>
              <small>Файл, щоб перенести дані на інший телефон</small>
            </span>
          </button>
          <label class="srow">
            <span class="srow-ico">
              <Icon name="upload" size={18} />
            </span>
            <span class="srow-main">
              <b>Відновити з копії</b>
              <small>Оберіть збережений раніше файл .json</small>
            </span>
            <input type="file" accept=".json,application/json" class="visually-hidden" onChange={restore} />
          </label>
          {hasSample ? (
            <button
              class="srow"
              onClick={() => {
                setDays((d) => Object.fromEntries(Object.entries(d).filter(([, r]) => !r.sample)));
                toast('Приклад прибрано');
              }}
            >
              <span class="srow-ico">
                <Icon name="sparkle" size={18} />
              </span>
              <span class="srow-main">
                <b>Прибрати приклад статистики</b>
                <small>Ваші справжні дні залишаться</small>
              </span>
            </button>
          ) : (
            <button
              class="srow"
              onClick={() => {
                setDays((d) => ({ ...makeSample(settings, d, today()), ...d }));
                toast('Додано приклад: 45 днів', 'ok', 'sparkle');
              }}
            >
              <span class="srow-ico">
                <Icon name="sparkle" size={18} />
              </span>
              <span class="srow-main">
                <b>Показати приклад статистики</b>
                <small>Вигадані дні, щоб подивитися, як усе виглядає</small>
              </span>
            </button>
          )}
          <button class="srow danger" onClick={wipe}>
            <span class="srow-ico">
              <Icon name="trash" size={18} />
            </span>
            <span class="srow-main">
              <b>Видалити всі дані</b>
              <small>
                {real.length} {plural(real.length, ['збережений день', 'збережені дні', 'збережених днів'])} {cloud ? 'в акаунті' : 'на цьому пристрої'}
              </small>
            </span>
          </button>
        </div>
      </section>

      <p class="privacy">
        <Icon name="shield" size={16} />
        <span>
          {cloud
            ? 'Дані зберігаються самі в особистому розділі вашого акаунта Claude — їх бачите лише ви, на будь-якому своєму пристрої. Резервна копія у файл — про всяк випадок.'
            : 'Дані зберігаються самі, лише в цьому браузері на вашому телефоні, й нікуди не надсилаються. Якщо міняєте телефон або чистите браузер — спершу збережіть резервну копію.'}
        </span>
      </p>

      {edit?.type === 'shift' && <ShiftEdit item={edit.item} onClose={() => setEdit(null)} />}
      {edit?.type === 'product' && <ProductEdit item={edit.item} onClose={() => setEdit(null)} />}
    </Sheet>
  );
}

const mergeBy = (a, b, key) => {
  const seen = new Set(a.map(key));
  return [...a, ...b.filter((x) => !seen.has(key(x))).map((x) => ({ ...x, id: newKey() }))];
};

function MiniStepper({ value, step, min, max, suffix, onChange }) {
  const set = (v) => onChange(Math.min(max, Math.max(min, Math.round(v * 100) / 100)));
  return (
    <div class="ministep">
      <button class="round-btn sm" disabled={value <= min} onClick={() => set(value - step)} aria-label="Менше">
        <Icon name="minus" size={16} />
      </button>
      <span>
        {fmt(value, 1)} {suffix}
      </span>
      <button class="round-btn sm" disabled={value >= max} onClick={() => set(value + step)} aria-label="Більше">
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}

function ChipEditor({ items, defaults, placeholder, onChange }) {
  const [text, setText] = useState('');
  const add = () => {
    const v = text.trim();
    if (!v || items.includes(v)) return setText('');
    const rest = items.filter((x) => x !== 'Інше');
    onChange([...rest, v, ...(items.includes('Інше') ? ['Інше'] : [])]);
    setText('');
  };
  return (
    <div class="chipedit">
      <div class="chips">
        {items.map((x) => (
          <span class="echip" key={x}>
            {x}
            <button aria-label={`Прибрати «${x}»`} disabled={items.length <= 1} onClick={() => onChange(items.filter((i) => i !== x))}>
              <Icon name="x" size={14} />
            </button>
          </span>
        ))}
      </div>
      <form
        class="inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input class="input" maxLength={60} placeholder={placeholder} value={text} onInput={(e) => setText(e.currentTarget.value)} />
        <button class="btn soft" type="submit" disabled={!text.trim()}>
          Додати
        </button>
      </form>
      {items.join('|') !== defaults.join('|') && (
        <button class="link small" onClick={() => onChange(defaults)}>
          Повернути стандартний список
        </button>
      )}
    </div>
  );
}

function ShiftEdit({ item, onClose }) {
  const { settings, setSettings } = useApp();
  const [f, setF] = useState(item ? { ...item, brk: String(item.brk) } : { name: '', start: '08:00', end: '16:30', brk: '30' });
  const len = shiftLength(f.start, f.end);
  const brk = num(f.brk);
  const ok = f.name.trim() && len > 0 && brk < len;
  function save() {
    const x = { id: item?.id || newKey(), name: f.name.trim(), start: f.start, end: f.end, brk };
    setSettings((s) => ({ ...s, shifts: item ? s.shifts.map((y) => (y.id === item.id ? x : y)) : [...s.shifts, x] }));
    onClose();
  }
  async function remove() {
    if (settings.shifts.length <= 1) return toast('Має лишитися хоча б одна зміна', 'err');
    if (!(await ask({ title: `Видалити «${item.name}»?`, text: 'Уже збережені дні не зміняться.', ok: 'Видалити', danger: true }))) return;
    setSettings((s) => ({ ...s, shifts: s.shifts.filter((y) => y.id !== item.id) }));
    onClose();
  }
  return (
    <Sheet
      title={item ? 'Зміна' : 'Нова зміна'}
      onClose={onClose}
      footer={
        <div class="row">
          {item && (
            <button class="btn ghost danger-text sq" onClick={remove} aria-label="Видалити">
              <Icon name="trash" />
            </button>
          )}
          <button class="btn primary grow" disabled={!ok} onClick={save}>
            Зберегти
          </button>
        </div>
      }
    >
      <label class="field">
        <span class="field-label">Назва</span>
        <input class="input" data-autofocus maxLength={40} placeholder="Напр.: Нічна" value={f.name} onInput={(e) => setF({ ...f, name: e.currentTarget.value })} />
      </label>
      <div class="grid2">
        <label class="field">
          <span class="field-label">Початок</span>
          <input class="input time" type="time" step="300" value={f.start} onChange={(e) => e.currentTarget.value && setF({ ...f, start: e.currentTarget.value })} />
        </label>
        <label class="field">
          <span class="field-label">Кінець</span>
          <input class="input time" type="time" step="300" value={f.end} onChange={(e) => e.currentTarget.value && setF({ ...f, end: e.currentTarget.value })} />
        </label>
      </div>
      <div class="grid2">
        <label class="field">
          <span class="field-label">Перерва, хв</span>
          <input class="input" inputMode="numeric" value={f.brk} onInput={(e) => setF({ ...f, brk: e.currentTarget.value.replace(/\D/g, '') })} />
        </label>
        <div class="work-box">
          <span>Роботи</span>
          <b>{ok ? fmtMin(len - brk) : '—'}</b>
        </div>
      </div>
    </Sheet>
  );
}

function ProductEdit({ item, onClose }) {
  const { setSettings } = useApp();
  const [name, setName] = useState(item?.name || '');
  const [norm, setNorm] = useState(item ? String(item.norm).replace('.', ',') : '');
  const ok = num(norm) > 0;
  function save() {
    const x = { id: item?.id || newKey(), name: name.trim(), norm: num(norm) };
    setSettings((s) => ({ ...s, products: item ? s.products.map((y) => (y.id === item.id ? x : y)) : [...s.products, x] }));
    onClose();
  }
  async function remove() {
    if (!(await ask({ title: `Видалити «${item.name || 'виріб'}»?`, text: 'З історії нічого не зникне.', ok: 'Видалити', danger: true }))) return;
    setSettings((s) => ({ ...s, products: s.products.filter((y) => y.id !== item.id) }));
    onClose();
  }
  return (
    <Sheet
      title={item ? 'Мій виріб' : 'Новий виріб'}
      sub="Назву можна писати скорочено — її бачите лише ви"
      onClose={onClose}
      footer={
        <div class="row">
          {item && (
            <button class="btn ghost danger-text sq" onClick={remove} aria-label="Видалити">
              <Icon name="trash" />
            </button>
          )}
          <button class="btn primary grow" disabled={!ok} onClick={save}>
            Зберегти
          </button>
        </div>
      }
    >
      <label class="field">
        <span class="field-label">Коротка назва</span>
        <input class="input" data-autofocus maxLength={60} placeholder="Напр.: К-12" value={name} onInput={(e) => setName(e.currentTarget.value)} />
      </label>
      <label class="field">
        <span class="field-label">Норма за зміну, шт</span>
        <input class="input big" inputMode="decimal" placeholder="Напр.: 35" value={norm} onInput={(e) => setNorm(cleanNum(e.currentTarget.value))} />
      </label>
    </Sheet>
  );
}
