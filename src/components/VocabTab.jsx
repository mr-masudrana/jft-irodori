import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import booksData from '../data/books';
import AudioPlayer from './AudioPlayer';
import { cards } from '../lib/store';

const PAGE = 50;

// সব লেসনের শব্দ একসাথে: সার্চ + বই/লেসন ফিল্টার
export default function VocabTab() {
  const [q, setQ] = useState('');
  const [bookId, setBookId] = useState(null);
  const [lessonId, setLessonId] = useState(null);
  const [limit, setLimit] = useState(PAGE);

  const book = booksData.find((b) => b.id === bookId);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return cards.filter((c) => {
      if (book && c.book !== book.title) return false;
      if (lessonId && c.lessonId !== lessonId) return false;
      if (!t) return true;
      return [c.jp, c.kana, c.bn].some((v) => (v || '').toLowerCase().includes(t));
    });
  }, [q, book, lessonId]);

  const pickBook = (id) => { setBookId(id); setLessonId(null); setLimit(PAGE); };
  const pickLesson = (id) => { setLessonId(id); setLimit(PAGE); };

  const chip = (on) => `shrink-0 px-3.5 py-2 rounded-full text-[13px] font-semibold border transition ${
    on ? 'btn-p !border-transparent' : 'btn-g'
  }`;

  return (
    <div className="space-y-3 view">
      <div
        className="sticky z-10 -mx-4 px-4 pt-1 pb-2 space-y-2.5 backdrop-blur-lg"
        style={{ top: 'calc(56px + env(safe-area-inset-top))', background: 'color-mix(in srgb, var(--bg) 88%, transparent)' }}
      >
        <div className="relative">
          <Search className="w-4 h-4 t-mu absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }}
            placeholder="জাপানিজ, কানা বা বাংলা অর্থ খুঁজুন..."
            className="input-box"
            inputMode="search"
            aria-label="শব্দ খুঁজুন"
          />
          {q && (
            <button onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 t-mu p-2" aria-label="সার্চ মুছুন">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => pickBook(null)} className={chip(!bookId)}>সব বই</button>
          {booksData.map((b) => (
            <button key={b.id} onClick={() => pickBook(b.id)} className={chip(bookId === b.id)}>{b.title}</button>
          ))}
        </div>

        {book && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button onClick={() => pickLesson(null)} className={chip(!lessonId)}>সব লেসন</button>
            {book.lessons.map((l) => (
              <button key={l.id} onClick={() => pickLesson(l.id)} className={chip(lessonId === l.id)}>L{l.lessonNumber}</button>
            ))}
          </div>
        )}
      </div>

      <p className="t-mu text-xs px-1 tabular-nums">{list.length}টি শব্দ</p>

      {list.length === 0 ? (
        <div className="card text-center py-10 space-y-2">
          <div className="hanko w-12 h-12 text-xl mx-auto">無</div>
          <p className="font-bold text-sm">কোনো শব্দ পাওয়া যায়নি</p>
          <p className="t-mu text-xs">অন্য বানানে খুঁজুন, অথবা ফিল্টার বদলান।</p>
        </div>
      ) : (
        <>
          {list.slice(0, limit).map((c) => (
            <div key={c.id} className="card flex items-center justify-between gap-3 !py-3.5">
              <div className="min-w-0">
                {c.kana && c.kana !== c.jp && <p className="t-br text-xs font-semibold jp">{c.kana}</p>}
                <p className="text-xl jp-display mt-0.5">{c.jp}</p>
                <p className="text-sm mt-0.5">{c.bn}</p>
                <p className="t-mu text-[11px] mt-1">{c.book} • Lesson {c.lessonNo}</p>
              </div>
              <AudioPlayer key={c.id} text={c.kana || c.jp} compact />
            </div>
          ))}
          {list.length > limit && (
            <button onClick={() => setLimit((n) => n + PAGE)} className="btn btn-g w-full">
              আরও দেখান ({list.length - limit}টি বাকি)
            </button>
          )}
        </>
      )}
    </div>
  );
}
