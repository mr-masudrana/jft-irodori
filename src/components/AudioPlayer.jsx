import React, { useRef, useState } from 'react';

export default function AudioPlayer({ src }) {
  const audioRef = useRef(null);
  const [playCount, setPlayCount] = useState(0);
  const [isJftMode, setIsJftMode] = useState(false);
  const [speed, setSpeed] = useState(1);

  const handlePlay = (jft = false) => {
    setIsJftMode(jft);
    setPlayCount(1);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = speed;
      audioRef.current.play().catch(() => {
        alert("অডিও ফাইলটি পাওয়া যায়নি। দয়া করে public/audio/ ফোল্ডারে MP3 ফাইলটি রাখুন।");
      });
    }
  };

  const handleEnded = () => {
    if (isJftMode && playCount < 2) {
      setTimeout(() => {
        setPlayCount(2);
        if (audioRef.current) audioRef.current.play();
      }, 1500);
    } else {
      setIsJftMode(false);
      setPlayCount(0);
    }
  };

  const toggleSpeed = () => {
    const newSpeed = speed === 1 ? 0.75 : 1;
    setSpeed(newSpeed);
    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
  };

  return (
    <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
      <audio ref={audioRef} src={src} onEnded={handleEnded} />
      
      <button
        onClick={() => handlePlay(false)}
        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700"
      >
        ▶ Play (1x)
      </button>

      <button
        onClick={() => handlePlay(true)}
        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-md hover:bg-emerald-700"
      >
        🔁 JFT Exam (2x) {isJftMode ? `[${playCount}/2]` : ''}
      </button>

      <button
        onClick={toggleSpeed}
        className="px-2.5 py-1.5 bg-white text-slate-700 text-xs font-medium rounded-md border border-slate-300"
      >
        Speed: {speed}x
      </button>
    </div>
  );
}
