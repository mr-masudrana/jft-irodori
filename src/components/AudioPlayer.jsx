import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Repeat, Gauge } from 'lucide-react';
import { speakJa, stopSpeech, onSpeak } from '../lib/store';

// শুধু ব্রাউজারের জাপানিজ TTS ব্যবহার করে (কোনো বাইরের অডিও ফাইল নেই)।
export default function AudioPlayer({ text, compact = false }) {
  const timer = useRef(null), speedRef = useRef(1), activeRef = useRef(false);
  const owner = useRef({}).current; // এই প্লেয়ারের পরিচয়: অন্য প্লেয়ার/বাটন বাজাতে শুরু করলে এটি থেমে যায়
  const [playing, setPlaying] = useState(false);
  const [jft, setJft] = useState(false);
  const [count, setCount] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [note, setNote] = useState('');

  // শুধু নিজের অবস্থা রিসেট (স্পিচ বন্ধ করে না)
  const halt = () => {
    clearTimeout(timer.current);
    activeRef.current = false;
    setPlaying(false);
    setCount(0);
  };
  const stop = () => { stopSpeech(); halt(); };

  useEffect(() => {
    const off = onSpeak((o) => { if (o !== owner) halt(); });
    return () => {
      off();
      clearTimeout(timer.current);
      if (activeRef.current) stopSpeech(); // নিজে বাজাচ্ছিলে তবেই থামাও, অন্যের অডিও নয়
    };
  }, []); // eslint-disable-line

  const playOnce = (n, total) => {
    setCount(n);
    if (!text) { halt(); setNote('অডিও নেই'); return; }
    const ok = speakJa(text, {
      rate: 0.85 * speedRef.current,
      owner,
      onend: (why) => {
        if (why === 'interrupted') return; // যে থামিয়েছে সে-ই অবস্থা সামলেছে
        if (why === 'error') { halt(); setNote('অডিও চালানো যায়নি'); return; }
        if (n < total) timer.current = setTimeout(() => playOnce(n + 1, total), 1500);
        else halt();
      },
    });
    if (!ok) { halt(); setNote('এই ব্রাউজারে অডিও (TTS) সাপোর্ট নেই'); }
  };

  const start = (e, mode) => {
    e?.stopPropagation?.();
    if (playing) return stop();
    setNote('');
    setJft(mode);
    activeRef.current = true;
    setPlaying(true);
    playOnce(1, mode ? 2 : 1);
  };

  const toggleSpeed = (e) => {
    e?.stopPropagation?.();
    const s = speedRef.current === 1 ? 0.75 : 1;
    speedRef.current = s;
    setSpeed(s);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={(e) => start(e, false)}
        aria-label={playing ? 'Stop audio' : 'Play audio'}
        title={note || undefined}
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
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-2 flex-wrap rounded-2xl p-2"
      style={{ background: 'var(--sf2)' }}
    >
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
