// Шкала прайд-режиму: веселка-дуга з хмарками на кінцях, по якій біжить єдиноріг — від лівої хмарки (0)
// до правої (мета). Біла зірочка — де за графіком маєте бути зараз. Розрахунок той самий, це лише вигляд.
import { pctText } from './model.js';
import { useTween } from './ui.jsx';

const CX = 160;
const CY = 146;
const R = 148; // зовнішній край веселки
const BAND = 8;
const COLORS = ['#ff3b3b', '#ff9500', '#ffd60a', '#34c759', '#2f80ff', '#a24dff'];
const RADII = COLORS.map((_, i) => R - BAND / 2 - i * BAND);
const FOOT = R - (BAND * COLORS.length) / 2; // середина веселки — там стоять хмарки

const arc = (r) => `M ${CX - r} ${CY} A ${r} ${r} 0 0 1 ${CX + r} ${CY}`;
/** Точка на дузі: t від 0 (ліва хмарка) до 1 (права). */
const at = (t, r) => {
  const a = Math.PI * (1 - t);
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
};
const ease = (k) => k * k * (3 - 2 * k);
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const EDGE = 0.14; // на цій частині дуги єдиноріг злітає з хмарки / сідає на хмарку
const CLOUD_TOP = CY - 14;

/** Де стоїть єдиноріг і як нахилений: на хмарці — рівно, над дугою — уздовж неї. */
function unicornAt(t) {
  const fly = (x) => at(x, R + 4);
  const tiltAt = (x) => (x - 0.5) * 70;
  if (t < EDGE) {
    const k = ease(t / EDGE);
    return { p: mix([CX - FOOT, CLOUD_TOP], fly(EDGE), k), tilt: tiltAt(EDGE) * k };
  }
  if (t > 1 - EDGE) {
    const k = ease((t - (1 - EDGE)) / EDGE);
    return { p: mix(fly(1 - EDGE), [CX + FOOT, CLOUD_TOP], k), tilt: tiltAt(1 - EDGE) * (1 - k) };
  }
  return { p: fly(t), tilt: tiltAt(t) };
}

export function RainbowGauge({ pct, goal, has, pace, approx, onHow, disabled }) {
  const t = useTween(has ? Math.min(1, Math.max(0, pct / goal)) : 0, 800);
  const shown = useTween(has ? pct : 0);
  const over = has && pct >= goal - 0.05;
  const { p, tilt } = unicornAt(t);
  const star = pace?.state === 'live' ? at(Math.min(1, pace.frac), R + 9) : null;
  return (
    <div class={`rg ${has ? 'go' : 'idle'} ${over ? 'over' : ''}`}>
      <svg viewBox="0 -52 320 218" aria-hidden="true">
        <defs>
          <linearGradient id="rg-horn" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stop-color="#f59e0b" />
            <stop offset="1" stop-color="#fde68a" />
          </linearGradient>
        </defs>
        <g fill="none" stroke-width={BAND + 0.6}>
          {COLORS.map((c, i) => (
            <path class="rg-track" d={arc(RADII[i])} stroke={c} />
          ))}
          {COLORS.map((c, i) => (
            <path class="rg-fill" d={arc(RADII[i])} stroke={c} pathLength="100" stroke-dasharray="100 100" stroke-dashoffset={100 - t * 100} />
          ))}
        </g>
        <Cloud x={CX - FOOT} />
        <Cloud x={CX + FOOT} />
        {star && <Star x={star[0]} y={star[1]} />}
        <g transform={`translate(${p[0].toFixed(2)} ${p[1].toFixed(2)}) rotate(${tilt.toFixed(1)}) scale(1.35)`}>
          <Unicorn />
        </g>
      </svg>
      <button class="rg-num r-num" onClick={onHow} disabled={disabled} aria-label={`Виконання ${pctText(has ? pct : 0)}%. Як пораховано`}>
        {approx && <i>≈</i>}
        {pctText(shown, 1)}
        <small>%</small>
      </button>
    </div>
  );
}

function Cloud({ x }) {
  return (
    <g class="rg-cloud" transform={`translate(${x} ${CY + 4})`}>
      <ellipse cx="0" cy="6" rx="30" ry="9" />
      <circle cx="-15" cy="1" r="10" />
      <circle cx="1" cy="-5" r="13" />
      <circle cx="16" cy="1" r="10" />
    </g>
  );
}

function Star({ x, y }) {
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(1.4)`}>
      <path class="rg-star" d="M0 -6 L1.7 -1.8 L6 -1.8 L2.6 0.9 L3.8 5.2 L0 2.7 L-3.8 5.2 L-2.6 0.9 L-6 -1.8 L-1.7 -1.8 Z" />
    </g>
  );
}

const MANE = ['#ff3b3b', '#ff9500', '#ffd60a', '#34c759', '#2f80ff', '#a24dff'];

/** Єдиноріг дивиться праворуч; (0, 0) — між копитами, тож стоїть просто на дузі. */
function Unicorn() {
  return (
    <g class="uni" transform="translate(-20 -35)">
      <g class="uni-bob">
        <g class="uni-sparks">
          <path d="M-6 8 l1.2 2.8 2.8 1.2 -2.8 1.2 -1.2 2.8 -1.2 -2.8 -2.8 -1.2 2.8 -1.2 z" />
          <path d="M-2 22 l0.9 2 2 0.9 -2 0.9 -0.9 2 -0.9 -2 -2 -0.9 2 -0.9 z" />
          <path d="M-12 17 l0.7 1.6 1.6 0.7 -1.6 0.7 -0.7 1.6 -0.7 -1.6 -1.6 -0.7 1.6 -0.7 z" />
        </g>
        <g class="uni-tail">
          {MANE.map((c, i) => (
            <path d={`M9 ${17 + i * 0.6} C ${2 - i * 0.4} ${15 + i * 1.6}, ${-1 - i * 0.3} ${22 + i * 1.2}, ${2 + i * 0.5} ${29 + i * 0.4}`} stroke={c} />
          ))}
        </g>
        <g class="uni-leg back">
          <rect x="9.5" y="22" width="3.6" height="11.5" rx="1.8" />
          <rect x="13.6" y="22" width="3.6" height="11.5" rx="1.8" />
        </g>
        <g class="uni-leg front">
          <rect x="22" y="22" width="3.6" height="11.5" rx="1.8" />
          <rect x="26" y="22" width="3.6" height="11.5" rx="1.8" />
        </g>
        <ellipse class="uni-white" cx="19" cy="20" rx="12" ry="7.8" />
        <path class="uni-white" d="M24 18 C 25 12, 27 8, 29 6 L 35 11 C 32 14, 30 18, 29 22 Z" />
        <ellipse class="uni-white" cx="32" cy="9.5" rx="6.6" ry="5.4" />
        <ellipse cx="37" cy="12" rx="3.6" ry="2.9" fill="#ffe4f1" />
        <circle cx="38.2" cy="11.4" r="0.6" fill="#f472b6" />
        <g class="uni-mane">
          {MANE.map((c, i) => (
            <circle cx={27.6 - i * 0.9} cy={5 + i * 2.7} r={2.7 - i * 0.12} fill={c} />
          ))}
        </g>
        <path d="M31.6 5 L 36.6 -4.8 L 34.6 5.6 Z" fill="url(#rg-horn)" />
        <path d="M33 2.6 L35.4 2.2 M33.8 0.2 L35.8 -0.1" stroke="#f59e0b" stroke-width="0.7" />
        <path class="uni-white" d="M29.4 5.6 L 29.4 1 L 32 4.2 Z" />
        <circle cx="33.4" cy="8.8" r="1.35" fill="#2b1150" />
        <circle cx="33.9" cy="8.3" r="0.45" fill="#fff" />
        <circle cx="35.2" cy="12" r="1.4" fill="#f9a8d4" opacity="0.8" />
      </g>
    </g>
  );
}
