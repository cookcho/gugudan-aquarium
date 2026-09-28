// 한 번 열어 본 뒤에는 인터넷이 없어도 열리도록 파일을 저장해 둬요.
// - 화면(index.html): 새 버전을 먼저 받아 보고, 안 되면 저장해 둔 것
// - 그림·코드·글꼴: 저장해 둔 것을 먼저 쓰고, 없으면 받아서 저장
const CACHE = 'gugudan-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

const save = (req, res) => {
  const copy = res.clone();
  caches.open(CACHE).then((cache) => cache.put(req, copy));
  return res;
};

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !isFont) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => save(req, res)).catch(async () => (await caches.match(req)) || caches.match('./'))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => (res.ok || res.type === 'opaque' ? save(req, res) : res)))
  );
});
