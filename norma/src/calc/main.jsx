import './styles.css';
import { render } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { today } from '../util.js';
import { connect, FATAL, fromSnapshot, mergeDays, monthBody, monthId } from './cloud.js';
import { AppCtx } from './ctx.js';
import { DaySheet, History, longDate } from './History.jsx';
import { computeDay, DEFAULT_SETTINGS, isBlank, normalizeSettings, sameRecord, toRecord } from './model.js';
import { Settings } from './Settings.jsx';
import { Stats } from './Stats.jsx';
import { clearAll, draftFromRecord, loadAll, newDraft, saveDays, saveDraft, saveSettings } from './store.js';
import { Today } from './Today.jsx';
import { ask, Asker, Icon, toast, Toaster } from './ui.jsx';

const TABS = [
  { id: 'today', label: 'Сьогодні', icon: 'gauge' },
  { id: 'stats', label: 'Статистика', icon: 'chart' },
  { id: 'history', label: 'Історія', icon: 'history' },
];

// Тему задає сторінка, у яку вбудовано калькулятор; власний вибір лише перекриває її.
const hostTheme = document.documentElement.getAttribute('data-theme');
const AUTOSAVE_MS = 700;

function App() {
  const init = useMemo(() => {
    const s = loadAll(today());
    const t = today();
    const rec = toRecord(s.draft, s.settings.base);
    const saved = s.days[s.draft.date];
    const valid = computeDay(rec, rec.base).valid;
    // зміни, які не встигли записатись (застосунок закрили одразу після введення)
    s.pending = saved ? !sameRecord(rec, saved) : !isBlank(s.draft);
    if (s.draft.date < t && (!s.pending || valid)) {
      // відкрили наступного дня: минулий день дописуємо, показуємо сьогоднішній
      if (s.pending && !isBlank(s.draft)) s.days = { ...s.days, [rec.date]: { ...rec, savedAt: Date.now() } };
      else if (s.pending && saved) {
        s.days = Object.fromEntries(Object.entries(s.days).filter(([d]) => d !== rec.date));
        s.deleted = { [rec.date]: Date.now() };
      }
      s.draft = newDraft(t, s.settings, s.days);
      s.pending = false;
    }
    return s;
  }, []);
  const [settings, setSettingsState] = useState(init.settings);
  const [days, setDaysState] = useState(init.days);
  const [draft, setDraftState] = useState(init.draft);
  const [sync, setSync] = useState({ mode: typeof window.claude?.use === 'function' ? 'connecting' : 'local', status: 'saved', at: null });
  const [tab, setTab] = useState('today');
  const [seen, setSeen] = useState({ today: true });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState(null);
  const scrolls = useRef({});

  // Найсвіжіший стан для відкладених дій (автозбереження, знімки з акаунта)
  const latest = useRef({});
  latest.current.settings = settings;
  latest.current.days = days;
  latest.current.draft = draft;
  const cloud = useRef(null);
  const tomb = useRef(init.deleted || {}); // дата → коли день видалили (щоб він не «воскрес» з іншого пристрою)
  const wipedAt = useRef(0);
  const edited = useRef(init.pending);
  const timer = useRef();

  // Пам'ять браузера — швидкий запасний кеш (і єдине сховище поза claude.ai)
  useEffect(() => void saveSettings(settings), [settings]);
  useEffect(() => void saveDays(days), [days]);
  useEffect(() => void saveDraft(draft), [draft]);

  useEffect(() => {
    const t = settings.theme;
    const root = document.documentElement;
    if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t);
    else if (hostTheme) root.setAttribute('data-theme', hostTheme);
    else root.removeAttribute('data-theme');
  }, [settings.theme]);

  // ---------- Запис в акаунт ----------

  function pushMonth(next, month) {
    const c = cloud.current;
    if (!c) return;
    const body = monthBody(next, month, tomb.current);
    const empty = !Object.keys(body.days).length && !Object.keys(body.deleted).length;
    c.write(monthId(month), empty ? null : body);
  }

  function pushSettings(next) {
    cloud.current?.write('settings', { kind: 'settings', ...next, ...(wipedAt.current ? { wipedAt: wipedAt.current } : {}) });
  }

  /** Єдиний шлях зміни днів: оновлює стан і записує лише змінені місяці. */
  function commitDays(next) {
    const prev = latest.current.days;
    if (typeof next === 'function') next = next(prev);
    const months = new Set();
    for (const d of new Set([...Object.keys(prev), ...Object.keys(next)])) {
      if (prev[d] === next[d]) continue;
      months.add(d.slice(0, 7));
      if (!next[d]) tomb.current[d] = Date.now();
      else delete tomb.current[d];
    }
    latest.current.days = next;
    setDaysState(next);
    months.forEach((m) => pushMonth(next, m));
    refreshDraft(next, prev); // напр., відновили з копії день, який зараз відкрито
  }

  function commitSettings(next) {
    if (typeof next === 'function') next = next(latest.current.settings);
    latest.current.settings = next;
    setSettingsState(next);
    pushSettings(next);
  }

  // ---------- Автозбереження дня ----------

  /** Записати поточний день, якщо його змінювали (порожній день — видалити). */
  function commitDraft() {
    clearTimeout(timer.current);
    if (!edited.current) return;
    edited.current = false;
    const { draft: d, days: all, settings: st } = latest.current;
    const saved = all[d.date];
    if (isBlank(d)) {
      if (saved) commitDays(({ [d.date]: _, ...rest }) => rest);
      return;
    }
    const rec = toRecord(d, st.base);
    if (!computeDay(rec, rec.base).valid) return; // з помилкою не зберігаємо — лишається попередній запис
    if (saved && !saved.sample && sameRecord(rec, saved)) return;
    commitDays((x) => ({ ...x, [rec.date]: { ...rec, savedAt: Date.now() } }));
  }

  function setDraftUser(fn) {
    edited.current = true;
    setDraftState(fn);
  }

  useEffect(() => {
    if (!edited.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(commitDraft, AUTOSAVE_MS);
  }, [draft]);

  // Закрили застосунок чи перемкнулись — дописати все одразу
  useEffect(() => {
    const flush = () => {
      commitDraft();
      cloud.current?.flushAll();
    };
    const onVis = () => document.visibilityState === 'hidden' && flush();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', flush);
    };
  }, []);

  // ---------- Підключення до акаунта ----------

  /** Якщо чернетку не чіпали, а день змінився в акаунті (інший пристрій) — показати свіжий. */
  function refreshDraft(nextDays, prevDays) {
    if (edited.current) return;
    const { draft: d, settings: st } = latest.current;
    const before = prevDays[d.date];
    const after = nextDays[d.date];
    const rec = toRecord(d, st.base);
    const clean = before ? sameRecord(rec, before) : isBlank(d);
    if (!clean) return;
    if (after && !sameRecord(rec, after)) setDraftState(draftFromRecord(after));
    else if (!after && before) setDraftState(newDraft(d.date, st, nextDays)); // день видалили — показати порожній
  }

  function reconcile(remote) {
    const local = { days: latest.current.days, settings: latest.current.settings };
    wipedAt.current = remote.settings?.wipedAt || 0;
    if (remote.settings) {
      const s = normalizeSettings(remote.settings);
      latest.current.settings = s;
      setSettingsState(s);
    } else pushSettings(local.settings);
    const { days: merged, touched } = mergeDays(remote, local.days, wipedAt.current);
    // видалені тут, поки акаунт ще не підключився
    for (const [d, t] of Object.entries(tomb.current)) {
      const r = merged[d];
      if (r && !local.days[d] && (r.savedAt || 0) < t) {
        delete merged[d];
        touched.add(d.slice(0, 7));
      }
    }
    latest.current.days = merged;
    setDaysState(merged);
    touched.forEach((m) => pushMonth(merged, m));
    refreshDraft(merged, local.days);
    setSync({ mode: 'cloud', status: touched.size || !remote.settings ? 'saving' : 'saved', at: Date.now() });
    if (touched.size && remote.empty)
      cloud.current.flushAll().then(() => cloud.current && toast('Дані перенесено у ваш акаунт Claude — тепер вони не загубляться', 'ok', 'shield'));
  }

  function applyRemote(remote) {
    const c = cloud.current;
    if (!c) return;
    const local = latest.current.days;
    const next = {};
    const months = new Set([...Object.keys(local).map((d) => d.slice(0, 7)), ...remote.months]);
    for (const m of months) {
      const src = c.isPending(monthId(m)) ? local : remote.days; // свої незаписані зміни важливіші
      for (const [d, r] of Object.entries(src)) if (d.slice(0, 7) === m) next[d] = r;
    }
    for (const d of Object.keys(next)) {
      const a = local[d];
      const b = next[d];
      if (a && a !== b && sameRecord(a, b) && a.savedAt === b.savedAt && !a.sample === !b.sample) next[d] = a;
    }
    const keys = Object.keys(next);
    if (keys.length !== Object.keys(local).length || keys.some((d) => next[d] !== local[d])) {
      latest.current.days = next;
      setDaysState(next);
      refreshDraft(next, local);
    }
    if (remote.settings) {
      wipedAt.current = remote.settings.wipedAt || wipedAt.current;
      if (!c.isPending('settings')) {
        const s = normalizeSettings(remote.settings);
        if (JSON.stringify(s) !== JSON.stringify(latest.current.settings)) {
          latest.current.settings = s;
          setSettingsState(s);
        }
      }
    }
  }

  useEffect(() => {
    let alive = true;
    let unsub = null;
    // попросити браузер не витирати памʼять сайту при нестачі місця
    navigator.storage?.persist?.().catch(() => {});
    connect().then(({ mode, cloud: c }) => {
      if (!alive) return;
      if (!c) return setSync((s) => ({ ...s, mode }));
      let warned = false; // про збій мережі кажемо раз, а не на кожну спробу
      c.onStatus((st) => {
        if (st === 'saved') warned = false;
        setSync((s) => ({ ...s, status: st, at: st === 'saved' ? Date.now() : s.at }));
      });
      c.onError((e) => {
        if (e?.code === 'invalid_argument' || e?.code === 'revoked' || e?.code === 'not_granted') {
          cloud.current = null;
          setSync({ mode: 'denied', status: 'saved', at: null });
          toast('Немає дозволу зберігати в акаунті — дані лишаються лише на цьому пристрої', 'err');
        } else if (e?.code === 'quota_exceeded') toast('Сховище заповнене: видаліть приклад або старі дні', 'err');
        else if (!FATAL.has(e?.code) && !warned) {
          warned = true;
          toast('Не вдалося зберегти в акаунт — дані на телефоні, спробую ще', 'err');
        }
      });
      let ready = false;
      let tries = 0;
      const listen = () => {
        unsub = c.subscribe(onSnap, (e) => {
          if (!alive) return;
          if (FATAL.has(e?.code)) {
            cloud.current = null;
            return setSync({ mode: 'denied', status: 'saved', at: null });
          }
          setSync((s) => ({ ...s, status: 'error' }));
          // звʼязок обірвався — підписатися знову
          if (tries++ < 8) setTimeout(() => alive && listen(), 2000 * tries);
        });
      };
      const onSnap = (snap) => {
        // перший знімок із кешу може бути неповним — зводимо дані лише з остаточним
        if (!ready && snap.metadata?.fromCache) return;
        tries = 0;
        const remote = fromSnapshot(snap);
        for (const [d, t] of Object.entries(remote.deleted)) tomb.current[d] = Math.max(t, tomb.current[d] || 0);
        if (ready) return applyRemote(remote);
        ready = true;
        cloud.current = c; // писати в акаунт лише після зведення, щоб не затерти дні з інших пристроїв
        reconcile(remote);
      };
      listen();
    });
    return () => {
      alive = false;
      unsub?.();
    };
  }, []);

  // ---------- Навігація ----------

  function go(id) {
    if (id === tab) return window.scrollTo({ top: 0, behavior: 'smooth' });
    scrolls.current[tab] = window.scrollY;
    setTab(id);
    setSeen((s) => ({ ...s, [id]: true }));
    requestAnimationFrame(() => window.scrollTo(0, scrolls.current[id] || 0));
  }

  /** Перейти до іншої дати: поточний день записується одразу. */
  async function switchDate(date, toTab = false) {
    if (!date || date > today()) return;
    const { draft: d, settings: st } = latest.current;
    if (date !== d.date) {
      if (edited.current && !isBlank(d) && !computeDay(d, st.base).valid) {
        const ok = await ask({
          title: 'День не збережено',
          text: `У розрахунку за ${longDate(d.date).toLowerCase()} помилка в часі зміни чи простої, тому його не збережено. Перейти без збереження?`,
          ok: 'Перейти',
          danger: true,
        });
        if (!ok) return;
        edited.current = false;
      }
      commitDraft();
      edited.current = false;
      const all = latest.current.days;
      setDraftState(all[date] ? draftFromRecord(all[date]) : newDraft(date, latest.current.settings, all));
    }
    if (toTab) go('today');
  }

  async function wipeAll() {
    const c = cloud.current;
    clearTimeout(timer.current);
    edited.current = false;
    if (c) {
      wipedAt.current = Date.now();
      const months = new Set([...Object.keys(latest.current.days), ...Object.keys(tomb.current)].map((d) => d.slice(0, 7)));
      months.forEach((m) => c.write(monthId(m), null));
      c.write('settings', { kind: 'settings', ...normalizeSettings(DEFAULT_SETTINGS), wipedAt: wipedAt.current });
      await c.flushAll();
    }
    clearAll();
    location.reload();
  }

  const api = {
    settings,
    setSettings: commitSettings,
    days,
    setDays: commitDays,
    draft,
    setDraft: setDraftUser,
    sync,
    switchDate,
    go,
    wipeAll,
    openSettings: () => setSettingsOpen(true),
    openDay: (date) => setDayOpen(date),
    editDay: (date) => switchDate(date, true),
  };

  return (
    <AppCtx.Provider value={api}>
      <div class="app" data-tab={tab}>
        <main class="main">
          <div hidden={tab !== 'today'}>
            <Today />
          </div>
          {seen.stats && (
            <div hidden={tab !== 'stats'}>
              <Stats />
            </div>
          )}
          {seen.history && (
            <div hidden={tab !== 'history'}>
              <History />
            </div>
          )}
        </main>
        <nav class="tabbar" aria-label="Розділи">
          {TABS.map((t) => (
            <button class={tab === t.id ? 'on' : ''} onClick={() => go(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
              <span class="tab-ico">
                <Icon name={t.icon} size={22} />
              </span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
        {dayOpen && <DaySheet date={dayOpen} onClose={() => setDayOpen(null)} />}
        <Toaster />
        <Asker />
      </div>
    </AppCtx.Provider>
  );
}

render(<App />, document.getElementById('app'));
