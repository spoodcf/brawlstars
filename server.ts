import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';

interface QueuePlayer {
  ws: WebSocket;
  username: string;
  brawlerId: string;
  level: number;
  skinId: string;
  gadget: string;
  starPower: string;
  gears: string[];
  hypercharge: boolean;
}

interface RoomPlayer {
  ws: WebSocket;
  username: string;
  brawlerId: string;
  level: number;
  skinId: string;
  gadget: string;
  starPower: string;
  gears: string[];
  hypercharge: boolean;
  ready: boolean;
  role: string;
}

interface Room {
  id: string;
  players: RoomPlayer[];
  mapName: string;
  seed: number;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Serve static API routes here if needed
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  // Create HTTP server
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // Create WebSocket Server
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Matchmaking Queue
  let matchmakingQueue: QueuePlayer[] = [];
  // Active Game Rooms
  const rooms = new Map<string, Room>();

  // Countdown timer for matchmaking
  let queueCountdownTimer: NodeJS.Timeout | null = null;
  let queueSecondsRemaining = 15;

  function startQueueCountdown() {
    if (queueCountdownTimer) return;
    queueSecondsRemaining = 15;
    
    queueCountdownTimer = setInterval(() => {
      queueSecondsRemaining--;
      console.log(`Matchmaking countdown: ${queueSecondsRemaining}s. Players: ${matchmakingQueue.length}`);
      
      // Broadcast current status to all queued players
      matchmakingQueue.forEach(p => {
        if (p.ws.readyState === WebSocket.OPEN) {
          p.ws.send(JSON.stringify({
            type: 'queue_update',
            count: matchmakingQueue.length,
            countdown: queueSecondsRemaining
          }));
        }
      });

      if (queueSecondsRemaining <= 0 || matchmakingQueue.length >= 10) {
        clearInterval(queueCountdownTimer!);
        queueCountdownTimer = null;
        triggerMatchmaking();
      }
    }, 1000);
  }

  function stopQueueCountdown() {
    if (queueCountdownTimer) {
      clearInterval(queueCountdownTimer);
      queueCountdownTimer = null;
    }
    queueSecondsRemaining = 15;
  }

  function triggerMatchmaking() {
    if (matchmakingQueue.length === 0) return;

    // Grab up to 10 players
    const playersToMatch = matchmakingQueue.splice(0, 10);
    const roomId = `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const seed = Math.floor(Math.random() * 1000000);
    const mapPool = ['Classic Showdown', 'Feast or Famine', 'Cavern Churn', 'Double Trouble'];
    const selectedMap = mapPool[Math.floor(Math.random() * mapPool.length)];

    // Map them to RoomPlayer objects with roles 'p1', 'p2', ..., 'p10'
    const roomPlayers: RoomPlayer[] = playersToMatch.map((p, idx) => ({
      ws: p.ws,
      username: p.username,
      brawlerId: p.brawlerId,
      level: p.level,
      skinId: p.skinId,
      gadget: p.gadget,
      starPower: p.starPower,
      gears: p.gears,
      hypercharge: p.hypercharge,
      ready: false,
      role: `p${idx + 1}`
    }));

    const room: Room = {
      id: roomId,
      players: roomPlayers,
      mapName: selectedMap,
      seed
    };

    rooms.set(roomId, room);

    // Notify each player
    roomPlayers.forEach(p => {
      // Collect other players as opponents
      const opponents = roomPlayers.filter(other => other !== p).map(other => ({
        username: other.username,
        brawlerId: other.brawlerId,
        level: other.level,
        skinId: other.skinId,
        gadget: other.gadget,
        starPower: other.starPower,
        gears: other.gears,
        hypercharge: other.hypercharge,
        role: other.role
      }));

      p.ws.currentRoomId = roomId;
      p.ws.myRole = p.role;

      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(JSON.stringify({
          type: 'match_found',
          roomId,
          seed,
          mapName: selectedMap,
          role: p.role,
          opponents
        }));
      }
    });

    console.log(`Match created in Room ${roomId} with ${roomPlayers.length} players: ${roomPlayers.map(rp => rp.username).join(', ')}`);

    // Restart countdown if more players are waiting
    if (matchmakingQueue.length > 0) {
      startQueueCountdown();
    }
  }

  // WebSocket connections are handled automatically by the ws server bound to /ws path

  wss.on('connection', (ws: WebSocket) => {
    ws.currentRoomId = null;
    ws.myRole = null;
    let registeredPlayer: QueuePlayer | null = null;

    ws.on('error', (err) => {
      console.error('[WS SERVER] Client socket error:', err);
    });

    ws.on('message', (messageRaw: any) => {
      try {
        const message = messageRaw.toString();
        const data = JSON.parse(message);
        const { type } = data;

        if (type === 'join_queue') {
          // Remove from queue if already in there
          matchmakingQueue = matchmakingQueue.filter(p => p.ws !== ws);

          registeredPlayer = {
            ws,
            username: data.username || 'Brawler',
            brawlerId: data.brawlerId,
            level: data.level || 11,
            skinId: data.skinId || 'default',
            gadget: data.gadget || '',
            starPower: data.starPower || '',
            gears: data.gears || [],
            hypercharge: !!data.hypercharge
          };

          matchmakingQueue.push(registeredPlayer);
          console.log(`Player joined queue: ${registeredPlayer.username}. Queue length: ${matchmakingQueue.length}`);

          // Broadcast queue status immediately
          ws.send(JSON.stringify({ 
            type: 'queue_update', 
            count: matchmakingQueue.length,
            countdown: queueSecondsRemaining 
          }));

          // Start the countdown timer if this is the first player
          if (matchmakingQueue.length === 1) {
            startQueueCountdown();
          } else {
            // Also update others in queue
            matchmakingQueue.forEach(p => {
              if (p.ws !== ws && p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(JSON.stringify({
                  type: 'queue_update',
                  count: matchmakingQueue.length,
                  countdown: queueSecondsRemaining
                }));
              }
            });
          }

          // If queue reaches 10, trigger matchmaking immediately!
          if (matchmakingQueue.length >= 10) {
            stopQueueCountdown();
            triggerMatchmaking();
          }
        } 
        
        else if (type === 'leave_queue') {
          matchmakingQueue = matchmakingQueue.filter(p => p.ws !== ws);
          console.log(`Player left queue. Queue length: ${matchmakingQueue.length}`);
          ws.send(JSON.stringify({ type: 'queue_left' }));

          if (matchmakingQueue.length === 0) {
            stopQueueCountdown();
          } else {
            matchmakingQueue.forEach(p => {
              if (p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(JSON.stringify({
                  type: 'queue_update',
                  count: matchmakingQueue.length,
                  countdown: queueSecondsRemaining
                }));
              }
            });
          }
        }

        else if (type === 'game_ready') {
          console.log(`[WS] game_ready received. ws.currentRoomId: ${ws.currentRoomId}, ws.myRole: ${ws.myRole}`);
          if (!ws.currentRoomId) {
            console.log(`[WS] Warning: No currentRoomId on socket!`);
            return;
          }
          const room = rooms.get(ws.currentRoomId);
          if (!room) {
            console.log(`[WS] Warning: Room not found for id ${ws.currentRoomId}!`);
            return;
          }

          const me = room.players.find(p => p.ws === ws);
          if (me) {
            me.ready = true;
            console.log(`[WS] Player ${me.username} (${me.role}) is READY`);
          }

          // Check if all players in the room are ready
          const allReady = room.players.every(p => p.ready);
          console.log(`[WS] Room status - total players: ${room.players.length}, allReady: ${allReady}`);

          if (allReady) {
            console.log(`[WS] ALL PLAYERS READY! Sending start_game to room ${room.id} with map: ${room.mapName}`);
            const startMsg = JSON.stringify({ type: 'start_game', mapName: room.mapName });
            room.players.forEach(p => {
              if (p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(startMsg);
              }
            });
          }
        }

        else if (type === 'sync_state' || type === 'trigger_action' || type === 'sync_bots') {
          if (!ws.currentRoomId) return;
          const room = rooms.get(ws.currentRoomId);
          if (!room) return;

          let messageToSend = message;
          try {
            const parsed = JSON.parse(message);
            if (!parsed.role) {
              parsed.role = ws.myRole;
              messageToSend = JSON.stringify(parsed);
            }
          } catch (e) {
            console.error('[WS] Failed to parse message to inject role:', e);
          }

          // Forward to all other players in the room
          room.players.forEach(p => {
            if (p.ws !== ws && p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(messageToSend);
            }
          });
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      // Remove from matchmaking queue
      matchmakingQueue = matchmakingQueue.filter(p => p.ws !== ws);

      if (matchmakingQueue.length === 0) {
        stopQueueCountdown();
      }

      // Handle active room cleanup
      if (ws.currentRoomId) {
        const room = rooms.get(ws.currentRoomId);
        if (room) {
          const leavingPlayer = room.players.find(p => p.ws === ws);
          if (leavingPlayer) {
            // Filter out the leaving player
            room.players = room.players.filter(p => p.ws !== ws);
            // Notify all remaining opponents in the room
            room.players.forEach(p => {
              if (p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(JSON.stringify({
                  type: 'opponent_left',
                  role: leavingPlayer.role,
                  username: leavingPlayer.username
                }));
              }
            });
          }
          if (room.players.length === 0) {
            rooms.delete(ws.currentRoomId);
          }
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// Extend WebSocket interface for tracking room properties
declare module 'ws' {
  interface WebSocket {
    currentRoomId?: string | null;
    myRole?: string | null;
  }
}

startServer();
