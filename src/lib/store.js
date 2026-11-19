import { useEffect, useState } from 'react';
import booksData from '../data/books';

const KEY = 'jft_irodori_v4';
const DEF = { canDos: {}, srs: {}, srsV: 0, quizXp: {}, history: [], resume: null, stats: { xp: 0, streak: 0, last: 0, days: {} } };
export const DAILY_GOAL = 20; // দিনে ২০ XP-র লক্ষ্য
export const dayNum = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
const shape = (s) => ({ ...DEF, ...s, stats: { ...DEF.stats, ...(s?.stats || {}) } });

// পুরনো কার্ড id (`লেসন:ইনডেক্স`) → নতুন স্থায়ী id; ভোকাবুলারি যোগ/বাদ/ক্রম বদলালেও রিভিউ ডেটা ঠিক থাকে
function migrate(st) {
  if (st.srsV >= 2) return st;
  const srs = {};
  Object.entries(st.srs || {}).forEach(([k, v]) => { srs[oldToNew[k] || k] = v; });
  return { ...st, srs, srsV: 2 };
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s) return migrate(shape(s));
    const old = JSON.parse(localStorage.getItem('jft_irodori_progress') || 'null'); // পুরনো ডেটা মাইগ্রেট
    return shape({ canDos: old || {}, srsV: 2 });
  } catch { return shape({ srsV: 2 }); }
}

export function useStore() {
  const [state, setState] = useState(load);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } }, [state]);
  return [state, setState];
}

export const addXp = (s, xp) => {
  const t = dayNum(), st = { ...s.stats };
  if (st.last !== t) { st.streak = st.last === t - 1 ? st.streak + 1 : 1; st.last = t; }
  st.xp += xp; st.days = { ...st.days, [t]: (st.days[t] || 0) + xp };
  return { ...s, stats: st };
};
export const liveStreak = (st) => (st.last >= dayNum() - 1 ? st.streak : 0);
export const todayXp = (st) => st.days[dayNum()] || 0;
export const setResume = (s, bookId, lessonId) => ({ ...s, resume: { bookId, lessonId } });
const GAP = [0, 1, 2, 4, 8, 16];
export const rateCard = (s, id, ok) => {
  const box = ok ? Math.min((s.srs[id]?.box || 0) + 1, 5) : 0;
  return { ...s, srs: { ...s.srs, [id]: { box, due: ok ? dayNum() + GAP[box] : dayNum() } } };
};
const hash = (str) => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
const oldToNew = {};
export const cards = booksData.flatMap((b) => b.lessons.flatMap((l) => {
  const seen = {};
  return l.vocabulary.map((v, i) => {
    // স্থায়ী id: শব্দের নিজস্ব `id` ফিল্ড, না থাকলে জাপানিজ+কানা থেকে হ্যাশ (একই লেসনে ডুপ্লিকেট হলে সংখ্যা যোগ)
    const base = v.id ? String(v.id) : hash(`${v.jp}|${v.kana || ''}`);
    seen[base] = (seen[base] || 0) + 1;
    const id = `${l.id}:${base}${seen[base] > 1 ? `~${seen[base]}` : ''}`;
    oldToNew[`${l.id}:${i}`] = id;
    return { ...v, id, lessonId: l.id, lessonNo: l.lessonNumber, book: b.title };
  });
}));
// 'মনে আছে' চাপলে কার্ডটি কত দিন পরে ফিরবে (বাটনে দেখানোর জন্য)
export const nextGapDays = (s, id) => GAP[Math.min((s.srs[id]?.box || 0) + 1, 5)];
export const isDue = (s, c) => (s.srs[c.id]?.due ?? 0) <= dayNum();
export const shuffle = (a) => { // Fisher–Yates
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
};

// ---- জাপানিজ TTS ----
// seq: প্রতিটি নতুন speak/stop-এ বাড়ে; পুরনো utterance-এর callback তখন 'interrupted' পায় (নিজে নিজে আবার বাজানো আটকাতে)
let seq = 0;
const speakListeners = new Set();
export const onSpeak = (f) => { speakListeners.add(f); return () => speakListeners.delete(f); };

export function jaVoiceStatus() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return 'unsupported';
  const vs = speechSynthesis.getVoices();
  if (!vs.length) return 'unknown';
  return vs.some((v) => v.lang?.toLowerCase().startsWith('ja')) ? 'yes' : 'no';
}

// onend(why): why = 'done' | 'interrupted' | 'error'। ফেরত মান false = TTS শুরুই করা যায়নি
export function speakJa(text, { rate = 0.85, onend, owner } = {}) {
  if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  try {
    const me = ++seq;
    speakListeners.forEach((f) => { try { f(owner); } catch { /* ignore */ } });
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP'; u.rate = rate;
    const v = speechSynthesis.getVoices().find((x) => x.lang?.toLowerCase().startsWith('ja'));
    if (v) u.voice = v;
    u.onend = () => onend?.(me !== seq ? 'interrupted' : 'done');
    u.onerror = () => onend?.(me !== seq ? 'interrupted' : 'error');
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      // cancel()-এর ঠিক পরেই speak() করলে Chrome অনেক সময় কথা গিলে ফেলে — তাই সামান্য বিরতি
      speechSynthesis.cancel();
      setTimeout(() => {
        if (me !== seq) return;
        try { speechSynthesis.speak(u); } catch { onend?.('error'); }
      }, 60);
    } else {
      speechSynthesis.speak(u);
    }
    return true;
  } catch { return false; }
}
export const stopSpeech = () => { seq++; try { speechSynthesis.cancel(); } catch { /* ignore */ } };
