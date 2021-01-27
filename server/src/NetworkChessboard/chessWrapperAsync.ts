import ChessInstanceWrapper from "./chessWrapperBase"
import RPCBoard from "./rpcBoard"
import { Piece, Square, Move, ShortMove } from "chess.js"
import { GameServerSharedMethods, IBoardEvents } from "../interfaces"
import BoardEvents from "./boardEvents"

abstract class ChessWrapperWithSharedMethods extends ChessInstanceWrapper implements GameServerSharedMethods {
    protected abstract rpcManager: RPCBoard = null
    protected abstract _events: BoardEvents = null 

    public get events(): IBoardEvents {
        return this._events
    }

    public move(move: string | ShortMove,
                options?: {
                sloppy?: boolean;
            },
    ): Move | null {
        return this.rpcManager.sharedMethodCall("move", [move])
    }

    public undo(): Move {
        return this.rpcManager.sharedMethodCall("undo", [])
    }

    public reset(): void {
        return this.rpcManager.sharedMethodCall("reset", [])
    }

    public remove(square: Square): Piece {
        return this.rpcManager.sharedMethodCall("remove", [square])
    }

    public put(piece: Piece, square: Square): boolean  {
        return this.rpcManager.sharedMethodCall("put", [piece, square])
    }

    public load_pgn(pgn: string, options?: { newline_char?: string; sloppy?: boolean; }): boolean {
        return this.rpcManager.sharedMethodCall("load_pgn", [pgn, options])
    }

    public load(fen: string): boolean {
        return this.rpcManager.sharedMethodCall("load", [fen])
    }

    public clear(): void {
        return this.rpcManager.sharedMethodCall("clear", [])
    }

    public set_headers(...args: string[]): { [key: string]: string | undefined }  {
        return this.rpcManager.sharedMethodCall("header", [args])
    }
}

export default ChessWrapperWithSharedMethods