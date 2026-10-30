// Демо-заміна firebase.js: без сервера і входу через Google.
// Людину, «очима» якої дивимось, обирають у меню акаунта.
import { demoPeople, resetDemo } from './data.js';

export const demo = true;
export const emulator = false;
export const configured = true;
export const auth = null;
export const db = null;

const KEY = 'norma.demo.user';
const OWNER = 'vlasnyk@example.com';
const listeners = new Set();

function read() {
  try {
    return localStorage.getItem(KEY) || OWNER;
  } catch {
    return OWNER;
  }
}

let current = read();

const asUser = (email) => {
  const p = demoPeople().find((x) => x.email === email);
  return { uid: email, email, displayName: p?.name || email, photoURL: null };
};

export function watchUser(cb) {
  listeners.add(cb);
  setTimeout(() => cb(asUser(current)), 0);
  return () => listeners.delete(cb);
}

export const signInGoogle = async () => demoApi.signInAs(OWNER);
export const logOut = async () => demoApi.signInAs(OWNER);

export const demoApi = {
  reset: resetDemo,
  current: () => current,
  signInAs(email) {
    current = email;
    try {
      localStorage.setItem(KEY, email);
    } catch {
      /* без сховища — лише до перезавантаження */
    }
    listeners.forEach((cb) => cb(asUser(email)));
  },
};
