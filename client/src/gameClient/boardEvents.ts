import { BoardEvent, BoardEventHandler, IBoardEvents, INetworkChessboard } from "./interfaces"
import NetworkChessboard from "./index"
import { ChessInstance } from "chess.js"

class BoardEvents implements IBoardEvents {
    // Controlled chess.js board instance
    private instance: ChessInstance

    private networkBoard: NetworkChessboard

    constructor(board: NetworkChessboard, chessJSInstance: ChessInstance) {
        this.networkBoard = board
        this.instance = chessJSInstance
    }
    
    // --------------------------------------
    //         Async events
    // --------------------------------------

    public async waitForTurn(turn: "black" | "white"): Promise<void> {
        return new Promise((resolve, reject) => {
            if(this.instance.turn() === turn[0]) {
                resolve()
            }
            else {
                if(this.instance.game_over()) {
                    reject()
                }
                else {
                    const handler = (board) => {
                        this.off("board_update", handler)
                        resolve()
                    }
                    this.on("board_update", handler)
                }
            }
        })
    }

    public async waitForConnection(timeout?: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeoutHandle = timeout && setTimeout(reject, timeout)

            if(this.networkBoard.connected) {
                resolve()
                clearTimeout(timeoutHandle)
            }
            else {
                const handler = () => {
                    this.networkBoard.events.off("board_connection", handler)
                    resolve()
                    clearTimeout(timeoutHandle)
                }
            }
        })
    }

    // --------------------------------------
    //         Event emitter
    // --------------------------------------

    private eventHandlers = new Map<BoardEvent, BoardEventHandler[]>() 

    public on(event: BoardEvent, handler: BoardEventHandler) {
        if(this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).push(handler)
        }
        else {
            this.eventHandlers.set(event, [ handler ])
        }
    }

    public off(event: BoardEvent, handler: BoardEventHandler) {
        const newList = this.eventHandlers.get(event).filter(handler_ =>  handler_ !== handler)
        this.eventHandlers.set(event, newList)
    }

    public emit(event: BoardEvent, ...args: any[]): void {
        // this is ugly af
        this.eventHandlers.get(event)?.forEach(handler => handler(this.networkBoard, ...args))
    }

    // --------------------------------------
    //          Board events control
    // --------------------------------------

    private previousPGN = null
    private previousTurn = null

    public invoke() {
        if(this.previousPGN !== this.instance.pgn()) {
            this.emit("board_update")
            this.previousPGN = this.instance.pgn()
        }
        
        if(this.instance.game_over()) {
            return this.emit("game_over")
        }

        if(this.instance.turn() !== this.previousTurn) {
            if(this.instance.turn() === "w") {
                this.emit("white_turn")
            }
            else {
                this.emit("black_turn")
            }
            
            this.previousTurn = this.instance.turn()
        }
    }
}

export default BoardEvents