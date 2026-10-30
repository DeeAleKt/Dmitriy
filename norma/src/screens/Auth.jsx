import { useState } from 'preact/hooks';
import rulesTemplate from '../../firestore.rules';
import { logOut, signInGoogle } from '../firebase.js';
import { errText, GoogleMark, Icon, Logo, Spinner, toast } from '../ui.jsx';

export function Splash() {
  return (
    <div class="auth">
      <div class="auth-card">
        <div class="pulse">
          <Logo size={64} />
        </div>
        <Spinner />
      </div>
    </div>
  );
}

export function Login() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function go() {
    setBusy(true);
    setErr('');
    try {
      await signInGoogle();
    } catch (e) {
      setErr(errText(e));
      setBusy(false);
    }
  }
  return (
    <div class="auth">
      <div class="auth-card">
        <Logo size={72} />
        <h1>Норма</h1>
        <p class="muted">Розрахунок і облік виконання норм виробітку</p>
        <button class="btn google block" onClick={go} disabled={busy}>
          {busy ? <Spinner /> : <GoogleMark />} Увійти через Google
        </button>
        {err && <p class="danger-text small">{err}</p>}
        <p class="muted small lock-note">
          <Icon name="lock" size={14} /> Доступ лише для запрошених людей
        </p>
      </div>
    </div>
  );
}

export function NoAccess({ email }) {
  const [open, setOpen] = useState(false);
  const rules = rulesTemplate.replaceAll("'OWNER_EMAIL'", `'${email}'`);
  const copy = async (text, msg) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(msg);
    } catch {
      toast('Не вдалося скопіювати', 'err');
    }
  };
  return (
    <div class="auth">
      <div class="auth-card wide">
        <div class="empty-ico big">
          <Icon name="lock" size={30} />
        </div>
        <h1>Немає доступу</h1>
        <p class="muted">
          Ви увійшли як <b class="nowrap">{email}</b>. Цієї адреси немає у списку доступу. Попросіть адміністратора
          додати її, а потім оновіть сторінку.
        </p>
        <div class="row">
          <button class="btn soft grow" onClick={() => copy(email, 'Адресу скопійовано')}>
            <Icon name="copy" size={18} /> Копіювати адресу
          </button>
          <button
            class="btn ghost grow"
            onClick={async () => {
              await logOut();
              location.reload();
            }}
          >
            <Icon name="logout" size={18} /> Інший акаунт
          </button>
        </div>
        <button class="link owner-toggle" onClick={() => setOpen(!open)}>
          Я власник і налаштовую програму вперше <Icon name="down" size={16} class={open ? 'flip' : ''} />
        </button>
        {open && (
          <div class="owner-setup">
            <ol class="small">
              <li>Скопіюйте правила нижче — у них уже вписано вашу адресу як власника.</li>
              <li>
                Firebase Console → <b>Firestore Database</b> → вкладка <b>Rules</b> → замініть весь текст → <b>Publish</b>.
              </li>
              <li>Зачекайте хвилину й оновіть цю сторінку.</li>
            </ol>
            <button class="btn primary block" onClick={() => copy(rules, 'Правила скопійовано')}>
              <Icon name="copy" size={18} /> Копіювати правила
            </button>
            <pre class="rules">{rules}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export function NotConfigured() {
  return (
    <div class="auth">
      <div class="auth-card wide">
        <Logo size={64} />
        <h1>Майже готово</h1>
        <p class="muted">
          Програму ще не під’єднано до бази Firebase. Вставте налаштування у файл <code>docs/config.js</code> —
          покрокова інструкція в <code>norma/README.md</code>.
        </p>
      </div>
    </div>
  );
}

export function PageError({ error }) {
  return (
    <div class="auth">
      <div class="auth-card wide">
        <div class="empty-ico big">
          <Icon name="info" size={30} />
        </div>
        <h1>Не вдалося завантажити</h1>
        <p class="muted">{errText(error)}</p>
        <button class="btn primary block" onClick={() => location.reload()}>
          <Icon name="refresh" size={18} /> Спробувати ще раз
        </button>
      </div>
    </div>
  );
}
