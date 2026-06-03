import { useEffect, useRef } from 'react';
import { Position, ThemeColors, RetroTheme, Direction, GameStatus, AIEntity } from '../types';
import { EffectsEngine } from '../utils/effectsManager';
import { TerrainDecoration } from '../utils/terrainManager';
import { sfx } from '../utils/audio';
import { RivalSerpent } from '../utils/directorManager';

interface RetroGridProps {
  snake: Position[];
  direction: Direction;
  food: Position | null;
  goldenFood: Position | null;
  obstacles: Position[];
  themeColors: ThemeColors;
  gridSize: number;
  gameStatus: GameStatus;
  themeKey: RetroTheme;
  showGridLines: boolean;
  score: number;
  touchControlsVisible: boolean;
  activeHat: string;
  activeBody: string;
  activeParticle: string;

  // New Calibration Modifiers Props
  laserGatesActive?: boolean;
  laserGateObstacles?: Position[];
  slipstreamDir?: Direction;
  slipstream?: 'NONE' | 'DRIFT';

  // Ground textures details
  terrainDecorations?: TerrainDecoration[];

  // Director details
  rivals?: RivalSerpent[];
  tension?: number;
  biome?: string;

  // Open World cabinet escape props
  breachActive?: boolean;
  hasEscapedCabinet?: boolean;

  // AI Prey Ecosystem Entities
  entities?: AIEntity[];

  // Edge Multiplayer Peers
  peers?: any[];

  // Resting state
  isResting?: boolean;

  // Immersive layout state
  isImmersiveActive?: boolean;
}

export default function RetroGrid({
  snake,
  direction,
  food,
  goldenFood,
  obstacles,
  themeColors,
  gridSize = 25,
  gameStatus,
  themeKey,
  showGridLines = true,
  score,
  touchControlsVisible,
  activeHat,
  activeBody,
  activeParticle,
  laserGatesActive = false,
  laserGateObstacles = [],
  slipstreamDir = 'RIGHT',
  slipstream = 'NONE',
  terrainDecorations = [],
  rivals = [],
  tension = 0.0,
  biome = 'GLITCH_VOID',
  breachActive = false,
  hasEscapedCabinet = false,
  entities = [],
  peers = [],
  isResting = false,
  isImmersiveActive = false,
}: RetroGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Persistent smooth-lerp viewport camera coordinates
  const cameraRef = useRef<{ x: number; y: number }>({ x: 12, y: 12 });
  
  // Persistent, isolated modular effects engine
  const effectsEngineRef = useRef<EffectsEngine>(new EffectsEngine());

  // Persistent environmental floating biome background particles
  const envParticlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    life: number;
    speed: number;
    seed: number;
    label?: string; // e.g. binary Matrix bit '0'/'1'
  }>>([]);
  
  // High fidelity state references for fluid 60fps animation access
  const stateRef = useRef({
    snake,
    direction,
    food,
    goldenFood,
    obstacles,
    themeColors,
    gridSize,
    gameStatus,
    themeKey,
    showGridLines,
    score,
    activeHat,
    activeBody,
    activeParticle,
    laserGatesActive,
    laserGateObstacles,
    slipstreamDir,
    slipstream,
    terrainDecorations,
    rivals,
    tension,
    biome,
    breachActive,
    hasEscapedCabinet,
    entities,
    peers,
    isResting,
    isImmersiveActive,
  });

  // Previous status monitors to dynamically spawn beautiful juices
  const prevScoreRef = useRef<number>(score);
  const prevFoodRef = useRef<Position | null>(food);
  const prevGoldenFoodRef = useRef<Position | null>(goldenFood);
  const prevStatusRef = useRef<GameStatus>(gameStatus);
  const prevSlipstreamRef = useRef<'NONE' | 'DRIFT'>('NONE');
  const prevRivalsRef = useRef<RivalSerpent[]>([]);
  const prevEntitiesRef = useRef<AIEntity[]>([]);

  // Synchronize dynamic updates for high-performance retrieval inside the 60fps raf loop
  useEffect(() => {
    stateRef.current = {
      snake,
      direction,
      food,
      goldenFood,
      obstacles,
      themeColors,
      gridSize,
      gameStatus,
      themeKey,
      showGridLines,
      score,
      activeHat,
      activeBody,
      activeParticle,
      laserGatesActive,
      laserGateObstacles,
      slipstreamDir,
      slipstream,
      terrainDecorations,
      rivals,
      tension,
      biome,
      breachActive,
      hasEscapedCabinet,
      entities,
      peers,
      isResting,
      isImmersiveActive,
    };
  }, [snake, direction, food, goldenFood, obstacles, themeColors, gridSize, gameStatus, themeKey, showGridLines, score, activeHat, activeBody, activeParticle, laserGatesActive, laserGateObstacles, slipstreamDir, slipstream, terrainDecorations, rivals, tension, biome, breachActive, hasEscapedCabinet, entities, peers, isResting, isImmersiveActive]);

  // Reactive effect triggers to emit visual rewards (Juice Injection)
  useEffect(() => {
    const engine = effectsEngineRef.current;
    if (!engine) return;

    const canvasSize = 600;
    const cellSize = canvasSize / 25; // Viewport-sized cells (24px)

    // 0.5. Spawning a Glitch Rival alert flash & screen shake
    if (rivals.length > prevRivalsRef.current.length && prevRivalsRef.current.length === 0) {
      engine.triggerShake(12);
      engine.triggerFlash('rgba(244, 63, 94, 0.18)', 0.75, 0.03);
      sfx.playClick();
      engine.spawnFloatingText(12, 12, cellSize, 'WARNING: RIVAL INTRUSION! ⚡', '#f43f5e');
    }

    // 0.75. Blocked Rival crash burst reaction (cut off success!)
    prevRivalsRef.current.forEach((prevRival) => {
      const stillAlive = rivals.some((r) => r.id === prevRival.id && r.alive);
      if (!stillAlive && prevRival.alive) {
        const rHead = prevRival.body[0];
        if (rHead) {
          engine.spawnBurst(rHead.x, rHead.y, cellSize, '#f43f5e', 26);
          engine.spawnFloatingText(rHead.x, rHead.y, cellSize, 'BLOCKED! +12 🪙', '#fbbf24');
          engine.triggerShake(14);
          engine.triggerFlash('rgba(244, 63, 94, 0.16)', 0.6, 0.035);
        }
      }
    });
    prevRivalsRef.current = rivals;

    // Prey Mice consumption juices check
    prevEntitiesRef.current.forEach((prevEntity) => {
      const stillAlive = entities.some((e) => e.id === prevEntity.id && e.alive);
      if (!stillAlive && prevEntity.alive) {
        // Trigger spark burst
        engine.spawnBurst(prevEntity.x, prevEntity.y, cellSize, '#fbbf24', 18);
        engine.spawnShockwave(prevEntity.x, prevEntity.y, cellSize, '#fbbf24', 140);
        engine.spawnFloatingText(prevEntity.x, prevEntity.y, cellSize, 'EAT PREY! +30 ✨ +5 🪙', '#fbbf24');
        engine.triggerShake(8);
        engine.triggerFlash('rgba(251, 191, 36, 0.12)', 0.5, 0.04);
      }
    });
    prevEntitiesRef.current = entities;

    // 1. Scoring event reactions (Standard Apple vs Legendary Golden Star Apple)
    if (score > prevScoreRef.current) {
      const diffPoints = score - prevScoreRef.current;

      // Check Golden Apple consumption signature
      if (prevGoldenFoodRef.current && !goldenFood) {
        engine.spawnGoldenSparks(prevGoldenFoodRef.current.x, prevGoldenFoodRef.current.y, cellSize);
        engine.spawnShockwave(prevGoldenFoodRef.current.x, prevGoldenFoodRef.current.y, cellSize, '#fbbf24', 210);
        engine.spawnFloatingText(
          prevGoldenFoodRef.current.x,
          prevGoldenFoodRef.current.y,
          cellSize,
          `+${diffPoints} ✨`,
          '#fbbf24'
        );
        engine.triggerShake(13);
        engine.triggerFlash('rgba(251, 191, 36, 0.16)', 0.6, 0.035);
      } 
      // Check Standard Food consumption signature
      else if (
        prevFoodRef.current &&
        (!food || food.x !== prevFoodRef.current.x || food.y !== prevFoodRef.current.y)
      ) {
        engine.spawnBurst(prevFoodRef.current.x, prevFoodRef.current.y, cellSize, themeColors.food, 14);
        engine.spawnShockwave(prevFoodRef.current.x, prevFoodRef.current.y, cellSize, themeColors.food, 130);
        engine.spawnFloatingText(
          prevFoodRef.current.x,
          prevFoodRef.current.y,
          cellSize,
          `+${diffPoints}`,
          themeColors.food
        );
        engine.triggerShake(5);
        engine.triggerFlash('rgba(255, 255, 255, 0.08)', 0.35, 0.05);
      }
    }

    // 2. Game Crash Action reaction
    if (gameStatus === 'GAMEOVER' && prevStatusRef.current === 'PLAYING') {
      if (snake.length > 0) {
        const head = snake[0];
        // Epic gameover particle spray
        engine.spawnBurst(head.x, head.y, cellSize, '#ef4444', 35);
        engine.spawnShockwave(head.x, head.y, cellSize, '#ef4444', 280);
        engine.spawnFloatingText(head.x, head.y, cellSize, 'CRASH!', '#ef4444');
        engine.triggerShake(24);
        engine.triggerFlash('rgba(239, 68, 68, 0.38)', 0.85, 0.025);
      }
    }

    // Save previous frame references
    prevScoreRef.current = score;
    prevFoodRef.current = food;
    prevGoldenFoodRef.current = goldenFood;
    prevStatusRef.current = gameStatus;
  }, [score, food, goldenFood, gameStatus, gridSize, snake, themeColors.food, entities]);

  // Trigger Open World breach and escape visual effects
  useEffect(() => {
    const engine = effectsEngineRef.current;
    if (!engine) return;

    const canvasSize = 600;
    const VIEWPORT_CELLS = 25;
    const cellSize = canvasSize / VIEWPORT_CELLS;

    if (breachActive) {
      engine.triggerShake(24);
      engine.triggerFlash('rgba(244, 63, 94, 0.3)', 0.8, 0.02);
      engine.spawnFloatingText(12, 8, cellSize, '🚨 SYSTEM BREACH DETECTED! 🚨', '#f43f5e');
      engine.spawnFloatingText(12, 12, cellSize, '➡️ ESCAPE RIGHT PORTAL NOW! ➡️', '#fbbf24');
    }
  }, [breachActive]);

  useEffect(() => {
    const engine = effectsEngineRef.current;
    if (!engine) return;

    const canvasSize = 600;
    const VIEWPORT_CELLS = 25;
    const cellSize = canvasSize / VIEWPORT_CELLS;

    if (hasEscapedCabinet) {
      engine.triggerShake(22);
      engine.triggerFlash('rgba(6, 182, 212, 0.25)', 0.85, 0.02);
      engine.spawnFloatingText(12, 12, cellSize, 'CABINET ESCAPED! 🌌', '#06b6d4');
      // Spawn burst of cyan sparks from the center!
      engine.spawnBurst(12, 12, cellSize, '#06b6d4', 28);
    }
  }, [hasEscapedCabinet]);

  // Trigger tactile CRT overlay notifications on dynamic wind cycles
  useEffect(() => {
    const engine = effectsEngineRef.current;
    if (!engine) return;

    const canvasSize = 600;
    const VIEWPORT_CELLS = 25;
    const cellSize = canvasSize / VIEWPORT_CELLS;

    if (slipstream !== prevSlipstreamRef.current) {
      if (slipstream === 'DRIFT') {
        // Wind gusts cycle alert triggers!
        engine.triggerShake(9);
        // Phosphor theme-specific warning flashes!
        const flashColor = themeKey === 'CLASSIC_LCD' 
          ? 'rgba(0, 0, 0, 0.08)' 
          : themeKey === 'CYBERPUNK'
          ? 'rgba(236, 72, 153, 0.14)'
          : themeKey === 'AMBER_CRT'
          ? 'rgba(245, 158, 11, 0.14)'
          : 'rgba(34, 197, 94, 0.14)';
        engine.triggerFlash(flashColor, 0.5, 0.035);
        sfx.playClick(); // Plays visual feedback alert audio cue!

        // Float an alarm text in the center screen
        engine.spawnFloatingText(12, 12, cellSize, 'WARNING: GALE WINDS! 🌬', '#ef4444');
      } else if (slipstream === 'NONE' && prevSlipstreamRef.current === 'DRIFT') {
        // Wind dies down!
        engine.triggerFlash('rgba(255, 255, 255, 0.05)', 0.3, 0.04);
        engine.spawnFloatingText(12, 12, cellSize, 'WIND CALM 🍃', '#22c55e');
      }
      prevSlipstreamRef.current = slipstream;
    }
  }, [slipstream, themeKey, themeColors]);

  // Main 60FPS high-fidelity rendering pipeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasSize = 600;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    let animationFrameId: number;
    const engine = effectsEngineRef.current;

    const renderLoop = () => {
      // Draw frame context
      const state = stateRef.current;
      
      // We always render a fixed 25x25 tile window.
      // E.g., if the map is 50x50, we show a zoomed viewport so cells represent the exact same 24px width!
      const VIEWPORT_CELLS = 25;
      const cellSize = canvasSize / VIEWPORT_CELLS; // Always 24px (600 / 25)

      // Calculate sliding camera center on the snake head
      const head = state.snake[0] || { x: 12, y: 12 };
      
      let cameraCellX = 0;
      let cameraCellY = 0;

      if (state.hasEscapedCabinet) {
        const targetCameraX = head.x - Math.floor(VIEWPORT_CELLS / 2);
        const targetCameraY = head.y - Math.floor(VIEWPORT_CELLS / 2);

        // Snap camera instantly on the very first frame after escaping to prevent long scroll lag
        if (cameraRef.current.x === 0 && cameraRef.current.y === 0) {
          cameraRef.current.x = targetCameraX;
          cameraRef.current.y = targetCameraY;
        }

        // Smoothly LERP camera position towards the head centered target
        cameraRef.current.x += (targetCameraX - cameraRef.current.x) * 0.12;
        cameraRef.current.y += (targetCameraY - cameraRef.current.y) * 0.12;

        cameraCellX = cameraRef.current.x;
        cameraCellY = cameraRef.current.y;
      } else {
        // Lock camera centered inside cabinet box
        cameraRef.current.x = 0;
        cameraRef.current.y = 0;
        cameraCellX = 0;
        cameraCellY = 0;
      }

      // 1. Clear with matrix grid background
      ctx.fillStyle = state.themeColors.gridBackground;
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // Save context state for screen shake and scrolling camera transformations
      ctx.save();
      
      // Apply screen shake
      if (engine.shakeX !== 0 || engine.shakeY !== 0) {
        ctx.translate(engine.shakeX, engine.shakeY);
      }

      // Apply sliding camera offset centered on the snake
      ctx.translate(-cameraCellX * cellSize, -cameraCellY * cellSize);

      // 1.22. Spawn Floating Environmental Biome Particles
      if (state.gameStatus === 'PLAYING' && envParticlesRef.current.length < 50) {
        const pX = Math.random() * (state.gridSize * cellSize);
        const pY = Math.random() * (state.gridSize * cellSize);
        let pColor = 'rgba(34, 197, 94, 0.2)';
        let pSize = 1.5 + Math.random() * 2;
        let pSpeed = 0.15 + Math.random() * 0.25;
        let label: string | undefined;

        if (state.biome === 'NEON_GRID') {
          pColor = state.themeKey === 'CYBERPUNK' ? 'rgba(6, 182, 212, 0.22)' : 'rgba(34, 197, 94, 0.22)';
          pSize = 1.0 + Math.random() * 1.5;
        } else if (state.biome === 'SAND_RUINS') {
          pColor = state.themeKey === 'CLASSIC_LCD' ? 'rgba(53, 79, 82, 0.16)' : 'rgba(217, 119, 6, 0.16)'; // sand amber
          pSize = 1.5 + Math.random() * 2.2;
        } else if (state.biome === 'TOXIC_WASTE') {
          pColor = 'rgba(163, 230, 53, 0.18)'; // toxic green
          pSize = 2.5 + Math.random() * 3.5; // gas bubble size
        } else if (state.biome === 'GLITCH_VOID') {
          pColor = state.themeKey === 'CYBERPUNK' ? 'rgba(236, 72, 153, 0.16)' : 'rgba(34, 197, 94, 0.16)';
          pSize = 7.5; // binary text size
          label = Math.random() < 0.5 ? '0' : '1';
        }

        envParticlesRef.current.push({
          x: pX,
          y: pY,
          vx: (Math.random() - 0.5) * pSpeed * 0.4,
          vy: state.biome === 'TOXIC_WASTE' ? -pSpeed * 0.8 : (Math.random() - 0.5) * pSpeed * 0.4,
          size: pSize,
          color: pColor,
          life: 1.0,
          speed: pSpeed,
          seed: Math.random(),
          label,
        });
      }

      // Update & Draw Wind-Reactive Biome Environmental Particles
      ctx.save();
      let windAccX = 0;
      let windAccY = 0;
      if (state.slipstream === 'DRIFT') {
        const windForce = 0.32;
        switch (state.slipstreamDir) {
          case 'UP': windAccY = -windForce; break;
          case 'DOWN': windAccY = windForce; break;
          case 'LEFT': windAccX = -windForce; break;
          case 'RIGHT': windAccX = windForce; break;
        }
      }

      const mapTotalSize = state.gridSize * cellSize;

      envParticlesRef.current.forEach((p) => {
        // Apply dynamic wind storm acceleration
        p.vx = p.vx * 0.95 + windAccX * 0.05;
        p.vy = p.vy * 0.95 + windAccY * 0.05;

        p.x += p.vx + (windAccX * 1.6);
        p.y += p.vy + (windAccY * 1.6);

        // Bubble vents naturally rise vertically when wind is calm
        if (state.biome === 'TOXIC_WASTE' && state.slipstream !== 'DRIFT') {
          p.y -= p.speed * 0.6;
        }

        // Warp environmental coordinates
        if (p.x < 0) p.x += mapTotalSize;
        if (p.x >= mapTotalSize) p.x -= mapTotalSize;
        if (p.y < 0) p.y += mapTotalSize;
        if (p.y >= mapTotalSize) p.y -= mapTotalSize;

        // Glitch binary symbols
        if (p.label && Math.random() < 0.02) {
          p.label = p.label === '0' ? '1' : '0';
        }

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = 0.35 + Math.sin(Date.now() / 200 + p.seed * 10) * 0.22;

        if (state.biome === 'TOXIC_WASTE') {
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.stroke();
        } else if (state.biome === 'GLITCH_VOID' && p.label) {
          ctx.font = '7px monospace';
          ctx.fillText(p.label, p.x, p.y);
        } else {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.restore();
      });
      ctx.restore();

      // 1.25. Draw Procedural Ground Substrate Terrain details
      if (state.terrainDecorations && state.terrainDecorations.length > 0) {
        ctx.save();
        
        state.terrainDecorations.forEach((deco) => {
          const tileX = deco.x * cellSize;
          const tileY = deco.y * cellSize;
          const tileCenterX = tileX + cellSize / 2;
          const tileCenterY = tileY + cellSize / 2;
          
          // Determine biome-specific theme colors
          let strokeStyle = 'rgba(34,197,94,0.08)';
          let fillStyle = 'rgba(34,197,94,0.08)';

          if (state.themeKey === 'CYBERPUNK') {
            strokeStyle = 'rgba(236,72,153,0.08)';
            fillStyle = 'rgba(236,72,153,0.08)';
          } else if (state.themeKey === 'AMBER_CRT') {
            strokeStyle = 'rgba(245,158,11,0.08)';
            fillStyle = 'rgba(245,158,11,0.08)';
          } else if (state.themeKey === 'CLASSIC_LCD') {
            strokeStyle = 'rgba(0,0,0,0.06)';
            fillStyle = 'rgba(0,0,0,0.06)';
          } else if (state.themeKey === 'MONOCHROME_POCKET') {
            strokeStyle = 'rgba(255,255,255,0.06)';
            fillStyle = 'rgba(255,255,255,0.06)';
          }

          ctx.strokeStyle = strokeStyle;
          ctx.fillStyle = fillStyle;
          
          // Compute dynamic proximity glow boost from expanding shockwaves
          let shockwaveBoost = 1.0;
          engine.shockwaves.forEach((sw) => {
            const dx = tileCenterX - sw.x;
            const dy = tileCenterY - sw.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (Math.abs(dist - sw.r) < 22) {
              shockwaveBoost += 3.8 * sw.life; // glowing sweep boost!
            }
          });

          ctx.globalAlpha = Math.min(0.9, deco.opacityMultiplier * shockwaveBoost);
          ctx.lineWidth = 1;

          // BIOME RENDER MODULAR MATRIX
          if (deco.biome === 'NEON_GRID') {
            // Cyberpunk Integrated Circuits & logic junctions
            switch (deco.variant) {
              case 0: {
                // Logic Gate square terminal
                ctx.strokeRect(tileCenterX - 3, tileCenterY - 3, 6, 6);
                
                // Micro Blinking indicator LED
                const blink = Math.sin(Date.now() / 150 + (deco.seed * 50)) > 0.3;
                if (blink) {
                  ctx.fillStyle = state.themeKey === 'CYBERPUNK' ? 'rgba(6, 182, 212, 0.45)' : 'rgba(34, 197, 94, 0.45)';
                  ctx.fillRect(tileCenterX - 1, tileCenterY - 1, 2, 2);
                }
                break;
              }
              case 1: {
                // Bus Trace Junction crosshair
                ctx.beginPath();
                ctx.moveTo(tileCenterX - 5, tileCenterY);
                ctx.lineTo(tileCenterX + 5, tileCenterY);
                ctx.moveTo(tileCenterX, tileCenterY - 5);
                ctx.lineTo(tileCenterX, tileCenterY + 5);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(tileCenterX, tileCenterY, 1.5, 0, Math.PI * 2);
                ctx.stroke();
                break;
              }
              case 2: {
                // Circuit bus trace lines (45-degree trace angles)
                ctx.beginPath();
                ctx.moveTo(tileCenterX - 6, tileCenterY - 6);
                ctx.lineTo(tileCenterX, tileCenterY);
                ctx.lineTo(tileCenterX + 6, tileCenterY);
                ctx.stroke();
                break;
              }
              case 3: {
                // LED Dot indicator node
                ctx.beginPath();
                ctx.arc(tileCenterX, tileCenterY, 1.5, 0, Math.PI * 2);
                ctx.fill();
                break;
              }
            }
          } 
          else if (deco.biome === 'SAND_RUINS') {
            // Ancient weathered stone and sand dunes
            switch (deco.variant) {
              case 0: {
                // Cracked slab fissure (fractured stone)
                ctx.save();
                ctx.translate(tileCenterX, tileCenterY);
                ctx.rotate(deco.rotation || 0);
                
                ctx.beginPath();
                ctx.moveTo(-5, 0);
                ctx.lineTo(0, -2);
                ctx.lineTo(2, 2);
                ctx.lineTo(6, 1);
                ctx.stroke();
                ctx.restore();
                break;
              }
              case 1: {
                // Sand ripples chevron
                ctx.save();
                ctx.translate(tileCenterX, tileCenterY);
                ctx.rotate(deco.rotation || 0);
                
                ctx.beginPath();
                ctx.arc(0, 0, 4, -Math.PI / 4, Math.PI / 4);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 0, 7, -Math.PI / 4, Math.PI / 4);
                ctx.stroke();
                ctx.restore();
                break;
              }
              case 2: {
                // Ancient Egyptian/Norse rune glyph carving
                if (deco.label) {
                  ctx.font = '8px monospace';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  
                  ctx.fillStyle = state.themeKey === 'CLASSIC_LCD' ? 'rgba(0,0,0,0.18)' : 'rgba(245, 158, 11, 0.22)';
                  ctx.fillText(deco.label, tileCenterX, tileCenterY);
                }
                break;
              }
              case 3: {
                // Scattered weathered pebbles (little stones)
                ctx.fillRect(tileCenterX - 2, tileCenterY - 1, 3, 2);
                ctx.fillRect(tileCenterX + 1, tileCenterY + 1, 1, 1);
                break;
              }
            }
          }
          else if (deco.biome === 'TOXIC_WASTE') {
            // Industrial piping and metallic floor plates
            switch (deco.variant) {
              case 0: {
                // Riveted tile plate seams
                ctx.strokeRect(tileX + 1, tileY + 1, cellSize - 2, cellSize - 2);
                
                // Corners rivet studs
                ctx.fillRect(tileX + 2, tileY + 2, 1, 1);
                ctx.fillRect(tileX + cellSize - 3, tileY + 2, 1, 1);
                ctx.fillRect(tileX + 2, tileY + cellSize - 3, 1, 1);
                ctx.fillRect(tileX + cellSize - 3, tileY + cellSize - 3, 1, 1);
                break;
              }
              case 1: {
                // Seam connector pipes running across the cell
                ctx.save();
                ctx.fillStyle = state.themeKey === 'CYBERPUNK' ? 'rgba(49, 46, 129, 0.25)' : 'rgba(34, 197, 94, 0.12)';
                ctx.translate(tileCenterX, tileCenterY);
                ctx.rotate(Math.round((deco.rotation || 0) / (Math.PI / 2)) * (Math.PI / 2)); // align perfectly straight 90 deg
                
                ctx.fillRect(-cellSize / 2, -2, cellSize, 4);
                ctx.strokeRect(-cellSize / 2, -2, cellSize, 4);
                ctx.restore();
                break;
              }
              case 2: {
                // Hazard safety warning chevrons
                ctx.save();
                ctx.beginPath();
                ctx.rect(tileX + 2, tileY + 2, cellSize - 4, cellSize - 4);
                ctx.clip();
                
                ctx.strokeStyle = state.themeKey === 'CYBERPUNK' ? 'rgba(236, 72, 153, 0.14)' : 'rgba(234, 179, 8, 0.14)';
                ctx.lineWidth = 2.5;
                for (let k = -5; k < cellSize + 5; k += 5) {
                  ctx.beginPath();
                  ctx.moveTo(tileX + k, tileY);
                  ctx.lineTo(tileX + k - 5, tileY + cellSize);
                  ctx.stroke();
                }
                ctx.restore();
                break;
              }
              case 3: {
                // Steam radioactive gas grill vent
                ctx.beginPath();
                ctx.arc(tileCenterX, tileCenterY, 4, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(tileCenterX - 3, tileCenterY - 2); ctx.lineTo(tileCenterX + 3, tileCenterY - 2);
                ctx.moveTo(tileCenterX - 4, tileCenterY);     ctx.lineTo(tileCenterX + 4, tileCenterY);
                ctx.moveTo(tileCenterX - 3, tileCenterY + 2); ctx.lineTo(tileCenterX + 3, tileCenterY + 2);
                ctx.stroke();
                break;
              }
            }
          }
          else {
            // GLITCH_VOID - digital data matrix
            switch (deco.variant) {
              case 0: {
                // Matrix terminal binary streams
                if (deco.label) {
                  let val = deco.label;
                  if (Math.random() < 0.005) {
                    val = val === '0' ? '1' : '0';
                    deco.label = val;
                  }
                  
                  ctx.font = '7px monospace';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(val, tileCenterX, tileCenterY);
                }
                break;
              }
              case 1: {
                // Concentric glowing quantum ripple portal
                const radius = 2.0 + Math.abs(Math.sin(Date.now() / 300 + deco.seed * 10)) * 3.5;
                ctx.beginPath();
                ctx.arc(tileCenterX, tileCenterY, radius, 0, Math.PI * 2);
                ctx.stroke();
                break;
              }
              case 2: {
                // Quantum dashed hollow memory blocks
                ctx.save();
                ctx.setLineDash([2, 2]);
                ctx.strokeRect(tileCenterX - 4, tileCenterY - 4, 8, 8);
                ctx.restore();
                break;
              }
              case 3: {
                // Digital phosphor dust clusters
                ctx.fillRect(tileCenterX - 2, tileCenterY - 1, 1, 1);
                ctx.fillRect(tileCenterX + 1, tileCenterY + 1, 1, 1);
                ctx.fillRect(tileCenterX - 1, tileCenterY + 2, 1, 1);
                break;
              }
            }
          }
        });
        
        ctx.restore();
      }

      // 1.5. Draw Slipstream Drift Current arrows if active
      if (state.slipstream === 'DRIFT') {
        ctx.save();
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.09)'; // Green phosphor outlines
        ctx.fillStyle = 'rgba(34, 197, 94, 0.04)';
        ctx.lineWidth = 1.5;
        
        const windDir = state.slipstreamDir || 'RIGHT';
        
        // Dynamic animation tick offsets
        const timeOffset = (Date.now() / 15) % (state.gridSize * cellSize);
        const arrowGap = 150; // space between arrows
        
        const totalSize = state.gridSize * cellSize;
        
        // Draw diagonal flowing columns of wind chevrons
        for (let col = 50; col < totalSize; col += arrowGap) {
          for (let row = 50; row < totalSize; row += arrowGap) {
            ctx.save();
            
            let arrowX = col;
            let arrowY = row;
            
            // Flow the wind vectors
            switch (windDir) {
              case 'UP': arrowY -= timeOffset; break;
              case 'DOWN': arrowY += timeOffset; break;
              case 'LEFT': arrowX -= timeOffset; break;
              case 'RIGHT': arrowX += timeOffset; break;
            }
            
            // wrap boundary coords
            arrowX = (arrowX + totalSize) % totalSize;
            arrowY = (arrowY + totalSize) % totalSize;
            
            ctx.translate(arrowX, arrowY);
            
            // Rotate chevron based on drift force vector direction
            switch (windDir) {
              case 'UP': ctx.rotate(-Math.PI / 2); break;
              case 'DOWN': ctx.rotate(Math.PI / 2); break;
              case 'LEFT': ctx.rotate(Math.PI); break;
              case 'RIGHT': ctx.rotate(0); break;
            }
            
            // Chevron arrow path
            ctx.beginPath();
            ctx.moveTo(-10, -7);
            ctx.lineTo(4, 0);
            ctx.lineTo(-10, 7);
            ctx.lineTo(-5, 0);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            
            ctx.restore();
          }
        }
        ctx.restore();
      }

      // 2. Draw CRT Grid cells (Infinite Grid lines relative to Viewport Camera)
      if (state.showGridLines) {
        ctx.strokeStyle = state.themeColors.gridLine;
        ctx.lineWidth = 1;

        const startX = Math.floor(cameraCellX) - 1;
        const endX = Math.ceil(cameraCellX) + VIEWPORT_CELLS + 1;
        const startY = Math.floor(cameraCellY) - 1;
        const endY = Math.ceil(cameraCellY) + VIEWPORT_CELLS + 1;

        // Draw vertical lines
        for (let i = startX; i <= endX; i++) {
          ctx.beginPath();
          ctx.moveTo(i * cellSize, startY * cellSize);
          ctx.lineTo(i * cellSize, endY * cellSize);
          ctx.stroke();
        }

        // Draw horizontal lines
        for (let j = startY; j <= endY; j++) {
          ctx.beginPath();
          ctx.moveTo(startX * cellSize, j * cellSize);
          ctx.lineTo(endX * cellSize, j * cellSize);
          ctx.stroke();
        }
      }

      // Draw cabinet boundaries (only for 25x25 cabinet or when escaped the cabinet into the open world)
      if (state.gridSize === 25 || state.gridSize === 100) {
        ctx.save();
        ctx.strokeStyle = state.themeColors.snakeHead;
        ctx.lineWidth = 3;
        
        const mapWidth = 25 * cellSize;
        
        // Top boundary line
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(mapWidth, 0);
        ctx.stroke();

        // Left boundary line
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, mapWidth);
        ctx.stroke();

        // Bottom boundary line
        ctx.beginPath();
        ctx.moveTo(0, mapWidth);
        ctx.lineTo(mapWidth, mapWidth);
        ctx.stroke();

        // Right boundary line (with dynamic breach portal gap at y = 10..14 * cellSize)
        ctx.beginPath();
        ctx.moveTo(mapWidth, 0);
        if (state.breachActive) {
          // Draw down to the gap
          ctx.lineTo(mapWidth, 10 * cellSize);
          ctx.stroke();

          // Draw from below the gap down to the bottom
          ctx.beginPath();
          ctx.moveTo(mapWidth, 15 * cellSize);
          ctx.lineTo(mapWidth, mapWidth);
          ctx.stroke();

          // Draw visually stunning, massive glowing glitching portal in the 5-cell gap
          ctx.save();
          
          // Outer neon portal glow
          ctx.strokeStyle = state.themeKey === 'CYBERPUNK' ? 'rgba(236, 72, 153, 0.85)' : 'rgba(34, 197, 94, 0.85)';
          ctx.fillStyle = state.themeKey === 'CYBERPUNK' ? 'rgba(236, 72, 153, 0.12)' : 'rgba(34, 197, 94, 0.12)';
          ctx.lineWidth = 4;
          ctx.shadowBlur = 15;
          ctx.shadowColor = ctx.strokeStyle;
          
          // Draw a pulsing portal gateway arch extending slightly outwards to show it is a portal!
          ctx.beginPath();
          ctx.moveTo(mapWidth, 10 * cellSize);
          ctx.bezierCurveTo(mapWidth + 24, 10 * cellSize, mapWidth + 24, 15 * cellSize, mapWidth, 15 * cellSize);
          ctx.stroke();
          ctx.fill();
          
          // Draw animated flowing navigation chevrons inside the portal (>>>)
          ctx.shadowBlur = 0; // reset shadow for chevrons
          ctx.strokeStyle = state.themeKey === 'CYBERPUNK' ? '#06b6d4' : '#fbbf24'; // Cyan/Amber chevrons
          ctx.lineWidth = 2.5;
          
          const timeOffset = (Date.now() / 8) % 40;
          for (let yOffset = 10.5; yOffset < 15; yOffset += 1.2) {
            ctx.save();
            ctx.translate(mapWidth + 8, yOffset * cellSize);
            // Flowing chevrons moving right
            const alpha = 0.45 + Math.sin((Date.now() / 150) + yOffset) * 0.4;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(-4, -6);
            ctx.lineTo(4, 0);
            ctx.lineTo(-4, 6);
            ctx.stroke();
            ctx.restore();
          }
          
          // Draw a pulsing text inside the portal "ESCAPE!"
          ctx.fillStyle = '#ffffff';
          ctx.font = "bold 9px 'Courier New', Courier, monospace";
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 100) * 0.4;
          
          ctx.save();
          ctx.translate(mapWidth + 14, 12.5 * cellSize);
          ctx.rotate(Math.PI / 2); // vertical text slithering down
          ctx.fillText('ESCAPE 🌌', 0, 0);
          ctx.restore();
          
          ctx.restore();
        } else {
          // Draw solid wall
          ctx.lineTo(mapWidth, mapWidth);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw premium outer map boundaries for Large Expansion (50x50) or Open World (100x100)
      if (state.gridSize === 50 || state.gridSize === 100) {
        ctx.save();
        
        // Glow aesthetics
        ctx.strokeStyle = state.themeKey === 'CYBERPUNK' ? '#ec4899' : state.themeColors.snakeHead;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 12;
        ctx.shadowColor = ctx.strokeStyle;
        
        const outerWidth = state.gridSize * cellSize;
        ctx.beginPath();
        ctx.strokeRect(0, 0, outerWidth, outerWidth);
        
        // Add double thin inner border line for high-end phosphor feel
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = 0.55;
        ctx.strokeRect(2, 2, outerWidth - 4, outerWidth - 4);
        
        ctx.restore();
      }

      // 3. Draw Level Obstacles
      ctx.fillStyle = state.themeColors.obstacle;
      state.obstacles.forEach((obs) => {
        const isLaserGate = state.laserGateObstacles?.some((gate) => gate.x === obs.x && gate.y === obs.y);

        if (isLaserGate) {
          ctx.save();
          if (state.laserGatesActive) {
            // Lethal glowing red gate state!
            ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.fillRect(obs.x * cellSize + 2, obs.y * cellSize + 2, cellSize - 4, cellSize - 4);
            ctx.strokeRect(obs.x * cellSize + 3, obs.y * cellSize + 3, cellSize - 6, cellSize - 6);

            // Draw center flashing warning dot
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(obs.x * cellSize + cellSize / 2 - 2, obs.y * cellSize + cellSize / 2 - 2, 4, 4);
          } else {
            // Safe glowing cyan/blue grid bypass state!
            ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)';
            ctx.lineWidth = 1;
            ctx.fillRect(obs.x * cellSize + 3, obs.y * cellSize + 3, cellSize - 6, cellSize - 6);
            ctx.strokeRect(obs.x * cellSize + 4, obs.y * cellSize + 4, cellSize - 8, cellSize - 8);
          }
          ctx.restore();
        } else {
          // Standard solid obstacle block drawing
          ctx.fillRect(obs.x * cellSize + 2, obs.y * cellSize + 2, cellSize - 4, cellSize - 4);

          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(obs.x * cellSize + 2, obs.y * cellSize + cellSize - 4, cellSize - 4, 2);
          ctx.fillRect(obs.x * cellSize + cellSize - 4, obs.y * cellSize + 2, 2, cellSize - 4);

          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(obs.x * cellSize + 2, obs.y * cellSize + 2, cellSize - 4, 2);
          ctx.fillRect(obs.x * cellSize + 2, obs.y * cellSize + 2, 2, cellSize - 4);
          ctx.fillStyle = state.themeColors.obstacle;
        }
      });

      // 4. Draw Core Food
      if (state.food) {
        const appleX = state.food.x * cellSize;
        const appleY = state.food.y * cellSize;

        ctx.fillStyle = state.themeColors.food;
        ctx.fillRect(appleX + 4, appleY + 6, cellSize - 8, cellSize - 10);
        ctx.fillRect(appleX + 6, appleY + 4, cellSize - 12, cellSize - 6);
        
        ctx.fillStyle = state.themeKey === 'CLASSIC_LCD' ? '#111' : '#10b981';
        ctx.fillRect(appleX + cellSize / 2 - 1, appleY + 1, 3, 4);
        
        if (state.themeKey !== 'CLASSIC_LCD') {
          ctx.fillStyle = '#34d399';
          ctx.fillRect(appleX + cellSize / 2 + 1, appleY + 1, 3, 2);
        }
      }

      // 5. Draw Golden Powerup Apple
      if (state.goldenFood) {
        const goldX = state.goldenFood.x * cellSize;
        const goldY = state.goldenFood.y * cellSize;

        const pulse = Math.floor(Date.now() / 150) % 2 === 0;
        ctx.fillStyle = pulse ? state.themeColors.goldenFood : '#ffffff';
        
        const mid = cellSize / 2;
        ctx.fillRect(goldX + mid - 3, goldY + 2, 6, cellSize - 4);
        ctx.fillRect(goldX + 2, goldY + mid - 3, cellSize - 4, 6);
        ctx.fillRect(goldX + mid - 5, goldY + mid - 5, 10, 10);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(goldX + mid - 2, goldY + mid - 2, 4, 4);
      }

      // 6. Draw Snake Chassis
      state.snake.forEach((seg, index) => {
        const isHead = index === 0;
        const x = seg.x * cellSize;
        const y = seg.y * cellSize;

        if (isHead) {
          ctx.fillStyle = state.themeColors.snakeHead;
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

          ctx.fillStyle = state.themeKey === 'CLASSIC_LCD' ? '#cad2c5' : '#000000';
          const eyeWidth = 3;
          const eyeHeight = 3;

          if (state.direction === 'UP') {
            ctx.fillRect(x + 4, y + 5, eyeWidth, eyeHeight);
            ctx.fillRect(x + cellSize - 4 - eyeWidth, y + 5, eyeWidth, eyeHeight);
          } else if (state.direction === 'DOWN') {
            ctx.fillRect(x + 4, y + cellSize - 8, eyeWidth, eyeHeight);
            ctx.fillRect(x + cellSize - 4 - eyeWidth, y + cellSize - 8, eyeWidth, eyeHeight);
          } else if (state.direction === 'LEFT') {
            ctx.fillRect(x + 5, y + 4, eyeWidth, eyeHeight);
            ctx.fillRect(x + 5, y + cellSize - 4 - eyeHeight, eyeWidth, eyeHeight);
          } else if (state.direction === 'RIGHT') {
            ctx.fillRect(x + cellSize - 5 - eyeWidth, y + 4, eyeWidth, eyeHeight);
            ctx.fillRect(x + cellSize - 5 - eyeWidth, y + cellSize - 4 - eyeHeight, eyeWidth, eyeHeight);
          }

          // DRAW CUSTOM EQUIPPED HAT ON SNAKE HEAD
          if (state.activeHat && state.activeHat !== 'NONE') {
            ctx.save();
            switch (state.activeHat) {
              case 'COWBOY':
                // Leather Cowboy hat style
                ctx.fillStyle = '#8B4513'; // Saddle brown
                // Brim
                ctx.fillRect(x - 2, y + 2, cellSize + 4, 3);
                // Crown
                ctx.fillRect(x + cellSize / 4, y - 5, cellSize / 2, 7);
                // Red hat band
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(x + cellSize / 4, y + 1, cellSize / 2, 1.5);
                break;
              case 'CROWN':
                // Royalty Golden Crown
                ctx.fillStyle = '#fbbf24'; // Golden amber
                // Crown rim
                ctx.fillRect(x + 1, y, cellSize - 2, 3);
                // Peaks
                ctx.fillRect(x + 1, y - 3, 3, 3); // Left peak
                ctx.fillRect(x + cellSize / 2 - 1.5, y - 4, 3, 4); // Center tallest peak
                ctx.fillRect(x + cellSize - 4, y - 3, 3, 3); // Right peak
                // Red gem rubies
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(x + cellSize / 2 - 0.5, y - 5, 1, 1);
                break;
              case 'WIZARD':
                // Pointy cosmic wizard hat
                ctx.fillStyle = '#6366f1'; // Indigo hood
                ctx.beginPath();
                ctx.moveTo(x + 1, y + 2);
                ctx.lineTo(x + cellSize - 1, y + 2);
                ctx.lineTo(x + cellSize / 2, y - 8);
                ctx.closePath();
                ctx.fill();
                // Golden crescent star mark
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(x + cellSize / 2 - 1, y - 2, 2, 2);
                break;
              case 'TOP_HAT':
                // Refined Victorian Top Hat
                ctx.fillStyle = '#111827'; // Dark charcoal
                // Brim
                ctx.fillRect(x - 1, y + 1, cellSize + 2, 3);
                // Body cylindrical chassis
                ctx.fillRect(x + cellSize / 4, y - 7, cellSize / 2, 8);
                // Red velvet ribbon
                ctx.fillStyle = '#dc2626';
                ctx.fillRect(x + cellSize / 4, y, cellSize / 2, 1.5);
                break;
              case 'CHEF':
                // Puffy pristine white chef toque
                ctx.fillStyle = '#f3f4f6'; // Bright white
                ctx.fillRect(x + 3, y - 2, cellSize - 6, 4); // Toque column base
                ctx.beginPath();
                ctx.arc(x + cellSize / 2, y - 4, cellSize / 3, 0, Math.PI * 2);
                ctx.fill();
                break;
              case 'PIRATE':
                // Pirate Skull Biretta / Tricorne
                ctx.fillStyle = '#111827'; // Dark gray
                ctx.beginPath();
                ctx.moveTo(x - 2, y + 2);
                ctx.lineTo(x + cellSize + 2, y + 2);
                ctx.lineTo(x + cellSize / 2, y - 3);
                ctx.closePath();
                ctx.fill();
                // Skull bone cross marker
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x + cellSize / 2 - 1, y, 2, 2);
                break;
            }
            ctx.restore();
          }
        } else {
          // DRAW CUSTOM BODY SKINS / STYLES
          ctx.save();
          const borderGap = state.themeKey === 'CLASSIC_LCD' ? 2 : 1;

          if (state.activeBody === 'RAINBOW_CHROMA') {
            // Elegant spectrum rainbow hue
            const hue = (index * 16 + Date.now() / 15) % 360;
            ctx.fillStyle = `hsl(${hue}, 95%, 50%)`;
            ctx.fillRect(
              x + borderGap,
              y + borderGap,
              cellSize - borderGap * 2,
              cellSize - borderGap * 2
            );
          } else if (state.activeBody === 'GHOSTLY') {
            // Semi-transparent phased vapor opacity
            const alpha = Math.max(0.18, 1 - index / state.snake.length);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = state.themeColors.snakeBody;
            ctx.fillRect(
              x + borderGap,
              y + borderGap,
              cellSize - borderGap * 2,
              cellSize - borderGap * 2
            );
          } else if (state.activeBody === 'PLASMA_PULSE') {
            // Flowing continuous energy ripple
            const pulseFactor = Math.abs(Math.sin(Date.now() / 140 - index * 0.45));
            ctx.fillStyle = pulseFactor > 0.72 ? '#ffffff' : state.themeColors.snakeBody;
            ctx.fillRect(
              x + borderGap,
              y + borderGap,
              cellSize - borderGap * 2,
              cellSize - borderGap * 2
            );
            
            // Core bolt lines
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(x + cellSize / 2 - 1, y + cellSize / 2 - 1, 2, 2);
          } else if (state.activeBody === 'CYBER_MATRIX') {
            // Vintage target telemetry system
            ctx.fillStyle = state.themeColors.snakeBody;
            ctx.fillRect(
              x + borderGap,
              y + borderGap,
              cellSize - borderGap * 2,
              cellSize - borderGap * 2
            );
            // Cyan target crosshair rings
            ctx.strokeStyle = state.themeColors.snakeHead;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2.8, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            // Normal fallback theme skin
            ctx.fillStyle = state.themeColors.snakeBody;
            ctx.fillRect(
              x + borderGap,
              y + borderGap,
              cellSize - borderGap * 2,
              cellSize - borderGap * 2
            );

            if (state.themeKey === 'CYBERPUNK') {
              ctx.fillStyle = state.themeColors.snakeBodyGrad;
              ctx.fillRect(x + cellSize / 2 - 2, y + cellSize / 2 - 2, 4, 4);
            }
          }
          ctx.restore();
        }
      });

      // 6.25. Draw Prey Entities (Mice)
      if (state.entities && state.entities.length > 0) {
        state.entities.forEach((entity) => {
          if (!entity.alive) return;
          const x = entity.x * cellSize;
          const y = entity.y * cellSize;
          const centerX = x + cellSize / 2;
          const centerY = y + cellSize / 2;

          ctx.save();

          const time = Date.now() / 150;

          // Tail: squiggly thin pink line trailing behind it
          ctx.strokeStyle = '#f472b6';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          const wiggleFactor = entity.behaviorState === 'FLEEING' ? 2 : 1;
          const tailWiggle = Math.sin(time * 2.2 * wiggleFactor) * 3.5;
          ctx.bezierCurveTo(
            centerX - 4, centerY + 6 + tailWiggle,
            centerX - 8, centerY + 8 - tailWiggle,
            centerX - 12, centerY + 12 + tailWiggle
          );
          ctx.stroke();

          // Body: a rounded grey/white circle centered in the cell
          ctx.fillStyle = '#9ca3af';
          ctx.beginPath();
          ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
          ctx.fill();

          // Highlight
          ctx.fillStyle = '#e5e7eb';
          ctx.beginPath();
          ctx.arc(centerX - 1.2, centerY - 1.2, 1.8, 0, Math.PI * 2);
          ctx.fill();

          // Infer orientation facing away from player head (if fleeing) or towards (if wandering)
          let headOffsetX = 0;
          let headOffsetY = 0;
          let earOffsetX1 = 0, earOffsetY1 = 0;
          let earOffsetX2 = 0, earOffsetY2 = 0;

          const dx = centerX - (head.x * cellSize + cellSize / 2);
          const dy = centerY - (head.y * cellSize + cellSize / 2);

          if (entity.behaviorState === 'FLEEING') {
            if (Math.abs(dx) > Math.abs(dy)) {
              headOffsetX = dx > 0 ? 4 : -4;
              earOffsetX1 = dx > 0 ? 2 : -2; earOffsetY1 = -3.5;
              earOffsetX2 = dx > 0 ? 2 : -2; earOffsetY2 = 3.5;
            } else {
              headOffsetY = dy > 0 ? 4 : -4;
              earOffsetX1 = -3.5; earOffsetY1 = dy > 0 ? 2 : -2;
              earOffsetX2 = 3.5; earOffsetY2 = dy > 0 ? 2 : -2;
            }
          } else {
            if (Math.abs(dx) > Math.abs(dy)) {
              headOffsetX = dx > 0 ? -4 : 4;
              earOffsetX1 = dx > 0 ? -2 : 2; earOffsetY1 = -3.5;
              earOffsetX2 = dx > 0 ? -2 : 2; earOffsetY2 = 3.5;
            } else {
              headOffsetY = dy > 0 ? -4 : 4;
              earOffsetX1 = -3.5; earOffsetY1 = dy > 0 ? -2 : 2;
              earOffsetX2 = 3.5; earOffsetY2 = dy > 0 ? -2 : 2;
            }
          }

          // Ears
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(centerX + earOffsetX1, centerY + earOffsetY1, 1.8, 0, Math.PI * 2);
          ctx.arc(centerX + earOffsetX2, centerY + earOffsetY2, 1.8, 0, Math.PI * 2);
          ctx.fill();

          // Head
          ctx.fillStyle = '#9ca3af';
          ctx.beginPath();
          ctx.arc(centerX + headOffsetX, centerY + headOffsetY, 3, 0, Math.PI * 2);
          ctx.fill();

          // Nose/eyes dot
          ctx.fillStyle = '#111827';
          ctx.beginPath();
          ctx.arc(centerX + headOffsetX * 1.3, centerY + headOffsetY * 1.3, 0.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        });
      }

      // 6.35. Draw Edge P2P Active Peer Serpents
      if (state.peers && state.peers.length > 0) {
        state.peers.forEach((peer) => {
          if (!peer.alive) return;
          
          peer.body.forEach((seg, index) => {
            const isPeerHead = index === 0;
            const x = seg.x * cellSize;
            const y = seg.y * cellSize;

            ctx.save();
            ctx.fillStyle = isPeerHead ? peer.color : 'rgba(255, 255, 255, 0.16)';
            ctx.strokeStyle = peer.color;
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2 - 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Inner core glow highlights
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.22;
            ctx.beginPath();
            ctx.arc(x + cellSize / 2 - 1, y + cellSize / 2 - 1, 1.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (isPeerHead) {
              ctx.save();
              
              // Floating name tag
              ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
              ctx.font = "bold 7px 'Courier New', Courier, monospace";
              ctx.textAlign = 'center';
              ctx.fillText(peer.name, x + cellSize / 2, y - 4);

              // Vector floating chat bubble with emoji
              if (peer.emoji) {
                ctx.fillStyle = 'rgba(10, 10, 10, 0.85)';
                ctx.strokeStyle = peer.color;
                ctx.lineWidth = 1;

                // Rounded chat rectangle
                ctx.beginPath();
                ctx.roundRect(x + cellSize / 2 - 8, y - 20, 16, 11, 2);
                ctx.fill();
                ctx.stroke();

                // Speech pointer bubble tail
                ctx.beginPath();
                ctx.moveTo(x + cellSize / 2 - 2, y - 9);
                ctx.lineTo(x + cellSize / 2, y - 7);
                ctx.lineTo(x + cellSize / 2 + 2, y - 9);
                ctx.fill();

                // Centered emoji
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(peer.emoji, x + cellSize / 2, y - 14);
              }
              ctx.restore();
            }
          });
        });
      }

      // 6.5. Draw Glitch AI Rival Serpents
      if (state.rivals && state.rivals.length > 0) {
        state.rivals.forEach((rival) => {
          if (!rival.alive) return;
          rival.body.forEach((seg, index) => {
            const isRHead = index === 0;
            const x = seg.x * cellSize;
            const y = seg.y * cellSize;
            ctx.save();
            ctx.fillStyle = isRHead ? '#f43f5e' : '#ec4899';
            
            // shimmer glitch offset
            const shimmer = Math.sin(Date.now() / 45 + index) * 1.6;
            ctx.translate(shimmer, 0);
            
            ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
            
            if (isRHead) {
              // draw glitch cyan phosphor eyes
              ctx.fillStyle = '#06b6d4';
              const eyeWidth = 3;
              const eyeHeight = 3;
              if (rival.dir === 'UP') {
                ctx.fillRect(x + 4, y + 5, eyeWidth, eyeHeight);
                ctx.fillRect(x + cellSize - 4 - eyeWidth, y + 5, eyeWidth, eyeHeight);
              } else if (rival.dir === 'DOWN') {
                ctx.fillRect(x + 4, y + cellSize - 8, eyeWidth, eyeHeight);
                ctx.fillRect(x + cellSize - 4 - eyeWidth, y + cellSize - 8, eyeWidth, eyeHeight);
              } else {
                ctx.fillRect(x + 5, y + 5, eyeWidth, eyeHeight);
                ctx.fillRect(x + cellSize - 8, y + 5, eyeWidth, eyeHeight);
              }
            }
            ctx.restore();
          });
        });
      }

      // 7. Continuous Core Particle Emission Trails from Tail Endpoint
      if (state.gameStatus === 'PLAYING' && state.snake.length > 0) {
        const lastIndex = state.snake.length - 1;
        const tail = state.snake[lastIndex];
        const emitX = (tail.x + 0.5) * cellSize;
        const emitY = (tail.y + 0.5) * cellSize;

        if (state.activeParticle && Math.random() < 0.38) {
          if (state.activeParticle === 'NONE') {
            // Subtle default theme phosphor trail that dissolves quickly
            engine.particles.push({
              x: emitX + (Math.random() - 0.5) * 4,
              y: emitY + (Math.random() - 0.5) * 4,
              vx: (Math.random() - 0.5) * 0.8,
              vy: (Math.random() - 0.5) * 0.8,
              color: state.themeKey === 'CLASSIC_LCD' ? 'rgba(53, 79, 82, 0.35)' : state.themeColors.snakeHead,
              size: 2.0 + Math.random() * 1.5,
              life: 0.8,
              decay: 0.055,
              gravity: 0.0
            });
          } else {
            switch (state.activeParticle) {
              case 'FIRE_SPARK':
                // Orange combustion heat embers
                engine.particles.push({
                  x: emitX + (Math.random() - 0.5) * 6,
                  y: emitY + (Math.random() - 0.5) * 6,
                  vx: (Math.random() - 0.5) * 1.6,
                  vy: -0.4 - Math.random() * 0.9,
                  color: Math.random() < 0.55 ? '#f97316' : '#f59e0b',
                  size: 2.2 + Math.random() * 2.8,
                  life: 1.0,
                  decay: 0.045,
                  gravity: -0.06 // Floats upward
                });
                break;
              case 'COSMIC_DUST':
                // Cyan & Pink neon stellar vapors
                engine.particles.push({
                  x: emitX + (Math.random() - 0.5) * 8,
                  y: emitY + (Math.random() - 0.5) * 8,
                  vx: (Math.random() - 0.5) * 2.2,
                  vy: (Math.random() - 0.5) * 2.2,
                  color: Math.random() < 0.5 ? '#06b6d4' : '#ec4899',
                  size: 1.8 + Math.random() * 2.5,
                  life: 1.0,
                  decay: 0.035,
                  gravity: 0.01
                });
                break;
              case 'GOLD_RICH':
                // Shiny golden coins
                engine.particles.push({
                  x: emitX + (Math.random() - 0.5) * 6,
                  y: emitY + (Math.random() - 0.5) * 6,
                  vx: (Math.random() - 0.5) * 1.8,
                  vy: -0.1 - Math.random() * 0.7,
                  color: '#eab308', // Shiny gold yellow
                  size: 3.5 + Math.random() * 2.2,
                  life: 1.0,
                  decay: 0.032,
                  gravity: 0.08 // tumbles down
                });
                break;
              case 'TOXIC_SLIME':
                // Dripping poisonous radioactive sludge drops
                engine.particles.push({
                  x: emitX + (Math.random() - 0.5) * 6,
                  y: emitY + (Math.random() - 0.5) * 6,
                  vx: (Math.random() - 0.5) * 1.1,
                  vy: 0.3 + Math.random() * 0.7,
                  color: '#10b981', // Bubbles neon lime green
                  size: 2.8 + Math.random() * 3.2,
                  life: 1.0,
                  decay: 0.055,
                  gravity: 0.12 // drips down heavy
                });
                break;
            }
          }
        }
      }

      // 8. Render Custom Modular Arcade Effects Layer
      engine.draw(ctx);

      // Restore transformations
      ctx.restore();

      // 8. Draw pause overlay directly on top
      if (state.gameStatus === 'PAUSED') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        ctx.fillStyle = state.themeColors.snakeHead;
        ctx.font = "bold 32px 'Courier New', Courier, monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME PAUSED', canvasSize / 2, canvasSize / 2 - 20);

        ctx.font = "16px 'Courier New', Courier, monospace";
        ctx.fillStyle = '#ffffff';
        ctx.fillText('PRESS SPACE BAR TO CONTINUE', canvasSize / 2, canvasSize / 2 + 25);
      }

      // 8.5. Draw resting / standby indicator
      if (state.isResting) {
        ctx.save();
        ctx.fillStyle = state.themeKey === 'CYBERPUNK' ? '#ec4899' : state.themeColors.snakeHead;
        ctx.font = "bold 13px 'Courier New', Courier, monospace";
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        ctx.shadowBlur = 8;
        ctx.shadowColor = ctx.fillStyle;
        
        ctx.fillText('⏸ STANDBY', 15, 15);
        ctx.restore();
      }

      // 8.6. Draw immersive score overlay in top-right corner
      if (state.isImmersiveActive) {
        ctx.save();
        ctx.fillStyle = state.themeKey === 'CYBERPUNK' ? '#ec4899' : state.themeColors.snakeHead;
        ctx.font = "bold 13px 'Courier New', Courier, monospace";
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        
        ctx.shadowBlur = 8;
        ctx.shadowColor = ctx.fillStyle;
        
        const paddedScore = state.score.toLocaleString(undefined, { minimumIntegerDigits: 5, useGrouping: false });
        ctx.fillText(`SCORE: ${paddedScore}`, canvasSize - 15, 15);
        ctx.restore();
      }

      // Tick continuous vector math triggers
      engine.update();

      // Loop again next refresh interval
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const sizeClass = isImmersiveActive
    ? 'w-[min(96vw,96vh)] max-w-none aspect-square'
    : touchControlsVisible
      ? 'w-[min(90vw,calc(100vh-360px))] max-w-[650px]'
      : 'w-[min(90vw,calc(100vh-180px))] max-w-[650px]';

  return (
    <div 
      className={`relative ${sizeClass} aspect-square mx-auto select-none transition-all duration-500 ease-in-out`} 
      id="retro-board-container"
    >
      {/* Outer Retro Bezel / LCD Screen border with hardware aesthetics */}
      <div className={`w-full h-full relative overflow-hidden rounded-md border-4 ${themeColors.borderClass} transition-shadow duration-300`}>
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-none"
          id="retro-game-canvas"
        />

        {/* Curved CRT glass overlay reflections, micro scanlines, and animated phosphor flicker */}
        {themeColors.crtOverlay && (
          <>
            {/* Repeating CRT Micro Scanlines with phosphor flicker animation */}
            <div 
              className="absolute inset-0 pointer-events-none mix-blend-overlay z-10 opacity-[0.24] animate-crt-flicker"
              style={{
                backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
                backgroundSize: '100% 3px',
              }}
            />
            {/* Vignette curved shadow simulator */}
            <div className="absolute inset-0 pointer-events-none mix-blend-multiply z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_45%,rgba(0,0,0,0.55)_100%)] shadow-[inset_0_0_24px_rgba(0,0,0,0.8)]" />
            {/* Diagonal screen glass glare reflection */}
            <div className="absolute inset-0 pointer-events-none mix-blend-screen z-10 bg-gradient-to-tr from-transparent via-white/4 to-transparent opacity-80" />
          </>
        )}
      </div>
    </div>
  );
}
