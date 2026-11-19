import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Unlock, Sparkles, ListChecks } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { addXp } from '../lib/store';
import { makeTopicTest, topicKeyOf, PASS_PCT } from '../lib/topics';

const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch { /* ignore */ } };
const PASS_XP = 15; // প্রথমবার পাস করলে বোনাস XP

// টপিক টেস্ট: প্রতিবার র‍্যান্ডম প্রশ্ন; PASS_PCT% বা বেশি পেলে পরবর্তী টপিক আনলক
export default function TopicTest({ book, topic, nextTopic, state, update, onExit }) {
  const [qs, setQs] = useState(() => makeTopicTest(book, topic));
  const [i, setI] = useState(0);
  const [pick, setPick] = useState(null);
  const [answers, setAnswers] = useState([]); // প্রতিটি প্রশ্নে বাছাই করা অপশন
  const saved = useRef(false);
  const wasPassed = useRef(!!state.topicTests?.[topicKeyOf(book, topic)]?.passed);

  const done = i >= qs.length;
  const score = answers.filter((k, n) => k === qs[n]?.a).length;
  const pct = qs.length ? Math.round((score / qs.length) * 100) : 0;
  const passed = pct >= PASS_PCT;

  useEffect(() => {
    if (!done || saved.current || !qs.length) return;
    saved.current = true;
    const key = topicKeyOf(book, topic);
    update((s) => {
      const prev = s.topicTests?.[key] || {};
      const next = {
        ...s.topicTests,
        [key]: { best: Math.max(prev.best || 0, pct), passed: !!prev.passed || passed, tries: (prev.tries || 0) + 1, date: Date.now() },
      };
      const n = { ...s, topicTests: next };
      return passed && !prev.passed ? addXp(n, PASS_XP) : n;
    });
  }, [done]); // eslint-disable-line

  const retry = () => {
    setQs(makeTopicTest(book, topic));
    setI(0); setPick(null); setAnswers([]); saved.current = false;
    window.scrollTo({ top: 0 });
  };

  if (!qs.length) {
    return (
      <div className="card text-center py-10 px-6 space-y-3 view">
        <p className="font-bold">এই টপিকের টেস্টের জন্য পর্যাপ্ত কনটেন্ট নেই</p>
        <button onClick={onExit} className="btn btn-g mx-auto">টপিক তালিকায় ফিরুন</button>
      </div>
    );
  }

  if (done) {
    const wrong = qs.map((q, n) => ({ q, n })).filter(({ q, n }) => answers[n] !== q.a);
    return (
      <div className="space-y-4 view">
        <div className="card text-center py-9 px-6 space-y-3">
          <div className="hanko pop w-16 h-16 text-2xl mx-auto" aria-label={passed ? 'পাস' : 'ফেল'}>{passed ? '合格' : '再'}</div>
          <p className="text-4xl font-extrabold tabular-nums">{score} / {qs.length}</p>
          <span className={`chip ${passed ? '!bg-emerald-500/15 !text-emerald-600 dark:!text-emerald-400' : '!bg-rose-500/15 !text-rose-600 dark:!text-rose-400'}`}>
            {passed ? 'পাস' : 'ফেল'} • {pct}% (পাস মার্ক {PASS_PCT}%)
          </span>
          {passed && !wasPassed.current && <p className="text-xs t-br font-bold flex items-center justify-center gap-1"><Sparkles className="w-3.5 h-3.5" /> +{PASS_XP} XP অর্জিত</p>}
          {passed && nextTopic && !wasPassed.current ? (
            <div className="rounded-2xl p-3.5 mt-1 flex items-center gap-3 text-left" style={{ background: 'var(--soft)' }}>
              <Unlock className="w-5 h-5 t-br shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-sm">নতুন টপিক আনলক হয়েছে</p>
                <p className="t-mu text-xs truncate">{nextTopic.name}</p>
              </div>
            </div>
          ) : passed && nextTopic ? (
            <p className="t-mu text-sm">পরবর্তী টপিক আগেই আনলক করা আছে।</p>
          ) : passed ? (
            <p className="t-mu text-sm">অভিনন্দন! এই বইয়ের সব টপিক সম্পন্ন।</p>
          ) : (
            <p className="t-mu text-sm leading-relaxed">পরবর্তী টপিক আনলক করতে কমপক্ষে {PASS_PCT}% নম্বর দরকার। লেসনগুলো আরেকবার দেখে আবার চেষ্টা করুন।</p>
          )}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button onClick={retry} className="btn btn-g"><RotateCcw className="w-4 h-4" /> আবার দিন</button>
            <button onClick={onExit} className="btn btn-p">টপিক তালিকা</button>
          </div>
        </div>

        {wrong.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-[13px] font-semibold t-mu px-1">ভুল উত্তরগুলো ({wrong.length})</h3>
            {wrong.map(({ q, n }) => (
              <div key={n} className="card space-y-1.5 !py-3.5">
                <p className="text-lg jp-display leading-snug whitespace-pre-line">{q.prompt}</p>
                <p className="text-xs t-bad flex gap-1.5"><XCircle className="w-4 h-4 shrink-0" /> <span>আপনার উত্তর: {answers[n] == null ? 'দেননি' : q.opts[answers[n]]}</span></p>
                <p className="text-xs t-ok flex gap-1.5"><CheckCircle2 className="w-4 h-4 shrink-0" /> <span>সঠিক উত্তর: {q.correct}</span></p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const q = qs[i];
  const choose = (k) => {
    if (pick !== null) return;
    setPick(k);
    if (k !== q.a) buzz([20, 40, 20]); else buzz(12);
  };
  const next = () => {
    setAnswers((a) => [...a, pick]);
    setPick(null);
    setI((x) => x + 1);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="space-y-4 view" key={i}>
      <div className="flex items-center gap-3">
        <div className="bar flex-1"><i style={{ width: `${(i / qs.length) * 100}%` }} /></div>
        <span className="chip tabular-nums">{i + 1}/{qs.length}</span>
      </div>

      <div className="card text-center py-7 px-4 space-y-3">
        <span className="chip"><ListChecks className="w-3.5 h-3.5" /> {q.hint}</span>
        <p className={`jp-display leading-tight whitespace-pre-line ${q.promptSmall ? 'text-xl' : q.prompt.length > 8 ? 'text-2xl' : 'text-4xl'}`}>{q.prompt}</p>
        {q.sub && <p className="t-br text-sm font-semibold jp">{q.sub}</p>}
        {q.speak && (
          <div className="flex justify-center pt-1">
            <AudioPlayer key={`${i}-${q.speak}`} text={q.speak.replace(/[（）()]/g, '')} compact />
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        {q.opts.map((o, k) => {
          const isOk = pick !== null && k === q.a;
          const isBad = pick !== null && k === pick && k !== q.a;
          return (
            <button key={k} onClick={() => choose(k)} className={`opt ${isOk ? 'ok' : isBad ? 'bad' : ''}`} disabled={pick !== null && !isOk && !isBad}>
              <span className="w-7 h-7 rounded-full grid place-items-center text-xs font-bold chip-b shrink-0">{['১', '২', '৩', '৪'][k] || k + 1}</span>
              <span className={`flex-1 ${q.optJp ? 'jp' : ''}`}>{o}</span>
              {isOk && <CheckCircle2 className="w-5 h-5 t-ok shrink-0" />}
              {isBad && <XCircle className="w-5 h-5 t-bad shrink-0" />}
            </button>
          );
        })}
      </div>

      {pick !== null && (
        <button onClick={next} className="btn btn-p w-full view">{i + 1 >= qs.length ? 'ফলাফল দেখুন' : 'পরবর্তী প্রশ্ন'}</button>
      )}
    </div>
  );
}
