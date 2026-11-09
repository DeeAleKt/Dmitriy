// Сервіс-воркер: тримає копію самого застосунку (код, стилі, іконки, налаштування), щоб калькулятор
// відкривався й без інтернету або коли мережа не пускає на сайт. Дані працівника тут не кешуються:
// їх зберігає сам калькулятор на телефоні й дописує на сервер, щойно звʼязок зʼявиться.
const CACHE = 'norma-__VERSION__';
const SHELL = ['./', './app.js?v=__VERSION__', './app.css?v=__VERSION__', './config.js?v=__VERSION__', './manifest.webmanifest', './icons/icon.svg', './fonts/unbounded-cyrillic.woff2', './fonts/unbounded-latin.woff2'];

// На хостингу Firebase кожна наша відповідь має заголовок X-Norma (див. firebase.json). Відповідь без нього —
// чужа сторінка (напр., «сайт заблоковано» від мережі), її не показуємо і не кешуємо, а відкриваємо копію.
const STRICT = /\.(web\.app|firebaseapp\.com)$/.test(location.hostname);
const ours = (res) => res.ok && (!STRICT || res.headers.get('x-norma') === '1');

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const timeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);

async function handle(req) {
  const cache = await caches.open(CACHE);
  const cached = (await cache.match(req)) || (req.mode === 'navigate' ? await cache.match('./') : undefined);
  try {
    // спершу мережа (щоб оновлення приходили одразу), але якщо вона «висить» — не чекаємо довше кількох секунд
    const res = await timeout(fetch(req), cached ? 4000 : 20000);
    if (ours(res)) {
      cache.put(req, res.clone());
      return res;
    }
    return cached || res;
  } catch (e) {
    if (cached) return cached;
    throw e;
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // службові адреси Firebase (/__/auth/handler, /__/auth/iframe — вхід через Google) — лише з мережі, як є:
  // заголовка X-Norma вони не мають, і без цього рядка замість обробника входу відкривалась копія застосунку
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/__/')) return;
  e.respondWith(handle(req));
});
