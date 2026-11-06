import { Chess, Square, PieceSymbol } from 'chess.js';

// Piece base values
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// Helper to convert 2D PST to high-performance 1D Int16Array
function flattenPst(grid: number[][]): Int16Array {
  const reversed = [...grid].reverse();
  const flat = new Int16Array(64);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      flat[(r << 3) | c] = reversed[r][c];
    }
  }
  return flat;
}

// Piece-Square Tables (PST) from White's perspective (row 0 = rank 1, row 7 = rank 8)
const PAWN_PST_RAW = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0]
];

const KNIGHT_PST_RAW = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50]
];

const BISHOP_PST_RAW = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20]
];

const ROOK_PST_RAW = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0]
];

const QUEEN_PST_RAW = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20]
];

const KING_MIDDLE_PST_RAW = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20]
];

const PST_MAP: Record<PieceSymbol, Int16Array> = {
  p: flattenPst(PAWN_PST_RAW),
  n: flattenPst(KNIGHT_PST_RAW),
  b: flattenPst(BISHOP_PST_RAW),
  r: flattenPst(ROOK_PST_RAW),
  q: flattenPst(QUEEN_PST_RAW),
  k: flattenPst(KING_MIDDLE_PST_RAW)
};

function getPiecePst(piece: PieceSymbol, rank: number, file: number, isWhite: boolean): number {
  const r = isWhite ? rank : 7 - rank;
  const f = isWhite ? file : 7 - file;
  const pst = PST_MAP[piece];
  return pst ? pst[(r << 3) | f] : 0;
}

// Evaluate board state from White's perspective (+ means White is winning, - means Black is winning)
export function evaluateBoard(game: Chess): number {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -999999 : 999999;
  }
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
    return 0;
  }

  let score = 0;
  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const rankIndex = 7 - r; // rank index 0..7
      const fileIndex = c; // file index 0..7

      const baseVal = PIECE_VALUES[piece.type];
      const pstVal = getPiecePst(piece.type, rankIndex, fileIndex, piece.color === 'w');
      const totalPieceVal = baseVal + pstVal;

      if (piece.color === 'w') {
        score += totalPieceVal;
      } else {
        score -= totalPieceVal;
      }
    }
  }

  return score;
}

export interface BestMoveResult {
  from: Square;
  to: Square;
  promotion?: string;
}

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export class ChessAI {
  static getBestMove(game: Chess, difficulty: AIDifficulty = 'medium'): BestMoveResult | null {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    // Easy mode: 75% random selection, 25% greedy capture
    if (difficulty === 'easy') {
      const captures = moves.filter((m) => m.captured);
      if (captures.length > 0 && Math.random() < 0.6) {
        const choice = captures[Math.floor(Math.random() * captures.length)];
        return { from: choice.from, to: choice.to, promotion: choice.promotion };
      }
      const choice = moves[Math.floor(Math.random() * moves.length)];
      return { from: choice.from, to: choice.to, promotion: choice.promotion };
    }

    const depth = difficulty === 'hard' ? 3 : 2;
    const isMaximizing = game.turn() === 'w';

    let bestMove = moves[0];
    let bestValue = isMaximizing ? -Infinity : Infinity;

    // Move ordering: sort captures and checks first to optimize alpha-beta pruning
    moves.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      if (a.captured) scoreA += 10 * PIECE_VALUES[a.captured] - PIECE_VALUES[a.piece];
      if (b.captured) scoreB += 10 * PIECE_VALUES[b.captured] - PIECE_VALUES[b.piece];
      if (a.promotion) scoreA += 800;
      if (b.promotion) scoreB += 800;
      return scoreB - scoreA;
    });

    let alpha = -Infinity;
    let beta = Infinity;

    for (const move of moves) {
      game.move(move);
      const value = this.minimax(game, depth - 1, alpha, beta, !isMaximizing);
      game.undo();

      if (isMaximizing) {
        if (value > bestValue) {
          bestValue = value;
          bestMove = move;
        }
        alpha = Math.max(alpha, bestValue);
      } else {
        if (value < bestValue) {
          bestValue = value;
          bestMove = move;
        }
        beta = Math.min(beta, bestValue);
      }

      if (beta <= alpha) {
        break;
      }
    }

    return {
      from: bestMove.from,
      to: bestMove.to,
      promotion: bestMove.promotion
    };
  }

  private static minimax(
    game: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): number {
    if (depth === 0) {
      return evaluateBoard(game);
    }
    if (game.isGameOver()) {
      return evaluateBoard(game);
    }

    const moves = game.moves({ verbose: true });
    // Move ordering: sort captures and checks first to optimize alpha-beta pruning
    if (moves.length > 1) {
      moves.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        if (a.captured) scoreA += 10 * PIECE_VALUES[a.captured] - PIECE_VALUES[a.piece];
        if (b.captured) scoreB += 10 * PIECE_VALUES[b.captured] - PIECE_VALUES[b.piece];
        return scoreB - scoreA;
      });
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        game.move(move);
        const evaluation = this.minimax(game, depth - 1, alpha, beta, false);
        game.undo();
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        game.move(move);
        const evaluation = this.minimax(game, depth - 1, alpha, beta, true);
        game.undo();
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }
}
