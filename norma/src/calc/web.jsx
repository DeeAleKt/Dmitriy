// Вебверсія «Норми» з акаунтами: кожен працівник входить у свій акаунт, адміністратор бачить усіх.
// Без налаштованого Firebase (docs/config.js) працює як простий калькулятор з даними лише на телефоні.
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

  useEffect(() => watchUser((u) => setUser(u || null)), []);
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
  if (!user) return <AuthScreen />;
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
