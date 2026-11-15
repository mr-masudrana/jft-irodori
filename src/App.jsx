import React, { useState, useEffect } from 'react';
import lessonsData from './data/elem1_lessons.json';
import AudioPlayer from './components/AudioPlayer';

export default function App() {
  const [selectedLesson, setSelectedLesson] = useState(lessonsData[0]);
  const [activeTab, setActiveTab] = useState('dialogue');
  const [hideScript, setHideScript] = useState(false);
  const [completedCanDos, setCompletedCanDos] = useState(() => {
    try {
      const saved = localStorage.getItem('jft_candos');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('jft_candos', JSON.stringify(completedCanDos));
  }, [completedCanDos]);

  const toggleCanDo = (index) => {
    const key = `${selectedLesson.id}-${index}`;
    setCompletedCanDos((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      {/* Header */}
      <header className="bg-indigo-700 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-lg font-bold">Irodori JFT-Basic Prep</h1>
            <p className="text-xs text-indigo-200">{selectedLesson.book} • Lesson {selectedLesson.lessonNumber}</p>
          </div>
          <select
            className="w-full sm:w-auto bg-indigo-800 text-white text-xs p-2 rounded border border-indigo-500"
            value={selectedLesson.id}
            onChange={(e) => setSelectedLesson(lessonsData.find((l) => l.id === e.target.value))}
          >
            {lessonsData.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                Lesson {lesson.lessonNumber}: {lesson.title}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-5">
        {/* Lesson Title & Can-Do Checklist */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
            {selectedLesson.topic}
          </span>
          <h2 className="text-xl font-bold mt-2">{selectedLesson.title}</h2>
          <p className="text-sm text-slate-500 mb-3">{selectedLesson.titleBn}</p>

          <div className="border-t pt-3">
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Can-do লক্ষ্য (Self-Check)</h3>
            <ul className="space-y-2">
              {selectedLesson.canDos.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!completedCanDos[`${selectedLesson.id}-${idx}`]}
                    onChange={() => toggleCanDo(idx)}
                    className="mt-1 accent-indigo-600"
                  />
                  <span className={completedCanDos[`${selectedLesson.id}-${idx}`] ? 'line-through text-slate-400' : ''}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Navigation Tabs */}
        <nav className="grid grid-cols-4 gap-1 bg-slate-200 p-1 rounded-xl text-xs font-semibold">
          {[
            { id: 'dialogue', label: '🎧 কথোপকথন' },
            { id: 'vocab', label: '📖 শব্দভান্ডার' },
            { id: 'grammar', label: '📝 গ্রামার' },
            { id: 'kanji', label: '🈳 কাঞ্জি' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 rounded-lg transition ${
                activeTab === tab.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab 1: Dialogue & Listening */}
        {activeTab === 'dialogue' && (
          <section className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setHideScript(!hideScript)}
                className="text-xs px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 font-medium"
              >
                {hideScript ? '👁️ স্ক্রিপ্ট দেখুন' : '🙈 লিসেনিং টেস্টের জন্য স্ক্রিপ্ট লুকান'}
              </button>
            </div>

            {selectedLesson.dialogues.map((dlg) => (
              <div key={dlg.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
                <h3 className="font-bold text-sm text-slate-700">{dlg.title}</h3>
                <AudioPlayer src={dlg.audio} />
                
                {!hideScript ? (
                  <div className="space-y-2 pt-2 border-t">
                    {dlg.lines.map((line, i) => (
                      <div key={i} className="p-2 rounded bg-slate-50">
                        <p className="text-sm font-medium text-slate-900">
                          <span className="font-bold text-indigo-600 mr-2">{line.speaker}:</span>
                          {line.jp}
                        </p>
                        <p className="text-xs text-slate-500 ml-5">{line.bn}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-center text-slate-400 py-6 italic">
                    অডিও শুনে বোঝার চেষ্টা করুন। প্রয়োজনে উপরে ক্লিক করে স্ক্রিপ্ট দেখুন।
                  </p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Tab 2: Vocabulary */}
        {activeTab === 'vocab' && (
          <section className="grid gap-3">
            {selectedLesson.vocabulary.map((word, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-xs text-indigo-600">{word.kana}</p>
                  <p className="text-base font-bold">{word.jp}</p>
                  <p className="text-sm text-slate-600">{word.bn}</p>
                </div>
                <AudioPlayer src={word.audio} />
              </div>
            ))}
          </section>
        )}

        {/* Tab 3: Grammar Notes */}
        {activeTab === 'grammar' && (
          <section className="space-y-3">
            {selectedLesson.grammar.map((g, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-2">
                <h3 className="font-bold text-indigo-700 text-base">{g.pattern}</h3>
                <p className="text-sm bg-slate-50 p-2 rounded border-l-4 border-indigo-500 font-medium">{g.example}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{g.meaningBn}</p>
              </div>
            ))}
          </section>
        )}

        {/* Tab 4: Dedicated Kanji Practice */}
        {activeTab === 'kanji' && (
          <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {selectedLesson.kanji.map((k, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center space-y-1">
                <p className="text-2xl font-bold text-slate-900">{k.char}</p>
                <p className="text-xs text-indigo-600 font-medium">{k.reading}</p>
                <p className="text-xs text-slate-500">{k.bn}</p>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
