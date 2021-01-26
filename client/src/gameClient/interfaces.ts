import { Socket } from "socket.io-client";
import { ShortMove, Move, Piece, Square, PieceType, ChessInstance } from "chess.js"
import GameClient from "./gameClientBase";

type BoardEvent = "board_connection" | "board_update" | "black_turn" | "white_turn" | "game_over"
type BoardEventHandler = (sender: INetworkChessboard, ...args: any[]) => void

interface IChessboardSyncMethods extends Omit<ChessInstance, "move" | "undo" | "reset" | "remove" | "put" | "header" | "move" | "load_pgn" | "load" | "clear"> {

}

interface IChessboardAsyncMethods {
    /**
     * This method is async and will be executed only after server-side permission validation.
     * Returns false if execution is forbidden or failed.
     * 
     * Attempts to make a move on the board, returning a move object if the
     * move was legal, otherwise null.
     * The .move function can be called two ways, by passing a string in
     * Standard Algebraic Notation (SAN),
     * Or by passing .move() a move object (only the 'to', 'from', and when
     * necessary 'promotion', fields are needed).
     * @param move Must be either a string in Standard Algebraic Notation
     * (SAN), or a move object (only the 'to', 'from', and when necessary
     * 'promotion', fields are needed)
     * @param options An optional sloppy flag can be used to parse a variety of
     * non-standard move notations:
     * @returns The move as a full object is returned if the move was valid,
     * and the chess board's state changes.
     * If the move was invalid, null is returned and the state does not update.
     */
    move(
        move: string | ShortMove,
        options?: {
            /**
             * An optional sloppy flag can be used to parse a variety of
             * non-standard move notations.
             */
            sloppy?: boolean;
        },
    ): Promise<Move | false>;

    /**
     * This method is async and will be executed only after server-side permission validation.
     * Returns false if execution is forbidden or failed.
     * 
     * Take back the last half-move, returning a move object if successful,
     * otherwise null.
     * @returns the move object that was undone if successful, otherwise null.
     */
    undo(): Promise<Move | false>;
    
    /**
     * This method is async and will be executed only after server-side permission validation.
     * Returns false if execution is forbidden or failed.
     * 
     * Clears the board of all pieces.
     */
    clear(): Promise<void | false>;

    /**
     * This method is async and will be executed only after server-side permission validation.
     * Returns false if execution is forbidden or failed.
     * 
     * Place a piece on the square where piece is an object with the form
     * { type: ..., color: ... }.
     * put() will fail when passed an invalid piece or square, or when two
     * or more kings of the same color are placed.
     * @param piece the piece to put somewhere on the game board.
     * @param square the square on the chess board to place the piece at.
     * @returns true if the piece was successfully placed, otherwise, the
     * board remains unchanged and false is returned.
     */
    put(piece: Piece, square: Square): Promise<boolean>;

    /**
     * This method is async and will be executed only after server-side permission validation.
     * Returns false if execution is forbidden or failed. 
     * 
     * Remove and return the piece on square.
     * @param square the square to remove the piece from, e.g. "b6"
     * @returns null if no piece was removed, otherwise an object with the
     * removed piece's type and color.
     */
    remove(square: Square): Promise<Piece | null | false>;

    /**
     * This method is async and will be executed only after server-side permission validation.
     * Returns false if execution is forbidden or failed.
     * 
     * Load the moves of a game stored in Portable Game Notation.
     * @param pgn the pgn should be a string in Portable Game Notation.
     * @param options An optional object which may contain a string
     * newline_char and a boolean sloppy.
     * @returns The method will return true if the PGN was parsed successfully,
     * otherwise false.
     */
    load_pgn(
        pgn: string,
        options?: {
            /**
             * The newline_char is a string representation of a valid RegExp
             * fragment and is used to process the PGN.
             * It defaults to \r?\n.
             * Special characters should not be pre-escaped, but any literal
             * special characters should be escaped as is normal for a RegExp.
             * Keep in mind that backslashes in JavaScript strings must
             * themselves be escaped.
             * Avoid using a newline_char that may occur elsewhere in a PGN,
             * such as . or x, as this will result in unexpected behavior.
             */
            newline_char?: string;

            /**
             * The sloppy flag is a boolean that permits chess.js to parse moves in
             * non-standard notations.
             * See .move documentation for more information about non-SAN
             * notations.
             */
            sloppy?: boolean;
        },
    ): Promise<boolean>;

    /**
     * This method is async and will be executed only after server-side permission validation.
     * Returns false if execution is forbidden or failed.
     * 
     * Reset the board to the initial starting position.
     */
    reset(): Promise<void | false>;

    /**
     * This method is async and will be executed only after server-side permission validation.
     * Returns false if execution is forbidden or failed.
     * 
     * The board is cleared, and the FEN string is loaded.
     * Returns true if the position was successfully loaded, otherwise false
     * @param fen the fen formatted string to load
     * @returns true if the position was successfully loaded, otherwise
     * false
     */
    load(fen: string): Promise<boolean>;
    
    /**
     * Allows to get header information from PGN output.
     * @returns The current header information.
     */
    get_headers(): { [key: string]: string | undefined } 

    /**
     * This method is async and will be executed only after server-side permission validation.
     * Returns false if execution is forbidden or failed.
     *
     * Allows to set header information to PGN output.
     * @returns The current header information after storing any values.
     */
    set_headers(...args: string[]): Promise<{ [key: string]: string | undefined } | boolean>
}

interface INetworkChessboard extends IChessboardAsyncMethods, IChessboardSyncMethods {
    events: IBoardEvents
 }

interface IBoardEvents {
    on(event: BoardEvent, handler: BoardEventHandler) 
    off(event: BoardEvent, handler: BoardEventHandler)
}

export { IBoardEvents, IChessboardAsyncMethods, IChessboardSyncMethods, BoardEvent, BoardEventHandler, INetworkChessboard }

