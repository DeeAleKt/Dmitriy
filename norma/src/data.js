import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { computeDay } from './calc.js';
import { db } from './firebase.js';
import { collator, monthOf } from './util.js';

export const entryId = (date, email) => `${date}_${email}`;

// ---------- Доступ ----------

export function watchAccess(email, cb, onError) {
  return onSnapshot(
    doc(db, 'access', email),
    (s) => cb(s.exists() ? { email, ...s.data() } : null),
    onError,
  );
}

/** Перший вхід власника: правила дозволять створити запис адміністратора лише йому. */
export async function bootstrapOwner(user, email) {
  await setDoc(doc(db, 'access', email), {
    name: (user.displayName || email).slice(0, 120),
    role: 'admin',
    active: true,
    owner: true,
    updatedAt: serverTimestamp(),
    updatedBy: email,
  });
}

export function watchPeople(cb, onError) {
  return onSnapshot(
    collection(db, 'access'),
    (s) => {
      const list = s.docs.map((d) => ({ email: d.id, ...d.data() }));
      list.sort((a, b) => collator.compare(a.name || a.email, b.name || b.email));
      cb(list);
    },
    onError,
  );
}

export function savePerson(email, { name, role, active, owner }, me) {
  const data = { name: name.trim(), role, active, updatedAt: serverTimestamp(), updatedBy: me };
  if (owner) data.owner = true;
  return setDoc(doc(db, 'access', email), data);
}

export const deletePerson = (email) => deleteDoc(doc(db, 'access', email));

// ---------- Вироби ----------

export function watchProducts(cb, onError) {
  return onSnapshot(
    collection(db, 'products'),
    (s) => {
      const list = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort(
        (a, b) => collator.compare(a.group || '', b.group || '') || collator.compare(a.name, b.name),
      );
      cb(list);
    },
    onError,
  );
}

const cleanProduct = (p) => ({
  name: String(p.name).trim(),
  norm: Number(p.norm),
  code: String(p.code || '').trim(),
  group: String(p.group || '').trim(),
  archived: Boolean(p.archived),
  updatedAt: serverTimestamp(),
});

export function saveProduct(id, p) {
  const ref = id ? doc(db, 'products', id) : doc(collection(db, 'products'));
  return setDoc(ref, cleanProduct(p));
}

export const deleteProduct = (id) => deleteDoc(doc(db, 'products', id));

/** Масовий імпорт: rows = [{id?, name, norm, code, group, archived}] */
export async function importProducts(rows) {
  for (let i = 0; i < rows.length; i += 400) {
    const batch = writeBatch(db);
    for (const r of rows.slice(i, i + 400)) {
      const ref = r.id ? doc(db, 'products', r.id) : doc(collection(db, 'products'));
      batch.set(ref, cleanProduct(r));
    }
    await batch.commit();
  }
}

// ---------- Налаштування ----------

export function watchSettings(cb, onError) {
  return onSnapshot(doc(db, 'settings', 'main'), (s) => cb(s.exists() ? s.data() : null), onError);
}

export const saveSettings = ({ normShift, normBrk, shifts }, me) =>
  setDoc(doc(db, 'settings', 'main'), {
    normShift,
    normBrk,
    shifts: shifts.map(({ id, name, start, end, brk }) => ({ id, name: name.trim(), start, end, brk })),
    updatedAt: serverTimestamp(),
    updatedBy: me,
  });

// ---------- Журнал ----------

export async function getEntry(date, email) {
  const s = await getDoc(doc(db, 'entries', entryId(date, email)));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

export function saveEntry(e, me) {
  const items = e.items.map((it) => ({
    productId: it.productId,
    name: it.name,
    code: it.code || '',
    norm: Number(it.norm),
    qty: Number(it.qty),
  }));
  const data = {
    email: e.email,
    name: (e.name || '').slice(0, 120),
    date: e.date,
    month: monthOf(e.date),
    items,
    shiftName: (e.shiftName || '').slice(0, 60),
    start: e.start,
    end: e.end,
    shift: e.shift,
    brk: e.brk,
    base: e.base,
    downtime: e.downtime,
    reason: (e.reason || '').trim(),
    comment: (e.comment || '').trim(),
    percent: Math.round(computeDay({ ...e, items }).percent * 10) / 10,
    updatedAt: serverTimestamp(),
    updatedBy: me,
  };
  return setDoc(doc(db, 'entries', entryId(e.date, e.email)), data);
}

export const deleteEntry = (date, email) => deleteDoc(doc(db, 'entries', entryId(date, email)));

/** Записи за кілька місяців; email = null — усі працівники (лише для адміністратора). */
export function watchEntries({ months, email }, cb, onError) {
  const parts = new Map();
  const unsubs = months.map((m) => {
    const filters = [where('month', '==', m)];
    if (email) filters.unshift(where('email', '==', email));
    return onSnapshot(
      query(collection(db, 'entries'), ...filters),
      (s) => {
        parts.set(m, s.docs.map((d) => ({ id: d.id, ...d.data() })));
        if (parts.size === months.length) cb([...parts.values()].flat());
      },
      onError,
    );
  });
  return () => unsubs.forEach((u) => u());
}
