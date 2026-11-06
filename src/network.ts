import { Peer, type DataConnection } from 'peerjs';

export interface NetworkMovePayload {
  from: string;
  to: string;
  promotion?: string;
  san: string;
  fen: string;
}

export interface ChatMessage {
  sender: string;
  isSelf: boolean;
  text: string;
  emoji?: string;
  time: string;
}

type EventCallback = (data: any) => void;

// WebRTC STUN Configuration for Global NAT Traversal (Free & Serverless)
const PEER_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' }
    ]
  }
};

const ROOM_PREFIX = 'gjxq3d-';

export class NetworkManager {
  private peer: Peer | null = null;
  private activeConn: DataConnection | null = null;

  public isConnected: boolean = false;
  public roomId: string | null = null;
  public myColor: 'w' | 'b' | 'spectator' | null = null;
  public playerName: string = '玩家';
  public isHost: boolean = false;

  private listeners: Map<string, EventCallback[]> = new Map();

  constructor() {
    this.playerName = '棋手_' + Math.floor(100 + Math.random() * 900);
  }

  // Pre-initialize or verify P2P readiness
  public connect(): Promise<boolean> {
    return Promise.resolve(true);
  }

  public on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: EventCallback) {
    const list = this.listeners.get(event);
    if (!list) return;
    const idx = list.indexOf(callback);
    if (idx !== -1) {
      list.splice(idx, 1);
    }
  }

  private emit(event: string, data: any) {
    const list = this.listeners.get(event);
    if (list) {
      list.forEach((cb) => cb(data));
    }
  }

  // Generate clean 6-digit numeric room code
  private generateNumericCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create Room as P2P Host
  public async createRoom(hostColorChoice: 'w' | 'b' | 'random'): Promise<string | null> {
    this.cleanup();

    let assignedColor: 'w' | 'b' = 'w';
    if (hostColorChoice === 'random') {
      assignedColor = Math.random() < 0.5 ? 'w' : 'b';
    } else {
      assignedColor = hostColorChoice;
    }

    return new Promise((resolve) => {
      const tryInitPeer = () => {
        const roomCode = this.generateNumericCode();
        const peerId = `${ROOM_PREFIX}${roomCode}`;

        try {
          const peer = new Peer(peerId, PEER_CONFIG);
          this.peer = peer;

          peer.on('open', () => {
            this.roomId = roomCode;
            this.myColor = assignedColor;
            this.isHost = true;
            this.isConnected = true;
            this.emit('connection_change', { status: 'connected' });
            this.emit('room_created', { roomId: roomCode, color: assignedColor });
            resolve(roomCode);
          });

          peer.on('connection', (conn) => {
            this.handleIncomingConnection(conn);
          });

          peer.on('error', (err: any) => {
            console.warn('[P2P PeerJS Error]', err);
            // If room code collision occurs, retry with another 6-digit code
            if (err?.type === 'unavailable-id') {
              peer.destroy();
              tryInitPeer();
            } else {
              this.emit('connection_change', { status: 'error' });
              resolve(null);
            }
          });
        } catch (e) {
          console.error('[P2P Init Error]', e);
          resolve(null);
        }
      };

      tryInitPeer();
    });
  }

  // Join Room as P2P Guest
  public async joinRoom(roomCodeInput: string): Promise<boolean> {
    this.cleanup();

    const roomCode = roomCodeInput.trim().replace(/\D/g, '');
    if (roomCode.length !== 6) {
      alert('请输入完整的 6 位数字房间号');
      return false;
    }

    return new Promise((resolve) => {
      try {
        const guestPeer = new Peer(PEER_CONFIG);
        this.peer = guestPeer;

        let hasResolved = false;
        const targetPeerId = `${ROOM_PREFIX}${roomCode}`;

        guestPeer.on('open', () => {
          const conn = guestPeer.connect(targetPeerId, { reliable: true });
          this.activeConn = conn;

          conn.on('open', () => {
            this.isConnected = true;
            this.roomId = roomCode;
            this.isHost = false;

            // Send handshake greeting to Host
            conn.send({
              type: 'hello',
              playerName: this.playerName
            });
          });

          conn.on('data', (data: any) => {
            if (data.type === 'room_joined') {
              this.myColor = data.color;
              this.emit('room_joined', data);
              if (!hasResolved) {
                hasResolved = true;
                resolve(true);
              }
            } else {
              this.handleData(data);
            }
          });

          conn.on('close', () => {
            this.emit('opponent_left', { name: '对手' });
            this.cleanup();
          });

          conn.on('error', (err) => {
            console.warn('[P2P Conn Error]', err);
            if (!hasResolved) {
              hasResolved = true;
              alert('连接对手失败，请检查网络');
              resolve(false);
            }
          });
        });

        guestPeer.on('error', (err: any) => {
          console.warn('[P2P Guest Error]', err);
          if (!hasResolved) {
            hasResolved = true;
            if (err?.type === 'peer-unavailable') {
              alert('房间不存在或房主尚未就绪，请核对 6 位房间号');
            } else {
              alert('P2P 握手失败，请稍后重试');
            }
            resolve(false);
          }
        });

        // 10s connection timeout protection
        setTimeout(() => {
          if (!hasResolved) {
            hasResolved = true;
            alert('连接房间超时，请确认房主在线');
            resolve(false);
          }
        }, 10000);
      } catch (e) {
        console.error('[P2P Join Error]', e);
        resolve(false);
      }
    });
  }

  // Handle Host receiving Guest connection
  private handleIncomingConnection(conn: DataConnection) {
    this.activeConn = conn;

    conn.on('open', () => {
      // Opponent role is opposite of host
      const guestColor = this.myColor === 'w' ? 'b' : 'w';

      conn.on('data', (data: any) => {
        if (data.type === 'hello') {
          // Send room configuration back to Guest
          conn.send({
            type: 'room_joined',
            roomId: this.roomId,
            color: guestColor,
            opponentName: this.playerName
          });

          // Notify Host that guest has joined
          this.emit('player_joined', {
            opponentName: data.playerName || '挑战者',
            opponentColor: guestColor
          });
        } else {
          this.handleData(data);
        }
      });

      conn.on('close', () => {
        this.emit('opponent_left', { name: '对手' });
      });
    });
  }

  // Handle incoming data payload from peer
  private handleData(msg: any) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'opponent_move':
        this.emit('opponent_move', msg);
        break;

      case 'chat':
        this.emit('chat', {
          sender: msg.sender || '对手',
          text: msg.text,
          emoji: msg.emoji,
          isSelf: false,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        break;

      case 'draw_offer':
        this.emit('draw_offered', {});
        break;

      case 'draw_accept':
        this.emit('draw_agreed', {});
        break;

      case 'resign':
        this.emit('player_resigned', {
          winner: this.myColor,
          resignedColor: this.myColor === 'w' ? 'b' : 'w'
        });
        break;

      case 'rematch_request':
        this.emit('rematch_requested', {});
        break;

      case 'rematch_accept': {
        // Swap colors for rematch
        const newColor = this.myColor === 'w' ? 'b' : 'w';
        this.myColor = newColor;
        this.emit('game_reset', { color: newColor });
        break;
      }

      case 'leave':
        this.emit('opponent_left', { name: '对手' });
        break;
    }
  }

  private sendData(payload: any) {
    if (this.activeConn && this.activeConn.open) {
      this.activeConn.send(payload);
    }
  }

  // In-Game P2P Messaging
  public sendMove(from: string, to: string, promotion: string | undefined, san: string, fen: string) {
    this.sendData({
      type: 'opponent_move',
      from,
      to,
      promotion,
      san,
      fen
    });
  }

  public sendChat(text: string, emoji?: string) {
    this.sendData({
      type: 'chat',
      sender: this.playerName,
      text,
      emoji
    });

    // Also display self message
    this.emit('chat', {
      sender: this.playerName,
      text,
      emoji,
      isSelf: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  public offerDraw() {
    this.sendData({ type: 'draw_offer' });
  }

  public acceptDraw() {
    this.sendData({ type: 'draw_accept' });
    this.emit('draw_agreed', {});
  }

  public resign() {
    this.sendData({ type: 'resign' });
    this.emit('player_resigned', {
      winner: this.myColor === 'w' ? 'b' : 'w',
      resignedColor: this.myColor
    });
  }

  public requestRematch() {
    this.sendData({ type: 'rematch_request' });
  }

  public acceptRematch() {
    this.sendData({ type: 'rematch_accept' });
    const newColor = this.myColor === 'w' ? 'b' : 'w';
    this.myColor = newColor;
    this.emit('game_reset', { color: newColor });
  }

  public leaveRoom() {
    this.sendData({ type: 'leave' });
    this.cleanup();
  }

  public cleanup() {
    if (this.activeConn) {
      try {
        this.activeConn.close();
      } catch {}
      this.activeConn = null;
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }

    this.isConnected = false;
    this.roomId = null;
    this.myColor = null;
    this.isHost = false;
  }
}

export const networkManager = new NetworkManager();
