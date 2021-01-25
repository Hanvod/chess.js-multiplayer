import ObservableBoard from "./observableBoard";
import { Socket, Server, Namespace } from "socket.io";
import ChessInstanceWrapper from "./chessWrapperBase";
import GamePermissions from "./userPermissions";
import ChessboardClient from "./chessboardClient"
import { Move, ShortMove, Square, Piece } from "chess.js"
import { GameServerSharedMethods, BoardEvent, BoardEventHandler, PermissionsResolver, IChessboardClient } from "../interfaces"

class RPCChessBoard extends ObservableBoard implements GameServerSharedMethods {
    public permissionsResolver: (socket: Socket) => GamePermissions = (socket: Socket) => GamePermissions.NotAllowed
    
    private _users: IChessboardClient[] = [];
    public get users(): IChessboardClient[] {
        return [ ...this._users ];
    }
    
    // --------------------------------------
    //           Network events
    // --------------------------------------

    
    
    // --------------------------------------
    //          Client management
    // --------------------------------------

    public addUser(socket: Socket, permissions: GamePermissions | PermissionsResolver, handshakeData?: any): IChessboardClient | false {
        const client = new ChessboardClient(socket, this, permissions)
        
        if(!client.permissions.canConnect) {
            return false
        }
        
        this.clearEventHandlers(client)
        this.addEventHandlers(client)
        
        socket.emit("chess::handshake", this.fen(), handshakeData, () => {
            this.emit("player_connection", client)
        })
        
        this._users.push(client)

        return client
    }

    private clearEventHandlers(client: IChessboardClient) {
        client.socket.removeAllListeners("chess::method_call")
        client.socket.removeAllListeners("chess::resync")
    }

    private addEventHandlers(client: IChessboardClient) {
        client.socket.on("chess::method_call", (method: string, args: any[], respond: (boolean) => void) => this.methodCallHandler(client, method, args, respond))
        client.socket.on("disconnect", (reason: string) => this.disconnectEventHandler(client, reason))
        client.socket.on("chess::resync", (respond: (fen: string) => void) => this.resyncHandler(client, respond))
    }

    private resyncHandler(client: IChessboardClient, respond: (fen: string) => void) {
        respond(this.fen())
    }
    
    private disconnectEventHandler(client: IChessboardClient, reason: string) {
        if(reason === "io server disconnect" || reason === "io client disconnect") {
            this._users = this._users.filter(user => user !== client)
            this.clearEventHandlers(client)
        }
    }
    
    // --------------------------------------
    //                 RPC
    // --------------------------------------

    private sharedMethodCall(method: string, args: any[], ignoredClient?: IChessboardClient): any | Error {
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

    private methodCallHandler(client: IChessboardClient, method: string, args: any[], respond: (boolean) => void) {
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

    private tryToMoveByRules(client: IChessboardClient, move: ShortMove | Move | string) {
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