import ObservableBoard from "./observableBoard";
import { Socket, Server, Namespace } from "socket.io";
import ChessInstanceWrapper from "./chessWrapperBase";
import GamePermissions from "../userPermissions";
import GameServerClient from "../gameServerClient"
import { Move, ShortMove, Square, Piece } from "chess.js"
import { GameServerSharedMethods, BoardEvent, BoardEventHandler, PermissionsResolver } from "../interfaces"

class RPCChessBoard extends ObservableBoard implements GameServerSharedMethods {
    public permissionsResolver: (socket: Socket) => GamePermissions = (socket: Socket) => GamePermissions.NotAllowed
    
    private _users: GameServerClient[] = [];
    public get users(): GameServerClient[] {
        return [ ...this._users ];
    }
    
    // --------------------------------------
    //           Network events
    // --------------------------------------

    private resyncHandler(client: GameServerClient, respond: (fen: string) => void) {
        respond(this.fen())
    }
    
    private disconnectEventHandler(client: GameServerClient, reason: string) {
        if(reason === "io server disconnect" || reason === "io client disconnect") {
            this._users = this._users.filter(user => user !== client)
        }
    }
    
    // --------------------------------------
    //          Client management
    // --------------------------------------

    public addUser(socket: Socket, permissions: GamePermissions | PermissionsResolver, handshakeData?: any): GameServerClient | false {
        const client = new GameServerClient(socket, this, permissions)
        
        if(!client.permissions.canConnect) {
            return false
        }
        
        this.emit("player_connection", client)
        
        this.clearEventHandlers(client)
        this.addEventHandlers(client)
        
        socket.emit("chess_handshake", this.fen(), handshakeData)
        
        return client
    }

    private clearEventHandlers(client: GameServerClient) {
        client.socket.removeAllListeners("chess::method_call")
        client.socket.removeAllListeners("chess::resync")
    }

    private addEventHandlers(client: GameServerClient) {
        client.socket.on("chess::method_call", (method: string, args: any[], respond: (boolean) => void) => this.methodCallHandler(client, method, args, respond))
        client.socket.on("disconnect", (reason: string) => this.disconnectEventHandler(client, reason))
        client.socket.on("chess::resync", (respond: (fen: string) => void) => this.resyncHandler(client, respond))
    }
    
    // --------------------------------------
    //                 RPC
    // --------------------------------------

    private sharedMethodCall(method: string, args: any[], ignoredClient?: GameServerClient): any | Error {
        let result: any = null
        
        try {
            result = this.instance[method](...args)
        }
        catch(err) {
            return err as Error
        }

        this.users.forEach(client => {
            if(!ignoredClient || client !== ignoredClient) {
                client.socket.emit("chess::method_call", method, args)
            }
        })

        this.invokeBoardEvents()

        return result
    }    

    private methodCallHandler(client: GameServerClient, method: string, args: any[], respond: (boolean) => void) {
        let success = false

        if(client.permissions.methods.includes(method)) {
            success = !(this.sharedMethodCall(method, args, client) instanceof Error)
        }
        // Try to make move by game rules
        else if(method === "move") {
            success = this.tryToMoveByRules(client, args[0])
        }

        respond(success)
    }

    private tryToMoveByRules(client: GameServerClient, move: ShortMove | Move | string) {
        let success = false
        
        const canPlayBlack = client.permissions.canPlayBlack
        const canPlayWhite = client.permissions.canPlayWhite
        
        const allowedToMakeInGameMove = (canPlayBlack && this.turn() === "b") || (canPlayWhite && this.turn() === "w")
        
        if(allowedToMakeInGameMove) {
            success = !(this.sharedMethodCall("move", [move], client) instanceof Error)
        }

        return success
    }
  
    // --------------------------------------
    //       Synchronized Board API
    // --------------------------------------

    //"!undo", "!reset", "!remove", "!put", "!move", "!load_pgn", "!load", "clear"

    public move(move: string | ShortMove,
            options?: {
            sloppy?: boolean;
        },
    ): Move | null {
        return this.sharedMethodCall("move", [move])
    }
    
    public undo(): Move {
        return this.sharedMethodCall("undo", [])
    }

    public reset(): void {
        return this.sharedMethodCall("reset", [])
    }

    public remove(square: Square): Piece {
        return this.sharedMethodCall("remove", [square])
    }

    public put(piece: Piece, square: Square): boolean  {
        return this.sharedMethodCall("put", [piece, square])
    }

    public load_pgn(pgn: string, options?: { newline_char?: string; sloppy?: boolean; }): boolean {
        return this.sharedMethodCall("load_pgn", [pgn, options])
    }

    public load(fen: string): boolean {
        return this.sharedMethodCall("load", [fen])
    }

    public clear(): void {
        return this.sharedMethodCall("clear", [])
    }

    public set_headers(...args: string[]): { [key: string]: string | undefined }  {
        return this.sharedMethodCall("header", [args])
    }
}

export default RPCChessBoard