// Сервер «Норми» — Firebase: вхід (Google або пошта з паролем), база Firestore і хостинг.
//
// Що де лежить у базі:
//   users/{uid}                — профіль: імʼя, пошта, коли заходив; blocked ставить лише адміністратор;
//   users/{uid}/calc/settings  — налаштування калькулятора, мої вироби;
//   users/{uid}/calc/m-РРРР-ММ — дні місяця (той самий формат, що й у cloud.js);
//   admins/{пошта}             — додаткові адміністратори (головного задає публікація, див. firestore.rules).
// Хто що може — у firestore.rules. Налаштування проєкту — у docs/config.js (не секрет).
import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  limit,
  memoryLocalCache,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { store } from '../util.js';
import { fromSnapshot } from './cloud.js';

// Режим емулятора — лише для розробки й автотестів: http://localhost:…/?emu
const local = ['localhost', '127.0.0.1'].includes(location.hostname);
export const emulator = local && new URLSearchParams(location.search).has('emu');

const cfg = emulator
  ? { apiKey: 'demo-key', authDomain: 'demo-norma.firebaseapp.com', projectId: 'demo-norma', appId: 'demo' }
  : { ...window.NORMA_CONFIG?.firebase };

export const configured = Boolean(cfg?.apiKey && cfg?.projectId && !/[А-ЯІЇЄҐа-яіїєґ]/.test(cfg.apiKey));

// На хостингу Firebase вхід через Google іде через той самий домен — так він працює й на iPhone.
if (configured && !emulator && /\.(web\.app|firebaseapp\.com)$/.test(location.hostname)) cfg.authDomain = location.host;

export let auth = null;
export let db = null;

if (configured) {
  const app = initializeApp(cfg);
  auth = getAuth(app);
  auth.languageCode = 'uk';
  // Дані на телефоні тримає сам калькулятор (localStorage); базі достатньо памʼяті вкладки.
  db = initializeFirestore(app, { localCache: memoryLocalCache() });
  if (emulator) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    // Вхід «через Google» без вікна Google — для автотестів: __emuGoogle('boss@example.com', 'Дмитро')
    window.__emuGoogle = (email, name = email) =>
      signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true, name })));
  }
}

// ---------- Вхід ----------

export const watchUser = (cb) => onAuthStateChanged(auth, cb);

const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

export async function signInGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  // Застосунок з головного екрана не вміє спливаючих вікон — переходимо на сторінку Google і назад
  if (standalone()) return signInWithRedirect(auth, provider);
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/web-storage-unsupported'].includes(e?.code))
      return signInWithRedirect(auth, provider);
    throw e;
  }
}

/** Помилка повернення зі сторінки Google (якщо вхід ішов переходом). */
export const redirectError = () => (configured ? getRedirectResult(auth).then(() => null, (e) => e) : Promise.resolve(null));

export async function register(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(cred.user, { displayName: name.trim() });
  return cred.user;
}

export const signInEmail = (email, password) => signInWithEmailAndPassword(auth, email.trim(), password);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim());
export const logOut = () => signOut(auth);

/** Зрозумілий текст помилки входу (null — нічого не показувати, напр. закрили вікно Google). */
export function authMessage(e) {
  const code = e?.code || '';
  if (['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'].includes(code)) return null;
  const map = {
    'auth/invalid-credential': 'Неправильна пошта або пароль',
    'auth/wrong-password': 'Неправильна пошта або пароль',
    'auth/user-not-found': 'Акаунта з такою поштою немає — зареєструйтесь',
    'auth/email-already-in-use': 'Акаунт з цією поштою вже є — увійдіть або відновіть пароль',
    'auth/account-exists-with-different-credential': 'Ця пошта вже зареєстрована іншим способом — увійдіть так, як реєструвались',
    'auth/weak-password': 'Пароль має бути щонайменше з 6 символів',
    'auth/invalid-email': 'Перевірте адресу пошти',
    'auth/missing-password': 'Введіть пароль',
    'auth/too-many-requests': 'Забагато спроб. Зачекайте кілька хвилин',
    'auth/network-request-failed': 'Немає інтернету — спробуйте ще раз',
    'auth/operation-not-allowed': 'Цей спосіб входу ще не ввімкнено (Firebase → Authentication → Sign-in method)',
    'auth/unauthorized-domain': 'Цю адресу не додано до дозволених (Firebase → Authentication → Settings → Authorized domains)',
    'auth/user-disabled': 'Цей акаунт вимкнено',
  };
  return map[code] || 'Не вдалося увійти. Спробуйте ще раз';
}

// ---------- Профіль ----------

const PROFILE_KEY = (uid) => `norma.v2.profile.${uid}`;

/** Профіль з памʼяті телефона — щоб застосунок відкривався й без інтернету. */
export const cachedProfile = (uid) => store(PROFILE_KEY(uid)) || null;

/**
 * Стежити за профілем і правами: створює профіль при першому вході, раз на день оновлює «коли заходив».
 * cb({ name, email, blocked, isAdmin, loaded })
 */
export function watchProfile(user, cb) {
  const ref = doc(db, 'users', user.uid);
  const email = (user.email || '').toLowerCase();
  let state = { ...(cachedProfile(user.uid) || { name: user.displayName || '', email, blocked: false, isAdmin: false }), loaded: false };
  const emit = (patch) => {
    state = { ...state, ...patch };
    store(PROFILE_KEY(user.uid), { name: state.name, email: state.email, blocked: state.blocked, isAdmin: state.isAdmin });
    cb(state);
  };
  cb(state);
  let touched = false;
  const unsub = onSnapshot(
    ref,
    (snap) => {
      if (snap.metadata.fromCache && !snap.exists()) return;
      const d = snap.data();
      if (!d) {
        // перший вхід: створити профіль
        setDoc(ref, { name: (user.displayName || '').trim(), email, createdAt: serverTimestamp(), lastSeen: serverTimestamp(), seenDay: dayKey() }).catch(() => {});
        return;
      }
      if (!touched) {
        touched = true;
        const patch = {};
        if (d.seenDay !== dayKey()) Object.assign(patch, { lastSeen: serverTimestamp(), seenDay: dayKey() });
        if (email && d.email !== email) patch.email = email;
        if (!d.name && user.displayName) patch.name = user.displayName.trim();
        if (Object.keys(patch).length) updateDoc(ref, patch).catch(() => {});
      }
      emit({ name: d.name || user.displayName || '', email: d.email || email, blocked: d.blocked === true, loaded: true });
    },
    () => emit({ loaded: true }),
  );
  // Адміністратор — той, кому правила дозволяють бачити список працівників (головний або з колекції admins)
  if (email && user.emailVerified)
    getDocs(query(collection(db, 'users'), limit(1))).then(
      () => emit({ isAdmin: true }),
      (e) => e?.code === 'permission-denied' && emit({ isAdmin: false }),
    );
  return unsub;
}

const dayKey = () => new Date().toISOString().slice(0, 10);

export async function setName(user, name) {
  const n = name.trim();
  await updateDoc(doc(db, 'users', user.uid), { name: n });
  await updateProfile(user, { displayName: n }).catch(() => {});
}

// ---------- Дані калькулятора ----------

const normErr = (e) => ({ code: e?.code === 'permission-denied' ? 'not_granted' : String(e?.code || 'unavailable').replace(/-/g, '_'), message: e?.message });

/** Колекція calc користувача у вигляді, який очікує cloud.js (як db у claude.ai). */
export function userCollection(uid) {
  const ref = collection(db, 'users', uid, 'calc');
  const wrap = (p) =>
    p.catch((e) => {
      throw normErr(e);
    });
  return {
    doc: (id) => ({ set: (b) => wrap(setDoc(doc(ref, id), b)), delete: () => wrap(deleteDoc(doc(ref, id))) }),
    // includeMetadataChanges: інакше після повторного входу прийде лише копія з кешу (fromCache),
    // а підтвердження з сервера без змін у даних — ні, і калькулятор чекав би вічно
    onSnapshot: (next, err) => onSnapshot(ref, { includeMetadataChanges: true }, next, (e) => err(normErr(e))),
  };
}

// ---------- Адміністратор ----------

/** Усі працівники з днями обраного й попереднього місяця та налаштуваннями (для мети місяця). */
export async function loadTeam(month, prevMonth) {
  const users = await getDocs(collection(db, 'users'));
  return Promise.all(
    users.docs.map(async (u) => {
      const at = (id) => getDoc(doc(db, 'users', u.id, 'calc', id)).then((s) => s.data() || null, () => null);
      const [cur, prev, settings] = await Promise.all([at(`m-${month}`), at(`m-${prevMonth}`), at('settings')]);
      const p = u.data();
      return {
        uid: u.id,
        name: p.name || p.email || 'Без імені',
        email: p.email || '',
        blocked: p.blocked === true,
        lastSeen: p.lastSeen?.toMillis?.() || null,
        createdAt: p.createdAt?.toMillis?.() || null,
        days: cur?.days || {},
        prevDays: prev?.days || {},
        settings,
      };
    }),
  );
}

/** Уся історія одного працівника (лише читання). */
export async function loadWorker(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'calc'));
  return fromSnapshot(snap);
}

export const setBlocked = (uid, blocked, by) =>
  updateDoc(doc(db, 'users', uid), blocked ? { blocked: true, blockedAt: serverTimestamp(), blockedBy: by } : { blocked: false });

export async function listAdmins() {
  const snap = await getDocs(collection(db, 'admins'));
  return snap.docs.map((d) => ({ email: d.id, ...d.data() }));
}

export const addAdmin = (email, by) => setDoc(doc(db, 'admins', email.trim().toLowerCase()), { addedBy: by, addedAt: serverTimestamp() });
export const removeAdmin = (email) => deleteDoc(doc(db, 'admins', email));
