const V = 'jft-v4';
const isAudio = (res) => res.status === 200 && /audio|octet/.test(res.headers.get('content-type') || '');

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then((c) => c.addAll(['/', '/index.html', '/icon.svg', '/manifest.json'])).catch(() => {}));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => clients.claim()));
});

// অডিও: পুরো ফাইল ক্যাশ করে, Range রিকোয়েস্টে ক্যাশ থেকে টুকরো কেটে দেয় (Safari/iOS-এও চলে)
async function serveAudio(r) {
  const c = await caches.open(V), key = new Request(r.url);
  let hit = await c.match(key);
  if (!hit) {
    try {
      const net = await fetch(key);
      if (!isAudio(net)) return net;
      await c.put(key, net.clone()); hit = net;
    } catch { return Response.error(); }
  }
  const m = /bytes=(\d*)-(\d*)/.exec(r.headers.get('range') || '');
  if (!m) return hit;
  const buf = await hit.arrayBuffer(), size = buf.byteLength;
  const s = m[1] ? +m[1] : 0, e = m[2] ? Math.min(+m[2], size - 1) : size - 1;
  return new Response(buf.slice(s, e + 1), { status: 206, headers: {
    'Content-Type': hit.headers.get('Content-Type') || 'audio/mpeg',
    'Content-Range': `bytes ${s}-${e}/${size}`, 'Content-Length': String(e - s + 1), 'Accept-Ranges': 'bytes' } });
}

self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.origin === location.origin && u.pathname.startsWith('/audio/')) { e.respondWith(serveAudio(r)); return; }
  if (u.origin !== location.origin && !/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return;
  e.respondWith(caches.open(V).then(async (c) => {
    const hit = await c.match(r);
    const net = fetch(r).then((res) => { if (res.status === 200) c.put(r, res.clone()); return res; })
      .catch(() => hit || (r.mode === 'navigate' ? c.match('/index.html') : Response.error()));
    return hit || net; // stale-while-revalidate
  }));
});
