// sw.js — 서비스워커(앱 담당). 한 번 열면 이 페이지와 받은 글꼴을 기기에 둔다(오프라인 새로고침, 검사 AUTO-R1-09).
// - 같은 주소의 파일: 네트워크 먼저(새로 올린 판을 바로 받는다), 연결이 끊기면 저장본.
// - Google Fonts(CSS·글꼴 파일): 저장본 먼저, 뒤에서 새로 받아 둔다. 실패해도 페이지는 대체 글꼴로 돈다.
// - 분석·쿠키·그 밖의 외부 요청은 없다. 캐시 이름에 빌드 표시를 넣어 새 판이 올라오면 옛 캐시를 지운다.
const CACHE = 'lh-site-20261014T173439Z-35ceead8';
const CORE = ['./', './index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('lh-site-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.origin === self.location.origin) {
    if (url.pathname.endsWith('/sw.js')) return;
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
        return res;
      }).catch(() => caches.open(CACHE).then((c) => c.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? c.match('./', { ignoreSearch: true }).then((x) => x || c.match('./index.html')) : undefined)))),
    );
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(CACHE).then((c) => c.match(req).then((hit) => {
      const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()).catch(() => {}); return res; }).catch(() => hit);
      return hit || net;
    })));
  }
});
