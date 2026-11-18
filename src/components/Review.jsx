import React, { useState, useEffect } from 'react';
import { Check, RotateCcw, Sparkles, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { addXp, rateCard, cards, isDue, shuffle } from '../lib/store';

// SRS ফ্ল্যাশকার্ড: lessonId দিলে সেই লেসনের সব শব্দ, না দিলে আজকের due কার্ড
export function Review({ state, update, lessonId }) {
  const [queue, setQueue] = useState(() =>
    shuffle(cards.filter((c) => (lessonId ? c.lessonId === lessonId : isDue(state, c)))).slice(0, 30)
  );
  const [total] = useState(queue.length);
  const [flip, setFlip] = useState(false);

  if (!queue.length) {
    return (
      <div className="card text-center py-12 px-6 space-y-3 view">
        <div className="w-16 h-16 mx-auto rounded-3xl chip-b grid place-items-center text-3xl">
          {total ? '🎉' : '✅'}
        </div>
        <h3 className="font-bold text-lg">{total ? 'অভিনন্দন! রিভিউ সম্পূর্ণ' : 'আজকের রিভিউ বাকি নেই'}</h3>
        <p className="t-mu text-sm max-w-xs mx-auto leading-relaxed">
          {total ? 'দারুণ অনুশীলন হয়েছে! স্মৃতি ধরে রাখতে আগামীকাল আবার দেখা হবে।' : 'নতুন লেসনের ভোকাবুলারি প্র্যাকটিস করলে কার্ডগুলো এখানে যুক্ত হবে।'}
        </p>
      </div>
    );
  }

  const c = queue[0];
  const doneCount = total - queue.length;
  const rate = (ok) => {
    update((s) => addXp(rateCard(s, c.id, ok), ok ? 1 : 0));
    setQueue((q) => (ok ? q.slice(1) : [...q.slice(1), q[0]]));
    setFlip(false);
  };

  return (
    <div className="space-y-4 view">
      <div className="flex items-center gap-3">
        <div className="bar flex-1">
          <i style={{ width: `${(doneCount / Math.max(1, total)) * 100}%` }} />
        </div>
        <span className="chip tabular-nums">{doneCount}/{total}</span>
      </div>

      <div className="flip-scene cursor-pointer select-none" onClick={() => setFlip(!flip)}>
        <div className={`flip-card ${flip ? 'flipped' : ''}`}>
          {/* কার্ডের সামনের অংশ */}
          <div className="flip-face">
            <span className="chip absolute top-4 left-4">{c.book} • L{c.lessonNo}</span>
            <div className="absolute top-3.5 right-3.5">
              <AudioPlayer key={c.id} src={c.audio} text={c.kana || c.jp} compact />
            </div>

            <p className="t-br text-sm font-semibold jp mt-4">{c.kana}</p>
            <p className="text-4xl font-extrabold jp mt-1.5 tracking-tight">{c.jp}</p>

            <p className="t-mu text-xs mt-8 flex items-center gap-1.5 opacity-80">
              <RotateCcw className="w-3.5 h-3.5" /> অর্থ দেখতে কার্ডে ট্যাপ করুন
            </p>
          </div>

          {/* কার্ডের পেছনের অংশ */}
          <div className="flip-face flip-back">
            <span className="chip absolute top-4 left-4">বাংলা অর্থ</span>
            <div className="absolute top-3.5 right-3.5">
              <AudioPlayer key={`${c.id}-back`} src={c.audio} text={c.kana || c.jp} compact />
            </div>

            <p className="text-3xl font-extrabold mt-4 leading-snug">{c.bn}</p>
            <p className="t-br text-sm font-medium jp mt-2">{c.kana}</p>
            <p className="t-mu text-lg font-bold jp">{c.jp}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          className="btn btn-g !py-3.5 text-sm border-rose-500/30 t-bad"
          onClick={() => rate(false)}
        >
          <RotateCcw className="w-4 h-4" /> আবার দেখব
        </button>
        <button
          type="button"
          className="btn text-white !py-3.5 text-sm shadow-lg shadow-emerald-500/20"
          style={{ background: 'var(--ok)' }}
          onClick={() => rate(true)}
        >
          <Check className="w-4 h-4" /> মনে আছে (+1 XP)
        </button>
      </div>
    </div>
  );
}

// লেসনের শব্দ কুইজ (অন্য লেসনের অর্থ থেকে ভুল অপশন নেয়)
export function Quiz({ lesson, update }) {
  const [qs] = useState(() =>
    shuffle(lesson.vocabulary).map((w) => {
      const wrong = shuffle([...new Set(cards.map((c) => c.bn))].filter((b) => b !== w.bn)).slice(0, 3);
      const opts = shuffle([w.bn, ...wrong]);
      return { w, opts, a: opts.indexOf(w.bn) };
    })
  );
  const [i, setI] = useState(0), [pick, setPick] = useState(null), [score, setScore] = useState(0);
  const done = i >= qs.length;
  useEffect(() => { if (done) update((s) => addXp(s, score * 2)); }, [done]); // eslint-disable-line

  if (done) {
    const pct = qs.length ? Math.round((score / qs.length) * 100) : 0;
    return (
      <div className="card text-center py-10 px-6 space-y-3 view">
        <div className="w-16 h-16 mx-auto rounded-3xl chip-b grid place-items-center">
          <Trophy className="w-8 h-8 t-br" />
        </div>
        <p className="text-4xl font-extrabold t-br tabular-nums">{score} / {qs.length}</p>
        <span className="chip"><Sparkles className="w-3.5 h-3.5" /> +{score * 2} XP অর্জিত</span>
        <p className="t-mu text-sm">সঠিকতার হার: {pct}%</p>
      </div>
    );
  }

  const q = qs[i];
  const choose = (k) => {
    if (pick !== null) return;
    setPick(k);
    if (k === q.a) setScore((x) => x + 1);
    setTimeout(() => { setI((x) => x + 1); setPick(null); }, 850);
  };

  return (
    <div className="space-y-4 view">
      <div className="flex items-center gap-3">
        <div className="bar flex-1"><i style={{ width: `${(i / qs.length) * 100}%` }} /></div>
        <span className="chip tabular-nums">{i + 1}/{qs.length}</span>
      </div>

      <div className="card text-center py-8 px-4 space-y-3">
        <span className="chip">সঠিক বাংলা অর্থ বাছাই করুন</span>
        <p className="text-3xl font-extrabold jp tracking-tight">{q.w.jp}</p>
        <div className="flex justify-center pt-1">
          <AudioPlayer key={`${i}-${q.w.jp}`} src={q.w.audio} text={q.w.kana || q.w.jp} compact />
        </div>
      </div>

      <div className="space-y-2.5">
        {q.opts.map((o, k) => {
          const isOk = pick !== null && k === q.a;
          const isBad = pick !== null && k === pick && k !== q.a;
          return (
            <button
              key={k}
              onClick={() => choose(k)}
              className={`opt ${isOk ? 'ok' : isBad ? 'bad' : ''}`}
            >
              <span className="w-7 h-7 rounded-full grid place-items-center text-xs font-bold chip-b shrink-0">
                {['১', '২', '৩', '৪'][k] || k + 1}
              </span>
              <span className="flex-1">{o}</span>
              {isOk && <CheckCircle2 className="w-5 h-5 t-ok shrink-0" />}
              {isBad && <XCircle className="w-5 h-5 t-bad shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}