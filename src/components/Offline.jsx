import React, { useState } from 'react';
import { Download, CheckCircle2, WifiOff } from 'lucide-react';
import booksData from '../data/books';
import mock from '../data/mock_exam.json';

const urls = [...new Set([
  ...booksData.flatMap((b) => b.lessons.flatMap((l) => [
    ...l.vocabulary.map((v) => v.audio),
    ...l.dialogues.map((d) => d.audio),
    ...l.activities.flatMap((a) => a.dialogues.map((d) => d.audio)),
  ])),
  ...mock.map((q) => q.audio),
].filter(Boolean))];

// সব MP3 একবারে ডাউনলোড করে অফলাইন ক্যাশে রাখে (সার্ভিস ওয়ার্কারের ক্যাশ 'jft-v4')
export default function Offline() {
  const [n, setN] = useState(0), [miss, setMiss] = useState(0), [busy, setBusy] = useState(false), [done, setDone] = useState(false);
  const ok = typeof caches !== 'undefined';

  const run = async () => {
    setBusy(true); setDone(false); setN(0);
    try { await navigator.storage?.persist?.(); } catch { /* ignore */ }
    const c = await caches.open('jft-v4');
    let m = 0;
    for (let i = 0; i < urls.length; i++) {
      try {
        const r = await fetch(urls[i]);
        if (r.status === 200 && /audio|octet/.test(r.headers.get('content-type') || '')) {
          await c.put(new Request(new URL(urls[i], location.href).href), r);
        } else m++;
      } catch { m++; }
      setN(i + 1);
    }
    setMiss(m);
    setBusy(false);
    setDone(true);
  };

  return (
    <div className="card space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl chip-b grid place-items-center shrink-0">
          <WifiOff className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">অফলাইন অডিও প্যাক</p>
          <p className="t-mu text-xs mt-0.5 leading-relaxed">
            {urls.length}টি MP3 ফাইল ডিভাইসে সেভ করে রাখুন, ইন্টারনেট ছাড়াই শুনতে পারবেন।
          </p>
        </div>
      </div>

      {busy && (
        <div className="space-y-1">
          <div className="bar"><i style={{ width: `${(n / urls.length) * 100}%` }} /></div>
          <p className="text-[11px] t-mu text-right tabular-nums">ডাউনলোড হচ্ছে {n}/{urls.length}...</p>
        </div>
      )}

      {done && (
        <div className="rounded-xl p-2.5 bg-emerald-500/10 text-xs t-ok flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{urls.length - miss}টি ফাইল সেভ হয়েছে{miss ? `, ${miss}টি মিসিং (TTS কাজ করবে)` : ''}</span>
        </div>
      )}

      <button
        disabled={busy || !ok || !urls.length}
        onClick={run}
        className="btn btn-p w-full disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {busy ? `ডাউনলোড হচ্ছে (${Math.round((n / Math.max(1, urls.length)) * 100)}%)` : 'সব অডিও ডাউনলোড করুন'}
      </button>

      {!ok && <p className="text-xs t-bad">অফলাইন ক্যাশের জন্য HTTPS সংযোগ প্রয়োজন।</p>}
    </div>
  );
}