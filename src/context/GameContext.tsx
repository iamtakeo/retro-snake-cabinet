import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  RetroTheme,
  DifficultyLevel,
  HighScoreEntry,
  CustomizationState,
  ThemeColors,
  RETRO_THEMES,
  DIFFICULTY_CONFIGS,
  SHOP_ITEMS,
  HatStyle,
  BodyStyle,
  ParticleTrail,
} from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTouchDevice } from '../hooks/useTouchDevice';
import { ArenaType, applyDifficultyFeedback, applyComplexityFeedback } from '../utils/arenaManager';
import { sfx } from '../utils/audio';

interface GameContextType {
  // Theme & Graphics
  theme: RetroTheme;
  setTheme: (theme: RetroTheme) => void;
  themeColors: ThemeColors;
  themeLocked: boolean;
  setThemeLocked: (locked: boolean) => void;
  showGridLines: boolean;
  setShowGridLines: (show: boolean) => void;

  // Audio Preference
  muted: boolean;
  toggleMute: () => void;

  // Touch Device & Controls
  isTouchDevice: boolean;
  touchControlsPreference: 'ON' | 'OFF';
  setTouchControlsPreference: (pref: 'ON' | 'OFF') => void;

  // Arena & Map Calibration
  arenaType: ArenaType | 'RANDOM';
  setArenaType: (type: ArenaType | 'RANDOM') => void;
  difficulty: DifficultyLevel;
  setDifficulty: (level: DifficultyLevel) => void;
  adaptiveSpeedOffsetMs: number;
  setAdaptiveSpeedOffsetMs: React.Dispatch<React.SetStateAction<number>>;
  adaptiveComplexityOffset: number;
  setAdaptiveComplexityOffset: React.Dispatch<React.SetStateAction<number>>;

  // New Calibration Modifiers
  foodMode: 'STATIC' | 'WANDERING' | 'BLINKING';
  setFoodMode: (mode: 'STATIC' | 'WANDERING' | 'BLINKING') => void;
  bulletTime: 'ON' | 'OFF';
  setBulletTime: (pref: 'ON' | 'OFF') => void;
  growthFactor: number;
  setGrowthFactor: (factor: number) => void;
  coinYield: 'SAFE' | 'NORMAL' | 'HIGH_STAKES';
  setCoinYield: (yieldType: 'SAFE' | 'NORMAL' | 'HIGH_STAKES') => void;
  laserGates: 'ON' | 'OFF';
  setLaserGates: (pref: 'ON' | 'OFF') => void;
  slipstream: 'NONE' | 'DRIFT';
  setSlipstream: (pref: 'NONE' | 'DRIFT') => void;
  smartImmersiveMode: 'ON' | 'OFF';
  setSmartImmersiveMode: (pref: 'ON' | 'OFF') => void;

  // Customization Store & Wallet Balance
  customization: CustomizationState;
  setCustomization: React.Dispatch<React.SetStateAction<CustomizationState>>;
  handlePurchaseOrEquip: (item: any) => void;
  handleUnequipAll: () => void;

  // High Scores Leaderboard
  highscores: HighScoreEntry[];
  submitHighscore: (initials: string, score: number, activeDifficulty: DifficultyLevel) => void;
  handleClearScores: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<RetroTheme>('retro_snake_theme', 'GREEN_PHOSPHOR');
  const [themeLocked, setThemeLocked] = useLocalStorage<boolean>('retro_snake_theme_locked', false);
  const [showGridLines, setShowGridLines] = useState<boolean>(true);
  const [muted, setMuted] = useState<boolean>(sfx.getMutedState());
  const [touchControlsPreference, setTouchControlsPreference] = useLocalStorage<'ON' | 'OFF'>('retro_snake_touch_controls', 'OFF');
  const isTouchDevice = useTouchDevice();

  // Customization Balance & State Store
  const [customization, setCustomization] = useLocalStorage<CustomizationState>('retro_snake_customization', {
    coins: 0,
    unlockedItems: [],
    activeHat: 'NONE',
    activeBody: 'NORMAL',
    activeParticle: 'NONE',
  });

  // Arena Settings State
  const [arenaType, setArenaType] = useLocalStorage<ArenaType | 'RANDOM'>('retro_snake_arena_type', 'RANDOM');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('NORMAL');

  // Calibration deck tweaks
  const [adaptiveSpeedOffsetMs, setAdaptiveSpeedOffsetMs] = useLocalStorage<number>('retro_snake_speed_offset', 0);
  const [adaptiveComplexityOffset, setAdaptiveComplexityOffset] = useLocalStorage<number>('retro_snake_complexity_offset', 0);

  // New Calibration Modifiers
  const [foodMode, setFoodMode] = useLocalStorage<'STATIC' | 'WANDERING' | 'BLINKING'>('retro_snake_food_mode', 'STATIC');
  const [bulletTime, setBulletTime] = useLocalStorage<'ON' | 'OFF'>('retro_snake_bullet_time', 'OFF');
  const [growthFactor, setGrowthFactor] = useLocalStorage<number>('retro_snake_growth_factor', 1);
  const [coinYield, setCoinYield] = useLocalStorage<'SAFE' | 'NORMAL' | 'HIGH_STAKES'>('retro_snake_coin_yield', 'NORMAL');
  const [laserGates, setLaserGates] = useLocalStorage<'ON' | 'OFF'>('retro_snake_laser_gates', 'OFF');
  const [slipstream, setSlipstream] = useLocalStorage<'NONE' | 'DRIFT'>('retro_snake_slipstream', 'NONE');
  const [smartImmersiveMode, setSmartImmersiveMode] = useLocalStorage<'ON' | 'OFF'>('retro_snake_immersive_mode', 'ON');

  // Leaderboard highscores memory
  const [highscores, setHighscores] = useLocalStorage<HighScoreEntry[]>('retro_snake_scores', []);

  const themeColors = RETRO_THEMES[theme];

  // Sync mute state on startup
  useEffect(() => {
    setMuted(sfx.getMutedState());
  }, []);

  const toggleMute = () => {
    const nextMuted = sfx.toggleMute();
    setMuted(nextMuted);
  };

  const handleClearScores = () => {
    setHighscores([]);
  };

  const submitHighscore = (initials: string, score: number, activeDifficulty: DifficultyLevel) => {
    const newEntry: HighScoreEntry = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      name: initials.substring(0, 3).toUpperCase(),
      score: score,
      difficulty: activeDifficulty,
      theme: theme,
      date: new Date().toLocaleDateString(),
    };

    const updated = [newEntry, ...highscores].sort((a, b) => b.score - a.score);
    setHighscores(updated);
  };

  const handlePurchaseOrEquip = (item: any) => {
    const unlocked = customization.unlockedItems.includes(item.id);

    if (unlocked) {
      sfx.playClick();
      setCustomization((prev) => {
        let activeHat = prev.activeHat;
        let activeBody = prev.activeBody;
        let activeParticle = prev.activeParticle;

        if (item.category === 'HAT') {
          activeHat = activeHat === item.codename ? 'NONE' : (item.codename as HatStyle);
        } else if (item.category === 'BODY') {
          activeBody = activeBody === item.codename ? 'NORMAL' : (item.codename as BodyStyle);
        } else if (item.category === 'PARTICLE') {
          activeParticle = activeParticle === item.codename ? 'NONE' : (item.codename as ParticleTrail);
        }

        return { ...prev, activeHat, activeBody, activeParticle };
      });
    } else {
      if (customization.coins >= item.cost) {
        sfx.playPowerUp();
        setCustomization((prev) => {
          let activeHat = prev.activeHat;
          let activeBody = prev.activeBody;
          let activeParticle = prev.activeParticle;

          if (item.category === 'HAT') {
            activeHat = item.codename as HatStyle;
          } else if (item.category === 'BODY') {
            activeBody = item.codename as BodyStyle;
          } else if (item.category === 'PARTICLE') {
            activeParticle = item.codename as ParticleTrail;
          }

          return {
            ...prev,
            coins: prev.coins - item.cost,
            unlockedItems: [...prev.unlockedItems, item.id],
            activeHat,
            activeBody,
            activeParticle,
          };
        });
      } else {
        sfx.playClick();
        alert(`NEED EXTRA RETRO COINS!\nPlay more games to earn ${item.cost - customization.coins} more coins!`);
      }
    }
  };

  const handleUnequipAll = () => {
    sfx.playClick();
    setCustomization((prev) => ({
      ...prev,
      activeHat: 'NONE',
      activeBody: 'NORMAL',
      activeParticle: 'NONE',
    }));
  };

  return (
    <GameContext.Provider
      value={{
        theme,
        setTheme,
        themeColors,
        themeLocked,
        setThemeLocked,
        showGridLines,
        setShowGridLines,
        muted,
        toggleMute,
        isTouchDevice,
        touchControlsPreference,
        setTouchControlsPreference,
        arenaType,
        setArenaType,
        difficulty,
        setDifficulty,
        adaptiveSpeedOffsetMs,
        setAdaptiveSpeedOffsetMs,
        adaptiveComplexityOffset,
        setAdaptiveComplexityOffset,
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
        smartImmersiveMode,
        setSmartImmersiveMode,
        customization,
        setCustomization,
        handlePurchaseOrEquip,
        handleUnequipAll,
        highscores,
        submitHighscore,
        handleClearScores,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
