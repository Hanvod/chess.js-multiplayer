import { Socket } from "socket.io-client";
import ObservableBoard from "./observableBoard";

class RPCBoard extends ObservableBoard  {
    protected _socket: Socket = null;
    
    private _connectedID: number = null;
    public get connectedID(): number {
        return this._connectedID;
    }
    
    public get socket(): Socket {
        return this._socket;
    }

    public set socket(value: Socket) {
        this.removeEventListeners()
        this._socket = value
        this.addEventListeners()
    }
    
    constructor(socket: Socket) {
        super()
        this.socket = socket
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
        this._connectedID = id
        this.emit("board_connection")
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
        if(this.connectedID !== null) {
            this.forceResync()
        }
    }

    protected methodCallHandler(method: string, args: any[]) {
        this.instance[method](...args)
        this.invokeBoardEvents()
    }

    protected remoteMethodCall(method: string, args: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this.socket.emit("chess::method_call", method, args, (success: boolean) => {
                if(success) {
                    resolve(this.instance[method](...args))
                    this.invokeBoardEvents()
                }
                else {
                    reject("Not allowed")
                }
            })
        })
    }
}

export default RPCBoard