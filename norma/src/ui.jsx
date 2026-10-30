import { useEffect, useRef, useState } from 'preact/hooks';
import { level } from './calc.js';
import { fmt } from './util.js';

// ---------- Іконки (обведення 24×24) ----------

const P = {
  gauge: 'M12 14l4-4 M3.34 19a10 10 0 1 1 17.32 0',
  list: 'M8 6h13 M8 12h13 M8 18h13 M3.5 6h.01 M3.5 12h.01 M3.5 18h.01',
  sliders: 'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6',
  plus: 'M5 12h14 M12 5v14',
  minus: 'M5 12h14',
  x: 'M18 6 6 18 M6 6l12 12',
  check: 'M20 6 9 17l-5-5',
  left: 'm15 18-6-6 6-6',
  right: 'm9 18 6-6-6-6',
  down: 'm6 9 6 6 6-6',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3',
  trash: 'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
  pause: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M10 15V9 M14 15V9',
  box: 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z M3.3 7 12 12l8.7-5 M12 22V12',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  lock: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z M7 11V7a5 5 0 0 1 10 0v4',
  refresh: 'M3 12a9 9 0 0 1 15.74-5.26L21 9 M21 3v6h-6 M21 12a9 9 0 0 1-15.74 5.26L3 15 M3 21v-6h6',
  copy: 'M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8 M16 6l-4-4-4 4 M12 2v13',
  calendar: 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M16 2v4 M8 2v4 M3 10h18',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41',
  phone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z M12 18h.01',
  note: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5',
  chart: 'M3 3v18h18 M7 16v-3 M12 16V8 M17 16v-6',
  sparkle: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',
};

export function Icon({ name, size = 20, class: cls = '' }) {
  return (
    <svg
      class={`ico ${cls}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d={P[name]} />
    </svg>
  );
}

export function Logo({ size = 32 }) {
  return (
    <svg class="logo" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#6366f1" />
          <stop offset="1" stop-color="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#lg)" />
      <circle cx="32" cy="33" r="17" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="6" />
      <path d="M32 16a17 17 0 1 1-16.2 22" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" />
      <path d="M25 33.5l5 5 9-10" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}

export function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

// ---------- Кільце виконання ----------

export function Ring({ percent, size = 196, stroke = 16 }) {
  const c = size / 2;
  const r = c - stroke / 2 - 2;
  const len = 2 * Math.PI * r;
  const main = Math.max(0, Math.min(percent, 100)) / 100;
  const r2 = r - stroke - 3;
  const len2 = 2 * Math.PI * r2;
  const over = Math.max(0, Math.min(percent - 100, 100)) / 100;
  return (
    <svg class={`ring ${level(percent)}`} viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
      <circle class="ring-track" cx={c} cy={c} r={r} stroke-width={stroke} />
      <circle
        class="ring-bar"
        cx={c}
        cy={c}
        r={r}
        stroke-width={stroke}
        stroke-dasharray={len}
        stroke-dashoffset={len * (1 - main)}
        transform={`rotate(-90 ${c} ${c})`}
      />
      {over > 0 && (
        <circle
          class="ring-over"
          cx={c}
          cy={c}
          r={r2}
          stroke-width={6}
          stroke-dasharray={len2}
          stroke-dashoffset={len2 * (1 - over)}
          transform={`rotate(-90 ${c} ${c})`}
        />
      )}
    </svg>
  );
}

export function Pct({ value, class: cls = '' }) {
  return <span class={`pct ${level(value)} ${cls}`}>{fmt(value, 1)}%</span>;
}

// ---------- Нижня шторка ----------

let locks = 0;

export function Sheet({ open, onClose, title, children, footer, tall }) {
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    if (!locks++) document.documentElement.classList.add('lock');
    const auto = ref.current?.querySelector('[data-autofocus]');
    if (auto && matchMedia('(pointer: fine)').matches) auto.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      if (!--locks) document.documentElement.classList.remove('lock');
      prev?.focus?.({ preventScroll: true });
    };
  }, [open]);
  if (!open) return null;
  return (
    <div class="sheet-wrap" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class={`sheet ${tall ? 'tall' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div class="sheet-handle" />
        <header class="sheet-head">
          <h2>{title}</h2>
          <button class="icon-btn" onClick={onClose} aria-label="Закрити">
            <Icon name="x" />
          </button>
        </header>
        <div class="sheet-body">{children}</div>
        {footer && <footer class="sheet-foot">{footer}</footer>}
      </div>
    </div>
  );
}

// ---------- Сповіщення і підтвердження ----------

let setToastFn;
export function toast(msg, kind = 'ok') {
  setToastFn?.({ msg, kind, id: Math.random() });
}

export function Toaster() {
  const [t, setT] = useState(null);
  setToastFn = setT;
  useEffect(() => {
    if (!t) return;
    const h = setTimeout(() => setT(null), t.kind === 'err' ? 5000 : 2400);
    return () => clearTimeout(h);
  }, [t]);
  if (!t) return null;
  return (
    <div class={`toast ${t.kind}`} key={t.id} role="status" onClick={() => setT(null)}>
      <Icon name={t.kind === 'err' ? 'info' : 'check'} size={18} />
      <span>{t.msg}</span>
    </div>
  );
}

let setAskFn;
/** await ask({title, text, ok, danger}) → true/false */
export function ask(opts) {
  return new Promise((resolve) => setAskFn?.({ ...opts, resolve }));
}

export function Asker() {
  const [a, setA] = useState(null);
  setAskFn = setA;
  if (!a) return null;
  const done = (v) => {
    a.resolve(v);
    setA(null);
  };
  return (
    <Sheet
      open
      title={a.title}
      onClose={() => done(false)}
      footer={
        <div class="row">
          <button class="btn ghost grow" onClick={() => done(false)}>
            {a.cancel || 'Скасувати'}
          </button>
          <button class={`btn grow ${a.danger ? 'danger' : 'primary'}`} onClick={() => done(true)}>
            {a.ok || 'Так'}
          </button>
        </div>
      }
    >
      {a.text && <p class="muted">{a.text}</p>}
    </Sheet>
  );
}

// ---------- Дрібні елементи форм ----------

export function Segmented({ value, options, onChange, small }) {
  return (
    <div class={`seg ${small ? 'small' : ''}`} role="tablist">
      {options.map((o) => (
        <button
          type="button"
          role="tab"
          aria-selected={value === o.value}
          class={value === o.value ? 'on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label class="field">
      <span class="field-label">{label}</span>
      {children}
      {hint && <span class="field-hint">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label class="toggle">
      <span>
        <span class="toggle-label">{label}</span>
        {hint && <span class="field-hint">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.currentTarget.checked)} />
      <i />
    </label>
  );
}

export function Stepper({ value, onChange, step = 1, label }) {
  const n = parseFloat(String(value).replace(',', '.')) || 0;
  const set = (v) => onChange(String(Math.max(0, Math.round(v * 1000) / 1000)).replace('.', ','));
  return (
    <div class="stepper">
      <button type="button" class="step-btn" onClick={() => set(n - step)} aria-label="Менше" disabled={n <= 0}>
        <Icon name="minus" />
      </button>
      <input
        class="step-input"
        inputMode="decimal"
        aria-label={label}
        value={value}
        placeholder="0"
        onFocus={(e) => e.currentTarget.select()}
        onInput={(e) => onChange(e.currentTarget.value.replace(/[^\d.,]/g, ''))}
      />
      <button type="button" class="step-btn" onClick={() => set(n + step)} aria-label="Більше">
        <Icon name="plus" />
      </button>
    </div>
  );
}

export function Spinner() {
  return <span class="spinner" aria-label="Завантаження" />;
}

export function Empty({ icon = 'box', title, children }) {
  return (
    <div class="empty">
      <div class="empty-ico">
        <Icon name={icon} size={26} />
      </div>
      <b>{title}</b>
      {children && <p>{children}</p>}
    </div>
  );
}

export function errText(e) {
  const code = e?.code || '';
  if (code.includes('permission-denied')) return 'Немає прав на цю дію';
  if (code.includes('unavailable')) return 'Немає з’єднання з сервером. Спробуйте ще раз';
  if (code.includes('popup-closed') || code.includes('cancelled-popup')) return '';
  if (code.includes('unauthorized-domain'))
    return 'Цей сайт не додано в Firebase → Authentication → Settings → Authorized domains';
  if (code.includes('network')) return 'Проблема з мережею';
  return e?.message || 'Щось пішло не так';
}
