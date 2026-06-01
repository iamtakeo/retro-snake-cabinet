import { Position, Direction } from '../types';

export interface RivalSerpent {
  id: string;
  body: Position[];
  dir: Direction;
  color: string;
  alive: boolean;
  speedTicks: number; // move every N game ticks
  ticksSinceMove: number;
}

export interface DirectorState {
  tension: number;
  dreadRating: 'CALM' | 'FLOW' | 'PEAK' | 'DANGER';
}

/**
 * Computes tension rating in real-time based on local safety indicators.
 * Range: 0.0 (perfectly calm) to 1.0 (imminent danger).
 */
export function evaluateTension(
  snake: Position[],
  obstacles: Position[],
  gridSize: number,
  score: number,
  timeSinceLastEat: number,
  difficulty: string,
  obstacleSet?: Set<string>,
  snakeSet?: Set<string>
): DirectorState {
  if (snake.length === 0) {
    return { tension: 0.0, dreadRating: 'CALM' };
  }

  // 1. Structural ratios (longer snake / higher score increases active ambient pressure)
  const scoreFactor = Math.min(0.20, score / 800);
  const lengthFactor = Math.min(0.20, snake.length / 45);

  // 2. Spatial hazards (Proximity vectors to borders, walls, and body segments)
  const head = snake[0];
  let proximityDanger = 0.0;

  // Wall proximity within 2 tiles
  if (head.x <= 1 || head.x >= gridSize - 2 || head.y <= 1 || head.y >= gridSize - 2) {
    proximityDanger += 0.25;
  }

  // Obstacle proximity within 1 tile
  let nearObstacle = false;
  if (obstacleSet) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (obstacleSet.has(`${head.x + dx},${head.y + dy}`)) {
          nearObstacle = true;
          break;
        }
      }
      if (nearObstacle) break;
    }
  } else {
    nearObstacle = obstacles.some(
      (obs) => Math.abs(obs.x - head.x) <= 1 && Math.abs(obs.y - head.y) <= 1
    );
  }

  if (nearObstacle) {
    proximityDanger += 0.20;
  }

  // Self-body proximity within 1 tile (excluding immediate neck segments)
  let nearBody = false;
  if (snakeSet) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cx = head.x + dx;
        const cy = head.y + dy;
        if (snakeSet.has(`${cx},${cy}`)) {
          // Double check it's not the immediate neck
          const isNeck = snake.findIndex(seg => seg.x === cx && seg.y === cy) <= 3;
          if (!isNeck) {
            nearBody = true;
            break;
          }
        }
      }
      if (nearBody) break;
    }
  } else {
    nearBody = snake.some(
      (seg, index) => index > 3 && Math.abs(seg.x - head.x) <= 1 && Math.abs(seg.y - head.y) <= 1
    );
  }

  if (nearBody) {
    proximityDanger += 0.15;
  }

  // 3. Time Pressure (wandering without food increases active stress)
  const timeFactor = Math.min(0.15, timeSinceLastEat / 20);

  // Difficulty scaling factor
  let diffMult = 1.0;
  if (difficulty === 'PRACTICE') diffMult = 0.6;
  else if (difficulty === 'CHALLENGE') diffMult = 1.25;
  else if (difficulty === 'IMPOSSIBLE') diffMult = 1.5;

  const tension = Math.max(0.0, Math.min(1.0, (scoreFactor + lengthFactor + proximityDanger + timeFactor) * diffMult));

  // Determine threat level rating
  let dreadRating: 'CALM' | 'FLOW' | 'PEAK' | 'DANGER' = 'CALM';
  if (tension > 0.72) dreadRating = 'DANGER';
  else if (tension > 0.48) dreadRating = 'PEAK';
  else if (tension > 0.24) dreadRating = 'FLOW';

  return { tension, dreadRating };
}

export interface RivalTelemetry {
  speedTicks: number;
  errorRate: number;
  cpuLabel: string;
}

/**
 * Evaluates rival serpent difficulty configuration dynamically based on session playtime and difficulty level.
 */
export function evaluateRivalDifficulty(gameTicks: number, difficulty: string): RivalTelemetry {
  let speedTicks = 3;
  let errorRate = 0.0;
  let cpuLabel = 'STABILIZED';

  if (difficulty === 'PRACTICE') {
    speedTicks = 5;
    errorRate = 0.50;
    cpuLabel = 'DEGRADED';
  } else if (difficulty === 'NORMAL') {
    if (gameTicks < 300) {
      speedTicks = 5;
      errorRate = 0.40;
      cpuLabel = 'GLITCHING (40% ERR)';
    } else if (gameTicks < 600) {
      speedTicks = 4;
      errorRate = 0.20;
      cpuLabel = 'STABILIZING (20% ERR)';
    } else {
      speedTicks = 3;
      errorRate = 0.0;
      cpuLabel = 'OPTIMIZED';
    }
  } else if (difficulty === 'CHALLENGE') {
    if (gameTicks < 400) {
      speedTicks = 4;
      errorRate = 0.30;
      cpuLabel = 'UNSTABLE (30% ERR)';
    } else if (gameTicks < 800) {
      speedTicks = 3;
      errorRate = 0.15;
      cpuLabel = 'CALIBRATING (15% ERR)';
    } else {
      speedTicks = 2;
      errorRate = 0.0;
      cpuLabel = 'OVERCLOCKED';
    }
  } else if (difficulty === 'IMPOSSIBLE') {
    if (gameTicks < 400) {
      speedTicks = 3;
      errorRate = 0.15;
      cpuLabel = 'ADAPTING (15% ERR)';
    } else if (gameTicks < 1000) {
      speedTicks = 2;
      errorRate = 0.05;
      cpuLabel = 'ELEVATED';
    } else {
      speedTicks = 2;
      errorRate = 0.0;
      cpuLabel = 'GOD MODE';
    }
  }

  return { speedTicks, errorRate, cpuLabel };
}

/**
 * Calculates Rival AI pathfinding movement towards food coordinate targets.
 */
export function computeRivalNextMove(
  rival: RivalSerpent,
  playerSnake: Position[],
  obstacles: Position[],
  laserGateObstacles: Position[],
  laserGatesActive: boolean,
  food: Position,
  gridSize: number,
  errorRate: number = 0.0,
  obstacleSet?: Set<string>,
  laserGateSet?: Set<string>,
  playerSnakeSet?: Set<string>
): { nextHead: Position; nextDir: Direction } {
  const head = rival.body[0];
  const dirs: Record<Direction, Position> = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
  };

  const getDistance = (p1: Position, p2: Position) => {
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
  };

  // Decide if this move is glitched (sub-optimal) or greedy
  let sortedDirs: Direction[];
  if (Math.random() < errorRate) {
    // Sub-optimal decision: shuffle movement vectors randomly to simulate AI glitching
    sortedDirs = (['UP', 'DOWN', 'LEFT', 'RIGHT'] as Direction[]).sort(() => Math.random() - 0.5);
  } else {
    // Sort directions greedy-wise towards the target food
    sortedDirs = (['UP', 'DOWN', 'LEFT', 'RIGHT'] as Direction[]).sort((a, b) => {
      const nextA = { x: head.x + dirs[a].x, y: head.y + dirs[a].y };
      const nextB = { x: head.x + dirs[b].x, y: head.y + dirs[b].y };
      return getDistance(nextA, food) - getDistance(nextB, food);
    });
  }

  // Pick the first path direction that is completely safe
  for (const nextDir of sortedDirs) {
    // Avoid reversing 180 degrees
    const isReverse =
      (nextDir === 'UP' && rival.dir === 'DOWN') ||
      (nextDir === 'DOWN' && rival.dir === 'UP') ||
      (nextDir === 'LEFT' && rival.dir === 'RIGHT') ||
      (nextDir === 'RIGHT' && rival.dir === 'LEFT');
    if (isReverse) continue;

    const nextCell = { x: head.x + dirs[nextDir].x, y: head.y + dirs[nextDir].y };

    // Check collisions
    const outBounds = nextCell.x < 0 || nextCell.x >= gridSize || nextCell.y < 0 || nextCell.y >= gridSize;
    
    let hitsPlayer = false;
    if (playerSnakeSet) {
      hitsPlayer = playerSnakeSet.has(`${nextCell.x},${nextCell.y}`);
    } else {
      hitsPlayer = playerSnake.some((seg) => seg.x === nextCell.x && seg.y === nextCell.y);
    }
    
    const hitsSelf = rival.body.some((seg) => seg.x === nextCell.x && seg.y === nextCell.y);
    
    let hitsObstacle = false;
    if (obstacleSet && laserGateSet) {
      if (obstacleSet.has(`${nextCell.x},${nextCell.y}`)) {
        if (laserGateSet.has(`${nextCell.x},${nextCell.y}`)) {
          hitsObstacle = laserGatesActive;
        } else {
          hitsObstacle = true;
        }
      }
    } else {
      hitsObstacle = obstacles.some((obs) => {
        if (obs.x === nextCell.x && obs.y === nextCell.y) {
          // If laser gate, check active status
          const isLaser = laserGateObstacles.some((g) => g.x === obs.x && g.y === obs.y);
          if (isLaser) return laserGatesActive;
          return true;
        }
        return false;
      });
    }

    if (!outBounds && !hitsPlayer && !hitsSelf && !hitsObstacle) {
      return { nextHead: nextCell, nextDir };
    }
  }

  // Fallback check: try any open direction that is safe
  const fallbackDirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'] as Direction[];
  for (const nextDir of fallbackDirs) {
    const nextCell = { x: head.x + dirs[nextDir].x, y: head.y + dirs[nextDir].y };
    const outBounds = nextCell.x < 0 || nextCell.x >= gridSize || nextCell.y < 0 || nextCell.y >= gridSize;
    
    let hitsPlayer = false;
    if (playerSnakeSet) {
      hitsPlayer = playerSnakeSet.has(`${nextCell.x},${nextCell.y}`);
    } else {
      hitsPlayer = playerSnake.some((seg) => seg.x === nextCell.x && seg.y === nextCell.y);
    }
    
    let hitsObstacle = false;
    if (obstacleSet) {
      hitsObstacle = obstacleSet.has(`${nextCell.x},${nextCell.y}`);
    } else {
      hitsObstacle = obstacles.some((obs) => obs.x === nextCell.x && obs.y === nextCell.y);
    }
    
    if (!outBounds && !hitsPlayer && !hitsObstacle) {
      return { nextHead: nextCell, nextDir };
    }
  }

  // Extreme fallback (inevitable crash path)
  const defaultDir = rival.dir;
  return {
    nextHead: { x: head.x + dirs[defaultDir].x, y: head.y + dirs[defaultDir].y },
    nextDir: defaultDir,
  };
}

/**
 * Dynamically slides non-gate obstacle coordinates to morph the labyrinth grid.
 */
export function computeMorphedObstacles(
  currentObstacles: Position[],
  laserGateObstacles: Position[],
  gridSize: number,
  playerSnake: Position[],
  food: Position | null,
  activeRivals: RivalSerpent[],
  laserGateSet?: Set<string>,
  playerSnakeSet?: Set<string>
): Position[] {
  return currentObstacles.map((obs) => {
    // Only slide standard static obstacles (ignore active flashing laser gates)
    let isLaser = false;
    if (laserGateSet) {
      isLaser = laserGateSet.has(`${obs.x},${obs.y}`);
    } else {
      isLaser = laserGateObstacles.some((g) => g.x === obs.x && g.y === obs.y);
    }
    if (isLaser) return obs;

    // 10% chance to morph each obstacle coordinate
    if (Math.random() < 0.10) {
      const shiftDirs = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
      ];
      const shift = shiftDirs[Math.floor(Math.random() * shiftDirs.length)];

      const nextX = obs.x + shift.x;
      const nextY = obs.y + shift.y;

      // Restrict morphs to safe margins within board boundaries
      if (nextX < 2 || nextX >= gridSize - 2 || nextY < 2 || nextY >= gridSize - 2) {
        return obs;
      }

      // Check collision safety against active players, food, or enemy rival tails
      let hitsPlayer = false;
      if (playerSnakeSet) {
        hitsPlayer = playerSnakeSet.has(`${nextX},${nextY}`);
      } else {
        hitsPlayer = playerSnake.some((seg) => seg.x === nextX && seg.y === nextY);
      }
      const hitsFood = food ? food.x === nextX && food.y === nextY : false;
      const hitsRival = activeRivals.some((r) => r.body.some((seg) => seg.x === nextX && seg.y === nextY));

      if (!hitsPlayer && !hitsFood && !hitsRival) {
        return { x: nextX, y: nextY };
      }
    }
    return obs;
  });
}
