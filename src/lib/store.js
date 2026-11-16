import { useEffect, useState } from 'react';
import booksData from '../data/books_data.json';

const KEY = 'jft_irodori_v4';
const DEF = { canDos: {}, srs: {}, history: [], stats: { xp: 0, streak: 0, last: 0, days: {} } };
export const dayNum = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
const shape = (s) => ({ ...DEF, ...s, stats: { ...DEF.stats, ...(s?.stats || {}) } });

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s) return shape(s);
    const old = JSON.parse(localStorage.getItem('jft_irodori_progress') || 'null'); // পুরনো ডেটা মাইগ্রেট
    return shape({ canDos: old || {} });
  } catch { return shape({}); }
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
const GAP = [0, 1, 2, 4, 8, 16];
export const rateCard = (s, id, ok) => {
  const box = ok ? Math.min((s.srs[id]?.box || 0) + 1, 5) : 0;
  return { ...s, srs: { ...s.srs, [id]: { box, due: ok ? dayNum() + GAP[box] : dayNum() } } };
};
export const cards = booksData.flatMap((b) => b.lessons.flatMap((l) =>
  l.vocabulary.map((v, i) => ({ ...v, id: `${l.id}:${i}`, lessonId: l.id, lessonNo: l.lessonNumber, book: b.title }))));
export const isDue = (s, c) => (s.srs[c.id]?.due ?? 0) <= dayNum();
export const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);

export function speakJa(text, { rate = 0.85, onend } = {}) {
  if (!text || !('speechSynthesis' in window)) return false;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP'; u.rate = rate;
    const v = speechSynthesis.getVoices().find((x) => x.lang?.toLowerCase().startsWith('ja'));
    if (v) u.voice = v;
    u.onend = onend; u.onerror = onend;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
    return true;
  } catch { return false; }
}
export const stopSpeech = () => { try { speechSynthesis.cancel(); } catch { /* ignore */ } };
