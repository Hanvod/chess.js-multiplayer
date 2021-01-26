import { Socket, io } from "socket.io-client";
import BoardEvents from "./boardEvents";
import GameClientBase from "./gameClientBase";
import { INetworkChessboard } from "./interfaces";
import RPCBoard from "./RPCBoard";

class NetworkChessboard extends GameClientBase implements INetworkChessboard {
    private constructor(socket: Socket) {
        super()
        this._events = new BoardEvents(this)
        this.rpcManager = new RPCBoard(socket, this.instance, this._events)
    }

    public static useIO(socket: Socket): INetworkChessboard {
        return new NetworkChessboard(socket)
    }

    public static connectToGameServer(endpoint: string, query: any): INetworkChessboard {
        return new NetworkChessboard(io(endpoint, { forceNew: true, query }))
    }

    public static connectToGameServerWaitForHandshake(endpoint: string, query: any, timeout: number = 5000): Promise<INetworkChessboard> {
        return new Promise<INetworkChessboard>((resolve, reject) => {
            const timeoutHandle = setTimeout(reject, timeout)
            const client = NetworkChessboard.connectToGameServer(endpoint, query)
            client.events.on("board_connection", board => {
                resolve(client)
                clearTimeout(timeoutHandle)
            })
        })
    }
}

export default NetworkChessboard