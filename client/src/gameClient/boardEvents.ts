import { ChessInstance } from "chess.js";
import ChessInstanceWrapper from "./chessWrapperBase";
import GameClientBase from "./gameClientBase";
import { BoardEvent, BoardEventHandler, IBoardEvents, INetworkChessboard } from "./interfaces"


class BoardEvents implements IBoardEvents {
    // --------------------------------------
    //         Event emitter
    // --------------------------------------
    private instance: ChessInstance;

    constructor(instance: ChessInstance) {
        this.instance = instance
    }

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
        this.eventHandlers.get(event)?.forEach(handler => handler(this as unknown as INetworkChessboard, ...args))
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