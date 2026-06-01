import { Position } from '../types';

export type ArenaType = 'CLASSIC_EMPTY' | 'BOX_CORRIDOR' | 'CROSS_LABYRINTH' | 'SCATTERED_RUINS' | 'GREAT_WALLS' | 'LARGE_EXPANSION';

export interface ArenaDesign {
  type: ArenaType;
  name: string;
  description: string;
  gridSize: number; // 25 for normal, 55 for Large Map
}

export const ARENA_DESIGNS: ArenaDesign[] = [
  {
    type: 'CLASSIC_EMPTY',
    name: 'Neon Flatland',
    description: 'A completely open void. Perfect for high-speed wriggling.',
    gridSize: 25,
  },
  {
    type: 'BOX_CORRIDOR',
    name: 'Sector 4 Chamber',
    description: 'Symmetrical outer and inner boundary walls with tight escapes.',
    gridSize: 25,
  },
  {
    type: 'CROSS_LABYRINTH',
    name: 'Labyrinth Prism',
    description: 'Four solid diagonal blockades crossing the core zone.',
    gridSize: 25,
  },
  {
    type: 'SCATTERED_RUINS',
    name: 'Scattered Ruins',
    description: 'Decentralized retro pillars forming tight tactical pockets.',
    gridSize: 25,
  },
  {
    type: 'GREAT_WALLS',
    name: 'Ancient Firewall',
    description: 'Two massive vertical parallel partitions shielding the core.',
    gridSize: 25,
  },
  {
    type: 'LARGE_EXPANSION',
    name: 'Large Expansion Grid',
    description: 'A massive 50x50 crawling zone! The camera follows your head.',
    gridSize: 50,
  }
];

/**
 * Procedurally generates coordinates for symmetric boundaries and obstacles with adaptive complexity scaling.
 * @param complexityOffset Affects density, wall lengths, gaps, and decorative pillars. Range -3 (easiest/cleanest) to 3 (hardest).
 */
export function generateObstaclesForArena(type: ArenaType, gridSize: number, complexityOffset: number = 0): Position[] {
  const list: Position[] = [];
  const mid = Math.floor(gridSize / 2);
  const startX = mid;
  const startY = mid + 2; // match start position in App.tsx

  // Avoid generating obstacles in immediate snake spawning safe zone columns + rows
  const isSpawnSafe = (p: Position) => {
    const safeRadiusX = 2;
    const safeRadiusY = 4;
    return !(Math.abs(p.x - startX) <= safeRadiusX && Math.abs(p.y - startY) <= safeRadiusY);
  };

  switch (type) {
    case 'CLASSIC_EMPTY':
      // Empty by design normally. If extra hard, add corner guides
      if (complexityOffset > 0) {
        const offset = 4;
        list.push({ x: offset, y: offset });
        list.push({ x: gridSize - 1 - offset, y: offset });
        list.push({ x: offset, y: gridSize - 1 - offset });
        list.push({ x: gridSize - 1 - offset, y: gridSize - 1 - offset });
      }
      break;

    case 'BOX_CORRIDOR': {
      const borderGap = 5;
      
      // Symmetrical corners (draw only if not extremely easy)
      if (complexityOffset >= -1) {
        // Top left
        list.push({ x: borderGap, y: borderGap });
        list.push({ x: borderGap + 1, y: borderGap });
        list.push({ x: borderGap, y: borderGap + 1 });
        
        // Top right
        list.push({ x: gridSize - borderGap - 1, y: borderGap });
        list.push({ x: gridSize - borderGap - 2, y: borderGap });
        list.push({ x: gridSize - borderGap - 1, y: borderGap + 1 });

        // Bottom left
        list.push({ x: borderGap, y: gridSize - borderGap - 1 });
        list.push({ x: borderGap + 1, y: gridSize - borderGap - 1 });
        list.push({ x: borderGap, y: gridSize - borderGap - 2 });

        // Bottom right
        list.push({ x: gridSize - borderGap - 1, y: gridSize - borderGap - 1 });
        list.push({ x: gridSize - borderGap - 2, y: gridSize - borderGap - 1 });
        list.push({ x: gridSize - borderGap - 1, y: gridSize - borderGap - 2 });
      }

      // Central block (skip if very easy)
      if (complexityOffset >= 0) {
        list.push({ x: mid, y: mid });
        list.push({ x: mid - 1, y: mid });
        list.push({ x: mid + 1, y: mid });
        list.push({ x: mid, y: mid - 1 });
        list.push({ x: mid, y: mid + 1 });
      }

      // Additional blocks if complexity demands
      if (complexityOffset > 0) {
        list.push({ x: 3, y: mid });
        list.push({ x: gridSize - 4, y: mid });
      }
      break;
    }

    case 'CROSS_LABYRINTH': {
      // Symmetric X-shape walls whose length scales with calibration feedback
      const length = Math.max(2, Math.min(11, 6 + complexityOffset * 1.5));
      for (let i = 4; i < 4 + length; i++) {
        list.push({ x: i, y: i });
        list.push({ x: gridSize - 1 - i, y: i });
        list.push({ x: i, y: gridSize - 1 - i });
        list.push({ x: gridSize - 1 - i, y: gridSize - 1 - i });
      }
      break;
    }

    case 'SCATTERED_RUINS': {
      // More seeds are activated with higher calibration
      const maxStones = Math.max(1, Math.min(8, 4 + complexityOffset));
      const stones = [
        { x: 5, y: 5 }, { x: 5, y: gridSize - 6 },
        { x: gridSize - 6, y: 5 }, { x: gridSize - 6, y: gridSize - 6 },
        { x: 8, y: mid }, { x: gridSize - 9, y: mid },
        { x: mid, y: 8 }, { x: mid, y: gridSize - 9 },
      ];
      
      const activeStones = stones.slice(0, maxStones);
      activeStones.forEach((st) => {
        list.push({ x: st.x, y: st.y });
        list.push({ x: st.x + 1, y: st.y });
        list.push({ x: st.x, y: st.y + 1 });
      });
      break;
    }

    case 'GREAT_WALLS': {
      // Symmetrical parallel lines with adaptive central gap widths
      const gapSize = Math.max(1, 3 - complexityOffset); // narrower corridors for higher difficulty
      for (let y = 3; y < gridSize - 3; y++) {
        if (Math.abs(y - mid) >= gapSize) {
          list.push({ x: mid - 5, y });
          list.push({ x: mid + 5, y });
        }
      }
      break;
    }

    case 'LARGE_EXPANSION': {
      // adaptive large 50x50 ruins
      const wallHalfLength = Math.max(2, Math.min(12, 5 + complexityOffset * 2));
      for (let i = 15 - wallHalfLength; i < 15 + wallHalfLength; i++) {
        list.push({ x: i, y: 15 });
        list.push({ x: gridSize - 1 - i, y: 15 });
        list.push({ x: i, y: gridSize - 1 - 15 });
        list.push({ x: gridSize - 1 - i, y: gridSize - 1 - 15 });
      }

      // inner central clusters
      if (complexityOffset >= 0) {
        for (let offset = -4; offset <= 4; offset++) {
          if (offset !== 0) {
            list.push({ x: mid + offset, y: mid - 10 });
            list.push({ x: mid + offset, y: mid + 10 });
            list.push({ x: mid - 10, y: mid + offset });
            list.push({ x: mid + 10, y: mid + offset });
          }
        }
      }

      // Supplementary obstacles for high challenge ratings
      if (complexityOffset > 0) {
        const points = [
          { qX: 12, qY: 12 },
          { qX: 38, qY: 12 },
          { qX: 12, qY: 38 },
          { qX: 38, qY: 38 },
        ];
        points.forEach((pt) => {
          list.push({ x: pt.qX, y: pt.qY });
          list.push({ x: pt.qX + 1, y: pt.qY });
          list.push({ x: pt.qX, y: pt.qY + 1 });
        });
      }
      break;
    }
  }

  return list.filter(isSpawnSafe);
}

/**
 * Calculates adaptive state modifiers based on post-game user difficulty feedback.
 * - EASY pushes speedOffset down (faster gameplay)
 * - HARD pushes speedOffset up (slower/more relaxed gameplay)
 */
export interface AdaptiveDifficultyState {
  currentOffsetMs: number; // offset to difficultyConfig.speedMs
  accumulatedFeedback: number; // tally score
}

export function applyDifficultyFeedback(
  currentOffsetMs: number,
  feedback: 'EASY' | 'JUST_RIGHT' | 'HARD'
): number {
  let newOffset = currentOffsetMs;
  if (feedback === 'EASY') {
    // Speed up standard loop by decreasing the clock interval
    newOffset = Math.max(-50, currentOffsetMs - 15);
  } else if (feedback === 'HARD') {
    // Slow down standard loop by increasing the clock interval
    newOffset = Math.min(100, currentOffsetMs + 20);
  }
  return newOffset;
}

export function applyComplexityFeedback(
  currentComplexity: number,
  feedback: 'EASY' | 'JUST_RIGHT' | 'HARD'
): number {
  if (feedback === 'EASY') {
    // Too easy, let's make the paths narrower with more structures
    return Math.min(3, currentComplexity + 1);
  } else if (feedback === 'HARD') {
    // Too hard, let's make the field more spacious
    return Math.max(-3, currentComplexity - 1);
  }
  return currentComplexity;
}

