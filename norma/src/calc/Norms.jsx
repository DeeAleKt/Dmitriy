// Приблизні норми: уточнити норму виробу, коли зʼявилась офіційна, і перерахувати дні з приблизною.
import { useMemo, useState } from 'preact/hooks';
import { fmt, plural, today } from '../util.js';
import { useApp } from './ctx.js';
import { applyNorm, approxProducts, fmtShortDate, num, recordsIn, summarize } from './model.js';
import { MONTHS_NOM } from './Month.jsx';
import { cleanNum, Icon, Sheet, toast, Toggle } from './ui.jsx';

const daysWord = (n) => `${n} ${plural(n, ['день', 'дні', 'днів'])}`;
const dropApprox = ({ approx: _, ...p }) => p;

/**
 * name — назва виробу (за нею знаходяться дні з приблизною нормою);
 * lineKey — рядок у поточному розрахунку, з якого відкрили (може бути без назви).
 */
export function NormFixSheet({ name, lineKey, onClose }) {
  const { settings, setSettings, days, setDays, draft, setDraft } = useApp();
  const line = lineKey ? draft.products.find((p) => p.key === lineKey) : null;
  const info = useMemo(() => (name ? approxProducts(days, settings).find((x) => x.name === name) : null), [name, days, settings]);
  const current = line ? num(line.norm) : info?.norm;
  const [val, setVal] = useState(current ? String(current).replace('.', ',') : '');
  const [exact, setExact] = useState(true);
  const [recalc, setRecalc] = useState(true);
  const norm = num(val);
  const ok = norm > 0;
  // дні з приблизною нормою цього виробу (крім поточного — він оновиться разом із розрахунком)
  const past = useMemo(() => (name ? applyNorm(days, name, 1).changed.filter((d) => d !== draft.date) : []), [days, name, draft.date]);
  const month = today().slice(0, 7);
  const preview = useMemo(() => {
    if (!ok || !recalc || !past.some((d) => d.startsWith(month))) return null;
    const from = `${month}-01`;
    const before = summarize(recordsIn(days, from, today()));
    const after = summarize(recordsIn(applyNorm(days, name, norm, exact).next, from, today()));
    return before.n ? { before: before.pct, after: after.pct } : null;
  }, [ok, recalc, past, days, name, norm, exact, month]);

  function save() {
    if (!ok) return;
    const str = String(norm).replace('.', ',');
    const fix = (p) => (exact ? { ...dropApprox(p), norm: str } : { ...p, norm: str, approx: true });
    setDraft((d) => ({ ...d, products: d.products.map((p) => (p.key === lineKey || (name && p.approx && p.name === name) ? fix(p) : p)) }));
    if (name) {
      setSettings((s) => ({ ...s, products: s.products.map((p) => (p.name === name ? (exact ? { ...dropApprox(p), norm } : { ...p, norm, approx: true }) : p)) }));
      if (recalc && past.length) setDays(applyNorm(days, name, norm, exact).next);
    }
    toast(recalc && past.length ? `Норму уточнено · перераховано ${daysWord(past.length)}` : exact ? 'Норму уточнено' : 'Норму змінено', 'ok', 'check');
    onClose();
  }

  return (
    <Sheet
      title="Уточнити норму"
      sub={name ? `«${name}»` : 'Виріб без назви'}
      onClose={onClose}
      tall
      footer={
        <button class="btn primary block" disabled={!ok} onClick={save}>
          {!ok ? 'Вкажіть норму' : recalc && past.length ? `Зберегти й перерахувати ${daysWord(past.length)}` : 'Зберегти'}
        </button>
      }
    >
      {current > 0 && (
        <div class="approx-now">
          <span>Зараз</span>
          <b>≈ {fmt(current)} шт за зміну</b>
          <em>приблизна</em>
        </div>
      )}
      <label class="field">
        <span class="field-label">{exact ? 'Точна норма за зміну, шт' : 'Норма за зміну, шт'}</span>
        <input class="input big" data-autofocus inputMode="decimal" placeholder="Напр.: 35" value={val} onFocus={(e) => e.currentTarget.select()} onInput={(e) => setVal(cleanNum(e.currentTarget.value))} />
      </label>
      <Toggle label="Це вже точна (офіційна) норма" hint={exact ? 'Позначка «приблизна» зникне' : 'Норма лишиться приблизною — можна уточнити пізніше'} checked={exact} onChange={setExact} />
      {past.length > 0 ? (
        <>
          <Toggle
            label={`Перерахувати ${daysWord(past.length)} з приблизною нормою`}
            hint={past.length === 1 ? fmtShortDate(past[0]) : `з ${fmtShortDate(past[0])} по ${fmtShortDate(past[past.length - 1])}`}
            checked={recalc}
            onChange={setRecalc}
          />
          {preview && (
            <div class="tip">
              <Icon name="chart" size={18} />
              <span>
                Середнє за {MONTHS_NOM[Number(month.slice(5)) - 1].toLowerCase()} зміниться: <b>{fmt(preview.before, 1)}%</b> → <b>{fmt(preview.after, 1)}%</b>
              </span>
            </div>
          )}
        </>
      ) : (
        !name && (
          <div class="tip">
            <Icon name="info" size={18} />
            <span>Дайте виробу назву (дотик на «Виріб» угорі рядка) — тоді, коли норма зʼявиться, можна буде перерахувати всі дні з ним.</span>
          </div>
        )
      )}
    </Sheet>
  );
}

/** Банер у статистиці: дні з приблизною нормою і швидке уточнення. */
export function ApproxBanner({ n, onFix }) {
  const { days, settings } = useApp();
  const list = useMemo(() => approxProducts(days, settings).filter((x) => x.days > 0), [days, settings]);
  if (!n || !list.length) return null;
  return (
    <div class="approx-banner">
      <div class="approx-banner-top">
        <span class="approx-sign">≈</span>
        <span>
          {daysWord(n)} пораховано з приблизною нормою — відсотки орієнтовні. Коли норма зʼявиться, уточніть її:
        </span>
      </div>
      <div class="approx-chips">
        {list.map((x) => (
          <button class="approx-chip" onClick={() => onFix(x.name)}>
            {x.name} <em>≈{fmt(x.norm)}</em>
            <Icon name="pencil" size={13} />
          </button>
        ))}
      </div>
    </div>
  );
}
