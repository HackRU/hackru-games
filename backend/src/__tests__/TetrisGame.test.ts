import { TetrisGame } from '../game/TetrisGame';
import { Move, PieceType, GameState } from '../game/types';
import { SHAPES, POINTS_PER_LINE, BOARD_WIDTH, BOARD_HEIGHT } from '../game/constants';

describe('TetrisGame', () => {
    let game: TetrisGame;

    beforeEach(() => {
        game = new TetrisGame();
        // Make piece generation deterministic for all tests
        const pieceSequence: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        let pieceIndex = 0;
        jest.spyOn(game as any, 'generatePiece').mockImplementation(() => {
            const type = pieceSequence[pieceIndex % pieceSequence.length];
            pieceIndex++;
            return {
                type,
                shape: SHAPES[type],
                x: Math.floor((BOARD_WIDTH - SHAPES[type][0].length) / 2),
                y: 0
            };
        });
    });

    describe('Initial state', () => {
        test('should have correct initial game state', () => {
            const state = game.getState();
            expect(state.score).toBe(0);
            expect(state.level).toBe(1);
            expect(state.lines).toBe(0);
            expect(state.gameOver).toBe(false);
            expect(state.board.length).toBe(BOARD_HEIGHT);
            expect(state.board[0].length).toBe(BOARD_WIDTH);
            expect(state.currentPiece).toBeDefined();
            expect(state.nextPiece).toBeDefined();
        });
    });

    describe('Piece movement', () => {
        test('should move piece left', () => {
            const initialX = game.getState().currentPiece.x;
            game.makeMove('LEFT');
            expect(game.getState().currentPiece.x).toBe(initialX - 1);
        });

        test('should move piece right', () => {
            const initialX = game.getState().currentPiece.x;
            game.makeMove('RIGHT');
            expect(game.getState().currentPiece.x).toBe(initialX + 1);
        });

        test('should move piece down', () => {
            const initialY = game.getState().currentPiece.y;
            game.makeMove('DOWN');
            expect(game.getState().currentPiece.y).toBe(initialY + 1);
        });

        test('should prevent moving out of bounds', () => {
            // Move left until hitting the wall
            while (game.makeMove('LEFT')) {}
            const leftX = game.getState().currentPiece.x;
            expect(game.makeMove('LEFT')).toBe(false);
            expect(game.getState().currentPiece.x).toBe(leftX);

            // Move right until hitting the wall
            while (game.makeMove('RIGHT')) {}
            const rightX = game.getState().currentPiece.x;
            expect(game.makeMove('RIGHT')).toBe(false);
            expect(game.getState().currentPiece.x).toBe(rightX);
        });
    });

    describe('Piece rotation', () => {
        test('should rotate piece', () => {
            const initialShape = game.getState().currentPiece.shape;
            game.makeMove('ROTATE');
            expect(game.getState().currentPiece.shape).not.toEqual(initialShape);
        });

        test('should prevent invalid rotation', () => {
            // Move to left wall
            while (game.makeMove('LEFT')) {}
            const initialShape = game.getState().currentPiece.shape;
            // Try to rotate
            if (!game.makeMove('ROTATE')) {
                expect(game.getState().currentPiece.shape).toEqual(initialShape);
            }
        });
    });

    describe('Hard drop', () => {
        test('should place piece at the bottom', () => {
            game.makeMove('HARD_DROP');
            const state = game.getState();
            expect(state.board.some(row => row.some(cell => cell !== 0))).toBe(true);
        });
    });

    describe('Line clearing', () => {
        test('should clear one line', () => {
            const mockState = createMockStateWithFilledRows(game, 1);
            (game as any).gameState = mockState;

            game.makeMove('HARD_DROP');
            game.update();

            const newState = game.getState();
            expect(newState.lines).toBe(1);
            expect(newState.score).toBe(POINTS_PER_LINE[0]);
        });

        test('should clear multiple lines', () => {
            const mockState = createMockStateWithFilledRows(game, 4);
            (game as any).gameState = mockState;

            game.makeMove('HARD_DROP');
            game.update();

            const newState = game.getState();
            expect(newState.lines).toBe(4);
            expect(newState.score).toBe(POINTS_PER_LINE[3]);
        });
    });

    describe('Game over', () => {
        test('should detect game over when new piece cannot be placed', () => {
            const mockState = createGameOverMockState(game);
            (game as any).gameState = mockState;

            game.update();

            expect(game.getState().gameOver).toBe(true);
        });

        test('should detect game over when top row is partially filled', () => {
            const mockState = createPartialTopRowGameOverMockState(game);
            (game as any).gameState = mockState;

            game.update();

            expect(game.getState().gameOver).toBe(true);
        });
    });

    describe('Level progression', () => {
        test('should level up after clearing 10 lines', () => {
            const mockState: GameState = {
                ...game.getState(),
                lines: 9,
                level: 1
            };
            (game as any).gameState = mockState;

            // Simulate clearing one more line
            const fullRow = Array(BOARD_WIDTH).fill(1);
            (game as any).gameState.board[BOARD_HEIGHT - 1] = fullRow;
            (game as any).clearLines();

            expect(game.getState().level).toBe(2);
        });
    });

    describe('Piece generation', () => {
        test('should generate valid piece', () => {
            const piece = (game as any).generatePiece();
            expect(piece).toHaveProperty('type');
            expect(piece).toHaveProperty('shape');
            expect(piece).toHaveProperty('x');
            expect(piece).toHaveProperty('y');
        });
    });

    describe('Collision detection', () => {
        test('should detect collision with bottom', () => {
            const state = game.getState();
            state.currentPiece.y = BOARD_HEIGHT - state.currentPiece.shape.length;
            (game as any).gameState = state;
            expect((game as any).isCollision(state.currentPiece.x, state.currentPiece.y + 1)).toBe(true);
        });

        test('should detect collision with other pieces', () => {
            const state = game.getState();
            state.board[BOARD_HEIGHT - 1] = Array(BOARD_WIDTH).fill(1);
            state.currentPiece.y = BOARD_HEIGHT - state.currentPiece.shape.length - 1;
            (game as any).gameState = state;
            expect((game as any).isCollision(state.currentPiece.x, state.currentPiece.y + 1)).toBe(true);
        });
    });

    describe('Piece placement', () => {
        test('should place piece on board', () => {
            const state = game.getState();
            state.currentPiece.y = BOARD_HEIGHT - state.currentPiece.shape.length;
            (game as any).gameState = state;
            (game as any).placePiece();
            expect(game.getState().board.some(row => row.some(cell => cell !== 0))).toBe(true);
        });
    });

    describe('Game state updates', () => {
        test('should move piece down on update', () => {
            const initialY = game.getState().currentPiece.y;
            game.update();
            expect(game.getState().currentPiece.y).toBe(initialY + 1);
        });

        test('should place piece and spawn new piece when collision detected', () => {
            const state = game.getState();
            state.currentPiece.y = BOARD_HEIGHT - state.currentPiece.shape.length;
            (game as any).gameState = state;
            const initialNextPiece = state.nextPiece;
            game.update();
            const newState = game.getState();
            expect(newState.board.some(row => row.some(cell => cell !== 0))).toBe(true);
            expect(newState.currentPiece).toEqual(initialNextPiece);
            expect(newState.nextPiece).not.toEqual(initialNextPiece);
        });
    });
});

// Helper functions for creating mock states
function createMockStateWithFilledRows(game: TetrisGame, rowCount: number): GameState {
    const mockState: GameState = {
        ...game.getState(),
        board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
    };
    for (let i = 1; i <= rowCount; i++) {
        mockState.board[BOARD_HEIGHT - i] = Array(BOARD_WIDTH - 1).fill(1).concat([0]);
    }
    mockState.currentPiece = {
        type: 'I',
        shape: [[1], [1], [1], [1]],
        x: BOARD_WIDTH - 1,
        y: BOARD_HEIGHT - rowCount
    };
    return mockState;
}

function createGameOverMockState(game: TetrisGame): GameState {
    const mockState: GameState = {
        ...game.getState(),
        board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
    };
    mockState.board[0] = Array(BOARD_WIDTH).fill(1);
    mockState.board[1] = Array(BOARD_WIDTH).fill(1);
    mockState.currentPiece = {
        type: 'I',
        shape: SHAPES['I'],
        x: 3,
        y: BOARD_HEIGHT - 1
    };
    mockState.nextPiece = {
        type: 'I',
        shape: SHAPES['I'],
        x: 3,
        y: 0
    };
    return mockState;
}

function createPartialTopRowGameOverMockState(game: TetrisGame): GameState {
    const mockState: GameState = {
        ...game.getState(),
        board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
    };
    mockState.board[0] = [1, 1, 1, 1, 0, 0, 0, 0, 0, 0];
    mockState.board[1] = Array(BOARD_WIDTH).fill(1);
    mockState.currentPiece = {
        type: 'I',
        shape: SHAPES['I'],
        x: 4,
        y: 0
    };
    return mockState;
}