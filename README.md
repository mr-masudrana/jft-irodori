# Irodori JFT-Basic Prep App

A personal mobile-first web application (PWA) built with React and Tailwind CSS to prepare for the **JFT-Basic** exam using the **Irodori: Japanese for Life in Japan** curriculum.

## Features
- **Lesson-by-Lesson Study:** Structured around Irodori Elementary 1 & 2 (A2 Level).
- **JFT Exam Audio Mode (2x Play):** Plays audio twice with a 1.5-second pause, simulating the real JFT-Basic CBT listening test.
- **Shadowing & Script Toggle:** Hide Japanese scripts to test listening comprehension, or view scripts with Bangla translations.
- **Dedicated Kanji Section:** Separate Kanji cards with readings and Bangla meanings.
- **Auto-Save Can-do Progress:** Saves your completed Can-do objectives locally in the browser.

## Setup Instructions
1. Extract the ZIP and open the folder in your terminal.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Add your Irodori MP3 audio files into `public/audio/elem1/` (e.g., `01-01.mp3`).
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Push to a **Private GitHub Repository** and deploy on Vercel or Cloudflare Pages.
