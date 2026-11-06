import { Chess, Square, Move } from 'chess.js';
import confetti from 'canvas-confetti';
import { Chess3DBoard } from './board';
import { ChessAI, AIDifficulty } from './ai';
import { soundManager } from './audio';
import { networkManager } from './network';

export type GameMode = 'pve' | 'pvp' | 'online';

export interface MoveRecord {
  san: string;
  from: Square;
  to: Square;
  piece: string;
  color: 'w' | 'b';
  captured?: string;
  fen: string;
}

export class ChessGameController {
  public chess: Chess;
  public board3D: Chess3DBoard;

  // Game Settings
  public mode: GameMode = 'pve';
  public playerColor: 'w' | 'b' = 'w';
  public aiDifficulty: AIDifficulty = 'medium';
  public autoRotateCamera: boolean = false;

  // State
  public selectedSquare: Square | null = null;
  public legalMovesForSelected: Move[] = [];
  public history: MoveRecord[] = [];
  public isAiThinking: boolean = false;

  // Promotion pending
  public pendingPromotion: { from: Square; to: Square } | null = null;

  // Callbacks for UI updates
  public onStateChange?: () => void;
  public onPromotionNeeded?: (color: 'w' | 'b', onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void) => void;
  public onGameOver?: (result: { winner: 'w' | 'b' | 'draw'; reason: string }) => void;

  constructor(board3D: Chess3DBoard) {
    this.chess = new Chess();
    this.board3D = board3D;

    // Connect 3D board click event
    this.board3D.onSquareClicked = (square: string) => {
      this.handleSquareClick(square as Square);
    };

    // Initial sync
    this.syncBoardView();
  }

  public resetGame() {
    this.chess.reset();
    this.selectedSquare = null;
    this.legalMovesForSelected = [];
    this.history = [];
    this.pendingPromotion = null;
    this.isAiThinking = false;

    this.board3D.setSelectedSquare(null);
    this.board3D.setLegalMoves([]);
    this.board3D.setLastMove(null, null);
    this.board3D.setCheckSquare(null);

    this.syncBoardView();

    // Reset camera to player's perspective
    if (this.mode === 'pve' || this.mode === 'online') {
      this.board3D.setCameraView(this.playerColor === 'w' ? 'white' : 'black');
    } else {
      this.board3D.setCameraView('white');
    }

    if (this.onStateChange) this.onStateChange();

    // If AI is white and user is black, trigger AI first move
    if (this.mode === 'pve' && this.playerColor === 'b') {
      this.triggerAiMove();
    }
  }

  public setGameMode(mode: GameMode, playerColor: 'w' | 'b' = 'w') {
    this.mode = mode;
    this.playerColor = playerColor;
    this.resetGame();
  }

  public setDifficulty(diff: AIDifficulty) {
    this.aiDifficulty = diff;
  }

  public handleSquareClick(square: Square) {
    // If AI is thinking or game is over or modal is open, ignore
    if (this.isAiThinking || this.chess.isGameOver() || this.pendingPromotion) {
      return;
    }

    // In PvE or Online mode, only allow moves on user's turn
    if ((this.mode === 'pve' || this.mode === 'online') && this.chess.turn() !== this.playerColor) {
      return;
    }

    const clickedPiece = this.chess.get(square);
    const isCurrentColorPiece = clickedPiece && clickedPiece.color === this.chess.turn();

    // 1. If user clicks on one of their own pieces -> select it
    if (isCurrentColorPiece) {
      this.selectedSquare = square;
      this.legalMovesForSelected = this.chess.moves({ square, verbose: true });

      this.board3D.setSelectedSquare(square);
      soundManager.playSelect();

      const targets = this.legalMovesForSelected.map((m) => ({
        square: m.to,
        isCapture: !!m.captured
      }));
      this.board3D.setLegalMoves(targets);
      return;
    }

    // 2. If user already selected a piece and clicks on a target square
    if (this.selectedSquare) {
      const move = this.legalMovesForSelected.find((m) => m.to === square);

      if (move) {
        // Check if move is a pawn promotion
        const movingPiece = this.chess.get(this.selectedSquare);
        const isPromotion =
          movingPiece?.type === 'p' &&
          ((movingPiece.color === 'w' && square[1] === '8') ||
            (movingPiece.color === 'b' && square[1] === '1'));

        if (isPromotion) {
          this.pendingPromotion = { from: this.selectedSquare, to: square };
          if (this.onPromotionNeeded) {
            this.onPromotionNeeded(movingPiece.color, (promoPiece) => {
              this.executeMove(this.selectedSquare!, square, promoPiece);
              this.pendingPromotion = null;
            });
          }
          return;
        }

        // Normal move
        this.executeMove(this.selectedSquare, square);
      } else {
        // Clicked invalid square: deselect
        this.clearSelection();
      }
    }
  }

  public executeMove(from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n', isRemote: boolean = false): boolean {
    const isCastle =
      (from === 'e1' && (to === 'g1' || to === 'c1')) ||
      (from === 'e8' && (to === 'g8' || to === 'c8'));

    try {
      const moveResult = this.chess.move({ from, to, promotion: promotion || 'q' });
      if (!moveResult) return false;

      // In online mode, broadcast local move to opponent
      if (!isRemote && this.mode === 'online') {
        networkManager.sendMove(from, to, promotion, moveResult.san, this.chess.fen());
      }

      // Animate move in 3D
      this.board3D.animateMove(from, to, () => {
        // Special handle castling: animate the corresponding Rook
        if (isCastle) {
          if (to === 'g1') this.board3D.animateMove('h1', 'f1');
          if (to === 'c1') this.board3D.animateMove('a1', 'd1');
          if (to === 'g8') this.board3D.animateMove('h8', 'f8');
          if (to === 'c8') this.board3D.animateMove('a8', 'd8');
        }

        // Special handle en passant
        if (moveResult.flags.includes('e')) {
          const epCapturedSquare = `${to[0]}${from[1]}` as Square;
          const capturedMesh = this.board3D.pieceMeshes.get(epCapturedSquare);
          if (capturedMesh) {
            this.board3D.animateCapture(capturedMesh);
            this.board3D.pieceMeshes.delete(epCapturedSquare);
          }
        }

        // Sync board for promotions or any residual piece states
        if (promotion) {
          this.syncBoardView();
        }
      });

      // Sound effects
      if (this.chess.isCheckmate()) {
        soundManager.playCheckmate();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } else if (this.chess.inCheck()) {
        soundManager.playCheck();
      } else if (isCastle) {
        soundManager.playCastle();
      } else if (moveResult.captured) {
        soundManager.playCapture();
      } else {
        soundManager.playMove();
      }

      // Record move history
      this.history.push({
        san: moveResult.san,
        from,
        to,
        piece: moveResult.piece,
        color: moveResult.color,
        captured: moveResult.captured,
        fen: this.chess.fen()
      });

      // Clear highlights
      this.clearSelection();
      this.board3D.setLastMove(from, to);

      // Check indicator
      this.updateCheckIndicator();

      // Notify UI
      if (this.onStateChange) this.onStateChange();

      // Check game over
      if (this.chess.isGameOver()) {
        this.handleGameOver();
        return true;
      }

      // Auto camera rotation in PvP
      if (this.mode === 'pvp' && this.autoRotateCamera) {
        this.board3D.setCameraView(this.chess.turn() === 'w' ? 'white' : 'black');
      }

      // Trigger AI if it's AI's turn
      if (this.mode === 'pve' && this.chess.turn() !== this.playerColor) {
        this.triggerAiMove();
      }

      return true;
    } catch (e) {
      console.error('Invalid move:', e);
      return false;
    }
  }

  private triggerAiMove() {
    this.isAiThinking = true;
    if (this.onStateChange) this.onStateChange();

    // AI think delay for natural feel
    setTimeout(() => {
      const bestMove = ChessAI.getBestMove(this.chess, this.aiDifficulty);
      this.isAiThinking = false;

      if (bestMove) {
        this.executeMove(bestMove.from, bestMove.to, (bestMove.promotion as any) || 'q');
      } else {
        if (this.onStateChange) this.onStateChange();
      }
    }, 450);
  }

  public undoMove() {
    if (this.history.length === 0 || this.isAiThinking || this.mode === 'online') return;

    if (this.mode === 'pve') {
      // In PvE, undo two moves (player move + AI response), unless AI hasn't moved yet
      this.chess.undo();
      this.history.pop();
      if (this.chess.turn() !== this.playerColor && this.history.length > 0) {
        this.chess.undo();
        this.history.pop();
      }
    } else {
      this.chess.undo();
      this.history.pop();
    }

    this.clearSelection();
    this.syncBoardView();

    const last = this.history[this.history.length - 1];
    if (last) {
      this.board3D.setLastMove(last.from, last.to);
    } else {
      this.board3D.setLastMove(null, null);
    }

    this.updateCheckIndicator();
    if (this.onStateChange) this.onStateChange();
  }

  private updateCheckIndicator() {
    if (this.chess.inCheck()) {
      const turn = this.chess.turn();
      const board = this.chess.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece && piece.type === 'k' && piece.color === turn) {
            const sq = `${String.fromCharCode('a'.charCodeAt(0) + c)}${8 - r}` as Square;
            this.board3D.setCheckSquare(sq);
            return;
          }
        }
      }
    } else {
      this.board3D.setCheckSquare(null);
    }
  }

  private handleGameOver() {
    let winner: 'w' | 'b' | 'draw' = 'draw';
    let reason = '对局结束';

    if (this.chess.isCheckmate()) {
      winner = this.chess.turn() === 'w' ? 'b' : 'w';
      reason = winner === 'w' ? '白方获胜 (绝杀 Checkmate)' : '黑方获胜 (绝杀 Checkmate)';
    } else if (this.chess.isStalemate()) {
      reason = '和棋 (逼和 Stalemate)';
    } else if (this.chess.isThreefoldRepetition()) {
      reason = '和棋 (三次重复局面)';
    } else if (this.chess.isInsufficientMaterial()) {
      reason = '和棋 (子力不足)';
    } else if (this.chess.isDraw()) {
      reason = '和棋 (50步规则/双方和棋)';
    }

    if (this.onGameOver) {
      this.onGameOver({ winner, reason });
    }
  }

  public clearSelection() {
    this.selectedSquare = null;
    this.legalMovesForSelected = [];
    this.board3D.setSelectedSquare(null);
    this.board3D.setLegalMoves([]);
  }

  public syncBoardView() {
    this.board3D.syncBoard(this.chess.board());
  }

  // Calculate captured pieces and score difference
  public getCapturedPieces(): {
    whiteCaptured: string[];
    blackCaptured: string[];
    diff: number; // >0 means White advantage, <0 means Black advantage
  } {
    const counts: Record<string, { w: number; b: number }> = {
      p: { w: 8, b: 8 },
      n: { w: 2, b: 2 },
      b: { w: 2, b: 2 },
      r: { w: 2, b: 2 },
      q: { w: 1, b: 1 }
    };

    const board = this.chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type !== 'k') {
          counts[piece.type][piece.color]--;
        }
      }
    }

    const whiteCaptured: string[] = []; // Black pieces captured by White
    const blackCaptured: string[] = []; // White pieces captured by Black

    const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    let scoreW = 0;
    let scoreB = 0;

    for (const [type, item] of Object.entries(counts)) {
      // White captured Black's pieces
      for (let i = 0; i < item.b; i++) {
        whiteCaptured.push(type);
        scoreW += pieceValues[type];
      }
      // Black captured White's pieces
      for (let i = 0; i < item.w; i++) {
        blackCaptured.push(type);
        scoreB += pieceValues[type];
      }
    }

    return {
      whiteCaptured,
      blackCaptured,
      diff: scoreW - scoreB
    };
  }
}
