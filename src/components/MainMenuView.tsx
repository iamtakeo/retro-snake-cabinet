import { Gamepad2, Info } from 'lucide-react';
import { HighScoreEntry, DifficultyLevel, RetroTheme } from '../types';
import ScoreBoard from './ScoreBoard';
import { sfx } from '../utils/audio';

interface MainMenuViewProps {
  menuView: 'main' | 'records';
  highscores: HighScoreEntry[];
  difficulty: DifficultyLevel;
  theme: RetroTheme;
  themeColors: any;
  coins: number;
  onStartGame: () => void;
  onOpenSettings: () => void;
  onOpenShop: () => void;
  onSetMenuView: (view: 'main' | 'records') => void;
  onClearScores: () => void;
}

export default function MainMenuView({
  menuView,
  highscores,
  difficulty,
  theme,
  themeColors,
  coins,
  onStartGame,
  onOpenSettings,
  onOpenShop,
  onSetMenuView,
  onClearScores,
}: MainMenuViewProps) {
  const getPulseClass = () => {
    if (theme === 'GREEN_PHOSPHOR') return 'hover:animate-pulse-green border-green-500/40 text-green-400';
    if (theme === 'CYBERPUNK') return 'hover:animate-pulse-pink border-pink-500/40 text-pink-400';
    if (theme === 'AMBER_CRT') return 'hover:animate-pulse-amber border-amber-500/40 text-amber-400';
    if (theme === 'MONOCHROME_POCKET') return 'hover:shadow-[0_0_8px_rgba(255,255,255,0.25)] border-neutral-500 text-neutral-200';
    return 'hover:shadow-sm border-stone-400 text-stone-700';
  };

  if (menuView === 'records') {
    return (
      <ScoreBoard
        scores={highscores}
        currentDifficulty={difficulty}
        theme={theme}
        onClearScores={onClearScores}
        onClose={() => {
          sfx.playClick();
          onSetMenuView('main');
        }}
      />
    );
  }

  return (
    <div
      className={`w-full border-4 p-8 text-center rounded-md ${themeColors.borderClass} ${themeColors.background} ${themeColors.textPrimary} transition-all`}
      id="main-menu-view"
    >
      <div className="flex justify-center mb-3">
        <Gamepad2 className="w-12 h-12 text-[#ffffff] drop-shadow-[0_0_10px_rgba(255,255,255,0.15)] animate-bounce" />
      </div>
      
      <h2 className="text-4xl font-extrabold tracking-widest uppercase mb-4 animate-pulse">
        INSERT COIN
      </h2>
      
      <p className="text-xs mb-8 opacity-75 uppercase leading-relaxed max-w-xs mx-auto">
        A high-performance offline arcade challenge tailored for Chromebook platforms.
      </p>

      <div className="space-y-3 mb-6">
        <button
          onClick={onStartGame}
          className={`w-full py-3 bg-white/10 backdrop-blur-md border font-extrabold rounded hover:bg-white hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer uppercase text-xs tracking-widest ${getPulseClass()}`}
          id="menu-start-btn"
        >
          START GAME (ENTER)
        </button>

        <button
          onClick={onOpenShop}
          className="w-full py-2.5 bg-yellow-500/10 border border-yellow-500/60 text-yellow-400 text-xs rounded hover:bg-yellow-500 hover:text-black hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer uppercase font-black tracking-widest flex items-center justify-center gap-2"
          id="menu-shop-btn"
        >
          🛒 CUSTOMS SHOP ({coins} 🪙)
        </button>

        <button
          onClick={onOpenSettings}
          className={`w-full py-2.5 bg-black/35 backdrop-blur-sm border text-xs rounded hover:bg-white/5 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer uppercase font-bold tracking-widest text-opacity-90 ${getPulseClass()}`}
          id="menu-config-btn"
        >
          CONFIG SETTINGS
        </button>

        {highscores.length > 0 && (
          <button
            onClick={() => {
              sfx.playClick();
              onSetMenuView('records');
            }}
            className={`w-full py-2.5 bg-black/35 backdrop-blur-sm border text-xs rounded hover:bg-white/5 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer uppercase font-bold tracking-widest text-opacity-90 ${getPulseClass()}`}
            id="menu-records-btn"
          >
            HALL OF FAME (SCORES)
          </button>
        )}
      </div>

      {/* Minimalist guide summary */}
      <div className="bg-black/25 p-3 rounded text-[11px] opacity-70 flex items-center justify-center gap-2 border border-current border-opacity-10 border-dashed">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span className="uppercase text-left leading-normal text-[10px]">
          Arrows/WASD to steer. Space to pause. No lag, high speed.
        </span>
      </div>
    </div>
  );
}
