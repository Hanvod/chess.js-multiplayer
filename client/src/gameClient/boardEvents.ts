import { BoardEvent, BoardEventHandler, IBoardEvents, INetworkChessboard } from "./interfaces"
import NetworkChessboard from "./index"

class BoardEvents implements IBoardEvents {
    // Controlled chess.js board instance
    private get instance() { 
        return this.networkBoard.instance 
    } 

    private networkBoard: NetworkChessboard

    constructor(board: NetworkChessboard) {
        this.networkBoard = board
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
        }
    }
}

export default BoardEvents