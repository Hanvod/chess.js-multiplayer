import { Socket } from "socket.io";
import GamePermissions from "./userPermissions";
import GameServer from "./chessboard/gameServer"
import RPCChessBoard from "./chessboard/rpcBoard";
import { PermissionsResolver } from "./interfaces";

class GameServerClient {
    public readonly socket: Socket;
   
    private readonly permissionsResolver: PermissionsResolver = null
    private readonly _permissions: GamePermissions = null
    public get permissions(): GamePermissions {
        return !!this.permissionsResolver && this.permissionsResolver(this) || this._permissions
    }
    
    public readonly server: RPCChessBoard

    constructor(socket: Socket, server: RPCChessBoard, permissions: GamePermissions | PermissionsResolver) {
        this.socket = socket
        this.server = server
        
        if(typeof permissions === "function") {
            this.permissionsResolver = permissions
        }
        else {
            this._permissions = permissions
        }
    }
}

export default GameServerClient