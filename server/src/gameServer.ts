import { Socket, Server, Namespace } from "socket.io";
import ChessInstanceWrapper from "./chessWrapperBase";
import GamePermissions from "./userPermissions";
import { Move, ShortMove, Square, Piece } from "chess.js"

class GameServerClient {
    public readonly socket: Socket;
    public readonly permissions: GamePermissions
    public readonly server: GameServer

    constructor(socket: Socket, server: GameServer, permissions: GamePermissions) {
        this.socket = socket
        this.server = server
        this.permissions = permissions

        socket.removeAllListeners("chess::method_call")
        socket.removeAllListeners("chess::move")
        socket.removeAllListeners("chess::force_resync")
    }
}

class GameServer extends ChessInstanceWrapper {
    private static instances: number = 0

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
    
    public permissionsResolver: (socket: Socket) => GamePermissions = (socket: Socket) => GamePermissions.NotAllowed

    private _id;
    
    public get id() {
        return this._id;
    }
    
    private namespace: Namespace = null

    public users: GameServerClient[] = []

    // --------------------------------------
    //               Network
    // --------------------------------------

    private resync(client: GameServerClient, respond: (fen: string) => void) {
        respond(this.fen())
    }
    
    /**
     * 
     * @param method Имя метода
     * @param args Массив аргументов
     * @param ignoredClient Не передавать информацию этому клиенту (используется, когда метод вызван самим клиентом)
     */
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

    // --------------------------------------
    //          Client management
    // --------------------------------------

    /**
     * Adds client and instantly synchronize board
     */
    private addUser(socket: Socket, permissions: GamePermissions): void {
        const client = new GameServerClient(socket, this, permissions)
        
        this.addEventHandlers(client)
        
        this.users.push(client)
    }

    private addEventHandlers(client: GameServerClient) {
        client.socket.on("chess::method_call", (method: string, args: any[], respond: (boolean) => void) => this.methodCallHandler(client, method, args, respond))
        client.socket.on("disconnect", (reason: string) => this.disconnectEventHandler(client, reason))
        client.socket.on("resync", (respond: (fen: string) => void) => this.resync(client, respond))
    }

    private disconnectEventHandler(client: GameServerClient, reason: string) {
        if(reason === "")
        this.users = this.users.filter(user => user !== client)
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