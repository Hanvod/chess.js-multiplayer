import { Socket } from "socket.io-client";
import ChessInstanceWrapper from "./chessWrapperBase";
import BoardEvents from "./boardEvents";
import { IBoardEvents } from "./interfaces"
import { ChessInstance } from "chess.js";

class RPCBoard {
    private _socket: Socket = null;
    
    public get socket(): Socket {
        return this._socket;
    }
    
    public set socket(value: Socket) {
        this.removeEventListeners()
        this._socket = value
        this.addEventListeners()
    }

    private _connected: boolean = false;
    
    public get connected(): boolean {
        return this._connected;
    }
   
    private instance: ChessInstance
    private events: BoardEvents
    
    constructor(socket: Socket, instance: ChessInstance, events: BoardEvents) {
        this.socket = socket
        this.instance = instance
        this.events = events
    }

    // --------------------------------------
    //               Network
    // --------------------------------------

    private forceResync() {
        this._socket.emit("chess::resync", (fen: string) => {
            this.instance.load(fen)
            console.log("Синхронизация успешна!")
        })
    }

    private handshakeHandler(fen: string, id: number) {
        this.instance.load(fen)
        this.events.emit("board_connection")
    }

    private methodCallHadlerMapper = (method: string, args: any[]) => this.methodCallHandler(method, args);
    private handshakeHadlerMapper = (fen: string, id: number) => this.handshakeHandler(fen, id)
    private connectHandlerMapper = () => this.connectHandler()

    protected addEventListeners(): void {
        this._socket.on("chess::method_call", this.methodCallHadlerMapper)
        this._socket.on("chess_handshake", this.handshakeHadlerMapper);
        this._socket.on("connect", this.connectHandlerMapper)
    }

    private removeEventListeners(): void {
        this._socket.off("chess::method_call", this.methodCallHadlerMapper)
        this._socket.off("chess_handshake", this.handshakeHadlerMapper);
        this._socket.off("connect", this.connectHandlerMapper)
    }

    private connectHandler() {
        // Resync in case of reconnect
        if(this.connected) {
            this.forceResync()
        }
    }

    protected methodCallHandler(method: string, args: any[]) {
        this.instance[method](...args)
        this.events.invoke()
    }

    public remoteMethodCall(method: string, args: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this.socket.emit("chess::method_call", method, args, (success: boolean) => {
                if(success) {
                    resolve(this.instance[method](...args))
                    this.events.invoke()
                }
                else {
                    reject("Not allowed")
                }
            })
        })
    }
}

export default RPCBoard