// Підключення програми «Норма» до вашого проєкту Firebase.
//
// Замініть увесь блок `const firebaseConfig = { ... };` нижче на той, що показує
// Firebase Console → ⚙ Project settings → General → Your apps → Web app → SDK setup and configuration → Config.
//
// Ці значення НЕ є секретом — так задумано у Firebase. Дані захищають правила доступу
// (norma/firestore.rules) та вхід через Google: без запрошення ніхто нічого не побачить.

const firebaseConfig = {
  apiKey: 'ВСТАВТЕ_СЮДИ',
  authDomain: 'ВСТАВТЕ_СЮДИ.firebaseapp.com',
  projectId: 'ВСТАВТЕ_СЮДИ',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

window.NORMA_CONFIG = { firebase: firebaseConfig };
