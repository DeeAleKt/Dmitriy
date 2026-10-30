// Вхід і реєстрація: через Google або поштою з паролем. Кожен працівник — свій акаунт.
import { useEffect, useState } from 'preact/hooks';
import { authMessage, redirectError, register, resetPassword, signInEmail, signInGoogle } from './fb.js';
import { Icon, Logo, Segmented } from './ui.jsx';

const GOOGLE = (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

/** Повідомлення про те, хто бачить дані, — однакове на вході й у налаштуваннях. */
export const VISIBILITY =
  'Ваші дні, відсотки, вироби й простої бачите ви та адміністратор (керівник). Інші працівники їх не бачать.';

export function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    redirectError().then((e) => e && setErr(authMessage(e) || ''));
  }, []);

  async function run(fn) {
    setErr('');
    setInfo('');
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      const m = authMessage(e);
      if (m) setErr(m);
    } finally {
      setBusy(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    if (mode === 'register') {
      if (name.trim().length < 2) return setErr('Вкажіть імʼя та прізвище — так вас побачить адміністратор');
      run(() => register(name, email, pass));
    } else run(() => signInEmail(email, pass));
  }

  function forgot() {
    if (!/\S+@\S+\.\S+/.test(email)) return setErr('Впишіть пошту, на яку зареєстровано акаунт, і натисніть ще раз');
    run(async () => {
      await resetPassword(email);
      setInfo(`Лист для зміни пароля надіслано на ${email.trim()}. Перевірте також «Спам».`);
    });
  }

  return (
    <div class="auth">
      <div class="auth-card">
        <div class="auth-brand">
          <Logo size={56} />
          <h1>Норма</h1>
          <p>Калькулятор виконання норми — з вашою особистою статистикою</p>
        </div>

        <button class="btn google block" disabled={busy} onClick={() => run(signInGoogle)}>
          {GOOGLE} Увійти через Google
        </button>

        <div class="auth-or">
          <span>або поштою</span>
        </div>

        <Segmented
          value={mode}
          onChange={(v) => {
            setMode(v);
            setErr('');
            setInfo('');
          }}
          options={[
            { value: 'login', label: 'Вхід' },
            { value: 'register', label: 'Реєстрація' },
          ]}
        />

        <form class="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <label class="field">
              <span class="field-label">Імʼя та прізвище</span>
              <input class="input" autocomplete="name" maxLength={80} placeholder="Напр.: Олена Коваль" value={name} onInput={(e) => setName(e.currentTarget.value)} />
            </label>
          )}
          <label class="field">
            <span class="field-label">Пошта</span>
            <input class="input" type="email" inputMode="email" autocomplete="email" placeholder="name@gmail.com" value={email} onInput={(e) => setEmail(e.currentTarget.value)} />
          </label>
          <label class="field">
            <span class="field-label">Пароль</span>
            <span class="pass">
              <input
                class="input"
                type={show ? 'text' : 'password'}
                autocomplete={mode === 'register' ? 'new-password' : 'current-password'}
                placeholder={mode === 'register' ? 'Щонайменше 6 символів' : ''}
                value={pass}
                onInput={(e) => setPass(e.currentTarget.value)}
              />
              <button type="button" class="pass-eye" onClick={() => setShow(!show)} aria-label={show ? 'Сховати пароль' : 'Показати пароль'}>
                <Icon name={show ? 'eyeOff' : 'eye'} size={20} />
              </button>
            </span>
          </label>
          {err && (
            <p class="auth-msg err" role="alert">
              <Icon name="info" size={16} /> {err}
            </p>
          )}
          {info && (
            <p class="auth-msg ok" role="status">
              <Icon name="check" size={16} /> {info}
            </p>
          )}
          <button class="btn primary block" type="submit" disabled={busy || !email || !pass}>
            {busy ? 'Зачекайте…' : mode === 'register' ? 'Створити акаунт' : 'Увійти'}
          </button>
          {mode === 'login' && (
            <button type="button" class="link auth-forgot" onClick={forgot} disabled={busy}>
              Забули пароль?
            </button>
          )}
        </form>

        <p class="auth-note">
          <Icon name="shield" size={16} />
          <span>{VISIBILITY}</span>
        </p>
      </div>
    </div>
  );
}

/** Акаунт без імені (рідко: вхід без імені в профілі Google) — попросити представитись. */
export function NameScreen({ onSave, onSignOut }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const ok = name.trim().length >= 2;
  return (
    <div class="auth">
      <form
        class="auth-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (!ok) return;
          setBusy(true);
          onSave(name).finally(() => setBusy(false));
        }}
      >
        <div class="auth-brand">
          <Logo size={48} />
          <h1>Як вас звати?</h1>
          <p>Так вас бачитиме адміністратор у списку працівників</p>
        </div>
        <label class="field">
          <span class="field-label">Імʼя та прізвище</span>
          <input class="input" data-autofocus autocomplete="name" maxLength={80} value={name} onInput={(e) => setName(e.currentTarget.value)} />
        </label>
        <button class="btn primary block" type="submit" disabled={!ok || busy}>
          Продовжити
        </button>
        <button type="button" class="link auth-forgot" onClick={onSignOut}>
          Вийти
        </button>
      </form>
    </div>
  );
}

export function BlockedScreen({ email, onSignOut }) {
  return (
    <div class="auth">
      <div class="auth-card">
        <div class="auth-brand">
          <span class="blocked-ico">
            <Icon name="shield" size={30} />
          </span>
          <h1>Доступ закрито</h1>
          <p>Адміністратор закрив доступ для акаунта {email}. Якщо це помилка — зверніться до свого керівника.</p>
        </div>
        <button class="btn soft block" onClick={onSignOut}>
          Вийти з акаунта
        </button>
      </div>
    </div>
  );
}

export function Splash() {
  return (
    <div class="auth splash" aria-busy="true">
      <Logo size={64} />
    </div>
  );
}
