// Шкала-«манометр» від 0 до 150 %: позначка норми на 100 %, окрема — на особистій меті.
import { fmt } from '../util.js';
import { useTween } from './ui.jsx';

const CX = 120;
const CY = 112;
const R = 94;
const FROM = 150; // градусів: лівий нижній край
const SWEEP = 240;
const MAX = 150;

const pt = (deg, r) => {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};
const angleOf = (v) => FROM + (Math.min(Math.max(v, 0), MAX) / MAX) * SWEEP;

const [SX, SY] = pt(FROM, R);
const [EX, EY] = pt(FROM + SWEEP, R);
const ARC = `M ${SX.toFixed(2)} ${SY.toFixed(2)} A ${R} ${R} 0 1 1 ${EX.toFixed(2)} ${EY.toFixed(2)}`;

const TICKS = Array.from({ length: MAX / 10 + 1 }, (_, i) => i * 10);

export function Gauge({ pct, goal = 100, sub = 'виконання норми' }) {
  const shown = useTween(Number.isFinite(pct) ? pct : 0);
  const f = Math.min(Math.max(shown, 0), MAX) / MAX;
  const offset = 100 - f * 100;
  const [gx1, gy1] = pt(angleOf(goal), R + 11);
  const [gx2, gy2] = pt(angleOf(goal), R - 11);
  return (
    <div class="gauge">
      <svg viewBox="0 0 240 182" aria-hidden="true">
        <defs>
          <filter id="gglow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        <path class="g-track" d={ARC} pathLength="100" />
        {f > 0.003 && (
          <>
            <path class="g-glow" d={ARC} pathLength="100" stroke-dasharray="100 100" stroke-dashoffset={offset} filter="url(#gglow)" />
            <path class="g-bar" d={ARC} pathLength="100" stroke-dasharray="100 100" stroke-dashoffset={offset} />
          </>
        )}
        {TICKS.map((v) => {
          const major = v % 50 === 0;
          const [x1, y1] = pt(angleOf(v), R - (major ? 21 : 16));
          const [x2, y2] = pt(angleOf(v), R - 10);
          return <line class={`g-tick ${major ? 'major' : ''} ${v === 100 ? 'norm' : ''}`} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
        {[0, 50, 100, 150].map((v) => {
          const [x, y] = pt(angleOf(v), R + 18);
          return (
            <text class={`g-label ${v === 100 ? 'norm' : ''}`} x={x} y={y + 4} text-anchor="middle">
              {v}
            </text>
          );
        })}
        {goal !== 100 && <line class="g-goal" x1={gx1} y1={gy1} x2={gx2} y2={gy2} />}
      </svg>
      <div class="g-center">
        <div class="g-num">
          {fmt(shown, 1)}
          <small>%</small>
        </div>
        <div class="g-sub">{sub}</div>
      </div>
    </div>
  );
}
