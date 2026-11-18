import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, CheckCircle2, XCircle, RotateCcw, ChevronLeft, ChevronRight,
  Award, Headphones, FileText, Flag, ListChecks, Timer, Target,
} from 'lucide-react';
import questions from '../data/mock_exam.json';
import AudioPlayer from './AudioPlayer';

const MINUTES = Math.max(10, Math.round(questions.length * 1.2)); // আসল পরীক্ষার অনুপাত (৫০ প্রশ্ন/৬০ মিনিট)
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function MockTest({ onSave, onExit }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [left, setLeft] = useState(MINUTES * 60);
  const [result, setResult] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'wrong' | 'correct'
  const [started, setStarted] = useState(false);
  const [flags, setFlags] = useState({});
  const [confirm, setConfirm] = useState(false);
  const ans = useRef({});
  ans.current = answers;

  const finish = () => {
    let correct = 0;
    const sec = {};
    questions.forEach((q, i) => {
      sec[q.section] = sec[q.section] || [0, 0];
      sec[q.section][1]++;
      if (ans.current[i] === q.answer) { correct++; sec[q.section][0]++; }
    });
    const score = Math.round((correct / questions.length) * 250);
    const r = { score, correct, total: questions.length, sec, passed: score >= 200 };
    setResult(r);
    onSave({ date: Date.now(), score, correct, total: questions.length, sec });
  };

  useEffect(() => {
    if (result || !started) return;
    const t = setInterval(() => setLeft((l) => {
      if (l <= 1) { clearInterval(t); setTimeout(finish, 0); return 0; }
      return l - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [result, started]); // eslint-disable-line

  const submit = () => {
    const un = questions.length - Object.keys(answers).length;
    if (un) { setConfirm(true); return; }
    finish();
  };

  const reset = () => {
    setAnswers({});
    setIdx(0);
    setLeft(MINUTES * 60);
    setResult(null);
    setFilter('all');
    setFlags({});
    setConfirm(false);
    setStarted(false);
  };

  if (!started && !result) {
    return (
      <div className="space-y-4 view">
        <div className="card space-y-5 py-7 text-center">
          <div className="hanko w-14 h-14 text-2xl mx-auto">試</div>
          <div>
            <h2 className="text-xl font-extrabold">JFT-Basic মক টেস্ট</h2>
            <p className="t-mu text-sm mt-1">আসল CBT পরীক্ষার মতো অনুশীলন</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              [ListChecks, questions.length, 'প্রশ্ন'],
              [Timer, `${MINUTES} মি.`, 'সময়'],
              [Target, '200/250', 'পাস মার্ক'],
            ].map(([I, v, l]) => (
              <div key={l} className="rounded-2xl py-3 px-1" style={{ background: 'var(--sf2)' }}>
                <I className="w-4 h-4 mx-auto t-br" />
                <b className="block text-[15px] mt-1 tabular-nums">{v}</b>
                <span className="t-mu text-[11px]">{l}</span>
              </div>
            ))}
          </div>
          <ul className="text-left text-[13px] t-mu space-y-2 leading-relaxed">
            <li>• শুরু করলে টাইমার চলতে থাকবে, থামানো যাবে না।</li>
            <li>• প্রশ্ন-নম্বরে ট্যাপ করে যেকোনো প্রশ্নে যাওয়া যায়।</li>
            <li>• নিশ্চিত নন? প্রশ্নে পতাকা দিয়ে পরে আবার দেখুন।</li>
            <li>• শোনার প্রশ্নে 2x বাটনে অডিও দুইবার শোনা যায়।</li>
          </ul>
          <button onClick={() => setStarted(true)} className="btn btn-p w-full">পরীক্ষা শুরু করুন</button>
        </div>
      </div>
    );
  }

  if (result) {
    const reviewList = questions
      .map((q, i) => ({ q, i, ok: answers[i] === q.answer }))
      .filter((x) => (filter === 'all' ? true : filter === 'wrong' ? !x.ok : x.ok));

    return (
      <div className="space-y-4 view">
        <div className="card text-center space-y-4 py-6">
          {result.passed ? (
            <div className="hanko pop w-20 h-20 text-2xl mx-auto" aria-label="পাস">合格</div>
          ) : (
            <div className="w-14 h-14 mx-auto rounded-2xl grid place-items-center bg-rose-500/15 t-bad">
              <Award className="w-8 h-8" />
            </div>
          )}
          <div>
            <p className="text-5xl font-extrabold t-br tabular-nums">
              {result.score}<span className="text-base t-mu font-semibold"> / 250</span>
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className={`chip ${result.passed ? '!bg-emerald-500/15 !text-emerald-600 dark:!text-emerald-400' : '!bg-rose-500/15 !text-rose-600 dark:!text-rose-400'}`}>
                {result.passed ? 'PASSED (পাস মার্ক ২০০)' : 'NOT PASSED (পাস মার্ক ২০০)'}
              </span>
              <span className="chip tabular-nums">সঠিক {result.correct}/{result.total}</span>
            </div>
          </div>

          <div className="text-left space-y-3 pt-3 border-t" style={{ borderColor: 'var(--ln)' }}>
            <p className="text-xs font-bold t-mu">বিভাগভিত্তিক ফলাফল</p>
            {Object.entries(result.sec).map(([k, v]) => (
              <div key={k} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{k}</span>
                  <b className="tabular-nums">{v[0]}/{v[1]} ({Math.round((v[0] / v[1]) * 100)}%)</b>
                </div>
                <div className="bar"><i style={{ width: `${(v[0] / v[1]) * 100}%` }} /></div>
              </div>
            ))}
          </div>

          <div className="flex gap-2.5 justify-center pt-2">
            <button onClick={reset} className="btn btn-p flex-1"><RotateCcw className="w-4 h-4" /> আবার পরীক্ষা দিন</button>
            <button onClick={onExit} className="btn btn-g">হোম</button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-1">
          <h3 className="text-xs font-bold t-mu">উত্তর পর্যালোচনা</h3>
          <div className="flex gap-1.5">
            {[['all', `সব (${questions.length})`], ['wrong', `ভুল (${result.total - result.correct})`], ['correct', `সঠিক (${result.correct})`]].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                  filter === k ? 'btn-p' : 'btn-g !border'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {reviewList.length === 0 && (
          <div className="card text-center text-sm t-mu py-6">এই ক্যাটাগরিতে কোনো প্রশ্ন নেই।</div>
        )}

        {reviewList.map(({ q, i, ok }) => (
          <div key={q.id} className="card space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="chip">Q{i + 1} • {q.section}</span>
              {ok ? <CheckCircle2 className="w-5 h-5 t-ok" /> : <XCircle className="w-5 h-5 t-bad" />}
            </div>
            <p className="text-sm font-semibold jp whitespace-pre-line leading-relaxed">{q.question}</p>
            {!ok && (
              <div className="rounded-xl p-2.5 text-xs bg-rose-500/10 t-bad">
                <b>আপনার উত্তর:</b> {answers[i] === undefined ? 'উত্তর দেননি' : q.options[answers[i]]}
              </div>
            )}
            <div className="rounded-xl p-2.5 text-xs bg-emerald-500/10 t-ok font-medium">
              <b>সঠিক উত্তর:</b> {q.options[q.answer]}
            </div>
            <p className="text-xs t-mu leading-relaxed">{q.explanation}</p>
          </div>
        ))}
      </div>
    );
  }

  const q = questions[idx];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-3.5 view">
      {/* টপ স্ট্যাটাস ও টাইমার */}
      <div className="card flex items-center justify-between gap-2 !py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold tabular-nums shrink-0">প্রশ্ন {idx + 1}/{questions.length}</span>
          <span className="chip truncate">{q.section}</span>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 rounded-full tabular-nums shrink-0 ${
          left < 120 ? 'bg-rose-500/15 t-bad animate-pulse' : 'chip-b'
        }`}>
          <Clock className="w-3.5 h-3.5" />{fmt(left)}
        </span>
      </div>

      {/* প্রশ্ন প্যালেট (CBT নেভিগেটর) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {questions.map((_, i) => {
          const isCur = i === idx;
          const isAns = answers[i] !== undefined;
          return (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`প্রশ্ন ${i + 1}`}
              className={`relative w-9 h-9 rounded-xl text-xs font-bold shrink-0 transition tabular-nums ${
                isCur
                  ? 'btn-p ring-2 ring-indigo-500/30'
                  : isAns
                  ? 'chip-b border border-indigo-400/30'
                  : 'btn-g !p-0 t-mu'
              }`}
            >
              {i + 1}
              {flags[i] && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{ background: 'var(--shu)' }} />}
            </button>
          );
        })}
      </div>

      <div className="bar"><i style={{ width: `${(answeredCount / questions.length) * 100}%` }} /></div>

      {/* মূল প্রশ্ন কার্ড */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-2 -mb-1">
          <span className="t-mu text-xs">{answers[idx] === undefined ? 'এখনো উত্তর দেননি' : 'উত্তর দেওয়া হয়েছে'}</span>
          <button
            onClick={() => setFlags({ ...flags, [idx]: !flags[idx] })}
            aria-pressed={!!flags[idx]}
            className={`chip !py-1.5 ${flags[idx] ? 'chip-shu' : ''}`}
          >
            <Flag className="w-3.5 h-3.5" /> {flags[idx] ? 'পতাকা সরান' : 'পরে দেখব'}
          </button>
        </div>
        {q.passage && (
          <div className="rounded-2xl p-3.5 text-xs jp whitespace-pre-line leading-relaxed border" style={{ background: 'var(--sf2)', borderColor: 'var(--ln)' }}>
            <div className="flex items-center gap-1.5 font-bold t-br mb-1.5">
              <FileText className="w-3.5 h-3.5" /> পাঠ্যাংশ / বিজ্ঞপ্তি
            </div>
            {q.passage}
          </div>
        )}

        {q.section.startsWith('Listening') && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold t-br">
              <Headphones className="w-3.5 h-3.5" /> অডিও মনোযোগ দিয়ে শুনুন
            </div>
            <AudioPlayer key={q.id} src={q.audio} text={q.transcript} />
          </div>
        )}

        <p className="font-bold text-base jp whitespace-pre-line leading-relaxed">{q.question}</p>

        <div className="space-y-2.5">
          {q.options.map((o, k) => (
            <button
              key={k}
              onClick={() => setAnswers({ ...answers, [idx]: k })}
              className={`opt jp ${answers[idx] === k ? 'sel' : ''}`}
            >
              <span className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold shrink-0 ${
                answers[idx] === k ? 'btn-p' : 'chip-b'
              }`}>
                {k + 1}
              </span>
              <span className="flex-1">{o}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="card !p-2.5 flex justify-between gap-2.5 sticky z-20"
        style={{ bottom: 'calc(92px + env(safe-area-inset-bottom))' }}
      >
        <button
          disabled={idx === 0}
          onClick={() => setIdx(idx - 1)}
          className="btn btn-g disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" /> পূর্ববর্তী
        </button>

        {idx < questions.length - 1 ? (
          <button onClick={() => setIdx(idx + 1)} className="btn btn-p flex-1">
            পরবর্তী <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={submit}
            className="btn text-white flex-1"
            style={{ background: 'var(--ok)' }}
          >
            <CheckCircle2 className="w-4 h-4" /> পরীক্ষা শেষ করুন
          </button>
        )}
      </div>

      {confirm && (
        <div className="sheet-back" onClick={() => setConfirm(false)}>
          <div className="sheet space-y-4" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="text-lg font-extrabold">পরীক্ষা জমা দেবেন?</h3>
              <p className="t-mu text-sm mt-1 leading-relaxed">
                {questions.length - answeredCount}টি প্রশ্নের উত্তর দেওয়া হয়নি
                {Object.values(flags).some(Boolean) ? ` এবং ${Object.values(flags).filter(Boolean).length}টিতে পতাকা দেওয়া আছে` : ''}।
                জমা দিলে আর বদলানো যাবে না।
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setConfirm(false)} className="btn btn-g">ফিরে যান</button>
              <button onClick={() => { setConfirm(false); finish(); }} className="btn btn-p">জমা দিন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}