import React, { useState, useEffect } from 'react';
import {
  Home, BookOpen, Repeat, ClipboardCheck, BarChart3, ArrowLeft, Flame, Star, ChevronRight,
  CheckCircle2, Circle, Headphones, BookMarked, FileText, Languages, Eye, EyeOff, Brain, PenLine,
} from 'lucide-react';
import booksData from './data/books';
import AudioPlayer from './components/AudioPlayer';
import MockTest from './components/MockTest';
import Offline from './components/Offline';
import { Review, Quiz } from './components/Review';
import { useStore, addXp, liveStreak, cards, isDue, dayNum } from './lib/store';

const TABS = [['home', Home, 'হোম'], ['books', BookOpen, 'বই'], ['review', Repeat, 'রিভিউ'], ['exam', ClipboardCheck, 'মক টেস্ট'], ['progress', BarChart3, 'প্রগ্রেস']];

const TAB_IDS = ['home', 'books', 'review', 'exam', 'progress'];
// URL hash <-> স্টেট: রিফ্রেশ করলে একই পেজে ফিরে আসে, ফোনের ব্যাক বাটন ধাপে ধাপে পেছনে যায়
function parseHash() {
  const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const tab = TAB_IDS.includes(p[0]) ? p[0] : 'home';
  const r = { tab, bookId: null, lessonId: null, sec: null, mode: null };
  if (tab === 'books') {
    r.bookId = p[1] || null; r.lessonId = r.bookId ? p[2] || null : null;
    const x = r.lessonId ? p[3] : null;
    if (x === 'quiz' || x === 'review') r.mode = x;
    else if (/^a\d+$/.test(x || '')) r.sec = Number(x.slice(1));
    else if (['vocab', 'grammar', 'kanji', 'dialogues'].includes(x)) r.sec = x;
  }
  return r;
}
const toHash = ({ tab, bookId, lessonId, sec, mode }) => {
  const seg = tab === 'books' ? [bookId, bookId && lessonId, bookId && lessonId && (mode || (sec === null ? null : typeof sec === 'number' ? `a${sec}` : sec))] : [];
  return '#/' + [tab, ...seg].filter((x) => x !== null && x !== undefined && x !== false && x !== '').map(encodeURIComponent).join('/');
};
const depth = () => window.history.state?.n || 0;

export default function App() {
  const [state, update] = useStore();
  const [init] = useState(parseHash);
  const [tab, setTab] = useState(init.tab);
  const [bookId, setBookId] = useState(init.bookId);
  const [lessonId, setLessonId] = useState(init.lessonId);
  const [mode, setMode] = useState(init.mode); // null | 'quiz' | 'review'
  const [hide, setHide] = useState(false);
  const [sec, setSec] = useState(init.sec); // null | অ্যাক্টিভিটি নম্বর (index) | 'vocab' | 'grammar' | 'kanji' | 'dialogues'

  const book = booksData.find((b) => b.id === bookId);
  const lesson = book?.lessons.find((l) => l.id === lessonId);

  // স্টেট বদলালে URL আপডেট (প্রথমবার replace, পরে push)
  const first = React.useRef(true);
  useEffect(() => {
    const h = toHash({ tab, bookId, lessonId, sec, mode });
    if (first.current) { first.current = false; if (location.hash !== h) window.history.replaceState({ n: depth() }, '', h); }
    else if (location.hash !== h) window.history.pushState({ n: depth() + 1 }, '', h);
  }, [tab, bookId, lessonId, sec, mode]);
  // ফোনের ব্যাক / ব্রাউজার ব্যাক: URL থেকে স্টেট ফিরিয়ে আনে
  useEffect(() => {
    const onPop = () => { const r = parseHash(); setTab(r.tab); setBookId(r.bookId); setLessonId(r.lessonId); setSec(r.sec); setMode(r.mode); window.scrollTo({ top: 0 }); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const st = state.stats, due = cards.filter((c) => isDue(state, c)).length;
  const top = () => window.scrollTo({ top: 0 });
  const go = (t) => { setTab(t); setBookId(null); setLessonId(null); setSec(null); setMode(null); top(); };
  const openBook = (id) => { setTab('books'); setBookId(id); setLessonId(null); setSec(null); setMode(null); top(); };
  const back = () => {
    if (depth() > 0) { window.history.back(); return; } // অ্যাপের ভেতরে আগের ধাপ থাকলে সেখানে যায়
    if (mode) setMode(null); else if (sec !== null) setSec(null); else if (lessonId) setLessonId(null); else if (bookId) setBookId(null); else go('home');
    top();
  };
  const toggle = (k) => update((s) => ({ ...s, canDos: { ...s.canDos, [k]: !s.canDos[k] } }));
  const bookPct = (b) => {
    let t = 0, d = 0;
    b.lessons.forEach((l) => l.activities.forEach((_, i) => { t++; if (state.canDos[`${l.id}-${i}`]) d++; }));
    return t ? Math.round((d / t) * 100) : 0;
  };
  const lessonDone = (l) => l.activities.filter((_, i) => state.canDos[`${l.id}-${i}`]).length;

  const title = tab === 'home' ? 'Irodori JFT-Basic' : tab === 'review' ? 'আজকের রিভিউ' : tab === 'exam' ? 'JFT Mock Exam'
    : tab === 'progress' ? 'প্রগ্রেস' : mode === 'quiz' ? 'শব্দ কুইজ' : lesson ? (sec === null ? `Lesson ${lesson.lessonNumber}` : typeof sec === 'number' ? `L${lesson.lessonNumber} • ${sec + 1}` : { vocab: 'শব্দতালিকা', grammar: 'গ্রামার নোট', kanji: 'কাঞ্জি', dialogues: 'কথোপকথন' }[sec]) : book ? book.title : 'Irodori বই';

  const BookList = () => (
    <div className="grid gap-3">
      {booksData.map((b) => (
        <div key={b.id} onClick={() => openBook(b.id)} className="card cursor-pointer active:scale-[0.99] transition">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl text-white grid place-items-center font-bold ${b.iconBg}`}>{b.id === 'starter' ? 'A1' : 'A2'}</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold">{b.title} <span className="chip ml-1">{b.level}</span></p>
              <p className="t-mu text-xs">{b.jpTitle} • {b.lessons.length}/{b.totalLessons} লেসন যোগ করা হয়েছে</p>
            </div>
            <ChevronRight className="w-5 h-5 t-mu" />
          </div>
          <div className="flex items-center gap-3 mt-3"><div className="bar flex-1"><i style={{ width: `${bookPct(b)}%` }} /></div><span className="t-mu text-xs font-bold">{bookPct(b)}%</span></div>
        </div>
      ))}
    </div>
  );

  const Dialogues = (list) => list.map((d) => (
    <div key={d.id} className="card space-y-3">
      <h3 className="font-bold text-sm jp">{d.title}</h3>
      <AudioPlayer src={d.audio} text={d.lines.map((l) => l.jp).join(' ')} />
      {!hide && d.lines.map((l, i) => (
        <div key={i} className="rounded-xl p-2.5 chip-b"><p className="text-sm font-semibold jp"><span className="t-br mr-2">{l.speaker}:</span>{l.jp}</p><p className="t-mu text-xs mt-1">{l.bn}</p></div>))}
    </div>));
  const HideBtn = () => (
    <div className="flex justify-end"><button onClick={() => setHide(!hide)} className="btn btn-g !py-1.5 !px-3 text-xs">{hide ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}{hide ? 'স্ক্রিপ্ট দেখুন' : 'স্ক্রিপ্ট লুকান'}</button></div>);
  const Empty = () => <div className="card t-mu text-sm text-center">এই অংশে এখনো কনটেন্ট নেই। <code>src/data/books/</code>-এর JSON-এ যোগ করুন।</div>;

  // স্তর ৩: লেসনের ভেতরে টপিক/অ্যাক্টিভিটি + বিস্তারিত অংশ
  const LessonView = () => {
    const rows = [['vocab', '📚', 'শব্দতালিকা', lesson.vocabulary.length], ['grammar', '🧩', 'গ্রামার নোট', lesson.grammar.length], ['kanji', '🈶', 'কাঞ্জি', lesson.kanji.length]];
    if (lesson.dialogues.length) rows.unshift(['dialogues', '🎧', 'অন্যান্য কথোপকথন', lesson.dialogues.length]);
    return (
      <div className="space-y-4 view">
        <div className="card space-y-3">
          <div><h2 className="text-lg font-bold">{lesson.title}</h2><p className="t-mu text-xs">{lesson.topic ? `${lesson.topic} • ` : ''}{lesson.titleBn}</p></div>
          <div className="grid grid-cols-2 gap-2">
            <button disabled={!lesson.vocabulary.length} className="btn btn-p disabled:opacity-40" onClick={() => { setMode('review'); top(); }}><Brain className="w-4 h-4" /> ফ্ল্যাশকার্ড</button>
            <button disabled={!lesson.vocabulary.length} className="btn btn-g disabled:opacity-40" onClick={() => { setMode('quiz'); top(); }}><PenLine className="w-4 h-4" /> কুইজ</button>
          </div>
        </div>
        <h3 className="text-xs font-bold uppercase t-mu px-1">টপিক / অ্যাক্টিভিটি</h3>
        {lesson.activities.map((a, i) => { const on = !!state.canDos[`${lesson.id}-${i}`]; return (
          <div key={i} onClick={() => { setSec(i); top(); }} className="card cursor-pointer flex items-center gap-3 active:scale-[0.99] transition">
            <div className={`w-10 h-10 rounded-xl grid place-items-center font-bold shrink-0 ${on ? 't-ok' : 'chip-b'}`}>{a.no}</div>
            <div className="flex-1 min-w-0"><p className="font-bold text-sm jp">{a.title}</p>{a.canDo && <p className="t-mu text-xs line-clamp-2">{a.canDo}</p>}</div>
            {a.dialogues.length > 0 && <span className="chip">🎧 {a.dialogues.length}</span>}
            {on ? <CheckCircle2 className="w-4 h-4 t-ok shrink-0" /> : <ChevronRight className="w-4 h-4 t-mu shrink-0" />}
          </div>); })}
        <h3 className="text-xs font-bold uppercase t-mu px-1">বিস্তারিত</h3>
        {rows.map(([id, e, label, n]) => (
          <div key={id} onClick={() => { setSec(id); top(); }} className="card cursor-pointer flex items-center gap-3">
            <span className="text-xl">{e}</span><p className="flex-1 font-bold text-sm">{label}</p><span className="chip">{n}</span><ChevronRight className="w-4 h-4 t-mu" />
          </div>))}
      </div>
    );
  };

  // স্তর ৪: বিস্তারিত
  const SectionView = () => {
    if (typeof sec === 'number') {
      const a = lesson.activities[sec];
      if (!a) return <div className="view">{Empty()}</div>;
      const k = `${lesson.id}-${sec}`, on = !!state.canDos[k];
      return (
        <div className="space-y-3 view">
          <div className="card space-y-2">
            <p className="font-bold jp">{a.no}. {a.title}</p>
            <div onClick={() => toggle(k)} className="flex items-start gap-2 text-sm cursor-pointer select-none">
              {on ? <CheckCircle2 className="w-4 h-4 t-ok shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 t-mu shrink-0 mt-0.5" />}
              <span className={on ? 'line-through t-mu' : ''}>{a.canDo || 'সম্পন্ন চিহ্নিত করুন'}</span>
            </div>
          </div>
          {a.dialogues.length ? (<>{HideBtn()}{Dialogues(a.dialogues)}</>) : Empty()}
        </div>
      );
    }
    const list = lesson[sec] || [];
    return (
      <div className="space-y-3 view">
        {!list.length && Empty()}
        {sec === 'dialogues' && list.length > 0 && (<>{HideBtn()}{Dialogues(list)}</>)}
        {sec === 'vocab' && list.map((w, i) => (
          <div key={i} className="card flex items-center justify-between gap-3">
            <div><p className="t-br text-xs font-medium">{w.kana}</p><p className="text-lg font-bold jp">{w.jp}</p><p className="t-mu text-xs">{w.bn}</p></div>
            <AudioPlayer src={w.audio} text={w.kana || w.jp} compact />
          </div>))}
        {sec === 'grammar' && list.map((g, i) => (
          <div key={i} className="card space-y-2"><span className="chip">{g.pattern}</span>
            <p className="font-semibold rounded-lg p-2.5 chip-b jp">{g.example}</p><p className="t-mu text-sm">{g.meaningBn}</p></div>))}
        {sec === 'kanji' && <div className="grid grid-cols-2 gap-3">{list.map((k, i) => (
          <div key={i} className="card text-center"><p className="text-3xl font-bold jp">{k.char}</p><p className="t-br text-xs font-semibold">{k.reading}</p><p className="t-mu text-xs">{k.bn}</p></div>))}</div>}
      </div>
    );
  };

  const Progress = () => {
    const mastered = cards.filter((c) => (state.srs[c.id]?.box || 0) >= 3).length;
    const week = [6, 5, 4, 3, 2, 1, 0].map((i) => ({ d: dayNum() - i, xp: st.days[dayNum() - i] || 0 }));
    const mx = Math.max(10, ...week.map((w) => w.xp));
    const best = Math.max(0, ...state.history.map((h) => h.score));
    return (
      <div className="space-y-4 view">
        <div className="grid grid-cols-2 gap-3">
          {[['🔥', liveStreak(st), 'দিনের স্ট্রিক'], ['⭐', st.xp, 'মোট XP'], ['🧠', `${mastered}/${cards.length}`, 'শব্দ আয়ত্ত'], ['🏆', best || '—', 'সেরা মক স্কোর']].map(([e, v, l]) => (
            <div key={l} className="card text-center"><p className="text-2xl font-extrabold">{e} {v}</p><p className="t-mu text-xs">{l}</p></div>))}
        </div>
        <div className="card"><p className="font-bold text-sm mb-3">গত ৭ দিনের XP</p>
          <div className="flex items-end gap-2 h-24">{week.map((w) => (
            <div key={w.d} className="flex-1 rounded-lg" style={{ height: `${Math.max(6, (w.xp / mx) * 100)}%`, background: w.xp ? 'linear-gradient(var(--br2),var(--br))' : 'var(--ln)' }} title={`${w.xp} XP`} />))}</div></div>
        <Offline />
        <h3 className="text-xs font-bold uppercase t-mu px-1">মক টেস্ট ইতিহাস</h3>
        {!state.history.length && <p className="t-mu text-sm px-1">এখনো কোনো টেস্ট দেওয়া হয়নি।</p>}
        {[...state.history].reverse().slice(0, 10).map((h, i) => (
          <div key={i} className="card flex justify-between items-center !py-3">
            <div><p className="font-bold">{h.score}<span className="t-mu text-xs"> / 250</span></p><p className="t-mu text-xs">{new Date(h.date).toLocaleString('bn-BD')}</p></div>
            <span className={`chip ${h.score >= 200 ? 't-ok' : 't-bad'}`}>{h.score >= 200 ? 'PASS' : 'FAIL'}</span>
          </div>))}
      </div>
    );
  };

  let body;
  if (tab === 'home') body = (
    <div className="space-y-5 view">
      <div className="hero">
        <p className="text-sm opacity-90">こんにちは 👋</p><h2 className="text-xl font-bold">আজকের পড়া</h2>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          {[[<Flame key="f" className="w-4 h-4 mx-auto" />, liveStreak(st), 'স্ট্রিক'], [<Star key="s" className="w-4 h-4 mx-auto" />, st.xp, 'XP'], [<Repeat key="r" className="w-4 h-4 mx-auto" />, due, 'রিভিউ বাকি']].map(([i, v, l]) => (
            <div key={l} className="rounded-2xl py-2.5" style={{ background: 'rgb(255 255 255/.18)' }}>{i}<b className="text-xl block">{v}</b><span className="text-[11px]">{l}</span></div>))}
        </div>
        <button onClick={() => go('review')} className="btn w-full mt-4 bg-white" style={{ color: 'var(--br)' }}>▶ রিভিউ শুরু করুন</button>
      </div>
      <div onClick={() => go('exam')} className="card cursor-pointer flex items-center gap-3 active:scale-[0.99] transition">
        <div className="w-12 h-12 rounded-2xl btn-p grid place-items-center"><ClipboardCheck className="w-6 h-6" /></div>
        <div className="flex-1"><p className="font-bold">JFT-Basic Mock Test</p><p className="t-mu text-xs">250 নম্বর • পাস ২০০ • টাইমারসহ</p></div><ChevronRight className="w-5 h-5 t-mu" />
      </div>
      <div className="space-y-2"><h3 className="text-xs font-bold uppercase t-mu px-1">Irodori Books</h3>{BookList()}</div>
    </div>
  );
  else if (tab === 'books') body = !book ? <div className="view">{BookList()}</div>
    : !lesson ? (
      <div className="space-y-3 view">{book.lessons.map((l, idx) => {
        const d = lessonDone(l), all = d === l.activities.length, newTopic = l.topic && l.topic !== book.lessons[idx - 1]?.topic;
        return (
          <React.Fragment key={l.id}>
            {newTopic && <h3 className="text-xs font-bold uppercase t-br px-1 pt-2">▸ {l.topic}</h3>}
            <div onClick={() => { setLessonId(l.id); setSec(null); setHide(false); top(); }} className="card cursor-pointer flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl grid place-items-center font-bold text-sm ${all ? 't-ok' : 'chip-b'}`}>{l.lessonNumber}</div>
              <div className="flex-1 min-w-0"><p className="font-bold text-sm truncate">{l.title}</p><p className="t-mu text-xs truncate">{l.titleBn}</p></div>
              <span className="chip">{d}/{l.activities.length}</span>
            </div>
          </React.Fragment>); })}</div>)
    : mode === 'quiz' ? <Quiz key={lesson.id} lesson={lesson} update={update} />
    : mode === 'review' ? <Review key={lesson.id} state={state} update={update} lessonId={lesson.id} />
    : sec === null ? LessonView() : SectionView();
  else if (tab === 'review') body = <Review key="due" state={state} update={update} />;
  else if (tab === 'exam') body = <MockTest onExit={() => go('home')} onSave={(h) => update((s) => addXp({ ...s, history: [...s.history, h] }, Math.round(h.correct * 3)))} />;
  else body = Progress();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 backdrop-blur-md border-b" style={{ background: 'color-mix(in srgb,var(--bg) 88%,transparent)', borderColor: 'var(--ln)', paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-2">
          {(tab !== 'home' || bookId) && <button onClick={back} aria-label="Back" className="p-1.5 -ml-1.5 rounded-full"><ArrowLeft className="w-5 h-5" /></button>}
          <img src="/icon.svg" alt="" className="w-8 h-8 rounded-lg" />
          <h1 className="text-sm font-bold flex-1 truncate">{title}</h1>
          <span className="chip">🔥 {liveStreak(st)}</span>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-4 pt-5">{body}</main>
      <nav className="tabbar">{TABS.map(([id, I, label]) => (
        <button key={id} onClick={() => go(id)} className={tab === id ? 'on' : ''}><I className="w-5 h-5" />{label}</button>))}</nav>
    </div>
  );
}
