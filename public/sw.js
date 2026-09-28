// 한 번 열어 본 뒤에는 인터넷이 없어도 열리도록 파일을 저장해 둬요.
// - 화면(index.html)과 그림: 새 버전을 먼저 받아 보고, 인터넷이 없으면 저장해 둔 것
// - 코드(assets, 이름에 버전이 붙음)와 글꼴: 저장해 둔 것을 먼저 쓰고, 없으면 받아서 저장
// 그래서 새 버전을 올리면 다음에 앱을 열 때 자동으로 새 화면과 새 그림이 나와요.
const CACHE = 'gugudan-v2';

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
  // 그림 등 이름이 그대로인 파일: 새 파일을 먼저 받아 보고(바뀌지 않았으면 브라우저가 짧게 확인만 해요), 인터넷이 없으면 저장해 둔 것
  const fixedName = !isFont && !url.pathname.includes('/assets/');
  if (fixedName) {
    event.respondWith(
      fetch(req).then((res) => (res.ok ? save(req, res) : res)).catch(() => caches.match(req))
    );
    return;
  }
  // 이름에 버전이 붙은 코드(assets)와 글꼴: 저장해 둔 것을 먼저
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => (res.ok || res.type === 'opaque' ? save(req, res) : res)))
  );
});
