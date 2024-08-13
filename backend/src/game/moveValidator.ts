import { GameState, Move } from './types';
import { isCollision } from './board';
import { rotatePiece } from './piece';

export function isValidMove(state: GameState, move: Move): boolean {
  const { board, currentPiece } = state;
  let newPiece = { ...currentPiece };

  switch (move) {
    case 'LEFT':
      newPiece.x -= 1;
      break;
    case 'RIGHT':
      newPiece.x += 1;
      break;
    case 'DOWN':
      newPiece.y += 1;
      break;
    case 'ROTATE':
      newPiece = rotatePiece(newPiece);
      break;
    case 'HARD_DROP':
      return true; // Hard drop is always valid, it will stop at the lowest possible position
  }

  return !isCollision(board, newPiece);
}