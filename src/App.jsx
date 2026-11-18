import React, { useState, useEffect } from 'react';
import {
  Home, BookOpen, Repeat, ClipboardCheck, BarChart3, ArrowLeft, Flame, Star, ChevronRight,
  CheckCircle2, Circle, Eye, EyeOff, Brain, PenLine, Sun, Moon, Search, Sparkles, Trophy, X,
} from 'lucide-react';
import booksData from './data/books';
import AudioPlayer from './components/AudioPlayer';
import MockTest from './components/MockTest';
import Offline from './components/Offline';
import { Review, Quiz } from './components/Review';
import { useStore, addXp, liveStreak, cards, isDue, dayNum } from './lib/store';

const TABS = [
  ['home', Home, 'হোম'],
  ['books', BookOpen, 'বই'],
  ['review', Repeat, 'রিভিউ'],
  ['exam', ClipboardCheck, 'মক টেস্ট'],
  ['progress', BarChart3, 'প্রগ্রেস'],
];

const TAB_IDS = ['home', 'books', 'review', 'exam', 'progress'];
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
  const r = { tab, bookId: null, lessonId: null, sec: null, mode: null };
  if (tab === 'books') {
    r.bookId = p[1] || null;
    r.lessonId = r.bookId ? p[2] || null : null;
    const x = r.lessonId ? p[3] : null;
    if (x === 'quiz' || x === 'review') r.mode = x;
    else if (/^a\d+$/.test(x || '')) r.sec = Number(x.slice(1));
    else if (['vocab', 'grammar', 'kanji', 'dialogues'].includes(x)) r.sec = x;
  }
  return r;
}

const toHash = ({ tab, bookId, lessonId, sec, mode }) => {
  const seg = tab === 'books'
    ? [bookId, bookId && lessonId, bookId && lessonId && (mode || (sec === null ? null : typeof sec === 'number' ? `a${sec}` : sec))]
    : [];
  return '#/' + [tab, ...seg].filter((x) => x !== null && x !== undefined && x !== false && x !== '').map(encodeURIComponent).join('/');
};
const depth = () => window.history.state?.n || 0;

export default function App() {
  const [state, update] = useStore();
  const [init] = useState(parseHash);
  const [tab, setTab] = useState(init.tab);
  const [bookId, setBookId] = useState(init.bookId);
  const [lessonId, setLessonId] = useState(init.lessonId);
  const [mode, setMode] = useState(init.mode);
  const [hide, setHide] = useState(false);
  const [sec, setSec] = useState(init.sec);
  const [q, setQ] = useState('');
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('jft-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('jft-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => { setQ(''); }, [sec, lessonId]);

  const book = booksData.find((b) => b.id === bookId);
  const lesson = book?.lessons.find((l) => l.id === lessonId);

  const first = React.useRef(true);
  useEffect(() => {
    const h = toHash({ tab, bookId, lessonId, sec, mode });
    if (first.current) {
      first.current = false;
      if (location.hash !== h) window.history.replaceState({ n: depth() }, '', h);
    } else if (location.hash !== h) {
      window.history.pushState({ n: depth() + 1 }, '', h);
    }
  }, [tab, bookId, lessonId, sec, mode]);

  useEffect(() => {
    const onPop = () => {
      const r = parseHash();
      setTab(r.tab); setBookId(r.bookId); setLessonId(r.lessonId); setSec(r.sec); setMode(r.mode);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const st = state.stats;
  const due = cards.filter((c) => isDue(state, c)).length;
  const top = () => window.scrollTo({ top: 0 });
  const go = (t) => { setTab(t); setBookId(null); setLessonId(null); setSec(null); setMode(null); top(); };
  const openBook = (id) => { setTab('books'); setBookId(id); setLessonId(null); setSec(null); setMode(null); top(); };
  const back = () => {
    if (depth() > 0) { window.history.back(); return; }
    if (mode) setMode(null);
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
    : tab === 'review' ? 'আজকের রিভিউ'
    : tab === 'exam' ? 'JFT Mock Exam'
    : tab === 'progress' ? 'প্রগ্রেস ও স্ট্যাটস'
    : mode === 'quiz' ? 'শব্দ কুইজ'
    : mode === 'review' ? 'লেসন ফ্ল্যাশকার্ড'
    : lesson ? (
      sec === null ? `Lesson ${lesson.lessonNumber}`
      : typeof sec === 'number' ? `L${lesson.lessonNumber} • অ্যাক্টিভিটি ${sec + 1}`
      : { vocab: 'শব্দতালিকা', grammar: 'গ্রামার নোট', kanji: 'কাঞ্জি', dialogues: 'কথোপকথন' }[sec]
    )
    : book ? book.title : 'Irodori বইসমূহ';

  const BookList = () => (
    <div className="grid gap-3">
      {booksData.map((b) => {
        const pct = bookPct(b);
        return (
          <div key={b.id} onClick={() => openBook(b.id)} className="card card-tap">
            <div className="flex items-center gap-3.5">
              <div className={`w-13 h-13 w-12 h-12 rounded-2xl text-white grid place-items-center font-extrabold text-base shadow-sm shrink-0 ${b.iconBg}`}>
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
      <button onClick={() => setHide(!hide)} className="btn btn-g !py-2 !px-3.5 text-xs">
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
    const rows = [
      ['vocab', '📚', 'শব্দতালিকা', lesson.vocabulary.length],
      ['grammar', '🧩', 'গ্রামার নোট', lesson.grammar.length],
      ['kanji', '🈶', 'কাঞ্জি', lesson.kanji.length],
    ];
    if (lesson.dialogues.length) rows.unshift(['dialogues', '🎧', 'কথোপকথন', lesson.dialogues.length]);

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
          <h3 className="text-xs font-bold uppercase t-mu px-1">স্টাডি ম্যাটেরিয়াল</h3>
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
          <h3 className="text-xs font-bold uppercase t-mu px-1">টপিক ও Can-Do অ্যাক্টিভিটি</h3>
          {lesson.activities.map((a, i) => {
            const on = !!state.canDos[`${lesson.id}-${i}`];
            return (
              <div key={i} onClick={() => { setSec(i); top(); }} className="card card-tap flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl grid place-items-center font-bold shrink-0 ${
                  on ? 'bg-emerald-500/15 t-ok' : 'chip-b'
                }`}>
                  {on ? <CheckCircle2 className="w-5 h-5" /> : a.no}
                </div>
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
  const SectionView = () => {
    if (typeof sec === 'number') {
      const a = lesson.activities[sec];
      if (!a) return <div className="view">{Empty()}</div>;
      const k = `${lesson.id}-${sec}`, on = !!state.canDos[k];
      return (
        <div className="space-y-3.5 view">
          <div
            onClick={() => toggle(k)}
            className={`card cursor-pointer select-none transition border-2 ${
              on ? 'border-emerald-500/40 bg-emerald-500/5' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="chip">অ্যাক্টিভিটি {a.no}</span>
                <p className="font-bold text-base jp pt-1">{a.title}</p>
              </div>
              {on ? <CheckCircle2 className="w-6 h-6 t-ok shrink-0" /> : <Circle className="w-6 h-6 t-mu shrink-0" />}
            </div>
            <p className={`text-xs mt-2.5 leading-relaxed ${on ? 't-ok font-medium' : 't-mu'}`}>
              {a.canDo || 'ট্যাপ করে সম্পন্ন হিসেবে চিহ্নিত করুন'}
            </p>
          </div>
          {a.dialogues.length ? (<>{HideBtn()}{Dialogues(a.dialogues)}</>) : Empty()}
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
                    <p className="text-lg font-extrabold jp mt-0.5">{w.jp}</p>
                    <p className="t-mu text-xs mt-0.5">{w.bn}</p>
                  </div>
                  <AudioPlayer key={`${lesson.id}-v-${w.jp}-${i}`} src={w.audio} text={w.kana || w.jp} compact />
                </div>
              ))
            )}
          </>
        )}

        {sec === 'grammar' && list.map((g, i) => (
          <div key={i} className="card space-y-2.5">
            <span className="chip jp">{g.pattern}</span>
            <p className="font-semibold text-sm rounded-xl p-3 chip-b jp leading-relaxed">{g.example}</p>
            <p className="t-mu text-xs leading-relaxed">
              {g.meaningBn || 'ব্যাখ্যা পরবর্তীতে যুক্ত করা হবে।'}
            </p>
          </div>
        ))}

        {sec === 'kanji' && list.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {list.map((k, i) => (
              <div key={i} className="card text-center py-5 space-y-1.5">
                <p className="text-3xl font-extrabold jp">{k.char}</p>
                {k.reading && <p className="t-br text-xs font-semibold jp">{k.reading}</p>}
                <p className="t-mu text-xs">{k.bn || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

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
            {week.map((w) => (
              <div key={w.d} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-bold t-mu tabular-nums">{w.xp || ''}</span>
                <div
                  className="w-full max-w-[28px] rounded-t-xl rounded-b-md transition-all"
                  style={{
                    height: `${Math.max(8, (w.xp / mx) * 100)}%`,
                    background: w.xp ? 'linear-gradient(180deg, var(--br2), var(--br))' : 'var(--sf2)',
                  }}
                />
                <span className="text-[10.5px] font-semibold t-mu">{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        <Offline />

        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase t-mu px-1">মক টেস্ট ইতিহাস</h3>
          {!state.history.length && (
            <div className="card text-center text-sm t-mu py-6">এখনো কোনো মক টেস্ট দেওয়া হয়নি।</div>
          )}
          {[...state.history].reverse().slice(0, 10).map((h, i) => (
            <div key={i} className="card flex justify-between items-center !py-3.5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl grid place-items-center ${h.score >= 200 ? 'bg-emerald-500/15 t-ok' : 'bg-rose-500/15 t-bad'}`}>
                  <Trophy className="w-5 h-5" />
                </div>
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

  let body;
  if (tab === 'home') {
    body = (
      <div className="space-y-5 view">
        <div className="hero space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium opacity-90 jp">こんにちは 👋 • JFT-Basic প্রস্তুতি</p>
              <h2 className="text-2xl font-extrabold mt-0.5">আজকের পড়াশোনা</h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm">
              {due > 0 ? `${due}টি রিভিউ` : 'সব আপডেটেড'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            {[
              [<Flame key="f" className="w-4 h-4 mx-auto text-amber-300" />, liveStreak(st), 'স্ট্রিক'],
              [<Star key="s" className="w-4 h-4 mx-auto text-yellow-200" />, st.xp, 'মোট XP'],
              [<Repeat key="r" className="w-4 h-4 mx-auto text-indigo-100" />, due, 'রিভিউ বাকি'],
            ].map(([ic, v, l]) => (
              <div key={l} className="rounded-2xl py-3 px-2 bg-white/15 backdrop-blur-sm border border-white/15">
                {ic}
                <b className="text-xl block mt-1 tabular-nums">{v}</b>
                <span className="text-[11px] opacity-90">{l}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => go(due > 0 ? 'review' : 'books')}
            className="btn w-full bg-white text-indigo-700 font-bold shadow-lg"
          >
            {due > 0 ? '▶ আজকের রিভিউ শুরু করুন' : '📚 বই থেকে নতুন লেসন পড়ুন'}
          </button>
        </div>

        <div onClick={() => go('exam')} className="card card-tap flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl btn-p grid place-items-center shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-base">JFT-Basic Mock Test</p>
              <span className="chip">CBT</span>
            </div>
            <p className="t-mu text-xs mt-0.5">২৫০ নম্বর • পাস মার্ক ২০০ • টাইমারসহ</p>
          </div>
          <ChevronRight className="w-5 h-5 t-mu shrink-0" />
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase t-mu">Irodori পাঠ্যবই</h3>
            <button onClick={() => go('books')} className="text-xs font-bold t-br">সব দেখুন</button>
          </div>
          {BookList()}
        </div>
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
                <h3 className="text-xs font-bold uppercase t-br px-1 pt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" /> {l.topic}
                </h3>
              )}
              <div
                onClick={() => { setLessonId(l.id); setSec(null); setHide(false); top(); }}
                className="card card-tap flex items-center gap-3.5"
              >
                <div className={`w-11 h-11 rounded-2xl grid place-items-center font-extrabold text-sm shrink-0 ${
                  all ? 'bg-emerald-500/15 t-ok' : 'chip-b'
                }`}>
                  {all ? <CheckCircle2 className="w-5 h-5" /> : l.lessonNumber}
                </div>
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
  } else if (tab === 'review') {
    body = <Review key="due" state={state} update={update} />;
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
          {(tab !== 'home' || bookId) && (
            <button
              onClick={back}
              aria-label="Back"
              className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <img src="/icon.svg" alt="" className="w-8 h-8 rounded-xl shadow-sm shrink-0" />
          <h1 className="text-sm font-extrabold flex-1 truncate">{title}</h1>
          <span className="chip tabular-nums">🔥 {liveStreak(st)}</span>
          <button
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-full grid place-items-center btn-g !p-0"
          >
            {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 t-mu" />}
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-5">{body}</main>

      <nav className="tabbar">
        {TABS.map(([id, I, label]) => (
          <button key={id} onClick={() => go(id)} className={tab === id ? 'on' : ''}>
            <I className="w-5 h-5" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}