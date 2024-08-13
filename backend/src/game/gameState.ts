import { GameState, Move } from './types';
import { generatePiece, rotatePiece } from './piece';
import { createEmptyBoard, isCollision, mergePieceToBoard, clearLines } from './board';
import { POINTS_PER_LINE } from './constants';

export function createInitialGameState(): GameState {
  return {
    board: createEmptyBoard(),
    currentPiece: generatePiece(),
    nextPiece: generatePiece(),
    score: 0,
    level: 1,
    lines: 0,
    gameOver: false
  };
}

export function updateGameState(state: GameState, move: Move): GameState {
  if (state.gameOver) return state;

  let newState = { ...state };
  let newPiece = { ...newState.currentPiece };

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
      while (!isCollision(newState.board, { ...newPiece, y: newPiece.y + 1 })) {
        newPiece.y += 1;
      }
      break;
  }

  if (!isCollision(newState.board, newPiece)) {
    newState.currentPiece = newPiece;
  }

  if (move === 'DOWN' || move === 'HARD_DROP') {
    if (isCollision(newState.board, { ...newState.currentPiece, y: newState.currentPiece.y + 1 })) {
      newState.board = mergePieceToBoard(newState.board, newState.currentPiece);
      const { newBoard, linesCleared } = clearLines(newState.board);
      newState.board = newBoard;
      newState.lines += linesCleared;
      newState.score += POINTS_PER_LINE[linesCleared - 1] * newState.level;
      newState.level = Math.floor(newState.lines / 10) + 1;

      newState.currentPiece = newState.nextPiece;
      newState.nextPiece = generatePiece();

      // Check if the new piece can be placed
      if (isCollision(newState.board, newState.currentPiece)) {
        newState.gameOver = true;
      }
    }
  }
  return newState;
}