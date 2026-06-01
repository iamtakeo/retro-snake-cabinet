import { Sliders, Keyboard, Map, Plus, Minus, Zap, Activity, Wind, Eye, Trash2, Coins } from 'lucide-react';
import { RetroTheme, DIFFICULTY_CONFIGS } from '../types';
import { ArenaType } from '../utils/arenaManager';
import { sfx } from '../utils/audio';
import { useGame } from '../context/GameContext';

interface DesktopRightPanelProps {
  pressedKeys: Record<string, boolean>;
  currentDirection: string;
}

export default function DesktopRightPanel({
  pressedKeys,
  currentDirection,
}: DesktopRightPanelProps) {
  const {
    themeColors,
    difficulty,
    adaptiveSpeedOffsetMs,
    setAdaptiveSpeedOffsetMs,
    adaptiveComplexityOffset,
    setAdaptiveComplexityOffset,
    arenaType,
    setArenaType,
    foodMode,
    setFoodMode,
    bulletTime,
    setBulletTime,
    growthFactor,
    setGrowthFactor,
    coinYield,
    setCoinYield,
    laserGates,
    setLaserGates,
    slipstream,
    setSlipstream,
  } = useGame();

  const availableArenas: { key: ArenaType | 'RANDOM'; label: string; size: string }[] = [
    { key: 'CLASSIC_EMPTY', label: 'NEON FLATLAND', size: '25x25' },
    { key: 'BOX_CORRIDOR', label: 'CORRIDOR GRIDS', size: '25x25' },
    { key: 'CROSS_LABYRINTH', label: 'SECTOR-X MAZE', size: '25x25' },
    { key: 'SCATTERED_RUINS', label: 'SCATTER MATRIX', size: '25x25' },
    { key: 'GREAT_WALLS', label: 'DIVISION WALL', size: '25x25' },
    { key: 'LARGE_EXPANSION', label: 'DEEP EXPANSION', size: '50x50' },
    { key: 'RANDOM', label: 'RANDOM SELECTION', size: 'DYNAMIC' },
  ];

  // Handle direct speed offset manual tweaks
  const modifySpeedOffset = (dir: 'up' | 'down') => {
    sfx.playClick();
    setAdaptiveSpeedOffsetMs(prev => {
      const next = dir === 'up' ? prev + 10 : prev - 10;
      return Math.max(-100, Math.min(100, next));
    });
  };

  // Handle complexity offset manual tweaks 
  const modifyComplexityOffset = (dir: 'up' | 'down') => {
    sfx.playClick();
    setAdaptiveComplexityOffset(prev => {
      const next = dir === 'up' ? prev + 1 : prev - 1;
      return Math.max(-3, Math.min(3, next));
    });
  };

  // Key visualizer activation helper
  const isKeyActive = (keys: string[], dirCheck?: string) => {
    if (dirCheck && currentDirection === dirCheck) return true;
    return keys.some(key => pressedKeys[key.toLowerCase()] || pressedKeys[key]);
  };

  return (
    <div 
      className={`hidden lg:flex flex-col gap-4 w-80 p-4.5 border-4 rounded-md h-[calc(100vh-32px)] overflow-y-auto ${themeColors.borderClass} ${themeColors.background} ${themeColors.textPrimary} transition-all duration-300 font-mono`}
      id="desktop-right-cabinet-panel"
      style={{ scrollbarWidth: 'thin' }}
    >
      {/* SECTION 1: CAB CALIBRATION TWEAKS */}
      <div className="border-b border-dashed border-current border-opacity-20 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-4 h-4 text-cyan-400 animate-pulse animate-duration-3000" />
          <h3 className="text-xs font-black tracking-widest uppercase text-white">CALIBRATION DECK</h3>
        </div>

        {/* Speed Calibration */}
        <div className="space-y-1 mb-2.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="uppercase opacity-75">SPEED BIAS OFFSET:</span>
            <span className={`font-bold transition-all ${adaptiveSpeedOffsetMs > 0 ? 'text-red-400' : adaptiveSpeedOffsetMs < 0 ? 'text-green-400' : 'text-stone-400'}`}>
              {adaptiveSpeedOffsetMs > 0 ? `+${adaptiveSpeedOffsetMs}ms (SLOWER)` : adaptiveSpeedOffsetMs < 0 ? `${adaptiveSpeedOffsetMs}ms (FASTER)` : '0ms (DEFAULT)'}
            </span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => modifySpeedOffset('down')}
              className="flex-1 py-1 px-2 bg-white/5 hover:bg-white/15 border border-white/10 rounded flex items-center justify-center gap-1 cursor-pointer font-bold text-[9px] text-white"
            >
              <Minus className="w-2.5 h-2.5 text-green-400" />
              <span>SPARK</span>
            </button>
            <button
              onClick={() => modifySpeedOffset('up')}
              className="flex-1 py-1 px-2 bg-white/5 hover:bg-white/15 border border-white/10 rounded flex items-center justify-center gap-1 cursor-pointer font-bold text-[9px] text-white"
            >
              <Plus className="w-2.5 h-2.5 text-red-400" />
              <span>CHILL</span>
            </button>
          </div>
        </div>

        {/* Complexity/Obstacle Calibration */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="uppercase opacity-75">BARRIER COMPLEXITY:</span>
            <span className={`font-bold transition-all ${adaptiveComplexityOffset > 0 ? 'text-red-400' : adaptiveComplexityOffset < 0 ? 'text-green-400' : 'text-stone-400'}`}>
              {adaptiveComplexityOffset > 0 ? `+${adaptiveComplexityOffset} (DENSE)` : adaptiveComplexityOffset < 0 ? `${adaptiveComplexityOffset} (SPACIOUS)` : 'DEFAULT'}
            </span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => modifyComplexityOffset('down')}
              className="flex-1 py-1 px-2 bg-white/5 hover:bg-white/15 border border-white/10 rounded flex items-center justify-center gap-1 cursor-pointer font-bold text-[9px] text-white"
            >
              <Minus className="w-2.5 h-2.5 text-green-400" />
              <span>CLEAR</span>
            </button>
            <button
              onClick={() => modifyComplexityOffset('up')}
              className="flex-1 py-1 px-2 bg-white/5 hover:bg-white/15 border border-white/10 rounded flex items-center justify-center gap-1 cursor-pointer font-bold text-[9px] text-white"
            >
              <Plus className="w-2.5 h-2.5 text-red-400" />
              <span>DENSE</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: EXPANDED GAMEPLAY MODIFIERS */}
      <div className="border-b border-dashed border-current border-opacity-20 pb-3 text-[10px] space-y-3">
        {/* Risk & Yield calibrator */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-wider block opacity-75 flex items-center gap-1">
            <Coins className="w-3 h-3 text-yellow-500" /> RISK & YIELD MULTIPLIER
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(['SAFE', 'NORMAL', 'HIGH_STAKES'] as const).map((y) => (
              <button
                key={y}
                onClick={() => {
                  sfx.playClick();
                  setCoinYield(y);
                }}
                className={`py-1 text-[8.5px] font-bold rounded border cursor-pointer uppercase transition-colors text-center block ${
                  coinYield === y
                    ? 'bg-yellow-500 text-black border-yellow-400 font-extrabold'
                    : 'border-white/10 hover:bg-white/5 text-stone-400'
                }`}
              >
                {y.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Bullet-Time reflex */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-wider block opacity-75 flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" /> PROXIMITY REFLEX SLOW
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['ON', 'OFF'] as const).map((pref) => (
              <button
                key={pref}
                onClick={() => {
                  sfx.playClick();
                  setBulletTime(pref);
                }}
                className={`py-1 text-[8.5px] font-bold rounded border cursor-pointer uppercase transition-colors text-center block ${
                  bulletTime === pref
                    ? 'bg-cyan-500 text-black border-cyan-400 font-extrabold'
                    : 'border-white/10 hover:bg-white/5 text-stone-400'
                }`}
              >
                {pref === 'ON' ? 'COMPENSATE' : 'OFF'}
              </button>
            ))}
          </div>
        </div>

        {/* Growth scale calibrator */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-wider block opacity-75 flex items-center gap-1">
            <Activity className="w-3 h-3 text-pink-500" /> SNAKE METABOLIC GROWTH
          </label>
          <div className="grid grid-cols-3 gap-1">
            {([0, 1, 2] as const).map((val) => (
              <button
                key={val}
                onClick={() => {
                  sfx.playClick();
                  setGrowthFactor(val);
                }}
                className={`py-1 text-[8.5px] font-bold rounded border cursor-pointer uppercase transition-colors text-center block ${
                  growthFactor === val
                    ? 'bg-pink-500 text-black border-pink-400 font-extrabold'
                    : 'border-white/10 hover:bg-white/5 text-stone-400'
                }`}
              >
                {val === 0 ? 'SLIM (0x)' : val === 1 ? 'STD (1x)' : 'DBL (2x)'}
              </button>
            ))}
          </div>
        </div>

        {/* Food Physics profiles */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-wider block opacity-75 flex items-center gap-1">
            <Eye className="w-3 h-3 text-emerald-400" /> FOOD MOTION PHYSICS
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(['STATIC', 'WANDERING', 'BLINKING'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  sfx.playClick();
                  setFoodMode(mode);
                }}
                className={`py-1 text-[8.5px] font-bold rounded border cursor-pointer uppercase transition-colors text-center block ${
                  foodMode === mode
                    ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold'
                    : 'border-white/10 hover:bg-white/5 text-stone-400'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: ARENA HAZARD MODIFIERS */}
      <div className="border-b border-dashed border-current border-opacity-20 pb-3 text-[10px] space-y-3">
        {/* Laser Gates */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-wider block opacity-75 flex items-center gap-1">
            <Zap className="w-3 h-3 text-red-500" /> LASER HAZARD GATES
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['ON', 'OFF'] as const).map((pref) => (
              <button
                key={pref}
                onClick={() => {
                  sfx.playClick();
                  setLaserGates(pref);
                }}
                className={`py-1 text-[8.5px] font-bold rounded border cursor-pointer uppercase transition-colors text-center block ${
                  laserGates === pref
                    ? 'bg-red-500 text-black border-red-400 font-extrabold'
                    : 'border-white/10 hover:bg-white/5 text-stone-400'
                }`}
              >
                {pref === 'ON' ? 'FLASHING' : 'OFF'}
              </button>
            ))}
          </div>
        </div>

        {/* Wind slipstream */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-wider block opacity-75 flex items-center gap-1">
            <Wind className="w-3 h-3 text-green-400" /> SLIPSTREAM WIND DRIFT
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['DRIFT', 'NONE'] as const).map((pref) => (
              <button
                key={pref}
                onClick={() => {
                  sfx.playClick();
                  setSlipstream(pref);
                }}
                className={`py-1 text-[8.5px] font-bold rounded border cursor-pointer uppercase transition-colors text-center block ${
                  slipstream === pref
                    ? 'bg-green-500 text-black border-green-400 font-extrabold'
                    : 'border-white/10 hover:bg-white/5 text-stone-400'
                }`}
              >
                {pref === 'DRIFT' ? 'WIND DRIFT' : 'OFF'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 4: MAP SELECTION SHORTCUTS */}
      <div className="border-b border-dashed border-current border-opacity-20 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Map className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-black tracking-widest uppercase text-white">ARENA MAPS</h3>
        </div>

        <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
          {availableArenas.map((ar) => {
            const isSelected = arenaType === ar.key;
            return (
              <button
                key={ar.key}
                onClick={() => {
                  sfx.playClick();
                  setArenaType(ar.key);
                }}
                className={`p-1 text-left border rounded transition-all cursor-pointer ${isSelected ? 'border-current bg-white/10 font-bold' : 'border-current border-opacity-10 bg-black/15 hover:bg-white/5 text-stone-400'}`}
              >
                <div className="text-[8.5px] uppercase tracking-tight truncate leading-none mb-0.5 text-white">{ar.label}</div>
                <div className="text-[7px] opacity-65 leading-none">{ar.size} Grid</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 5: KEYBOARD CONTROLLER TELEMETRY FEEDBACK */}
      <div className="border border-current border-opacity-10 bg-black/30 p-2.5 rounded-md">
        <div className="flex items-center gap-1.5 mb-2">
          <Keyboard className="w-3.5 h-3.5 text-pink-400 animate-pulse animate-duration-2000" />
          <h4 className="text-[9px] font-black uppercase tracking-widest text-[#ffffff]/80">INPUT TELEMETRY</h4>
        </div>

        <div className="flex flex-col items-center gap-1 font-sans">
          <div className="flex justify-center">
            <div 
              className={`w-8 h-8 border-2 rounded flex flex-col items-center justify-center transition-all ${
                isKeyActive(['w', 'arrowup'], 'UP') 
                  ? `border-cyan-400 ${themeColors.glowClass} text-cyan-400` 
                  : 'border-current border-opacity-15 text-stone-500'
              }`}
            >
              <span className="text-[8px] leading-tight font-black uppercase">W</span>
              <span className="text-[10px] leading-none">↑</span>
            </div>
          </div>

          <div className="flex gap-1 justify-center">
            <div 
              className={`w-8 h-8 border-2 rounded flex flex-col items-center justify-center transition-all ${
                isKeyActive(['a', 'arrowleft'], 'LEFT') 
                  ? `border-cyan-400 ${themeColors.glowClass} text-cyan-400` 
                  : 'border-current border-opacity-15 text-stone-500'
              }`}
            >
              <span className="text-[8px] leading-tight font-black uppercase">A</span>
              <span className="text-[10px] leading-none">←</span>
            </div>

            <div 
              className={`w-8 h-8 border-2 rounded flex flex-col items-center justify-center transition-all ${
                isKeyActive(['s', 'arrowdown'], 'DOWN') 
                  ? `border-cyan-400 ${themeColors.glowClass} text-cyan-400` 
                  : 'border-current border-opacity-15 text-stone-500'
              }`}
            >
              <span className="text-[8px] leading-tight font-black uppercase">S</span>
              <span className="text-[10px] leading-none">↓</span>
            </div>

            <div 
              className={`w-8 h-8 border-2 rounded flex flex-col items-center justify-center transition-all ${
                isKeyActive(['d', 'arrowright'], 'RIGHT') 
                  ? `border-cyan-400 ${themeColors.glowClass} text-cyan-400` 
                  : 'border-current border-opacity-15 text-stone-500'
              }`}
            >
              <span className="text-[8px] leading-tight font-black uppercase">D</span>
              <span className="text-[10px] leading-none">→</span>
            </div>
          </div>

          <div className="w-full mt-1">
            <div 
              className={`w-full h-5 border-2 rounded flex items-center justify-center transition-all text-[8px] uppercase font-black ${
                isKeyActive([' ']) 
                  ? `border-pink-500 ${themeColors.glowClass} text-pink-500` 
                  : 'border-current border-opacity-15 text-stone-500'
              }`}
            >
              [ SPACE ] PAUSE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
