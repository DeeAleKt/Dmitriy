// Підключення «Норми» до вашого проєкту Firebase (акаунти працівників, база, адмін-панель).
//
// Замініть блок `const firebaseConfig = { ... };` нижче на той, що показує
// Firebase Console → ⚙ Project settings → General → Your apps → Web app → SDK setup and configuration → Config.
//
// Ці значення НЕ є секретом — так задумано у Firebase. Дані захищають правила доступу
// (norma/firestore.rules): кожен бачить лише свої дні, адміністратор — усіх.
// Поки тут заглушка, калькулятор працює без акаунтів, з даними лише на телефоні.

const firebaseConfig = {
  apiKey: 'ВСТАВТЕ_СЮДИ',
  authDomain: 'ВСТАВТЕ_СЮДИ.firebaseapp.com',
  projectId: 'ВСТАВТЕ_СЮДИ',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

window.NORMA_CONFIG = { firebase: firebaseConfig };
