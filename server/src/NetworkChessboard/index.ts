import { Socket } from "socket.io";
import GamePermissions from "./userPermissions";
import ChessboardClient from "./chessboardClient"
import { PermissionsResolver, IChessboardClient } from "../interfaces"
import RPCBoard from "./rpcBoard";
import ChessWrapperWithSharedMethods from "./chessWrapperAsync"
import { IBoardEvents } from "../interfaces"
import { INetworkChessboard } from "../interfaces"
import BoardEvents from "./boardEvents";

class NetworkChessboard extends ChessWrapperWithSharedMethods implements INetworkChessboard {
    protected _events = new BoardEvents(this, this.instance)
    protected rpcManager: RPCBoard = new RPCBoard(this._events, this.instance)
    
    public get users(): IChessboardClient[] {
        return this.rpcManager.users
    }

    public get events(): IBoardEvents {
        return this._events
    }
    
    public addUser(socket: Socket, permissions: GamePermissions | PermissionsResolver, handshakeData?: any): IChessboardClient {
        const client = new ChessboardClient(socket, this, permissions)
        
        if(!client.permissions.canConnect) {
            throw("Подключение запрещено!!!Ё!!!вавыаываыв")
        }
        
        this.rpcManager.addClient(client, handshakeData)

        return client
    }
}

export default NetworkChessboard