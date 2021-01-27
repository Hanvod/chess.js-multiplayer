import { Chess, ChessInstance, Square, Move } from "chess.js"
import { IChessboardSyncMethods } from "./interfaces"

/**
 * Contains methods that doesn't affect game state and not meant to be synchronized
 */
abstract class ChessInstanceWrapper implements IChessboardSyncMethods {
    protected chessJSInstance: ChessInstance = new Chess()

    public ascii() {
        return this.chessJSInstance.ascii()
    }

    public board() {
        return this.chessJSInstance.board()
    }

    public fen() {
        return this.chessJSInstance.fen()
    }

    public game_over() {
        return this.chessJSInstance.game_over()
    }

    public get(square: Square) {
        return this.chessJSInstance.get(square)
    }

    public in_check() {
        return this.chessJSInstance.in_check()
    }

    public in_checkmate() {
        return this.chessJSInstance.in_checkmate()
    }

    public in_draw() {
        return this.chessJSInstance.in_draw()
    }

    public in_stalemate() {
        return this.chessJSInstance.in_stalemate()
    }

    public in_threefold_repetition() {
        return this.chessJSInstance.in_threefold_repetition()
    }

    public insufficient_material() {
        return this.chessJSInstance.insufficient_material()
    }

    public moves(options: {
        verbose: true;
        square?: string;
    }): Move[];

    public moves(options?: {
        verbose?: false;
        square?: string;
    }): string[]

    public moves(options?: {
        verbose?: boolean;
        square?: string;
    }): string[] | Move[] {
        return this.chessJSInstance.moves(options);
    }

    public history(options?: {
        verbose?: false;
    }): string[];

    public history(options: {
        verbose: true;
    }): Move[];

    public history(options?: {
        verbose?: boolean;
    }): string[] | Move[] {
        return this.chessJSInstance.history(options)
    }

    public turn() {
        return this.chessJSInstance.turn()
    }

    public validate_fen(fen: string) {
        return this.chessJSInstance.validate_fen(fen)
    }

    public pgn(options?: { max_width?: number; newline_char?: string; }) {
        return this.chessJSInstance.pgn(options)
    }
    
    public square_color(square: Square) {
        return this.chessJSInstance.square_color(square);
    }

    public readonly SQUARES: [
        'a8',
        'b8',
        'c8',
        'd8',
        'e8',
        'f8',
        'g8',
        'h8',
        'a7',
        'b7',
        'c7',
        'd7',
        'e7',
        'f7',
        'g7',
        'h7',
        'a6',
        'b6',
        'c6',
        'd6',
        'e6',
        'f6',
        'g6',
        'h6',
        'a5',
        'b5',
        'c5',
        'd5',
        'e5',
        'f5',
        'g5',
        'h5',
        'a4',
        'b4',
        'c4',
        'd4',
        'e4',
        'f4',
        'g4',
        'h4',
        'a3',
        'b3',
        'c3',
        'd3',
        'e3',
        'f3',
        'g3',
        'h3',
        'a2',
        'b2',
        'c2',
        'd2',
        'e2',
        'f2',
        'g2',
        'h2',
        'a1',
        'b1',
        'c1',
        'd1',
        'e1',
        'f1',
        'g1',
        'h1',
    ] = [
        'a8',
        'b8',
        'c8',
        'd8',
        'e8',
        'f8',
        'g8',
        'h8',
        'a7',
        'b7',
        'c7',
        'd7',
        'e7',
        'f7',
        'g7',
        'h7',
        'a6',
        'b6',
        'c6',
        'd6',
        'e6',
        'f6',
        'g6',
        'h6',
        'a5',
        'b5',
        'c5',
        'd5',
        'e5',
        'f5',
        'g5',
        'h5',
        'a4',
        'b4',
        'c4',
        'd4',
        'e4',
        'f4',
        'g4',
        'h4',
        'a3',
        'b3',
        'c3',
        'd3',
        'e3',
        'f3',
        'g3',
        'h3',
        'a2',
        'b2',
        'c2',
        'd2',
        'e2',
        'f2',
        'g2',
        'h2',
        'a1',
        'b1',
        'c1',
        'd1',
        'e1',
        'f1',
        'g1',
        'h1',
    ];

    public readonly WHITE = 'w';
    public readonly BLACK = 'b';

    public readonly PAWN = 'p';
    public readonly KNIGHT = 'n';
    public readonly BISHOP = 'b';
    public readonly ROOK = 'r';
    public readonly QUEEN = 'q';
    public readonly KING = 'k';
    
    public readonly FLAGS: {
        NORMAL: 'n';
        CAPTURE: 'c';
        BIG_PAWN: 'b';
        EP_CAPTURE: 'e';
        PROMOTION: 'p';
        KSIDE_CASTLE: 'k';
        QSIDE_CASTLE: 'q';
    } = {
        NORMAL: 'n',
        CAPTURE: 'c',
        BIG_PAWN: 'b',
        EP_CAPTURE: 'e',
        PROMOTION: 'p',
        KSIDE_CASTLE: 'k',
        QSIDE_CASTLE: 'q'
    }

    public get_headers() {
        return this.chessJSInstance.header()
    }
}

export default ChessInstanceWrapper