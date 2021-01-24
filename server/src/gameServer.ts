import { Socket, Server, Namespace } from "socket.io";
import ChessInstanceWrapper from "./chessWrapperBase";
import GamePermissions from "./userPermissions";
import GameServerClient from "./gameServerClient"
import { Move, ShortMove, Square, Piece } from "chess.js"

class GameServer extends ChessInstanceWrapper {
    private static instances: number = 0

    private _id;
    private namespace: Namespace = null
    
    public get id() {
        return this._id;
    }
    
    public permissionsResolver: (socket: Socket) => GamePermissions = (socket: Socket) => GamePermissions.NotAllowed
    public users: GameServerClient[] = []

    constructor(ioServer: Server, permissionsResolver: (socket: Socket) => GamePermissions) {
        super()

        this.permissionsResolver = permissionsResolver

        this._id = GameServer.instances
        GameServer.instances++

        this.namespace = ioServer.of(`/chess/${this._id}`)
        
        this.namespace.use((socket: Socket, next) => {
            const permissions: GamePermissions = this.permissionsResolver(socket)

            if(!permissions.canConnect) {
                next(new Error("You are not allowed to connect to this session"))
            }

            this.addUser(socket, permissions)
            
            next()
        })
    }
    
    // --------------------------------------
    //           Network events
    // --------------------------------------

    private addEventHandlers(client: GameServerClient) {
        client.socket.on("chess::method_call", (method: string, args: any[], respond: (boolean) => void) => this.methodCallHandler(client, method, args, respond))
        client.socket.on("disconnect", (reason: string) => this.disconnectEventHandler(client, reason))
        client.socket.on("chess::resync", (respond: (fen: string) => void) => this.resyncHandler(client, respond))
    }
    
    private resyncHandler(client: GameServerClient, respond: (fen: string) => void) {
        respond(this.fen())
    }
    
    private disconnectEventHandler(client: GameServerClient, reason: string) {
        if(reason === "")
        this.users = this.users.filter(user => user !== client)
    }
    
    // --------------------------------------
    //          Client management
    // --------------------------------------

    public addUser(socket: Socket, permissions: GamePermissions): GameServerClient {
        const client = new GameServerClient(socket, this, permissions)
        this.addEventHandlers(client)
        this.users.push(client)

        socket.emit("chess_handshake", this.fen(), this.id)

        return client;
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
}

export default GameServer