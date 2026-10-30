// Надійне збереження в акаунті Claude (можливість сторінки `db`).
// Дані лежать у приватному розділі людини data/users/<id>/ — його не бачить ніхто інший,
// навіть власник сторінки. Документи:
//   settings      — налаштування, мої вироби, списки;
//   m-РРРР-ММ     — дні місяця { days: {дата: запис}, deleted: {дата: час видалення} }.
// Поза claude.ai (GitHub Pages, файл) можливості немає — тоді працює лише пам'ять браузера.

const DEBOUNCE = 450;
const RETRY_MS = 15000;
// помилки, після яких повтор не допоможе
export const FATAL = new Set(['invalid_argument', 'quota_exceeded', 'revoked', 'not_granted', 'capability_disabled', 'capability_removed', 'transform_error']);
const clone = (x) => JSON.parse(JSON.stringify(x));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const monthId = (dateOrMonth) => `m-${dateOrMonth.slice(0, 7)}`;

/** Тіло документа місяця з поточних днів і позначок видалення. */
export function monthBody(days, month, deleted = {}) {
  const body = { kind: 'month', month, days: {}, deleted: {} };
  for (const [d, r] of Object.entries(days)) if (d.slice(0, 7) === month) body.days[d] = r;
  for (const [d, t] of Object.entries(deleted)) if (d.slice(0, 7) === month && !body.days[d]) body.deleted[d] = t;
  return body;
}

/** Розбір знімка колекції: налаштування, дні, позначки видалення. */
export function fromSnapshot(snap) {
  let settings = null;
  const days = {};
  const deleted = {};
  const months = new Set();
  for (const doc of snap.docs) {
    const b = doc.data();
    if (!b) continue;
    if (doc.id === 'settings') settings = clone(b);
    else if (b.kind === 'month' && typeof b.month === 'string') {
      months.add(b.month);
      for (const [d, r] of Object.entries(b.days || {})) if (r && Array.isArray(r.products)) days[d] = clone({ ...r, date: d });
      Object.assign(deleted, b.deleted || {});
    }
  }
  return { settings, days, deleted, months, empty: snap.empty };
}

/**
 * Зведення першого знімка з тим, що вже є в пам'яті браузера:
 * дні, яких немає в акаунті (або новіші), додаються; видалені й стерті — ні.
 */
export function mergeDays(remote, local, wipedAt = 0) {
  const days = { ...remote.days };
  const touched = new Set();
  for (const [d, r] of Object.entries(local)) {
    const t = r.savedAt || 0;
    if (t && t <= wipedAt) continue;
    if (remote.deleted[d] && remote.deleted[d] >= t) continue;
    const rr = remote.days[d];
    if (!rr || t > (rr.savedAt || 0)) {
      days[d] = r;
      touched.add(d.slice(0, 7));
    }
  }
  return { days, touched };
}

/**
 * { mode: 'cloud', cloud } — можна зберігати в акаунті;
 * { mode: 'denied' } — сторінка відкрита без права запису (напр., «лише перегляд»);
 * { mode: 'local' } — поза claude.ai або без входу.
 */
export async function connect() {
  const use = window.claude?.use;
  if (typeof use !== 'function') return { mode: 'local' };
  try {
    const [db, user] = await Promise.all([use('db'), use('user')]);
    if (!db || !user) return { mode: 'local' };
    const [uid, canWrite] = await Promise.all([user.id(), user.can('data.write').catch(() => null)]);
    if (!uid) return { mode: 'local' };
    if (canWrite === false) return { mode: 'denied' };
    return { mode: 'cloud', cloud: createCloud(db.collection(`data/users/${uid}`)) };
  } catch {
    return { mode: 'local' };
  }
}

function createCloud(col) {
  const pending = new Map(); // id → { body, timer }
  const inflight = new Map(); // id → лічильник активних записів
  const chains = new Map(); // id → проміс останньої операції (одна за раз на документ)
  let status = () => {};
  let fail = () => {};

  const busy = () => pending.size > 0 || inflight.size > 0;

  function flush(id) {
    const p = pending.get(id);
    if (!p) return chains.get(id) || Promise.resolve();
    clearTimeout(p.timer);
    pending.delete(id);
    inflight.set(id, (inflight.get(id) || 0) + 1);
    status('saving');
    const op = () => (p.body === null ? col.doc(id).delete() : col.doc(id).set(p.body));
    const run = (chains.get(id) || Promise.resolve())
      .catch(() => {})
      .then(op)
      .catch(async (e) => {
        if (e?.code !== 'unavailable' && e?.code !== 'resource_exhausted') throw e;
        await sleep(700 + Math.random() * 900);
        return op();
      })
      .then(
        () => {
          const n = inflight.get(id) - 1;
          n ? inflight.set(id, n) : inflight.delete(id);
          if (!busy()) status('saved');
        },
        (e) => {
          const n = inflight.get(id) - 1;
          n ? inflight.set(id, n) : inflight.delete(id);
          status('error');
          fail(e);
          // мережа чи перевантаження — дописати пізніше, якщо новішого запису ще не було
          if (!FATAL.has(e?.code))
            setTimeout(() => {
              if (!pending.has(id) && !inflight.has(id)) {
                pending.set(id, { body: p.body, timer: 0 });
                flush(id);
              }
            }, RETRY_MS);
        },
      );
    chains.set(id, run);
    return run;
  }

  return {
    /** Записати документ (body = null — видалити). Кілька змін поспіль зливаються в один запис. */
    write(id, body) {
      const prev = pending.get(id);
      if (prev) clearTimeout(prev.timer);
      pending.set(id, { body: body === null ? null : clone(body), timer: setTimeout(() => flush(id), DEBOUNCE) });
      status('saving');
    },
    flushAll() {
      return Promise.all([...pending.keys()].map(flush).concat([...chains.values()]));
    },
    isPending: (id) => pending.has(id) || inflight.has(id),
    subscribe: (next, error) => col.onSnapshot(next, error),
    onStatus(fn) {
      status = fn;
    },
    onError(fn) {
      fail = fn;
    },
  };
}
