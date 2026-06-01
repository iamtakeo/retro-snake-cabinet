import { Sliders } from 'lucide-react';
import { DifficultyLevel, RetroTheme, DIFFICULTY_CONFIGS, ThemeColors } from '../types';
import { sfx } from '../utils/audio';
import { ArenaType, ARENA_DESIGNS } from '../utils/arenaManager';

interface SettingsViewProps {
  touchControlsPreference: 'ON' | 'OFF';
  setTouchControlsPreference: (pref: 'ON' | 'OFF') => void;
  difficulty: DifficultyLevel;
  setDifficulty: (level: DifficultyLevel) => void;
  theme: RetroTheme;
  setTheme: (th: RetroTheme) => void;
  themeLocked: boolean;
  setThemeLocked: (locked: boolean) => void;
  arenaType: ArenaType | 'RANDOM';
  setArenaType: (type: ArenaType | 'RANDOM') => void;
  showGridLines: boolean;
  setShowGridLines: (show: boolean) => void;
  smartImmersiveMode: 'ON' | 'OFF';
  setSmartImmersiveMode: (pref: 'ON' | 'OFF') => void;
  themeColors: ThemeColors;
  isTouchDevice: boolean;
  onClose: () => void;
}

export default function SettingsView({
  touchControlsPreference,
  setTouchControlsPreference,
  difficulty,
  setDifficulty,
  theme,
  setTheme,
  themeLocked,
  setThemeLocked,
  arenaType,
  setArenaType,
  showGridLines,
  setShowGridLines,
  smartImmersiveMode,
  setSmartImmersiveMode,
  themeColors,
  isTouchDevice,
  onClose,
}: SettingsViewProps) {
  const difficultyConfig = DIFFICULTY_CONFIGS[difficulty];

  // Helper for glassmorphic selector styling
  const getBtnClass = (active: boolean) => {
    return active
      ? `bg-white/10 backdrop-blur-sm border-white text-white ${themeColors.glowClass} font-bold scale-[1.02] shadow-[0_0_10px_rgba(255,255,255,0.15)]`
      : 'border-current border-opacity-35 hover:border-opacity-80 hover:bg-white/5 opacity-75 hover:scale-[1.01] transition-all';
  };

  return (
    <div
      className={`w-full border-4 p-6 rounded-md ${themeColors.borderClass} ${themeColors.background} ${themeColors.textPrimary}`}
      id="menu-settings-view"
    >
      <div className="flex items-center gap-2 mb-4 border-b border-dashed border-opacity-30 pb-2">
        <Sliders className="w-4 h-4 animate-pulse" />
        <h3 className="text-sm font-black tracking-widest uppercase text-white">ENGINE CONFIG</h3>
      </div>

      {/* Difficulty Selection Column */}
      <div className="mb-5 space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider block opacity-75 font-mono">
          DIFFICULTY PRESET
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['PRACTICE', 'NORMAL', 'CHALLENGE', 'IMPOSSIBLE'] as const).map((level) => {
            const c = DIFFICULTY_CONFIGS[level];
            return (
              <button
                key={level}
                onClick={() => {
                  sfx.playClick();
                  setDifficulty(level);
                }}
                className={`p-2 border text-xs text-left rounded cursor-pointer leading-tight ${getBtnClass(difficulty === level)}`}
              >
                <p className="font-bold">{level}</p>
                <p className="text-[9px] opacity-85 mt-0.5">X{c.scoreMultiplier} Mult</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Monitor Type Style Selection */}
      <div className="mb-5 space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider block opacity-75 font-mono">
          MONITOR GRAPHICS SKIN
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['GREEN_PHOSPHOR', 'AMBER_CRT', 'CLASSIC_LCD', 'CYBERPUNK', 'MONOCHROME_POCKET'] as const).map(
            (th) => (
              <button
                key={th}
                onClick={() => {
                  sfx.playClick();
                  setTheme(th);
                  setThemeLocked(true); // Auto-lock theme to manual selection to avoid override!
                }}
                className={`p-2 border text-xs font-semibold text-center rounded cursor-pointer uppercase ${getBtnClass(theme === th)}`}
              >
                {th.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Dynamic Theme switching */}
      <div className="mb-5 space-y-1.5 font-mono">
        <label className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
          AUTO SKIN ROTATION
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              sfx.playClick();
              setThemeLocked(false);
            }}
            className={`py-1.5 px-2 border text-xs font-semibold text-center rounded cursor-pointer uppercase ${getBtnClass(!themeLocked)}`}
          >
            ENABLED (RANDOM)
          </button>
          <button
            onClick={() => {
              sfx.playClick();
              setThemeLocked(true);
            }}
            className={`py-1.5 px-2 border text-xs font-semibold text-center rounded cursor-pointer uppercase ${getBtnClass(themeLocked)}`}
          >
            LOCKED (STEADY)
          </button>
        </div>
        <p className="text-[9px] opacity-65 leading-tight uppercase font-mono mt-1">
          {themeLocked 
            ? `SKIN INSTALLED: ${theme.replace('_', ' ')}` 
            : 'Skins randomize automatically each game start!'
          }
        </p>
      </div>

      {/* Arena / Map Customizer Section */}
      <div className="mb-5 space-y-1.5 font-mono">
        <label className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
          GAME MAP & PROCEDURAL ARENAS
        </label>
        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          <button
            onClick={() => {
              sfx.playClick();
              setArenaType('RANDOM');
            }}
            className={`py-1.5 px-2 border text-[10px] font-bold text-center rounded cursor-pointer leading-tight uppercase ${getBtnClass(arenaType === 'RANDOM')}`}
          >
            🎲 RANDOMIZE MAP
          </button>
          {ARENA_DESIGNS.map((item) => (
            <button
              key={item.type}
              onClick={() => {
                sfx.playClick();
                setArenaType(item.type);
              }}
              className={`py-1.5 px-2 border text-[10px] font-bold text-center rounded cursor-pointer leading-tight uppercase ${getBtnClass(arenaType === item.type)}`}
            >
              {item.name}
            </button>
          ))}
        </div>
        <p className="text-[9px] opacity-75 leading-tight uppercase font-mono mt-1 text-cyan-400 font-bold">
          {arenaType === 'RANDOM'
            ? 'Procedural maps rotate automatically each game run!'
            : `${ARENA_DESIGNS.find((a) => a.type === arenaType)?.description}`}
        </p>
      </div>

      {/* Immersive HUD Option */}
      <div className="mb-5 space-y-1.5 font-mono">
        <label className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
          IMMERSIVE FOCUSED HUD (SMART MODE)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['ON', 'OFF'] as const).map((pref) => (
            <button
              key={pref}
              onClick={() => {
                sfx.playClick();
                setSmartImmersiveMode(pref);
              }}
              className={`py-1.5 px-2 border text-xs font-semibold text-center rounded cursor-pointer uppercase ${getBtnClass(smartImmersiveMode === pref)}`}
            >
              {pref === 'ON' ? 'IMMERSIVE (FOCUSED)' : 'VERBOSE (CABIN PANELS)'}
            </button>
          ))}
        </div>
        <p className="text-[9px] opacity-65 leading-tight uppercase font-mono mt-1">
          {smartImmersiveMode === 'ON' 
            ? 'Side panels disappear during gameplay. Move cursor to the very top edge of viewport to bring up system menu!' 
            : 'Side panels and verbose arcade cabinetry always visible.'}
        </p>
      </div>

      {/* Touch Controls Preference */}
      <div className="mb-5 space-y-1.5 font-mono">
        <label className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
          ON-SCREEN TOUCH CONTROLLERS
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['ON', 'OFF'] as const).map((pref) => (
            <button
              key={pref}
              onClick={() => {
                sfx.playClick();
                setTouchControlsPreference(pref);
              }}
              className={`py-1.5 px-2 border text-xs font-semibold text-center rounded cursor-pointer uppercase ${getBtnClass(touchControlsPreference === pref)}`}
            >
              {pref === 'ON' ? 'ENABLED (SHOW)' : 'DISABLED (HIDE)'}
            </button>
          ))}
        </div>
        <p className="text-[9px] opacity-65 leading-tight uppercase font-mono mt-1">
          {touchControlsPreference === 'ON' ? 'Virtual controllers rendering' : 'Controls hidden. Use keyboard keys instead!'}
        </p>
      </div>

      {/* Additional Options */}
      <div className="mb-5 space-y-2.5">
        <label className="text-[10px] font-bold uppercase tracking-wider block opacity-75 font-mono">RENDER CONFIG</label>
        <label className="flex items-center gap-2 text-[11px] uppercase cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showGridLines}
            onChange={(e) => {
              sfx.playClick();
              setShowGridLines(e.target.checked);
            }}
            className="w-3.5 h-3.5 cursor-pointer accent-white border border-current"
          />
          CRT SCANLINE MATRIX LAYER
        </label>

        <div className="bg-black/25 p-2 rounded text-[9.5px] opacity-80 uppercase leading-normal border border-current border-opacity-5 border-dashed">
          {difficultyConfig.canTeleport ? (
            <span className="text-green-400 font-bold">✔ Border Wrapping boundaries: ACTIVE (PRACTICE MODE).</span>
          ) : (
            <span className="text-red-400 font-bold">✖ Wall limits: SOLID. Boundaries trigger screen crash!</span>
          )}
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold uppercase text-xs rounded hover:bg-white hover:text-black hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_10px_rgba(255,255,255,0.06)] animate-pulse"
        id="close-settings-btn"
      >
        RETURN TO MENU
      </button>
    </div>
  );
}
