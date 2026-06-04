import { useState, useEffect, useRef } from 'react';
import { Position, Direction } from '../types';

export interface PeerPlayer {
  id: string;
  name: string;
  body: Position[];
  dir: Direction;
  color: string;
  score: number;
  latency: number;
  emoji: string;
  emojiTicks: number;
  alive: boolean;
}

export function usePartyKit(hasEscapedCabinet: boolean, status: string) {
  const [peers, setPeers] = useState<PeerPlayer[]>([]);
  const [connectionState, setConnectionState] = useState<'CONNECTING' | 'CONNECTED' | 'FALLBACK_SIMULATION'>('CONNECTING');
  const [latency, setLatency] = useState<number>(35);

  const socketRef = useRef<WebSocket | null>(null);
  const peersRef = useRef<PeerPlayer[]>([]);
  const ticksSinceLastSpawnRef = useRef<number>(0);

  // Unique player session ID (persistent in localStorage to prevent rendering self as peer)
  const playerIdRef = useRef<string>(
    (typeof window !== 'undefined' && localStorage.getItem('retro_snake_player_id')) || 
    'player_' + Math.random().toString(36).substring(2, 11)
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('retro_snake_player_id', playerIdRef.current);
    }
  }, []);

  // Track active room peers in reference for optimized loop access
  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);

  // Establish connection to PartyKit websocket rooms
  useEffect(() => {
    if (status !== 'PLAYING') {
      setPeers([]);
      peersRef.current = [];
      setConnectionState('CONNECTING');
      return;
    }

    setConnectionState('CONNECTING');
    
    // Configurable PartyKit Edge server URL (detect local dev mode)
    const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const socketUrl = isDev 
      ? 'ws://localhost:1999/party/void-lobby' 
      : 'wss://retro-snake.iamtakeo.partykit.dev/party/void-lobby';
      
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      const ws = new WebSocket(socketUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionState('CONNECTED');
        setLatency(18 + Math.floor(Math.random() * 12));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'state_sync' && data.peers) {
            // Filter out our own player connection so we don't render self twice
            const otherPeers = data.peers.filter((p: PeerPlayer) => p.id !== playerIdRef.current);
            setPeers(otherPeers);
          }
        } catch (e) {
          // Silent JSON parsing fallbacks
        }
      };

      ws.onerror = () => {
        // Failover handled by open timeout
      };

      ws.onclose = () => {
        // Failover handled by open timeout
      };

      // Safe Connection Timeout: if offline or blocked, trigger simulated peer bots
      timeoutId = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          setConnectionState('FALLBACK_SIMULATION');
          setLatency(2 + Math.floor(Math.random() * 4)); // simulated peer latency
          
          // Seed initial P2P simulated peer bots
          const initialPeers: PeerPlayer[] = [
            {
              id: 'peer_cyber',
              name: 'CyberCrawler',
              body: [
                { x: 45, y: 45 },
                { x: 45, y: 46 },
                { x: 45, y: 47 }
              ],
              dir: 'UP',
              color: '#ec4899', // Hot Pink
              score: 220,
              latency: 4,
              emoji: '👾',
              emojiTicks: 25,
              alive: true
            },
            {
              id: 'peer_viper',
              name: 'PixelViper',
              body: [
                { x: 75, y: 15 },
                { x: 76, y: 15 },
                { x: 77, y: 15 }
              ],
              dir: 'LEFT',
              color: '#fbbf24', // Amber Gold
              score: 180,
              latency: 3,
              emoji: '🔥',
              emojiTicks: 18,
              alive: true
            },
            {
              id: 'peer_ghost',
              name: 'ArcadeGhost',
              body: [
                { x: 15, y: 75 },
                { x: 15, y: 76 },
                { x: 15, y: 77 }
              ],
              dir: 'UP',
              color: '#06b6d4', // Cyan Blue
              score: 110,
              latency: 5,
              emoji: '',
              emojiTicks: 0,
              alive: true
            }
          ];
          setPeers(initialPeers);
          peersRef.current = initialPeers;
        }
      }, 1200);

    } catch (err) {
      setConnectionState('FALLBACK_SIMULATION');
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [status]);

  // Send local player state up to PartyKit edge server
  const sendPlayerState = (
    body: Position[],
    dir: Direction,
    score: number,
    name: string,
    color: string,
    emoji: string,
    alive: boolean
  ) => {
    if (socketRef.current && connectionState === 'CONNECTED' && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'player_state',
        id: playerIdRef.current,
        name,
        body,
        dir,
        color,
        score,
        emoji,
        alive
      }));
    }
  };

  // Trigger simulated peer movement ticks aligned to main game loop
  const updateSimulatedPeers = (
    playerSnake: Position[],
    obstacles: Position[],
    food: Position | null,
    gridSize: number,
    onEatFood: () => void,
    openWorldApples: Position[] = [],
    onEatOpenWorldApple?: (idx: number) => void
  ) => {
    if (connectionState !== 'FALLBACK_SIMULATION' || !hasEscapedCabinet) return;

    const findSafeBotSpawn = (
      pSnake: Position[],
      obs: Position[],
      gSize: number,
      activePeers: PeerPlayer[]
    ): Position | null => {
      let tries = 0;
      const margin = 5;
      while (tries < 100) {
        tries++;
        const x = Math.floor(Math.random() * (gSize - margin * 2)) + margin;
        const y = Math.floor(Math.random() * (gSize - margin * 2)) + margin;
        
        // Cabinet starting safety guard
        if (x < 25 && y < 25) continue;
        
        // Collision checks
        const hitsPlayer = pSnake.some(seg => seg.x === x && seg.y === y);
        const hitsObstacle = obs.some(o => o.x === x && o.y === y);
        const hitsPeer = activePeers.some(peer => peer.alive && peer.body.some(seg => seg.x === x && seg.y === y));
        
        if (!hitsPlayer && !hitsObstacle && !hitsPeer) {
          return { x, y };
        }
      }
      return null;
    };

    // Cycle random emoji chatter floating headers
    const chatEmojis = ['👾', '🔥', '👑', '😎', '👀', '⚡', '✨', '💨', '☠️', '🎯'];

    const updated = peersRef.current.map((peer): PeerPlayer => {
      if (!peer.alive) return peer;

      const head = peer.body[0];
      const dirs: Record<Direction, Position> = {
        UP: { x: 0, y: -1 },
        DOWN: { x: 0, y: 1 },
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 },
      };

      // Filter safe direction vectors
      const safeDirections = (['UP', 'DOWN', 'LEFT', 'RIGHT'] as Direction[]).filter((d) => {
        const nextX = head.x + dirs[d].x;
        const nextY = head.y + dirs[d].y;

        // Boundaries checks
        if (nextX < 0 || nextX >= gridSize || nextY < 0 || nextY >= gridSize) return false;
        
        // Cabinet safety guard: P2P peers shouldn't crowd player starting base
        if (nextX < 25 && nextY < 25) return false;

        // Obstacles checks
        if (obstacles.some((obs) => obs.x === nextX && obs.y === nextY)) return false;

        // Player collision checks
        if (playerSnake.some((seg) => seg.x === nextX && seg.y === nextY)) return false;

        // Peer self-collision checks
        const hitsOtherPeer = peersRef.current.some((other) => {
          if (other.id === peer.id || !other.alive) return false;
          return other.body.some((seg) => seg.x === nextX && seg.y === nextY);
        });
        if (hitsOtherPeer) return false;

        return true;
      });

      // Opposing direction lookup helper
      const opposite: Record<Direction, Direction> = {
        UP: 'DOWN',
        DOWN: 'UP',
        LEFT: 'RIGHT',
        RIGHT: 'LEFT',
      };

      // 2.5% chance bot makes a pathfinding error (ignores safe directions, just doesn't turn backwards)
      const hasError = Math.random() < 0.025;
      let activeSafeDirections = safeDirections;

      if (hasError) {
        activeSafeDirections = (['UP', 'DOWN', 'LEFT', 'RIGHT'] as Direction[]).filter(d => d !== opposite[peer.dir]);
      }

      if (activeSafeDirections.length === 0) {
        return { ...peer, alive: false };
      }

      // Dynamic pathfinding: scan core food + all open world apples to find and slither towards the closest target
      let chosenDir = peer.dir;
      const allApples = food ? [food, ...openWorldApples] : openWorldApples;
      if (allApples.length > 0 && activeSafeDirections.length > 0) {
        let closestApple = allApples[0];
        let minDist = Infinity;
        allApples.forEach((apple) => {
          const dist = Math.abs(head.x - apple.x) + Math.abs(head.y - apple.y);
          if (dist < minDist) {
            minDist = dist;
            closestApple = apple;
          }
        });

        activeSafeDirections.sort((a, b) => {
          const distA = Math.abs(head.x + dirs[a].x - closestApple.x) + Math.abs(head.y + dirs[a].y - closestApple.y);
          const distB = Math.abs(head.x + dirs[b].x - closestApple.x) + Math.abs(head.y + dirs[b].y - closestApple.y);
          return distA - distB;
        });
        chosenDir = activeSafeDirections[0];
      } else if (activeSafeDirections.length > 0) {
        // Random wandering vectors
        if (activeSafeDirections.includes(peer.dir) && Math.random() < 0.88) {
          chosenDir = peer.dir;
        } else {
          chosenDir = activeSafeDirections[Math.floor(Math.random() * activeSafeDirections.length)];
        }
      }

      const nextHead = { x: head.x + dirs[chosenDir].x, y: head.y + dirs[chosenDir].y };

      // Post-move actual collision check
      const outOfBounds = nextHead.x < 0 || nextHead.x >= gridSize || nextHead.y < 0 || nextHead.y >= gridSize;
      const hitsCabinetLimit = nextHead.x < 25 && nextHead.y < 25;
      const hitsObstacle = obstacles.some((obs) => obs.x === nextHead.x && obs.y === nextHead.y);
      const hitsPlayer = playerSnake.some((seg) => seg.x === nextHead.x && seg.y === nextHead.y);
      const hitsSelfOrPeer = peersRef.current.some((other) => {
        if (!other.alive) return false;
        if (other.id === peer.id) {
          // Exclude head from self-collision checks
          return peer.body.some((seg) => seg.x === nextHead.x && seg.y === nextHead.y);
        }
        return other.body.some((seg) => seg.x === nextHead.x && seg.y === nextHead.y);
      });

      if (outOfBounds || hitsCabinetLimit || hitsObstacle || hitsPlayer || hitsSelfOrPeer) {
        return { ...peer, alive: false };
      }

      const nextBody = [nextHead, ...peer.body];

      // Check if peer consumed food
      let ate = false;
      if (food && nextHead.x === food.x && nextHead.y === food.y) {
        ate = true;
        onEatFood();
      } else if (openWorldApples.length > 0 && onEatOpenWorldApple) {
        const eatenIdx = openWorldApples.findIndex((apple) => nextHead.x === apple.x && nextHead.y === apple.y);
        if (eatenIdx !== -1) {
          ate = true;
          onEatOpenWorldApple(eatenIdx);
        }
      }

      if (!ate) {
        nextBody.pop();
      }

      // Decal Floating Emojis ticks
      let nextEmoji = peer.emoji;
      let nextTicks = peer.emojiTicks > 0 ? peer.emojiTicks - 1 : 0;

      if (nextTicks <= 0) {
        nextEmoji = '';
      }

      if (nextTicks <= 0 && Math.random() < 0.02) {
        nextEmoji = chatEmojis[Math.floor(Math.random() * chatEmojis.length)];
        nextTicks = 20 + Math.floor(Math.random() * 15);
      }

      return {
        ...peer,
        body: nextBody,
        dir: chosenDir,
        score: peer.score + (ate ? 30 : 0),
        emoji: nextEmoji,
        emojiTicks: nextTicks,
      };
    });

    // Increment spawn tick counter
    ticksSinceLastSpawnRef.current += 1;

    // Filter alive peers from the newly updated list
    const alivePeers = updated.filter(p => p.alive);
    const activeCount = alivePeers.length;

    // Cooldown duration between spawns: 120 game ticks (~12-15 seconds)
    const minSpawnTicks = 120;

    let finalPeers = updated;

    if (activeCount < 4 && ticksSinceLastSpawnRef.current >= minSpawnTicks) {
      // Find a safe spawn point in the open world
      const startPos = findSafeBotSpawn(playerSnake, obstacles, gridSize, alivePeers);
      if (startPos) {
        // Build a length 3 vertical body extending downwards
        const body = [
          { x: startPos.x, y: startPos.y },
          { x: startPos.x, y: startPos.y + 1 },
          { x: startPos.x, y: startPos.y + 2 },
        ];

        // Ensure the entire body is safe from collisions
        const bodySafe = body.every(pos => {
          if (pos.y >= gridSize) return false;
          const hitsPlayer = playerSnake.some(seg => seg.x === pos.x && seg.y === pos.y);
          const hitsObstacle = obstacles.some(obs => obs.x === pos.x && obs.y === pos.y);
          const hitsPeer = alivePeers.some(peer => peer.body.some(seg => seg.x === pos.x && seg.y === pos.y));
          return !hitsPlayer && !hitsObstacle && !hitsPeer;
        });

        if (bodySafe) {
          const botNames = ['GlitchGator', 'VectorViper', 'NeonNeedle', 'ChromeCobra', 'TurboTurtle', 'MatrixMamba', 'ArcadeAnonda'];
          const botColors = ['#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#fb923c', '#06b6d4'];
          const botEmojis = ['🐉', '🐍', '🦎', '👾', '⚡', '👑', '😎'];

          const name = botNames[Math.floor(Math.random() * botNames.length)] + '_' + Math.floor(Math.random() * 90 + 10);
          const color = botColors[Math.floor(Math.random() * botColors.length)];
          const emoji = botEmojis[Math.floor(Math.random() * botEmojis.length)];

          const newBot: PeerPlayer = {
            id: 'bot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name,
            body,
            dir: 'UP',
            color,
            score: 40 + Math.floor(Math.random() * 90),
            latency: 2 + Math.floor(Math.random() * 5),
            emoji,
            emojiTicks: 25,
            alive: true
          };

          finalPeers = [...updated, newBot];
          ticksSinceLastSpawnRef.current = 0; // reset cooldown
        }
      }
    }

    setPeers(finalPeers);
    peersRef.current = finalPeers;
  };

  const killPeer = (id: string) => {
    setPeers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, alive: false } : p))
    );
  };

  return {
    peers,
    connectionState,
    latency,
    sendPlayerState,
    updateSimulatedPeers,
    killPeer
  };
}
