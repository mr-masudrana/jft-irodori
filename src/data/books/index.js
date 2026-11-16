// গঠন: books/<বই-আইডি>/book.json (বইয়ের তথ্য) + books/<বই-আইডি>/lesson_01.json, lesson_02.json ...
// নতুন লেসন বা বই যোগ করলে এই ফাইলে কিছু বদলাতে হবে না (ফোল্ডার নাম = বইয়ের id)।
const files = import.meta.glob('./*/*.json', { eager: true, import: 'default' });

const map = {};
Object.entries(files).forEach(([path, data]) => {
  const m = path.match(/\.\/([^/]+)\/([^/]+)\.json$/);
  if (!m) return;
  const [, folder, file] = m;
  map[folder] = map[folder] || { lessons: [] };
  if (file === 'book') Object.assign(map[folder], data);
  else map[folder].lessons.push(data);
});

const books = Object.values(map)
  .filter((b) => b.id)
  .sort((a, b) => (a.order || 99) - (b.order || 99));
books.forEach((b) => b.lessons.sort((x, y) => x.lessonNumber - y.lessonNumber));

export default books;
