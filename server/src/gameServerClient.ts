import { Socket } from "socket.io";
import GamePermissions from "./userPermissions";
import GameServer from "./gameServer"

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

export default GameServerClient