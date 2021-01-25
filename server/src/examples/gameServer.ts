import { Socket, Server, Namespace } from "socket.io";
import ChessInstanceWrapper from "./chessWrapperBase";
import GamePermissions from "../userPermissions";
import GameServerClient from "../gameServerClient"
import { Move, ShortMove, Square, Piece } from "chess.js"
import { GameServerSharedMethods, BoardEvent, BoardEventHandler } from "../interfaces"
import ObservableBoard from "./observableBoard";
import RPCChessBoard from "./rpcBoard";

class GameServer extends RPCChessBoard implements GameServerSharedMethods {
    private static instances: number = 0

    private _id;
    private namespace: Namespace = null
    
    public get id() {
        return this._id;
    }

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
}

export default GameServer