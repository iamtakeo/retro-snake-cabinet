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

  // Track active room peers in reference for optimized loop access
  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);

  // Establish high-performance edge connection to PartyKit websocket rooms
  useEffect(() => {
    if (status !== 'PLAYING') {
      setPeers([]);
      peersRef.current = [];
      setConnectionState('CONNECTING');
      return;
    }

    setConnectionState('CONNECTING');
    
    // Configurable PartyKit Edge server URL (iamtakeo custom room)
    const socketUrl = 'wss://retro-snake.iamtakeo.partykit.dev/party/void-lobby';
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
            setPeers(data.peers);
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

      // Safe Connection Timeout: if offline or blocked, trigger high-fidelity local edge P2P simulation!
      timeoutId = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          setConnectionState('FALLBACK_SIMULATION');
          setLatency(2 + Math.floor(Math.random() * 4)); // ultra-low simulated peer latency
          
          // Seed initial high-fidelity P2P simulated peer worms
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

  // Trigger high-performance simulated peer movement ticks aligned to main game loop
  const updateSimulatedPeers = (
    playerSnake: Position[],
    obstacles: Position[],
    food: Position | null,
    gridSize: number,
    onEatFood: () => void
  ) => {
    if (connectionState !== 'FALLBACK_SIMULATION' || !hasEscapedCabinet) return;

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

      // Filter safe direction vectors (no out of bounds, no obstacles, no colliding player tail segments or peer segments)
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

      if (safeDirections.length === 0) {
        // Fallback inevitable crash path
        return { ...peer, alive: false };
      }

      // Dynamic pathfinding: sort safe vectors to greedily reduce distance to closest food target
      let chosenDir = peer.dir;
      if (food) {
        safeDirections.sort((a, b) => {
          const distA = Math.abs(head.x + dirs[a].x - food.x) + Math.abs(head.y + dirs[a].y - food.y);
          const distB = Math.abs(head.x + dirs[b].x - food.x) + Math.abs(head.y + dirs[b].y - food.y);
          return distA - distB;
        });
        chosenDir = safeDirections[0];
      } else {
        // Random wandering vectors
        if (safeDirections.includes(peer.dir) && Math.random() < 0.88) {
          chosenDir = peer.dir;
        } else {
          chosenDir = safeDirections[Math.floor(Math.random() * safeDirections.length)];
        }
      }

      const nextHead = { x: head.x + dirs[chosenDir].x, y: head.y + dirs[chosenDir].y };
      const nextBody = [nextHead, ...peer.body];

      // Check if peer consumed food
      let ate = false;
      if (food && nextHead.x === food.x && nextHead.y === food.y) {
        ate = true;
        onEatFood(); // callback to regenerate food coordinate
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

    setPeers(updated);
    peersRef.current = updated;
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
    updateSimulatedPeers,
    killPeer
  };
}
