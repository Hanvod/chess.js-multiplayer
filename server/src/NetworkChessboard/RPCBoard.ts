import { ChessInstance, ShortMove, Move } from "chess.js"
import BoardEvents from "./boardEvents" 
import { IChessboardClient } from "../interfaces"  
import ChessboardClient from "./chessboardClient"
import { Socket } from "socket.io"
import GamePermissions from "./userPermissions"
import { PermissionsResolver } from "../interfaces"
import NetworkChessboard from "."

import { IBoardEvents } from "../interfaces"

class RPCBoard {
    private _events: BoardEvents
    private _users: ChessboardClient[] = []
    private networkBoard: NetworkChessboard

    private get instance(): ChessInstance{
        return this.networkBoard.instance
    }
    
    public get events(): IBoardEvents {
        return this._events
    }
    
    constructor(networkBoard: NetworkChessboard) {
        this.networkBoard = networkBoard
        this._events = new BoardEvents(networkBoard)
    }
   
    public get users(): ChessboardClient[] {
        return [ ...this._users ]
    }

    private findClient(socket: Socket) {
        return this._users.find(user => user.socket === socket)
    }
  
    public sharedMethodCall(method: string, args: any[], ignoredClient?: ChessboardClient): any | Error {
        let result: any = null
        
        try {
            result = this.instance[method](...args)
        }
        catch(err) {
            return err as Error
        }

        this._users.forEach(client => {
            if(!ignoredClient || client !== ignoredClient) {
                client.socket.emit("chess::method_call", method, args)
            }
        })

        this._events.invoke()

        return result
    }    

    private moveByRules(client: ChessboardClient, move: ShortMove | Move | string) {
        let success = false
        
        const canPlayBlack = client.permissions.canPlayBlack
        const canPlayWhite = client.permissions.canPlayWhite
        
        const allowedToMakeInGameMove = (canPlayBlack && this.instance.turn() === "b") || (canPlayWhite && this.instance.turn() === "w")
        
        if(allowedToMakeInGameMove) {
            success = !(this.sharedMethodCall("move", [move], client) instanceof Error)
        }

        return success
    }

    public addClient(client: ChessboardClient, handshakeData?: any) {
        console.log("Клиент добавлен!")

        this.removeEventHandlers(client)
        this.addEventHandlers(client)
        
        client.socket.emit("chess::handshake", this.instance.fen(), handshakeData, () => {
            this._events.emit("player_connection", client)
        })
        
        this._users.push(client)
    }

    private removeEventHandlers(client: ChessboardClient) {
        client.socket.removeAllListeners("chess::method_call")
        client.socket.removeAllListeners("chess::resync")
        client.socket.removeListener("disconnect", this.disconnectEventHandler)    
    }

    private addEventHandlers(client: ChessboardClient) {
        client.socket.on("chess::method_call", (method: string, args: any[], respond: (boolean) => void) => this.methodCallHandler(client, method, args, respond))
        client.socket.on("disconnect", (reason: string) => this.disconnectEventHandler(client, reason))
        client.socket.on("chess::resync", (respond: (string) => void) => this.resyncHandler(respond))
    }
    
    // --------------------------------------
    //           Network events
    // --------------------------------------

    private resyncHandler(respond: (fen: string) => void) {
        respond(this.instance.fen())
    }
    
    private disconnectEventHandler(client: ChessboardClient, reason: string) {
       if(reason === "io server disconnect" || reason === "io client disconnect") {
            this._users = this._users.filter(user => user !== client)
            this.removeEventHandlers(client)
        }
    }

    private methodCallHandler = (client: ChessboardClient, method: string, args: any[], respond: (boolean) => void) => {
        let success = false

        if(client.permissions.methods.includes(method)) {
            success = !(this.sharedMethodCall(method, args, client) instanceof Error)
        }
        // Try to make move by game rules
        else if(method === "move") {
            success = this.moveByRules(client, args[0])
        }

        respond(success)
    }
}

export default RPCBoard