// Вкладка адміністратора: усі працівники, їхні відсотки за місяць, сьогодні, попередження;
// картка працівника з його статистикою та історією (лише перегляд), закриття доступу, адміністратори, Excel.
// Доступ до бази — через backend.team (fb.js), щоб сторінка для claude.ai не тягнула Firebase.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { addDays, fmt, fmtMin, plural, today } from '../util.js';
import { AppCtx, useApp } from './ctx.js';
import { exportTeam } from './files.js';
import { DaySheet, History } from './History.jsx';
import { level, normalizeSettings, pctText } from './model.js';
import { monthName } from './Month.jsx';
import { Stats } from './Stats.jsx';
import { FILTERS, sortRows, teamRow, teamSummary } from './team.js';
import { ask, Empty, Icon, Segmented, Sheet, toast } from './ui.jsx';

const prevMonthOf = (m) => addDays(`${m}-01`, -1).slice(0, 7);
const nextMonthOf = (m) => addDays(`${m}-28`, 7).slice(0, 7);
const initials = (s) =>
  (s || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

function ago(ms) {
  if (!ms) return 'ще не заходив';
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 2) return 'щойно';
  if (min < 60) return `${min} хв тому`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} год тому`;
  const d = Math.round(h / 24);
  return `${d} ${plural(d, ['день', 'дні', 'днів'])} тому`;
}

export function Team() {
  const { backend, account, openSettings } = useApp();
  const api = backend.team;
  const t = today();
  const [month, setMonth] = useState(t.slice(0, 7));
  const [members, setMembers] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('pct');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null); // uid
  const [admins, setAdmins] = useState(false);

  async function load() {
    setBusy(true);
    setError('');
    try {
      setMembers(await api.loadTeam(month, prevMonthOf(month)));
    } catch (e) {
      setError(e?.code === 'permission-denied' ? 'Немає прав адміністратора' : 'Не вдалося завантажити — перевірте інтернет');
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => void load(), [month]);

  const rows = useMemo(() => (members || []).map((m) => teamRow(m, month, t)), [members, month, t]);
  const sum = useMemo(() => teamSummary(rows.filter((r) => !r.blocked)), [rows]);
  const needle = q.trim().toLowerCase();
  const shown = useMemo(
    () => sortRows(rows.filter(FILTERS[filter]).filter((r) => !needle || r.name.toLowerCase().includes(needle) || r.email.includes(needle)), sort),
    [rows, filter, sort, needle],
  );
  const counts = useMemo(() => Object.fromEntries(Object.entries(FILTERS).map(([k, f]) => [k, rows.filter(f).length])), [rows]);
  const isCurrent = month === t.slice(0, 7);
  const lv = sum.pct == null ? 'idle' : level(sum.pct, 100);
  const member = open && members?.find((m) => m.uid === open);

  return (
    <div class="screen">
      <header class="topbar">
        <h1 class="title">Команда</h1>
        <button class="round-btn" onClick={load} disabled={busy} aria-label="Оновити">
          <Icon name="refresh" class={busy ? 'spin' : ''} />
        </button>
        <button class="round-btn" onClick={openSettings} aria-label="Налаштування">
          <Icon name="sliders" />
        </button>
      </header>

      <div class="period-nav">
        <button class="round-btn" onClick={() => setMonth(prevMonthOf(month))} aria-label="Попередній місяць">
          <Icon name="left" />
        </button>
        <span>{monthName(month)}</span>
        <button class="round-btn" disabled={isCurrent} onClick={() => setMonth(nextMonthOf(month))} aria-label="Наступний місяць">
          <Icon name="right" />
        </button>
      </div>

      {error && (
        <div class="tip warn">
          <Icon name="info" size={18} />
          <span>{error}</span>
        </div>
      )}

      {!members && !error && (
        <section class="card">
          <p class="hint center">Завантажую працівників…</p>
        </section>
      )}

      {members && (
        <>
          <section class={`card summary lv-${lv}`}>
            <div class="sum-top">
              <span class="sum-label">Середнє команди</span>
            </div>
            <div class={`sum-num lv-text ${lv}`}>
              {sum.pct == null ? '—' : pctText(sum.pct)}
              <small>%</small>
            </div>
            <div class="sum-facts">
              <span>
                <b>{sum.active}</b> з {sum.people} {plural(sum.people, ['працівника', 'працівників', 'працівників'])} внесли дні
              </span>
              <span>
                з нормою <b>{sum.atNorm}</b>
              </span>
              {isCurrent && (
                <span>
                  сьогодні внесли <b>{sum.today}</b>
                </span>
              )}
            </div>
            <p class="hint">Середнє за {monthName(month).split(' ')[0].toLowerCase()}, зважене за робочим часом усіх працівників.</p>
          </section>

          <div class="chips-row" role="tablist">
            {[
              ['all', 'Усі'],
              ['below', 'Нижче норми'],
              ...(isCurrent ? [['notToday', 'Сьогодні без запису']] : []),
              ['flagged', 'Попередження'],
            ].map(([k, l]) => (
              <button class={`fchip ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)} role="tab" aria-selected={filter === k}>
                {l} <em>{counts[k]}</em>
              </button>
            ))}
          </div>

          <div class="team-tools">
            {rows.length > 6 && (
              <div class="search">
                <Icon name="search" size={18} />
                <input type="search" placeholder="Пошук за імʼям" value={q} onInput={(e) => setQ(e.currentTarget.value)} />
              </div>
            )}
            <Segmented
              small
              value={sort}
              onChange={setSort}
              options={[
                { value: 'pct', label: 'За %' },
                { value: 'name', label: 'За імʼям' },
                { value: 'active', label: 'Активність' },
              ]}
            />
          </div>

          <section class="card flush">
            {shown.map((r) => (
              <WorkerRow r={r} isCurrent={isCurrent} me={r.uid === account.uid} onOpen={() => setOpen(r.uid)} />
            ))}
            {!shown.length && (
              <Empty icon="users" title={rows.length ? 'Нікого за цим фільтром' : 'Ще ніхто не зареєструвався'}>
                {rows.length ? '' : 'Надішліть працівникам посилання на калькулятор — щойно хтось увійде, він зʼявиться тут.'}
              </Empty>
            )}
          </section>

          <div class="team-actions">
            <button
              class="btn soft block"
              disabled={!rows.some((r) => r.n)}
              onClick={() => exportTeam(rows, month).catch((e) => toast(e?.message || 'Не вдалося зберегти файл', 'err'))}
            >
              <Icon name="sheet" size={18} /> Excel за {monthName(month).toLowerCase()}
            </button>
            <button class="btn ghost block" onClick={() => setAdmins(true)}>
              <Icon name="shield" size={18} /> Адміністратори
            </button>
          </div>
        </>
      )}

      {member && (
        <WorkerSheet
          member={member}
          row={rows.find((r) => r.uid === member.uid)}
          api={api}
          me={member.uid === account.uid}
          adminEmail={account.email}
          onChanged={load}
          onClose={() => setOpen(null)}
        />
      )}
      {admins && <AdminsSheet api={api} me={account.email} onClose={() => setAdmins(false)} />}
    </div>
  );
}

function WorkerRow({ r, isCurrent, me, onOpen }) {
  const lv = r.pct == null ? 'idle' : level(r.pct, 100);
  const tl = r.today ? (r.today.odd ? 'bad' : level(r.today.pct, 100)) : 'idle';
  return (
    <button class={`wrow ${r.blocked ? 'blocked' : ''}`} onClick={onOpen}>
      <span class="avatar">{initials(r.name)}</span>
      <span class="wmain">
        <span class="wname">
          <span class="wname-text">{r.name}</span>
          {me && <em class="badge">ви</em>}
          {r.blocked && <em class="badge bad">закрито</em>}
        </span>
        <span class="wsub">
          {isCurrent && (
            <span class={`wtoday lv-text ${tl}`}>
              сьогодні {r.today ? `${r.today.odd ? '⚠ ' : r.today.approx ? '≈' : ''}${pctText(r.today.pct, 0)}%` : '—'}
            </span>
          )}
          <span>
            {r.n} {plural(r.n, ['день', 'дні', 'днів'])}
          </span>
          {r.odd > 0 && <span class="wflag bad">⚠ {r.odd}</span>}
          {r.approx > 0 && <span class="wflag warn">≈ {r.approx}</span>}
        </span>
      </span>
      <span class="wright">
        <span class={`pill lv-${lv}`}>{r.pct == null ? '—' : `${pctText(r.pct)}%`}</span>
        {r.delta != null && Math.abs(r.delta) >= 0.05 && (
          <small class={r.delta > 0 ? 'up' : 'down'}>
            {r.delta > 0 ? '▲' : '▼'} {fmt(Math.abs(r.delta), 1)}
          </small>
        )}
      </span>
    </button>
  );
}

// ---------- Картка працівника ----------

function WorkerSheet({ member, row, api, me, adminEmail, onChanged, onClose }) {
  const [data, setData] = useState(null);
  const [view, setView] = useState('stats');
  const [dayOpen, setDayOpen] = useState(null);
  useEffect(() => {
    api.loadWorker(member.uid).then(
      (d) => setData({ settings: normalizeSettings(d.settings), days: d.days }),
      () => setData({ error: true }),
    );
  }, [member.uid]);

  async function toggleBlock() {
    const closing = !member.blocked;
    const ok = await ask(
      closing
        ? {
            title: `Закрити доступ для ${member.name}?`,
            text: 'Працівник не зможе зберігати дні в акаунті й побачить повідомлення, що доступ закрито. Уже внесені дані лишаться, їх можна дивитись. Доступ можна відкрити будь-коли.',
            ok: 'Закрити доступ',
            danger: true,
          }
        : { title: `Відкрити доступ для ${member.name}?`, ok: 'Відкрити доступ' },
    );
    if (!ok) return;
    try {
      await api.setBlocked(member.uid, closing, adminEmail);
      toast(closing ? 'Доступ закрито' : 'Доступ відкрито', 'ok', 'check');
      onChanged();
    } catch {
      toast('Не вдалося — перевірте інтернет', 'err');
    }
  }

  const ctx = data?.days && {
    settings: data.settings,
    days: data.days,
    readOnly: true,
    setSettings: () => {},
    setDays: () => {},
    switchDate: () => {},
    openSettings: () => {},
    go: () => {},
    editDay: () => {},
    openDay: (d) => setDayOpen(d),
    sync: { mode: 'cloud', provider: 'norma', status: 'saved' },
  };

  return (
    <Sheet
      title={member.name}
      sub={`${member.email} · ${ago(row?.lastActive)}`}
      onClose={onClose}
      tall
      footer={
        !me && (
          <button class={`btn ${member.blocked ? 'primary' : 'ghost danger-text'} block`} onClick={toggleBlock}>
            <Icon name="lock" size={18} /> {member.blocked ? 'Відкрити доступ' : 'Закрити доступ'}
          </button>
        )
      }
    >
      {row?.n > 0 && (
        <div class="wfacts">
          <div>
            <span>Середнє за місяць</span>
            <b class={`lv-text ${level(row.pct, 100)}`}>{pctText(row.pct)}%</b>
          </div>
          <div>
            <span>Мета на місяць</span>
            <b>{fmt(row.goal, 0)}%</b>
          </div>
          <div>
            <span>Простій</span>
            <b>{fmtMin(row.downMin) || '0'}</b>
          </div>
        </div>
      )}
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'stats', label: 'Статистика' },
          { value: 'history', label: 'Історія' },
        ]}
      />
      {!data && <p class="hint center">Завантажую…</p>}
      {data?.error && <p class="hint center">Не вдалося завантажити дані працівника</p>}
      {ctx && (
        <AppCtx.Provider value={ctx}>
          <div class="worker-view">{view === 'stats' ? <Stats /> : <History />}</div>
          {dayOpen && <DaySheet date={dayOpen} onClose={() => setDayOpen(null)} />}
        </AppCtx.Provider>
      )}
    </Sheet>
  );
}

// ---------- Адміністратори ----------

function AdminsSheet({ api, me, onClose }) {
  const [list, setList] = useState(null);
  const [email, setEmail] = useState('');
  const load = () => api.listAdmins().then(setList, () => setList([]));
  useEffect(() => void load(), []);
  const valid = /^[^@\s/]+@[^@\s/]+\.[^@\s/]+$/.test(email.trim());

  async function add() {
    if (!valid) return;
    try {
      await api.addAdmin(email, me);
      setEmail('');
      toast('Адміністратора додано', 'ok', 'check');
      load();
    } catch {
      toast('Не вдалося додати', 'err');
    }
  }
  async function remove(a) {
    if (!(await ask({ title: `Прибрати ${a.email} з адміністраторів?`, ok: 'Прибрати', danger: true }))) return;
    try {
      await api.removeAdmin(a.email);
      load();
    } catch {
      toast('Не вдалося прибрати', 'err');
    }
  }
  return (
    <Sheet title="Адміністратори" sub="Бачать усіх працівників і можуть закривати доступ" onClose={onClose} tall>
      <div class="list">
        {(list || []).map((a) => (
          <div class="lrow split">
            <span class="lrow-main static">
              <span class="lrow-name">{a.email}</span>
              {a.email === me && <em>ви</em>}
            </span>
            {a.email !== me && (
              <button class="icon-btn" onClick={() => remove(a)} aria-label={`Прибрати ${a.email}`}>
                <Icon name="x" size={17} />
              </button>
            )}
          </div>
        ))}
        {!list && <p class="hint">Завантажую…</p>}
        {list && !list.length && <p class="hint">Додаткових адміністраторів немає.</p>}
      </div>
      <div class="sec-label">Додати адміністратора</div>
      <div class="inline-form">
        <input class="input" type="email" inputMode="email" placeholder="пошта Google, напр. name@gmail.com" value={email} onInput={(e) => setEmail(e.currentTarget.value)} />
        <button class="btn primary" disabled={!valid} onClick={add}>
          Додати
        </button>
      </div>
      <p class="hint">
        Адміністратор входить через Google з цією поштою. Права діють після його наступного входу. Головний адміністратор (з
        налаштувань публікації) має доступ завжди і в цьому списку не показується.
      </p>
    </Sheet>
  );
}
