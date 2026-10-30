// Перевірка правил доступу Firestore на емуляторі.
// Запуск: npm run test:rules
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const OWNER = 'boss@example.com';
const ADMIN = 'admin@example.com';
const WORKER = 'worker@example.com';
const WORKER2 = 'worker2@example.com';
const BLOCKED = 'blocked@example.com';
const STRANGER = 'stranger@example.com';

const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8').replaceAll(
  "'OWNER_EMAIL'",
  `'${OWNER}'`,
);

let env;

function as(email, extra = {}) {
  return env
    .authenticatedContext(email.replace(/\W/g, ''), { email, email_verified: true, ...extra })
    .firestore();
}

function entry(email, date = '2026-10-30', patch = {}) {
  return {
    email,
    name: 'Тест',
    date,
    month: date.slice(0, 7),
    items: [{ productId: 'p1', name: 'Виріб', norm: 35, qty: 20 }],
    shift: 480,
    brk: 60,
    base: 420,
    downtime: 30,
    reason: '',
    comment: '',
    percent: 61.5,
    updatedAt: serverTimestamp(),
    updatedBy: email,
    ...patch,
  };
}

const product = {
  name: 'Виріб А',
  norm: 35,
  code: 'A-1',
  group: '',
  archived: false,
  updatedAt: serverTimestamp(),
};

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-norma',
    firestore: { rules, host: '127.0.0.1', port: 8080 },
  });
});

after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'access', ADMIN), { name: 'Адмін', role: 'admin', active: true });
    await setDoc(doc(db, 'access', WORKER), { name: 'Працівник', role: 'worker', active: true });
    await setDoc(doc(db, 'access', WORKER2), { name: 'Працівник 2', role: 'worker', active: true });
    await setDoc(doc(db, 'access', BLOCKED), { name: 'Заблокований', role: 'admin', active: false });
    await setDoc(doc(db, 'products', 'p1'), product);
    await setDoc(doc(db, 'settings', 'main'), { shift: 480, brk: 60 });
    await setDoc(doc(db, 'entries', `2026-10-30_${WORKER}`), entry(WORKER));
    await setDoc(doc(db, 'entries', `2026-10-30_${WORKER2}`), entry(WORKER2));
  });
});

describe('сторонні люди', () => {
  test('без входу нічого не видно', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'products', 'p1')));
    await assertFails(getDoc(doc(db, 'settings', 'main')));
    await assertFails(getDocs(collection(db, 'entries')));
    await assertFails(getDoc(doc(db, 'access', WORKER)));
  });

  test('вхід без запрошення: ні виробів, ні записів', async () => {
    const db = as(STRANGER);
    await assertFails(getDoc(doc(db, 'products', 'p1')));
    await assertFails(getDocs(collection(db, 'products')));
    await assertFails(getDoc(doc(db, 'settings', 'main')));
    await assertFails(getDoc(doc(db, 'entries', `2026-10-30_${WORKER}`)));
    await assertFails(setDoc(doc(db, 'entries', `2026-10-30_${STRANGER}`), entry(STRANGER)));
    // може лише дізнатися, що його запису доступу немає
    await assertSucceeds(getDoc(doc(db, 'access', STRANGER)));
    await assertFails(getDoc(doc(db, 'access', WORKER)));
  });

  test('сторонній не може сам себе додати до списку', async () => {
    const db = as(STRANGER);
    await assertFails(setDoc(doc(db, 'access', STRANGER), { name: 'Я', role: 'admin', active: true }));
    await assertFails(setDoc(doc(db, 'access', STRANGER), { name: 'Я', role: 'worker', active: true }));
  });

  test('непідтверджений email не пускає навіть власника', async () => {
    const db = as(OWNER, { email_verified: false });
    await assertFails(getDoc(doc(db, 'products', 'p1')));
  });

  test('заблокований (active: false) втрачає доступ', async () => {
    const db = as(BLOCKED);
    await assertFails(getDoc(doc(db, 'products', 'p1')));
    await assertFails(getDocs(collection(db, 'access')));
    await assertSucceeds(getDoc(doc(db, 'access', BLOCKED)));
  });
});

describe('власник', () => {
  test('може створити собі запис адміністратора (перший вхід)', async () => {
    const db = as(OWNER);
    await assertSucceeds(
      setDoc(doc(db, 'access', OWNER), {
        name: 'Власник',
        role: 'admin',
        active: true,
        owner: true,
        updatedAt: serverTimestamp(),
        updatedBy: OWNER,
      }),
    );
  });

  test('має повний доступ навіть без запису в списку', async () => {
    const db = as(OWNER);
    await assertSucceeds(getDocs(collection(db, 'entries')));
    await assertSucceeds(getDocs(collection(db, 'access')));
    await assertSucceeds(setDoc(doc(db, 'products', 'p2'), product));
  });

  test('email власника порівнюється без урахування регістру', async () => {
    const db = as('Boss@Example.com');
    await assertSucceeds(getDocs(collection(db, 'access')));
  });
});

describe('працівник', () => {
  test('бачить вироби й налаштування, але не змінює їх', async () => {
    const db = as(WORKER);
    await assertSucceeds(getDocs(collection(db, 'products')));
    await assertSucceeds(getDoc(doc(db, 'settings', 'main')));
    await assertFails(setDoc(doc(db, 'products', 'p2'), product));
    await assertFails(updateDoc(doc(db, 'products', 'p1'), { norm: 1 }));
    await assertFails(deleteDoc(doc(db, 'products', 'p1')));
    await assertFails(setDoc(doc(db, 'settings', 'main'), { shift: 480, brk: 0 }));
  });

  test('не бачить список доступу і не може себе підвищити', async () => {
    const db = as(WORKER);
    await assertFails(getDocs(collection(db, 'access')));
    await assertFails(getDoc(doc(db, 'access', WORKER2)));
    await assertSucceeds(getDoc(doc(db, 'access', WORKER)));
    await assertFails(updateDoc(doc(db, 'access', WORKER), { role: 'admin' }));
  });

  test('читає та змінює лише власні записи', async () => {
    const db = as(WORKER);
    await assertSucceeds(getDoc(doc(db, 'entries', `2026-10-30_${WORKER}`)));
    await assertFails(getDoc(doc(db, 'entries', `2026-10-30_${WORKER2}`)));
    await assertSucceeds(setDoc(doc(db, 'entries', `2026-10-29_${WORKER}`), entry(WORKER, '2026-10-29')));
    await assertSucceeds(
      setDoc(doc(db, 'entries', `2026-10-30_${WORKER}`), entry(WORKER, '2026-10-30', { downtime: 0 })),
    );
    await assertFails(setDoc(doc(db, 'entries', `2026-10-29_${WORKER2}`), entry(WORKER2, '2026-10-29')));
    await assertFails(
      setDoc(doc(db, 'entries', `2026-10-30_${WORKER2}`), entry(WORKER2, '2026-10-30', { updatedBy: WORKER })),
    );
    await assertFails(deleteDoc(doc(db, 'entries', `2026-10-30_${WORKER2}`)));
    await assertSucceeds(deleteDoc(doc(db, 'entries', `2026-10-30_${WORKER}`)));
  });

  test('може відкрити ще не створений запис на свою дату', async () => {
    const db = as(WORKER);
    await assertSucceeds(getDoc(doc(db, 'entries', `2026-01-05_${WORKER}`)));
  });

  test('запити журналу: лише з фільтром за своїм email', async () => {
    const db = as(WORKER);
    await assertSucceeds(
      getDocs(query(collection(db, 'entries'), where('email', '==', WORKER), where('month', '==', '2026-10'))),
    );
    await assertFails(getDocs(collection(db, 'entries')));
    await assertFails(getDocs(query(collection(db, 'entries'), where('month', '==', '2026-10'))));
    await assertFails(getDocs(query(collection(db, 'entries'), where('email', '==', WORKER2))));
  });

  test('некоректні записи відхиляються', async () => {
    const db = as(WORKER);
    const ref = doc(db, 'entries', `2026-10-28_${WORKER}`);
    // ідентифікатор не відповідає даті
    await assertFails(setDoc(ref, entry(WORKER, '2026-10-27')));
    // місяць не відповідає даті
    await assertFails(setDoc(ref, entry(WORKER, '2026-10-28', { month: '2026-09' })));
    // простій з’їв увесь робочий час
    await assertFails(setDoc(ref, entry(WORKER, '2026-10-28', { downtime: 420 })));
    await assertFails(setDoc(ref, entry(WORKER, '2026-10-28', { downtime: -5 })));
    // зайве поле
    await assertFails(setDoc(ref, entry(WORKER, '2026-10-28', { approved: true })));
    // email у верхньому регістрі
    await assertFails(
      setDoc(doc(db, 'entries', '2026-10-28_Worker@example.com'), entry('Worker@example.com', '2026-10-28')),
    );
    await assertSucceeds(setDoc(ref, entry(WORKER, '2026-10-28')));
  });
});

describe('адміністратор', () => {
  test('керує виробами та налаштуваннями', async () => {
    const db = as(ADMIN);
    await assertSucceeds(setDoc(doc(db, 'products', 'p2'), product));
    await assertSucceeds(updateDoc(doc(db, 'products', 'p1'), { norm: 40, updatedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(db, 'products', 'p3'), { ...product, norm: 0 }));
    await assertFails(setDoc(doc(db, 'products', 'p3'), { ...product, name: '' }));
    await assertFails(setDoc(doc(db, 'products', 'p3'), { ...product, secret: 1 }));
    await assertSucceeds(deleteDoc(doc(db, 'products', 'p2')));
    await assertSucceeds(setDoc(doc(db, 'settings', 'main'), { shift: 720, brk: 60 }));
    await assertFails(setDoc(doc(db, 'settings', 'main'), { shift: 60, brk: 60 }));
    await assertFails(setDoc(doc(db, 'settings', 'other'), { shift: 480, brk: 60 }));
  });

  test('видає і забирає доступ', async () => {
    const db = as(ADMIN);
    await assertSucceeds(getDocs(collection(db, 'access')));
    await assertSucceeds(
      setDoc(doc(db, 'access', 'new@example.com'), { name: 'Новенький', role: 'worker', active: true }),
    );
    await assertFails(
      setDoc(doc(db, 'access', 'New@Example.com'), { name: 'Новенький', role: 'worker', active: true }),
    );
    await assertFails(setDoc(doc(db, 'access', 'not-an-email'), { name: 'X', role: 'worker', active: true }));
    await assertFails(
      setDoc(doc(db, 'access', 'x@example.com'), { name: 'X', role: 'superuser', active: true }),
    );
    // лише власник може позначати власника
    await assertFails(
      setDoc(doc(db, 'access', 'x@example.com'), { name: 'X', role: 'admin', active: true, owner: true }),
    );
    await assertSucceeds(updateDoc(doc(db, 'access', WORKER), { active: false }));
    await assertSucceeds(deleteDoc(doc(db, 'access', WORKER2)));
  });

  test('бачить записи всіх і може внести запис за працівника', async () => {
    const db = as(ADMIN);
    await assertSucceeds(getDocs(query(collection(db, 'entries'), where('month', '==', '2026-10'))));
    await assertSucceeds(getDoc(doc(db, 'entries', `2026-10-30_${WORKER2}`)));
    await assertSucceeds(
      setDoc(
        doc(db, 'entries', `2026-10-29_${WORKER}`),
        entry(WORKER, '2026-10-29', { updatedBy: ADMIN }),
      ),
    );
    await assertSucceeds(deleteDoc(doc(db, 'entries', `2026-10-30_${WORKER2}`)));
  });

  test('після блокування адмін одразу втрачає доступ', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'access', ADMIN), { active: false });
    });
    const db = as(ADMIN);
    await assertFails(getDocs(collection(db, 'access')));
    await assertFails(getDoc(doc(db, 'products', 'p1')));
  });
});
