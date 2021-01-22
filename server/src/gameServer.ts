import { Socket } from "socket.io";
import ChessInstanceWrapper from "./chessWrapperBase";
import GamePermissions from "./userPermissions";
import { Move, ShortMove } from "chess.js"

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
    }
}

class GameServer extends ChessInstanceWrapper {
    public users: GameServerClient[]

    private resync(client: GameServerClient) {
        client.socket.emit("chess::resync", this.instance.fen())
    }

    private broadcastMethodCall(method: string, args: any[]) {
        this.users.forEach(client => client.socket.emit("chess::method_call", method, args))
    }

    private methodCallHandler(client: GameServerClient, method: string, args: any[], respond: (boolean) => void) {
        const permissions = client.permissions
        let success = false

        if(permissions.methods.includes(method)) {
            try {
                this[method]()
                success = true
            }
            catch(err) {
                success = false
            }
        }
        else if(method === "move") {
            // Handle move by game rules
            return this.moveHandler(client, args[0], respond)
        }

        respond(success)
    }
    
    private moveHandler(client: GameServerClient, move: ShortMove | Move | string, respond: (boolean) => void) {
        const permissions = client.permissions
        
        const allowedToMakeInGameMove = (permissions.canPlayBlack && this.turn() === "b") || (permissions.canPlayWhite && this.turn() === "w")
        
        let success = true

        if(allowedToMakeInGameMove) {
            try {
                this.move(move)
                success = true
            }
            catch(err) {
                success = false
            }
        }

        respond(allowedToMakeInGameMove && success)
    }

    private addEventHandlers(client: GameServerClient) {
        client.socket.on("chess::method_call", (method: string, args: any[]) => this.methodCallHandler(client, method, args))
        client.socket.on("chess::move", (move: ShortMove | Move | string, respond: (boolean) => void) => this.moveHandler(client, move, respond))
    }

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

    
}