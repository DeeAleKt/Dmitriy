// Перевірка правил доступу Firestore на емуляторі.
// Запуск: npm run test:rules
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

// головний адміністратор — з налаштувань публікації; заступник — у колекції admins
const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8').replaceAll('__OWNER_EMAIL__', 'boss@example.com');
let env;

// uid → токен: працівники входять поштою (пошта не підтверджена), адміністратор — через Google
const BOSS = { uid: 'boss', email: 'boss@example.com', email_verified: true };
const OLENA = { uid: 'olena', email: 'olena@example.com', email_verified: false };
const IVAN = { uid: 'ivan', email: 'ivan@example.com', email_verified: false };
const DEPUTY = { uid: 'deputy', email: 'deputy@example.com', email_verified: true };
const FAKE_BOSS = { uid: 'fake', email: 'boss@example.com', email_verified: false }; // чужа реєстрація на пошту адміна

const as = (u) => env.authenticatedContext(u.uid, { email: u.email, email_verified: u.email_verified }).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const month = (m, days = {}) => ({ kind: 'month', month: m, days, deleted: {} });
const day = (date, qty) => ({ date, start: '06:30', end: '14:30', brk: 60, base: 420, products: [{ name: 'Кришка', norm: 35, qty }], downtime: [], others: [] });

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-norma', firestore: { rules, host: '127.0.0.1', port: 8080 } });
});
after(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    await setDoc(doc(db, 'admins', 'deputy@example.com'), { addedBy: 'boss@example.com' });
    for (const u of [BOSS, OLENA, IVAN]) await setDoc(doc(db, 'users', u.uid), { name: u.uid, email: u.email });
    await setDoc(doc(db, 'users/olena/calc/m-2026-10'), month('2026-10', { '2026-10-30': day('2026-10-30', 30) }));
    await setDoc(doc(db, 'users/ivan/calc/settings'), { kind: 'settings', goal: 100 });
  });
});

describe('працівник', () => {
  test('створює свій профіль, але не може сам себе розблокувати чи заблокувати', async () => {
    await env.withSecurityRulesDisabled((c) => deleteDoc(doc(c.firestore(), 'users', 'olena')));
    const db = as(OLENA);
    await assertFails(setDoc(doc(db, 'users', 'olena'), { name: 'Олена', email: OLENA.email, blocked: false })); // поле лише для адміна
    await assertFails(setDoc(doc(db, 'users', 'ivan2'), { name: 'Чужий', email: OLENA.email })); // чужий профіль
    await assertSucceeds(setDoc(doc(db, 'users', 'olena'), { name: 'Олена', email: OLENA.email, createdAt: serverTimestamp(), lastSeen: serverTimestamp(), seenDay: '2026-10-30' }));
    await assertSucceeds(updateDoc(doc(db, 'users', 'olena'), { name: 'Олена Коваль', seenDay: '2026-10-31' }));
    await assertFails(updateDoc(doc(db, 'users', 'olena'), { blocked: true }));
    await assertFails(updateDoc(doc(db, 'users', 'olena'), { role: 'admin' }));
  });

  test('читає й пише лише свої дні', async () => {
    const db = as(OLENA);
    await assertSucceeds(getDoc(doc(db, 'users/olena/calc/m-2026-10')));
    await assertSucceeds(setDoc(doc(db, 'users/olena/calc/m-2026-11'), month('2026-11')));
    await assertSucceeds(setDoc(doc(db, 'users/olena/calc/settings'), { kind: 'settings', goal: 105 }));
    await assertSucceeds(deleteDoc(doc(db, 'users/olena/calc/m-2026-11')));
    await assertFails(getDoc(doc(db, 'users/ivan/calc/settings')));
    await assertFails(setDoc(doc(db, 'users/ivan/calc/m-2026-10'), month('2026-10')));
    await assertFails(getDoc(doc(db, 'users', 'ivan')));
    await assertFails(getDocs(collection(db, 'users')));
  });

  test('документи даних мають правильну форму', async () => {
    const db = as(OLENA);
    await assertFails(setDoc(doc(db, 'users/olena/calc/m-2026-10'), month('2026-11'))); // місяць не збігається з назвою
    await assertFails(setDoc(doc(db, 'users/olena/calc/junk'), { kind: 'settings' }));
    await assertFails(setDoc(doc(db, 'users/olena/calc/m-2026-12'), { kind: 'month', month: '2026-12', days: 'ні' }));
  });

  test('не бачить адміністраторів і не може себе додати', async () => {
    const db = as(OLENA);
    await assertSucceeds(getDoc(doc(db, 'admins', OLENA.email))); // перевірка «чи я адмін» — дозволена
    await assertFails(getDocs(collection(db, 'admins')));
    await assertFails(setDoc(doc(db, 'admins', OLENA.email), { addedBy: 'я' }));
  });

  test('реєстрація на пошту адміністратора без підтвердження не дає прав', async () => {
    const db = as(FAKE_BOSS);
    await assertFails(getDocs(collection(db, 'users')));
    await assertFails(getDoc(doc(db, 'users/olena/calc/m-2026-10')));
  });

  test('без входу — нічого', async () => {
    const db = anon();
    await assertFails(getDoc(doc(db, 'users', 'olena')));
    await assertFails(getDoc(doc(db, 'users/olena/calc/m-2026-10')));
    await assertFails(setDoc(doc(db, 'users', 'x'), { name: 'x' }));
  });
});

describe('адміністратор', () => {
  test('бачить усіх працівників і їхні дні, але не змінює їх', async () => {
    const db = as(BOSS);
    const list = await assertSucceeds(getDocs(collection(db, 'users')));
    if (list.size !== 3) throw new Error(`очікував 3 профілі, маю ${list.size}`);
    await assertSucceeds(getDoc(doc(db, 'users/olena/calc/m-2026-10')));
    await assertSucceeds(getDocs(collection(db, 'users/ivan/calc')));
    await assertFails(setDoc(doc(db, 'users/olena/calc/m-2026-10'), month('2026-10')));
    await assertFails(updateDoc(doc(db, 'users', 'olena'), { name: 'Інше імʼя' }));
  });

  test('закриває й відкриває доступ; заблокований не може писати', async () => {
    await assertSucceeds(updateDoc(doc(as(BOSS), 'users', 'olena'), { blocked: true, blockedAt: serverTimestamp(), blockedBy: BOSS.email }));
    const db = as(OLENA);
    await assertSucceeds(getDoc(doc(db, 'users/olena/calc/m-2026-10'))); // свої дані бачить
    await assertFails(setDoc(doc(db, 'users/olena/calc/m-2026-10'), month('2026-10')));
    await assertFails(updateDoc(doc(db, 'users', 'olena'), { blocked: false }));
    await assertSucceeds(updateDoc(doc(as(BOSS), 'users', 'olena'), { blocked: false }));
    await assertSucceeds(setDoc(doc(db, 'users/olena/calc/m-2026-10'), month('2026-10')));
  });

  test('не може заблокувати себе', async () => {
    await assertFails(updateDoc(doc(as(BOSS), 'users', 'boss'), { blocked: true }));
  });

  test('додає й прибирає адміністраторів, але не себе', async () => {
    const db = as(BOSS);
    await assertSucceeds(setDoc(doc(db, 'admins', 'helper@example.com'), { addedBy: BOSS.email, addedAt: serverTimestamp() }));
    await assertSucceeds(getDocs(collection(db, 'admins')));
    await assertFails(setDoc(doc(db, 'admins', 'Helper2@Example.com'), { addedBy: BOSS.email }));
    await assertSucceeds(deleteDoc(doc(db, 'admins', 'helper@example.com')));
    // заступник з колекції admins має ті самі права, але себе прибрати не може
    const d = as(DEPUTY);
    await assertSucceeds(getDocs(collection(d, 'users')));
    await assertSucceeds(getDoc(doc(d, 'users/olena/calc/m-2026-10')));
    await assertFails(deleteDoc(doc(d, 'admins', 'deputy@example.com')));
    await assertSucceeds(deleteDoc(doc(db, 'admins', 'deputy@example.com')));
    await assertFails(getDocs(collection(d, 'users')));
  });
});
