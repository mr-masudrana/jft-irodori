export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  // অ্যাপের ডার্ক-মোড টগল <html data-theme="dark"> সেট করে; dark: ক্লাসগুলো সেটাই অনুসরণ করবে (OS সেটিং নয়)
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans Bengali', 'Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
