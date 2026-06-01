export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Position {
  x: number;
  y: number;
}

export interface AIEntity {
  id: string;
  type: 'PREY_MOUSE';
  x: number;
  y: number;
  alive: boolean;
  ticksSinceMove: number;
  speedTicks: number;
  behaviorState: 'WANDERING' | 'FLEEING';
}

export type GameStatus = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'SETTINGS' | 'CONTROLS' | 'SHOP';

export type RetroTheme = 'GREEN_PHOSPHOR' | 'AMBER_CRT' | 'CLASSIC_LCD' | 'CYBERPUNK' | 'MONOCHROME_POCKET';

export type BiomeType = 'NEON_GRID' | 'SAND_RUINS' | 'TOXIC_WASTE' | 'GLITCH_VOID';

export type DifficultyLevel = 'PRACTICE' | 'NORMAL' | 'CHALLENGE' | 'IMPOSSIBLE';

export interface GameModifiers {
  foodMode: 'STATIC' | 'WANDERING' | 'BLINKING';
  bulletTime: 'ON' | 'OFF';
  growthFactor: number;
  coinYield: 'SAFE' | 'NORMAL' | 'HIGH_STAKES';
  laserGates: 'ON' | 'OFF';
  slipstream: 'NONE' | 'DRIFT';
}

export interface DifficultyConfig {
  speedMs: number; // Interval in milliseconds
  scoreMultiplier: number;
  hasObstacles: boolean;
  canTeleport: boolean;
}

export interface HighScoreEntry {
  id: string;
  name: string;
  score: number;
  difficulty: DifficultyLevel;
  theme: RetroTheme;
  date: string;
}

export interface GameStats {
  score: number;
  highscore: number;
  applesEaten: number;
  goldenApplesEaten: number;
  obstaclesHit: number;
  durationSeconds: number;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  PRACTICE: {
    speedMs: 180,
    scoreMultiplier: 1.0,
    hasObstacles: false,
    canTeleport: true,
  },
  NORMAL: {
    speedMs: 120,
    scoreMultiplier: 1.5,
    hasObstacles: false,
    canTeleport: false,
  },
  CHALLENGE: {
    speedMs: 85,
    scoreMultiplier: 2.2,
    hasObstacles: true,
    canTeleport: false,
  },
  IMPOSSIBLE: {
    speedMs: 55,
    scoreMultiplier: 3.5,
    hasObstacles: true,
    canTeleport: false,
  },
};

export interface ThemeColors {
  background: string;
  gridBackground: string;
  gridLine: string;
  snakeHead: string;
  snakeBody: string;
  snakeBodyGrad: string;
  food: string;
  goldenFood: string;
  obstacle: string;
  borderClass: string;
  textPrimary: string;
  textSecondary: string;
  glowClass: string;
  crtOverlay: boolean;
}

export const RETRO_THEMES: Record<RetroTheme, ThemeColors> = {
  GREEN_PHOSPHOR: {
    background: 'bg-black',
    gridBackground: '#050a05',
    gridLine: 'rgba(0, 255, 0, 0.05)',
    snakeHead: '#33ff33',
    snakeBody: '#00cc00',
    snakeBodyGrad: '#008800',
    food: '#ff3333',
    goldenFood: '#ffff33',
    obstacle: '#555555',
    borderClass: 'border-green-500/50 shadow-[0_0_10px_2px_rgba(0,255,0,0.15)]',
    textPrimary: 'text-green-500 font-mono',
    textSecondary: 'text-green-600/80 font-mono',
    glowClass: 'shadow-[0_0_12px_rgba(34,197,94,0.4)]',
    crtOverlay: true,
  },
  AMBER_CRT: {
    background: 'bg-stone-950',
    gridBackground: '#0c0702',
    gridLine: 'rgba(245, 158, 11, 0.05)',
    snakeHead: '#fbbf24',
    snakeBody: '#d97706',
    snakeBodyGrad: '#b45309',
    food: '#ef4444',
    goldenFood: '#fbbf24',
    obstacle: '#451a03',
    borderClass: 'border-amber-500/40 shadow-[0_0_10px_2px_rgba(245,158,11,0.15)]',
    textPrimary: 'text-amber-500 font-mono',
    textSecondary: 'text-amber-600/80 font-mono',
    glowClass: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]',
    crtOverlay: true,
  },
  CLASSIC_LCD: {
    background: 'bg-stone-300',
    gridBackground: '#cad2c5',
    gridLine: 'rgba(0, 0, 0, 0.03)',
    snakeHead: '#2f3e46',
    snakeBody: '#354f52',
    snakeBodyGrad: '#52796f',
    food: '#111111',
    goldenFood: '#444444',
    obstacle: '#7f8c8d',
    borderClass: 'border-stone-800 shadow-md',
    textPrimary: 'text-stone-800 font-mono',
    textSecondary: 'text-stone-600 font-mono',
    glowClass: 'shadow-none',
    crtOverlay: false,
  },
  CYBERPUNK: {
    background: 'bg-slate-950',
    gridBackground: '#0d0d1e',
    gridLine: 'rgba(236, 72, 153, 0.08)',
    snakeHead: '#06b6d4', // Cyan
    snakeBody: '#0891b2',
    snakeBodyGrad: '#0e7490',
    food: '#f43f5e', // Pink-red
    goldenFood: '#eab308', // Yellow
    obstacle: '#312e81',
    borderClass: 'border-pink-500/40 shadow-[0_0_15px_3px_rgba(236,72,153,0.15)]',
    textPrimary: 'text-pink-500 font-mono',
    textSecondary: 'text-cyan-400 font-mono',
    glowClass: 'shadow-[0_0_12px_rgba(236,72,153,0.5)]',
    crtOverlay: true,
  },
  MONOCHROME_POCKET: {
    background: 'bg-neutral-900',
    gridBackground: '#181818',
    gridLine: 'rgba(255, 255, 255, 0.05)',
    snakeHead: '#ffffff',
    snakeBody: '#cccccc',
    snakeBodyGrad: '#999999',
    food: '#ffffff',
    goldenFood: '#aaaaaa',
    obstacle: '#444444',
    borderClass: 'border-neutral-500 shadow-[0_0_8px_rgba(255,255,255,0.1)]',
    textPrimary: 'text-neutral-100 font-mono',
    textSecondary: 'text-neutral-400 font-mono',
    glowClass: 'shadow-[0_0_8px_rgba(255,255,255,0.3)]',
    crtOverlay: false,
  },
};

// SNAKE SHOP & CUSTOMIZATION DEFINITIONS
export type HatStyle = 'NONE' | 'COWBOY' | 'CROWN' | 'WIZARD' | 'TOP_HAT' | 'CHEF' | 'PIRATE';
export type BodyStyle = 'NORMAL' | 'CYBER_MATRIX' | 'PLASMA_PULSE' | 'RAINBOW_CHROMA' | 'GHOSTLY';
export type ParticleTrail = 'NONE' | 'FIRE_SPARK' | 'COSMIC_DUST' | 'GOLD_RICH' | 'TOXIC_SLIME';

export interface ShopItem {
  id: string;
  name: string;
  category: 'HAT' | 'BODY' | 'PARTICLE';
  cost: number;
  unlocked: boolean;
  emoji: string;
  codename: string; // matches HatStyle, BodyStyle, ParticleTrail values
  description: string;
}

export interface CustomizationState {
  coins: number;
  unlockedItems: string[]; // ids of unlocked items
  activeHat: HatStyle;
  activeBody: BodyStyle;
  activeParticle: ParticleTrail;
}

export const SHOP_ITEMS: ShopItem[] = [
  // HATS
  {
    id: 'hat_cowboy',
    name: 'Wild West Stetson',
    category: 'HAT',
    cost: 30,
    unlocked: false,
    emoji: '🤠',
    codename: 'COWBOY',
    description: 'A stylized leather cowboy hat for adventurous serpents.'
  },
  {
    id: 'hat_top',
    name: 'Victorian Cylinder',
    category: 'HAT',
    cost: 50,
    unlocked: false,
    emoji: '🎩',
    codename: 'TOP_HAT',
    description: 'Keep your crawls highly sophisticated and refined.'
  },
  {
    id: 'hat_chef',
    name: "Michelin Chef Toque",
    category: 'HAT',
    cost: 70,
    unlocked: false,
    emoji: '👨‍🍳',
    codename: 'CHEF',
    description: "Perfect for snaking down delicious apples all day."
  },
  {
    id: 'hat_pirate',
    name: "Tricorne Skull Cap",
    category: 'HAT',
    cost: 95,
    unlocked: false,
    emoji: '🏴‍☠️',
    codename: 'PIRATE',
    description: "Scurvy crawler ready to plunder maximum arcade speed!"
  },
  {
    id: 'hat_crown',
    name: 'Noble Golden Crown',
    category: 'HAT',
    cost: 140,
    unlocked: false,
    emoji: '👑',
    codename: 'CROWN',
    description: 'An expensive sparkling solid-gold crown of high royalty.'
  },
  {
    id: 'hat_wizard',
    name: 'Spellbound Hood',
    category: 'HAT',
    cost: 200,
    unlocked: false,
    emoji: '🧙',
    codename: 'WIZARD',
    description: 'A magical wizard cone covered in cosmic stardust.'
  },

  // BODY DETAILS / SKINS
  {
    id: 'body_cyber',
    name: 'Matrix Cyber Shell',
    category: 'BODY',
    cost: 50,
    unlocked: false,
    emoji: '💾',
    codename: 'CYBER_MATRIX',
    description: 'Adds a vintage target-circle grid layer inside each segment.'
  },
  {
    id: 'body_ghostly',
    name: 'Ectoplasm Phantom',
    category: 'BODY',
    cost: 80,
    unlocked: false,
    emoji: '👻',
    codename: 'GHOSTLY',
    description: 'Make segments fade into complete transparency towards the tail.'
  },
  {
    id: 'body_plasma',
    name: 'Plasma Pulsar',
    category: 'BODY',
    cost: 110,
    unlocked: false,
    emoji: '⚡',
    codename: 'PLASMA_PULSE',
    description: 'Beams continuous energy pulses sliding along the chassis.'
  },
  {
    id: 'body_rainbow',
    name: 'Prism Rainbow Wheel',
    category: 'BODY',
    cost: 180,
    unlocked: false,
    emoji: '🌈',
    codename: 'RAINBOW_CHROMA',
    description: 'Shifts your color theme along the beautiful full spectrum.'
  },

  // PARTICLE EMISSIONS
  {
    id: 'particle_fire',
    name: 'Ignited Tail Sparks',
    category: 'PARTICLE',
    cost: 60,
    unlocked: false,
    emoji: '🔥',
    codename: 'FIRE_SPARK',
    description: 'Triggers bright orange combustible heat embers as you slide.'
  },
  {
    id: 'particle_toxic',
    name: 'Bubbling Acid Acidic',
    category: 'PARTICLE',
    cost: 90,
    unlocked: false,
    emoji: '🧪',
    codename: 'TOXIC_SLIME',
    description: 'Leaves boiling radioactive slime droplets in your trail.'
  },
  {
    id: 'particle_dust',
    name: 'Cosmic Nebula Vapor',
    category: 'PARTICLE',
    cost: 130,
    unlocked: false,
    emoji: '✨',
    codename: 'COSMIC_DUST',
    description: 'Emits a rich stream of cyan & purple neon star elements.'
  },
  {
    id: 'particle_gold',
    name: 'Gold Ingot Flakes',
    category: 'PARTICLE',
    cost: 190,
    unlocked: false,
    emoji: '💰',
    codename: 'GOLD_RICH',
    description: 'Emanates physical gold-coin sparklers directly from your spine!'
  }
];
