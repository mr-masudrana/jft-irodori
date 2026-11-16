import React, { useState } from 'react';
import { Download, CheckCircle2 } from 'lucide-react';
import booksData from '../data/books_data.json';
import mock from '../data/mock_exam.json';

const urls = [...new Set([
  ...booksData.flatMap((b) => b.lessons.flatMap((l) => [...l.vocabulary.map((v) => v.audio), ...l.dialogues.map((d) => d.audio)])),
  ...mock.map((q) => q.audio),
].filter(Boolean))];

// সব MP3 একবারে ডাউনলোড করে অফলাইন ক্যাশে রাখে (সার্ভিস ওয়ার্কারের ক্যাশ 'jft-v4')
export default function Offline() {
  const [n, setN] = useState(0), [miss, setMiss] = useState(0), [busy, setBusy] = useState(false), [done, setDone] = useState(false);
  const ok = typeof caches !== 'undefined';
  const run = async () => {
    setBusy(true); setDone(false); setN(0);
    try { await navigator.storage?.persist?.(); } catch { /* ignore */ }
    const c = await caches.open('jft-v4'); let m = 0;
    for (let i = 0; i < urls.length; i++) {
      try {
        const r = await fetch(urls[i]);
        if (r.status === 200 && /audio|octet/.test(r.headers.get('content-type') || '')) await c.put(new Request(new URL(urls[i], location.href).href), r);
        else m++;
      } catch { m++; }
      setN(i + 1);
    }
    setMiss(m); setBusy(false); setDone(true);
  };
  return (
    <div className="card space-y-3">
      <div><p className="font-bold text-sm">📴 অফলাইন অডিও</p>
        <p className="t-mu text-xs">{urls.length}টি MP3 ডাউনলোড করে রাখুন, ইন্টারনেট ছাড়াও বাজবে। অ্যাপ ও ডেটা প্রথমবার খুললেই অফলাইনের জন্য সেভ হয়।</p></div>
      {busy && <div className="bar"><i style={{ width: `${(n / urls.length) * 100}%` }} /></div>}
      {done && <p className="text-xs t-ok flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{urls.length - miss}টি সেভ হয়েছে{miss ? `, ${miss}টি পাওয়া যায়নি (TTS বাজবে)` : ''}</p>}
      <button disabled={busy || !ok || !urls.length} onClick={run} className="btn btn-p w-full disabled:opacity-50"><Download className="w-4 h-4" />{busy ? `${n}/${urls.length}` : 'সব অডিও ডাউনলোড করুন'}</button>
      {!ok && <p className="text-xs t-bad">অফলাইন ক্যাশের জন্য HTTPS লাগবে।</p>}
    </div>
  );
}
