import { Position, BiomeType } from '../types';
import { TerrainDecoration } from './terrainManager';

// Deterministic LCG Pseudo-Random Number Generator
export class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = Math.abs(seed) || 12345;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  intRange(min: number, max: number): number {
    return Math.floor(this.range(min, max));
  }
}

// 2D Value Noise Engine
function hash(x: number, y: number): number {
  const val = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return val - Math.floor(val);
}

export function noise2D(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  // Smoothstep interpolation weights
  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uy = fy * fy * (3.0 - 2.0 * fy);

  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);

  const ab = a + ux * (b - a);
  const cd = c + ux * (d - c);

  return ab + uy * (cd - ab);
}

// Map noise values to distinct grid biomes
export function getBiomeForChunk(cx: number, cy: number): BiomeType {
  // Use scale factor 0.3 for organic multi-chunk biomes clustering
  const n = noise2D(cx * 0.3, cy * 0.3);
  if (n < 0.25) return 'TOXIC_WASTE';
  if (n < 0.50) return 'NEON_GRID';
  if (n < 0.75) return 'SAND_RUINS';
  return 'GLITCH_VOID';
}

function isInsideCabinet(x: number, y: number): boolean {
  return x >= 0 && x < 25 && y >= 0 && y < 25;
}

export interface ChunkContent {
  cx: number;
  cy: number;
  biome: BiomeType;
  obstacles: Position[];
  decorations: TerrainDecoration[];
}

// Procedurally generate chunk obstacles and substrate details deterministically
export function generateChunkContent(cx: number, cy: number): ChunkContent {
  const biome = getBiomeForChunk(cx, cy);
  const obstacles: Position[] = [];
  const decorations: TerrainDecoration[] = [];

  // Seed uniquely based on chunk coordinates
  const rng = new SeededRandom(cx * 73856093 ^ cy * 19349663 + 997);

  const startX = cx * 20;
  const startY = cy * 20;

  // 1. Procedural Obstacles
  let obstacleCount = 2;
  if (biome === 'TOXIC_WASTE') obstacleCount = 3;
  else if (biome === 'SAND_RUINS') obstacleCount = 4;
  else if (biome === 'GLITCH_VOID') obstacleCount = 1;

  for (let i = 0; i < obstacleCount; i++) {
    // Keep margins to avoid blocking boundaries tightly
    const rx = rng.intRange(2, 18);
    const ry = rng.intRange(2, 18);
    const absX = startX + rx;
    const absY = startY + ry;

    if (!isInsideCabinet(absX, absY)) {
      obstacles.push({ x: absX, y: absY });
      
      // Sometimes spawn double block pillars
      if (rng.next() < 0.4) {
        const nextX = absX + (rng.next() < 0.5 ? 1 : 0);
        const nextY = absY + (rng.next() < 0.5 ? 0 : 1);
        if (!isInsideCabinet(nextX, nextY) && nextX < startX + 19 && nextY < startY + 19) {
          obstacles.push({ x: nextX, y: nextY });
        }
      }
    }
  }

  // 2. Procedural Substrate Decorations
  const decorationCount = rng.intRange(4, 8);
  const runes = ['𓃠', '𓆃', '𓅓', '𓏢', '᚛', 'ᚌ', 'ᚙ', '𐍈'];

  for (let i = 0; i < decorationCount; i++) {
    const rx = rng.intRange(0, 20);
    const ry = rng.intRange(0, 20);
    const absX = startX + rx;
    const absY = startY + ry;

    if (!isInsideCabinet(absX, absY)) {
      // Ensure we do not place decorations on top of obstacles
      const hitsObs = obstacles.some(obs => obs.x === absX && obs.y === absY);
      if (!hitsObs) {
        const variant = rng.intRange(0, 4) as 0 | 1 | 2 | 3;
        const opacityMultiplier = rng.range(0.25, 0.7);
        const seed = rng.range(0, 100);
        const rotation = rng.range(0, Math.PI * 2);

        let label: string | undefined;
        if (biome === 'SAND_RUINS' && variant === 2) {
          label = runes[rng.intRange(0, runes.length)];
        } else if (biome === 'GLITCH_VOID' && variant === 0) {
          label = rng.next() < 0.5 ? '0' : '1';
        }

        decorations.push({
          x: absX,
          y: absY,
          variant,
          opacityMultiplier,
          biome,
          seed,
          rotation,
          label
        });
      }
    }
  }

  return {
    cx,
    cy,
    biome,
    obstacles,
    decorations
  };
}
