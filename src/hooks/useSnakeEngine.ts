import { useState, useEffect, useRef, useCallback, Dispatch, SetStateAction } from 'react';
import {
  Direction,
  Position,
  AIEntity,
  GameStatus,
  RetroTheme,
  DifficultyLevel,
  DIFFICULTY_CONFIGS,
  CustomizationState,
  GameModifiers,
} from '../types';

// Helper to spawn 1 prey mouse inside cabinet bounds (2,2) to (22,22)
function spawnInitialMouse(currentSnake: Position[], currentObstacles: Position[]): AIEntity {
  let x = 12;
  let y = 12;
  let isValid = false;
  let tries = 0;
  while (!isValid && tries < 100) {
    tries++;
    x = Math.floor(Math.random() * 21) + 2;
    y = Math.floor(Math.random() * 21) + 2;
    const hitsSnake = currentSnake.some(seg => seg.x === x && seg.y === y);
    const hitsObstacle = currentObstacles.some(obs => obs.x === x && obs.y === y);
    if (!hitsSnake && !hitsObstacle) {
      isValid = true;
    }
  }
  return {
    id: 'mouse_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    type: 'PREY_MOUSE',
    x,
    y,
    alive: true,
    ticksSinceMove: 0,
    speedTicks: 4,
    behaviorState: 'WANDERING'
  };
}

// Helper to spawn 6 prey mice across the 100x100 open world after cabinet escape
function spawnAdditionalMice(currentSnake: Position[], currentObstacles: Position[], currentEntities: AIEntity[], count = 6): AIEntity[] {
  const newMice: AIEntity[] = [];
  const margin = 5;
  for (let i = 0; i < count; i++) {
    let x = 0;
    let y = 0;
    let isValid = false;
    let tries = 0;
    while (!isValid && tries < 100) {
      tries++;
      x = Math.floor(Math.random() * (100 - margin * 2)) + margin;
      y = Math.floor(Math.random() * (100 - margin * 2)) + margin;
      if (x < 25 && y < 25) continue; // spawn only in open world outer limits
      
      const hitsSnake = currentSnake.some(seg => seg.x === x && seg.y === y);
      const hitsObstacle = currentObstacles.some(obs => obs.x === x && obs.y === y);
      const hitsExistingNewMice = newMice.some(m => m.x === x && m.y === y);
      const hitsExistingEntities = currentEntities.some(m => m.alive && m.x === x && m.y === y);
      if (!hitsSnake && !hitsObstacle && !hitsExistingNewMice && !hitsExistingEntities) {
        isValid = true;
      }
    }
    newMice.push({
      id: 'mouse_OW_' + Date.now() + '_' + i + '_' + Math.floor(Math.random() * 1000),
      type: 'PREY_MOUSE',
      x,
      y,
      alive: true,
      ticksSinceMove: 0,
      speedTicks: 4,
      behaviorState: 'WANDERING'
    });
  }
  return newMice;
}
import { ArenaType, generateObstaclesForArena } from '../utils/arenaManager';
import { TerrainDecoration, generateTerrainDecorations } from '../utils/terrainManager';
import { sfx } from '../utils/audio';
import {
  RivalSerpent,
  evaluateTension,
  computeRivalNextMove,
  computeMorphedObstacles,
  evaluateRivalDifficulty,
} from '../utils/directorManager';

interface UseSnakeEngineProps {
  difficulty: DifficultyLevel;
  themeLocked: boolean;
  setTheme: (theme: RetroTheme) => void;
  arenaType: ArenaType | 'RANDOM';
  adaptiveComplexityOffset: number;
  adaptiveSpeedOffsetMs: number;
  setCustomization: Dispatch<SetStateAction<CustomizationState>>;

  modifiers: GameModifiers;
}

export function useSnakeEngine({
  difficulty,
  themeLocked,
  setTheme,
  arenaType,
  adaptiveComplexityOffset,
  adaptiveSpeedOffsetMs,
  setCustomization,
  modifiers,
}: UseSnakeEngineProps) {
  const {
    foodMode,
    bulletTime,
    growthFactor,
    coinYield,
    laserGates,
    slipstream,
  } = modifiers;
  // Game States
  const [snake, setSnake] = useState<Position[]>([]);
  const [direction, setDirection] = useState<Direction>('UP');
  const [food, setFood] = useState<Position | null>(null);
  const [goldenFood, setGoldenFood] = useState<Position | null>(null);
  const [obstacles, setObstacles] = useState<Position[]>([]);
  const [status, setStatus] = useState<GameStatus>('MENU');
  
  // Ground Textures terrain details state
  const [terrainDecorations, setTerrainDecorations] = useState<TerrainDecoration[]>([]);

  // Arena System state
  const [activeArenaType, setActiveArenaType] = useState<ArenaType>('CLASSIC_EMPTY');
  const [currentGridSize, setCurrentGridSize] = useState<number>(25);

  // Statistics
  const [score, setScore] = useState<number>(0);
  const [applesEaten, setApplesEaten] = useState<number>(0);
  const [goldenApplesEaten, setGoldenApplesEaten] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [coinsEarnedThisRun, setCoinsEarnedThisRun] = useState<number>(0);

  // Flashing laser gates active hazard state
  const [laserGatesActive, setLaserGatesActive] = useState<boolean>(false);
  // Slipstream Wind direction state
  const [slipstreamDir, setSlipstreamDir] = useState<Direction>('RIGHT');
  // Dynamic Slipstream Wind active state
  const [slipstreamActive, setSlipstreamActive] = useState<'NONE' | 'DRIFT'>('NONE');
  // AI Director States
  const [tension, setTension] = useState<number>(0.0);
  const [rivals, setRivals] = useState<RivalSerpent[]>([]);
  const [biome, setBiome] = useState<'NEON_GRID' | 'SAND_RUINS' | 'TOXIC_WASTE' | 'GLITCH_VOID'>('GLITCH_VOID');

  // Open World cabinet escape states & refs
  const [breachActive, setBreachActive] = useState<boolean>(false);
  const [hasEscapedCabinet, setHasEscapedCabinet] = useState<boolean>(false);
  const breachActiveRef = useRef<boolean>(false);
  const hasEscapedCabinetRef = useRef<boolean>(false);

  // AI Prey Ecosystem Entities
  const [entities, setEntities] = useState<AIEntity[]>([]);
  const entitiesRef = useRef<AIEntity[]>([]);

  // Track state in mutable refs for the optimized game loop
  const snakeRef = useRef<Position[]>([]);
  const directionRef = useRef<Direction>('UP');
  const nextDirectionRef = useRef<Direction>('UP');
  const foodRef = useRef<Position | null>(null);
  const goldenFoodRef = useRef<Position | null>(null);
  const obstaclesRef = useRef<Position[]>([]);
  const goldenTicksRemainingRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const statusRef = useRef<GameStatus>('MENU');
  const currentGridSizeRef = useRef<number>(25);

  // New modifier refs
  const gameTicksRef = useRef<number>(0);
  const growthQueueRef = useRef<number>(0);
  const laserGateObstaclesRef = useRef<Position[]>([]);
  const slipstreamDirRef = useRef<Direction>('RIGHT');
  const windTicksRemainingRef = useRef<number>(0);
  const windCooldownTicksRef = useRef<number>(0);
  const slipstreamActiveRef = useRef<'NONE' | 'DRIFT'>('NONE');
  const rivalsRef = useRef<RivalSerpent[]>([]);
  const timeSinceLastEatRef = useRef<number>(0);
  const lastDirectorActionTickRef = useRef<number>(0);

  const difficultyConfig = DIFFICULTY_CONFIGS[difficulty];

  // Synchronise system refs on state changes
  useEffect(() => {
    snakeRef.current = snake;
    directionRef.current = direction;
    foodRef.current = food;
    goldenFoodRef.current = goldenFood;
    obstaclesRef.current = obstacles;
    scoreRef.current = score;
    statusRef.current = status;
    rivalsRef.current = rivals;
    entitiesRef.current = entities;

    // Unidirectional safety guards to prevent React asynchronous batching race conditions from overwriting refs back to false
    if (status === 'MENU') {
      breachActiveRef.current = false;
      hasEscapedCabinetRef.current = false;
      currentGridSizeRef.current = arenaType === 'LARGE_EXPANSION' ? 50 : 25;
    } else {
      if (breachActive) breachActiveRef.current = true;
      if (hasEscapedCabinet) {
        hasEscapedCabinetRef.current = true;
        currentGridSizeRef.current = 100;
      } else {
        currentGridSizeRef.current = currentGridSize;
      }
    }
  }, [snake, direction, food, goldenFood, obstacles, score, status, currentGridSize, rivals, breachActive, hasEscapedCabinet, entities, arenaType]);

  // Track Game Time Survival
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (status === 'PLAYING') {
      intervalId = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status]);

  // Generate a random position on the grid
  const generateRandomCell = useCallback((
    currentSnake: Position[],
    currentObstacles: Position[],
    gridSizeValue: number,
    existingFood: Position | null = null
  ): Position => {
    let position: Position = { x: 0, y: 0 };
    let isValid = false;
    const margin = 2;

    while (!isValid) {
      position = {
        x: Math.floor(Math.random() * (gridSizeValue - margin * 2)) + margin,
        y: Math.floor(Math.random() * (gridSizeValue - margin * 2)) + margin,
      };

      const hitsSnake = currentSnake.some((seg) => seg.x === position.x && seg.y === position.y);
      const hitsObstacle = currentObstacles.some((obs) => obs.x === position.x && obs.y === position.y);
      const hitsFood = existingFood ? existingFood.x === position.x && existingFood.y === position.y : false;

      if (!hitsSnake && !hitsObstacle && !hitsFood) {
        isValid = true;
      }
    }

    return position;
  }, []);

  // Initialise/Start game run
  const startGame = useCallback(() => {
    sfx.playPowerUp();

    // Reset open world escape variables
    setBreachActive(false);
    breachActiveRef.current = false;
    setHasEscapedCabinet(false);
    hasEscapedCabinetRef.current = false;

    if (!themeLocked) {
      const themes: RetroTheme[] = ['GREEN_PHOSPHOR', 'AMBER_CRT', 'CLASSIC_LCD', 'CYBERPUNK', 'MONOCHROME_POCKET'];
      const randomIndex = Math.floor(Math.random() * themes.length);
      setTheme(themes[randomIndex]);
    }
    
    let chosenArena: ArenaType = 'CLASSIC_EMPTY';
    if (arenaType === 'RANDOM') {
      const playable: ArenaType[] = ['CLASSIC_EMPTY', 'BOX_CORRIDOR', 'CROSS_LABYRINTH', 'SCATTERED_RUINS', 'GREAT_WALLS', 'LARGE_EXPANSION'];
      chosenArena = playable[Math.floor(Math.random() * playable.length)];
    } else {
      chosenArena = arenaType;
    }
    
    setActiveArenaType(chosenArena);
    const calculatedGridSize = chosenArena === 'LARGE_EXPANSION' ? 50 : 25;
    setCurrentGridSize(calculatedGridSize);

    const startX = Math.floor(calculatedGridSize / 2);
    const startY = Math.floor(calculatedGridSize / 2) + 2;
    const initialSnake = [
      { x: startX, y: startY },
      { x: startX, y: startY + 1 },
      { x: startX, y: startY + 2 },
    ];

    // Safe vs Normal vs High Stakes Obstacles Density multipliers
    let initialObstacles: Position[] = [];
    if (difficultyConfig.hasObstacles) {
      let extraDensity = adaptiveComplexityOffset;
      if (coinYield === 'SAFE') extraDensity = Math.max(-3, extraDensity - 1);
      else if (coinYield === 'HIGH_STAKES') extraDensity = Math.min(3, extraDensity + 1);
      
      initialObstacles = generateObstaclesForArena(chosenArena, calculatedGridSize, extraDensity);
    }

    // Procedural laser gates setup
    const gateCoords: Position[] = [];
    if (laserGates === 'ON' && initialObstacles.length > 0) {
      initialObstacles.forEach((obs, index) => {
        if (index % 2 === 0) {
          gateCoords.push(obs);
        }
      });
    }
    laserGateObstaclesRef.current = gateCoords;

    // Slipstream Drift Wind setup
    if (slipstream === 'DRIFT') {
      const windDirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      const chosenWind = windDirs[Math.floor(Math.random() * windDirs.length)];
      setSlipstreamDir(chosenWind);
      slipstreamDirRef.current = chosenWind;
    } else {
      setSlipstreamDir('RIGHT');
      slipstreamDirRef.current = 'RIGHT';
    }

    // Determine active biome sector environment based on chosen map layout
    let chosenBiome: 'NEON_GRID' | 'SAND_RUINS' | 'TOXIC_WASTE' | 'GLITCH_VOID' = 'GLITCH_VOID';
    if (chosenArena === 'BOX_CORRIDOR' || chosenArena === 'GREAT_WALLS') {
      chosenBiome = 'TOXIC_WASTE';
    } else if (chosenArena === 'CROSS_LABYRINTH') {
      chosenBiome = 'NEON_GRID';
    } else if (chosenArena === 'SCATTERED_RUINS' || chosenArena === 'LARGE_EXPANSION') {
      chosenBiome = 'SAND_RUINS';
    }
    setBiome(chosenBiome);

    // Procedural Ground Textures Seeding
    const initialTerrain = generateTerrainDecorations(calculatedGridSize, initialObstacles, chosenArena);
    setTerrainDecorations(initialTerrain);

    const initialFood = generateRandomCell(initialSnake, initialObstacles, calculatedGridSize);

    // Initial prey mouse spawn inside cabinet
    const initialMouse = spawnInitialMouse(initialSnake, initialObstacles);
    setEntities([initialMouse]);
    entitiesRef.current = [initialMouse];

    setSnake(initialSnake);
    setObstacles(initialObstacles);
    setDirection('UP');
    nextDirectionRef.current = 'UP';
    setFood(initialFood);
    setGoldenFood(null);
    setScore(0);
    setApplesEaten(0);
    setGoldenApplesEaten(0);
    setTimerSeconds(0);
    setCoinsEarnedThisRun(0);
    
    // Reset modifiers
    gameTicksRef.current = 0;
    growthQueueRef.current = 0;
    setLaserGatesActive(false);
    setSlipstreamActive('NONE');
    slipstreamActiveRef.current = 'NONE';
    windTicksRemainingRef.current = 0;
    // Practice starts calm; harder modes have quicker gusts
    windCooldownTicksRef.current = difficulty === 'PRACTICE' ? 120 : difficulty === 'NORMAL' ? 80 : 50;

    // Reset Director properties
    setRivals([]);
    rivalsRef.current = [];
    setTension(0.0);
    timeSinceLastEatRef.current = 0;
    lastDirectorActionTickRef.current = 0;

    setStatus('PLAYING');
  }, [difficultyConfig, arenaType, generateRandomCell, themeLocked, setTheme, adaptiveComplexityOffset, coinYield, laserGates, slipstream]);

  // Direction handler wrapping validation logic
  const handleDirectionChange = useCallback((newDir: Direction) => {
    const currDir = directionRef.current;
    
    if (newDir === 'UP' && currDir === 'DOWN') return;
    if (newDir === 'DOWN' && currDir === 'UP') return;
    if (newDir === 'LEFT' && currDir === 'RIGHT') return;
    if (newDir === 'RIGHT' && currDir === 'LEFT') return;

    nextDirectionRef.current = newDir;
  }, []);

  // Main high-performance game tick update executor
  useEffect(() => {
    if (status !== 'PLAYING') return;

    let timeoutId: NodeJS.Timeout | null = null;

    const moveSnake = () => {
      gameTicksRef.current += 1;
      timeSinceLastEatRef.current += 1;

      // 1. Evaluate real-time dread/tension metric (L4D AI Director)
      const directorState = evaluateTension(
        snakeRef.current,
        obstaclesRef.current,
        currentGridSizeRef.current,
        scoreRef.current,
        timeSinceLastEatRef.current,
        difficulty
      );
      setTension(directorState.tension);

      // 2. AI Director Event Actions
      const timeSinceAction = gameTicksRef.current - lastDirectorActionTickRef.current;
      if (timeSinceAction > 45) {
        if (directorState.dreadRating === 'CALM' && !goldenFoodRef.current && Math.random() < 0.12) {
          // Player is calm - Director injects a golden helper!
          lastDirectorActionTickRef.current = gameTicksRef.current;
          const nextGold = generateRandomCell(snakeRef.current, obstaclesRef.current, currentGridSizeRef.current, foodRef.current);
          setGoldenFood(nextGold);
          goldenTicksRemainingRef.current = 50;
        } else if (directorState.dreadRating === 'PEAK' && obstaclesRef.current.length > 0 && Math.random() < 0.25) {
          // Player in flow - Director morphs the labyrinth paths!
          lastDirectorActionTickRef.current = gameTicksRef.current;
          const morphed = computeMorphedObstacles(
            obstaclesRef.current,
            laserGateObstaclesRef.current,
            currentGridSizeRef.current,
            snakeRef.current,
            foodRef.current,
            rivalsRef.current
          );
          setObstacles(morphed);
          sfx.playClick(); // faint alignment shift cue
        } else if (directorState.dreadRating === 'DANGER' && rivalsRef.current.length === 0 && Math.random() < 0.35) {
          // Danger peak - Spawn Rival Glitch Serpent!
          lastDirectorActionTickRef.current = gameTicksRef.current;
          const isLeft = Math.random() < 0.5;
          const isTop = Math.random() < 0.5;
          let rX = isLeft ? 2 : currentGridSizeRef.current - 3;
          let rY = isTop ? 2 : currentGridSizeRef.current - 3;

          // Find safe spawn coordinates that don't overlap player segments or obstacles
          let tries = 0;
          let isSafe = false;
          while (!isSafe && tries < 20) {
            const tempBody = [
              { x: rX, y: rY },
              { x: rX, y: rY + 1 },
              { x: rX, y: rY + 2 }
            ];
            const overlapsPlayer = tempBody.some(rSeg => snakeRef.current.some(pSeg => pSeg.x === rSeg.x && pSeg.y === rSeg.y));
            const overlapsObstacle = tempBody.some(rSeg => obstaclesRef.current.some(obs => obs.x === rSeg.x && obs.y === rSeg.y));
            
            if (!overlapsPlayer && !overlapsObstacle) {
              isSafe = true;
            } else {
              rX = (rX + 5) % currentGridSizeRef.current;
              rY = (rY + 5) % currentGridSizeRef.current;
              if (rX < 2) rX = 2;
              if (rY < 2) rY = 2;
              tries++;
            }
          }
          
          const rSnake = [
            { x: rX, y: rY },
            { x: rX, y: rY + 1 },
            { x: rX, y: rY + 2 },
          ];

          const telemetry = evaluateRivalDifficulty(gameTicksRef.current, difficulty);
          const newRival: RivalSerpent = {
            id: 'rival_' + Date.now(),
            body: rSnake,
            dir: 'UP',
            color: '#f43f5e',
            alive: true,
            speedTicks: telemetry.speedTicks,
            ticksSinceMove: 0,
          };
          setRivals([newRival]);
          rivalsRef.current = [newRival];
        }
      }

      // 3. Move active Rival Serpents
      if (rivalsRef.current.length > 0) {
        const telemetry = evaluateRivalDifficulty(gameTicksRef.current, difficulty);
        const nextRivals = rivalsRef.current.map((rival) => {
          if (!rival.alive) return rival;

          // Adapt active rival speed in real-time as playtime increases
          rival.speedTicks = telemetry.speedTicks;

          rival.ticksSinceMove += 1;
          if (rival.ticksSinceMove >= rival.speedTicks) {
            rival.ticksSinceMove = 0;
            const { nextHead, nextDir } = computeRivalNextMove(
              rival,
              snakeRef.current,
              obstaclesRef.current,
              laserGateObstaclesRef.current,
              laserGatesActive,
              foodRef.current || { x: 12, y: 12 },
              currentGridSizeRef.current,
              telemetry.errorRate
            );

            // Check tail blockade collision success (player cuts off enemy!)
            const blocked = snakeRef.current.some(
              (seg, idx) => idx !== 0 && seg.x === nextHead.x && seg.y === nextHead.y
            );

            if (blocked) {
              sfx.playEat();
              // Giant spark explosion reward in effects layer is handled in RetroGrid
              const bonusCoins = 12;
              setCoinsEarnedThisRun((prev) => prev + bonusCoins);
              setCustomization((prev) => ({
                ...prev,
                coins: prev.coins + bonusCoins,
              }));
              return { ...rival, alive: false };
            }

            // Check standard crash bounds
            const outR = nextHead.x < 0 || nextHead.x >= currentGridSizeRef.current || nextHead.y < 0 || nextHead.y >= currentGridSizeRef.current;
            const hitsObstacle = obstaclesRef.current.some(obs => obs.x === nextHead.x && obs.y === nextHead.y);

            if (outR || hitsObstacle) {
              return { ...rival, alive: false };
            }

            const nextBody = [nextHead, ...rival.body];
            nextBody.pop();
            return { ...rival, body: nextBody, dir: nextDir };
          }
          return rival;
        }).filter(r => r.alive);

        setRivals(nextRivals);
        rivalsRef.current = nextRivals;
      }

      // Update Laser gates flash states scaling with difficulty
      if (laserGates === 'ON') {
        let activeTicks = 8;
        let inactiveTicks = 8;
        switch (difficulty) {
          case 'PRACTICE':
            activeTicks = 4;
            inactiveTicks = 16;
            break;
          case 'NORMAL':
            activeTicks = 8;
            inactiveTicks = 8;
            break;
          case 'CHALLENGE':
            activeTicks = 12;
            inactiveTicks = 6;
            break;
          case 'IMPOSSIBLE':
            activeTicks = 14;
            inactiveTicks = 4;
            break;
        }
        const cyclePeriod = activeTicks + inactiveTicks;
        const cycleProgress = gameTicksRef.current % cyclePeriod;
        const isGateActive = cycleProgress < activeTicks;
        setLaserGatesActive(isGateActive);
      } else {
        setLaserGatesActive(false);
      }

      const currentDir = nextDirectionRef.current;
      setDirection(currentDir);

      const head = snakeRef.current[0];
      if (!head) return;

      let newHead: Position = { ...head };

      switch (currentDir) {
        case 'UP':
          newHead.y -= 1;
          break;
        case 'DOWN':
          newHead.y += 1;
          break;
        case 'LEFT':
          newHead.x -= 1;
          break;
        case 'RIGHT':
          newHead.x += 1;
          break;
      }

      // Dynamic Wind Cycle Controller
      if (slipstream === 'DRIFT') {
        if (slipstreamActiveRef.current === 'NONE') {
          windCooldownTicksRef.current -= 1;
          if (windCooldownTicksRef.current <= 0) {
            // Decide storm triggers based on difficulty
            let triggerChance = 0.22;
            let duration = 40;
            let cooldown = 120;
            switch (difficulty) {
              case 'PRACTICE':
                triggerChance = 0.10;
                duration = 24; // 3 seconds
                cooldown = 150;
                break;
              case 'NORMAL':
                triggerChance = 0.22;
                duration = 40; // 5 seconds
                cooldown = 120;
                break;
              case 'CHALLENGE':
                triggerChance = 0.40;
                duration = 56; // 7 seconds
                cooldown = 90;
                break;
              case 'IMPOSSIBLE':
                triggerChance = 0.65;
                duration = 72; // 9 seconds
                cooldown = 60;
                break;
            }

            if (Math.random() < triggerChance) {
              const windDirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
              const chosenWind = windDirs[Math.floor(Math.random() * windDirs.length)];
              setSlipstreamDir(chosenWind);
              slipstreamDirRef.current = chosenWind;

              setSlipstreamActive('DRIFT');
              slipstreamActiveRef.current = 'DRIFT';
              windTicksRemainingRef.current = duration;
            } else {
              // Failed check, wait a short cooldown before trying again
              windCooldownTicksRef.current = 30;
            }
          }
        } else {
          // Storm active! Decrement remaining ticks
          windTicksRemainingRef.current -= 1;
          if (windTicksRemainingRef.current <= 0) {
            setSlipstreamActive('NONE');
            slipstreamActiveRef.current = 'NONE';
            
            // Set minimum cooldown calm ticks after storm
            let cooldown = 120;
            switch (difficulty) {
              case 'PRACTICE': cooldown = 150; break;
              case 'NORMAL': cooldown = 120; break;
              case 'CHALLENGE': cooldown = 90; break;
              case 'IMPOSSIBLE': cooldown = 60; break;
            }
            windCooldownTicksRef.current = cooldown;
          }
        }
      } else {
        if (slipstreamActiveRef.current !== 'NONE') {
          setSlipstreamActive('NONE');
          slipstreamActiveRef.current = 'NONE';
        }
      }

      // Check slipstream drift current force (only when dynamically storming!)
      if (slipstream === 'DRIFT' && slipstreamActiveRef.current === 'DRIFT' && gameTicksRef.current % 8 === 0 && gameTicksRef.current > 0) {
        let dx = 0, dy = 0;
        switch (slipstreamDirRef.current) {
          case 'UP': dy = -1; break;
          case 'DOWN': dy = 1; break;
          case 'LEFT': dx = -1; break;
          case 'RIGHT': dx = 1; break;
        }

        const nextWindX = newHead.x + dx;
        const nextWindY = newHead.y + dy;

        const outWindBounds = nextWindX < 0 || nextWindX >= currentGridSizeRef.current || nextWindY < 0 || nextWindY >= currentGridSizeRef.current;
        if (!outWindBounds) {
          newHead.x = nextWindX;
          newHead.y = nextWindY;
        } else if (difficultyConfig.canTeleport || coinYield === 'SAFE') {
          newHead.x = (nextWindX + currentGridSizeRef.current) % currentGridSizeRef.current;
          newHead.y = (nextWindY + currentGridSizeRef.current) % currentGridSizeRef.current;
        } else {
          sfx.playObstacleHit();
          sfx.playGameOver();
          setStatus('GAMEOVER');
          return;
        }

        // Check crash after wind slide
        const selfWind = snakeRef.current.some((seg, index) => index !== 0 && seg.x === newHead.x && seg.y === newHead.y);
        const obsWind = obstaclesRef.current.some(obs => {
          if (obs.x === newHead.x && obs.y === newHead.y) {
            const isLaserGate = laserGateObstaclesRef.current.some(gate => gate.x === obs.x && gate.y === obs.y);
            if (isLaserGate) {
              // Keep gate check consistent with dynamic laser active status!
              let activeTicks = 8;
              let inactiveTicks = 8;
              switch (difficulty) {
                case 'PRACTICE': activeTicks = 4; inactiveTicks = 16; break;
                case 'NORMAL': activeTicks = 8; inactiveTicks = 8; break;
                case 'CHALLENGE': activeTicks = 12; inactiveTicks = 6; break;
                case 'IMPOSSIBLE': activeTicks = 14; inactiveTicks = 4; break;
              }
              const cyclePeriod = activeTicks + inactiveTicks;
              const cycleProgress = gameTicksRef.current % cyclePeriod;
              return cycleProgress < activeTicks;
            }
            return true;
          }
          return false;
        });

        if (selfWind || obsWind) {
          sfx.playObstacleHit();
          sfx.playGameOver();
          setStatus('GAMEOVER');
          return;
        }
      }

      // 4. Check player collision into Glitch Rival Serpents
      const playerHitsRival = rivalsRef.current.some(
        (r) => r.alive && r.body.some((seg) => seg.x === newHead.x && seg.y === newHead.y)
      );
      if (playerHitsRival) {
        sfx.playObstacleHit();
        sfx.playGameOver();
        setStatus('GAMEOVER');
        return;
      }

      // Proximity Bullet-Time trigger slowdown calculation
      let bulletTimeActive = false;
      if (bulletTime === 'ON') {
        let ahead: Position = { ...newHead };
        switch (currentDir) {
          case 'UP': ahead.y -= 1; break;
          case 'DOWN': ahead.y += 1; break;
          case 'LEFT': ahead.x -= 1; break;
          case 'RIGHT': ahead.x += 1; break;
        }

        const nextOutOfBounds = ahead.x < 0 || ahead.x >= currentGridSizeRef.current || ahead.y < 0 || ahead.y >= currentGridSizeRef.current;
        const hitsSelf = snakeRef.current.some(seg => seg.x === ahead.x && seg.y === ahead.y);
        const hitsObstacle = obstaclesRef.current.some(obs => {
          if (obs.x === ahead.x && obs.y === ahead.y) {
            const isLaserGate = laserGateObstaclesRef.current.some(gate => gate.x === obs.x && gate.y === obs.y);
            if (isLaserGate) {
              return Math.floor(gameTicksRef.current / 8) % 2 === 0;
            }
            return true;
          }
          return false;
        });

        if ((nextOutOfBounds && !difficultyConfig.canTeleport && coinYield !== 'SAFE') || hitsSelf || hitsObstacle) {
          bulletTimeActive = true;
        }
      }

      // Check wandering food slide calculations
      if (foodMode === 'WANDERING' && gameTicksRef.current % 5 === 0 && foodRef.current) {
        const dirs: Position[] = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
        const offset = dirs[Math.floor(Math.random() * dirs.length)];
        const nextFX = foodRef.current.x + offset.x;
        const nextFY = foodRef.current.y + offset.y;

        const inFBounds = nextFX >= 1 && nextFX < currentGridSizeRef.current - 1 && nextFY >= 1 && nextFY < currentGridSizeRef.current - 1;
        const hitsFSnake = snakeRef.current.some(seg => seg.x === nextFX && seg.y === nextFX);
        const hitsFObstacle = obstaclesRef.current.some(obs => obs.x === nextFX && obs.y === nextFY);

        if (inFBounds && !hitsFSnake && !hitsFObstacle) {
          const newF = { x: nextFX, y: nextFY };
          setFood(newF);
          foodRef.current = newF;
        }
      }

      // Check blinking food teleportation calculations
      if (foodMode === 'BLINKING' && gameTicksRef.current % 25 === 0 && foodRef.current) {
        const nextF = generateRandomCell(snakeRef.current, obstaclesRef.current, currentGridSizeRef.current);
        setFood(nextF);
        foodRef.current = nextF;
      }

      // Unified dynamic boundaries limit based on escape status
      const maxGridLimit = hasEscapedCabinetRef.current ? 100 : 25;
      
      // Allow escape through right wall breach coordinate (x=24, y=12)
      const movingThroughBreach = breachActiveRef.current && head.x === 24 && head.y === 12 && currentDir === 'RIGHT';

      let outOfBounds = false;
      if (movingThroughBreach) {
        outOfBounds = false;
      } else {
        outOfBounds = newHead.x < 0 || newHead.x >= maxGridLimit || newHead.y < 0 || newHead.y >= maxGridLimit;
      }

      if (outOfBounds) {
        if (hasEscapedCabinetRef.current && (difficultyConfig.canTeleport || coinYield === 'SAFE')) {
          newHead.x = (newHead.x + maxGridLimit) % maxGridLimit;
          newHead.y = (newHead.y + maxGridLimit) % maxGridLimit;
        } else {
          sfx.playObstacleHit();
          sfx.playGameOver();
          setStatus('GAMEOVER');
          return;
        }
      }

      const selfCollide = snakeRef.current.some(
        (seg, index) => index !== 0 && seg.x === newHead.x && seg.y === newHead.y
      );
      if (selfCollide) {
        sfx.playObstacleHit();
        sfx.playGameOver();
        setStatus('GAMEOVER');
        return;
      }

      const obstacleCollide = obstaclesRef.current.some((obs) => {
        if (obs.x === newHead.x && obs.y === newHead.y) {
          const isLaserGate = laserGateObstaclesRef.current.some(gate => gate.x === obs.x && gate.y === obs.y);
          if (isLaserGate) {
            let activeTicks = 8;
            let inactiveTicks = 8;
            switch (difficulty) {
              case 'PRACTICE': activeTicks = 4; inactiveTicks = 16; break;
              case 'NORMAL': activeTicks = 8; inactiveTicks = 8; break;
              case 'CHALLENGE': activeTicks = 12; inactiveTicks = 6; break;
              case 'IMPOSSIBLE': activeTicks = 14; inactiveTicks = 4; break;
            }
            const cyclePeriod = activeTicks + inactiveTicks;
            const cycleProgress = gameTicksRef.current % cyclePeriod;
            return cycleProgress < activeTicks;
          }
          return true;
        }
        return false;
      });

      if (obstacleCollide) {
        sfx.playObstacleHit();
        sfx.playGameOver();
        setStatus('GAMEOVER');
        return;
      }

      const nextSnake = [newHead, ...snakeRef.current];

      // Calculate score & coin yield calibrations multipliers
      let scoreYieldMultiplier = 1.0;
      let coinYieldMultiplier = 1.0;
      if (coinYield === 'SAFE') {
        scoreYieldMultiplier = 0.8;
        coinYieldMultiplier = 0.5;
      } else if (coinYield === 'HIGH_STAKES') {
        scoreYieldMultiplier = 2.5;
        coinYieldMultiplier = 2.0;
      }

      // Update prey entities positions & AI State Machine
      let ateMouse = false;
      const updatedEntities = entitiesRef.current.map((entity): AIEntity => {
        if (!entity.alive) return entity;

        // Proximity fleeing distance calculation (Manhattan distance to snake head)
        const distance = Math.abs(entity.x - newHead.x) + Math.abs(entity.y - newHead.y);

        // State Machine transitions
        let nextState: 'WANDERING' | 'FLEEING' = 'WANDERING';
        let speedTicks = 4;
        if (distance < 6) {
          nextState = 'FLEEING';
          speedTicks = 2;
        }

        const nextTicksSinceMove = entity.ticksSinceMove + 1;
        let nextX = entity.x;
        let nextY = entity.y;
        let finalTicksSinceMove = nextTicksSinceMove;

        if (nextTicksSinceMove >= speedTicks) {
          finalTicksSinceMove = 0; // reset ticks

          // Find adjacent cells
          const adjacent = [
            { x: entity.x, y: entity.y - 1 }, // UP
            { x: entity.x, y: entity.y + 1 }, // DOWN
            { x: entity.x - 1, y: entity.y }, // LEFT
            { x: entity.x + 1, y: entity.y }, // RIGHT
          ];

          const maxGridLimit = hasEscapedCabinetRef.current ? 100 : 25;

          // Filter safe cells
          const safeTiles = adjacent.filter(tile => {
            if (tile.x < 0 || tile.x >= maxGridLimit || tile.y < 0 || tile.y >= maxGridLimit) {
              return false;
            }
            if (obstaclesRef.current.some(obs => obs.x === tile.x && obs.y === tile.y)) {
              return false;
            }
            if (nextSnake.some(seg => seg.x === tile.x && seg.y === tile.y)) {
              return false;
            }
            if (rivalsRef.current.some(r => r.alive && r.body.some(seg => seg.x === tile.x && seg.y === tile.y))) {
              return false;
            }
            return true;
          });

          if (safeTiles.length > 0) {
            if (nextState === 'FLEEING') {
              // Path maximizing Manhattan distance to player head
              let maxDist = -1;
              let bestTile = safeTiles[0];
              safeTiles.forEach(tile => {
                const d = Math.abs(tile.x - newHead.x) + Math.abs(tile.y - newHead.y);
                if (d > maxDist) {
                  maxDist = d;
                  bestTile = tile;
                }
              });
              nextX = bestTile.x;
              nextY = bestTile.y;
            } else {
              // WANDERING - pick randomly
              const randomTile = safeTiles[Math.floor(Math.random() * safeTiles.length)];
              nextX = randomTile.x;
              nextY = randomTile.y;
            }
          }
        }

        return {
          ...entity,
          x: nextX,
          y: nextY,
          ticksSinceMove: finalTicksSinceMove,
          speedTicks,
          behaviorState: nextState
        };
      });

      // Harvest / Consumption checks
      const finalEntities = updatedEntities.map(entity => {
        if (entity.alive && newHead.x === entity.x && newHead.y === entity.y) {
          entity.alive = false;
          ateMouse = true;
          sfx.playEat();
          
          const addedScore = Math.round(30 * difficultyConfig.scoreMultiplier * scoreYieldMultiplier);
          setScore((prev) => prev + addedScore);
          scoreRef.current += addedScore;

          const earnedCoinsNum = Math.max(5, Math.round(5 * difficultyConfig.scoreMultiplier * coinYieldMultiplier));
          setCoinsEarnedThisRun((prev) => prev + earnedCoinsNum);
          setCustomization((prev) => ({
            ...prev,
            coins: prev.coins + earnedCoinsNum,
          }));
        }
        return entity;
      });

      setEntities(finalEntities);
      entitiesRef.current = finalEntities;

      let ateFood = false;
      let ateGolden = false;

      if (foodRef.current && newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
        ateFood = true;
        sfx.playEat();
      }

      if (
        goldenFoodRef.current &&
        newHead.x === goldenFoodRef.current.x &&
        newHead.y === goldenFoodRef.current.y
      ) {
        ateGolden = true;
        sfx.playGoldenEat();
      }

      if (ateFood) {
        timeSinceLastEatRef.current = 0;
        setApplesEaten((prev) => prev + 1);
        const addedScore = Math.round(10 * difficultyConfig.scoreMultiplier * scoreYieldMultiplier);
        setScore((prev) => prev + addedScore);
        scoreRef.current += addedScore;

        const earnedCoinsNum = Math.max(1, Math.round(1 * difficultyConfig.scoreMultiplier * coinYieldMultiplier));
        setCoinsEarnedThisRun((prev) => prev + earnedCoinsNum);
        setCustomization((prev) => ({
          ...prev,
          coins: prev.coins + earnedCoinsNum,
        }));

        const nextFood = generateRandomCell(nextSnake, obstaclesRef.current, currentGridSizeRef.current);
        setFood(nextFood);

        const rollGolden = Math.random() < 0.3 && !goldenFoodRef.current;
        if (rollGolden) {
          const nextGold = generateRandomCell(nextSnake, obstaclesRef.current, currentGridSizeRef.current, nextFood);
          setGoldenFood(nextGold);
          goldenTicksRemainingRef.current = 40;
        }
      } else if (ateGolden) {
        timeSinceLastEatRef.current = 0;
        setGoldenApplesEaten((prev) => prev + 1);
        const addedScore = Math.round(50 * difficultyConfig.scoreMultiplier * scoreYieldMultiplier);
        setScore((prev) => prev + addedScore);
        scoreRef.current += addedScore;

        const earnedCoinsNum = Math.max(5, Math.round(5 * difficultyConfig.scoreMultiplier * coinYieldMultiplier));
        setCoinsEarnedThisRun((prev) => prev + earnedCoinsNum);
        setCustomization((prev) => ({
          ...prev,
          coins: prev.coins + earnedCoinsNum,
        }));

        setGoldenFood(null);
      }

      // Metabolic Growth factor segment updates
      let growThisTick = false;
      if (ateFood || ateGolden || ateMouse) {
        if (growthFactor === 1) {
          growThisTick = true;
        } else if (growthFactor === 2) {
          growThisTick = true;
          growthQueueRef.current += 1;
        }
      } else if (growthQueueRef.current > 0) {
        growThisTick = true;
        growthQueueRef.current -= 1;
      }

      if (!growThisTick) {
        nextSnake.pop();
      }

      if (goldenFoodRef.current && !ateGolden) {
        goldenTicksRemainingRef.current -= 1;
        if (goldenTicksRemainingRef.current <= 0) {
          setGoldenFood(null);
        }
      }

      sfx.playMove();
      setSnake(nextSnake);

      // Track Breach Event Score Threshold (score >= 30 opens the right wall gap at 24,12)
      if (scoreRef.current >= 30 && !breachActiveRef.current) {
        setBreachActive(true);
        breachActiveRef.current = true;
      }

      // Track Escape state transition (snake head crosses x=25 through the breach)
      if (newHead.x >= 25 && !hasEscapedCabinetRef.current) {
        setHasEscapedCabinet(true);
        hasEscapedCabinetRef.current = true;
        setCurrentGridSize(100);
        currentGridSizeRef.current = 100;
        sfx.playPowerUp();

        // Spawn 6 additional prey mice across the 100x100 open world
        const extraMice = spawnAdditionalMice(nextSnake, obstaclesRef.current, entitiesRef.current, 6);
        const allMice = [...entitiesRef.current, ...extraMice];
        setEntities(allMice);
        entitiesRef.current = allMice;
      }

      // Safe vs High Stakes speed calibrations
      let yieldSpeedOffset = 0;
      if (coinYield === 'SAFE') yieldSpeedOffset = 30;
      else if (coinYield === 'HIGH_STAKES') yieldSpeedOffset = -25;

      let finalSpeedMs = Math.max(35, Math.min(250, difficultyConfig.speedMs + adaptiveSpeedOffsetMs + yieldSpeedOffset));
      if (bulletTimeActive) {
        finalSpeedMs = Math.round(finalSpeedMs * 1.6);
      }

      timeoutId = setTimeout(moveSnake, finalSpeedMs);
    };

    let yieldSpeedOffset = 0;
    if (coinYield === 'SAFE') yieldSpeedOffset = 30;
    else if (coinYield === 'HIGH_STAKES') yieldSpeedOffset = -25;

    const finalSpeedMs = Math.max(35, Math.min(250, difficultyConfig.speedMs + adaptiveSpeedOffsetMs + yieldSpeedOffset));
    timeoutId = setTimeout(moveSnake, finalSpeedMs);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [status, difficultyConfig, generateRandomCell, adaptiveSpeedOffsetMs, currentGridSize, setCustomization, foodMode, bulletTime, growthFactor, coinYield, laserGates, slipstream, difficulty]);

  return {
    snake,
    direction,
    food,
    goldenFood,
    obstacles,
    status,
    setStatus,
    activeArenaType,
    currentGridSize,
    score,
    applesEaten,
    goldenApplesEaten,
    timerSeconds,
    coinsEarnedThisRun,
    startGame,
    handleDirectionChange,

    // Expose modifier states
    laserGatesActive,
    laserGateObstacles: laserGateObstaclesRef.current,
    slipstreamDir,
    slipstreamActive, // Dynamic slipstream gusts!
    tension,          // real-time director tension metrics
    rivals,           // active glitch serpents list
    rivalCpuLabel: evaluateRivalDifficulty(gameTicksRef.current, difficulty).cpuLabel,
    biome,            // active environmental biome sector
    terrainDecorations,

    // Open world cabinet breach escape states
    breachActive,
    hasEscapedCabinet,

    // Expose entities to props
    entities,
  };
}

export default useSnakeEngine;
