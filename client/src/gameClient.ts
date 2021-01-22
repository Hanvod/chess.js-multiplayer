import { Socket } from "socket.io-client";
import { io } from "socket.io-client"
import ChessInstanceWrapper from "./chessWrapperBase";
import { Move, ShortMove, Square, Piece } from "chess.js"

class GameClient extends ChessInstanceWrapper {
    private socket: Socket = null

    constructor(endpoint: string) {
        super()

        this.socket = io(endpoint)
        this.addEventListeners()
    }

    // --------------------------------------
    //               Network
    // --------------------------------------

    private addEventListeners(): void {
        this.socket.on("chess::resync", this.resyncHandler)
        this.socket.on("chess::method_call", this.methodCallHandler)
    }

    private resyncHandler(fen: string) {
        this.instance.load(fen)
    }

    private methodCallHandler(method: string, args: any[]) {
        this.instance[method](...args)
    }

    private remoteMethodCall(method: string, args: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this.socket.emit("chess::method_call", method, args, (success: boolean) => {
                if(success) {
                    resolve(this.instance[method](...args))
                }
                else {
                    reject("Not allowed")
                }
            })
        })
    }

    // --------------------------------------
    //       Synchronized Board API
    // --------------------------------------

    //"!undo", "!reset", "!remove", "!put", "!move", "!load_pgn", "!load", "clear"

    public async move(move: string | ShortMove,
        options?: {
            sloppy?: boolean;
        },
    ): Promise<Move | null> {
        return await this.remoteMethodCall("move", [move])
    }

    public async undo(): Promise<Move> {
        return await this.remoteMethodCall("undo", [])
    }

    public async reset(): Promise<void> {
        return await this.remoteMethodCall("reset", [])
    }

    public async remove(square: Square): Promise<Piece> {
        return await this.remoteMethodCall("remove", [square])
    }

    public async put(piece: Piece, square: Square): Promise<boolean> {
        return await this.remoteMethodCall("put", [piece, square])
    }

    public async load_pgn(pgn: string, options?: { newline_char?: string; sloppy?: boolean; }): Promise<boolean> {
        return await this.remoteMethodCall("load_pgn", [pgn, options])
    }

    public async load(fen: string): Promise<boolean> {
        return await this.remoteMethodCall("load", [fen])
    }

    public async clear(): Promise<void> {
        return await this.remoteMethodCall("clear", [])
    }
}