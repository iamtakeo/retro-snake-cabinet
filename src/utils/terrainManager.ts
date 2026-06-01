import { Position } from '../types';

export interface TerrainDecoration {
  x: number;
  y: number;
  variant: 0 | 1 | 2 | 3;
  opacityMultiplier: number;
  biome: 'NEON_GRID' | 'SAND_RUINS' | 'TOXIC_WASTE' | 'GLITCH_VOID';
  seed: number; // pseudorandom timing factor
  rotation?: number; // rotation in radians or degrees
  label?: string; // custom glyph characters (e.g. runes, binary numbers)
}

/**
 * Procedurally seeds and designs an immersive environmental ground layer.
 * Couples map configurations to specific thematic biomes.
 */
export function generateTerrainDecorations(
  gridSize: number,
  obstacles: Position[],
  arenaType: string,
  density: number = 0.16
): TerrainDecoration[] {
  const decorations: TerrainDecoration[] = [];
  const obstacleSet = new Set(obstacles.map((o) => `${o.x},${o.y}`));
  const placedSet = new Set<string>();

  // Couple map selection to specific biome environment sectors
  let biome: 'NEON_GRID' | 'SAND_RUINS' | 'TOXIC_WASTE' | 'GLITCH_VOID' = 'GLITCH_VOID';
  if (arenaType === 'BOX_CORRIDOR' || arenaType === 'GREAT_WALLS') {
    biome = 'TOXIC_WASTE';
  } else if (arenaType === 'CROSS_LABYRINTH') {
    biome = 'NEON_GRID';
  } else if (arenaType === 'SCATTERED_RUINS' || arenaType === 'LARGE_EXPANSION') {
    biome = 'SAND_RUINS';
  }

  // Calculate target density based on grid dimensions
  const totalCells = gridSize * gridSize;
  const targetCount = Math.floor(totalCells * density);

  // Glyphs for ancient ruins
  const ruinGlyphs = ['𓃠', '𓆃', '𓅓', '𓏢', '᚛', 'ᚌ', 'ᚙ', '𐍈', '𓊗', '𓁺', '𓎂', '𓏶', '᚛', 'ᚎ'];

  for (let i = 0; i < targetCount; i++) {
    // Keep decorations inside map boundaries
    const rx = Math.floor(Math.random() * (gridSize - 2)) + 1;
    const ry = Math.floor(Math.random() * (gridSize - 2)) + 1;
    const key = rx + ',' + ry;

    if (!obstacleSet.has(key) && !placedSet.has(key)) {
      placedSet.add(key);

      const variant = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3;
      const opacityMultiplier = 0.35 + Math.random() * 0.65;
      const seed = Math.random(); // timing offset factor
      const rotation = Math.random() * Math.PI * 2; // orientation angle

      let label: string | undefined;

      if (biome === 'GLITCH_VOID') {
        // Binary streams start as 0 or 1
        label = Math.random() < 0.5 ? '0' : '1';
      } else if (biome === 'SAND_RUINS') {
        // Random ancient ruins glyph carving
        label = ruinGlyphs[Math.floor(Math.random() * ruinGlyphs.length)];
      }

      decorations.push({
        x: rx,
        y: ry,
        variant,
        opacityMultiplier,
        biome,
        seed,
        rotation,
        label,
      });
    }
  }

  return decorations;
}
