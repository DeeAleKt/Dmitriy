// Вебверсія «Норми». Вхід — за бажанням: без нього калькулятор працює з даними лише на телефоні,
// а в акаунті дані зберігаються на сервері, доступні з будь-якого телефона, і їх бачить адміністратор.
// Без налаштованого Firebase (docs/config.js) входу немає зовсім.
import './styles.css';
import { render } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { App } from './App.jsx';
import { AuthScreen, BlockedScreen, NameScreen, Splash } from './Auth.jsx';
import { createCloud } from './cloud.js';
import * as fb from './fb.js';
import { configured, logOut, setName, userCollection, watchProfile, watchUser } from './fb.js';
import { setScope } from './store.js';

function Root() {
  const [user, setUser] = useState(undefined); // undefined — ще не відомо, null — не ввійшов
  const [profile, setProfile] = useState(null);
  const [login, setLogin] = useState(false); // показати екран входу поверх калькулятора

  useEffect(
    () =>
      watchUser((u) => {
        setUser(u || null);
        if (u) setLogin(false);
      }),
    [],
  );
  useEffect(() => {
    setProfile(null);
    if (!user) return;
    return watchProfile(user, setProfile);
  }, [user?.uid]);

  const backend = useMemo(() => {
    if (!user) return null;
    setScope(user.uid); // памʼять телефона — окрема для кожного акаунта
    return {
      provider: 'norma',
      connect: () => Promise.resolve({ mode: 'cloud', cloud: createCloud(userCollection(user.uid)) }),
      signOut: logOut,
      team: {
        loadTeam: fb.loadTeam,
        loadWorker: fb.loadWorker,
        setBlocked: fb.setBlocked,
        listAdmins: fb.listAdmins,
        addAdmin: fb.addAdmin,
        removeAdmin: fb.removeAdmin,
      },
    };
  }, [user?.uid]);

  if (user === undefined) return <Splash />;
  if (!user) {
    setScope(null); // без акаунта — спільна памʼять телефона
    return (
      <>
        <App key="guest" backend={{ provider: 'local', connect: null, signIn: () => setLogin(true) }} />
        {login && <AuthScreen onClose={() => setLogin(false)} />}
      </>
    );
  }
  if (!profile) return <Splash />;
  if (profile.blocked) return <BlockedScreen email={user.email} onSignOut={logOut} />;
  if (profile.loaded && !profile.name) return <NameScreen onSave={(n) => setName(user, n)} onSignOut={logOut} />;
  const account = {
    uid: user.uid,
    name: profile.name,
    email: profile.email || user.email,
    isAdmin: profile.isAdmin,
    rename: (n) => setName(user, n),
  };
  return <App key={user.uid} backend={{ ...backend, account }} />;
}

if (configured) render(<Root />, document.getElementById('app'));
else render(<App backend={{ provider: 'local', connect: null }} />, document.getElementById('app'));
