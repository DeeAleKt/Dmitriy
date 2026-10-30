import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore, memoryLocalCache } from 'firebase/firestore';

// Режим емулятора — лише для локальної розробки: http://localhost:…/?emu
const local = ['localhost', '127.0.0.1'].includes(location.hostname);
export const emulator = local && new URLSearchParams(location.search).has('emu');

const userConfig = window.NORMA_CONFIG?.firebase;
const cfg = emulator
  ? { apiKey: 'demo-key', authDomain: 'demo-norma.firebaseapp.com', projectId: 'demo-norma', appId: 'demo' }
  : userConfig;

export const demo = false;
export const demoApi = null;

export const configured = Boolean(cfg?.apiKey && cfg?.projectId && !/[А-ЯІЇЄҐа-яіїєґ]/.test(cfg.apiKey));

export let auth = null;
export let db = null;

if (configured) {
  const app = initializeApp(cfg);
  auth = getAuth(app);
  auth.languageCode = 'uk';
  // Дані тримаємо лише в пам’яті вкладки: на пристрої після виходу нічого не лишається.
  db = initializeFirestore(app, { localCache: memoryLocalCache() });
  if (emulator) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    // Вхід без вікна Google для автотестів: __emuSignIn('worker@example.com', 'Іван')
    window.__emuSignIn = (email, name = email) =>
      signInWithCredential(
        auth,
        GoogleAuthProvider.credential(
          JSON.stringify({ sub: email, email, email_verified: true, name }),
        ),
      );
  }
}

export function watchUser(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function signInGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw e;
  }
}

export function logOut() {
  return signOut(auth);
}
