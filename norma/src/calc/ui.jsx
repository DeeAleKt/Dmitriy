import { useEffect, useRef, useState } from 'preact/hooks';

// ---------- Іконки (обведення 24×24) ----------

const P = {
  gauge: 'M12 14l4-4 M3.34 19a10 10 0 1 1 17.32 0',
  chart: 'M3 3v18h18 M18 17V9 M13 17V5 M8 17v-3',
  history: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8 M3 3v5h5 M12 7v5l4 2',
  sliders: 'M20 7h-9 M14 17H5 M17 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M7 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  plus: 'M12 5v14 M5 12h14',
  minus: 'M5 12h14',
  x: 'M18 6 6 18 M6 6l12 12',
  check: 'M20 6 9 17l-5-5',
  left: 'm15 18-6-6 6-6',
  right: 'm9 18 6-6-6-6',
  down: 'm6 9 6 6 6-6',
  box: 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z M3.3 7 12 12l8.7-5 M12 22V12',
  pause: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M10 15V9 M14 15V9',
  wrench:
    'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
  flame:
    'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  trophy:
    'M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22 M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22 M18 2H6v7a6 6 0 0 0 12 0V2Z',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  zap: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  calendar: 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M16 2v4 M8 2v4 M3 10h18',
  trash: 'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01',
  sparkle: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',
  bookmark: 'm19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z',
  pencil: 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z',
  up: 'm22 7-8.5 8.5-5-5L2 17 M16 7h6v6',
  down2: 'm22 17-8.5-8.5-5 5L2 7 M16 17h6v-6',
  flat: 'M4 12h15 M15 8l4 4-4 4',
  bulb: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5 M9 18h6 M10 22h4',
  reset: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8 M3 3v5h5',
  sheet: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h2 M14 13h2 M8 17h2 M14 17h2',
  shield:
    'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3',
  coffee: 'M10 2v2 M14 2v2 M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1 M6 2v2',
  play: 'M6 3l14 9-14 9V3z',
  cloud: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z',
  cloudCheck: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z M9 13.5l2 2 4-4',
  cloudOff: 'M2 2l20 20 M5.78 5.77A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.31-.2 M21.53 16.07A4.5 4.5 0 0 0 17.5 10h-1.79A7 7 0 0 0 10 5.07',
  phone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z M12 18h.01',
  copy: 'M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2',
};

export function Icon({ name, size = 20, class: cls = '' }) {
  return (
    <svg class={`ico ${cls}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d={P[name] || P.info} />
    </svg>
  );
}

export function Logo({ size = 30 }) {
  return (
    <svg class="logo" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lgc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#6366f1" />
          <stop offset="1" stop-color="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#lgc)" />
      <circle cx="32" cy="33" r="17" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="6" />
      <path d="M32 16a17 17 0 1 1-16.2 22" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" />
      <path d="M25 33.5l5 5 9-10" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}

// ---------- Шторка знизу ----------

let locks = 0;
let depth = 0;

export function Sheet({ title, onClose, children, footer, tall, sub }) {
  const ref = useRef();
  const [z] = useState(() => 60 + ++depth * 2);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && Number(ref.current?.dataset.z) === 60 + depth * 2 && onClose();
    document.addEventListener('keydown', onKey);
    if (!locks++) document.documentElement.classList.add('lock');
    const auto = ref.current?.querySelector('[data-autofocus]');
    if (auto && matchMedia('(pointer: fine)').matches) auto.focus();
    return () => {
      depth--;
      document.removeEventListener('keydown', onKey);
      if (!--locks) document.documentElement.classList.remove('lock');
    };
  }, []);
  return (
    <div class="sheet-wrap" style={{ zIndex: z }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class={`sheet ${tall ? 'tall' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref} data-z={z}>
        <div class="sheet-grab" />
        <header class="sheet-head">
          <div>
            <h2>{title}</h2>
            {sub && <p class="sheet-sub">{sub}</p>}
          </div>
          <button class="round-btn" onClick={onClose} aria-label="Закрити">
            <Icon name="x" size={18} />
          </button>
        </header>
        <div class="sheet-body">{children}</div>
        {footer && <footer class="sheet-foot">{footer}</footer>}
      </div>
    </div>
  );
}

// ---------- Діалог підтвердження (window.confirm у вбудованій сторінці не працює) ----------

let setAsk;
export const ask = (opts) => new Promise((resolve) => setAsk?.({ ...opts, resolve }));

export function Asker() {
  const [a, setA] = useState(null);
  setAsk = setA;
  if (!a) return null;
  const done = (v) => {
    a.resolve(v);
    setA(null);
  };
  return (
    <div class="dialog-wrap" onClick={(e) => e.target === e.currentTarget && done(null)}>
      <div class="dialog" role="alertdialog" aria-modal="true" aria-label={a.title}>
        <h3>{a.title}</h3>
        {a.text && <p>{a.text}</p>}
        <div class="dialog-btns">
          {(a.buttons || [
            { label: a.cancel || 'Скасувати', value: false },
            { label: a.ok || 'Так', value: true, kind: a.danger ? 'danger' : 'primary' },
          ]).map((b) => (
            <button class={`btn ${b.kind || 'ghost'}`} onClick={() => done(b.value)}>
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Сповіщення (знизу: зверху в застосунку Claude заважають кнопки) ----------

let setToastFn;
export function toast(msg, kind = 'ok', icon) {
  setToastFn?.({ msg, kind, icon, id: Math.random() });
}

export function Toaster() {
  const [t, setT] = useState(null);
  setToastFn = setT;
  useEffect(() => {
    if (!t) return;
    const h = setTimeout(() => setT(null), t.kind === 'err' ? 4500 : 2600);
    return () => clearTimeout(h);
  }, [t]);
  if (!t) return null;
  return (
    <div class={`toast ${t.kind}`} key={t.id} role="status" onClick={() => setT(null)}>
      <Icon name={t.icon || (t.kind === 'err' ? 'info' : 'check')} size={18} />
      <span>{t.msg}</span>
    </div>
  );
}

// ---------- Поля ----------

export function Segmented({ value, options, onChange, small }) {
  return (
    <div class={`seg ${small ? 'small' : ''}`} role="tablist">
      {options.map((o) => (
        <button type="button" role="tab" aria-selected={value === o.value} class={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label class="toggle">
      <span>
        <span class="toggle-label">{label}</span>
        {hint && <span class="hint">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.currentTarget.checked)} />
      <i />
    </label>
  );
}

/** Повтор дії, поки кнопку втримують (як на лічильнику). */
function useHold(action) {
  const timer = useRef();
  const fn = useRef(action);
  fn.current = action;
  const stop = () => clearTimeout(timer.current);
  useEffect(() => stop, []);
  const start = (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    fn.current();
    let n = 0;
    const tick = () => {
      fn.current();
      n++;
      timer.current = setTimeout(tick, n > 12 ? 45 : 95);
    };
    timer.current = setTimeout(tick, 420);
  };
  return {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: (e) => e.preventDefault(),
    // клавіатура: Enter/Пробіл дають click із detail = 0
    onClick: (e) => e.detail === 0 && fn.current(),
  };
}

export const cleanNum = (s) => String(s).replace(/[^\d.,]/g, '').replace(/([.,].*)[.,]/g, '$1');
const toNum = (s) => parseFloat(String(s).replace(',', '.')) || 0;

export function Stepper({ value, onChange, label, step = 1 }) {
  const ref = useRef(value);
  ref.current = value;
  const bump = (d) => {
    const v = Math.max(0, Math.round((toNum(ref.current) + d) * 100) / 100);
    try {
      navigator.vibrate?.(6);
    } catch {
      /* немає вібрації */
    }
    onChange(v ? String(v).replace('.', ',') : '');
  };
  const minus = useHold(() => bump(-step));
  const plus = useHold(() => bump(step));
  return (
    <div class="stepper">
      <button type="button" class="step-btn" aria-label="Менше" disabled={toNum(value) <= 0} {...minus}>
        <Icon name="minus" />
      </button>
      <input
        class="step-input"
        inputMode="decimal"
        aria-label={label}
        value={value}
        placeholder="0"
        onFocus={(e) => e.currentTarget.select()}
        onInput={(e) => onChange(cleanNum(e.currentTarget.value))}
      />
      <button type="button" class="step-btn" aria-label="Більше" {...plus}>
        <Icon name="plus" />
      </button>
    </div>
  );
}

export function Empty({ icon = 'sparkle', title, children, action }) {
  return (
    <div class="empty">
      <div class="empty-ico">
        <Icon name={icon} size={26} />
      </div>
      <b>{title}</b>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function CardHead({ icon, title, aside, tone }) {
  return (
    <div class="card-head">
      <h3>
        <span class={`head-ico ${tone || ''}`}>
          <Icon name={icon} size={17} />
        </span>
        {title}
      </h3>
      {aside != null && aside !== false && <span class="card-aside">{aside}</span>}
    </div>
  );
}

/** Плавна зміна числа (для великого відсотка). */
export function useTween(target, ms = 450) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !Number.isFinite(target)) {
      from.current = target;
      setV(target);
      return;
    }
    const a = from.current;
    const t0 = performance.now();
    let raf;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const cur = a + (target - a) * e;
      from.current = cur;
      setV(cur);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}
