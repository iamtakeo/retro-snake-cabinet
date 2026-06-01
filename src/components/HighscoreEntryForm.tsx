import { useState, useEffect } from 'react';
import { DifficultyLevel, ThemeColors, RetroTheme, RETRO_THEMES } from '../types';
import { Sparkles, ArrowUp, ArrowDown } from 'lucide-react';
import { sfx } from '../utils/audio';

interface HighscoreEntryFormProps {
  score: number;
  difficulty: DifficultyLevel;
  theme: RetroTheme;
  themeColors: ThemeColors;
  onSubmit: (initials: string) => void;
}

export default function HighscoreEntryForm({
  score,
  difficulty,
  theme,
  themeColors,
  onSubmit,
}: HighscoreEntryFormProps) {
  const [chars, setChars] = useState<string[]>(['A', 'A', 'A']);
  const [activeIdx, setActiveIdx] = useState<number>(0);

  // Play ascending powerup sound once loaded
  useEffect(() => {
    sfx.playPowerUp();
  }, []);

  // Keyboard navigation for arcade-accuracy
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      sfx.playClick();
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        incrementChar(activeIdx);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        decrementChar(activeIdx);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setActiveIdx((prev) => (prev > 0 ? prev - 1 : 2));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setActiveIdx((prev) => (prev < 2 ? prev + 1 : 0));
      } else if (e.key === 'Enter') {
        const initials = chars.join('');
        onSubmit(initials);
      } else if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        // Direct character typing
        const newChars = [...chars];
        newChars[activeIdx] = e.key.toUpperCase();
        setChars(newChars);
        // Move to next character slot
        if (activeIdx < 2) {
          setActiveIdx(activeIdx + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chars, activeIdx]);

  const incrementChar = (idx: number) => {
    const newChars = [...chars];
    const currentCode = newChars[idx].charCodeAt(0);
    // A to Z
    if (currentCode === 90) {
      newChars[idx] = 'A';
    } else {
      newChars[idx] = String.fromCharCode(currentCode + 1);
    }
    setChars(newChars);
  };

  const decrementChar = (idx: number) => {
    const newChars = [...chars];
    const currentCode = newChars[idx].charCodeAt(0);
    if (currentCode === 65) {
      newChars[idx] = 'Z';
    } else {
      newChars[idx] = String.fromCharCode(currentCode - 1);
    }
    setChars(newChars);
  };

  const handleSub = () => {
    sfx.playPowerUp();
    onSubmit(chars.join(''));
  };

  return (
    <div
      className={`p-6 max-w-sm mx-auto border-2 rounded-md border-current bg-opacity-95 text-center ${themeColors.background} ${themeColors.textPrimary}`}
      id="highscore-entry-panel"
    >
      <div className="flex justify-center items-center gap-1.5 mb-2">
        <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" />
        <h3 className="text-xl font-bold tracking-widest uppercase text-yellow-400">NEW HIGH SCORE!</h3>
      </div>
      
      <p className="text-xs mb-4 opacity-80 leading-relaxed uppercase">
        YOU PLACED ON THE LEADERBOARD IN <span className="underline decoration-dotted">{difficulty}</span> MODE!
      </p>

      <div className="bg-black/40 py-3 rounded border border-white/5 mb-6">
        <p className="text-[11px] opacity-70 tracking-widest uppercase">GRAND SCORE</p>
        <p className="text-3xl font-extrabold text-yellow-300 drop-shadow-[0_0_10px_rgba(234,179,8,0.2)]">
          {score.toLocaleString()}
        </p>
      </div>

      <p className="text-sm font-bold tracking-widest opacity-90 mb-3">ENTER YOUR INITIALS</p>

      {/* Arcade rotating interface */}
      <div className="flex justify-center items-center gap-6 mb-6" id="initials-selector">
        {chars.map((char, idx) => {
          const isActive = idx === activeIdx;
          return (
            <div key={idx} className="flex flex-col items-center">
              {/* Up Button */}
              <button
                onClick={() => {
                  sfx.playClick();
                  incrementChar(idx);
                  setActiveIdx(idx);
                }}
                className={`p-1 mb-1 border hover:bg-stone-800 rounded transition-colors ${
                  isActive ? 'border-current text-white scale-110' : 'border-stone-800 opacity-40'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>

              {/* Character Box */}
              <div
                onClick={() => {
                  sfx.playClick();
                  setActiveIdx(idx);
                }}
                className={`w-14 h-16 flex items-center justify-center text-3xl font-bold rounded cursor-pointer transition-all ${
                  isActive
                    ? `bg-white text-black font-extrabold ${themeColors.glowClass} scale-105`
                    : 'bg-black/35 border border-stone-800 border-dashed text-opacity-70'
                }`}
              >
                {char}
              </div>

              {/* Down Button */}
              <button
                onClick={() => {
                  sfx.playClick();
                  decrementChar(idx);
                  setActiveIdx(idx);
                }}
                className={`p-1 mt-1 border hover:bg-stone-800 rounded transition-colors ${
                  isActive ? 'border-current text-white scale-110' : 'border-stone-800 opacity-40'
                }`}
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSub}
        className="w-full py-3 bg-green-950/25 hover:bg-green-500/10 border-2 border-current rounded uppercase font-bold text-sm tracking-widest cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
        id="submit-score-btn"
      >
        REGISTER SCORE (ENTER)
      </button>

      <p className="text-[10px] mt-4 opacity-50 tracking-wide font-mono uppercase">
        USE ARROW KEYS / WASD OR LETTERS TO SELECT
      </p>
    </div>
  );
}
