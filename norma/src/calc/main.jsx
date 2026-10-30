import './styles.css';
import { render } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { fmt, plural, today } from '../util.js';
import { AppCtx } from './ctx.js';
import { buzz, confetti } from './fx.js';
import { DaySheet, History, longDate } from './History.jsx';
import { bestDay, computeDay, isBlank, sameRecord, streak, toRecord } from './model.js';
import { Settings } from './Settings.jsx';
import { Stats } from './Stats.jsx';
import { draftFromRecord, loadAll, newDraft, saveDays, saveDraft, saveSettings } from './store.js';
import { Today } from './Today.jsx';
import { ask, Asker, Icon, toast, Toaster } from './ui.jsx';

const TABS = [
  { id: 'today', label: 'Сьогодні', icon: 'gauge' },
  { id: 'stats', label: 'Статистика', icon: 'chart' },
  { id: 'history', label: 'Історія', icon: 'history' },
];

// Тему задає сторінка, у яку вбудовано калькулятор; власний вибір лише перекриває її.
const hostTheme = document.documentElement.getAttribute('data-theme');

function App() {
  const init = useMemo(() => {
    const s = loadAll(today());
    // відкрили наступного дня: незмінена чернетка минулого дня поступається сьогоднішній
    const t = today();
    if (s.draft.date < t) {
      const saved = s.days[s.draft.date];
      const clean = saved ? sameRecord(toRecord(s.draft, s.settings.base), saved) : isBlank(s.draft);
      if (clean) s.draft = newDraft(t, s.settings, s.days);
    }
    return s;
  }, []);
  const [settings, setSettings] = useState(init.settings);
  const [days, setDays] = useState(init.days);
  const [draft, setDraft] = useState(init.draft);
  const [tab, setTab] = useState('today');
  const [seen, setSeen] = useState({ today: true });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState(null);
  const scrolls = useRef({});

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

  function go(id) {
    if (id === tab) return window.scrollTo({ top: 0, behavior: 'smooth' });
    scrolls.current[tab] = window.scrollY;
    setTab(id);
    setSeen((s) => ({ ...s, [id]: true }));
    requestAnimationFrame(() => window.scrollTo(0, scrolls.current[id] || 0));
  }

  const isDirty = () => {
    const saved = days[draft.date];
    return saved ? saved.sample || !sameRecord(toRecord(draft, settings.base), saved) : !isBlank(draft);
  };

  function saveDay(d = draft) {
    const rec = { ...toRecord(d, settings.base), savedAt: Date.now() };
    const c = computeDay(rec, rec.base);
    const before = bestDay(Object.fromEntries(Object.entries(days).filter(([k]) => k !== rec.date)));
    const next = { ...days, [rec.date]: rec };
    setDays(next);
    celebrate(c, before, next);
    return next;
  }

  function celebrate(c, before, next) {
    const goal = settings.goal;
    const met = c.valid && c.pct >= goal - 0.05;
    const st = streak(next, goal);
    const record = before && Object.keys(next).length >= 4 && c.pct > before.pct + 0.05;
    if (record) {
      toast(`Новий рекорд: ${fmt(c.pct, 1)}%!`, 'ok', 'trophy');
      if (settings.celebrate) confetti({ y: 0.85, count: 200 });
      buzz(40);
    } else if (met && st.cur >= 2) {
      toast(`Збережено · серія ${st.cur} ${plural(st.cur, ['день', 'дні', 'днів'])} з нормою`, 'ok', 'flame');
      if (settings.celebrate) confetti({ y: 0.85, count: 120 });
    } else toast(met ? 'День збережено · норму виконано' : `День збережено · ${fmt(c.pct, 1)}%`);
  }

  /** Перейти до іншої дати в розрахунку (з питанням, якщо є незбережене). */
  async function switchDate(date, toTab = false) {
    if (!date || date > today()) return;
    let source = days;
    if (date !== draft.date && isDirty()) {
      const choice = await ask({
        title: 'Зберегти зміни?',
        text: `У розрахунку за ${longDate(draft.date).toLowerCase()} є незбережені зміни.`,
        buttons: [
          { label: 'Не зберігати', value: 'drop' },
          { label: 'Зберегти', value: 'save', kind: 'primary' },
        ],
      });
      if (!choice) return;
      if (choice === 'save') {
        if (!computeDay(draft, settings.base).valid) {
          toast('Цей день не можна зберегти: перевірте час зміни та простій', 'err');
          return;
        }
        source = saveDay();
      }
    }
    if (date !== draft.date) setDraft(source[date] ? draftFromRecord(source[date]) : newDraft(date, settings, source));
    if (toTab) go('today');
  }

  const api = {
    settings,
    setSettings,
    days,
    setDays,
    draft,
    setDraft,
    saveDay: () => saveDay(),
    switchDate,
    go,
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
