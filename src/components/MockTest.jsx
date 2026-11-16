import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import questions from '../data/mock_exam.json';
import AudioPlayer from './AudioPlayer';

const MINUTES = Math.max(10, Math.round(questions.length * 1.2)); // আসল পরীক্ষার অনুপাত (৫০ প্রশ্ন/৬০ মিনিট)
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function MockTest({ onSave, onExit }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [left, setLeft] = useState(MINUTES * 60);
  const [result, setResult] = useState(null);
  const ans = useRef({}); ans.current = answers;

  const finish = () => {
    let correct = 0; const sec = {};
    questions.forEach((q, i) => {
      sec[q.section] = sec[q.section] || [0, 0]; sec[q.section][1]++;
      if (ans.current[i] === q.answer) { correct++; sec[q.section][0]++; }
    });
    const score = Math.round((correct / questions.length) * 250);
    const r = { score, correct, total: questions.length, sec, passed: score >= 200 };
    setResult(r); onSave({ date: Date.now(), score, correct, total: questions.length, sec });
  };
  useEffect(() => {
    if (result) return;
    const t = setInterval(() => setLeft((l) => { if (l <= 1) { clearInterval(t); setTimeout(finish, 0); return 0; } return l - 1; }), 1000);
    return () => clearInterval(t);
  }, [result]); // eslint-disable-line
  const submit = () => {
    const un = questions.length - Object.keys(answers).length;
    if (un && !window.confirm(`${un}টি প্রশ্নের উত্তর দেওয়া হয়নি। জমা দেবেন?`)) return;
    finish();
  };
  const reset = () => { setAnswers({}); setIdx(0); setLeft(MINUTES * 60); setResult(null); };

  if (result) {
    return (
      <div className="space-y-4 view">
        <div className="card text-center space-y-2 py-6">
          <p className="text-5xl font-extrabold t-br">{result.score}<span className="text-base t-mu"> / 250</span></p>
          <span className={`chip ${result.passed ? 't-ok' : 't-bad'}`}>{result.passed ? 'PASSED (পাস মার্ক ২০০)' : 'NOT PASSED (পাস মার্ক ২০০)'}</span>
          <p className="t-mu text-xs">সঠিক {result.correct}/{result.total}</p>
          <div className="text-left space-y-2 pt-3">
            {Object.entries(result.sec).map(([k, v]) => (
              <div key={k}><div className="flex justify-between text-xs mb-1"><span>{k}</span><b>{v[0]}/{v[1]}</b></div>
                <div className="bar"><i style={{ width: `${(v[0] / v[1]) * 100}%` }} /></div></div>
            ))}
          </div>
          <div className="flex gap-2 justify-center pt-3">
            <button onClick={reset} className="btn btn-p"><RotateCcw className="w-4 h-4" /> আবার দিন</button>
            <button onClick={onExit} className="btn btn-g">হোম</button>
          </div>
        </div>
        <h3 className="text-xs font-bold uppercase t-mu px-1">উত্তর পর্যালোচনা</h3>
        {questions.map((q, i) => {
          const ok = answers[i] === q.answer;
          return (
            <div key={q.id} className="card space-y-2">
              <div className="flex justify-between"><span className="chip">Q{i + 1} • {q.section}</span>
                {ok ? <CheckCircle2 className="w-4 h-4 t-ok" /> : <XCircle className="w-4 h-4 t-bad" />}</div>
              <p className="text-sm font-semibold whitespace-pre-line">{q.question}</p>
              {!ok && <p className="text-xs t-bad">আপনার উত্তর: {answers[i] === undefined ? 'দেননি' : q.options[answers[i]]}</p>}
              <p className="text-xs t-ok font-medium">সঠিক: {q.options[q.answer]}</p>
              <p className="text-xs t-mu">{q.explanation}</p>
            </div>
          );
        })}
      </div>
    );
  }
  const q = questions[idx];
  return (
    <div className="space-y-3 view">
      <div className="card flex items-center justify-between !py-3">
        <span className="text-xs font-bold">প্রশ্ন {idx + 1}/{questions.length}</span>
        <span className="chip">{q.section}</span>
        <span className={`flex items-center gap-1 text-xs font-bold ${left < 60 ? 't-bad' : 't-br'}`}><Clock className="w-3.5 h-3.5" />{fmt(left)}</span>
      </div>
      <div className="bar"><i style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }} /></div>
      <div className="card space-y-4">
        {q.passage && <div className="chip-b rounded-xl p-3 text-xs whitespace-pre-line leading-relaxed">{q.passage}</div>}
        {q.section.startsWith('Listening') && <AudioPlayer key={q.id} src={q.audio} text={q.transcript} />}
        <p className="font-bold whitespace-pre-line leading-relaxed">{q.question}</p>
        <div className="space-y-2.5">
          {q.options.map((o, k) => (
            <button key={k} onClick={() => setAnswers({ ...answers, [idx]: k })} className={`opt ${answers[idx] === k ? 'sel' : ''}`}>
              <span className="w-6 h-6 rounded-full grid place-items-center text-xs font-bold chip-b shrink-0">{k + 1}</span>{o}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-between gap-3">
        <button disabled={idx === 0} onClick={() => setIdx(idx - 1)} className="btn btn-g disabled:opacity-40">পূর্ববর্তী</button>
        {idx < questions.length - 1
          ? <button onClick={() => setIdx(idx + 1)} className="btn btn-p">পরবর্তী</button>
          : <button onClick={submit} className="btn text-white" style={{ background: 'var(--ok)' }}>শেষ করুন</button>}
      </div>
    </div>
  );
}
