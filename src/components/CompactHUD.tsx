import { ThemeColors } from '../types';

interface CompactHUDProps {
  score: number;
  maxDifficultyHighscore: number;
  timerSeconds: number;
  themeColors: ThemeColors;
  tension?: number;
  rivals?: any[];
  rivalCpuLabel?: string;
  biome?: string;
}

export default function CompactHUD({
  score,
  maxDifficultyHighscore,
  timerSeconds,
  themeColors,
  tension = 0.0,
  rivals = [],
  rivalCpuLabel = '',
  biome = 'GLITCH_VOID',
}: CompactHUDProps) {
  // Determine tension bar color and label based on active dread levels
  const getTensionStyle = () => {
    if (tension > 0.72) return { color: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]', label: 'DANGER ZONE' };
    if (tension > 0.48) return { color: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]', label: 'PEAK FLOW' };
    if (tension > 0.24) return { color: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]', label: 'STEADY FLOW' };
    return { color: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]', label: 'CALM DRIFT' };
  };

  const { color, label } = getTensionStyle();
  const percentage = Math.round(tension * 100);

  return (
    <div className="w-full mb-3 px-1 flex flex-col gap-2 font-mono uppercase text-xs leading-none">
      <div className={`w-full flex items-center justify-between ${themeColors.textPrimary}`}>
        <div className="flex flex-col">
          <span className="opacity-50 text-[9px] tracking-widest">SCORE</span>
          <span className="text-base font-black text-yellow-400 tracking-wider mt-0.5">
            {score.toLocaleString(undefined, { minimumIntegerDigits: 5, useGrouping: false })}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className="opacity-50 text-[9px] tracking-widest">BEST</span>
          <span className="text-sm font-semibold text-green-400 tracking-widest mt-1">
            {Math.max(maxDifficultyHighscore, score).toLocaleString(undefined, { minimumIntegerDigits: 5, useGrouping: false })}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="opacity-50 text-[9px] tracking-widest">TIME</span>
          <span className="text-base font-bold text-cyan-400 tracking-wider mt-0.5">
            {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Dynamic L4D AI Director Dread Telemetry Bar widget */}
      <div className={`w-full flex flex-col gap-1.5 bg-black/40 border border-current border-opacity-15 p-1.5 rounded-sm ${themeColors.textPrimary}`}>
        <div className="w-full flex items-center justify-between gap-3">
          <span className="text-[8px] opacity-60 font-bold shrink-0 tracking-widest">AI DIRECTOR: {label}</span>
          
          {/* Telemetry bar wrapper */}
          <div className="flex-grow h-1.5 bg-neutral-900/60 rounded-full overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-300 ease-out rounded-full ${color}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          <span className="text-[9px] opacity-80 shrink-0 font-mono tracking-tighter w-8 text-right font-black">{percentage}%</span>
        </div>

        {/* Dynamic Biome environment and active Rival CPU warning panel */}
        <div className="w-full flex items-center justify-between gap-2 border-t border-dashed border-current border-opacity-10 pt-1.5 mt-0.5 text-[8px] tracking-widest font-bold">
          <span className="opacity-75">
            GRID BIOME: <span className="text-yellow-400 font-extrabold">{biome.replace('_', ' ')}</span>
          </span>
          {rivals && rivals.length > 0 ? (
            <span className="text-rose-500 animate-pulse flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-rose-500 animate-ping"></span>
              RIVAL ACTIVE ({rivalCpuLabel || 'STABILIZED'})
            </span>
          ) : (
            <span className="opacity-45 text-[7px] tracking-wider shrink-0 font-mono">SECTOR SECURE</span>
          )}
        </div>
      </div>
    </div>
  );
}
