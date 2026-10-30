import './styles.css';
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { normalizeSettings } from './calc.js';
import { bootstrapOwner, watchAccess, watchPeople, watchProducts, watchSettings } from './data.js';
import { configured, demo, demoApi, logOut, watchUser } from './firebase.js';
import { Admin } from './screens/Admin.jsx';
import { Login, NoAccess, NotConfigured, PageError, Splash } from './screens/Auth.jsx';
import { Calc } from './screens/Calc.jsx';
import { Journal } from './screens/Journal.jsx';
import { Asker, ask, Icon, Logo, Segmented, Sheet, Toaster } from './ui.jsx';
import { initials, normEmail, store } from './util.js';

function App() {
  const [user, setUser] = useState(undefined);
  const [access, setAccess] = useState(undefined);
  const [products, setProducts] = useState(null);
  const [settings, setSettings] = useState(null);
  const [people, setPeople] = useState([]);
  const [fatal, setFatal] = useState(null);

  useEffect(() => (configured ? watchUser((u) => setUser(u || null)) : undefined), []);

  const email = user ? normEmail(user.email) : null;

  useEffect(() => {
    if (!email) {
      setAccess(undefined);
      return;
    }
    let tried = false;
    return watchAccess(
      email,
      async (a) => {
        if (!a && !tried) {
          tried = true;
          try {
            // Спрацює лише для власника, вписаного в правила бази
            await bootstrapOwner(user, email);
            return;
          } catch {
            /* не власник */
          }
        }
        setAccess(a && (a.active || a.owner) ? a : null);
      },
      () => setAccess(null),
    );
  }, [email]);

  const ok = Boolean(access);
  const isAdmin = ok && (access.role === 'admin' || Boolean(access.owner));

  useEffect(() => {
    if (!ok) return;
    const u1 = watchProducts(setProducts, setFatal);
    const u2 = watchSettings((s) => setSettings(normalizeSettings(s)), setFatal);
    return () => {
      u1();
      u2();
    };
  }, [ok]);

  useEffect(() => {
    if (!isAdmin) return;
    return watchPeople(setPeople, () => setPeople([]));
  }, [isAdmin]);

  if (!configured) return <NotConfigured />;
  if (user === undefined) return <Splash />;
  if (!user) return <Login />;
  if (access === undefined) return <Splash />;
  if (access === null) return <NoAccess email={email} />;
  if (fatal) return <PageError error={fatal} />;
  if (!products || !settings) return <Splash />;

  return (
    <Shell
      key={email}
      user={user}
      me={email}
      myName={access.name || user.displayName || email}
      isAdmin={isAdmin}
      products={products}
      settings={settings}
      people={people}
    />
  );
}

const TABS = [
  { id: 'calc', label: 'Розрахунок', icon: 'gauge' },
  { id: 'journal', label: 'Журнал', icon: 'list' },
  { id: 'admin', label: 'Керування', icon: 'sliders', admin: true },
];

function Shell({ user, me, myName, isAdmin, products, settings, people }) {
  const [tab, setTab] = useState('calc');
  const [seen, setSeen] = useState({ calc: true });
  const [request, setRequest] = useState(null);
  const [account, setAccount] = useState(false);
  const [dirty, setDirty] = useState(false);

  const open = (id) => {
    setTab(id);
    setSeen((s) => ({ ...s, [id]: true }));
    window.scrollTo({ top: 0 });
  };

  // Попередження при закритті вкладки з незбереженим записом
  useEffect(() => {
    if (!dirty) return;
    const h = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    addEventListener('beforeunload', h);
    return () => removeEventListener('beforeunload', h);
  }, [dirty]);

  return (
    <div class="app">
      <header class="top">
        <div class="brand">
          <Logo size={30} />
          <span>Норма</span>
          {demo && <span class="tag demo-tag">демо</span>}
        </div>
        <button class="avatar-btn" onClick={() => setAccount(true)} aria-label="Акаунт">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" referrerpolicy="no-referrer" />
          ) : (
            <span class="avatar">{initials(myName)}</span>
          )}
        </button>
      </header>

      <main>
        <div hidden={tab !== 'calc'}>
          <Calc
            me={me}
            myName={myName}
            isAdmin={isAdmin}
            people={people}
            products={products}
            settings={settings}
            request={request}
            onDirty={setDirty}
          />
        </div>
        {seen.journal && (
          <div hidden={tab !== 'journal'}>
            <Journal
              me={me}
              myName={myName}
              isAdmin={isAdmin}
              people={people}
              onOpen={(date, email) => {
                setRequest({ date, email });
                open('calc');
              }}
            />
          </div>
        )}
        {isAdmin && seen.admin && (
          <div hidden={tab !== 'admin'}>
            <Admin me={me} products={products} people={people} settings={settings} />
          </div>
        )}
      </main>

      <nav class="tabbar">
        {TABS.filter((t) => !t.admin || isAdmin).map((t) => (
          <button class={tab === t.id ? 'on' : ''} onClick={() => open(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
            <span class="tab-ico">
              <Icon name={t.icon} size={22} />
            </span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <AccountSheet open={account} onClose={() => setAccount(false)} user={user} me={me} myName={myName} isAdmin={isAdmin} dirty={dirty} />
      <Toaster />
      <Asker />
    </div>
  );
}

// ---------- Акаунт, тема, встановлення ----------

let installEvent = null;
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvent = e;
});

export function applyTheme(t) {
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  const dark = t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a0d14' : '#f3f4f8');
}

function DemoPanel({ me, onClose }) {
  const [people, setPeople] = useState([]);
  useEffect(() => (demo ? watchPeople(setPeople) : undefined), []);
  return (
    <>
      <div class="card notice">
        <Icon name="info" />
        <p class="small">
          Демо-режим: усі вироби, люди й записи вигадані та зберігаються лише в цьому браузері. Вхід через Google і
          захист даних увімкнуться після підключення Firebase.
        </p>
      </div>
      <div class="field">
        <span class="field-label">Подивитися програму очима</span>
        <div class="presets">
          {people
            .filter((p) => p.active || p.owner)
            .sort((a, b) => (b.owner ? 2 : b.role === 'admin') - (a.owner ? 2 : a.role === 'admin'))
            .map((p) => (
              <button
                class={`preset ${p.email === me ? 'on' : ''}`}
                key={p.email}
                onClick={() => {
                  onClose();
                  demoApi.signInAs(p.email);
                }}
              >
                <span>
                  <b>{p.name}</b>
                  <small>{p.owner ? 'власник, бачить усе' : p.role === 'admin' ? 'адміністратор, бачить усе' : 'працівник, бачить лише свої записи'}</small>
                </span>
                {p.email === me && <Icon name="check" />}
              </button>
            ))}
        </div>
      </div>
      <button
        class="btn ghost block"
        onClick={async () => {
          if (!(await ask({ title: 'Скинути демо-дані?', text: 'Усі ваші зміни в демо зникнуть, повернуться початкові приклади.', ok: 'Скинути', danger: true })))
            return;
          await demoApi.reset();
          onClose();
        }}
      >
        <Icon name="refresh" size={18} /> Скинути демо-дані
      </button>
    </>
  );
}

function AccountSheet({ open, onClose, user, me, myName, isAdmin, dirty }) {
  const [theme, setTheme] = useState(store('norma.theme') || 'auto');
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const [installHint, setInstallHint] = useState(false);

  async function install() {
    if (installEvent) {
      installEvent.prompt();
      await installEvent.userChoice.catch(() => {});
      installEvent = null;
      onClose();
    } else setInstallHint(true);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Акаунт">
      <div class="account">
        {user.photoURL ? (
          <img class="avatar lg" src={user.photoURL} alt="" referrerpolicy="no-referrer" />
        ) : (
          <span class="avatar lg">{initials(myName)}</span>
        )}
        <div>
          <b>{myName}</b>
          <small>{me}</small>
          <span class="tag accent">{isAdmin ? 'Адміністратор' : 'Працівник'}</span>
        </div>
      </div>
      {demo ? (
        <DemoPanel me={me} onClose={onClose} />
      ) : (
        <>
      <div class="field">
        <span class="field-label">Тема</span>
        <Segmented
          value={theme}
          onChange={(t) => {
            setTheme(t);
            store('norma.theme', t);
            applyTheme(t);
          }}
          options={[
            { value: 'auto', label: 'Авто' },
            { value: 'light', label: 'Світла' },
            { value: 'dark', label: 'Темна' },
          ]}
        />
      </div>
      {!standalone && (
        <button class="btn soft block" onClick={install}>
          <Icon name="phone" size={18} /> Встановити на телефон
        </button>
      )}
      {installHint && (
        <p class="muted small">
          {ios
            ? 'У Safari натисніть «Поділитися» (квадрат зі стрілкою) → «На початковий екран».'
            : 'Відкрийте меню браузера (⋮) → «Додати на головний екран» або «Встановити застосунок».'}
        </p>
      )}
      <button
        class="btn ghost block danger-text"
        onClick={async () => {
          if (dirty && !(await ask({ title: 'Вийти без збереження?', text: 'Незбережений запис буде втрачено.', ok: 'Вийти', danger: true })))
            return;
          await logOut();
          location.reload();
        }}
      >
        <Icon name="logout" size={18} /> Вийти
      </button>
        </>
      )}
    </Sheet>
  );
}

// У демо тему задає сторінка, у яку вбудовано програму
if (!demo) {
  applyTheme(store('norma.theme') || 'auto');
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => applyTheme(store('norma.theme') || 'auto'));
}

render(<App />, document.getElementById('app'));

if (!demo && 'serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
