import { Socket } from "socket.io";
import GamePermissions from "./userPermissions";
import ChessboardClient from "./chessboardClient"
import { PermissionsResolver, IChessboardClient } from "../interfaces"
import RPCBoard from "./rpcBoard";
import ChessWrapperWithSharedMethods from "./chessWrapperAsync"
import { IBoardEvents } from "../interfaces"
import { INetworkChessboard } from "../interfaces"

class NetworkChessboard extends ChessWrapperWithSharedMethods implements INetworkChessboard {
    private constructor() {
        super()
        this.rpcManager = new RPCBoard(this)
    }

    public get users(): IChessboardClient[] {
        return this.rpcManager.users
    }

    public get events(): IBoardEvents {
        return this.rpcManager.events
    }
    
    public addUser(socket: Socket, permissions: GamePermissions | PermissionsResolver, handshakeData?: any): IChessboardClient {
        const client = new ChessboardClient(socket, this, permissions)
        
        if(!client.permissions.canConnect) {
            throw("Подключение запрещено!!!Ё!!!вавыаываыв")
        }
        
        this.rpcManager.addClient(client, handshakeData)

        return client
    }

    public static create(): INetworkChessboard {
        return new NetworkChessboard()
    }
}

export default NetworkChessboard