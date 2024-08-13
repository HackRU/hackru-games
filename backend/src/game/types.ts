export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface Piece {
  type: PieceType;
  shape: number[][];
  x: number;
  y: number;
}

export interface GameState {
  board: number[][];
  currentPiece: Piece;
  nextPiece: Piece;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
}

export type Move = 'LEFT' | 'RIGHT' | 'DOWN' | 'ROTATE' | 'HARD_DROP';