import React, { useState, useEffect } from 'react';
import { AlertTriangle, Sparkles, Check } from 'lucide-react';
import { DifficultyLevel, RetroTheme, ThemeColors } from '../types';
import { sfx } from '../utils/audio';

interface GameOverViewProps {
  score: number;
  difficulty: DifficultyLevel;
  theme: RetroTheme;
  themeColors: ThemeColors;
  coinsEarnedThisRun: number;
  totalCoins: number;
  checkHighscoreQualification: (score: number) => boolean;
  onSubmitHighscore: (initials: string) => void;
  onStartGame: () => void;
  onReturnToMenu: () => void;
  onProvideFeedback?: (feedback: 'EASY' | 'JUST_RIGHT' | 'HARD') => void;
  adaptiveSpeedOffsetMs?: number;
  adaptiveComplexityOffset?: number;
}

export default function GameOverView({
  score,
  difficulty,
  theme,
  themeColors,
  coinsEarnedThisRun,
  totalCoins,
  checkHighscoreQualification,
  onSubmitHighscore,
  onStartGame,
  onReturnToMenu,
  onProvideFeedback,
  adaptiveSpeedOffsetMs = 0,
  adaptiveComplexityOffset = 0,
}: GameOverViewProps) {
  const [feedbackGiven, setFeedbackGiven] = useState<'EASY' | 'JUST_RIGHT' | 'HARD' | null>(null);
  const [initials, setInitials] = useState('');
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const hasQualified = checkHighscoreQualification(score);
  const hasInitials = initials.trim().length > 0;

  const handlePlayAgainAction = () => {
    if (hasQualified && hasInitials && !scoreSubmitted) {
      onSubmitHighscore(initials.toUpperCase().trim());
      setScoreSubmitted(true);
      sfx.playPowerUp();
    }
    onStartGame();
  };

  const handleReturnToMenuAction = () => {
    if (hasQualified && hasInitials && !scoreSubmitted) {
      onSubmitHighscore(initials.toUpperCase().trim());
      setScoreSubmitted(true);
      sfx.playPowerUp();
    }
    onReturnToMenu();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.stopPropagation(); // Stop triggering global play-again keybinds
      handlePlayAgainAction();
    } else if (e.key === ' ') {
      e.stopPropagation(); // Stop spacebar restart actions during entry
    }
  };

  // Add global window event listener to allow instant 'Enter' retry while auto-saving
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // If user is focused on the input element, let the local keydown handler handle it
      if (document.activeElement?.id === 'highscore-initials-input') {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        handlePlayAgainAction();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [initials, scoreSubmitted, hasQualified]);

  const playAgainLabel = hasInitials ? 'SAVE & PLAY AGAIN (ENTER)' : 'PLAY AGAIN (ENTER)';
  const mainMenuLabel = hasInitials ? 'SAVE & RETURN TO MENU' : 'MAIN MENU';

  return (
    <div
      className={`w-full border-4 p-4 text-center rounded-md ${themeColors.borderClass} ${themeColors.background} ${themeColors.textPrimary}`}
      id="game-over-view"
    >
      <h2 className="text-xl font-extrabold tracking-widest text-red-500 uppercase mb-2 flex items-center justify-center gap-1.5 animate-pulse">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        GAME OVER
      </h2>

      {/* Compact Score & Coins Row */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-black/35 py-1.5 px-2 rounded border border-current border-opacity-10 leading-tight">
          <p className="text-[8px] opacity-70 tracking-wider uppercase">FINAL SCORE</p>
          <p className="text-base font-black text-white">{score.toLocaleString()}</p>
          <p className="text-[8px] opacity-65">MODE: {difficulty}</p>
        </div>
        <div className="bg-black/35 py-1.5 px-2 rounded border border-yellow-500/20 space-y-0.5 text-yellow-400 leading-tight">
          <p className="text-[8px] opacity-80 tracking-wider uppercase">COINS HARVESTED</p>
          <p className="text-base font-black">{coinsEarnedThisRun > 0 ? `+${coinsEarnedThisRun}` : '0'} 🪙</p>
          <p className="text-[8px] opacity-65">TOTAL: {totalCoins}</p>
        </div>
      </div>

      {/* Dynamic Difficulty Feedback Widget (Ultra-Compact) */}
      <div className="mb-2 p-1.5 bg-black/45 border border-current border-opacity-10 rounded text-left font-mono flex items-center justify-between text-[8px]">
        <div className="flex flex-col gap-0.5 max-w-[40%]">
          <span className="font-black uppercase opacity-75">CALIBRATE DIFFICULTY</span>
          <div className="flex gap-1 text-[7px] opacity-70">
            {adaptiveSpeedOffsetMs !== 0 && (
              <span className="text-cyan-400 font-bold bg-cyan-950/45 px-0.5 rounded text-[6.5px]">SPD:{adaptiveSpeedOffsetMs > 0 ? `+${adaptiveSpeedOffsetMs}` : `${adaptiveSpeedOffsetMs}`}</span>
            )}
            {adaptiveComplexityOffset !== 0 && (
              <span className="text-pink-400 font-bold bg-pink-950/45 px-0.5 rounded text-[6.5px]">DEN:{adaptiveComplexityOffset > 0 ? `+${adaptiveComplexityOffset}` : `${adaptiveComplexityOffset}`}</span>
            )}
          </div>
        </div>
        
        <div className="flex gap-1 items-center flex-grow justify-end max-w-[60%]">
          {(['EASY', 'JUST_RIGHT', 'HARD'] as const).map((feed) => {
            const label = feed === 'EASY' ? '🟢 EASY' : feed === 'JUST_RIGHT' ? '🟡 OK' : '🔴 HARD';
            const activeColor = feed === 'EASY' ? 'bg-green-500 text-black font-extrabold border-white' : feed === 'JUST_RIGHT' ? 'bg-yellow-500 text-black font-extrabold border-white' : 'bg-red-500 text-black font-extrabold border-white';
            const borderColor = feed === 'EASY' ? 'border-green-500/40 text-green-400 hover:bg-green-500/10' : feed === 'JUST_RIGHT' ? 'border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10' : 'border-red-500/40 text-red-500 hover:bg-red-500/10';
            
            return (
              <button
                key={feed}
                onClick={() => {
                  if (feedbackGiven) return;
                  sfx.playClick();
                  setFeedbackGiven(feed);
                  if (onProvideFeedback) onProvideFeedback(feed);
                }}
                disabled={feedbackGiven !== null}
                className={`py-0.5 px-1.5 border rounded text-[7.5px] font-bold text-center block transition-all uppercase cursor-pointer ${
                  feedbackGiven === feed
                    ? `${activeColor} scale-[1.01]`
                    : feedbackGiven
                    ? 'opacity-25 border-stone-850 pointer-events-none'
                    : borderColor
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* OPTIONAL Highscore Entry Section */}
      {hasQualified && (
        <div className="mb-2 p-2 bg-black/55 border border-yellow-500/25 rounded font-mono text-left">
          {!scoreSubmitted ? (
            <div className="flex items-center justify-between gap-2">
              <label className="text-[8.5px] font-bold uppercase text-yellow-400 block tracking-wider animate-pulse flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 animate-spin text-yellow-400" style={{ animationDuration: '3s' }} />
                <span>🏆 NEW HIGH SCORE! INITIALS:</span>
              </label>
              <div className="flex items-center gap-1 flex-grow justify-end">
                <input
                  type="text"
                  maxLength={3}
                  placeholder="AAA"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 3))}
                  onKeyDown={handleInputKeyDown}
                  className="w-12 bg-neutral-950 border border-yellow-500/35 text-center font-bold uppercase py-0.5 text-xs text-yellow-400 rounded focus:outline-none focus:border-yellow-400 transition-colors animate-pulse"
                  id="highscore-initials-input"
                  title="Type initials (optional, auto-saves on play)"
                />
                <span className="text-[7.5px] text-yellow-400/60 font-bold tracking-widest">(OPTIONAL)</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 py-0.5 text-green-400 font-bold text-[8.5px] uppercase tracking-wider">
              <Check className="w-3 h-3 animate-pulse" />
              <span>RECORD REGISTERED SUCCESSFULLY!</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons (Always skip-able & visible!) */}
      <div className="space-y-1.5">
        <button
          onClick={handlePlayAgainAction}
          className="w-full py-2 bg-white text-black font-extrabold rounded hover:bg-stone-100 uppercase text-xs tracking-widest cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md animate-pulse"
          id="gameover-retry-btn"
        >
          {playAgainLabel}
        </button>

        <button
          onClick={handleReturnToMenuAction}
          className="w-full py-1.5 bg-black/45 hover:bg-stone-900 border border-current text-xs text-opacity-80 rounded uppercase cursor-pointer transition-colors"
        >
          {mainMenuLabel}
        </button>
      </div>
    </div>
  );
}
