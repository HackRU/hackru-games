import { v4 as uuidv4 } from 'uuid';
import { redis } from '../services/redisService';
import { log, error } from '../utils/logger';
import { GameState, Piece, Move, PieceType } from './types';
import { BOARD_WIDTH, BOARD_HEIGHT, SHAPES, LEVEL_SPEEDS, POINTS_PER_LINE } from './constants';

export class TetrisGame {
    private gameId: string;
    private gameState: GameState;
    private static GAME_STATE_TTL = 3600;

    constructor() {
        this.gameId = uuidv4();
        this.gameState = this.createInitialGameState();
    }

    /**
     * Creates the initial game state with an empty board and generated pieces.
     * @returns {GameState} The initial game state.
     */
    private createInitialGameState(): GameState {
        return {
            board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)),
            currentPiece: this.generatePiece(),
            nextPiece: this.generatePiece(),
            score: 0,
            level: 1,
            lines: 0,
            gameOver: false
        };
    }

    /**
     * Generates a new random piece.
     * @returns {Piece} A new piece with random type and shape.
     */
    private generatePiece(): Piece {
        const types: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const type = types[Math.floor(Math.random() * types.length)];
        return {
            type,
            shape: SHAPES[type],
            x: Math.floor((BOARD_WIDTH - SHAPES[type][0].length) / 2),
            y: 0
        };
    }

    /**
     * Handles a move action in the game.
     * @param {Move} move The move to be made.
     * @returns {boolean} Whether the move was successful.
     */
    makeMove(move: Move): boolean {
        if (this.gameState.gameOver) return false;

        switch (move) {
            case 'LEFT':
                return this.movePiece(-1, 0);
            case 'RIGHT':
                return this.movePiece(1, 0);
            case 'DOWN':
                return this.movePiece(0, 1);
            case 'ROTATE':
                return this.rotatePiece();
            case 'HARD_DROP':
                return this.hardDrop();
            default:
                return false;
        }
    }

    /**
     * Moves the current piece by the specified delta.
     * @param {number} dx Horizontal delta.
     * @param {number} dy Vertical delta.
     * @returns {boolean} Whether the move was successful.
     */
    private movePiece(dx: number, dy: number): boolean {
        const newX = this.gameState.currentPiece.x + dx;
        const newY = this.gameState.currentPiece.y + dy;
        if (this.isValidPosition(newX, newY)) {
            this.gameState.currentPiece.x = newX;
            this.gameState.currentPiece.y = newY;
            return true;
        }
        return false;
    }

    /**
     * Rotates the current piece.
     * @returns {boolean} Whether the rotation was successful.
     */
    private rotatePiece(): boolean {
        const rotatedShape = this.gameState.currentPiece.shape[0].map((_, index) =>
            this.gameState.currentPiece.shape.map(row => row[index]).reverse()
        );
        if (this.isValidPosition(this.gameState.currentPiece.x, this.gameState.currentPiece.y, rotatedShape)) {
            this.gameState.currentPiece.shape = rotatedShape;
            return true;
        }
        return false;
    }

    /**
     * Performs a hard drop of the current piece.
     * @returns {boolean} Always returns true.
     */
    private hardDrop(): boolean {
        while (this.movePiece(0, 1)) { }
        this.placePiece();
        this.clearLines();
        this.spawnNewPiece();
        this.checkGameOver();
        return true;
    }

    /**
     * Checks if a position is valid for a piece.
     * @param {number} x The x-coordinate to check.
     * @param {number} y The y-coordinate to check.
     * @param {number[][]} shape The shape to check (defaults to current piece shape).
     * @returns {boolean} Whether the position is valid.
     */
    private isValidPosition(x: number, y: number, shape: number[][] = this.gameState.currentPiece.shape): boolean {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    const boardX = x + col;
                    const boardY = y + row;
                    if (
                        boardX < 0 ||
                        boardX >= BOARD_WIDTH ||
                        boardY >= BOARD_HEIGHT ||
                        (boardY >= 0 && this.gameState.board[boardY][boardX] !== 0)
                    ) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    /**
     * Updates the game state, handling piece movement and game over conditions.
     */
    update(): void {
        console.log('Update called. Current state:', JSON.stringify(this.gameState));
        if (this.isCollision(this.gameState.currentPiece.x, this.gameState.currentPiece.y + 1)) {
            console.log('Collision detected');
            this.placePiece();
            if (!this.canSpawnNewPiece()) {
                console.log('Game over condition met');
                this.gameState.gameOver = true;
            } else {
                this.clearLines();
                this.spawnNewPiece();
            }
        } else {
            this.gameState.currentPiece.y++;
            console.log('Piece moved down. New Y:', this.gameState.currentPiece.y);
        }
        console.log('Update finished. New state:', JSON.stringify(this.gameState));
    }

    /**
     * Checks if a new piece can be spawned.
     * @returns {boolean} Whether a new piece can be spawned.
     */
    private canSpawnNewPiece(): boolean {
        const nextPiece = this.gameState.nextPiece;
        return this.isValidPosition(nextPiece.x, nextPiece.y, nextPiece.shape);
    }

    /**
     * Checks for collision at a given position.
     * @param {number} x The x-coordinate to check.
     * @param {number} y The y-coordinate to check.
     * @returns {boolean} Whether there is a collision.
     */
    private isCollision(x: number, y: number): boolean {
        return !this.isValidPosition(x, y);
    }

    /**
     * Places the current piece on the board.
     */
    private placePiece(): void {
        const { shape, x, y } = this.gameState.currentPiece;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    const boardY = y + row;
                    const boardX = x + col;
                    if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                        this.gameState.board[boardY][boardX] = 1;
                    }
                }
            }
        }
    }

    /**
     * Clears completed lines and updates the score.
     */
    private clearLines(): void {
        console.log('Clearing lines. Current board state:', JSON.stringify(this.gameState.board));
        let linesCleared = 0;
        this.gameState.board = this.gameState.board.filter(row => {
            if (row.every(cell => cell !== 0)) {
                linesCleared++;
                console.log('Clearing line:', row);
                return false;
            }
            return true;
        });

        while (this.gameState.board.length < BOARD_HEIGHT) {
            this.gameState.board.unshift(Array(BOARD_WIDTH).fill(0));
        }

        if (linesCleared > 0) {
            this.gameState.lines += linesCleared;
            const pointsEarned = POINTS_PER_LINE[linesCleared - 1] * this.gameState.level;
            this.gameState.score += pointsEarned;
            this.gameState.level = Math.floor(this.gameState.lines / 10) + 1;
            console.log(`Cleared ${linesCleared} lines. Points earned: ${pointsEarned}. New score: ${this.gameState.score}`);
        } else {
            console.log('No lines cleared');
        }
        console.log('Board after clearing lines:', JSON.stringify(this.gameState.board));
    }


    /**
     * Spawns a new piece and checks if it can be placed.
     * @returns {boolean} Whether the new piece was successfully spawned.
     */
    private spawnNewPiece(): boolean {
        console.log('Spawning new piece');
        this.gameState.currentPiece = this.gameState.nextPiece;
        this.gameState.nextPiece = this.generatePiece();
        console.log('New current piece:', JSON.stringify(this.gameState.currentPiece));
        console.log('New next piece:', JSON.stringify(this.gameState.nextPiece));

        return this.isValidPosition(this.gameState.currentPiece.x, this.gameState.currentPiece.y);
    }


    /**
     * Checks if the game is over.
     * @returns {boolean} Whether the game is over.
     */
    private checkGameOver(): boolean {
        return !this.isValidPosition(this.gameState.currentPiece.x, this.gameState.currentPiece.y);
    }

    /**
     * Gets the current game state.
     * @returns {GameState} The current game state.
     */
    getState(): GameState {
        return this.gameState;
    }

    /**
     * Saves the current game state to Redis.
     */
    async saveState(): Promise<void> {
        try {
            await redis.set(`gameState:${this.gameId}`, JSON.stringify(this.gameState), 'EX', TetrisGame.GAME_STATE_TTL);
        } catch (err) {
            error(`Failed to save game state for game ${this.gameId}`, err as Error);
        }
    }

    /**
     * Loads the game state from Redis.
     * @returns {Promise<boolean>} Whether the state was successfully loaded.
     */
    async loadState(): Promise<boolean> {
        try {
            const savedState = await redis.get(`gameState:${this.gameId}`);
            if (savedState) {
                this.gameState = JSON.parse(savedState);
                return true;
            }
        } catch (err) {
            error(`Failed to load game state for game ${this.gameId}`, err as Error);
        }
        return false;
    }
}