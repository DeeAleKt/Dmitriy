import { useState } from 'preact/hooks';
import { parseNum, shiftLength } from '../calc.js';
import { deletePerson, deleteProduct, importProducts, savePerson, saveProduct, saveSettings } from '../data.js';
import { ask, Empty, errText, Field, Icon, Segmented, Sheet, Spinner, toast, Toggle } from '../ui.jsx';
import { collator, fmt, fmtMin, fmtTime, initials, isEmail, normEmail } from '../util.js';

export function Admin({ me, products, people, settings }) {
  const [sec, setSec] = useState('products');
  return (
    <div class="screen">
      <div class="toolbar">
        <Segmented
          value={sec}
          onChange={setSec}
          options={[
            { value: 'products', label: 'Вироби' },
            { value: 'people', label: 'Доступ' },
            { value: 'shift', label: 'Зміни' },
          ]}
        />
      </div>
      {sec === 'products' && <Products products={products} />}
      {sec === 'people' && <People people={people} me={me} />}
      {sec === 'shift' && <ShiftSettings settings={settings} me={me} />}
    </div>
  );
}

// ---------- Вироби ----------

function Products({ products }) {
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  const [importing, setImporting] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const needle = q.trim().toLowerCase();
  const match = (p) => !needle || `${p.name} ${p.code} ${p.group}`.toLowerCase().includes(needle);
  const active = products.filter((p) => !p.archived && match(p));
  const archived = products.filter((p) => p.archived && match(p));
  const groups = [...new Set(products.map((p) => p.group).filter(Boolean))].sort(collator.compare);

  const list = (items) => {
    let last = null;
    return items.map((p) => {
      const head = groups.length > 0 && p.group !== last;
      last = p.group;
      return (
        <>
          {head && <h4 class="group-title">{p.group || 'Без групи'}</h4>}
          <button class="pick-row" onClick={() => setEdit(p)} key={p.id}>
            <span>
              <b>{p.name}</b>
              {p.code && <small>{p.code}</small>}
            </span>
            <em>{fmt(p.norm)} шт</em>
          </button>
        </>
      );
    });
  };

  return (
    <>
      <div class="row">
        <div class="search grow">
          <Icon name="search" size={18} />
          <input type="search" placeholder="Пошук виробу" value={q} onInput={(e) => setQ(e.currentTarget.value)} />
        </div>
        <button class="btn primary" onClick={() => setEdit({})} aria-label="Додати виріб">
          <Icon name="plus" /> <span class="hide-xs">Додати</span>
        </button>
      </div>
      <div class="row between muted small list-meta">
        <span>
          {products.filter((p) => !p.archived).length} активних
          {products.some((p) => p.archived) && ` · ${products.filter((p) => p.archived).length} в архіві`}
        </span>
        <button class="link" onClick={() => setImporting(true)}>
          <Icon name="upload" size={16} /> Імпорт з Excel
        </button>
      </div>

      {products.length === 0 ? (
        <Empty title="Ще немає жодного виробу">
          Додайте вироби по одному кнопкою «Додати» або вставте одразу весь список з Excel через «Імпорт».
        </Empty>
      ) : (
        <div class="card flush">{active.length ? list(active) : <Empty icon="search" title="Нічого не знайдено" />}</div>
      )}

      {archived.length > 0 && (
        <>
          <button class="link archive-toggle" onClick={() => setShowArchive(!showArchive)}>
            Архів ({archived.length}) <Icon name="down" size={16} class={showArchive ? 'flip' : ''} />
          </button>
          {showArchive && <div class="card flush dim">{list(archived)}</div>}
        </>
      )}

      {edit && <ProductSheet product={edit} groups={groups} onClose={() => setEdit(null)} />}
      {importing && <ImportSheet products={products} onClose={() => setImporting(false)} />}
    </>
  );
}

function ProductSheet({ product, groups, onClose }) {
  const isNew = !product.id;
  const [f, setF] = useState({
    name: product.name || '',
    norm: product.norm ? String(product.norm).replace('.', ',') : '',
    code: product.code || '',
    group: product.group || '',
    archived: Boolean(product.archived),
  });
  const [busy, setBusy] = useState(false);
  const norm = parseNum(f.norm);
  const ok = f.name.trim() && norm > 0;

  async function save() {
    if (!ok) return;
    setBusy(true);
    try {
      await saveProduct(product.id, { ...f, norm });
      toast(isNew ? 'Виріб додано' : 'Збережено');
      onClose();
    } catch (e) {
      toast(errText(e), 'err');
      setBusy(false);
    }
  }

  async function remove() {
    const sure = await ask({
      title: 'Видалити виріб?',
      text: 'Уже збережені записи журналу не зміняться. Якщо виріб просто більше не випускається — краще перенесіть його в архів.',
      ok: 'Видалити',
      danger: true,
    });
    if (!sure) return;
    try {
      await deleteProduct(product.id);
      toast('Виріб видалено');
      onClose();
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  return (
    <Sheet
      open
      title={isNew ? 'Новий виріб' : 'Виріб'}
      onClose={onClose}
      footer={
        <button class="btn primary block" disabled={!ok || busy} onClick={save}>
          {busy ? <Spinner /> : isNew ? 'Додати виріб' : 'Зберегти'}
        </button>
      }
    >
      <form
        class="form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="Назва *">
          <input class="input" data-autofocus maxLength={200} value={f.name} onInput={(e) => setF({ ...f, name: e.currentTarget.value })} />
        </Field>
        <Field label="Норма за зміну, шт *" hint="Скільки штук треба зробити за повну стандартну зміну (100 %)">
          <input
            class="input"
            inputMode="decimal"
            value={f.norm}
            onInput={(e) => setF({ ...f, norm: e.currentTarget.value.replace(/[^\d.,]/g, '') })}
          />
        </Field>
        <div class="grid2">
          <Field label="Код / артикул">
            <input class="input" maxLength={60} value={f.code} onInput={(e) => setF({ ...f, code: e.currentTarget.value })} />
          </Field>
          <Field label="Група">
            <input
              class="input"
              list="groups"
              maxLength={100}
              value={f.group}
              onInput={(e) => setF({ ...f, group: e.currentTarget.value })}
            />
            <datalist id="groups">
              {groups.map((g) => (
                <option value={g} />
              ))}
            </datalist>
          </Field>
        </div>
        {!isNew && (
          <Toggle
            label="В архіві"
            hint="Не показується працівникам під час вибору"
            checked={f.archived}
            onChange={(v) => setF({ ...f, archived: v })}
          />
        )}
        {!isNew && (
          <button type="button" class="btn ghost block danger-text" onClick={remove}>
            <Icon name="trash" size={18} /> Видалити виріб
          </button>
        )}
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}

/** Розбір тексту, вставленого з Excel/Google Таблиць: Назва | Норма | Код | Група */
export function parseImport(text, products) {
  const byCode = new Map(products.filter((p) => p.code).map((p) => [p.code.toLowerCase(), p]));
  const byName = new Map(products.map((p) => [p.name.toLowerCase().replace(/\s+/g, ' '), p]));
  const out = new Map();
  const errors = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, i) => {
    if (!raw.trim()) return;
    const cells = (raw.includes('\t') ? raw.split('\t') : raw.split(';')).map((c) => c.trim().replace(/^"|"$/g, ''));
    const [name, normRaw, code = '', group = ''] = cells;
    const norm = parseNum(normRaw);
    if (!name || !(norm > 0)) {
      // перший рядок без числа — найімовірніше, заголовок таблиці
      if (out.size || errors.length || /\d/.test(normRaw || '')) errors.push(i + 1);
      return;
    }
    const existing = (code && byCode.get(code.toLowerCase())) || byName.get(name.toLowerCase().replace(/\s+/g, ' '));
    const key = existing?.id || `new:${(code || name).toLowerCase()}`;
    out.set(key, {
      id: existing?.id,
      name: name.slice(0, 200),
      norm,
      code: (code || existing?.code || '').slice(0, 60),
      group: (group || existing?.group || '').slice(0, 100),
      archived: false,
      changed: existing ? existing.norm !== norm || existing.name !== name || existing.archived : true,
    });
  });
  const rows = [...out.values()];
  return {
    rows,
    created: rows.filter((r) => !r.id).length,
    updated: rows.filter((r) => r.id && r.changed).length,
    same: rows.filter((r) => r.id && !r.changed).length,
    errors,
  };
}

function ImportSheet({ products, onClose }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const parsed = text.trim() ? parseImport(text, products) : null;
  const todo = parsed ? parsed.rows.filter((r) => r.changed) : [];

  async function run() {
    setBusy(true);
    try {
      await importProducts(todo);
      toast(`Імпортовано: ${todo.length}`);
      onClose();
    } catch (e) {
      toast(errText(e), 'err');
      setBusy(false);
    }
  }

  return (
    <Sheet
      open
      title="Імпорт виробів"
      onClose={onClose}
      tall
      footer={
        <button class="btn primary block" disabled={!todo.length || busy} onClick={run}>
          {busy ? <Spinner /> : todo.length ? `Імпортувати (${todo.length})` : 'Імпортувати'}
        </button>
      }
    >
      <p class="muted small">
        Виділіть у Excel або Google Таблиці стовпці <b>Назва</b> і <b>Норма</b> (за бажанням ще <b>Код</b> і{' '}
        <b>Група</b> — саме в такому порядку), скопіюйте і вставте сюди. Вироби з такою ж назвою або кодом
        оновляться, нові — додадуться.
      </p>
      <textarea
        class="input mono"
        rows={9}
        data-autofocus
        placeholder={'Стілець «Класик»\t35\tST-01\tСтільці\nТабурет\t48'}
        value={text}
        onInput={(e) => setText(e.currentTarget.value)}
      />
      {parsed && (
        <div class="import-stats">
          <span>
            Нових: <b>{parsed.created}</b>
          </span>
          <span>
            Оновиться: <b>{parsed.updated}</b>
          </span>
          {parsed.same > 0 && (
            <span>
              Без змін: <b>{parsed.same}</b>
            </span>
          )}
          {parsed.errors.length > 0 && (
            <span class="danger-text">
              Пропущено рядки: {parsed.errors.slice(0, 8).join(', ')}
              {parsed.errors.length > 8 && '…'} (немає назви або норми)
            </span>
          )}
        </div>
      )}
    </Sheet>
  );
}

// ---------- Люди та доступ ----------

function People({ people, me }) {
  const [edit, setEdit] = useState(null);
  const link = location.origin + location.pathname;

  async function share() {
    const text = 'Програма для розрахунку виконання норми. Увійдіть своїм Google-акаунтом.';
    try {
      if (navigator.share) return await navigator.share({ title: 'Норма', text, url: link });
    } catch (e) {
      if (e?.name === 'AbortError') return; // користувач закрив вікно «Поділитися»
    }
    try {
      await navigator.clipboard.writeText(link);
      toast('Посилання скопійовано');
    } catch {
      toast(`Скопіюйте вручну: ${link}`, 'err');
    }
  }

  return (
    <>
      <div class="card notice">
        <Icon name="lock" />
        <p class="small">
          Увійти зможуть лише люди з цього списку — своїм Google-акаунтом з указаною адресою. Працівник бачить
          тільки власні записи.
        </p>
      </div>
      <div class="row">
        <button class="btn primary grow" onClick={() => setEdit({})}>
          <Icon name="plus" /> Додати людину
        </button>
        <button class="btn soft" onClick={share} aria-label="Поділитися посиланням">
          <Icon name="share" /> <span class="hide-xs">Посилання</span>
        </button>
      </div>
      <div class="card flush">
        {people.map((p) => (
          <button class={`pick-row ${p.active || p.owner ? '' : 'dim'}`} onClick={() => setEdit(p)} key={p.email}>
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
            {p.owner ? (
              <span class="tag accent">Власник</span>
            ) : !p.active ? (
              <span class="tag">Вимкнено</span>
            ) : p.role === 'admin' ? (
              <span class="tag accent">Адмін</span>
            ) : null}
          </button>
        ))}
      </div>
      {edit && <PersonSheet person={edit} me={me} people={people} onClose={() => setEdit(null)} />}
    </>
  );
}

function PersonSheet({ person, me, people, onClose }) {
  const isNew = !person.email;
  const [f, setF] = useState({
    email: person.email || '',
    name: person.name || '',
    role: person.role || 'worker',
    active: isNew ? true : Boolean(person.active),
  });
  const [busy, setBusy] = useState(false);
  const email = normEmail(f.email);
  const exists = isNew && people.some((p) => p.email === email);
  const ok = isEmail(email) && f.name.trim() && !exists;
  const self = person.email === me;

  async function save() {
    if (!ok) return;
    setBusy(true);
    try {
      await savePerson(email, { ...f, owner: person.owner }, me);
      toast(isNew ? 'Доступ надано' : 'Збережено');
      onClose();
    } catch (e) {
      toast(errText(e), 'err');
      setBusy(false);
    }
  }

  async function remove() {
    const sure = await ask({
      title: 'Забрати доступ?',
      text: `${f.name || email} більше не зможе увійти. Його записи в журналі залишаться.`,
      ok: 'Забрати доступ',
      danger: true,
    });
    if (!sure) return;
    try {
      await deletePerson(person.email);
      toast('Доступ забрано');
      onClose();
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  return (
    <Sheet
      open
      title={isNew ? 'Надати доступ' : 'Доступ'}
      onClose={onClose}
      footer={
        <button class="btn primary block" disabled={!ok || busy} onClick={save}>
          {busy ? <Spinner /> : isNew ? 'Надати доступ' : 'Зберегти'}
        </button>
      }
    >
      <form
        class="form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="Google-пошта *" hint={exists ? 'Ця адреса вже є у списку' : 'Саме з цієї адреси людина входитиме'}>
          <input
            class="input"
            type="email"
            inputMode="email"
            autoCapitalize="off"
            autoComplete="off"
            data-autofocus={isNew || undefined}
            disabled={!isNew}
            placeholder="name@gmail.com"
            value={f.email}
            onInput={(e) => setF({ ...f, email: e.currentTarget.value })}
          />
        </Field>
        <Field label="Ім’я та прізвище *">
          <input class="input" maxLength={120} value={f.name} onInput={(e) => setF({ ...f, name: e.currentTarget.value })} />
        </Field>
        {!person.owner && (
          <div class="field">
            <span class="field-label">Роль</span>
            <Segmented
              value={f.role}
              onChange={(role) => setF({ ...f, role })}
              options={[
                { value: 'worker', label: 'Працівник' },
                { value: 'admin', label: 'Адміністратор' },
              ]}
            />
            <span class="field-hint">
              {f.role === 'admin'
                ? 'Бачить записи всіх, керує виробами та доступом'
                : 'Вносить і бачить лише власні результати'}
            </span>
          </div>
        )}
        {!isNew && !person.owner && !self && (
          <Toggle
            label="Доступ дозволено"
            hint="Вимкніть, щоб тимчасово закрити вхід"
            checked={f.active}
            onChange={(v) => setF({ ...f, active: v })}
          />
        )}
        {person.owner && <p class="muted small">Власник має повний доступ завжди — це задано в правилах бази.</p>}
        {!isNew && !person.owner && !self && (
          <button type="button" class="btn ghost block danger-text" onClick={remove}>
            <Icon name="trash" size={18} /> Забрати доступ
          </button>
        )}
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}

// ---------- Зміни і база норми ----------

function ShiftSettings({ settings, me }) {
  const [edit, setEdit] = useState(null);
  const save = async (patch, msg) => {
    try {
      await saveSettings({ ...settings, ...patch }, me);
      toast(msg);
      return true;
    } catch (e) {
      toast(errText(e), 'err');
      return false;
    }
  };
  return (
    <>
      <section class="card">
        <div class="card-head">
          <h3>
            <Icon name="clock" /> Зміни
          </h3>
          <button class="btn soft sm" onClick={() => setEdit({})}>
            <Icon name="plus" size={18} /> Додати
          </button>
        </div>
        <p class="muted small">Працівник обирає зміну одним дотиком, а за потреби змінює час чи перерву саме для свого дня.</p>
      </section>
      <div class="card flush">
        {settings.shifts.map((p) => {
          const len = shiftLength(p.start, p.end);
          return (
            <button class="pick-row" onClick={() => setEdit(p)} key={p.id}>
              <span>
                <b>{p.name}</b>
                <small>
                  {fmtTime(p.start)}–{fmtTime(p.end)} · перерва {fmtMin(p.brk)}
                </small>
              </span>
              <em>{fmtMin(len - p.brk)}</em>
            </button>
          );
        })}
      </div>
      <NormBase settings={settings} save={save} />
      {edit && (
        <ShiftSheet
          shift={edit}
          settings={settings}
          save={save}
          onClose={() => setEdit(null)}
        />
      )}
    </>
  );
}

function ShiftSheet({ shift, settings, save, onClose }) {
  const isNew = !shift.id;
  const [f, setF] = useState({
    name: shift.name || '',
    start: shift.start || '08:00',
    end: shift.end || '16:00',
    brk: String(shift.brk ?? 60),
  });
  const [busy, setBusy] = useState(false);
  const len = shiftLength(f.start, f.end);
  const brk = Math.round(parseNum(f.brk));
  const ok = f.name.trim() && len > 0 && brk >= 0 && brk < len;

  async function submit() {
    if (!ok) return;
    setBusy(true);
    const item = { id: shift.id || Math.random().toString(36).slice(2, 8), name: f.name.trim().slice(0, 60), start: f.start, end: f.end, brk };
    const shifts = isNew ? [...settings.shifts, item] : settings.shifts.map((x) => (x.id === shift.id ? item : x));
    if (await save({ shifts }, isNew ? 'Зміну додано' : 'Зміну збережено')) onClose();
    else setBusy(false);
  }

  async function remove() {
    if (settings.shifts.length < 2) return toast('Має лишитися хоча б одна зміна', 'err');
    if (!(await ask({ title: `Видалити «${shift.name}»?`, text: 'Уже збережені записи не зміняться.', ok: 'Видалити', danger: true }))) return;
    if (await save({ shifts: settings.shifts.filter((x) => x.id !== shift.id) }, 'Зміну видалено')) onClose();
  }

  return (
    <Sheet
      open
      title={isNew ? 'Нова зміна' : 'Зміна'}
      onClose={onClose}
      footer={
        <button class="btn primary block" disabled={!ok || busy} onClick={submit}>
          {busy ? <Spinner /> : isNew ? 'Додати зміну' : 'Зберегти'}
        </button>
      }
    >
      <form
        class="form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Назва *">
          <input class="input" data-autofocus maxLength={60} placeholder="Напр.: 1 зміна" value={f.name} onInput={(e) => setF({ ...f, name: e.currentTarget.value })} />
        </Field>
        <div class="grid2">
          <Field label="Початок">
            <input class="input" type="time" step="300" value={f.start} onChange={(e) => e.currentTarget.value && setF({ ...f, start: e.currentTarget.value })} />
          </Field>
          <Field label="Кінець">
            <input class="input" type="time" step="300" value={f.end} onChange={(e) => e.currentTarget.value && setF({ ...f, end: e.currentTarget.value })} />
          </Field>
        </div>
        <Field label="Перерва, хв" hint="Загальна тривалість усіх перерв за зміну">
          <input class="input" inputMode="numeric" value={f.brk} onInput={(e) => setF({ ...f, brk: e.currentTarget.value.replace(/[^\d]/g, '') })} />
        </Field>
        <div class="base-box">
          <span>
            Тривалість {fmtMin(len)}
            {len && f.end <= f.start ? ' (через північ)' : ''}
          </span>
          <b>{ok ? `${fmtMin(len - brk)} роботи` : '—'}</b>
        </div>
        {!isNew && (
          <button type="button" class="btn ghost block danger-text" onClick={remove}>
            <Icon name="trash" size={18} /> Видалити зміну
          </button>
        )}
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}

function NormBase({ settings, save }) {
  const [hours, setHours] = useState(String(settings.normShift / 60).replace('.', ','));
  const [brk, setBrk] = useState(String(settings.normBrk));
  const [busy, setBusy] = useState(false);
  const normShift = Math.round(parseNum(hours) * 60);
  const normBrk = Math.round(parseNum(brk));
  const ok = normShift > 0 && normShift <= 1440 && normBrk >= 0 && normBrk < normShift;
  const changed = normShift !== settings.normShift || normBrk !== settings.normBrk;

  async function submit() {
    setBusy(true);
    await save({ normShift, normBrk }, 'Збережено');
    setBusy(false);
  }

  return (
    <section class="card">
      <div class="card-head">
        <h3>
          <Icon name="box" /> На який час задано норми
        </h3>
      </div>
      <p class="muted small">
        Норма виробу в довіднику — це кількість штук за таку зміну. Від неї рахується норма на будь-яку іншу
        зміну: довша зміна — більша норма на день.
      </p>
      <div class="grid2">
        <Field label="Зміна, год">
          <input class="input" inputMode="decimal" value={hours} onInput={(e) => setHours(e.currentTarget.value)} />
        </Field>
        <Field label="Перерва, хв">
          <input class="input" inputMode="numeric" value={brk} onInput={(e) => setBrk(e.currentTarget.value)} />
        </Field>
      </div>
      <div class="base-box">
        <span>Чистий час, на який задано норми</span>
        <b>{ok ? `${fmtMin(normShift - normBrk)} (${normShift - normBrk} хв)` : '—'}</b>
      </div>
      {changed && (
        <p class="small warn-text">
          Це змінить норму на день для всіх нових записів. Уже збережені дні рахуються за значеннями, що діяли тоді.
        </p>
      )}
      <button class="btn primary block" disabled={!ok || !changed || busy} onClick={submit}>
        {busy ? <Spinner /> : 'Зберегти'}
      </button>
    </section>
  );
}
