import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Repeat, Gauge } from 'lucide-react';
import { speakJa, stopSpeech } from '../lib/store';

// MP3 না থাকলে (বা ব্যর্থ হলে) নিজে থেকেই ব্রাউজারের জাপানিজ TTS ব্যবহার করে।
export default function AudioPlayer({ src, text, compact = false }) {
  const audio = useRef(null), timer = useRef(null), speedRef = useRef(1), failed = useRef(!src);
  const [playing, setPlaying] = useState(false);
  const [jft, setJft] = useState(false);
  const [count, setCount] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [note, setNote] = useState('');

  const stop = () => {
    audio.current?.pause();
    stopSpeech();
    clearTimeout(timer.current);
    setPlaying(false);
    setCount(0);
  };

  useEffect(() => () => {
    clearTimeout(timer.current);
    audio.current?.pause();
    stopSpeech();
  }, []);

  const playOnce = (n, total) => {
    setCount(n);
    const done = () => {
      if (n < total) timer.current = setTimeout(() => playOnce(n + 1, total), 1500);
      else { setPlaying(false); setCount(0); }
    };
    const tts = () => {
      if (!text) { setPlaying(false); setNote('অডিও নেই'); return; }
      speakJa(text, { rate: 0.85 * speedRef.current, onend: done });
    };
    if (!failed.current && audio.current) {
      audio.current.currentTime = 0;
      audio.current.playbackRate = speedRef.current;
      audio.current.onended = done;
      audio.current.play().catch(() => { failed.current = true; tts(); });
    } else tts();
  };

  const start = (e, mode) => {
    e?.stopPropagation?.();
    if (playing) return stop();
    setNote('');
    setJft(mode);
    setPlaying(true);
    playOnce(1, mode ? 2 : 1);
  };

  const toggleSpeed = (e) => {
    e?.stopPropagation?.();
    const s = speedRef.current === 1 ? 0.75 : 1;
    speedRef.current = s;
    setSpeed(s);
    if (audio.current) audio.current.playbackRate = s;
  };

  const el = src ? <audio ref={audio} src={src} preload="none" onError={() => { failed.current = true; }} /> : null;

  if (compact) {
    return (
      <>
        {el}
        <button
          type="button"
          onClick={(e) => start(e, false)}
          aria-label="Play audio"
          className={`w-11 h-11 rounded-full grid place-items-center shrink-0 transition active:scale-95 ${
            playing ? 'btn-p ring-4 ring-indigo-500/20' : 'chip-b hover:opacity-90'
          }`}
        >
          {playing ? (
            <div className="flex items-center gap-[2.5px]">
              <span className="eq-bar" />
              <span className="eq-bar" />
              <span className="eq-bar" />
            </div>
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>
      </>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-2 flex-wrap rounded-2xl p-2"
      style={{ background: 'var(--sf2)' }}
    >
      {el}
      <button
        type="button"
        onClick={(e) => start(e, false)}
        className={`btn ${playing && !jft ? 'btn-p' : 'btn-g'} !py-2 !min-h-[40px] !px-3.5 !rounded-xl text-xs`}
      >
        {playing && !jft ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        {playing && !jft ? 'থামুন' : 'শুনুন'}
      </button>
      <button
        type="button"
        onClick={(e) => start(e, true)}
        className={`btn ${playing && jft ? 'btn-p' : 'btn-g'} !py-2 !min-h-[40px] !px-3 !rounded-xl text-xs`}
        title="JFT পরীক্ষার মতো ২ বার শুনুন"
      >
        <Repeat className="w-3.5 h-3.5" />
        2x {playing && jft ? `(${count}/2)` : ''}
      </button>
      <button
        type="button"
        onClick={toggleSpeed}
        className="btn btn-g !py-2 !min-h-[40px] !px-3 !rounded-xl text-xs ml-auto tabular-nums"
        title="গতি পরিবর্তন"
      >
        <Gauge className="w-3.5 h-3.5 t-br" />
        {speed}x
      </button>
      {note && <span className="t-bad text-xs w-full px-1">{note}</span>}
    </div>
  );
}