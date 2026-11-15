import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Headphones,
  BookMarked,
  FileText,
  Languages,
  Eye,
  EyeOff,
  ClipboardCheck,
  PlayCircle
} from 'lucide-react';
import booksData from './data/books_data.json';
import AudioPlayer from './components/AudioPlayer';
import MockTest from './components/MockTest';

export default function App() {
  // Views: 'home' | 'lessons' | 'study' | 'exam'
  const [view, setView] = useState('home');
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);

  const [activeTab, setActiveTab] = useState('dialogue');
  const [hideScript, setHideScript] = useState(false);

  const [completedCanDos, setCompletedCanDos] = useState(() => {
    try {
      const saved = localStorage.getItem('jft_irodori_progress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('jft_irodori_progress', JSON.stringify(completedCanDos));
  }, [completedCanDos]);

  const currentBook = booksData.find((b) => b.id === selectedBookId);
  const currentLesson = currentBook?.lessons.find((l) => l.id === selectedLessonId);

  const toggleCanDo = (lessonId, index) => {
    const key = `${lessonId}-${index}`;
    setCompletedCanDos((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getBookProgress = (book) => {
    let total = 0;
    let done = 0;
    book.lessons.forEach((lesson) => {
      lesson.canDos.forEach((_, idx) => {
        total += 1;
        if (completedCanDos[`${lesson.id}-${idx}`]) done += 1;
      });
    });
    return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  };

  const getLessonProgress = (lesson) => {
    const total = lesson.canDos.length;
    const done = lesson.canDos.filter((_, idx) => completedCanDos[`${lesson.id}-${idx}`]).length;
    return { total, done, isComplete: total > 0 && total === done };
  };

  const openBook = (bookId) => {
    setSelectedBookId(bookId);
    setView('lessons');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openLesson = (lessonId) => {
    setSelectedLessonId(lessonId);
    setActiveTab('dialogue');
    setHideScript(false);
    setView('study');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (view === 'study') setView('lessons');
    else if (view === 'lessons' || view === 'exam') {
      setView('home');
      setSelectedBookId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-14">
      {/* Clean Top Bar with Custom App Logo */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {view !== 'home' && (
              <button
                onClick={goBack}
                className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div onClick={() => setView('home')} className="flex items-center gap-2.5 cursor-pointer">
              <img src="/icon.svg" alt="Logo" className="w-8 h-8 rounded-lg shadow-sm" />
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-none">
                  {view === 'home' && 'Irodori JFT-Basic'}
                  {view === 'lessons' && currentBook?.title}
                  {view === 'study' && `Lesson ${currentLesson?.lessonNumber}`}
                  {view === 'exam' && 'JFT Mock Exam'}
                </h1>
                {view !== 'home' && (
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-none">
                    {view === 'lessons' && currentBook?.jpTitle}
                    {view === 'study' && currentBook?.title}
                    {view === 'exam' && '250 Marks • Pass 200'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            Pass: 200/250
          </span>
        </div>
      </header>

      {/* =========================================================
          PAGE 1: NEAT & CLEAN HOME PAGE
         ========================================================= */}
      {view === 'home' && (
        <main className="max-w-2xl mx-auto px-4 pt-5 space-y-6">
          {/* JFT Test Exam Section */}
          <section className="space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              JFT-Basic Exam
            </h2>
            <div
              onClick={() => setView('exam')}
              className="group bg-gradient-to-r from-indigo-600 to-blue-700 rounded-2xl p-5 text-white shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">JFT-Basic Mock Test</h3>
                  <p className="text-xs text-indigo-100 mt-0.5">60 মিনিট • 250 নম্বর (CBT মডেল টেস্ট)</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </section>

          {/* Books Section */}
          <section className="space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Irodori Books
            </h2>
            <div className="grid gap-3">
              {booksData.map((book) => {
                const progress = getBookProgress(book);
                return (
                  <div
                    key={book.id}
                    onClick={() => openBook(book.id)}
                    className="group bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:border-indigo-300 transition cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-12 h-12 rounded-xl ${book.iconBg} text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm`}>
                          {book.id === 'starter' ? 'A1' : 'A2'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                              {book.title}
                            </h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${book.badgeColor}`}>
                              {book.level}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{book.jpTitle} • {book.totalLessons} Lessons</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                    </div>

                    {/* Minimal Progress Bar */}
                    <div className="mt-3.5 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${book.iconBg} transition-all duration-500`}
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">{progress.percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      )}

      {/* =========================================================
          PAGE 2: LESSON LIST PAGE
         ========================================================= */}
      {view === 'lessons' && currentBook && (
        <main className="max-w-2xl mx-auto px-4 pt-5 space-y-3">
          {currentBook.lessons.map((lesson) => {
            const status = getLessonProgress(lesson);
            return (
              <div
                key={lesson.id}
                onClick={() => openLesson(lesson.id)}
                className="group bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-indigo-300 transition cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                      status.isComplete
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors'
                    }`}
                  >
                    {lesson.lessonNumber}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-700">
                      {lesson.title}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{lesson.titleBn}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                    status.isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {status.done}/{status.total}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            );
          })}
        </main>
      )}

      {/* =========================================================
          PAGE 3: LESSON STUDY PAGE
         ========================================================= */}
      {view === 'study' && currentLesson && (
        <main className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
          {/* Lesson Title & Can-Do */}
          <section className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{currentLesson.title}</h2>
              <p className="text-xs text-slate-500">{currentLesson.titleBn}</p>
            </div>

            <div className="pt-2.5 border-t border-slate-100 space-y-2">
              {currentLesson.canDos.map((item, idx) => {
                const isChecked = !!completedCanDos[`${currentLesson.id}-${idx}`];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleCanDo(currentLesson.id, idx)}
                    className="flex items-start gap-2 text-xs cursor-pointer select-none"
                  >
                    {isChecked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                    )}
                    <span className={isChecked ? 'line-through text-slate-400' : 'text-slate-700'}>
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Segmented Tabs */}
          <nav className="grid grid-cols-4 gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-semibold sticky top-16 z-10 backdrop-blur-sm">
            {[
              { id: 'dialogue', label: 'কথোপকথন', icon: Headphones },
              { id: 'vocab', label: 'শব্দভান্ডার', icon: BookMarked },
              { id: 'grammar', label: 'গ্রামার', icon: FileText },
              { id: 'kanji', label: 'কাঞ্জি', icon: Languages },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition ${
                    activeTab === tab.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* TAB 1: DIALOGUE */}
          {activeTab === 'dialogue' && (
            <section className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => setHideScript(!hideScript)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold shadow-sm"
                >
                  {hideScript ? <Eye className="w-3.5 h-3.5 text-indigo-600" /> : <EyeOff className="w-3.5 h-3.5 text-amber-600" />}
                  <span>{hideScript ? 'স্ক্রিপ্ট দেখুন' : 'স্ক্রিপ্ট লুকান'}</span>
                </button>
              </div>

              {currentLesson.dialogues.map((dlg) => (
                <div key={dlg.id} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                    <h3 className="font-bold text-xs text-slate-800">{dlg.title}</h3>
                  </div>
                  <AudioPlayer src={dlg.audio} />
                  {!hideScript && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {dlg.lines.map((line, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-50">
                          <p className="text-sm font-semibold text-slate-900">
                            <span className="text-xs font-bold text-indigo-600 mr-2">{line.speaker}:</span>
                            {line.jp}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">{line.bn}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* TAB 2: VOCABULARY */}
          {activeTab === 'vocab' && (
            <section className="grid gap-2.5">
              {currentLesson.vocabulary.map((word, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-[11px] font-medium text-indigo-600">{word.kana}</p>
                    <p className="text-base font-bold text-slate-900">{word.jp}</p>
                    <p className="text-xs text-slate-500">{word.bn}</p>
                  </div>
                  <AudioPlayer src={word.audio} compact />
                </div>
              ))}
            </section>
          )}

          {/* TAB 3: GRAMMAR */}
          {activeTab === 'grammar' && (
            <section className="space-y-3">
              {currentLesson.grammar.map((g, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
                  <span className="inline-block bg-indigo-50 text-indigo-700 font-bold text-xs px-2.5 py-1 rounded-md">
                    {g.pattern}
                  </span>
                  <p className="text-sm font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-lg border-l-2 border-indigo-500">
                    {g.example}
                  </p>
                  <p className="text-xs text-slate-600">{g.meaningBn}</p>
                </div>
              ))}
            </section>
          )}

          {/* TAB 4: DEDICATED KANJI */}
          {activeTab === 'kanji' && (
            <section className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {currentLesson.kanji.map((k, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm text-center space-y-1"
                >
                  <p className="text-2xl font-bold text-slate-900">{k.char}</p>
                  <p className="text-xs font-semibold text-indigo-600">{k.reading}</p>
                  <p className="text-xs text-slate-500">{k.bn}</p>
                </div>
              ))}
            </section>
          )}
        </main>
      )}

      {/* =========================================================
          PAGE 4: JFT-BASIC MOCK EXAM PAGE
         ========================================================= */}
      {view === 'exam' && <MockTest onExit={() => setView('home')} />}
    </div>
  );
}
