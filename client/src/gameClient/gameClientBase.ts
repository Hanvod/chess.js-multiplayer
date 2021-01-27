import ChessInstanceWrapper from "./chessWrapperBase";
import { Move, ShortMove, Square, Piece } from "chess.js"
import { IChessboardAsyncMethods, IBoardEvents } from "./interfaces"
import BoardEvents from "./boardEvents";
import RPCBoard from "./RPCBoard";

/**
 * Contains synchronized methods and event emmiter.
 */
abstract class GameClientBase extends ChessInstanceWrapper implements IChessboardAsyncMethods {
    protected abstract rpcManager: RPCBoard = null
    protected abstract _events: BoardEvents = null 

    public get events(): IBoardEvents {
        return this._events
    }
    
    // --------------------------------------
    //       Synchronized Board API
    // --------------------------------------

   

    // --------------------------------------
    //       Synchronized Board API
    // --------------------------------------

    public async move(move: string | ShortMove,
        options?: {
            sloppy?: boolean;
        },
    ): Promise<Move> {
        return await this.rpcManager.remoteMethodCall("move", [move])
    }

    public async undo(): Promise<Move> {
        return await this.rpcManager.remoteMethodCall("undo", [])
    }

    public async reset(): Promise<void> {
        return await this.rpcManager.remoteMethodCall("reset", [])
    }

    public async remove(square: Square): Promise<Piece | null | false> {
        return await this.rpcManager.remoteMethodCall("remove", [square])
    }

    public async put(piece: Piece, square: Square): Promise<boolean> {
        return await this.rpcManager.remoteMethodCall("put", [piece, square])
    }

    public async load_pgn(pgn: string, options?: { newline_char?: string; sloppy?: boolean; }): Promise<boolean> {
        return await this.rpcManager.remoteMethodCall("load_pgn", [pgn, options])
    }

    public async load(fen: string): Promise<boolean> {
        return await this.rpcManager.remoteMethodCall("load", [fen])
    }

    public async clear(): Promise<void> {
        return await this.rpcManager.remoteMethodCall("clear", [])
    }

    public async set_headers(...args: string[]): Promise<{ [key: string]: string | undefined } | boolean> {
        return await this.rpcManager.remoteMethodCall("set_headers", [args])
    }
}

export default GameClientBase