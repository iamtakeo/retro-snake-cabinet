import type * as Party from "partykit/server";

interface PeerState {
  id: string;
  name: string;
  body: { x: number; y: number }[];
  dir: string;
  color: string;
  score: number;
  emoji: string;
  alive: boolean;
  lastUpdate: number;
}

export default class SnakeServer implements Party.Server {
  states: Map<string, PeerState> = new Map();

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    this.cleanStalePeers();
    conn.send(JSON.stringify({
      type: 'state_sync',
      peers: Array.from(this.states.values())
    }));
  }

  onClose(conn: Party.Connection) {
    this.states.delete(conn.id);
    this.broadcastPeers();
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message);
      if (data.type === 'player_state') {
        const state: PeerState = {
          id: data.id || sender.id,
          name: data.name || 'Anonymous',
          body: data.body || [],
          dir: data.dir || 'UP',
          color: data.color || '#22c55e',
          score: data.score || 0,
          emoji: data.emoji || '',
          alive: data.alive !== undefined ? data.alive : true,
          lastUpdate: Date.now()
        };
        this.states.set(sender.id, state);
        this.broadcastPeers();
      }
    } catch (err) {
      // Ignore JSON syntax errors
    }
  }

  cleanStalePeers() {
    const now = Date.now();
    for (const [connId, state] of this.states.entries()) {
      // Evict inactive players after 10 seconds of no updates
      if (now - state.lastUpdate > 10000) {
        this.states.delete(connId);
      }
    }
  }

  broadcastPeers() {
    this.cleanStalePeers();
    const peersList = Array.from(this.states.values());
    this.room.broadcast(JSON.stringify({
      type: 'state_sync',
      peers: peersList
    }));
  }
}
