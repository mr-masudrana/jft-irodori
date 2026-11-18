import React, { useState, useEffect } from 'react';
import {
  Home, BookOpen, Repeat, ClipboardCheck, BarChart3, ArrowLeft, Flame, Star, ChevronRight,
  CheckCircle2, Circle, Eye, EyeOff, Brain, PenLine, Sun, Moon, Search, Sparkles, Trophy, X, Play, Languages, LayoutGrid, Palette, Info,
} from 'lucide-react';
import booksData from './data/books';
import AudioPlayer from './components/AudioPlayer';
import MockTest from './components/MockTest';
import Offline from './components/Offline';
import VocabTab from './components/VocabTab';
import { Review, Quiz } from './components/Review';
import { useStore, addXp, liveStreak, cards, isDue, dayNum, DAILY_GOAL, todayXp, setResume, speakJa } from './lib/store';

const TABS = [
  ['home', Home, 'হোম'],
  ['vocab', Languages, 'ভোকাবুলারি'],
  ['review', Repeat, 'রিভিউ'],
  ['exam', ClipboardCheck, 'মক টেস্ট'],
  ['more', LayoutGrid, 'মোর'],
];

// 'study' = হোমে বই-ভিত্তিক ভোকাবুলারি/গ্রামার/কান্জি → লেসন তালিকা; 'books' = লেসন পেজ; 'progress' = মোর-এর ভেতরের পেজ
const TAB_IDS = ['home', 'vocab', 'review', 'exam', 'more', 'study', 'books', 'progress'];
const ROOT_TABS = ['home', 'vocab', 'review', 'exam', 'more'];
const NAV_OF = { study: 'home', books: 'home', progress: 'more' };
const CATS = {
  vocab: { label: 'ভোকাবুলারি', glyph: '語' },
  grammar: { label: 'গ্রামার', glyph: '文' },
  kanji: { label: 'কান্জি', glyph: '漢' },
};
const SPEAKER_STYLES = [
  'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300',
  'bg-rose-500/10 text-rose-600 dark:text-rose-300',
  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  'bg-amber-500/10 text-amber-700 dark:text-amber-300',
];
const BN_DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];

// URL hash <-> স্টেট: রিফ্রেশ করলে একই পেজে ফিরে আসে, ফোনের ব্যাক বাটন ধাপে ধাপে পেছনে যায়
function parseHash() {
  const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const tab = TAB_IDS.includes(p[0]) ? p[0] : 'home';
  const r = { tab, bookId: null, lessonId: null, sec: null, mode: null, cat: null };
  if (tab === 'study') { r.cat = CATS[p[1]] ? p[1] : 'vocab'; r.bookId = p[2] || null; }
  if (tab === 'books') {
    r.bookId = p[1] || null;
    r.lessonId = r.bookId ? p[2] || null : null;
    const x = r.lessonId ? p[3] : null;
    if (x === 'quiz' || x === 'review') r.mode = x;
    else if (/^a\d+$/.test(x || '')) r.sec = Number(x.slice(1));
    else if (['vocab', 'grammar', 'kanji', 'dialogues', 'tips', 'hiragana', 'katakana'].includes(x)) r.sec = x;
  }
  return r;
}

const toHash = ({ tab, bookId, lessonId, sec, mode, cat }) => {
  const seg = tab === 'books'
    ? [bookId, bookId && lessonId, bookId && lessonId && (mode || (sec === null ? null : typeof sec === 'number' ? `a${sec}` : sec))]
    : tab === 'study' ? [cat, bookId] : [];
  return '#/' + [tab, ...seg].filter((x) => x !== null && x !== undefined && x !== false && x !== '').map(encodeURIComponent).join('/');
};
const depth = () => window.history.state?.n || 0;
const kanaCount = (h) => (h ? h.charts.reduce((n, c) => n + c.rows.reduce((m, r) => m + r.cells.filter(Boolean).length, 0), 0) : 0);
const greet = () => { const h = new Date().getHours(); return h < 11 ? 'おはよう' : h < 18 ? 'こんにちは' : 'こんばんは'; };

// দৈনিক XP লক্ষ্যের রিং
function Ring({ value, goal, size = 70 }) {
  const r = 29, c = 2 * Math.PI * r, p = Math.min(1, value / goal);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`আজকের লক্ষ্য ${value}/${goal} XP`}>
      <svg viewBox="0 0 70 70" width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="35" cy="35" r={r} fill="none" stroke="rgb(255 255 255 / 0.2)" strokeWidth="6" />
        <circle
          cx="35" cy="35" r={r} fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - p)}
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        <div>
          <b className="text-base tabular-nums">{Math.min(value, goal)}</b>
          <span className="block text-[9.5px] opacity-80 mt-0.5">/{goal} XP</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [state, update] = useStore();
  const [init] = useState(parseHash);
  const [tab, setTab] = useState(init.tab);
  const [bookId, setBookId] = useState(init.bookId);
  const [lessonId, setLessonId] = useState(init.lessonId);
  const [mode, setMode] = useState(init.mode);
  const [hide, setHide] = useState(false);
  const [sec, setSec] = useState(init.sec);
  const [cat, setCat] = useState(init.cat);
  const [q, setQ] = useState('');
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('jft-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b0f1f' : '#f3f5fa');
    localStorage.setItem('jft-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => { setQ(''); }, [sec, lessonId]);

  const book = booksData.find((b) => b.id === bookId);
  const lesson = book?.lessons.find((l) => l.id === lessonId);

  const first = React.useRef(true);
  useEffect(() => {
    const h = toHash({ tab, bookId, lessonId, sec, mode, cat });
    if (first.current) {
      first.current = false;
      if (location.hash !== h) window.history.replaceState({ n: depth() }, '', h);
    } else if (location.hash !== h) {
      window.history.pushState({ n: depth() + 1 }, '', h);
    }
  }, [tab, bookId, lessonId, sec, mode, cat]);

  useEffect(() => {
    const onPop = () => {
      const r = parseHash();
      setTab(r.tab); setBookId(r.bookId); setLessonId(r.lessonId); setSec(r.sec); setMode(r.mode); setCat(r.cat);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const st = state.stats;
  const due = cards.filter((c) => isDue(state, c)).length;
  const top = () => window.scrollTo({ top: 0 });
  const go = (t) => { setTab(t); setBookId(null); setLessonId(null); setSec(null); setMode(null); setCat(null); top(); };
  const openStudy = (c, bId) => { setTab('study'); setCat(c); setBookId(bId || null); setLessonId(null); setSec(null); setMode(null); top(); };
  const openBook = (id) => { setTab('books'); setBookId(id); setLessonId(null); setSec(null); setMode(null); setCat(null); top(); };
  const openLesson = (bId, lId) => {
    setTab('books'); setBookId(bId); setLessonId(lId); setSec(null); setMode(null); setCat(null); setHide(false);
    update((s) => setResume(s, bId, lId));
    top();
  };
  const back = () => {
    if (depth() > 0) { window.history.back(); return; }
    if (tab === 'study') go('home');
    else if (mode) setMode(null);
    else if (sec !== null) setSec(null);
    else if (lessonId) setLessonId(null);
    else if (bookId) setBookId(null);
    else go('home');
    top();
  };

  const toggle = (k) => update((s) => ({ ...s, canDos: { ...s.canDos, [k]: !s.canDos[k] } }));
  const bookPct = (b) => {
    let t = 0, d = 0;
    b.lessons.forEach((l) => l.activities.forEach((_, i) => { t++; if (state.canDos[`${l.id}-${i}`]) d++; }));
    return t ? Math.round((d / t) * 100) : 0;
  };
  const lessonDone = (l) => l.activities.filter((_, i) => state.canDos[`${l.id}-${i}`]).length;

  const title = tab === 'home' ? 'Irodori JFT-Basic'
    : tab === 'vocab' ? 'ভোকাবুলারি'
    : tab === 'more' ? 'মোর'
    : tab === 'study' ? `${book ? book.title + ' • ' : ''}${CATS[cat]?.label || 'লেসন'}`
    : tab === 'review' ? 'আজকের রিভিউ'
    : tab === 'exam' ? 'JFT Mock Exam'
    : tab === 'progress' ? 'প্রগ্রেস ও স্ট্যাটস'
    : mode === 'quiz' ? 'শব্দ কুইজ'
    : mode === 'review' ? 'লেসন ফ্ল্যাশকার্ড'
    : lesson ? (
      sec === null ? `Lesson ${lesson.lessonNumber}`
      : typeof sec === 'number' ? `L${lesson.lessonNumber} • অ্যাক্টিভিটি ${sec + 1}`
      : { vocab: 'ভোকাবুলারি', grammar: 'গ্রামার', kanji: 'কান্জি', dialogues: 'কথোপকথন', tips: 'জাপানে জীবনের টিপস', hiragana: 'হিরাগানা চার্ট', katakana: 'কাতাকানা চার্ট' }[sec]
    )
    : book ? book.title : 'Irodori বইসমূহ';

  const BookList = () => (
    <div className="grid gap-3">
      {booksData.map((b) => {
        const pct = bookPct(b);
        return (
          <div key={b.id} onClick={() => openBook(b.id)} className="card card-tap">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl text-white grid place-items-center font-extrabold text-base shadow-sm shrink-0 ${b.iconBg}`}>
                {b.id === 'starter' ? 'A1' : 'A2'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-base">{b.title}</p>
                  <span className="chip">{b.level}</span>
                </div>
                <p className="t-mu text-xs mt-0.5 jp">{b.jpTitle} • {b.lessons.length}/{b.totalLessons} লেসন</p>
              </div>
              <ChevronRight className="w-5 h-5 t-mu shrink-0" />
            </div>
            <div className="flex items-center gap-3 mt-3.5">
              <div className="bar flex-1"><i style={{ width: `${pct}%` }} /></div>
              <span className="t-br text-xs font-extrabold tabular-nums">{pct}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const Dialogues = (list) => list.map((d) => {
    const speakers = [];
    return (
      <div key={d.id} className="card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-sm jp">{d.title}</h3>
          <span className="chip">🎧 অডিও</span>
        </div>
        <AudioPlayer src={d.audio} text={d.lines.map((l) => l.jp).join(' ')} />
        {!hide && (
          <div className="space-y-2 pt-1">
            {d.lines.map((l, i) => {
              let sIdx = speakers.indexOf(l.speaker);
              if (sIdx === -1) { speakers.push(l.speaker); sIdx = speakers.length - 1; }
              const badgeCls = SPEAKER_STYLES[sIdx % SPEAKER_STYLES.length];
              return (
                <div key={i} className="rounded-2xl p-3 border" style={{ background: 'var(--sf2)', borderColor: 'var(--ln)' }}>
                  <div className="flex items-start gap-2.5">
                    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold shrink-0 mt-0.5 jp ${badgeCls}`}>
                      {l.speaker}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold jp leading-relaxed">{l.jp}</p>
                      <p className="t-mu text-xs mt-1 leading-relaxed">{l.bn}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  });

  const HideBtn = () => (
    <div className="flex justify-end">
      <button onClick={() => setHide(!hide)} className="btn btn-g !py-2 !min-h-[40px] !px-3.5 text-xs">
        {hide ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        {hide ? 'স্ক্রিপ্ট দেখুন' : 'স্ক্রিপ্ট লুকান'}
      </button>
    </div>
  );

  const Empty = () => (
    <div className="card t-mu text-sm text-center py-8">
      এই অংশে এখনো কনটেন্ট যুক্ত করা হয়নি।
    </div>
  );

  // স্তর ৩: লেসন ভিউ
  const LessonView = () => {
    const doneAct = lessonDone(lesson);
    const totalAct = lesson.activities.length;
    const pct = totalAct ? Math.round((doneAct / totalAct) * 100) : 0;
    // ফাঁকা সেকশন (যেমন লেসন ১-২-এ গ্রামার ও কান্জি নেই) দেখানো হয় না
    const rows = [
      ['dialogues', '🎧', 'কথোপকথন', lesson.dialogues.length],
      ['vocab', '📚', lesson.script ? `ভোকাবুলারি (${lesson.script})` : 'ভোকাবুলারি', lesson.vocabulary.length],
      ['hiragana', 'あ', 'হিরাগানা চার্ট', kanaCount(lesson.hiragana)],
      ['katakana', 'カ', 'কাতাকানা চার্ট', kanaCount(lesson.katakana)],
      ['grammar', '🧩', 'গ্রামার', lesson.grammar.length],
      ['kanji', '🈶', 'কান্জি', lesson.kanji.length],
      ['tips', '💡', 'জাপানে জীবনের টিপস', (lesson.tips || []).length],
    ].filter((r) => r[3] > 0);

    return (
      <div className="space-y-5 view">
        <div className="card space-y-4">
          <div className="space-y-1">
            {lesson.topic && <span className="chip">{lesson.topic}</span>}
            <h2 className="text-xl font-extrabold leading-snug pt-1">{lesson.title}</h2>
            <p className="t-mu text-sm">{lesson.titleBn}</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="t-mu">অ্যাক্টিভিটি অগ্রগতি</span>
              <span className="t-br tabular-nums">{doneAct}/{totalAct} ({pct}%)</span>
            </div>
            <div className="bar"><i style={{ width: `${pct}%` }} /></div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              disabled={!lesson.vocabulary.length}
              className="btn btn-p disabled:opacity-40"
              onClick={() => { setMode('review'); top(); }}
            >
              <Brain className="w-4 h-4" /> ফ্ল্যাশকার্ড
            </button>
            <button
              disabled={!lesson.vocabulary.length}
              className="btn btn-g disabled:opacity-40"
              onClick={() => { setMode('quiz'); top(); }}
            >
              <PenLine className="w-4 h-4" /> শব্দ কুইজ
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <h3 className="text-[13px] font-semibold t-mu px-1">স্টাডি ম্যাটেরিয়াল</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {rows.map(([id, e, label, n]) => (
              <div key={id} onClick={() => { setSec(id); top(); }} className="card card-tap flex items-center gap-3 !p-3.5">
                <span className="text-2xl">{e}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">{label}</p>
                  <p className="t-mu text-xs tabular-nums">{n}টি আইটেম</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <h3 className="text-[13px] font-semibold t-mu px-1">টপিক ও Can-Do অ্যাক্টিভিটি</h3>
          {lesson.activities.map((a, i) => {
            const on = !!state.canDos[`${lesson.id}-${i}`];
            return (
              <div key={i} onClick={() => { setSec(i); top(); }} className="card card-tap flex items-center gap-3.5">
                {on ? (
                  <div className="hanko pop w-10 h-10 text-base" aria-label="সম্পন্ন">済</div>
                ) : (
                  <div className="w-10 h-10 rounded-xl grid place-items-center font-bold shrink-0 chip-b">{a.no}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm jp">{a.title}</p>
                  {a.canDo && <p className="t-mu text-xs line-clamp-2 mt-0.5">{a.canDo}</p>}
                </div>
                {a.dialogues.length > 0 && <span className="chip shrink-0">🎧 {a.dialogues.length}</span>}
                <ChevronRight className="w-4 h-4 t-mu shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // স্তর ৪: বিস্তারিত সেকশন
  // বাক্য/শব্দের সারি: জাপানিজ + রোমাজি + বাংলা + অডিও
  const WordRow = (w, i) => (
    <div key={i} className="flex items-center justify-between gap-3 py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--ln)' }}>
      <div className="min-w-0">
        <p className="text-lg jp-display leading-tight">{w.jp}</p>
        {w.romaji && <p className="t-br text-xs font-semibold mt-0.5">{w.romaji}</p>}
        {w.bn && <p className="text-sm mt-0.5">{w.bn}</p>}
        {w.note && <p className="t-mu text-[11px] mt-0.5">{w.note}</p>}
      </div>
      <AudioPlayer key={`${w.jp}-${i}`} text={w.jp.replace(/[（）()]/g, '')} compact />
    </div>
  );

  const KanaChart = (c, ci) => (
    <div key={ci} className="card space-y-2.5">
      <p className="font-bold text-sm">{c.title}</p>
      {c.note && <p className="t-mu text-xs leading-relaxed">{c.note}</p>}
      <div className="grid gap-1" style={{ gridTemplateColumns: `22px repeat(${c.cols.length}, minmax(0, 1fr))` }}>
        <span />
        {c.cols.map((h) => <span key={h} className="text-center text-[11px] font-bold t-mu">{h}</span>)}
        {c.rows.map((r, ri) => (
          <React.Fragment key={ri}>
            <span className="grid place-items-center text-[11px] font-bold t-br">{r.row}</span>
            {r.cells.map((x, xi) => (x ? (
              <button
                key={xi} onClick={() => speakJa(x[0])} aria-label={`${x[0]} ${x[1]}`}
                className="rounded-xl py-1.5 text-center active:scale-95 transition" style={{ background: 'var(--sf2)' }}
              >
                <span className={`block jp-display leading-none ${c.cols.length > 5 ? 'text-base' : 'text-xl'}`}>{x[0]}</span>
                <span className="block text-[10px] t-mu mt-1">{x[1]}</span>
              </button>
            ) : <span key={xi} />))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const Hiragana = (h) => (
    <div className="space-y-4">
      <div className="card flex items-center gap-3.5">
        <div className="hanko w-12 h-12 text-xl">{h.glyph || 'あ'}</div>
        <div className="min-w-0">
          <p className="font-bold">{h.name || 'ひらがな — হিরাগানা'}</p>
          <p className="t-mu text-xs mt-0.5">{h.intro ? `${h.intro} ` : ''}যেকোনো বর্ণে ট্যাপ করলে উচ্চারণ শুনতে পাবেন</p>
        </div>
      </div>
      {h.charts.map(KanaChart)}
      <div className="card">
        <p className="font-bold text-sm">দীর্ঘ স্বর (のばす音)</p>
        <p className="t-mu text-xs leading-relaxed mt-1 mb-1">{h.longVowelNote}</p>
        {h.longVowels.map(WordRow)}
      </div>
      <div className="card">
        <p className="font-bold text-sm">দ্বিত্ব ব্যঞ্জন (つまる音)</p>
        <p className="t-mu text-xs leading-relaxed mt-1 mb-1">{h.longConsonantNote}</p>
        {h.longConsonants.map(WordRow)}
      </div>
      <div className="card">
        <p className="font-bold text-sm">{h.practiceTitle || 'হিরাগানায় লেখা শব্দ পড়ুন'}</p>
        {h.practice.map(WordRow)}
      </div>
      <div className="card space-y-2">
        <p className="font-bold text-sm">কিবোর্ড/স্মার্টফোনে জাপানি লেখা (ローマ字入力)</p>
        {h.inputTips.map((t, i) => <p key={i} className="t-mu text-[13px] leading-relaxed">• {t}</p>)}
      </div>
    </div>
  );

  const SectionView = () => {
    if (typeof sec === 'number') {
      const a = lesson.activities[sec];
      if (!a) return <div className="view">{Empty()}</div>;
      const k = `${lesson.id}-${sec}`, on = !!state.canDos[k];
      return (
        <div className="space-y-3.5 view">
          <div
            onClick={() => toggle(k)}
            className="card cursor-pointer select-none border-2"
            style={on ? { borderColor: 'color-mix(in srgb, var(--shu) 45%, var(--ln))' } : undefined}
            role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(k); } }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="chip">অ্যাক্টিভিটি {a.no}</span>
                <p className="font-bold text-base jp pt-1">{a.title}</p>
              </div>
              {on ? <div className="hanko pop w-11 h-11 text-lg" aria-label="সম্পন্ন">済</div> : <Circle className="w-7 h-7 t-mu shrink-0" />}
            </div>
            {a.canDo && <p className="text-[13px] mt-2.5 leading-relaxed t-mu">{a.canDo}</p>}
            <p className={`text-[11.5px] mt-2 font-semibold ${on ? 't-shu' : 't-br'}`}>
              {on ? 'সম্পন্ন — আবার ট্যাপ করলে চিহ্ন সরে যাবে' : 'শেষ হলে এখানে ট্যাপ করে সম্পন্ন করুন'}
            </p>
          </div>
          {a.numbers?.length > 0 && (
            <div className="card space-y-2.5">
              <p className="font-bold text-sm">সংখ্যা (০–১০) — ট্যাপ করে শুনুন</p>
              <div className="grid grid-cols-4 gap-2">
                {a.numbers.map((x) => (
                  <button
                    key={x.n} onClick={() => speakJa(x.jp)} aria-label={`${x.n} ${x.jp}`}
                    className="rounded-xl py-2 text-center active:scale-95 transition" style={{ background: 'var(--sf2)' }}
                  >
                    <span className="block text-lg font-extrabold tabular-nums t-br leading-none">{x.n}</span>
                    <span className="block text-base jp-display mt-1 leading-none">{x.jp}</span>
                    <span className="block text-[10px] t-mu mt-1">{x.romaji}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {a.phrases?.length > 0 && (
            <div className="card">
              <p className="font-bold text-sm mb-1">মূল বাক্য ও শব্দ</p>
              {a.phrases.map(WordRow)}
            </div>
          )}
          {a.dialogues.length ? (<>{HideBtn()}{Dialogues(a.dialogues)}</>) : (a.phrases?.length ? null : Empty())}
        </div>
      );
    }

    const list = lesson[sec] || [];
    const filteredVocab = sec === 'vocab' && q.trim()
      ? list.filter((w) =>
          [w.jp, w.kana, w.bn].some((v) => (v || '').toLowerCase().includes(q.trim().toLowerCase()))
        )
      : list;

    return (
      <div className="space-y-3 view">
        {!list.length && Empty()}
        {sec === 'dialogues' && list.length > 0 && (<>{HideBtn()}{Dialogues(list)}</>)}

        {sec === 'vocab' && list.length > 0 && (
          <>
            <div className="relative">
              <Search className="w-4 h-4 t-mu absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="শব্দ, কানা বা বাংলা অর্থ খুঁজুন..."
                className="input-box"
              />
              {q && (
                <button
                  onClick={() => setQ('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 t-mu p-1"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {filteredVocab.length === 0 ? (
              <div className="card text-center text-sm t-mu py-8">কোনো শব্দ খুঁজে পাওয়া যায়নি।</div>
            ) : (
              filteredVocab.map((w, i) => (
                <div key={i} className="card flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    {w.kana && w.kana !== w.jp && <p className="t-br text-xs font-semibold jp">{w.kana}</p>}
                    <p className="text-xl jp-display mt-0.5">{w.jp}</p>
                    <p className="t-mu text-xs mt-0.5">{w.bn}</p>
                  </div>
                  <AudioPlayer key={`${lesson.id}-v-${w.jp}-${i}`} src={w.audio} text={w.kana || w.jp} compact />
                </div>
              ))
            )}
          </>
        )}

        {sec === 'hiragana' && lesson.hiragana && Hiragana(lesson.hiragana)}
        {sec === 'katakana' && lesson.katakana && Hiragana(lesson.katakana)}

        {sec === 'tips' && list.length > 0 && (
          <div className="card space-y-3.5">
            <p className="t-mu text-xs">Tips for life in Japan — জাপানের জীবন ও সংস্কৃতির টপিক</p>
            {list.map((t, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: 'var(--shu)' }} />
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-snug">{t.en}</p>
                  {t.bn && <p className="t-mu text-[13px] mt-0.5 leading-snug">{t.bn}</p>}
                  {t.text && t.text.map((para, j) => <p key={j} className="text-[13px] leading-relaxed mt-2">{para}</p>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {sec === 'grammar' && list.map((g, i) => (
          <div key={i} className="card space-y-2.5">
            <span className="chip jp">{g.pattern}</span>
            <div className="rounded-xl p-3 chip-b space-y-1">
              {(g.example || '').split(' / ').map((ex, j) => (
                <p key={j} className="font-semibold text-sm jp leading-relaxed">{ex}</p>
              ))}
            </div>
            <p className="t-mu text-xs leading-relaxed">
              {g.meaningBn || 'ব্যাখ্যা পরবর্তীতে যুক্ত করা হবে।'}
            </p>
          </div>
        ))}

        {sec === 'kanji' && list.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {list.map((k, i) => (
              <div key={i} className="card text-center py-5 space-y-1.5">
                <p className="text-4xl jp-display">{k.char}</p>
                {k.reading && <p className="t-br text-xs font-semibold jp">{k.reading}</p>}
                <p className="t-mu text-xs">{k.bn || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // হোম → ভোকাবুলারি/গ্রামার/কান্জি → লেসন তালিকা
  const StudyList = () => {
    const c = CATS[cat];
    if (!c) return <div className="view">{Empty()}</div>;
    const shown = book ? [book] : booksData;
    const total = shown.reduce((n, b) => n + b.lessons.reduce((m, l) => m + (l[cat] || []).length, 0), 0);
    return (
      <div className="space-y-4 view">
        <div className="card flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl chip-b grid place-items-center jp-display text-2xl shrink-0">{c.glyph}</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold">{c.label}</p>
            <p className="t-mu text-xs">{book ? book.title : 'সব বই'} • {total}টি • একটি লেসন বেছে নিন</p>
          </div>
        </div>
        {shown.map((b) => (
          <div key={b.id} className="space-y-2.5">
            <h3 className="text-[13px] font-semibold t-mu px-1 jp">{b.title} • {b.jpTitle}</h3>
            {b.lessons.filter((l) => (l[cat] || []).length > 0).map((l) => {
              const n = (l[cat] || []).length;
              return (
                <div
                  key={l.id}
                  onClick={() => openLesson(b.id, l.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') openLesson(b.id, l.id); }}
                  role="button" tabIndex={0}
                  className="card card-tap flex items-center gap-3.5"
                >
                  <div className="w-11 h-11 rounded-2xl grid place-items-center font-extrabold text-sm shrink-0 chip-b">{l.lessonNumber}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{l.title}</p>
                    <p className="t-mu text-xs truncate mt-0.5">{l.titleBn}</p>
                  </div>
                  <span className={`chip tabular-nums ${n ? '' : 'opacity-50'}`}>{n}টি</span>
                  <ChevronRight className="w-4 h-4 t-mu shrink-0" />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const More = () => (
    <div className="space-y-4 view">
      <div className="space-y-2.5">
        <h3 className="text-[13px] font-semibold t-mu px-1">অগ্রগতি</h3>
        {[
          ['progress', BarChart3, 'প্রগ্রেস ও স্ট্যাটস', 'স্ট্রিক, XP, সাপ্তাহিক চার্ট ও মক টেস্টের ইতিহাস'],
        ].map(([id, I, label, desc]) => (
          <div
            key={id} onClick={() => go(id)} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') go(id); }}
            className="card card-tap flex items-center gap-3.5"
          >
            <div className="w-12 h-12 rounded-2xl chip-b grid place-items-center shrink-0"><I className="w-6 h-6" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[15px]">{label}</p>
              <p className="t-mu text-xs mt-0.5">{desc}</p>
            </div>
            <ChevronRight className="w-5 h-5 t-mu shrink-0" />
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        <h3 className="text-[13px] font-semibold t-mu px-1">সেটিংস</h3>
        <div className="card flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl chip-b grid place-items-center shrink-0"><Palette className="w-6 h-6" /></div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px]">ডার্ক মোড</p>
            <p className="t-mu text-xs mt-0.5">রাতে পড়ার জন্য চোখ-বান্ধব থিম</p>
          </div>
          <button
            role="switch" aria-checked={dark} aria-label="ডার্ক মোড"
            onClick={() => setDark((d) => !d)}
            className="relative w-12 h-7 rounded-full shrink-0 transition-colors"
            style={{ background: dark ? 'var(--br)' : 'var(--ln)' }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform"
              style={{ transform: dark ? 'translateX(20px)' : 'none' }}
            />
          </button>
        </div>
        <Offline />
      </div>

      <div className="card flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl chip-b grid place-items-center shrink-0"><Info className="w-6 h-6" /></div>
        <div className="min-w-0">
          <p className="font-bold text-[15px]">Irodori JFT-Basic</p>
          <p className="t-mu text-xs mt-0.5">সংস্করণ 4.6 • ডেটা শুধু আপনার ডিভাইসে সেভ থাকে</p>
        </div>
      </div>
    </div>
  );

  const Progress = () => {
    const mastered = cards.filter((c) => (state.srs[c.id]?.box || 0) >= 3).length;
    const week = [6, 5, 4, 3, 2, 1, 0].map((i) => {
      const dt = new Date(Date.now() - i * 86400000);
      return {
        d: dayNum() - i,
        xp: st.days[dayNum() - i] || 0,
        label: i === 0 ? 'আজ' : BN_DAYS[dt.getDay()],
      };
    });
    const mx = Math.max(10, ...week.map((w) => w.xp));
    const best = Math.max(0, ...state.history.map((h) => h.score));

    return (
      <div className="space-y-4 view">
        <div className="grid grid-cols-2 gap-3">
          {[
            ['🔥', liveStreak(st), 'দিনের স্ট্রিক', 'bg-orange-500/10'],
            ['⭐', st.xp, 'মোট অর্জিত XP', 'bg-amber-500/10'],
            ['🧠', `${mastered}/${cards.length}`, 'আয়ত্তকৃত শব্দ', 'bg-indigo-500/10'],
            ['🏆', best ? `${best}/250` : '—', 'সেরা মক স্কোর', 'bg-emerald-500/10'],
          ].map(([e, v, l, bg]) => (
            <div key={l} className="card flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl grid place-items-center text-xl shrink-0 ${bg}`}>{e}</div>
              <div className="min-w-0">
                <p className="text-lg font-extrabold tabular-nums truncate">{v}</p>
                <p className="t-mu text-[11px] font-medium">{l}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-sm">গত ৭ দিনের XP অ্যাক্টিভিটি</p>
            <span className="chip"><Sparkles className="w-3 h-3" /> সাপ্তাহিক</span>
          </div>
          <div className="grid grid-cols-7 gap-2 items-end h-32 pt-4">
            {week.map((w, wi) => (
              <div key={w.d} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-bold t-mu tabular-nums">{w.xp || ''}</span>
                <div
                  className="w-full max-w-[28px] rounded-t-xl rounded-b-md transition-all"
                  style={{
                    height: `${Math.max(8, (w.xp / mx) * 100)}%`,
                    background: w.xp ? (wi === 6 ? 'var(--shu)' : 'var(--br)') : 'var(--sf2)',
                  }}
                />
                <span className="text-[10.5px] font-semibold t-mu">{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <h3 className="text-[13px] font-semibold t-mu px-1">মক টেস্ট ইতিহাস</h3>
          {!state.history.length && (
            <div className="card text-center text-sm t-mu py-6">এখনো কোনো মক টেস্ট দেওয়া হয়নি।</div>
          )}
          {[...state.history].reverse().slice(0, 10).map((h, i) => (
            <div key={i} className="card flex justify-between items-center !py-3.5">
              <div className="flex items-center gap-3">
                {h.score >= 200 ? (
                  <div className="hanko w-11 h-11 text-[12px]" aria-label="পাস">合格</div>
                ) : (
                  <div className="w-11 h-11 rounded-xl grid place-items-center bg-rose-500/15 t-bad"><Trophy className="w-5 h-5" /></div>
                )}
                <div>
                  <p className="font-extrabold tabular-nums">
                    {h.score}<span className="t-mu text-xs font-normal"> / 250</span>
                  </p>
                  <p className="t-mu text-[11px]">{new Date(h.date).toLocaleString('bn-BD')}</p>
                </div>
              </div>
              <span className={`chip ${h.score >= 200 ? '!bg-emerald-500/15 !text-emerald-600 dark:!text-emerald-400' : '!bg-rose-500/15 !text-rose-600 dark:!text-rose-400'}`}>
                {h.score >= 200 ? 'PASS' : 'FAIL'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const xpToday = todayXp(st);
  const resumeBook = booksData.find((b) => b.id === state.resume?.bookId);
  const resumeLesson = resumeBook?.lessons.find((l) => l.id === state.resume?.lessonId);
  const resumePct = resumeLesson && resumeLesson.activities.length
    ? Math.round((lessonDone(resumeLesson) / resumeLesson.activities.length) * 100) : 0;

  let body;
  if (tab === 'home') {
    body = (
      <div className="space-y-5 view">
        <div className="hero space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] opacity-80 jp">{greet()}</p>
              <h2 className="text-[26px] leading-tight font-extrabold mt-0.5">আজকের পড়াশোনা</h2>
              <p className="text-[13px] opacity-85 mt-1.5 leading-snug">
                {xpToday >= DAILY_GOAL ? 'আজকের লক্ষ্য পূরণ হয়েছে। চমৎকার!' : `আজকের লক্ষ্য পূরণে আর ${DAILY_GOAL - xpToday} XP বাকি`}
              </p>
            </div>
            <Ring value={xpToday} goal={DAILY_GOAL} />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              [<Flame key="f" className="w-4 h-4 mx-auto text-amber-300" />, liveStreak(st), 'দিনের স্ট্রিক'],
              [<Star key="s" className="w-4 h-4 mx-auto text-yellow-200" />, st.xp, 'মোট XP'],
              [<Repeat key="r" className="w-4 h-4 mx-auto text-indigo-100" />, due, 'রিভিউ বাকি'],
            ].map(([ic, v, l]) => (
              <div key={l} className="rounded-2xl py-2.5 px-1.5 border border-white/15" style={{ background: 'rgb(255 255 255 / 0.12)' }}>
                {ic}
                <b className="text-lg block mt-0.5 tabular-nums leading-tight">{v}</b>
                <span className="text-[11px] opacity-85">{l}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => go(due > 0 ? 'review' : 'books')}
            className="btn w-full font-bold"
            style={{ background: '#fff', color: '#17236b' }}
          >
            {due > 0 ? <><Repeat className="w-4 h-4" /> আজকের {due}টি রিভিউ শুরু করুন</> : <><BookOpen className="w-4 h-4" /> নতুন লেসন পড়ুন</>}
          </button>
        </div>

        {resumeLesson && (
          <div onClick={() => openLesson(resumeBook.id, resumeLesson.id)} className="card card-tap flex items-center gap-3.5" role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') openLesson(resumeBook.id, resumeLesson.id); }}>
            <div className="w-12 h-12 rounded-2xl chip-b grid place-items-center shrink-0">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="t-mu text-xs">যেখানে থেমেছিলেন</p>
              <p className="font-bold text-[15px] truncate">Lesson {resumeLesson.lessonNumber} • {resumeLesson.titleBn || resumeLesson.title}</p>
              <div className="bar mt-2"><i style={{ width: `${resumePct}%` }} /></div>
            </div>
            <ChevronRight className="w-5 h-5 t-mu shrink-0" />
          </div>
        )}

        <div className="flex items-center justify-between px-1 -mb-2">
          <h3 className="text-[13px] font-semibold t-mu">Irodori পাঠ্যবই</h3>
          <button onClick={() => go('books')} className="text-xs font-bold t-br py-1">সব লেসন</button>
        </div>

        {booksData.map((b) => {
          const pct = bookPct(b);
          return (
            <section key={b.id} className="card space-y-3.5">
              <div
                onClick={() => openBook(b.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') openBook(b.id); }}
                role="button" tabIndex={0}
                className="flex items-center gap-3.5 cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-2xl text-white grid place-items-center font-extrabold text-base shadow-sm shrink-0 ${b.iconBg}`}>
                  {b.id === 'starter' ? 'A1' : 'A2'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-base">{b.title}</p>
                    <span className="chip">{b.level}</span>
                  </div>
                  <p className="t-mu text-xs mt-0.5 jp">{b.jpTitle} • {b.lessons.length}/{b.totalLessons} লেসন</p>
                </div>
                <ChevronRight className="w-5 h-5 t-mu shrink-0" />
              </div>

              <div className="flex items-center gap-3">
                <div className="bar flex-1"><i style={{ width: `${pct}%` }} /></div>
                <span className="t-br text-xs font-extrabold tabular-nums">{pct}%</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {Object.entries(CATS).map(([id, c]) => {
                  const n = b.lessons.reduce((m, l) => m + (l[id] || []).length, 0);
                  return (
                    <button
                      key={id}
                      onClick={() => openStudy(id, b.id)}
                      className="rounded-2xl p-3 text-center space-y-1.5 active:scale-[0.97] transition"
                      style={{ background: 'var(--sf2)' }}
                    >
                      <div className="w-11 h-11 mx-auto rounded-xl chip-b grid place-items-center jp-display text-xl">{c.glyph}</div>
                      <p className="font-bold text-[13px]">{c.label}</p>
                      <p className="t-mu text-[11px] tabular-nums -mt-0.5">{n}টি</p>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    );
  } else if (tab === 'books') {
    body = !book ? (
      <div className="view">{BookList()}</div>
    ) : !lesson ? (
      <div className="space-y-3 view">
        <div className="card flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl text-white grid place-items-center font-extrabold shrink-0 ${book.iconBg}`}>
            {book.id === 'starter' ? 'A1' : 'A2'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold">{book.title}</p>
            <p className="t-mu text-xs jp">{book.jpTitle} • {bookPct(book)}% সম্পন্ন</p>
          </div>
        </div>

        {book.lessons.map((l, idx) => {
          const d = lessonDone(l), totalA = l.activities.length, all = totalA > 0 && d === totalA;
          const newTopic = l.topic && l.topic !== book.lessons[idx - 1]?.topic;
          return (
            <React.Fragment key={l.id}>
              {newTopic && (
                <h3 className="text-xs font-bold t-br px-1 pt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" /> {l.topic}
                </h3>
              )}
              <div
                onClick={() => openLesson(book.id, l.id)}
                className="card card-tap flex items-center gap-3.5"
              >
                {all ? (
                  <div className="hanko pop w-11 h-11 text-lg" aria-label="সম্পন্ন">済</div>
                ) : (
                  <div className="w-11 h-11 rounded-2xl grid place-items-center font-extrabold text-sm shrink-0 chip-b">{l.lessonNumber}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{l.title}</p>
                  <p className="t-mu text-xs truncate mt-0.5">{l.titleBn}</p>
                </div>
                <span className="chip tabular-nums">{d}/{totalA}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    ) : mode === 'quiz' ? (
      <Quiz key={lesson.id} lesson={lesson} update={update} />
    ) : mode === 'review' ? (
      <Review key={lesson.id} state={state} update={update} lessonId={lesson.id} />
    ) : sec === null ? (
      LessonView()
    ) : (
      SectionView()
    );
  } else if (tab === 'study') {
    body = StudyList();
  } else if (tab === 'vocab') {
    body = <VocabTab />;
  } else if (tab === 'more') {
    body = More();
  } else if (tab === 'review') {
    body = <Review key="due" state={state} update={update} onDone={() => go('books')} />;
  } else if (tab === 'exam') {
    body = (
      <MockTest
        onExit={() => go('home')}
        onSave={(h) => update((s) => addXp({ ...s, history: [...s.history, h] }, Math.round(h.correct * 3)))}
      />
    );
  } else {
    body = Progress();
  }

  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-20 backdrop-blur-lg border-b"
        style={{
          background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
          borderColor: 'var(--ln)',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-2.5">
          {(!ROOT_TABS.includes(tab) || bookId) ? (
            <button
              onClick={back}
              aria-label="পিছনে যান"
              className="w-10 h-10 -ml-2 rounded-full grid place-items-center active:bg-black/5 dark:active:bg-white/10 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <img src="/icon.svg" alt="" className="w-9 h-9 rounded-xl shadow-sm shrink-0" />
          )}
          <h1 className="text-[15px] font-extrabold flex-1 truncate">{title}</h1>
          <span className="chip chip-shu tabular-nums" aria-label={`${liveStreak(st)} দিনের স্ট্রিক`}>
            <Flame className="w-3.5 h-3.5" /> {liveStreak(st)}
          </span>
          <button
            onClick={() => setDark((d) => !d)}
            aria-label="থিম বদলান"
            className="w-10 h-10 rounded-full grid place-items-center btn-g !p-0"
          >
            {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 t-mu" />}
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-5">{body}</main>

      <nav className="tabbar">
        {TABS.map(([id, I, label]) => (
          <button key={id} onClick={() => go(id)} className={(NAV_OF[tab] || tab) === id ? 'on' : ''} aria-current={(NAV_OF[tab] || tab) === id ? 'page' : undefined}>
            <I className="w-5 h-5" />
            <span>{label}</span>
            {id === 'review' && due > 0 && <b className="tab-badge tabular-nums">{due > 99 ? '99+' : due}</b>}
          </button>
        ))}
      </nav>
    </div>
  );
}