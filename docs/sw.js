// Сервіс-воркер: тримає копію самого застосунку (код, стилі, іконки, налаштування), щоб калькулятор
// відкривався й без інтернету або коли мережа не пускає на сайт. Дані працівника тут не кешуються:
// їх зберігає сам калькулятор на телефоні й дописує на сервер, щойно звʼязок зʼявиться.
const CACHE = 'norma-a31889e7c0';
const SHELL = ['./', './app.js?v=a31889e7c0', './app.css?v=a31889e7c0', './config.js?v=a31889e7c0', './manifest.webmanifest', './icons/icon.svg', './fonts/unbounded-cyrillic.woff2', './fonts/unbounded-latin.woff2'];

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
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(handle(req));
});
