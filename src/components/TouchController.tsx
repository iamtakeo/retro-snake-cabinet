import { Direction, ThemeColors } from '../types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, Pause } from 'lucide-react';
import { sfx } from '../utils/audio';

interface TouchControllerProps {
  onDirectionChange: (dir: Direction) => void;
  currentDirection: Direction;
  onTogglePause: () => void;
  isPaused: boolean;
  isPlaying: boolean;
  themeColors: ThemeColors;
}

export default function TouchController({
  onDirectionChange,
  currentDirection,
  onTogglePause,
  isPaused,
  isPlaying,
  themeColors,
}: TouchControllerProps) {
  const handlePress = (dir: Direction) => {
    sfx.playMove();
    onDirectionChange(dir);
  };

  const buttonStyle = (active: boolean) => {
    return `w-14 h-14 flex items-center justify-center rounded-full border-2 transition-all cursor-pointer active:scale-90 ${
      active
        ? 'bg-white text-black border-white shadow-md'
        : 'border-current opacity-70 hover:opacity-100 hover:bg-stone-800'
    }`;
  };

  if (!isPlaying) return null;

  return (
    <div className={`mt-5 p-3.5 max-w-sm mx-auto border border-current border-dashed rounded-md flex flex-col items-center select-none ${themeColors.textPrimary}`} id="touch-controls-panel">
      {/* D-PAD Shape */}
      <div className="relative w-44 h-44" id="dpad-container">
        {/* NORTH */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <button
            onClick={() => handlePress('UP')}
            className={buttonStyle(currentDirection === 'UP')}
            title="Move Up"
          >
            <ArrowUp className="w-6 h-6" />
          </button>
        </div>

        {/* WEST */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2">
          <button
            onClick={() => handlePress('LEFT')}
            className={buttonStyle(currentDirection === 'LEFT')}
            title="Move Left"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* CENTER PAUSE CONTROL */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <button
            onClick={() => {
              sfx.playClick();
              onTogglePause();
            }}
            className={`w-12 h-12 flex items-center justify-center rounded-full border border-dashed transition-all cursor-pointer active:scale-90 ${
              isPaused
                ? 'bg-amber-500/25 text-amber-400 border-amber-400 animate-pulse'
                : 'border-current bg-black/40 hover:bg-white/10 opacity-70 hover:opacity-100'
            }`}
            title={isPaused ? 'Resume Game' : 'Pause Game'}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>

        {/* EAST */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <button
            onClick={() => handlePress('RIGHT')}
            className={buttonStyle(currentDirection === 'RIGHT')}
            title="Move Right"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {/* SOUTH */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <button
            onClick={() => handlePress('DOWN')}
            className={buttonStyle(currentDirection === 'DOWN')}
            title="Move Down"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
