import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, RotateCcw, Award } from 'lucide-react';
import questions from '../data/mock_exam.json';
import AudioPlayer from './AudioPlayer';

export default function MockTest({ onExit }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 mins
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const selectOption = (optIdx) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.answer) correct += 1;
    });
    const jftScore = Math.round((correct / questions.length) * 250);
    return { correct, total: questions.length, jftScore, passed: jftScore >= 200 };
  };

  const resetTest = () => {
    setAnswers({});
    setCurrentIdx(0);
    setTimeLeft(60 * 60);
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    const result = calculateScore();
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center space-y-3">
          <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center ${result.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">JFT-Basic ফলাফল</h2>
          <div className="py-2">
            <span className="text-4xl font-extrabold text-indigo-600">{result.jftScore}</span>
            <span className="text-sm text-slate-400 font-semibold"> / 250</span>
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${result.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {result.passed ? 'PASSED (A2 উত্তীর্ণ)' : 'NOT PASSED (পাস মার্ক ২০০)'}
          </span>
          <p className="text-xs text-slate-500">সঠিক উত্তর: {result.correct} / {result.total}</p>

          <div className="pt-3 flex gap-2 justify-center">
            <button onClick={resetTest} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl">
              <RotateCcw className="w-3.5 h-3.5" /> আবার দিন
            </button>
            <button onClick={onExit} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">
              হোমপেজ
            </button>
          </div>
        </div>

        {/* Review Answers */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase text-slate-400 px-1">উত্তর পর্যালোচনা</h3>
          {questions.map((q, idx) => {
            const isCorrect = answers[idx] === q.answer;
            return (
              <div key={q.id} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-indigo-600">Q{idx + 1} • {q.section}</span>
                  {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                </div>
                <p className="text-sm font-semibold text-slate-800 whitespace-pre-line">{q.question}</p>
                <p className="text-xs text-emerald-700 font-medium">সঠিক: {q.options[q.answer]}</p>
                <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">{q.explanation}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
      {/* Top Status Bar */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700">
          প্রশ্ন {currentIdx + 1} / {questions.length}
        </span>
        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
          {q.section}
        </span>
        <div className="flex items-center gap-1 text-xs font-bold text-rose-600">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {q.passage && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-800 whitespace-pre-line leading-relaxed">
            {q.passage}
          </div>
        )}

        {q.audio && <AudioPlayer src={q.audio} />}

        <p className="text-base font-bold text-slate-900 whitespace-pre-line leading-relaxed">
          {q.question}
        </p>

        <div className="space-y-2.5 pt-1">
          {q.options.map((opt, idx) => {
            const selected = answers[currentIdx] === idx;
            return (
              <button
                key={idx}
                onClick={() => selectOption(idx)}
                className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition flex items-center gap-3 ${
                  selected
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {idx + 1}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-3">
        <button
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((i) => i - 1)}
          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-40"
        >
          পূর্ববর্তী
        </button>

        {currentIdx < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIdx((i) => i + 1)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
          >
            পরবর্তী
          </button>
        ) : (
          <button
            onClick={() => setIsSubmitted(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
          >
            পরীক্ষা শেষ করুন
          </button>
        )}
      </div>
    </div>
  );
}
