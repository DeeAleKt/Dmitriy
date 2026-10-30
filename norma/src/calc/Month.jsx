// Мета на календарний місяць: картка з підказками і вікно, де мету задають.
import { useMemo, useState } from 'preact/hooks';
import { fmt, fmtMin, plural } from '../util.js';
import { level, monthGoalOf, monthStatus, num, openDayOf, withDay } from './model.js';
import { cleanNum, Icon, Sheet, Toggle } from './ui.jsx';

export const MONTHS_NOM = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
export const MONTHS_GEN = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
const GOALS = [90, 95, 100, 105, 110, 115, 120, 125, 130];

const mIdx = (month) => Number(month.slice(5, 7)) - 1;
export const monthName = (month) => `${MONTHS_NOM[mIdx(month)]} ${month.slice(0, 4)}`;
const workdaysLabel = (n) => `${n} ${plural(n, ['робочий день', 'робочі дні', 'робочих днів'])}`;
const signed = (x, d = 1) => `${x > 0 ? '+' : x < 0 ? '−' : '±'}${fmt(Math.abs(x), d)}%`;

/** Стан місяця для картки: сьогоднішня незавершена зміна рахується окремо («з сьогоднішнім днем»). */
export function useMonth(days, settings, month, todayISO) {
  return useMemo(() => {
    const goal = monthGoalOf(settings, month);
    const open = month === todayISO.slice(0, 7) ? openDayOf(days, todayISO) : null;
    return { ...monthStatus(days, month, todayISO, goal, settings.workdays, open), open };
  }, [days, settings, month, todayISO]);
}

/**
 * Підказки: скільки бракує до мети, скільки треба в решту днів, і — якщо сьогодні робочий день —
 * скільки зробити сьогодні, щоб іти за планом місяця.
 * today: { res, base } — поточний розрахунок дня (лише для сьогодні).
 */
export function monthHints(m, today = null) {
  const out = [];
  const g = m.goal;
  if (!m.n) {
    if (!m.closed) out.push({ icon: 'calendar', text: `Середнє зʼявиться після першої завершеної зміни. Мета — ${fmt(g, 0)}% у середньому за місяць.` });
    return out;
  }
  const approx = m.approxDays ? { icon: 'info', text: `≈ ${m.approxDays} ${plural(m.approxDays, ['день', 'дні', 'днів'])} пораховано з приблизною нормою — середнє орієнтовне` } : null;
  if (m.closed) {
    if (approx) out.push(approx);
    out.push(
      m.reached
        ? { icon: 'trophy', tone: 'good', text: `Місяць закрито на ${fmt(m.pct, 1)}% — мету ${fmt(g, 0)}% досягнуто` }
        : { icon: 'target', tone: 'bad', text: `Місяць закрито на ${fmt(m.pct, 1)}% — до мети ${fmt(g, 0)}% забракло ${fmt(g - m.pct, 1)}%` },
    );
    return out;
  }
  if (approx) out.push(approx);
  if (m.short > 0.5) out.push({ icon: 'target', tone: 'warn', text: `До мети бракує ${fmt(g - m.pct, 1)}% — це ${fmtMin(m.short)} нормо-часу понад звичайну роботу` });
  else out.push({ icon: 'sparkle', tone: 'good', text: `Ви на ${fmt(m.pct - g, 1)}% вище мети — запас ${fmtMin(-m.short)} нормо-часу` });
  if (m.rest > 0 && m.needPct != null) {
    const days = workdaysLabel(m.rest);
    if (m.needPct <= 0) out.push({ icon: 'sparkle', tone: 'good', text: `Мету місяця вже забезпечено, навіть якщо решта днів буде слабкою` });
    else if (m.needPct > 150) out.push({ icon: 'target', tone: 'bad', text: `У решту ${days} треба понад 150% — мета цього місяця навряд досяжна` });
    else
      out.push({
        icon: 'calendar',
        tone: m.needPct > m.pct + 0.05 ? (m.needPct > 115 ? 'warn' : '') : 'good',
        text: `У решту ${days} треба в середньому ${fmt(m.needPct, 0)}%${m.needPct <= m.pct + 0.05 ? ' — тримайте свій рівень' : ''}`,
      });
  } else out.push({ icon: 'calendar', text: 'Робочих днів у місяці більше немає — так він і закриється' });
  // сьогоднішній день як частина плану місяця
  if (today && m.rest > 0 && m.needPct > 0 && m.needPct <= 200 && today.res.valid) {
    const { res } = today;
    const need = m.needPct;
    const single = res.active.length === 1 && res.otherMin === 0 ? res.active[0] : null;
    const easy = need <= m.pct + 0.05; // іде з запасом — сьогодні достатньо й менше звичайного
    if (single) {
      const target = (single.dayNorm * need) / 100;
      const left = target - single.qty;
      const what = `${fmt(target, 0)} шт${single.name ? ` «${single.name}»` : ''} (${fmt(need, 0)}%)`;
      out.push(
        left <= 0.05
          ? { icon: 'check', tone: 'good', text: `Сьогоднішній план для мети місяця (${fmt(target, 0)} шт) виконано` }
          : {
              icon: 'box',
              tone: 'accent',
              text: `${easy ? 'Для мети місяця сьогодні достатньо' : 'Сьогодні для мети місяця треба'} ${what} — ще ${fmt(Math.ceil(left - 0.05), 0)} шт`,
            },
      );
    } else {
      const left = (res.avail * need) / 100 - res.earned;
      out.push(
        left <= 0.5
          ? { icon: 'check', tone: 'good', text: `Сьогоднішній план для мети місяця (${fmt(need, 0)}%) виконано` }
          : { icon: 'clock', tone: 'accent', text: `Сьогодні для мети місяця треба ${fmt(need, 0)}% — ще ${fmtMin(left)} нормо-часу` },
      );
    }
  }
  return out;
}

export function Hints({ items }) {
  return (
    <div class="facts">
      {items.map((f) => (
        <div class={`fact ${f.tone || ''}`}>
          <span class="fact-ico">
            <Icon name={f.icon} size={16} />
          </span>
          <span>{f.text}</span>
        </div>
      ))}
    </div>
  );
}

/** Шкала середнього за місяць з позначкою мети. */
export function MonthBar({ pct, live, goal }) {
  const scale = Math.max(goal * 1.3, pct || 0, live || 0, 1);
  const lv = pct == null ? 'idle' : level(pct, goal);
  return (
    <div class="mbar">
      {live != null && <i class="mbar-live" style={{ width: `${Math.min(100, (live / scale) * 100)}%` }} />}
      {pct != null && <i class={`mbar-fill lv-${lv}`} style={{ width: `${Math.min(100, (pct / scale) * 100)}%` }} />}
      <em style={{ left: `${(goal / scale) * 100}%` }}>
        <span>{fmt(goal, 0)}%</span>
      </em>
    </div>
  );
}

/** Картка на головному екрані: лише для сьогоднішнього дня. */
export function MonthCard({ days, settings, date, res, onGoal }) {
  const month = date.slice(0, 7);
  const m = useMonth(days, settings, month, date);
  const live = m.open && res.valid && res.hasInput ? withDay(m, res) : null;
  const hints = monthHints(m, { res });
  const gen = MONTHS_GEN[mIdx(month)];
  const lv = m.pct == null ? 'idle' : level(m.pct, m.goal);
  return (
    <section class="card month-card">
      <div class="card-head">
        <h3>
          <span class="head-ico">
            <Icon name="calendar" size={17} />
          </span>
          {MONTHS_NOM[mIdx(month)]}
        </h3>
        <button class="goal-btn" onClick={onGoal} aria-label="Змінити мету на місяць">
          мета {fmt(m.goal, 0)}% <Icon name="pencil" size={13} />
        </button>
      </div>
      <div class="month-main">
        <b class={`month-pct lv-text ${lv}`}>{m.pct == null ? '—' : fmt(m.pct, 1)}%</b>
        {m.pct != null && <span class={`ctx-delta ${m.pct >= m.goal - 0.05 ? 'up' : 'down'}`}>{signed(m.pct - m.goal)} до мети</span>}
      </div>
      <p class="month-sub">
        Середнє з 1 {gen}: {m.n} {plural(m.n, ['день', 'дні', 'днів'])}
        {m.open ? ' (сьогоднішня зміна ще триває)' : ''}
      </p>
      <MonthBar pct={m.pct} live={live} goal={m.goal} />
      {live != null && (
        <p class="month-live">
          <i /> З сьогоднішнім днем зараз — <b>{fmt(live, 1)}%</b>
        </p>
      )}
      <Hints items={hints} />
    </section>
  );
}

/** Вікно «Мета на місяць». */
export function MonthGoalSheet({ month, days, settings, setSettings, todayISO, onClose }) {
  const cur = monthGoalOf(settings, month);
  const [val, setVal] = useState(String(cur).replace('.', ','));
  const [all, setAll] = useState(settings.monthGoal != null && settings.monthGoal === cur && settings.monthGoals[month] == null);
  const v = num(val);
  const ok = v >= 50 && v <= 200;
  const preview = useMemo(() => {
    if (!ok) return null;
    const open = month === todayISO.slice(0, 7) ? openDayOf(days, todayISO) : null;
    return monthStatus(days, month, todayISO, v, settings.workdays, open);
  }, [ok, v, days, month, todayISO, settings.workdays]);
  function save() {
    if (!ok) return;
    const g = Math.round(v * 10) / 10;
    setSettings((s) => {
      const monthGoals = { ...s.monthGoals };
      if (all) delete monthGoals[month];
      else monthGoals[month] = g;
      return { ...s, monthGoals, ...(all ? { monthGoal: g } : {}) };
    });
    onClose();
  }
  return (
    <Sheet
      title={`Мета на ${MONTHS_NOM[mIdx(month)].toLowerCase()}`}
      sub="Середній відсоток за календарний місяць, до якого прагнете"
      onClose={onClose}
      tall
      footer={
        <button class="btn primary block" disabled={!ok} onClick={save}>
          {ok ? `Зберегти · ${fmt(v, 1)}%` : 'Вкажіть від 50 до 200%'}
        </button>
      }
    >
      <div class="minutes">
        {GOALS.map((g) => (
          <button class={`mchip ${v === g ? 'on' : ''}`} onClick={() => setVal(String(g))}>
            {g}%
          </button>
        ))}
      </div>
      <label class="field">
        <span class="field-label">Або точно, %</span>
        <input class="input" inputMode="decimal" value={val} onFocus={(e) => e.currentTarget.select()} onInput={(e) => setVal(cleanNum(e.currentTarget.value))} />
      </label>
      <Toggle label="Така сама мета й на наступні місяці" hint="Інакше — лише на цей місяць" checked={all} onChange={setAll} />
      {preview && preview.n > 0 && (
        <div class="tip">
          <Icon name="bulb" size={18} />
          <span>
            Зараз у середньому <b>{fmt(preview.pct, 1)}%</b> за {preview.n} {plural(preview.n, ['день', 'дні', 'днів'])}.{' '}
            {preview.closed
              ? preview.reached
                ? 'Цю мету місяць досяг.'
                : `До цієї мети забракло ${fmt(v - preview.pct, 1)}%.`
              : preview.rest > 0 && preview.needPct != null
                ? preview.needPct <= 0
                  ? 'Цю мету вже забезпечено.'
                  : `Для неї у решту ${workdaysLabel(preview.rest)} треба в середньому ${fmt(preview.needPct, 0)}%.`
                : ''}
          </span>
        </div>
      )}
    </Sheet>
  );
}
