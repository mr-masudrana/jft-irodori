// টপিক গ্রুপিং, আনলক নিয়ম ও টপিক-টেস্টের প্রশ্ন তৈরি
import { shuffle } from './store';

export const PASS_PCT = 70; // টেস্টে পাস মার্ক (%)
export const TEST_SIZE = 10; // প্রতিটি টেস্টে প্রশ্ন সংখ্যা

const clean = (s) => String(s ?? '').trim();

// বইয়ের লেসনগুলোকে `topic` ফিল্ড ধরে গ্রুপ করে (topic না থাকলে ২টি করে লেসন একসাথে)
export function getTopics(book) {
  const out = [];
  book.lessons.forEach((l) => {
    const last = out[out.length - 1];
    if (l.topic && last && last.name === l.topic) last.lessons.push(l);
    else if (!l.topic && last && last.auto && last.lessons.length < 2) last.lessons.push(l);
    else out.push({ name: l.topic || '', auto: !l.topic, lessons: [l] });
  });
  out.forEach((t, i) => {
    t.idx = i;
    if (!t.name) {
      const a = t.lessons[0].lessonNumber, b = t.lessons[t.lessons.length - 1].lessonNumber;
      t.name = a === b ? `Lesson ${a}` : `Lesson ${a}–${b}`;
    }
  });
  return out;
}

export const topicKeyOf = (book, t) => `${book.id}:${t.name}`;
export const topicResult = (state, book, t) => state.topicTests?.[topicKeyOf(book, t)];
// প্রথম টপিক সবসময় খোলা; পরেরগুলো আগের টপিকের টেস্টে পাস করলে
export const isTopicUnlocked = (state, book, topics, i) => i === 0 || !!topicResult(state, book, topics[i - 1])?.passed;

function build(type, hint, prompt, sub, correct, wrong, extra = {}) {
  if (!correct || wrong.length < 2) return null;
  const opts = shuffle([correct, ...wrong.slice(0, 3)]);
  return { type, hint, prompt, sub, opts, a: opts.indexOf(correct), correct, ...extra };
}

const wrongFrom = (pool, correct, ok = () => true) =>
  shuffle([...new Set(pool.map(clean))].filter((x) => x && x !== correct && ok(x))).slice(0, 3);

const frags = (pattern) =>
  (clean(pattern).replace(/【[^】]*】/g, ' ').match(/[\u3040-\u30ff\u4e00-\u9fff]{2,}/g) || []);

const firstExample = (s) => {
  const x = clean(s).split(/\s*\/\s*/)[0];
  return x.length >= 4 && x.length <= 40 && !/[A-ZＡ-Ｚ][：:]/.test(x) ? x : '';
};

// টপিকের দুই লেসনের কনটেন্ট থেকে র‍্যান্ডম প্রশ্ন (প্রতিবার আলাদা)
export function makeTopicTest(book, topic, size = TEST_SIZE) {
  const all = book.lessons;
  const vocabPool = all.flatMap((l) => l.vocabulary || []);
  const phrasePool = all.flatMap((l) => (l.activities || []).flatMap((a) => a.phrases || []));
  const kanjiPool = all.flatMap((l) => l.kanji || []);
  const grammarPool = all.flatMap((l) => l.grammar || []);

  const vocabQ = [], phraseQ = [], kanjiQ = [], grammarQ = [];

  topic.lessons.forEach((l) => {
    (l.vocabulary || []).forEach((w) => {
      const c = clean(w.bn);
      vocabQ.push(build('vocab', 'সঠিক বাংলা অর্থ বাছাই করুন', w.jp, w.kana && w.kana !== w.jp ? w.kana : '', c,
        wrongFrom(vocabPool.map((x) => x.bn), c), { speak: w.kana || w.jp }));
    });
    (l.activities || []).forEach((a) => (a.phrases || []).forEach((p) => {
      const c = clean(p.bn);
      if (c.length > 120) return;
      phraseQ.push(build('phrase', 'বাক্যটির সঠিক বাংলা অর্থ কোনটি?', p.jp, '', c,
        wrongFrom(phrasePool.map((x) => x.bn), c, (x) => x.length <= 120), { speak: p.jp }));
    }));
    (l.kanji || []).forEach((k) => {
      const r = clean(k.reading), m = clean(k.bn);
      // উচ্চারণের ভুল অপশন সমান দৈর্ঘ্যের রাখা হয় (ছোট/বড় অপশন দেখেই উত্তর ধরা না পড়তে)
      kanjiQ.push(build('kanji', 'এই কান্জির সঠিক উচ্চারণ কোনটি?', k.char, '', r,
        wrongFrom(kanjiPool.map((x) => x.reading), r, (x) => Math.abs(x.length - r.length) <= 1 && x.length <= 5), { optJp: true }));
      kanjiQ.push(build('kanji', 'এই কান্জির সঠিক অর্থ কোনটি?', k.char, '', m, wrongFrom(kanjiPool.map((x) => x.bn), m)));
    });
    (l.grammar || []).forEach((g) => {
      const fr = frags(g.pattern), c = firstExample(g.example);
      if (!fr.length || !c || !fr.some((f) => c.includes(f))) return;
      const wrong = wrongFrom(
        grammarPool.filter((x) => x.pattern !== g.pattern).map((x) => firstExample(x.example)), c,
        (x) => !fr.some((f) => x.includes(f)),
      );
      grammarQ.push(build('grammar', 'এই গ্রামার প্যাটার্নের সঠিক উদাহরণ কোনটি?', clean(g.pattern).replace(/\s*\/\s*/g, '\n'), '', c, wrong, { optJp: true, promptSmall: true }));
    });
  });

  const groups = [vocabQ, phraseQ, kanjiQ, grammarQ.slice(0, 3)].map((g) => shuffle(g.filter(Boolean)));
  const picked = [], seen = new Set();
  let progress = true;
  while (picked.length < size && progress) { // বিভিন্ন ধরনের প্রশ্ন পালা করে নেওয়া
    progress = false;
    for (const g of groups) {
      while (g.length) {
        const q = g.shift();
        if (seen.has(q.prompt + q.hint)) continue;
        seen.add(q.prompt + q.hint); picked.push(q); progress = true;
        break;
      }
      if (picked.length >= size) break;
    }
  }
  return shuffle(picked);
}
