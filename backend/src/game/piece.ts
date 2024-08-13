import { Piece, PieceType } from './types';
import { SHAPES, BOARD_WIDTH } from './constants';

export function generatePiece(): Piece {
  const types: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const type = types[Math.floor(Math.random() * types.length)];
  return {
    type,
    shape: SHAPES[type],
    x: Math.floor((BOARD_WIDTH - SHAPES[type][0].length) / 2),
    y: 0
  };
}

export function rotatePiece(piece: Piece): Piece {
  const rotatedShape = piece.shape[0].map((_, index) =>
    piece.shape.map(row => row[index]).reverse()
  );
  return { ...piece, shape: rotatedShape };
}