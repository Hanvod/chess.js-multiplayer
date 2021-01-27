import { Socket, io } from "socket.io-client";
import BoardEvents from "./boardEvents";
import GameClientBase from "./gameClientBase";
import { INetworkChessboard } from "./interfaces";
import RPCBoard from "./RPCBoard";

class NetworkChessboard extends GameClientBase implements INetworkChessboard {
    public get connected(): boolean {
        return this.rpcManager.connected
    }
 
    protected _events = new BoardEvents(this, this.chessJSInstance)
    protected rpcManager: RPCBoard

    /**
     * Creates a chessboard from socket. Chessboard will wait for handshake event from server to load data.
     * @param socket 
     */
    public constructor(socket: Socket) {
        super()
        this.rpcManager = new RPCBoard(socket, this.chessJSInstance, this._events)
    }

    /**
     * Creates a chessboard with new io() connection using given query. Chessboard will wait for handshake event from server to load data.
     * @param endpoint 
     * @param query 
     */
    public static connectToGameServer(endpoint: string, query: any): NetworkChessboard {
        return new NetworkChessboard(io(endpoint, { forceNew: true, query }))
    }

    /**
     * Creates a new io() connection with given query and waits for chessboard handshake.
     * @param endpoint 
     * @param query 
     * @param timeout 
     */
    public static connectToGameServerWaitForHandshake(endpoint: string, query?: any, timeout?: number): Promise<NetworkChessboard> {
        return new Promise<NetworkChessboard>((resolve, reject) => {
            const timeoutHandle = timeout && setTimeout(reject, timeout)
            const client = NetworkChessboard.connectToGameServer(endpoint, query)
            client.events.on("board_connection", board => {
                resolve(client)
                clearTimeout(timeoutHandle)
            })
        })
    }
}

export default NetworkChessboard