import React, { useState, useEffect } from 'react';
import {
  BookOpen,
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
  Award,
  Sparkles,
  PlayCircle
} from 'lucide-react';
import booksData from './data/books_data.json';
import AudioPlayer from './components/AudioPlayer';

export default function App() {
  // Navigation States: 'home' | 'lessons' | 'study'
  const [view, setView] = useState('home');
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);

  // Study Page States
  const [activeTab, setActiveTab] = useState('dialogue'); // dialogue | vocab | grammar | kanji
  const [hideScript, setHideScript] = useState(false);

  // Progress State saved in localStorage
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

  // Calculate book progress
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

  // Calculate lesson progress
  const getLessonProgress = (lesson) => {
    const total = lesson.canDos.length;
    const done = lesson.canDos.filter((_, idx) => completedCanDos[`${lesson.id}-${idx}`]).length;
    return { total, done, isComplete: total > 0 && total === done };
  };

  // Navigation Handlers
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
    if (view === 'study') {
      setView('lessons');
    } else if (view === 'lessons') {
      setView('home');
      setSelectedBookId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top App Bar */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {view !== 'home' && (
              <button
                onClick={goBack}
                className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-700 transition active:scale-95"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div
              onClick={() => setView('home')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                彩
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-tight">
                  {view === 'home' && 'Irodori JFT-Basic'}
                  {view === 'lessons' && currentBook?.title}
                  {view === 'study' && `Lesson ${currentLesson?.lessonNumber}`}
                </h1>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {view === 'home' && 'জাপান SSW ভাষা প্রস্তুতি'}
                  {view === 'lessons' && currentBook?.jpTitle}
                  {view === 'study' && currentBook?.title}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>A2 Target</span>
          </div>
        </div>
      </header>

      {/* =========================================================
          PAGE 1: HOME PAGE (BOOK SELECTION)
         ========================================================= */}
      {view === 'home' && (
        <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
          {/* Hero Banner */}
          <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-indigo-100">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Japan Foundation Curriculum</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                いろどり 生活の日本語
              </h2>
              <p className="text-sm text-indigo-100/90 max-w-lg leading-relaxed">
                JFT-Basic পরীক্ষায় ২০০+ নম্বর অর্জনের জন্য বই নির্বাচন করুন এবং অডিও ও বাংলা অর্থসহ প্রতিটি লেসন অনুশীলন করুন।
              </p>
            </div>
            <div className="absolute -right-6 -bottom-8 text-white/5 text-9xl font-bold select-none pointer-events-none">
              日本
            </div>
          </div>

          {/* Book List Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>পাঠ্যবই নির্বাচন করুন (Select Book)</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">৩টি খণ্ড</span>
            </div>

            <div className="grid gap-4">
              {booksData.map((book) => {
                const progress = getBookProgress(book);
                return (
                  <div
                    key={book.id}
                    onClick={() => openBook(book.id)}
                    className="group bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {/* Book Cover Badge */}
                        <div
                          className={`w-14 h-16 rounded-xl bg-gradient-to-br ${book.themeColor} text-white flex flex-col items-center justify-center shrink-0 shadow-sm`}
                        >
                          <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">
                            Irodori
                          </span>
                          <span className="text-lg font-bold">
                            {book.id === 'starter' ? 'A1' : 'A2'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${book.badgeColor}`}>
                            {book.level}
                          </span>
                          <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                            {book.title}
                          </h4>
                          <p className="text-xs font-medium text-slate-500">{book.jpTitle}</p>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0 mt-2">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                      {book.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
                          <span>অগ্রগতি ({progress.done}/{progress.total} Can-do)</span>
                          <span className="text-indigo-600 font-semibold">{progress.percent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${book.themeColor} transition-all duration-500`}
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                        মোট {book.totalLessons} পাঠ
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {/* =========================================================
          PAGE 2: LESSON LIST PAGE
         ========================================================= */}
      {view === 'lessons' && currentBook && (
        <main className="max-w-3xl mx-auto px-4 pt-5 space-y-5">
          {/* Book Header Summary */}
          <div className={`bg-gradient-to-r ${currentBook.themeColor} rounded-2xl p-5 text-white shadow-md`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/80">{currentBook.level}</p>
                <h2 className="text-xl font-bold mt-0.5">{currentBook.title}</h2>
                <p className="text-sm text-white/90">{currentBook.jpTitle}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{getBookProgress(currentBook).percent}%</span>
                <p className="text-[11px] text-white/80">সম্পন্ন হয়েছে</p>
              </div>
            </div>
          </div>

          {/* Lesson Cards */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700 px-1">
              লেসন তালিকা (Lesson List)
            </h3>

            <div className="grid gap-3">
              {currentBook.lessons.map((lesson) => {
                const status = getLessonProgress(lesson);
                return (
                  <div
                    key={lesson.id}
                    onClick={() => openLesson(lesson.id)}
                    className="group bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Lesson Number Circle */}
                      <div
                        className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold ${
                          status.isComplete
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors'
                        }`}
                      >
                        <span className="text-[9px] uppercase tracking-wider opacity-75">課</span>
                        <span className="text-base leading-none">{lesson.lessonNumber}</span>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-indigo-600 truncate">
                          {lesson.topic}
                        </p>
                        <h4 className="text-base font-bold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                          {lesson.title}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">{lesson.titleBn}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          status.isComplete
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {status.done}/{status.total}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-800 leading-relaxed">
              💡 <strong>টিপস:</strong> বাকি লেসনগুলো যুক্ত করতে <code>src/data/books_data.json</code> ফাইলে একই ফরম্যাটে নতুন লেসনের ডেটা যোগ করুন।
            </div>
          </div>
        </main>
      )}

      {/* =========================================================
          PAGE 3: LESSON STUDY PAGE
         ========================================================= */}
      {view === 'study' && currentLesson && (
        <main className="max-w-3xl mx-auto px-4 pt-5 space-y-5">
          {/* Lesson Hero & Can-Do Card */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/90 space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                  第{currentLesson.lessonNumber}課 • {currentLesson.topic}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {getLessonProgress(currentLesson).done}/{getLessonProgress(currentLesson).total} সম্পন্ন
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-2.5">{currentLesson.title}</h2>
              <p className="text-sm text-slate-500">{currentLesson.titleBn}</p>
            </div>

            {/* Interactive Can-do Checklist */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Can-do লক্ষ্য (নিজেকে যাচাই করুন)
              </h3>
              <ul className="space-y-2.5">
                {currentLesson.canDos.map((item, idx) => {
                  const isChecked = !!completedCanDos[`${currentLesson.id}-${idx}`];
                  return (
                    <li
                      key={idx}
                      onClick={() => toggleCanDo(currentLesson.id, idx)}
                      className="flex items-start gap-2.5 text-sm cursor-pointer select-none group"
                    >
                      {isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 shrink-0 mt-0.5" />
                      )}
                      <span className={isChecked ? 'line-through text-slate-400' : 'text-slate-700'}>
                        {item}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* Segmented Navigation Tabs (Kanji separated into dedicated tab) */}
          <nav className="grid grid-cols-4 gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl text-xs font-semibold sticky top-16 z-10 backdrop-blur-sm">
            {[
              { id: 'dialogue', label: 'কথোপকথন', icon: Headphones },
              { id: 'vocab', label: 'শব্দভান্ডার', icon: BookMarked },
              { id: 'grammar', label: 'গ্রামার', icon: FileText },
              { id: 'kanji', label: 'কাঞ্জি', icon: Languages },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-xl transition-all ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* TAB 1: DIALOGUE & LISTENING */}
          {activeTab === 'dialogue' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">
                  অডিও শুনে শ্যাডোয়িং অনুশীলন করুন
                </p>
                <button
                  onClick={() => setHideScript(!hideScript)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition ${
                    hideScript
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                >
                  {hideScript ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{hideScript ? 'স্ক্রিপ্ট দেখুন' : 'স্ক্রিপ্ট লুকান'}</span>
                </button>
              </div>

              {currentLesson.dialogues.map((dlg) => (
                <div key={dlg.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/90 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                    <h3 className="font-bold text-sm text-slate-800">{dlg.title}</h3>
                  </div>
                  
                  <AudioPlayer src={dlg.audio} />
                  
                  {!hideScript ? (
                    <div className="space-y-2.5 pt-3 border-t border-slate-100">
                      {dlg.lines.map((line, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                            <span className="inline-block text-xs font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded mr-2">
                              {line.speaker}
                            </span>
                            {line.jp}
                          </p>
                          <p className="text-xs text-slate-600 mt-1.5 pl-1">{line.bn}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-6 text-center border border-dashed border-slate-200">
                      <p className="text-xs text-slate-500">
                        লিসেনিং টেস্ট মোড চালু আছে। অডিও শুনে বোঝার চেষ্টা করুন!
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* TAB 2: VOCABULARY */}
          {activeTab === 'vocab' && (
            <section className="grid gap-3">
              {currentLesson.vocabulary.map((word, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/90 flex items-center justify-between gap-4 hover:border-indigo-200 transition"
                >
                  <div>
                    <p className="text-xs font-medium text-indigo-600">{word.kana}</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{word.jp}</p>
                    <p className="text-sm text-slate-600 mt-0.5">{word.bn}</p>
                  </div>
                  <AudioPlayer src={word.audio} compact />
                </div>
              ))}
            </section>
          )}

          {/* TAB 3: GRAMMAR NOTES */}
          {activeTab === 'grammar' && (
            <section className="space-y-3.5">
              {currentLesson.grammar.map((g, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/90 space-y-3">
                  <div className="inline-block bg-indigo-50 text-indigo-700 font-bold text-sm px-3 py-1 rounded-lg">
                    {g.pattern}
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border-l-4 border-indigo-500">
                    <p className="text-sm font-semibold text-slate-900">{g.example}</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{g.meaningBn}</p>
                </div>
              ))}
            </section>
          )}

          {/* TAB 4: DEDICATED KANJI SECTION */}
          {activeTab === 'kanji' && (
            <section className="space-y-3">
              <p className="text-xs text-slate-500 px-1">
                এই পাঠের গুরুত্বপূর্ণ কাঞ্জি ও পাঠ (Reading):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {currentLesson.kanji.map((k, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/90 text-center flex flex-col items-center justify-center space-y-1.5 hover:border-indigo-300 transition"
                  >
                    <p className="text-3xl font-bold text-slate-900 tracking-wide">{k.char}</p>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      {k.reading}
                    </span>
                    <p className="text-xs text-slate-600 font-medium pt-0.5">{k.bn}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  );
}
