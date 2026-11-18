import React, { useState, useEffect, useRef } from 'react';
import { Check, RotateCcw, Sparkles, CheckCircle2, XCircle, Trophy, ArrowLeftRight } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { addXp, rateCard, cards, isDue, shuffle, nextGapDays } from '../lib/store';

const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch { /* ignore */ } };
const gapLabel = (n) => (n <= 1 ? 'কাল' : `${n} দিন পরে`);

// SRS ফ্ল্যাশকার্ড: lessonId দিলে সেই লেসনের সব শব্দ, না দিলে আজকের due কার্ড
// কার্ড উল্টানোর পর ডানে সোয়াইপ = মনে আছে, বামে সোয়াইপ = আবার দেখব
export function Review({ state, update, lessonId, onDone }) {
  const [queue, setQueue] = useState(() =>
    shuffle(cards.filter((c) => (lessonId ? c.lessonId === lessonId : isDue(state, c)))).slice(0, 30)
  );
  const [total] = useState(queue.length);
  const [flip, setFlip] = useState(false);
  const [dx, setDx] = useState(0);
  const startX = useRef(null), moved = useRef(false);

  if (!queue.length) {
    return (
      <div className="card text-center py-12 px-6 space-y-4 view">
        <div className="hanko pop w-16 h-16 text-3xl mx-auto">{total ? '完' : '休'}</div>
        <h3 className="font-bold text-lg">{total ? 'রিভিউ সম্পূর্ণ হয়েছে' : 'আজকের রিভিউ বাকি নেই'}</h3>
        <p className="t-mu text-sm max-w-xs mx-auto leading-relaxed">
          {total
            ? 'স্মৃতিতে ধরে রাখতে কার্ডগুলো নির্ধারিত দিনে আবার আসবে।'
            : 'নতুন লেসনের শব্দ শিখলে কার্ডগুলো এখানে যুক্ত হবে।'}
        </p>
        {onDone && (
          <button onClick={onDone} className="btn btn-p mx-auto">নতুন লেসন পড়ুন</button>
        )}
      </div>
    );
  }

  const c = queue[0];
  const doneCount = total - queue.length;
  const rate = (ok) => {
    buzz(ok ? 12 : [20, 40, 20]);
    update((s) => addXp(rateCard(s, c.id, ok), ok ? 1 : 0));
    setQueue((q) => (ok ? q.slice(1) : [...q.slice(1), q[0]]));
    setFlip(false);
    setDx(0);
  };

  const down = (e) => { startX.current = e.clientX; moved.current = false; };
  const move = (e) => {
    if (startX.current === null) return;
    const d = e.clientX - startX.current;
    if (!moved.current && Math.abs(d) > 10) {
      moved.current = true;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    }
    if (moved.current && flip) setDx(Math.max(-160, Math.min(160, d)));
  };
  const up = () => {
    if (startX.current === null) return;
    startX.current = null;
    if (flip && Math.abs(dx) > 90) rate(dx > 0);
    else setDx(0);
  };
  const tap = () => { if (!moved.current) setFlip((f) => !f); };
  const key = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlip((f) => !f); }
    else if (flip && e.key === 'ArrowRight') rate(true);
    else if (flip && e.key === 'ArrowLeft') rate(false);
  };

  const dragging = startX.current !== null && dx !== 0;
  return (
    <div className="space-y-4 view">
      <div className="flex items-center gap-3">
        <div className="bar flex-1">
          <i style={{ width: `${(doneCount / Math.max(1, total)) * 100}%` }} />
        </div>
        <span className="chip tabular-nums">{doneCount}/{total}</span>
      </div>

      <div
        className="relative"
        style={{
          transform: dx ? `translateX(${dx}px) rotate(${dx / 14}deg)` : undefined,
          transition: dragging ? 'none' : 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {Math.abs(dx) > 24 && (
          <span
            className="swipe-hint"
            style={{
              left: '50%', translate: '-50% 0', background: 'var(--sf)',
              opacity: Math.min(1, (Math.abs(dx) - 24) / 66),
              color: dx > 0 ? 'var(--ok)' : 'var(--bad)',
            }}
          >
            {dx > 0 ? 'মনে আছে' : 'আবার দেখব'}
          </span>
        )}
        <div
          className="flip-scene cursor-pointer select-none"
          role="button" tabIndex={0} aria-label="কার্ড উল্টান"
          onClick={tap} onKeyDown={key}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        >
          <div className={`flip-card ${flip ? 'flipped' : ''}`}>
            {/* কার্ডের সামনের অংশ */}
            <div className="flip-face">
              <span className="chip absolute top-4 left-4">{c.book} • L{c.lessonNo}</span>
              <div className="absolute top-3.5 right-3.5">
                <AudioPlayer key={c.id} src={c.audio} text={c.kana || c.jp} compact />
              </div>

              <p className="t-br text-base font-semibold jp mt-4">{c.kana}</p>
              <p className="text-5xl jp-display mt-2 leading-tight">{c.jp}</p>

              <p className="t-mu text-xs mt-9 flex items-center gap-1.5">
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
              <p className="t-br text-sm font-medium jp mt-3">{c.kana}</p>
              <p className="t-mu text-xl jp-display">{c.jp}</p>
              <p className="t-mu text-[11px] mt-6 flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5" /> সোয়াইপ করেও মূল্যায়ন করতে পারেন
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          className="btn btn-g flex-col !gap-0.5 !py-3 text-sm"
          style={{ borderColor: 'color-mix(in srgb, var(--bad) 40%, var(--ln))', color: 'var(--bad)' }}
          onClick={() => rate(false)}
        >
          <span className="flex items-center gap-1.5"><RotateCcw className="w-4 h-4" /> আবার দেখব</span>
          <span className="text-[11px] font-medium opacity-75">আজই ফিরে আসবে</span>
        </button>
        <button
          type="button"
          className="btn flex-col !gap-0.5 !py-3 text-sm text-white"
          style={{ background: 'var(--ok)', boxShadow: '0 6px 16px -6px color-mix(in srgb, var(--ok) 70%, transparent)' }}
          onClick={() => rate(true)}
        >
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> মনে আছে</span>
          <span className="text-[11px] font-medium opacity-85">{gapLabel(nextGapDays(state, c.id))} • +1 XP</span>
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
        <div className="hanko pop w-16 h-16 text-3xl mx-auto" aria-label="গ্রেড">{pct >= 80 ? '優' : pct >= 60 ? '良' : '可'}</div>
        <p className="text-4xl font-extrabold tabular-nums">{score} / {qs.length}</p>
        <span className="chip"><Sparkles className="w-3.5 h-3.5" /> +{score * 2} XP অর্জিত</span>
        <p className="t-mu text-sm">সঠিকতার হার {pct}% • {pct >= 80 ? 'দারুণ ফলাফল' : pct >= 60 ? 'ভালো হয়েছে, আরেকটু অনুশীলন করুন' : 'ফ্ল্যাশকার্ডে আবার অনুশীলন করুন'}</p>
      </div>
    );
  }

  const q = qs[i];
  const choose = (k) => {
    if (pick !== null) return;
    setPick(k);
    if (k === q.a) setScore((x) => x + 1); else buzz([20, 40, 20]);
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
        <p className="text-4xl jp-display leading-tight">{q.w.jp}</p>
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