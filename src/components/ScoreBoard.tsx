import { useState, useEffect } from 'react';
import { HighScoreEntry, DifficultyLevel, RetroTheme, RETRO_THEMES } from '../types';
import { Trophy, Clock, Target, Trash2, Globe, Sparkles } from 'lucide-react';
import { sfx } from '../utils/audio';

interface ScoreBoardProps {
  scores: HighScoreEntry[];
  currentDifficulty: DifficultyLevel;
  theme: RetroTheme;
  onClearScores: () => void;
  onClose: () => void;
}

export default function ScoreBoard({
  scores,
  currentDifficulty,
  theme,
  onClearScores,
  onClose,
}: ScoreBoardProps) {
  const [filter, setFilter] = useState<DifficultyLevel | 'ALL'>(currentDifficulty);
  const colors = RETRO_THEMES[theme];

  // Filter high scores
  const filteredScores = scores
    .filter((entry) => filter === 'ALL' || entry.difficulty === filter)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Show top 10

  const handleDifficultyClick = (level: DifficultyLevel | 'ALL') => {
    sfx.playClick();
    setFilter(level);
  };

  return (
    <div className={`p-6 border border-current rounded-md bg-opacity-95 ${colors.background} ${colors.textPrimary}`} id="scoreboard-modal">
      <div className="flex items-center justify-between mb-6 border-b border-dashed pb-4" id="scoreboard-header">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 animate-pulse" />
          <h2 className="text-2xl font-bold tracking-widest font-mono">HIGH SCORES</h2>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1 text-sm border hover:bg-stone-800 border-current font-mono rounded cursor-pointer leading-tight transition-colors"
          id="scoreboard-close-btn"
        >
          [ESC] CLOSE
        </button>
      </div>

      {/* Difficulty Filters */}
      <div className="flex flex-wrap gap-2 mb-6" id="scoreboard-filters">
        {(['ALL', 'PRACTICE', 'NORMAL', 'CHALLENGE', 'IMPOSSIBLE'] as const).map((level) => (
          <button
            key={level}
            onClick={() => handleDifficultyClick(level)}
            className={`px-3 py-1.5 text-xs font-bold border rounded font-mono uppercase tracking-wider cursor-pointer transition-colors ${
              filter === level
                ? `bg-stone-100 text-black border-white ${colors.glowClass}`
                : 'border-current hover:bg-stone-900/40 text-opacity-85'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Scores Table */}
      <div className="min-h-[250px] overflow-y-auto mb-6" id="scoreboard-table-container">
        {filteredScores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center opacity-60 font-mono text-sm leading-6">
            <Target className="w-10 h-10 mb-2 opacity-50 stroke-[1.5]" />
            <p>NO HIGH SCORES RECORDED</p>
            <p className="text-xs mt-1">CHALLENGE THE GAME TO CLAIM A POSITION!</p>
          </div>
        ) : (
          <div className="space-y-2.5 font-mono text-sm" id="score-rows">
            {/* Table Header */}
            <div className="grid grid-cols-12 pb-1 border-b border-dashed border-opacity-35 text-[11px] uppercase tracking-wider font-bold opacity-70">
              <span className="col-span-2 text-center">RANK</span>
              <span className="col-span-3">PLAYER</span>
              <span className="col-span-3 text-right">SCORE</span>
              <span className="col-span-4 text-right">DIFFICULTY</span>
            </div>

            {/* List Rows */}
            {filteredScores.map((entry, index) => {
              const rank = index + 1;
              let medalPrefix = '';
              if (rank === 1) medalPrefix = '🥇 ';
              else if (rank === 2) medalPrefix = '🥈 ';
              else if (rank === 3) medalPrefix = '🥉 ';

              return (
                <div
                  key={entry.id}
                  className={`grid grid-cols-12 py-1.5 items-center hover:bg-white/5 px-2 rounded transition-colors ${
                    rank <= 3 ? 'font-bold' : 'text-opacity-90'
                  }`}
                >
                  <span className="col-span-2 text-center font-bold">
                    {medalPrefix ? medalPrefix : `${rank}`}
                  </span>
                  <span className="col-span-3 tracking-widest text-[#ffffff] uppercase font-bold">
                    {entry.name}
                  </span>
                  <span className="col-span-3 text-right text-yellow-400 font-bold">
                    {entry.score.toLocaleString()}
                  </span>
                  <span className="col-span-4 text-right text-xs opacity-80 uppercase font-medium">
                    {entry.difficulty}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leaderboard Management Controls */}
      <div className="flex items-center justify-between border-t border-dashed pt-4" id="scoreboard-footer">
        <p className="text-[11px] opacity-60 font-mono uppercase tracking-wide">
          PERSISTED IN CHROMEBOOK SECURE CACHE
        </p>

        {scores.length > 0 && (
          <button
            onClick={() => {
              sfx.playClick();
              if (confirm('ARE YOU SURE YOU WANT TO FORMAT LEADERBOARD MEMORY?')) {
                onClearScores();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-950/40 hover:bg-red-900/30 border border-red-500/30 hover:border-red-500/60 text-red-400 font-mono text-xs rounded transition-colors"
            id="scoreboard-clear-btn"
          >
            <Trash2 className="w-3.5 h-3.5" />
            CLEAR ALL
          </button>
        )}
      </div>
    </div>
  );
}
