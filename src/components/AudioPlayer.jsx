import React, { useRef, useState } from 'react';
import { Play, Pause, Repeat, Gauge } from 'lucide-react';

export default function AudioPlayer({ src, compact = false }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [isJftMode, setIsJftMode] = useState(false);
  const [speed, setSpeed] = useState(1);

  const handlePlay = (jft = false) => {
    if (!audioRef.current) return;
    if (isPlaying && isJftMode === jft) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    setIsJftMode(jft);
    setPlayCount(1);
    audioRef.current.currentTime = 0;
    audioRef.current.playbackRate = speed;
    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        setIsPlaying(false);
        alert("অডিও ফাইল পাওয়া যায়নি। public/audio/ ফোল্ডারে MP3 রাখুন।");
      });
  };

  const handleEnded = () => {
    if (isJftMode && playCount < 2) {
      setTimeout(() => {
        setPlayCount(2);
        if (audioRef.current) audioRef.current.play().catch(() => setIsPlaying(false));
      }, 1500);
    } else {
      setIsPlaying(false);
      setIsJftMode(false);
      setPlayCount(0);
    }
  };

  const toggleSpeed = () => {
    const newSpeed = speed === 1 ? 0.75 : 1;
    setSpeed(newSpeed);
    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
  };

  if (compact) {
    return (
      <div>
        <audio ref={audioRef} src={src} onEnded={handleEnded} />
        <button
          onClick={() => handlePlay(false)}
          className={`p-2.5 rounded-full transition ${
            isPlaying ? 'bg-amber-500 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
          }`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
      <audio ref={audioRef} src={src} onEnded={handleEnded} />
      <button
        onClick={() => handlePlay(false)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
          isPlaying && !isJftMode ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {isPlaying && !isJftMode ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        <span>Play</span>
      </button>

      <button
        onClick={() => handlePlay(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
          isPlaying && isJftMode ? 'bg-emerald-700 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'
        }`}
      >
        <Repeat className="w-3.5 h-3.5" />
        <span>2x {isJftMode ? `(${playCount}/2)` : ''}</span>
      </button>

      <button
        onClick={toggleSpeed}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 ml-auto"
      >
        <Gauge className="w-3.5 h-3.5 text-indigo-500" />
        <span>{speed}x</span>
      </button>
    </div>
  );
}
