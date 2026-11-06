import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';

interface PlayerInfo {
  ws: WebSocket;
  color: 'w' | 'b' | 'spectator';
  name: string;
}

interface Room {
  id: string;
  hostWs: WebSocket;
  players: Map<WebSocket, PlayerInfo>;
  fen: string;
  moves: string[];
  status: 'waiting' | 'playing' | 'ended';
  hostColorChoice: 'w' | 'b' | 'random';
}

export class ChessMultiplayerServer {
  private wss: WebSocketServer | null = null;
  private rooms: Map<string, Room> = new Map();

  attach(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws) => {
      let currentRoomId: string | null = null;

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          switch (msg.type) {
            case 'create_room':
              currentRoomId = this.handleCreateRoom(ws, msg);
              break;
            case 'join_room':
              currentRoomId = this.handleJoinRoom(ws, msg);
              break;
            case 'move':
              this.handleMove(ws, msg);
              break;
            case 'chat':
              this.handleChat(ws, msg);
              break;
            case 'rematch_request':
              this.handleRematchRequest(ws, msg);
              break;
            case 'rematch_accept':
              this.handleRematchAccept(ws, msg);
              break;
            case 'draw_offer':
              this.handleDrawOffer(ws, msg);
              break;
            case 'draw_accept':
              this.handleDrawAccept(ws, msg);
              break;
            case 'resign':
              this.handleResign(ws, msg);
              break;
            case 'leave_room':
              this.handleLeaveRoom(ws, currentRoomId);
              currentRoomId = null;
              break;
          }
        } catch (err) {
          console.error('WebSocket message parsing error:', err);
        }
      });

      ws.on('close', () => {
        if (currentRoomId) {
          this.handleLeaveRoom(ws, currentRoomId);
        }
      });
    });

    console.log('[ChessMultiplayerServer] Attached WebSocket server at /ws');
  }

  private generateRoomId(): string {
    // 6-digit purely numeric room code (e.g. 683921)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return this.rooms.has(code) ? this.generateRoomId() : code;
  }

  private handleCreateRoom(ws: WebSocket, msg: { hostColor?: 'w' | 'b' | 'random'; playerName?: string }): string {
    const roomId = this.generateRoomId();
    const hostColorChoice = msg.hostColor || 'w';
    let assignedHostColor: 'w' | 'b' = 'w';
    if (hostColorChoice === 'random') {
      assignedHostColor = Math.random() < 0.5 ? 'w' : 'b';
    } else {
      assignedHostColor = hostColorChoice;
    }

    const room: Room = {
      id: roomId,
      hostWs: ws,
      players: new Map(),
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: [],
      status: 'waiting',
      hostColorChoice
    };

    room.players.set(ws, {
      ws,
      color: assignedHostColor,
      name: msg.playerName || '房主'
    });

    this.rooms.set(roomId, room);

    ws.send(JSON.stringify({
      type: 'room_created',
      roomId,
      color: assignedHostColor
    }));

    return roomId;
  }

  private handleJoinRoom(ws: WebSocket, msg: { roomId: string; playerName?: string }): string | null {
    const room = this.rooms.get(msg.roomId?.toUpperCase());
    if (!room) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '房间不存在或已解散'
      }));
      return null;
    }

    // Determine role for joiner
    const existingPlayers = Array.from(room.players.values());
    const host = existingPlayers.find(p => p.ws === room.hostWs);

    let assignedColor: 'w' | 'b' | 'spectator' = 'spectator';
    if (existingPlayers.length === 1 && host) {
      assignedColor = host.color === 'w' ? 'b' : 'w';
      room.status = 'playing';
    }

    room.players.set(ws, {
      ws,
      color: assignedColor,
      name: msg.playerName || (assignedColor === 'spectator' ? '观战者' : '挑战者')
    });

    // Notify joiner
    ws.send(JSON.stringify({
      type: 'room_joined',
      roomId: room.id,
      color: assignedColor,
      fen: room.fen,
      moves: room.moves,
      opponentName: host?.name || '房主'
    }));

    // Notify host that opponent has arrived
    if (assignedColor !== 'spectator' && host) {
      host.ws.send(JSON.stringify({
        type: 'player_joined',
        opponentName: msg.playerName || '挑战者',
        opponentColor: assignedColor
      }));
    }

    return room.id;
  }

  private handleMove(ws: WebSocket, msg: { roomId: string; from: string; to: string; promotion?: string; san: string; fen: string }) {
    const room = this.rooms.get(msg.roomId);
    if (!room) return;

    room.fen = msg.fen;
    room.moves.push(msg.san);

    // Relay move to all other clients in room
    room.players.forEach((player) => {
      if (player.ws !== ws && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify({
          type: 'opponent_move',
          from: msg.from,
          to: msg.to,
          promotion: msg.promotion,
          san: msg.san,
          fen: msg.fen
        }));
      }
    });
  }

  private handleChat(ws: WebSocket, msg: { roomId: string; text: string; emoji?: string }) {
    const room = this.rooms.get(msg.roomId);
    if (!room) return;

    const sender = room.players.get(ws);
    const senderName = sender ? sender.name : '玩家';

    room.players.forEach((player) => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify({
          type: 'chat',
          sender: senderName,
          isSelf: player.ws === ws,
          text: msg.text,
          emoji: msg.emoji
        }));
      }
    });
  }

  private handleRematchRequest(ws: WebSocket, msg: { roomId: string }) {
    const room = this.rooms.get(msg.roomId);
    if (!room) return;

    room.players.forEach((player) => {
      if (player.ws !== ws && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify({
          type: 'rematch_requested'
        }));
      }
    });
  }

  private handleRematchAccept(ws: WebSocket, msg: { roomId: string }) {
    const room = this.rooms.get(msg.roomId);
    if (!room) return;

    room.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    room.moves = [];
    room.status = 'playing';

    // Swap colors for rematch
    room.players.forEach((player) => {
      if (player.color === 'w') player.color = 'b';
      else if (player.color === 'b') player.color = 'w';

      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify({
          type: 'game_reset',
          color: player.color
        }));
      }
    });
  }

  private handleDrawOffer(ws: WebSocket, msg: { roomId: string }) {
    const room = this.rooms.get(msg.roomId);
    if (!room) return;

    room.players.forEach((player) => {
      if (player.ws !== ws && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify({
          type: 'draw_offered'
        }));
      }
    });
  }

  private handleDrawAccept(ws: WebSocket, msg: { roomId: string }) {
    const room = this.rooms.get(msg.roomId);
    if (!room) return;

    room.status = 'ended';
    room.players.forEach((player) => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify({
          type: 'draw_agreed'
        }));
      }
    });
  }

  private handleResign(ws: WebSocket, msg: { roomId: string }) {
    const room = this.rooms.get(msg.roomId);
    if (!room) return;

    const resigner = room.players.get(ws);
    const winnerColor = resigner?.color === 'w' ? 'b' : 'w';
    room.status = 'ended';

    room.players.forEach((player) => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify({
          type: 'player_resigned',
          winner: winnerColor,
          resignerName: resigner?.name || '对手'
        }));
      }
    });
  }

  private handleLeaveRoom(ws: WebSocket, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const leaver = room.players.get(ws);
    room.players.delete(ws);

    if (room.players.size === 0) {
      // Empty room, clean up
      this.rooms.delete(roomId);
    } else {
      // Notify remaining players
      room.players.forEach((player) => {
        if (player.ws.readyState === WebSocket.OPEN) {
          player.ws.send(JSON.stringify({
            type: 'opponent_left',
            name: leaver?.name || '玩家'
          }));
        }
      });
    }
  }
}
