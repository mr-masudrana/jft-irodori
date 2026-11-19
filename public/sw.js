const V = 'jft-v6'; // পুরনো ক্যাশ activate-এ মুছে যায়

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then((c) => c.addAll(['/', '/index.html', '/icon.svg', '/icon-192.png', '/manifest.json'])).catch(() => {}));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.origin !== location.origin && !/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return;
  e.respondWith(caches.open(V).then(async (c) => {
    const hit = await c.match(r);
    const net = fetch(r).then((res) => { if (res.status === 200) c.put(r, res.clone()); return res; })
      .catch(() => hit || (r.mode === 'navigate' ? c.match('/index.html') : Response.error()));
    return hit || net; // stale-while-revalidate
  }));
});
