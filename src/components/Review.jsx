import React, { useState, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';
import { addXp, rateCard, cards, isDue, shuffle } from '../lib/store';

// SRS ফ্ল্যাশকার্ড: lessonId দিলে সেই লেসনের সব শব্দ, না দিলে আজকের due কার্ড
export function Review({ state, update, lessonId }) {
  const [queue, setQueue] = useState(() =>
    shuffle(cards.filter((c) => (lessonId ? c.lessonId === lessonId : isDue(state, c)))).slice(0, 30));
  const [total] = useState(queue.length);
  const [flip, setFlip] = useState(false);

  if (!queue.length) {
    return (
      <div className="card text-center py-10 view">
        <div className="text-5xl">{total ? '🎉' : '✅'}</div>
        <p className="font-bold mt-3">{total ? 'রিভিউ সম্পূর্ণ!' : 'আজকের রিভিউ কিছু বাকি নেই'}</p>
        <p className="t-mu text-sm mt-1">{total ? 'দারুণ! কাল আবার দেখা হবে।' : 'নতুন লেসন পড়লে কার্ড এখানে আসবে।'}</p>
      </div>
    );
  }
  const c = queue[0];
  const rate = (ok) => {
    update((s) => addXp(rateCard(s, c.id, ok), ok ? 1 : 0));
    setQueue((q) => (ok ? q.slice(1) : [...q.slice(1), q[0]]));
    setFlip(false);
  };
  return (
    <div className="space-y-3 view">
      <div className="flex items-center gap-3">
        <div className="bar flex-1"><i style={{ width: `${((total - queue.length) / total) * 100}%` }} /></div>
        <span className="t-mu text-xs font-semibold">{queue.length} বাকি</span>
      </div>
      <div onClick={() => setFlip(!flip)} className="card min-h-[240px] grid place-content-center text-center cursor-pointer select-none gap-2">
        {flip ? (<><p className="text-3xl font-bold">{c.bn}</p><p className="t-mu">{c.jp}</p></>)
          : (<><p className="t-br text-sm font-semibold">{c.kana}</p><p className="text-4xl font-bold">{c.jp}</p></>)}
        <p className="t-mu text-xs mt-4">ট্যাপ করে উল্টান • {c.book} L{c.lessonNo}</p>
      </div>
      <div className="flex justify-center"><AudioPlayer src={c.audio} text={c.kana || c.jp} compact /></div>
      <div className="grid grid-cols-2 gap-3">
        <button className="btn text-white" style={{ background: 'var(--bad)' }} onClick={() => rate(false)}>আবার</button>
        <button className="btn text-white" style={{ background: 'var(--ok)' }} onClick={() => rate(true)}>জানি ✓</button>
      </div>
    </div>
  );
}

// লেসনের শব্দ কুইজ (অন্য লেসনের অর্থ থেকে ভুল অপশন নেয়)
export function Quiz({ lesson, update }) {
  const [qs] = useState(() => shuffle(lesson.vocabulary).map((w) => {
    const wrong = shuffle([...new Set(cards.map((c) => c.bn))].filter((b) => b !== w.bn)).slice(0, 3);
    const opts = shuffle([w.bn, ...wrong]);
    return { w, opts, a: opts.indexOf(w.bn) };
  }));
  const [i, setI] = useState(0), [pick, setPick] = useState(null), [score, setScore] = useState(0);
  const done = i >= qs.length;
  useEffect(() => { if (done) update((s) => addXp(s, score * 2)); }, [done]); // eslint-disable-line

  if (done) {
    return (
      <div className="card text-center py-8 view">
        <p className="text-5xl font-extrabold t-br">{score}/{qs.length}</p>
        <p className="t-mu text-sm mt-2">+{score * 2} XP</p>
      </div>
    );
  }
  const q = qs[i];
  const choose = (k) => {
    if (pick !== null) return;
    setPick(k); if (k === q.a) setScore((x) => x + 1);
    setTimeout(() => { setI((x) => x + 1); setPick(null); }, 900);
  };
  return (
    <div className="space-y-3 view">
      <div className="bar"><i style={{ width: `${(i / qs.length) * 100}%` }} /></div>
      <div className="card text-center py-7">
        <p className="t-mu text-xs">অর্থ কী?</p>
        <p className="text-3xl font-bold mt-1">{q.w.jp}</p>
        <div className="mt-3 flex justify-center"><AudioPlayer src={q.w.audio} text={q.w.kana || q.w.jp} compact /></div>
      </div>
      {q.opts.map((o, k) => (
        <button key={k} onClick={() => choose(k)}
          className={`opt ${pick !== null ? (k === q.a ? 'ok' : k === pick ? 'bad' : '') : ''}`}>{o}</button>
      ))}
    </div>
  );
}
