import { Socket } from "socket.io";
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
    constructor() {
        super()
    }
    
    public users: GameServerClient[] = []

    // --------------------------------------
    //               Network
    // --------------------------------------

    private resync(client: GameServerClient) {
        client.socket.emit("chess::resync", this.instance.fen())
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
    public addUser(socket: Socket, permissions: GamePermissions): GameServerClient {
        const client = new GameServerClient(socket, this, permissions)
        
        this.addEventHandlers(client)
        this.resync(client)
        this.users.push(client)

        return client
    }

    private addEventHandlers(client: GameServerClient) {
        client.socket.on("chess::method_call", (method: string, args: any[], respond: (boolean) => void) => this.methodCallHandler(client, method, args, respond))
        client.socket.on("disconnect", (reason: string) => this.disconnectEventHandler(client, reason))


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