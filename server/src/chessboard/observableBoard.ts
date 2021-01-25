import ChessInstanceWrapper from "./chessWrapperBase";
import { BoardEvent, BoardEventHandler } from "./interfaces"

class ObservableBoard extends ChessInstanceWrapper {
    // --------------------------------------
    //             Events 
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

    protected emit(event: BoardEvent, ...args: any[]): void {
        this.eventHandlers.get(event)?.forEach(handler => handler(this, ...args))
    }

    // --------------------------------------
    //          Board events control
    // --------------------------------------

    private previousPGN = this.pgn();
    private previousTurn = this.turn()

    protected invokeBoardEvents() {
        if(this.previousPGN !== this.pgn()) {
            this.emit("board_update")
            this.previousPGN = this.pgn()
        }
        
        if(this.game_over()) {
            return this.emit("game_over")
        }

        if(this.turn() !== this.previousTurn) {
            if(this.turn() === "w") {
                this.emit("white_turn")
            }
            else {
                this.emit("black_turn")
            }
        }
    }
}

export default ObservableBoard