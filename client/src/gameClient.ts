import { Socket } from "socket.io-client";
import { io } from "socket.io-client"
import ChessInstanceWrapper from "./chessWrapperBase";
import { Move, ShortMove, Square, Piece } from "chess.js"
import { GameClientInstance } from "./index.d"

type BoardEvent = "board_connection" | "board_update" | "black_turn" | "white_turn"
type BoardEventHandler = (sender: GameClient) => void

class GameClient extends ChessInstanceWrapper implements GameClientInstance {
    private _socket: Socket = null;
    
    private _connectedID: number = null;
    public get connectedID(): number {
        return this._connectedID;
    }
    
    public get socket(): Socket {
        return this._socket;
    }
    
    constructor(ip: string, gameID: number) {
        super()

        this._socket = io(`${ip}/chess/${gameID}`);
        this.addEventListeners()
    }

    // --------------------------------------
    //               Network
    // --------------------------------------

    private forceResync() {
        this._socket.emit("chess::resync", (fen: string) => {
            this.instance.load(fen)
            console.log("Синхронизация успешна!")
        })
    }

    private handshakeHandler(fen: string, id: number) {
        this.instance.load(fen)
        this._connectedID = id
        this.emit("board_connection")
    }

    private addEventListeners(): void {
        this._socket.on("chess::method_call", (method: string, args: any[]) => this.methodCallHandler(method, args))
        this._socket.on("chess_handshake", (fen: string, id: number) => this.handshakeHandler(fen, id));
        this._socket.on("connect", () => this.connectHandler())
    }

    private connectHandler() {
        // Resync in case of reconnect
        if(this.connectedID !== null) {
            this.forceResync()
        }
    }

    private methodCallHandler(method: string, args: any[]) {
        this.instance[method](...args)
        this.emitBoardUpdateEvents()
    }

    private remoteMethodCall(method: string, args: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this.socket.emit("chess::method_call", method, args, (success: boolean) => {
                if(success) {
                    resolve(this.instance[method](...args))
                    this.emitBoardUpdateEvents()
                }
                else {
                    reject("Not allowed")
                }
            })
        })
    }

    private lastTurn: "b" | "w" = this.turn()

    private emitBoardUpdateEvents() {
        this.emit("board_update")

        if(this.turn() !== this.lastTurn) {
            this.emit(this.turn() === "w" ? "white_turn" : "black_turn")
        }
    }

    // --------------------------------------
    //       Synchronized Board API
    // --------------------------------------

    //"!undo", "!reset", "!remove", "!put", "!move", "!load_pgn", "!load", "clear"

    public async move(move: string | ShortMove,
        options?: {
            sloppy?: boolean;
        },
    ): Promise<Move> {
        return await this.remoteMethodCall("move", [move])
    }

    public async undo(): Promise<Move> {
        return await this.remoteMethodCall("undo", [])
    }

    public async reset(): Promise<void> {
        return await this.remoteMethodCall("reset", [])
    }

    public async remove(square: Square): Promise<Piece | null | false> {
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

    public async set_headers(...args: string[]): Promise<{ [key: string]: string | undefined } | boolean> {
        return await this.remoteMethodCall("set_headers", [args])
    }

    // --------------------------------------
    //              Events
    // -------------------------------------- 

    // board_connection, board_update, black_turn, white_turn
    
    private eventHandlers = new Map<BoardEvent, BoardEventHandler[]>() 

    /** 
     *  @summary Add event listener
     *  @description Event loop: board_connection => board_update => black_turn / white_turn 
     */
    public on(event: BoardEvent, handler: (sender: GameClient) => void) {
        if(this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).push(handler)
        }
        else {
            this.eventHandlers.set(event, [ handler ])
        }
    }

    private emit(event: BoardEvent): void {
        this.eventHandlers.get(event)?.forEach(handler => handler(this))
    }
}

export default GameClient