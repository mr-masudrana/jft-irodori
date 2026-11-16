# Irodori JFT-Basic App (v4.0)

PWA: Irodori লেসন + SRS রিভিউ + শব্দ কুইজ + JFT-Basic মক টেস্ট।

## চালানো
```
npm install
npm run dev
npm run build
```

## v4 পরিবর্তন
- অডিও MP3 না থাকলে ব্রাউজারের জাপানিজ TTS ফলব্যাক (alert নেই)
- অফলাইন: অ্যাপ, ডেটা ও MP3 ক্যাশ হয়; প্রগ্রেস ট্যাবে "সব অডিও ডাউনলোড" বাটন আছে
- SRS ফ্ল্যাশকার্ড (১/২/৪/৮/১৬ দিন), শব্দ কুইজ, স্ট্রিক, XP, ৭ দিনের চার্ট
- মক টেস্ট: ইতিহাস সেভ, বিভাগভিত্তিক ফলাফল, ভুল উত্তরের তুলনা, প্রশ্ন অনুযায়ী টাইমার
- নতুন UI: নিচের ট্যাব বার, ডার্ক মোড, safe-area, zoom চালু

## কনটেন্ট যোগ
`src/data/books_data.json`-এ লেসন যোগ করুন (id, lessonNumber, title, titleBn, canDos, vocabulary, dialogues, grammar, kanji)।
অডিও থাকলে `public/audio/...` এ রাখুন, না থাকলে TTS চলবে।
মক টেস্টের প্রশ্ন `src/data/mock_exam.json`-এ; শোনার প্রশ্নে `transcript` দিলে অডিও ছাড়াও TTS-এ চলবে।
