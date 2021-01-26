import { Socket } from "socket.io";
import GamePermissions from "./userPermissions";
import RPCChessBoard from ".";
import { IChessboardClient, PermissionsResolver } from "../interfaces";

class ChessboardClient implements IChessboardClient {
    public readonly socket: Socket;
   
    public metadata: any

    private readonly _permissions: GamePermissions | PermissionsResolver
    public get permissions(): GamePermissions {
        if(typeof this._permissions === "function") {
            return this._permissions(this)
        }
        else {
            return this._permissions
        }
    }
    
    public readonly server: RPCChessBoard

    constructor(socket: Socket, server: RPCChessBoard, permissions: GamePermissions | PermissionsResolver, metadata?: any) {
        this.socket = socket
        this.server = server
        this._permissions = permissions
        this.metadata = metadata
    }
}

export default ChessboardClient