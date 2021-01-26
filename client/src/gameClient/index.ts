import { Socket, io } from "socket.io-client";
import GameClientBase from "./gameClientBase";
import { INetworkChessboard } from "./interfaces";

class NetworkChessboard extends GameClientBase implements INetworkChessboard {
    private constructor(socket: Socket) {
        super(socket)
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
            client.on("board_connection", board => {
                resolve(client)
                clearTimeout(timeoutHandle)
            })
        })
    }
}

